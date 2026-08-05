// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | 'message'
  | 'direct_message'
  | 'friend_request'
  | 'friend_accepted'
  | 'room_invite'
  | 'mention'
  | 'report_update'
  | 'ban'
  | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  /** Datos adicionales: roomId, senderId, messageId, etc. */
  data: Record<string, string>
  isRead: boolean
  createdAt: string
}

export interface MarkNotificationsReadPayload {
  ids: string[]
}
