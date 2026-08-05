-- ============================================================
-- MIGRACION 009 - Row Level Security (RLS)
-- Principio: denegar todo por defecto, permitir explicitamente.
-- ============================================================

-- Habilitar RLS en todas las tablas
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

-- ============================================================
-- USERS
-- ============================================================
drop policy if exists "users_select_public" on public.users;
create policy "users_select_public" on public.users
  for select using (true);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- SESSIONS
-- ============================================================
drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- USER_SETTINGS
-- ============================================================
drop policy if exists "settings_select_own" on public.user_settings;
create policy "settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ROOM_CATEGORIES
-- ============================================================
drop policy if exists "categories_select_all" on public.room_categories;
create policy "categories_select_all" on public.room_categories
  for select using (true);

-- ============================================================
-- ROOMS
-- ============================================================
drop policy if exists "rooms_select_public" on public.rooms;
create policy "rooms_select_public" on public.rooms
  for select using (
    type = 'public'
    or owner_id = auth.uid()
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "rooms_insert_authenticated" on public.rooms;
create policy "rooms_insert_authenticated" on public.rooms
  for insert with check (
    auth.uid() is not null
    and auth.uid() = owner_id
    and not public.is_user_banned(auth.uid())
  );

drop policy if exists "rooms_update_owner_or_mod" on public.rooms;
create policy "rooms_update_owner_or_mod" on public.rooms
  for update using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

drop policy if exists "rooms_delete_owner_or_admin" on public.rooms;
create policy "rooms_delete_owner_or_admin" on public.rooms
  for delete using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ============================================================
-- ROOM_MEMBERS
-- ============================================================
drop policy if exists "room_members_select" on public.room_members;
create policy "room_members_select" on public.room_members
  for select using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id and (
        r.type = 'public'
        or r.owner_id = auth.uid()
        or user_id = auth.uid()
      )
    )
  );

drop policy if exists "room_members_insert_self" on public.room_members;
create policy "room_members_insert_self" on public.room_members
  for insert with check (
    auth.uid() = user_id
    and not public.is_user_banned(auth.uid())
  );

drop policy if exists "room_members_delete_self_or_owner" on public.room_members;
create policy "room_members_delete_self_or_owner" on public.room_members
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

-- ============================================================
-- MESSAGES
-- ============================================================
drop policy if exists "messages_select_room_member" on public.messages;
create policy "messages_select_room_member" on public.messages
  for select using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = messages.room_id and rm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.type = 'public'
    )
  );

drop policy if exists "messages_insert_room_member" on public.messages;
create policy "messages_insert_room_member" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and not public.is_user_banned(auth.uid())
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = room_id
        and rm.user_id = auth.uid()
        and rm.is_muted = false
    )
  );

drop policy if exists "messages_update_own_or_mod" on public.messages;
create policy "messages_update_own_or_mod" on public.messages
  for update using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

-- ============================================================
-- ATTACHMENTS
-- ============================================================
drop policy if exists "attachments_select_room_member" on public.attachments;
create policy "attachments_select_room_member" on public.attachments
  for select using (
    exists (
      select 1 from public.messages m
      join public.room_members rm on rm.room_id = m.room_id
      where m.id = attachments.message_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "attachments_insert_own" on public.attachments;
create policy "attachments_insert_own" on public.attachments
  for insert with check (
    exists (
      select 1 from public.messages m
      where m.id = message_id and m.sender_id = auth.uid()
    )
  );

-- ============================================================
-- DIRECT_CONVERSATIONS
-- ============================================================
drop policy if exists "dm_conv_select_participant" on public.direct_conversations;
create policy "dm_conv_select_participant" on public.direct_conversations
  for select using (
    user1_id = auth.uid() or user2_id = auth.uid()
  );

drop policy if exists "dm_conv_insert_authenticated" on public.direct_conversations;
create policy "dm_conv_insert_authenticated" on public.direct_conversations
  for insert with check (
    (user1_id = auth.uid() or user2_id = auth.uid())
    and not public.are_blocked(user1_id, user2_id)
    and not public.is_user_banned(auth.uid())
  );

-- ============================================================
-- DIRECT_MESSAGES
-- ============================================================
drop policy if exists "dm_select_participant" on public.direct_messages;
create policy "dm_select_participant" on public.direct_messages
  for select using (
    exists (
      select 1 from public.direct_conversations dc
      where dc.id = conversation_id
        and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
    )
  );

drop policy if exists "dm_insert_participant" on public.direct_messages;
create policy "dm_insert_participant" on public.direct_messages
  for insert with check (
    auth.uid() = sender_id
    and not public.is_user_banned(auth.uid())
    and exists (
      select 1 from public.direct_conversations dc
      where dc.id = conversation_id
        and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
    )
  );

drop policy if exists "dm_update_own" on public.direct_messages;
create policy "dm_update_own" on public.direct_messages
  for update using (sender_id = auth.uid());

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own" on public.friendships
  for select using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );

drop policy if exists "friendships_insert_authenticated" on public.friendships;
create policy "friendships_insert_authenticated" on public.friendships
  for insert with check (
    requester_id = auth.uid()
    and not public.is_user_banned(auth.uid())
    and not public.are_blocked(requester_id, addressee_id)
  );

drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee" on public.friendships
  for update using (addressee_id = auth.uid());

drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own" on public.friendships
  for delete using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );

-- ============================================================
-- BLOCKS
-- ============================================================
drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks
  for select using (blocker_id = auth.uid());

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own" on public.blocks
  for insert with check (blocker_id = auth.uid());

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own" on public.blocks
  for delete using (blocker_id = auth.uid());

-- ============================================================
-- PRESENCE
-- ============================================================
drop policy if exists "presence_select_all" on public.presence;
create policy "presence_select_all" on public.presence
  for select using (true);

drop policy if exists "presence_upsert_own" on public.presence;
create policy "presence_upsert_own" on public.presence
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- REPORTS
-- ============================================================
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert with check (
    reporter_id = auth.uid()
    and not public.is_user_banned(auth.uid())
  );

drop policy if exists "reports_select_own_or_mod" on public.reports;
create policy "reports_select_own_or_mod" on public.reports
  for select using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

drop policy if exists "reports_update_mod_only" on public.reports;
create policy "reports_update_mod_only" on public.reports
  for update using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

-- ============================================================
-- BANS
-- ============================================================
drop policy if exists "bans_select_mod_or_self" on public.bans;
create policy "bans_select_mod_or_self" on public.bans
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

-- ============================================================
-- AUDIT_LOGS
-- ============================================================
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin" on public.audit_logs
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );
