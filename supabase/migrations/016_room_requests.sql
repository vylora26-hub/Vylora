select 1;

-- ============================================================
-- MIGRACION 016 - Solicitudes de salas + crear salas como admin
-- ============================================================

-- TABLA: room_requests
-- Los usuarios piden al admin que cree una sala para ellos.
create table if not exists public.room_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  room_name    text not null,
  description  text,
  category_id  text references public.room_categories(id) on delete set null,
  reason       text,
  status       text not null default 'pending'
                 check (status in ('pending','approved','rejected')),
  reviewed_by  uuid references public.users(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),

  constraint room_name_length check (char_length(room_name) between 3 and 50)
);

alter table public.room_requests enable row level security;

-- El usuario puede ver y crear sus propias solicitudes
drop policy if exists "room_req_insert_own" on public.room_requests;
create policy "room_req_insert_own" on public.room_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "room_req_select_own" on public.room_requests;
create policy "room_req_select_own" on public.room_requests
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin','moderator')
    )
  );

-- Solo admins pueden actualizar (aprobar/rechazar)
drop policy if exists "room_req_update_admin" on public.room_requests;
create policy "room_req_update_admin" on public.room_requests
  for update using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin','moderator')
    )
  );

create index if not exists idx_room_requests_status
  on public.room_requests (status, created_at desc);

create index if not exists idx_room_requests_user
  on public.room_requests (user_id);


