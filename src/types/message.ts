// ============================================================
// MESSAGE TYPES
// ============================================================

import type { PublicUser } from './user'

export type MessageType = 'text' | 'image' | 'file' | 'gif' | 'sticker' | 'system'

export type MessageStatus = 'sending' | 'sent' | 'read' | 'failed'

/** Reacciones: emoji → array de userIds */
export type Reactions = Record<string, string[]>

export interface Attachment {
  id: string
  messageId: string
  url: string
  fileName: string
  fileType: string
  fileSize: number
  isSafe: boolean
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  content: string
  type: MessageType
  replyToId: string | null
  isEdited: boolean
  isDeleted: boolean
  deletedAt: string | null
  reactions: Reactions
  createdAt: string
  updatedAt: string
  // Hydrated en cliente
  sender?: PublicUser
  replyTo?: Pick<Message, 'id' | 'content' | 'senderId' | 'sender'>
  attachments?: Attachment[]
  // Estado local (UI only)
  status?: MessageStatus
  localId?: string
}

export interface SendMessagePayload {
  roomId: string
  content: string
  type?: MessageType
  replyToId?: string
}

export interface EditMessagePayload {
  messageId: string
  content: string
}

export interface DirectConversation {
  id: string
  user1Id: string
  user2Id: string
  createdAt: string
  lastMessageAt: string | null
  // Hydrated
  otherUser?: PublicUser
  lastMessage?: DirectMessage | null
  unreadCount?: number
}

export interface DirectMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: MessageType
  replyToId: string | null
  isEdited: boolean
  isDeleted: boolean
  readAt: string | null
  reactions: Reactions
  createdAt: string
  // Hydrated
  sender?: PublicUser
  replyTo?: Pick<DirectMessage, 'id' | 'content' | 'senderId'>
  attachments?: Attachment[]
  status?: MessageStatus
  localId?: string
}

export interface SendDirectMessagePayload {
  conversationId: string
  content: string
  type?: MessageType
  replyToId?: string
}

/** Evento de "está escribiendo" para Realtime */
export interface TypingEvent {
  userId: string
  roomId?: string
  conversationId?: string
  isTyping: boolean
}

/** Cursor de paginación para scroll infinito */
export interface MessagePage {
  messages: Message[]
  hasMore: boolean
  oldestCursor: string | null
}
