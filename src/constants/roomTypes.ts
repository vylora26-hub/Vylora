// ============================================================
// ROOM TYPES CONSTANTS
// ============================================================

import type { RoomType } from '@/types'

export const ROOM_TYPES: Record<RoomType, { label: string; description: string; icon: string }> = {
  public: {
    label: 'Pública',
    description: 'Cualquiera puede unirse y ver los mensajes.',
    icon: 'globe',
  },
  private: {
    label: 'Privada',
    description: 'Solo miembros invitados pueden acceder.',
    icon: 'lock-closed',
  },
  password_protected: {
    label: 'Con contraseña',
    description: 'Requiere contraseña para unirse.',
    icon: 'key',
  },
}

export const ROOM_LIMITS = {
  NAME_MIN: 3,
  NAME_MAX: 50,
  DESCRIPTION_MAX: 300,
  PASSWORD_MIN: 4,
  PASSWORD_MAX: 32,
  MAX_MEMBERS_DEFAULT: 500,
  MAX_MEMBERS_LIMIT: 5000,
} as const