-- ============================================================
-- FUNCIÓN: create_room_as_admin
-- Crea una sala SIN pasar por RLS. Solo admin puede llamarla.
-- Resuelve el problema de recursión infinita en RLS de rooms.
-- ============================================================
create or replace function public.create_room_as_admin(
  p_name        text,
  p_slug        text,
  p_description text default null,
  p_category_id text default 'general',
  p_type        public.room_type default 'public',
  p_is_featured boolean default false,
  p_max_members integer default 500
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id  uuid;
  v_actor_id uuid;
  v_final_slug text;
  v_attempt  int := 0;
begin
  v_actor_id := auth.uid();

  -- Verificar que quien llama es admin o moderador
  if not exists (
    select 1 from public.users
    where id = v_actor_id and role in ('admin', 'moderator')
  ) then
    raise exception 'Solo administradores pueden crear salas.' using errcode = 'P0001';
  end if;

  -- Generar slug único
  v_final_slug := lower(regexp_replace(p_slug, '[^a-zA-Z0-9]+', '-', 'g'));
  v_final_slug := trim(both '-' from v_final_slug);

  loop
    exit when not exists (select 1 from public.rooms where slug = v_final_slug);
    v_attempt := v_attempt + 1;
    v_final_slug := trim(both '-' from lower(regexp_replace(p_slug, '[^a-zA-Z0-9]+', '-', 'g')))
                    || '-' || v_attempt;
  end loop;

  -- Insertar sala (security definer saltea RLS)
  insert into public.rooms (
    name, slug, description, owner_id,
    category_id, type, is_featured, is_verified, max_members
  ) values (
    p_name, v_final_slug, p_description, v_actor_id,
    p_category_id, p_type, p_is_featured, true, p_max_members
  )
  returning id into v_room_id;

  return v_room_id;
end;
$$;

grant execute on function public.create_room_as_admin(text,text,text,text,public.room_type,boolean,integer)
  to authenticated;


-- ============================================================
-- FUNCIÓN: request_room
-- Cualquier usuario autenticado puede pedir que se cree una sala.
-- Notifica automáticamente a todos los admins.
-- ============================================================
create or replace function public.request_room(
  p_room_name   text,
  p_description text default null,
  p_category_id text default 'general',
  p_reason      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_user_id    uuid;
  v_username   text;
  v_admin      record;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Debes iniciar sesión para solicitar una sala.' using errcode = 'P0001';
  end if;

  select username into v_username
  from public.users where id = v_user_id;

  -- Crear la solicitud
  insert into public.room_requests
    (user_id, room_name, description, category_id, reason)
  values
    (v_user_id, p_room_name, p_description, p_category_id, p_reason)
  returning id into v_request_id;

  -- Notificar a todos los admins
  for v_admin in
    select id from public.users where role = 'admin'
  loop
    perform public.create_notification(
      v_admin.id,
      'system',
      'Nueva solicitud de sala',
      '@' || v_username || ' solicita crear la sala "' || p_room_name || '".',
      jsonb_build_object(
        'request_id', v_request_id,
        'room_name',  p_room_name,
        'user_id',    v_user_id,
        'type',       'room_request'
      )
    );
  end loop;

  return v_request_id;
end;
$$;

grant execute on function public.request_room(text,text,text,text) to authenticated;


-- ============================================================
-- FUNCIÓN: approve_room_request
-- Admin aprueba la solicitud y crea la sala automáticamente.
-- ============================================================
create or replace function public.approve_room_request(
  p_request_id  uuid,
  p_is_featured boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id    uuid;
  v_request    public.room_requests;
  v_actor_id   uuid;
  v_slug       text;
begin
  v_actor_id := auth.uid();

  if not exists (
    select 1 from public.users
    where id = v_actor_id and role in ('admin', 'moderator')
  ) then
    raise exception 'No autorizado.' using errcode = 'P0001';
  end if;

  select * into v_request
  from public.room_requests
  where id = p_request_id and status = 'pending';

  if not found then
    raise exception 'Solicitud no encontrada o ya procesada.' using errcode = 'P0002';
  end if;

  -- Generar slug del nombre
  v_slug := lower(regexp_replace(v_request.room_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);

  -- Crear la sala
  v_room_id := public.create_room_as_admin(
    v_request.room_name,
    v_slug,
    v_request.description,
    coalesce(v_request.category_id, 'general'),
    'public',
    p_is_featured,
    500
  );

  -- Marcar solicitud como aprobada
  update public.room_requests
  set status = 'approved', reviewed_by = v_actor_id, reviewed_at = now()
  where id = p_request_id;

  -- Notificar al usuario que pidió la sala
  perform public.create_notification(
    v_request.user_id,
    'system',
    '¡Tu sala fue creada!',
    'La sala "' || v_request.room_name || '" que solicitaste ya está disponible.',
    jsonb_build_object('room_id', v_room_id, 'type', 'room_approved')
  );

  return v_room_id;
end;
$$;

grant execute on function public.approve_room_request(uuid, boolean) to authenticated;


-- ============================================================
-- FUNCIÓN: reject_room_request
-- ============================================================
create or replace function public.reject_room_request(
  p_request_id uuid,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request  public.room_requests;
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();

  if not exists (
    select 1 from public.users
    where id = v_actor_id and role in ('admin', 'moderator')
  ) then
    raise exception 'No autorizado.' using errcode = 'P0001';
  end if;

  select * into v_request
  from public.room_requests
  where id = p_request_id and status = 'pending';

  if not found then
    raise exception 'Solicitud no encontrada.' using errcode = 'P0002';
  end if;

  update public.room_requests
  set status = 'rejected', reviewed_by = v_actor_id, reviewed_at = now()
  where id = p_request_id;

  -- Notificar al usuario
  perform public.create_notification(
    v_request.user_id,
    'system',
    'Solicitud de sala revisada',
    'Tu solicitud para la sala "' || v_request.room_name || '" no fue aprobada en este momento.' ||
    case when p_reason is not null then ' Motivo: ' || p_reason else '' end,
    jsonb_build_object('type', 'room_rejected')
  );
end;
$$;

grant execute on function public.reject_room_request(uuid, text) to authenticated;


-- ============================================================
-- VERIFICACION
-- ============================================================
select 'room_requests table' as item, count(*) as total from public.room_requests
union all
select 'rooms table', count(*) from public.rooms;
