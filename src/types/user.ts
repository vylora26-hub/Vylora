// ============================================================
// USER TYPES
// ============================================================

import type { UserRole } from './auth'

export type OnlineStatus = 'online' | 'away' | 'offline'

export interface User {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  city: string | null
  country: string | null
  role: UserRole
  isBanned: boolean
  isVerified: boolean
  createdAt: string
  lastSeenAt: string | null
}

/** Vista pública de un usuario (sin datos sensibles) */
export interface PublicUser {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  city: string | null
  country: string | null
  role: UserRole
  isVerified: boolean
  lastSeenAt: string | null
  onlineStatus: OnlineStatus
}

/** Datos editables del perfil propio */
export interface UpdateProfilePayload {
  displayName?: string
  bio?: string
  city?: string
  country?: string
  avatarUrl?: string
}

export interface UserSettings {
  userId: string
  theme: 'light' | 'dark' | 'system'
  language: string
  emailNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  showOnlineStatus: boolean
  allowDmFromStrangers: boolean
}

export interface UpdateSettingsPayload extends Partial<Omit<UserSettings, 'userId'>> {}

export interface UserPresence {
  userId: string
  status: OnlineStatus
  lastSeenAt: string
  currentRoomId: string | null
}

export interface Session {
  id: string
  userId: string
  ip: string
  userAgent: string
  createdAt: string
}
