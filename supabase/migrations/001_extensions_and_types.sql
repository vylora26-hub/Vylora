-- ============================================================
-- MIGRACIÓN 001 — Extensiones y tipos base
-- ============================================================

-- UUID generation
create extension if not exists "uuid-ossp";

-- Funciones de encriptación (para password de salas)
create extension if not exists "pgcrypto";

-- Tipos ENUM del dominio
create type public.user_role as enum ('guest', 'user', 'moderator', 'admin');
create type public.online_status as enum ('online', 'away', 'offline');
create type public.room_type as enum ('public', 'private', 'password_protected');
create type public.room_member_role as enum ('member', 'moderator', 'owner');
create type public.message_type as enum ('text', 'image', 'file', 'gif', 'sticker', 'system');
create type public.friendship_status as enum ('pending', 'accepted', 'rejected');
create type public.notification_type as enum (
  'message', 'direct_message', 'friend_request', 'friend_accepted',
  'room_invite', 'mention', 'report_update', 'ban', 'system'
);
create type public.report_target_type as enum ('message', 'user', 'room');
create type public.report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');
create type public.audit_action as enum (
  'user.ban', 'user.unban', 'user.role_change',
  'message.delete', 'room.delete', 'room.archive',
  'report.resolve', 'report.dismiss'
);
