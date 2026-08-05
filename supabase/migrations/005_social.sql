-- ============================================================
-- MIGRACION 005 - Social: amistades, bloqueos, presencia
-- Todas las sentencias usan IF NOT EXISTS para ser idempotentes
-- ============================================================

-- TABLA: friendships
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

-- TABLA: blocks
create table if not exists public.blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id != blocked_id)
);

-- TABLA: presence
create table if not exists public.presence (
  user_id         uuid primary key references public.users(id) on delete cascade,
  status          public.online_status not null default 'offline',
  last_seen_at    timestamptz not null default now(),
  current_room_id uuid references public.rooms(id) on delete set null
);

-- ============================================================
-- FUNCION: are_blocked
-- Verifica si dos usuarios se bloquean mutuamente en cualquier
-- direccion. Requerida por RLS policies de direct_conversations
-- y friendships (migraciones 009).
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
