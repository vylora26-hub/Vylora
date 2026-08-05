-- ============================================================
-- FIX SCRIPT - Ejecutar completo en Supabase SQL Editor
-- Repara todo lo que fallo desde la migracion 005 en adelante
-- Pega TODO este contenido de una sola vez y ejecuta
-- ============================================================

-- ============================================================
-- PASO 1: TABLAS SOCIALES (005)
-- ============================================================

create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status       public.friendship_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint unique_friendship  unique (requester_id, addressee_id),
  constraint no_self_friendship check (requester_id != addressee_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id != blocked_id)
);

create table if not exists public.presence (
  user_id         uuid primary key references public.users(id) on delete cascade,
  status          public.online_status not null default 'offline',
  last_seen_at    timestamptz not null default now(),
  current_room_id uuid references public.rooms(id) on delete set null
);

-- ============================================================
-- PASO 2: FUNCION are_blocked (requerida por 009 y 010)
-- ============================================================

create or replace function public.are_blocked(p_user1 uuid, p_user2 uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_user1 and blocked_id = p_user2)
       or (blocker_id = p_user2 and blocked_id = p_user1)
  );
$$;

grant execute on function public.are_blocked(uuid, uuid) to authenticated, anon;

-- ============================================================
-- PASO 3: INDICES (008)
-- ============================================================

create index if not exists idx_users_username on public.users (username);
create index if not exists idx_users_role     on public.users (role);
create index if not exists idx_users_banned   on public.users (is_banned) where is_banned = true;

create index if not exists idx_rooms_slug     on public.rooms (slug);
create index if not exists idx_rooms_category on public.rooms (category_id);
create index if not exists idx_rooms_owner    on public.rooms (owner_id);
create index if not exists idx_rooms_featured on public.rooms (is_featured) where is_featured = true;
create index if not exists idx_rooms_search   on public.rooms using gin(
  to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
);

create index if not exists idx_room_members_user on public.room_members (user_id);
create index if not exists idx_room_members_room on public.room_members (room_id);

create index if not exists idx_messages_room_created on public.messages (room_id, created_at desc);
create index if not exists idx_messages_room_active  on public.messages (room_id, created_at desc) where is_deleted = false;
create index if not exists idx_messages_sender       on public.messages (sender_id);

create index if not exists idx_dm_conversations_user1    on public.direct_conversations (user1_id);
create index if not exists idx_dm_conversations_user2    on public.direct_conversations (user2_id);
create index if not exists idx_dm_conversations_last_msg on public.direct_conversations (last_message_at desc nulls last);

create index if not exists idx_dm_messages_conv_created on public.direct_messages (conversation_id, created_at desc);
create index if not exists idx_dm_messages_unread       on public.direct_messages (conversation_id, sender_id) where read_at is null;

create index if not exists idx_friendships_addressee on public.friendships (addressee_id, status);
create index if not exists idx_friendships_requester on public.friendships (requester_id, status);

create index if not exists idx_notifications_unread on public.notifications (user_id, created_at desc) where is_read = false;
create index if not exists idx_reports_status       on public.reports (status, created_at desc);
create index if not exists idx_bans_user_id on public.bans (user_id);
create index if not exists idx_bans_expires on public.bans (expires_at);
create index if not exists idx_audit_actor          on public.audit_logs (actor_id, created_at desc);
create index if not exists idx_audit_action         on public.audit_logs (action, created_at desc);
create index if not exists idx_rate_limits_window   on public.rate_limits (window_start);
create index if not exists idx_presence_room        on public.presence (current_room_id) where status = 'online';

-- ============================================================
-- PASO 4: RLS POLICIES (009)
-- ============================================================

alter table public.users                enable row level security;
alter table public.sessions             enable row level security;
alter table public.user_settings        enable row level security;
alter table public.rooms                enable row level security;
alter table public.room_members         enable row level security;
alter table public.messages             enable row level security;
alter table public.attachments          enable row level security;
alter table public.direct_conversations enable row level security;
alter table public.direct_messages      enable row level security;
alter table public.friendships          enable row level security;
alter table public.blocks               enable row level security;
alter table public.presence             enable row level security;
alter table public.notifications        enable row level security;
alter table public.reports              enable row level security;
alter table public.bans                 enable row level security;
alter table public.audit_logs           enable row level security;
alter table public.rate_limits          enable row level security;
alter table public.room_categories      enable row level security;

