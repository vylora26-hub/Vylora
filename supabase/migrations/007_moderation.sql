-- ============================================================
-- MIGRACIÓN 007 — Moderación: reportes, baneos, audit logs, rate limits
-- ============================================================

-- TABLA: reports
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  target_type public.report_target_type not null,
  target_id   text not null, -- UUID del mensaje/usuario/sala reportado
  reason      text not null,
  details     text,
  status      public.report_status not null default 'pending',
  resolved_by uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint reason_length  check (char_length(reason)  <= 200),
  constraint details_length check (details is null or char_length(details) <= 1000)
);

-- TABLA: bans
-- expires_at = NULL → baneo permanente.
create table public.bans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  banned_by  uuid not null references public.users(id),
  reason     text not null,
  expires_at timestamptz, -- NULL = permanente
  created_at timestamptz not null default now(),

  constraint reason_length check (char_length(reason) <= 500)
);

-- TABLA: audit_logs
-- INMUTABLE: solo INSERT. Ningún rol puede hacer UPDATE o DELETE.
-- Registra todas las acciones importantes de moderación y admin.
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  action      public.audit_action not null,
  target_type text not null,
  target_id   text not null,
  metadata    jsonb not null default '{}',
  ip          inet,
  created_at  timestamptz not null default now()
);

-- TABLA: rate_limits
-- Control server-side de rate limiting por usuario y acción.
create table public.rate_limits (
  user_id      uuid not null references public.users(id) on delete cascade,
  action       text not null,
  count        integer not null default 1,
  window_start timestamptz not null default now(),

  primary key (user_id, action)
);

-- ============================================================
-- TRIGGER: Al crear un baneo, actualiza is_banned en users
-- y registra en audit_logs
-- ============================================================
create or replace function public.handle_ban_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Marcar usuario como baneado
  update public.users
  set is_banned = true
  where id = new.user_id;

  -- Insertar en audit log
  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    new.banned_by,
    'user.ban',
    'user',
    new.user_id::text,
    jsonb_build_object(
      'reason', new.reason,
      'expires_at', new.expires_at
    )
  );

  return new;
end;
$$;

create trigger on_ban_created
  after insert on public.bans
  for each row execute procedure public.handle_ban_created();

-- ============================================================
-- FUNCIÓN: Verificar si un usuario está baneado activamente
-- ============================================================
create or replace function public.is_user_banned(p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.bans
    where user_id = p_user_id
      and (expires_at is null or expires_at > now())
  );
$$;

-- ============================================================
-- FUNCIÓN: Verificar rate limit — devuelve false si excedió límite
-- ============================================================
create or replace function public.check_rate_limit(
  p_user_id    uuid,
  p_action     text,
  p_max_count  integer,
  p_window_ms  integer -- ventana en milisegundos
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count        integer;
begin
  v_window_start := now() - (p_window_ms || ' milliseconds')::interval;

  select count, window_start
  into v_count, v_window_start
  from public.rate_limits
  where user_id = p_user_id and action = p_action;

  if not found or v_window_start < (now() - (p_window_ms || ' milliseconds')::interval) then
    -- Primera vez o ventana expirada: resetear
    insert into public.rate_limits (user_id, action, count, window_start)
    values (p_user_id, p_action, 1, now())
    on conflict (user_id, action)
    do update set count = 1, window_start = now();
    return true;
  end if;

  if v_count >= p_max_count then
    return false; -- Límite excedido
  end if;

  -- Incrementar contador
  update public.rate_limits
  set count = count + 1
  where user_id = p_user_id and action = p_action;

  return true;
end;
$$;
