select 1; -- inicio

-- ============================================================
-- MIGRACION 013 - Seguridad anti-estafa
-- Ejecutar completo en Supabase SQL Editor
-- ============================================================


-- ============================================================
-- 1. TABLA: user_sessions
-- Registra cada inicio de sesion con dispositivo, IP y pais.
-- El usuario puede ver sus sesiones y cerrarlas remotamente.
-- ============================================================
create table if not exists public.user_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  -- Token de sesion de Supabase (para revocar)
  session_ref text,
  -- Info del dispositivo (desde user-agent, parseado en el cliente)
  device_type text not null default 'unknown', -- 'desktop' | 'mobile' | 'tablet'
  browser     text,
  os          text,
  -- Ubicacion aproximada (solo pais/ciudad — JAMAS coordenadas exactas)
  -- Se obtiene del header CF-IPCountry de Cloudflare/Vercel (sin GPS)
  country     text,
  city        text,
  -- IP anonimizada (ultimo octeto borrado: 192.168.1.XXX)
  ip_masked   text,
  is_current  boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.user_sessions enable row level security;

drop policy if exists "sessions_select_own" on public.user_sessions;
create policy "sessions_select_own" on public.user_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.user_sessions;
create policy "sessions_insert_own" on public.user_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "sessions_delete_own" on public.user_sessions;
create policy "sessions_delete_own" on public.user_sessions
  for delete using (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.user_sessions;
create policy "sessions_update_own" on public.user_sessions
  for update using (auth.uid() = user_id);

-- Indice para listar sesiones de un usuario rapido
create index if not exists idx_user_sessions_user on public.user_sessions (user_id, last_seen_at desc);


-- ============================================================
-- 2. TABLA: spam_patterns
-- Patrones de texto que activan advertencias de seguridad.
-- Los admins pueden agregar/quitar patrones desde el panel.
-- NO bloquea el mensaje — solo muestra advertencia al REMITENTE.
-- ============================================================
create table if not exists public.spam_patterns (
  id         uuid primary key default gen_random_uuid(),
  pattern    text not null unique,
  category   text not null default 'scam',
  -- 'scam' | 'phishing' | 'adult' | 'violence'
  severity   text not null default 'medium',
  -- 'low' | 'medium' | 'high' | 'critical'
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.spam_patterns enable row level security;

-- Lectura publica (el cliente necesita descargar los patrones)
drop policy if exists "spam_patterns_select" on public.spam_patterns;
create policy "spam_patterns_select" on public.spam_patterns
  for select using (is_active = true);

-- Solo admins pueden modificar
drop policy if exists "spam_patterns_admin" on public.spam_patterns;
create policy "spam_patterns_admin" on public.spam_patterns
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 3. TABLA: security_warnings
-- Registro de mensajes que activaron advertencias.
-- Sirve para que los admins detecten patrones de estafa.
-- ============================================================
create table if not exists public.security_warnings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete set null,
  pattern_id   uuid references public.spam_patterns(id) on delete set null,
  message_preview text, -- primeros 50 chars, para contexto del admin
  context      text not null default 'dm',  -- 'dm' | 'room' | 'profile'
  was_sent     boolean not null default false, -- el usuario lo envio igual
  created_at   timestamptz not null default now()
);

alter table public.security_warnings enable row level security;

-- Solo admins ven los registros
drop policy if exists "warnings_admin" on public.security_warnings;
create policy "warnings_admin" on public.security_warnings
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','moderator'))
  );

-- El propio usuario puede insertar (cuando se activa la advertencia)
drop policy if exists "warnings_insert_own" on public.security_warnings;
create policy "warnings_insert_own" on public.security_warnings
  for insert with check (auth.uid() = user_id);

create index if not exists idx_warnings_user on public.security_warnings (user_id, created_at desc);


-- ============================================================
-- 4. CAMPO: account_age_days en users (columna calculada virtual)
-- En vez de almacenar, calculamos desde created_at.
-- Se usa para el badge "Cuenta nueva" (< 30 dias).
-- ============================================================
-- No necesita columna adicional — se calcula con:
-- EXTRACT(DAY FROM now() - created_at) < 30


-- ============================================================
-- 5. FUNCION: get_active_sessions
-- Devuelve las sesiones activas del usuario autenticado.
-- ============================================================
create or replace function public.get_active_sessions()
returns table (
  id          uuid,
  device_type text,
  browser     text,
  os          text,
  country     text,
  city        text,
  ip_masked   text,
  is_current  boolean,
  last_seen_at timestamptz,
  created_at  timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select id, device_type, browser, os, country, city, ip_masked,
         is_current, last_seen_at, created_at
  from public.user_sessions
  where user_id = auth.uid()
  order by last_seen_at desc
  limit 10;
$$;

grant execute on function public.get_active_sessions() to authenticated;


-- ============================================================
-- 6. FUNCION: revoke_session
-- Cierra una sesion especifica del usuario autenticado.
-- ============================================================
create or replace function public.revoke_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_sessions
  where id = p_session_id and user_id = auth.uid();
end;
$$;

grant execute on function public.revoke_session(uuid) to authenticated;


-- ============================================================
-- 7. FUNCION: get_spam_patterns
-- Devuelve los patrones activos para el cliente.
-- ============================================================
create or replace function public.get_spam_patterns()
returns table (
  pattern  text,
  category text,
  severity text
)
language sql
security definer
stable
set search_path = public
as $$
  select pattern, category, severity
  from public.spam_patterns
  where is_active = true
  order by severity desc, category;
$$;

grant execute on function public.get_spam_patterns() to authenticated, anon;


-- ============================================================
-- 8. DATOS SEMILLA: patrones de scam comunes
-- ============================================================
insert into public.spam_patterns (pattern, category, severity) values
  -- Estafas financieras
  ('western union',          'scam',     'high'),
  ('moneygram',              'scam',     'high'),
  ('transferencia bancaria', 'scam',     'high'),
  ('número de cuenta',       'scam',     'high'),
  ('tarjeta de regalo',      'scam',     'high'),
  ('gift card',              'scam',     'high'),
  ('te gané un premio',      'scam',     'high'),
  ('ganaste un premio',      'scam',     'high'),
  ('lottery',                'scam',     'high'),
  ('lotería',                'scam',     'high'),
  ('bitcoin',                'scam',     'medium'),
  ('criptomoneda',           'scam',     'medium'),
  ('inversión garantizada',  'scam',     'high'),
  ('gana dinero rápido',     'scam',     'high'),
  ('dólares fácil',          'scam',     'high'),
  -- Phishing
  ('verifica tu cuenta',     'phishing', 'high'),
  ('confirma tu contraseña', 'phishing', 'critical'),
  ('ingresa tus datos',      'phishing', 'high'),
  ('click aquí',             'phishing', 'low'),
  ('haz clic aquí',          'phishing', 'low'),
  ('bit.ly',                 'phishing', 'medium'),
  ('tinyurl',                'phishing', 'medium'),
  ('t.co',                   'phishing', 'low'),
  -- Identidad falsa
  ('soy del banco',          'scam',     'critical'),
  ('trabajo en paypal',      'scam',     'critical'),
  ('soy administrador',      'scam',     'high'),
  ('soporte técnico',        'scam',     'medium')
on conflict (pattern) do nothing;


-- ============================================================
-- VERIFICACION FINAL
-- ============================================================
select
  'user_sessions'    as tabla, count(*) as registros from public.user_sessions
union all
select 'spam_patterns',     count(*) from public.spam_patterns
union all
select 'security_warnings', count(*) from public.security_warnings;