-- users
drop policy if exists "users_select_public" on public.users;
create policy "users_select_public" on public.users for select using (true);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- sessions
drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions for select using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions for insert with check (auth.uid() = user_id);

-- user_settings
drop policy if exists "settings_select_own" on public.user_settings;
create policy "settings_select_own" on public.user_settings for select using (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- room_categories
drop policy if exists "categories_select_all" on public.room_categories;
create policy "categories_select_all" on public.room_categories for select using (true);

-- rooms
drop policy if exists "rooms_select_public" on public.rooms;
create policy "rooms_select_public" on public.rooms for select using (
  type = 'public'
  or owner_id = auth.uid()
  or exists (select 1 from public.room_members rm where rm.room_id = id and rm.user_id = auth.uid())
);

drop policy if exists "rooms_insert_authenticated" on public.rooms;
create policy "rooms_insert_authenticated" on public.rooms for insert with check (
  auth.uid() is not null
  and auth.uid() = owner_id
  and not public.is_user_banned(auth.uid())
);

drop policy if exists "rooms_update_owner_or_mod" on public.rooms;
create policy "rooms_update_owner_or_mod" on public.rooms for update using (
  owner_id = auth.uid()
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('moderator','admin'))
);

drop policy if exists "rooms_delete_owner_or_admin" on public.rooms;
create policy "rooms_delete_owner_or_admin" on public.rooms for delete using (
  owner_id = auth.uid()
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- room_members
drop policy if exists "room_members_select" on public.room_members;
create policy "room_members_select" on public.room_members for select using (
  exists (
    select 1 from public.rooms r where r.id = room_id
    and (r.type = 'public' or r.owner_id = auth.uid() or user_id = auth.uid())
  )
);

drop policy if exists "room_members_insert_self" on public.room_members;
create policy "room_members_insert_self" on public.room_members for insert with check (
  auth.uid() = user_id and not public.is_user_banned(auth.uid())
);

drop policy if exists "room_members_delete_self_or_owner" on public.room_members;
create policy "room_members_delete_self_or_owner" on public.room_members for delete using (
  user_id = auth.uid()
  or exists (select 1 from public.rooms r where r.id = room_id and r.owner_id = auth.uid())
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('moderator','admin'))
);

-- messages
drop policy if exists "messages_select_room_member" on public.messages;
create policy "messages_select_room_member" on public.messages for select using (
  exists (select 1 from public.room_members rm where rm.room_id = messages.room_id and rm.user_id = auth.uid())
  or exists (select 1 from public.rooms r where r.id = room_id and r.type = 'public')
);

drop policy if exists "messages_insert_room_member" on public.messages;
create policy "messages_insert_room_member" on public.messages for insert with check (
  auth.uid() = sender_id
  and not public.is_user_banned(auth.uid())
  and exists (
    select 1 from public.room_members rm
    where rm.room_id = room_id and rm.user_id = auth.uid() and rm.is_muted = false
  )
);

drop policy if exists "messages_update_own_or_mod" on public.messages;
create policy "messages_update_own_or_mod" on public.messages for update using (
  sender_id = auth.uid()
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('moderator','admin'))
);

-- attachments
drop policy if exists "attachments_select_room_member" on public.attachments;
create policy "attachments_select_room_member" on public.attachments for select using (
  exists (
    select 1 from public.messages m
    join public.room_members rm on rm.room_id = m.room_id
    where m.id = attachments.message_id and rm.user_id = auth.uid()
  )
);

drop policy if exists "attachments_insert_own" on public.attachments;
create policy "attachments_insert_own" on public.attachments for insert with check (
  exists (select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid())
);

