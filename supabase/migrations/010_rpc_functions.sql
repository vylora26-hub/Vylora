-- ============================================================
-- MIGRACIÓN 010 — RPC Functions (Stored Procedures)
-- Expuestos al cliente con permisos mínimos necesarios.
-- ============================================================

-- ============================================================
-- FUNCIÓN: get_room_with_member_count
-- Devuelve sala con conteo de miembros (evita N+1 en listado)
-- ============================================================
create or replace function public.get_rooms(
  p_category_id text default null,
  p_search      text default null,
  p_featured    boolean default null,
  p_limit       integer default 20,
  p_offset      integer default 0
)
returns table (
  id           uuid,
  name         text,
  slug         text,
  description  text,
  cover_url    text,
  category_id  text,
  type         public.room_type,
  is_featured  boolean,
  is_verified  boolean,
  member_count bigint,
  created_at   timestamptz
)
language sql
security definer
stable
as $$
  select
    r.id, r.name, r.slug, r.description, r.cover_url,
    r.category_id, r.type, r.is_featured, r.is_verified,
    count(rm.user_id) as member_count,
    r.created_at
  from public.rooms r
  left join public.room_members rm on rm.room_id = r.id
  where r.is_archived = false
    and (p_category_id is null or r.category_id = p_category_id)
    and (p_featured is null or r.is_featured = p_featured)
    and (
      p_search is null
      or to_tsvector('spanish', coalesce(r.name,'') || ' ' || coalesce(r.description,''))
         @@ plainto_tsquery('spanish', p_search)
    )
  group by r.id
  order by r.is_featured desc, member_count desc, r.created_at desc
  limit p_limit offset p_offset;
$$;

-- ============================================================
-- FUNCIÓN: get_messages_paginated
-- Paginación por cursor para scroll infinito eficiente
-- ============================================================
create or replace function public.get_messages_paginated(
  p_room_id  uuid,
  p_cursor   timestamptz default null,
  p_limit    integer default 50
)
returns table (
  id          uuid,
  room_id     uuid,
  sender_id   uuid,
  content     text,
  type        public.message_type,
  reply_to_id uuid,
  is_edited   boolean,
  is_deleted  boolean,
  reactions   jsonb,
  created_at  timestamptz,
  updated_at  timestamptz,
  -- Sender info (evita join extra en el cliente)
  sender_username     text,
  sender_display_name text,
  sender_avatar_url   text,
  sender_role         public.user_role
)
language sql
security definer
stable
as $$
  select
    m.id, m.room_id, m.sender_id, m.content, m.type,
    m.reply_to_id, m.is_edited, m.is_deleted, m.reactions,
    m.created_at, m.updated_at,
    u.username, u.display_name, u.avatar_url, u.role
  from public.messages m
  join public.users u on u.id = m.sender_id
  where m.room_id = p_room_id
    and (p_cursor is null or m.created_at < p_cursor)
  order by m.created_at desc
  limit p_limit;
$$;

-- ============================================================
-- FUNCIÓN: get_unread_dm_count
-- Contador de mensajes no leídos por conversación (badge)
-- ============================================================
create or replace function public.get_unread_dm_count(
  p_user_id       uuid,
  p_conversation_id uuid
)
returns bigint
language sql
security definer
stable
as $$
  select count(*)
  from public.direct_messages dm
  where dm.conversation_id = p_conversation_id
    and dm.sender_id != p_user_id
    and dm.read_at is null
    and dm.is_deleted = false;
$$;

-- ============================================================
-- FUNCIÓN: mark_dm_messages_read
-- Marca como leídos todos los mensajes de la otra persona
-- ============================================================
create or replace function public.mark_dm_read(
  p_conversation_id uuid,
  p_reader_id       uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.direct_messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id != p_reader_id
    and read_at is null;
end;
$$;

-- ============================================================
-- FUNCIÓN: search_messages
-- Búsqueda full-text en mensajes de una sala
-- ============================================================
create or replace function public.search_messages(
  p_room_id uuid,
  p_query   text,
  p_limit   integer default 20
)
returns table (
  id         uuid,
  content    text,
  sender_id  uuid,
  created_at timestamptz,
  sender_username     text,
  sender_display_name text,
  sender_avatar_url   text
)
language sql
security definer
stable
as $$
  select
    m.id, m.content, m.sender_id, m.created_at,
    u.username, u.display_name, u.avatar_url
  from public.messages m
  join public.users u on u.id = m.sender_id
  where m.room_id = p_room_id
    and m.is_deleted = false
    and m.content ilike '%' || p_query || '%'
  order by m.created_at desc
  limit p_limit;
$$;

-- ============================================================
-- FUNCIÓN: update_last_seen
-- ============================================================
create or replace function public.update_last_seen(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set last_seen_at = now()
  where id = p_user_id;
end;
$$;

-- ============================================================
-- FUNCIÓN: get_admin_stats
-- Dashboard de estadísticas para panel de administración
-- ============================================================
create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stats jsonb;
begin
  -- Verificar que quien llama es admin
  if not exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'total_users',       (select count(*) from public.users),
    'active_users_24h',  (select count(*) from public.users where last_seen_at > now() - interval '24 hours'),
    'total_rooms',       (select count(*) from public.rooms where is_archived = false),
    'active_rooms_24h',  (select count(distinct room_id) from public.messages where created_at > now() - interval '24 hours'),
    'total_messages_24h',(select count(*) from public.messages where created_at > now() - interval '24 hours'),
    'pending_reports',   (select count(*) from public.reports where status = 'pending'),
    'active_bans',       (select count(*) from public.bans where expires_at is null or expires_at > now())
  ) into v_stats;

  return v_stats;
end;
$$;

-- ============================================================
-- GRANTS - Minimos privilegios necesarios
-- ============================================================
grant execute on function public.get_rooms                  to authenticated, anon;
grant execute on function public.get_messages_paginated     to authenticated;
grant execute on function public.get_unread_dm_count        to authenticated;
grant execute on function public.mark_dm_read               to authenticated;
grant execute on function public.search_messages            to authenticated;
grant execute on function public.update_last_seen           to authenticated;
grant execute on function public.get_admin_stats            to authenticated;
grant execute on function public.mark_all_notifications_read to authenticated;
grant execute on function public.are_blocked                to authenticated;
grant execute on function public.is_user_banned             to authenticated;
grant execute on function public.get_or_create_conversation to authenticated;
grant execute on function public.check_rate_limit           to authenticated;
grant execute on function public.create_notification        to authenticated;
