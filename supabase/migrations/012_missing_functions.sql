-- ============================================================
-- 012_missing_functions.sql
-- MIGRACION 012 - Funciones faltantes para las nuevas features
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ============================================================


-- ============================================================
-- 1. verify_room_password
-- Usada en rooms.ts -> joinRoom() para salas password_protected.
-- Verifica la contraseña con pgcrypto (misma función que se usó
-- para hashearla al crear la sala).
-- ============================================================
create or replace function public.verify_room_password(
  p_room_id  uuid,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash
  from public.rooms
  where id = p_room_id;

  if v_hash is null then
    return true; -- La sala no tiene contraseña (es pública o privada)
  end if;

  -- Comparar con crypt de pgcrypto
  return v_hash = crypt(p_password, v_hash);
end;
$$;

grant execute on function public.verify_room_password(uuid, text) to authenticated, anon;


-- ============================================================
-- 2. get_email_by_user_id
-- Usada en auth.ts -> loginWithUsername() para obtener el email
-- interno de un usuario a partir de su username.
-- Requiere acceso a auth.users (security definer).
-- ============================================================
create or replace function public.get_email_by_user_id(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  -- Verificar que el usuario existe y no está baneado
  if not exists (
    select 1 from public.users
    where id = p_user_id and is_banned = false
  ) then
    return null;
  end if;

  -- Obtener email desde auth.users
  select email into v_email
  from auth.users
  where id = p_user_id;

  return v_email;
end;
$$;

grant execute on function public.get_email_by_user_id(uuid) to authenticated, anon;


-- ============================================================
-- 3. hash_room_password
-- Necesaria para crear salas con contraseña de forma segura.
-- El frontend envía la contraseña en texto plano al INSERT;
-- este trigger la hashea automáticamente con bcrypt.
-- ============================================================
create or replace function public.hash_room_password_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo hashear si se proporcionó contraseña y el tipo es password_protected
  if new.type = 'password_protected' and new.password_hash is not null
     and length(new.password_hash) < 60 then  -- 60 chars = hash bcrypt
    new.password_hash = crypt(new.password_hash, gen_salt('bf'));
  end if;
  return new;
end;
$$;

-- Trigger en INSERT y UPDATE de rooms
drop trigger if exists hash_room_password on public.rooms;
create trigger hash_room_password
  before insert or update on public.rooms
  for each row execute procedure public.hash_room_password_fn();


-- ============================================================
-- 4. Trigger: auto-update updated_at en friendships
-- El frontend hace UPDATE de status/updated_at manualmente,
-- pero este trigger garantiza que updated_at siempre se actualiza.
-- ============================================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists friendships_updated_at on public.friendships;
create trigger friendships_updated_at
  before update on public.friendships
  for each row execute procedure public.update_updated_at();


-- ============================================================
-- 5. get_unread_dm_count por usuario (todas las conversaciones)
-- Usada en MainLayout para el badge total de DMs no leídos.
-- Versión más eficiente que contar en el cliente.
-- ============================================================
create or replace function public.get_total_unread_dms(p_user_id uuid)
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select count(*)
  from public.direct_messages dm
  join public.direct_conversations dc on dc.id = dm.conversation_id
  where (dc.user1_id = p_user_id or dc.user2_id = p_user_id)
    and dm.sender_id != p_user_id
    and dm.read_at is null
    and dm.is_deleted = false;
$$;

grant execute on function public.get_total_unread_dms(uuid) to authenticated;


-- ============================================================
-- 6. Política RLS faltante: permitir UPDATE de password_hash
-- en rooms solo al owner (para cambiar contraseña de sala)
-- ============================================================
drop policy if exists "rooms_update_password_owner" on public.rooms;
create policy "rooms_update_password_owner" on public.rooms
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());


-- ============================================================
-- 7. Índice faltante en direct_messages para el badge de no leídos
-- Necesario para que get_total_unread_dms sea eficiente
-- ============================================================
create index if not exists idx_dm_messages_unread_global
  on public.direct_messages (sender_id, read_at)
  where read_at is null and is_deleted = false;


-- ============================================================
-- VERIFICACIÓN: Lista las funciones creadas
-- ============================================================
select
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'verify_room_password',
    'get_email_by_user_id',
    'hash_room_password_fn',
    'update_updated_at',
    'get_total_unread_dms'
  )
order by p.proname;