-- direct_conversations
drop policy if exists "dm_conv_select_participant" on public.direct_conversations;
create policy "dm_conv_select_participant" on public.direct_conversations for select using (
  user1_id = auth.uid() or user2_id = auth.uid()
);

drop policy if exists "dm_conv_insert_authenticated" on public.direct_conversations;
create policy "dm_conv_insert_authenticated" on public.direct_conversations for insert with check (
  (user1_id = auth.uid() or user2_id = auth.uid())
  and not public.are_blocked(user1_id, user2_id)
  and not public.is_user_banned(auth.uid())
);

-- direct_messages
drop policy if exists "dm_select_participant" on public.direct_messages;
create policy "dm_select_participant" on public.direct_messages for select using (
  exists (
    select 1 from public.direct_conversations dc
    where dc.id = conversation_id
    and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
  )
);

drop policy if exists "dm_insert_participant" on public.direct_messages;
create policy "dm_insert_participant" on public.direct_messages for insert with check (
  auth.uid() = sender_id
  and not public.is_user_banned(auth.uid())
  and exists (
    select 1 from public.direct_conversations dc
    where dc.id = conversation_id
    and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
  )
);

drop policy if exists "dm_update_own" on public.direct_messages;
create policy "dm_update_own" on public.direct_messages for update using (sender_id = auth.uid());

-- friendships
drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own" on public.friendships for select using (
  requester_id = auth.uid() or addressee_id = auth.uid()
);

drop policy if exists "friendships_insert_authenticated" on public.friendships;
create policy "friendships_insert_authenticated" on public.friendships for insert with check (
  requester_id = auth.uid()
  and not public.is_user_banned(auth.uid())
  and not public.are_blocked(requester_id, addressee_id)
);

drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee" on public.friendships for update using (addressee_id = auth.uid());

drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own" on public.friendships for delete using (
  requester_id = auth.uid() or addressee_id = auth.uid()
);

-- blocks
drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks for select using (blocker_id = auth.uid());

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own" on public.blocks for insert with check (blocker_id = auth.uid());

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own" on public.blocks for delete using (blocker_id = auth.uid());

-- presence
drop policy if exists "presence_select_all" on public.presence;
create policy "presence_select_all" on public.presence for select using (true);

drop policy if exists "presence_upsert_own" on public.presence;
create policy "presence_upsert_own" on public.presence
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated" on public.reports for insert with check (
  reporter_id = auth.uid() and not public.is_user_banned(auth.uid())
);

drop policy if exists "reports_select_own_or_mod" on public.reports;
create policy "reports_select_own_or_mod" on public.reports for select using (
  reporter_id = auth.uid()
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('moderator','admin'))
);

drop policy if exists "reports_update_mod_only" on public.reports;
create policy "reports_update_mod_only" on public.reports for update using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('moderator','admin'))
);

-- bans
drop policy if exists "bans_select_mod_or_self" on public.bans;
create policy "bans_select_mod_or_self" on public.bans for select using (
  user_id = auth.uid()
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('moderator','admin'))
);

-- audit_logs
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin" on public.audit_logs for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- ============================================================
-- PASO 5: RPC FUNCTIONS (010)
-- ============================================================

create or replace function public.get_rooms(
  p_category_id text default null,
  p_search      text default null,
  p_featured    boolean default null,
  p_limit       integer default 20,
  p_offset      integer default 0
)
returns table (
  id           uuid, name text, slug text, description text, cover_url text,
  category_id  text, type public.room_type, is_featured boolean, is_verified boolean,
  member_count bigint, created_at timestamptz
)
language sql security definer stable
as $$
  select r.id, r.name, r.slug, r.description, r.cover_url,
    r.category_id, r.type, r.is_featured, r.is_verified,
    count(rm.user_id) as member_count, r.created_at
  from public.rooms r
  left join public.room_members rm on rm.room_id = r.id
  where r.is_archived = false
    and (p_category_id is null or r.category_id = p_category_id)
    and (p_featured is null or r.is_featured = p_featured)
    and (p_search is null
      or to_tsvector('spanish', coalesce(r.name,'') || ' ' || coalesce(r.description,''))
         @@ plainto_tsquery('spanish', p_search))
  group by r.id
  order by r.is_featured desc, member_count desc, r.created_at desc
  limit p_limit offset p_offset;
