// ============================================================
// CHAT STORE — Mensajes de sala en tiempo real
// ============================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG, APP_CONFIG } from '@/config'
import { REALTIME_CHANNELS } from '@/constants'
import { sanitizeText } from '@/utils/sanitize'
import { generateLocalId } from '@/utils/generateId'
import { useAuthStore } from './auth'
import type { Message, SendMessagePayload, PublicUser } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ---- Mock messages ----
const makeMock = (roomId: string): Message[] => [
  { id: 'm1', roomId, senderId: 'mock_admin', content: '¡Bienvenidos a Vylora! 🎉', type: 'text', replyToId: null, isEdited: false, isDeleted: false, deletedAt: null, reactions: {}, createdAt: new Date(Date.now() - 120000).toISOString(), updatedAt: new Date(Date.now() - 120000).toISOString(), sender: { id: 'mock_admin', username: 'admin', displayName: 'Admin', avatarUrl: null, bio: null, city: null, country: null, role: 'admin', isVerified: true, lastSeenAt: null, onlineStatus: 'online' } },
  { id: 'm2', roomId, senderId: 'mock_user_001', content: 'Hola a todos! 👋', type: 'text', replyToId: null, isEdited: false, isDeleted: false, deletedAt: null, reactions: { '👍': ['mock_admin'] }, createdAt: new Date(Date.now() - 60000).toISOString(), updatedAt: new Date(Date.now() - 60000).toISOString(), sender: { id: 'mock_user_001', username: 'demo_user', displayName: 'Demo User', avatarUrl: null, bio: null, city: null, country: null, role: 'user', isVerified: false, lastSeenAt: null, onlineStatus: 'online' } },
]

