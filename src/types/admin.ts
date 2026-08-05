// ============================================================
// ADMIN / MODERATION TYPES
// ============================================================

import type { PublicUser } from './user'

export type ReportTargetType = 'message' | 'user' | 'room'

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  reporterId: string | null
  targetType: ReportTargetType
  targetId: string
  reason: string
  details: string | null
  status: ReportStatus
  resolvedBy: string | null
  createdAt: string
  // Hydrated
  reporter?: PublicUser
}

export interface Ban {
  id: string
  userId: string
  bannedBy: string
  reason: string
  expiresAt: string | null // null = permanente
  createdAt: string
  // Hydrated
  user?: PublicUser
  moderator?: PublicUser
}

export interface BanUserPayload {
  userId: string
  reason: string
  expiresAt?: string
}

export type AuditAction =
  | 'user.ban'
  | 'user.unban'
  | 'user.role_change'
  | 'message.delete'
  | 'room.delete'
  | 'room.archive'
  | 'report.resolve'
  | 'report.dismiss'

export interface AuditLog {
  id: string
  actorId: string
  action: AuditAction
  targetType: string
  targetId: string
  metadata: Record<string, unknown>
  ip: string
  createdAt: string
  // Hydrated
  actor?: PublicUser
}

export interface AdminStats {
  totalUsers: number
  activeUsers24h: number
  totalRooms: number
  activeRooms24h: number
  totalMessages24h: number
  pendingReports: number
  activeBans: number
}
