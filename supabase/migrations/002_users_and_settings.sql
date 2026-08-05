-- ============================================================
-- MIGRACIÓN 002 — Usuarios, sesiones y configuración
-- ============================================================

-- TABLA: users
-- Extiende auth.users de Supabase.
-- No se duplican email/password — esos viven en auth.users.
create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique,
  display_name text not null,
  avatar_url   text,
  bio          text,
  city         text,
  country      text,
  role         public.user_role not null default 'user',
  is_banned    boolean not null default false,
  is_verified  boolean not null default false,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz,

  -- Constraints de validación
  constraint username_length    check (char_length(username) between 3 and 30),
  constraint username_format    check (username ~ '^[a-zA-Z0-9_]+$'),
  constraint display_name_length check (char_length(display_name) between 2 and 50),
  constraint bio_length         check (bio is null or char_length(bio) <= 300)
);

-- TABLA: sessions
-- Audit de inicios de sesión para detectar accesos sospechosos.
create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  ip         inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- TABLA: user_settings
-- Relación 1:1 con users. Se crea automáticamente al registrarse.
create table public.user_settings (
  user_id                   uuid primary key references public.users(id) on delete cascade,
  theme                     text not null default 'system'
                              check (theme in ('light', 'dark', 'system')),
  language                  text not null default 'es',
  email_notifications       boolean not null default true,
  push_notifications        boolean not null default true,
  sound_enabled             boolean not null default true,
  show_online_status        boolean not null default true,
  allow_dm_from_strangers   boolean not null default true
);

-- ============================================================
-- TRIGGER: Crea user + user_settings al registrarse en auth
-- ============================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insertar en public.users
  insert into public.users (id, username, display_name)
  values (
    new.id,
    -- Genera un username temporal a partir del email
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'))
      || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );

  -- Crear configuración por defecto
  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
