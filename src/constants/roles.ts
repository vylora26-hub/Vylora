// ============================================================
// ROLES — Jerarquía de permisos
// guest < user < moderator < admin
// ============================================================

import type { UserRole } from '@/types'

export const ROLES = {
  GUEST: 'guest' as UserRole,
  USER: 'user' as UserRole,
  MODERATOR: 'moderator' as UserRole,
  ADMIN: 'admin' as UserRole,
} as const

/** Peso numérico de cada rol para comparaciones rápidas */
export const ROLE_WEIGHT: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  moderator: 2,
  admin: 3,
}

/** Devuelve true si `role` tiene al menos el nivel de `required` */
export function hasRole(role: UserRole, required: UserRole): boolean {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[required]
}

export const ROOM_MEMBER_ROLES = {
  MEMBER: 'member',
  MODERATOR: 'moderator',
  OWNER: 'owner',
} as const
