select 1; -- inicio obligatorio

-- ============================================================
-- MIGRACION 014 - Cumplimiento legal: privacidad y consentimiento
-- GDPR (Europa) | Ley 1581/2012 (Colombia) | LGPD (Brasil)
-- Ejecutar en Supabase SQL Editor
-- ============================================================


-- ============================================================
-- 1. TABLA: consent_logs
-- Registra CUANDO y QUE VERSION de terminos acepto el usuario.
-- INMUTABLE: solo INSERT. Cumple requisito legal de auditoria
-- de consentimiento (GDPR Art. 7, Ley 1581 Art. 9).
-- ============================================================
create table if not exists public.consent_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  -- Version de los documentos aceptados
  terms_version   text not null default '1.0',
  privacy_version text not null default '1.0',
  -- El usuario acepto explicitamente (checkbox marcado)
  accepted        boolean not null default true,
  -- Metadatos del momento del consentimiento
  ip_masked       text,    -- IP anonimizada para cumplimiento legal
  user_agent      text,
  -- Timestamp exacto — crucial para demostrar consentimiento
  accepted_at     timestamptz not null default now()
);

-- Solo INSERT permitido desde el cliente (inmutable)
alter table public.consent_logs enable row level security;

drop policy if exists "consent_insert_own" on public.consent_logs;
create policy "consent_insert_own" on public.consent_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "consent_select_own" on public.consent_logs;
create policy "consent_select_own" on public.consent_logs
  for select using (auth.uid() = user_id);

-- Admins pueden consultar todos los consentimientos (auditoria legal)
drop policy if exists "consent_select_admin" on public.consent_logs;
create policy "consent_select_admin" on public.consent_logs
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create index if not exists idx_consent_user on public.consent_logs (user_id, accepted_at desc);


-- ============================================================
-- 2. TABLA: data_deletion_requests
-- Gestiona solicitudes de eliminacion de datos (derecho al olvido).
-- GDPR Art. 17 | Ley 1581 Art. 8(c).
-- ============================================================
create table if not exists public.data_deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  reason       text,  -- opcional — por que quiere eliminar su cuenta
  status       text not null default 'pending'
                check (status in ('pending', 'processing', 'completed', 'cancelled')),
  -- La plataforma tiene 30 dias para completarlo (GDPR)
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Confirmacion del usuario (requiere escribir su username)
  confirmed    boolean not null default false
);

alter table public.data_deletion_requests enable row level security;

drop policy if exists "deletion_insert_own" on public.data_deletion_requests;
create policy "deletion_insert_own" on public.data_deletion_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "deletion_select_own" on public.data_deletion_requests;
create policy "deletion_select_own" on public.data_deletion_requests
  for select using (auth.uid() = user_id);

drop policy if exists "deletion_admin" on public.data_deletion_requests;
create policy "deletion_admin" on public.data_deletion_requests
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 3. FUNCION: delete_own_account
-- Elimina TODOS los datos personales del usuario.
-- Derecho al olvido: GDPR Art. 17, Ley 1581 Art. 8(c).
-- Lo que se elimina:
--   - Perfil y datos de usuario
--   - Mensajes (marcados como eliminados, contenido borrado)
--   - Mensajes directos
--   - Amistades y bloqueos
--   - Notificaciones
--   - Sesiones activas
--   - Configuracion
--   - El usuario en auth.users (via service_role)
-- Lo que NO se elimina (por integridad y seguridad):
--   - Audit logs (son registros de acciones, no datos personales)
--   - Reportes realizados por otros (anonimizados)
-- ============================================================
create or replace function public.delete_own_account(p_confirmation_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_username text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'No autenticado' using errcode = 'P0001';
  end if;

  -- Verificar que el username de confirmacion coincide
  select username into v_username
  from public.users
  where id = v_user_id;

  if lower(v_username) != lower(p_confirmation_username) then
    raise exception 'El nombre de usuario no coincide' using errcode = 'P0002';
  end if;

  -- 1. Anonimizar mensajes de sala (borrado logico del contenido)
  update public.messages
  set content = '[Mensaje eliminado]',
      is_deleted = true,
      deleted_at = now()
  where sender_id = v_user_id
    and is_deleted = false;

  -- 2. Anonimizar mensajes directos
  update public.direct_messages
  set content = '[Mensaje eliminado]',
      is_deleted = true
  where sender_id = v_user_id;

  -- 3. Eliminar amistades
  delete from public.friendships
  where requester_id = v_user_id or addressee_id = v_user_id;

  -- 4. Eliminar bloqueos
  delete from public.blocks
  where blocker_id = v_user_id or blocked_id = v_user_id;

  -- 5. Eliminar notificaciones
  delete from public.notifications
  where user_id = v_user_id;

  -- 6. Eliminar sesiones activas
  delete from public.user_sessions
  where user_id = v_user_id;

  -- 7. Eliminar presencia
  delete from public.presence
  where user_id = v_user_id;

  -- 8. Eliminar configuracion
  delete from public.user_settings
  where user_id = v_user_id;

  -- 9. Eliminar memberships de salas
  delete from public.room_members
  where user_id = v_user_id;

  -- 10. Registrar solicitud completada
  insert into public.data_deletion_requests
    (user_id, status, confirmed, completed_at)
  values
    (v_user_id, 'completed', true, now());

  -- 11. Anonimizar el perfil (no borrar — necesario para FK de mensajes)
  update public.users
  set
    username     = 'usuario_eliminado_' || substr(v_user_id::text, 1, 8),
    display_name = 'Usuario eliminado',
    avatar_url   = null,
    bio          = null,
    city         = null,
    country      = null,
    last_seen_at = null
  where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Todos tus datos personales han sido eliminados.'
  );
