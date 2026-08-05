-- ============================================================
-- MIGRACIÓN 003 — Salas y miembros
-- ============================================================

-- TABLA: room_categories
create table public.room_categories (
  id   text primary key,
  name text not null,
  slug text not null unique,
  icon text not null default 'chat-bubble-left-right'
);

-- TABLA: rooms
create table public.rooms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  cover_url    text,
  category_id  text references public.room_categories(id) on delete set null,
  owner_id     uuid not null references public.users(id) on delete cascade,
  type         public.room_type not null default 'public',
  -- La contraseña se guarda hasheada con pgcrypto, nunca en texto plano
  password_hash text,
  is_featured  boolean not null default false,
  is_verified  boolean not null default false,
  is_archived  boolean not null default false,
  max_members  integer not null default 500
                 check (max_members between 2 and 5000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint name_length check (char_length(name) between 3 and 50),
  constraint description_length check (description is null or char_length(description) <= 300),
  constraint slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- TABLA: room_members
-- Un usuario puede tener un único rol por sala.
create table public.room_members (
  room_id     uuid not null references public.rooms(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        public.room_member_role not null default 'member',
  joined_at   timestamptz not null default now(),
  is_muted    boolean not null default false,
  muted_until timestamptz,

  primary key (room_id, user_id)
);

-- ============================================================
-- FUNCIÓN: Auto-unir al creador como owner al crear sala
-- ============================================================
create or replace function public.handle_room_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.room_members (room_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_room_created
  after insert on public.rooms
  for each row execute procedure public.handle_room_created();

-- ============================================================
-- FUNCIÓN: Genera slug único a partir del nombre
-- ============================================================
create or replace function public.generate_room_slug(p_name text)
returns text
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter   integer := 0;
begin
  base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  loop
    exit when not exists (select 1 from public.rooms where slug = final_slug);
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  return final_slug;
end;
$$;
