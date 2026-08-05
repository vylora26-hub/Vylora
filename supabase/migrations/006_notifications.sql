-- ============================================================
-- MIGRACIÓN 006 — Notificaciones
-- ============================================================

-- TABLA: notifications
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       public.notification_type not null,
  title      text not null,
  body       text not null,
  -- data: contexto adicional (roomId, senderId, messageId, etc.)
  data       jsonb not null default '{}',
  is_read    boolean not null default false,
  created_at timestamptz not null default now(),

  constraint title_length check (char_length(title) <= 100),
  constraint body_length  check (char_length(body)  <= 300)
);

-- ============================================================
-- FUNCIÓN: Crear notificación (usada desde otros triggers/RPCs)
-- ============================================================
create or replace function public.create_notification(
  p_user_id uuid,
  p_type    public.notification_type,
  p_title   text,
  p_body    text,
  p_data    jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, p_data)
  returning id into v_id;
  return v_id;
end;
$$;

-- ============================================================
-- FUNCIÓN: Marcar todas las notificaciones de un usuario como leídas
-- ============================================================
create or replace function public.mark_all_notifications_read(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set is_read = true
  where user_id = p_user_id and is_read = false;
end;
$$;
