-- ============================================================
-- MIGRACIÓN 004 — Mensajes, adjuntos y reacciones
-- ============================================================

-- TABLA: messages (mensajes de sala)
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms(id) on delete cascade,
  sender_id  uuid not null references public.users(id) on delete cascade,
  -- content puede ser NULL si el mensaje solo tiene adjuntos
  content    text,
  type       public.message_type not null default 'text',
  reply_to_id uuid references public.messages(id) on delete set null,
  is_edited  boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  reactions  jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint content_length check (content is null or char_length(content) <= 2000),
  -- Al menos contenido o será un adjunto
  constraint content_or_attachment check (content is not null or type != 'text')
);

-- TABLA: attachments (adjuntos de mensajes de sala)
create table public.attachments (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  url        text not null,
  file_name  text not null,
  file_type  text not null,
  file_size  bigint not null check (file_size > 0),
  is_safe    boolean not null default false, -- marcado por Edge Function de validación
  created_at timestamptz not null default now(),

  constraint file_size_limit check (file_size <= 10485760) -- 10 MB máximo
);

-- ============================================================
-- MENSAJES DIRECTOS (DM)
-- ============================================================

-- TABLA: direct_conversations
-- El orden user1_id < user2_id garantiza unicidad sin importar quien inicia.
create table public.direct_conversations (
  id              uuid primary key default gen_random_uuid(),
  user1_id        uuid not null references public.users(id) on delete cascade,
  user2_id        uuid not null references public.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz,

  constraint unique_conversation unique (user1_id, user2_id),
  constraint ordered_participants check (user1_id < user2_id),
  constraint no_self_conversation check (user1_id != user2_id)
);

-- TABLA: direct_messages
create table public.direct_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id       uuid not null references public.users(id) on delete cascade,
  content         text,
  type            public.message_type not null default 'text',
  reply_to_id     uuid references public.direct_messages(id) on delete set null,
  is_edited       boolean not null default false,
  is_deleted      boolean not null default false,
  read_at         timestamptz,
  reactions       jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint dm_content_length check (content is null or char_length(content) <= 2000)
);

-- ============================================================
-- TRIGGER: Actualiza last_message_at en direct_conversations
-- ============================================================
create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.direct_conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_direct_message_sent
  after insert on public.direct_messages
  for each row execute procedure public.update_conversation_last_message();

-- ============================================================
-- FUNCIÓN: Buscar o crear conversación directa entre dos usuarios
-- ============================================================
create or replace function public.get_or_create_conversation(
  p_user1 uuid,
  p_user2 uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
  v_u1 uuid;
  v_u2 uuid;
begin
  -- Garantizar orden para cumplir constraint
  if p_user1 < p_user2 then
    v_u1 := p_user1; v_u2 := p_user2;
  else
    v_u1 := p_user2; v_u2 := p_user1;
  end if;

  select id into v_conv_id
  from public.direct_conversations
  where user1_id = v_u1 and user2_id = v_u2;

  if v_conv_id is null then
    insert into public.direct_conversations (user1_id, user2_id)
    values (v_u1, v_u2)
    returning id into v_conv_id;
  end if;

  return v_conv_id;
end;
$$;
