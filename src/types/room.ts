// ============================================================
// ROOM TYPES
// ============================================================

import type { PublicUser } from './user'

export type RoomType = 'public' | 'private' | 'password_protected'

export type RoomMemberRole = 'member' | 'moderator' | 'owner'

export interface RoomCategory {
  id: string
  name: string
  slug: string
  icon: string
}

export interface Room {
  id: string
  name: string
  slug: string
  description: string | null
  coverUrl: string | null
  categoryId: string | null
  category: RoomCategory | null
  ownerId: string
  type: RoomType
  isFeatured: boolean
  isVerified: boolean
  isArchived: boolean
  maxMembers: number
  memberCount: number
  createdAt: string
  // Hydrated en cliente
  owner?: PublicUser
  isMember?: boolean
  memberRole?: RoomMemberRole
}

export interface RoomMember {
  roomId: string
  userId: string
  role: RoomMemberRole
  joinedAt: string
  isMuted: boolean
  mutedUntil: string | null
  // Hydrated
  user?: PublicUser
}

export interface CreateRoomPayload {
  name: string
  description?: string
  categoryId?: string
  type: RoomType
  password?: string
  maxMembers?: number
}

export interface UpdateRoomPayload {
  name?: string
  description?: string
  coverUrl?: string
  categoryId?: string
  type?: RoomType
  password?: string
  maxMembers?: number
}

export interface JoinRoomPayload {
  roomId: string
  password?: string
}

export interface RoomFilters {
  search?: string
  categoryId?: string
  type?: RoomType
  featured?: boolean
}
