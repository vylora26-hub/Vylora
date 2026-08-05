// ============================================================
// ICHATSERVICE — Contrato del servicio de mensajería
// ============================================================

import type {
  Message,
  SendMessagePayload,
  EditMessagePayload,
  MessagePage,
  DirectConversation,
  DirectMessage,
  SendDirectMessagePayload,
} from '@/types'

export interface IChatService {
  // ---- Mensajes de sala ----
  getMessages(roomId: string, cursor?: string): Promise<MessagePage>
  sendMessage(payload: SendMessagePayload): Promise<Message>
  editMessage(payload: EditMessagePayload): Promise<Message>
  deleteMessage(messageId: string): Promise<void>

  // ---- Reacciones ----
  addReaction(messageId: string, emoji: string): Promise<void>
  removeReaction(messageId: string, emoji: string): Promise<void>

  // ---- Mensajes directos ----
  getConversations(userId: string): Promise<DirectConversation[]>
  getDirectMessages(conversationId: string, cursor?: string): Promise<MessagePage>
  sendDirectMessage(payload: SendDirectMessagePayload): Promise<DirectMessage>

  // ---- Estado ----
  markAsRead(conversationId: string, userId: string): Promise<void>
  searchMessages(roomId: string, query: string): Promise<Message[]>
}