$$;

create or replace function public.get_messages_paginated(
  p_room_id uuid,
  p_cursor  timestamptz default null,
  p_limit   integer default 50
)
returns table (
  id uuid, room_id uuid, sender_id uuid, content text, type public.message_type,
  reply_to_id uuid, is_edited boolean, is_deleted boolean, reactions jsonb,
  created_at timestamptz, updated_at timestamptz,
  sender_username text, sender_display_name text, sender_avatar_url text, sender_role public.user_role
)
language sql security definer stable
as $$
  select m.id, m.room_id, m.sender_id, m.content, m.type,
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

create or replace function public.get_unread_dm_count(p_user_id uuid, p_conversation_id uuid)
returns bigint language sql security definer stable as $$
  select count(*) from public.direct_messages dm
  where dm.conversation_id = p_conversation_id
    and dm.sender_id != p_user_id
    and dm.read_at is null
    and dm.is_deleted = false;
$$;

create or replace function public.mark_dm_read(p_conversation_id uuid, p_reader_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.direct_messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id != p_reader_id
    and read_at is null;
end;
$$;

create or replace function public.search_messages(p_room_id uuid, p_query text, p_limit integer default 20)
returns table (
  id uuid, content text, sender_id uuid, created_at timestamptz,
  sender_username text, sender_display_name text, sender_avatar_url text
)
language sql security definer stable as $$
  select m.id, m.content, m.sender_id, m.created_at,
    u.username, u.display_name, u.avatar_url
  from public.messages m
  join public.users u on u.id = m.sender_id
  where m.room_id = p_room_id
    and m.is_deleted = false
    and m.content ilike '%' || p_query || '%'
  order by m.created_at desc
  limit p_limit;
$$;

create or replace function public.update_last_seen(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.users set last_seen_at = now() where id = p_user_id;
end;
$$;

create or replace function public.get_admin_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_stats jsonb;
begin
  if not exists (select 1 from public.users where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;
  select jsonb_build_object(
    'total_users',        (select count(*) from public.users),
    'active_users_24h',   (select count(*) from public.users where last_seen_at > now() - interval '24 hours'),
    'total_rooms',        (select count(*) from public.rooms where is_archived = false),
    'active_rooms_24h',   (select count(distinct room_id) from public.messages where created_at > now() - interval '24 hours'),
    'total_messages_24h', (select count(*) from public.messages where created_at > now() - interval '24 hours'),
    'pending_reports',    (select count(*) from public.reports where status = 'pending'),
    'active_bans',        (select count(*) from public.bans where expires_at is null or expires_at > now())
  ) into v_stats;
  return v_stats;
end;
$$;

-- GRANTS finales
grant execute on function public.get_rooms(text,text,boolean,integer,integer) to authenticated, anon;
grant execute on function public.get_messages_paginated(uuid,timestamptz,integer)  to authenticated;
grant execute on function public.get_unread_dm_count(uuid,uuid)                    to authenticated;
grant execute on function public.mark_dm_read(uuid,uuid)                           to authenticated;
grant execute on function public.search_messages(uuid,text,integer)                to authenticated;
grant execute on function public.update_last_seen(uuid)                            to authenticated;
grant execute on function public.get_admin_stats()                                 to authenticated;
grant execute on function public.are_blocked(uuid,uuid)                            to authenticated, anon;
grant execute on function public.is_user_banned(uuid)                              to authenticated;
grant execute on function public.get_or_create_conversation(uuid,uuid)             to authenticated;
grant execute on function public.mark_all_notifications_read(uuid)                 to authenticated;
grant execute on function public.check_rate_limit(uuid,text,integer,integer)       to authenticated;
grant execute on function public.create_notification(uuid,public.notification_type,text,text,jsonb) to authenticated;