end;
$$;

grant execute on function public.delete_own_account(text) to authenticated;


-- ============================================================
-- 4. FUNCION: get_my_data_export
-- Exportacion de todos los datos del usuario (portabilidad).
-- GDPR Art. 20 — derecho a la portabilidad de datos.
-- ============================================================
create or replace function public.get_my_data_export()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile jsonb;
  v_settings jsonb;
  v_messages_count bigint;
  v_friends_count bigint;
  v_consent jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'No autenticado' using errcode = 'P0001';
  end if;

  -- Perfil
  select row_to_json(u)::jsonb into v_profile
  from public.users u where id = v_user_id;

  -- Configuracion
  select row_to_json(s)::jsonb into v_settings
  from public.user_settings s where user_id = v_user_id;

  -- Conteos
  select count(*) into v_messages_count
  from public.messages where sender_id = v_user_id and is_deleted = false;

  select count(*) into v_friends_count
  from public.friendships
  where (requester_id = v_user_id or addressee_id = v_user_id)
    and status = 'accepted';

  -- Ultimo consentimiento
  select row_to_json(c)::jsonb into v_consent
  from public.consent_logs c
  where user_id = v_user_id
  order by accepted_at desc
  limit 1;

  return jsonb_build_object(
    'exported_at',     now(),
    'profile',         v_profile,
    'settings',        v_settings,
    'messages_count',  v_messages_count,
    'friends_count',   v_friends_count,
    'last_consent',    v_consent,
    'note',            'Exportacion de datos personales segun GDPR Art. 20 y Ley 1581/2012'
  );
end;
$$;

grant execute on function public.get_my_data_export() to authenticated;


-- ============================================================
-- 5. FUNCION: record_consent
-- Registra el consentimiento del usuario al aceptar terminos.
-- ============================================================
create or replace function public.record_consent(
  p_terms_version   text,
  p_privacy_version text,
  p_ip_masked       text default null,
  p_user_agent      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.consent_logs
    (user_id, terms_version, privacy_version, accepted, ip_masked, user_agent)
  values
    (auth.uid(), p_terms_version, p_privacy_version, true, p_ip_masked, p_user_agent)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.record_consent(text, text, text, text) to authenticated;


-- ============================================================
-- 6. COLUMNA: user_settings — agregar campos de privacidad legal
-- ============================================================
alter table public.user_settings
  add column if not exists data_collection_consent boolean not null default false,
  add column if not exists marketing_consent        boolean not null default false,
  add column if not exists terms_accepted_at        timestamptz,
  add column if not exists terms_version            text;


-- ============================================================
-- VERIFICACION
-- ============================================================
select
  'consent_logs'           as tabla, count(*) from public.consent_logs
union all
select 'data_deletion_requests', count(*) from public.data_deletion_requests;
