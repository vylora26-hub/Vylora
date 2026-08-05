-- ============================================================
-- MIGRACION 008 - Indices para rendimiento
-- Todos con IF NOT EXISTS para ser idempotentes
-- ============================================================

-- USERS
create index if not exists idx_users_username on public.users (username);
create index if not exists idx_users_role     on public.users (role);
create index if not exists idx_users_banned   on public.users (is_banned) where is_banned = true;

-- ROOMS
create index if not exists idx_rooms_slug     on public.rooms (slug);
create index if not exists idx_rooms_category on public.rooms (category_id);
create index if not exists idx_rooms_owner    on public.rooms (owner_id);
create index if not exists idx_rooms_featured on public.rooms (is_featured) where is_featured = true;

create index if not exists idx_rooms_search on public.rooms using gin(
  to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- ROOM_MEMBERS
create index if not exists idx_room_members_user on public.room_members (user_id);
create index if not exists idx_room_members_room on public.room_members (room_id);

-- MESSAGES
create index if not exists idx_messages_room_created on public.messages (room_id, created_at desc);
create index if not exists idx_messages_room_active  on public.messages (room_id, created_at desc)
  where is_deleted = false;
create index if not exists idx_messages_sender on public.messages (sender_id);

-- DIRECT_CONVERSATIONS
create index if not exists idx_dm_conversations_user1    on public.direct_conversations (user1_id);
create index if not exists idx_dm_conversations_user2    on public.direct_conversations (user2_id);
create index if not exists idx_dm_conversations_last_msg on public.direct_conversations (last_message_at desc nulls last);

-- DIRECT_MESSAGES
create index if not exists idx_dm_messages_conv_created on public.direct_messages (conversation_id, created_at desc);
create index if not exists idx_dm_messages_unread       on public.direct_messages (conversation_id, sender_id)
  where read_at is null;

-- FRIENDSHIPS
create index if not exists idx_friendships_addressee on public.friendships (addressee_id, status);
create index if not exists idx_friendships_requester on public.friendships (requester_id, status);

-- NOTIFICATIONS
create index if not exists idx_notifications_unread on public.notifications (user_id, created_at desc)
  where is_read = false;

-- REPORTS
create index if not exists idx_reports_status on public.reports (status, created_at desc);

-- BANS
-- now() no es IMMUTABLE — no se puede usar en predicados de indice parcial.
-- Usamos indices simples; el filtro de expires_at se aplica en la query.
create index if not exists idx_bans_user_id on public.bans (user_id);
create index if not exists idx_bans_expires on public.bans (expires_at);

-- AUDIT_LOGS
create index if not exists idx_audit_actor  on public.audit_logs (actor_id, created_at desc);
create index if not exists idx_audit_action on public.audit_logs (action, created_at desc);

-- RATE_LIMITS
create index if not exists idx_rate_limits_window on public.rate_limits (window_start);

-- PRESENCE
create index if not exists idx_presence_room on public.presence (current_room_id)
  where status = 'online';