export const useChatStore = defineStore('chat', () => {
  // messages[roomId] = Message[]
  const messages = ref<Record<string, Message[]>>({})
  const loading = ref(false)
  const sending = ref(false)
  const hasMore = ref<Record<string, boolean>>({})
  // typing[roomId] = Set<username>
  const typing = ref<Record<string, Set<string>>>({})
  const onlineCount = ref(0)

  let channel: RealtimeChannel | null = null
  let typingTimeout: ReturnType<typeof setTimeout> | null = null

  // ---- Cargar mensajes (paginación por cursor) ----
  async function fetchMessages(roomId: string, cursor?: string): Promise<void> {
    loading.value = true
    try {
      if (isMockMode) {
        if (!messages.value[roomId]) messages.value[roomId] = makeMock(roomId)
        hasMore.value[roomId] = false
        return
      }
      const { data } = await supabase!.rpc('get_messages_paginated', {
        p_room_id: roomId, p_cursor: cursor ?? null, p_limit: APP_CONFIG.MESSAGES_PER_PAGE,
      })
      const page: Message[] = (data ?? []).map(_mapRow).reverse()
      if (cursor) {
        messages.value[roomId] = [...page, ...(messages.value[roomId] ?? [])]
      } else {
        messages.value[roomId] = page
      }
      hasMore.value[roomId] = page.length === APP_CONFIG.MESSAGES_PER_PAGE
    } finally {
      loading.value = false
    }
  }

  // ---- Enviar mensaje (actualización optimista) ----
  async function sendMessage(payload: SendMessagePayload): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.user) return
    sending.value = true
    const localId = generateLocalId()

    const optimistic: Message = {
      id: localId, localId, roomId: payload.roomId,
      senderId: authStore.userId!,
      content: sanitizeText(payload.content),
      type: payload.type ?? 'text',
      replyToId: payload.replyToId ?? null,
      isEdited: false, isDeleted: false, deletedAt: null, reactions: {},
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      status: 'sending',
      sender: {
        id: authStore.user.id, username: authStore.user.username,
        displayName: authStore.user.displayName, avatarUrl: authStore.user.avatarUrl,
        bio: null, city: null, country: null, role: authStore.user.role,
        isVerified: authStore.user.isVerified, lastSeenAt: null, onlineStatus: 'online',
      },
    }

    if (!messages.value[payload.roomId]) messages.value[payload.roomId] = []
    messages.value[payload.roomId].push(optimistic)

    try {
      if (isMockMode) {
        optimistic.id = `m_${Date.now()}`
        optimistic.status = 'sent'
        sending.value = false
        return
      }
      const { data, error } = await supabase!.from(SUPABASE_CONFIG.TABLES.MESSAGES).insert({
        room_id: payload.roomId,
        sender_id: authStore.userId,
        content: sanitizeText(payload.content),
        type: payload.type ?? 'text',
        reply_to_id: payload.replyToId ?? null,
      }).select('id').single()

      if (error || !data) {
        optimistic.status = 'failed'
      } else {
        optimistic.id = data.id
        optimistic.status = 'sent'
      }
    } catch {
      optimistic.status = 'failed'
    } finally {
      sending.value = false
    }
  }

  // ---- Editar mensaje ----
  async function editMessage(messageId: string, roomId: string, content: string): Promise<void> {
    const list = messages.value[roomId]
    if (!list) return
    const msg = list.find(m => m.id === messageId)
    if (!msg) return
    const old = msg.content
    msg.content = sanitizeText(content)
    msg.isEdited = true
    if (isMockMode) return
    const { error } = await supabase!.from(SUPABASE_CONFIG.TABLES.MESSAGES)
      .update({ content: sanitizeText(content), is_edited: true }).eq('id', messageId)
    if (error) msg.content = old
  }

  // ---- Borrar mensaje (lógico) ----
  async function deleteMessage(messageId: string, roomId: string): Promise<void> {
    const list = messages.value[roomId]
    if (!list) return
    const msg = list.find(m => m.id === messageId)
    if (!msg) return
    msg.isDeleted = true
    msg.content = 'Mensaje eliminado'
    if (isMockMode) return
    await supabase!.from(SUPABASE_CONFIG.TABLES.MESSAGES)
      .update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', messageId)
  }

  // ---- Reacciones ----
  async function toggleReaction(messageId: string, roomId: string, emoji: string): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    const list = messages.value[roomId]
    const msg = list?.find(m => m.id === messageId)
    if (!msg) return
    const uid = authStore.userId
    if (!msg.reactions[emoji]) msg.reactions[emoji] = []
    const idx = msg.reactions[emoji].indexOf(uid)
    if (idx >= 0) {
      msg.reactions[emoji].splice(idx, 1)
      if (!msg.reactions[emoji].length) delete msg.reactions[emoji]
    } else {
      msg.reactions[emoji].push(uid)
    }
    if (isMockMode) return
    await supabase!.from(SUPABASE_CONFIG.TABLES.MESSAGES)
      .update({ reactions: msg.reactions }).eq('id', messageId)
  }

  // ---- Suscripción Realtime ----
  function subscribe(roomId: string): void {
    if (isMockMode || !supabase) return
    unsubscribe()
    channel = supabase
      .channel(REALTIME_CHANNELS.room(roomId))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: SUPABASE_CONFIG.TABLES.MESSAGES, filter: `room_id=eq.${roomId}` }, async (payload) => {
        const row = payload.new as Record<string, unknown>
        // Enriquecer con datos del sender
        const { data: sender } = await supabase!.from(SUPABASE_CONFIG.TABLES.USERS)
          .select('id,username,display_name,avatar_url,role,is_verified,last_seen_at').eq('id', row.sender_id).single()
        const msg = _mapRow({ ...row, sender_username: sender?.username, sender_display_name: sender?.display_name, sender_avatar_url: sender?.avatar_url, sender_role: sender?.role })
        if (!messages.value[roomId]) messages.value[roomId] = []
        // Evitar duplicados (el optimista ya está)
        const exists = messages.value[roomId].some(m => m.id === msg.id || m.localId === msg.id)
        if (!exists) messages.value[roomId].push(msg)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: SUPABASE_CONFIG.TABLES.MESSAGES, filter: `room_id=eq.${roomId}` }, (payload) => {
        const row = payload.new as Record<string, unknown>
        const list = messages.value[roomId]
        if (!list) return
        const idx = list.findIndex(m => m.id === row.id)
        if (idx >= 0) {
          list[idx] = { ...list[idx], content: row.content as string, isEdited: row.is_edited as boolean, isDeleted: row.is_deleted as boolean, reactions: (row.reactions ?? {}) as Record<string, string[]> }
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, username, isTyping } = payload as { userId: string; username: string; isTyping: boolean }
        const authStore = useAuthStore()
        if (userId === authStore.userId) return
        if (!typing.value[roomId]) typing.value[roomId] = new Set()
        if (isTyping) {
          typing.value[roomId].add(username)
        } else {
          typing.value[roomId].delete(username)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        onlineCount.value = Object.keys(channel!.presenceState()).length
      })
      .subscribe()
  }

  function unsubscribe(): void {
    if (channel) { channel.unsubscribe(); channel = null }
    if (typingTimeout) clearTimeout(typingTimeout)
  }

  async function broadcastTyping(roomId: string, isTyping: boolean): Promise<void> {
    const authStore = useAuthStore()
    if (isMockMode || !channel || !authStore.user) return
    if (typingTimeout) clearTimeout(typingTimeout)
    await channel.send({ type: 'broadcast', event: 'typing', payload: { userId: authStore.userId, username: authStore.user.username, isTyping } })
    if (isTyping) typingTimeout = setTimeout(() => broadcastTyping(roomId, false), APP_CONFIG.TYPING_TIMEOUT_MS)
  }

  function clearRoom(roomId: string): void {
    delete messages.value[roomId]
    delete hasMore.value[roomId]
    delete typing.value[roomId]
    unsubscribe()
  }

  // ---- Mapper ----
  function _mapRow(row: Record<string, unknown>): Message {
    const sender: PublicUser | undefined = row.sender_username ? {
      id: row.sender_id as string, username: row.sender_username as string,
      displayName: (row.sender_display_name as string) ?? (row.sender_username as string),
      avatarUrl: (row.sender_avatar_url as string | null) ?? null,
      bio: null, city: null, country: null,
      role: (row.sender_role as PublicUser['role']) ?? 'user',
      isVerified: false, lastSeenAt: null, onlineStatus: 'online',
    } : undefined
    return {
      id: row.id as string, roomId: row.room_id as string,
      senderId: row.sender_id as string, content: (row.content as string) ?? '',
      type: (row.type as Message['type']) ?? 'text',
      replyToId: (row.reply_to_id as string | null) ?? null,
      isEdited: (row.is_edited as boolean) ?? false,
      isDeleted: (row.is_deleted as boolean) ?? false,
      deletedAt: (row.deleted_at as string | null) ?? null,
      reactions: (row.reactions as Record<string, string[]>) ?? {},
      createdAt: row.created_at as string, updatedAt: (row.updated_at as string) ?? row.created_at as string,
      sender,
    }
  }

  return {
    messages, loading, sending, hasMore, typing, onlineCount,
    fetchMessages, sendMessage, editMessage, deleteMessage, toggleReaction,
    subscribe, unsubscribe, broadcastTyping, clearRoom,
  }
})
