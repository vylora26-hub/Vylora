// ============================================================
// DM STORE — Mensajes directos en tiempo real
// ============================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG, APP_CONFIG } from '@/config'
import { sanitizeText } from '@/utils/sanitize'
import { generateLocalId } from '@/utils/generateId'
import { useAuthStore } from './auth'
import type { DirectConversation, DirectMessage, PublicUser } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

const MOCK_CONVS: DirectConversation[] = []

export const useDmStore = defineStore('dm', () => {
  const conversations = ref<DirectConversation[]>([])
  const messages      = ref<Record<string, DirectMessage[]>>({})
  const loading       = ref(false)
  const sending       = ref(false)
  const typing        = ref<Record<string, boolean>>({})
  const hasMore       = ref<Record<string, boolean>>({})

  let channel: RealtimeChannel | null = null

  // ---- Conversations ----
  async function fetchConversations(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    loading.value = true
    try {
      if (isMockMode) { conversations.value = MOCK_CONVS; return }
      const uid = authStore.userId
      const { data } = await supabase!
        .from(SUPABASE_CONFIG.TABLES.DIRECT_CONVERSATIONS)
        .select('*, user1:users!direct_conversations_user1_id_fkey(id,username,display_name,avatar_url,role,is_verified,last_seen_at), user2:users!direct_conversations_user2_id_fkey(id,username,display_name,avatar_url,role,is_verified,last_seen_at)')
        .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
      if (!data) return
      conversations.value = data.map((row: Record<string, unknown>) => _mapConv(row, uid))
    } finally { loading.value = false }
  }

  async function getOrCreateConversation(otherUserId: string): Promise<string | null> {
    const authStore = useAuthStore()
    if (!authStore.userId) return null
    if (isMockMode) {
      const mockId = `conv_${Date.now()}`
      return mockId
    }
    const { data, error } = await supabase!.rpc('get_or_create_conversation', {
      p_user1: authStore.userId, p_user2: otherUserId,
    })
    if (error) return null
    return data as string
  }

  // ---- Messages ----
  async function fetchMessages(convId: string, cursor?: string): Promise<void> {
    loading.value = true
    try {
      if (isMockMode) { if (!messages.value[convId]) messages.value[convId] = []; return }
      const { data } = await supabase!
        .from(SUPABASE_CONFIG.TABLES.DIRECT_MESSAGES)
        .select('*, sender:users!direct_messages_sender_id_fkey(id,username,display_name,avatar_url,role,is_verified,last_seen_at)')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(APP_CONFIG.MESSAGES_PER_PAGE)
        .returns<Record<string, unknown>[]>()
      const page = (data ?? []).map(_mapMessage).reverse()
      if (cursor) messages.value[convId] = [...page, ...(messages.value[convId] ?? [])]
      else messages.value[convId] = page
      hasMore.value[convId] = page.length === APP_CONFIG.MESSAGES_PER_PAGE
    } finally { loading.value = false }
  }

  async function sendMessage(convId: string, content: string): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.user) return
    sending.value = true
    const localId = generateLocalId()
    const optimistic: DirectMessage = {
      id: localId, localId, conversationId: convId,
      senderId: authStore.userId!,
      content: sanitizeText(content), type: 'text',
      replyToId: null, isEdited: false, isDeleted: false, readAt: null, reactions: {},
      createdAt: new Date().toISOString(), status: 'sending',
      sender: { id: authStore.user.id, username: authStore.user.username, displayName: authStore.user.displayName, avatarUrl: authStore.user.avatarUrl, bio: null, city: null, country: null, role: authStore.user.role, isVerified: authStore.user.isVerified, lastSeenAt: null, onlineStatus: 'online' },
    }
    if (!messages.value[convId]) messages.value[convId] = []
    messages.value[convId].push(optimistic)

    try {
      if (isMockMode) { optimistic.status = 'sent'; sending.value = false; return }
      const { data, error } = await supabase!.from(SUPABASE_CONFIG.TABLES.DIRECT_MESSAGES)
        .insert({ conversation_id: convId, sender_id: authStore.userId, content: sanitizeText(content) })
        .select('id').single()
      if (error || !data) { optimistic.status = 'failed' }
      else { optimistic.id = data.id; optimistic.status = 'sent' }
    } catch { optimistic.status = 'failed' }
    finally { sending.value = false }
  }

  async function markRead(convId: string): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId || isMockMode || !supabase) return
    await supabase.rpc('mark_dm_read', { p_conversation_id: convId, p_reader_id: authStore.userId })
    // Actualizar localmente
    const msgs = messages.value[convId] ?? []
    msgs.forEach(m => { if (m.senderId !== authStore.userId && !m.readAt) m.readAt = new Date().toISOString() })
    // Limpiar badge
    const conv = conversations.value.find(c => c.id === convId)
    if (conv) conv.unreadCount = 0
  }

  // ---- Realtime ----
  function subscribe(convId: string): void {
    if (isMockMode || !supabase) return
    unsubscribe()
    const authStore = useAuthStore()
    channel = supabase.channel(`dm:${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: SUPABASE_CONFIG.TABLES.DIRECT_MESSAGES, filter: `conversation_id=eq.${convId}` }, async (payload) => {
        const row = payload.new as Record<string, unknown>
        if (row.sender_id === authStore.userId) return // ya está como optimista
        const { data: sender } = await supabase!.from(SUPABASE_CONFIG.TABLES.USERS).select('id,username,display_name,avatar_url,role,is_verified').eq('id', row.sender_id).single()
        const msg = _mapMessage({ ...row, sender })
        if (!messages.value[convId]) messages.value[convId] = []
        messages.value[convId].push(msg)
        // Auto-leer si estamos en la conversación
        markRead(convId)
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, isTyping } = payload as { userId: string; isTyping: boolean }
        if (userId !== authStore.userId) typing.value[convId] = isTyping
      })
      .subscribe()
  }

  function unsubscribe(): void {
    if (channel) { channel.unsubscribe(); channel = null }
  }

  async function broadcastTyping(_convId: string, isTyping: boolean): Promise<void> {
    const authStore = useAuthStore()
    if (isMockMode || !channel) return
    await channel.send({ type: 'broadcast', event: 'typing', payload: { userId: authStore.userId, isTyping } })
  }

  // ---- Mappers ----
  function _mapUser(row: Record<string, unknown>): PublicUser {
    return { id: row.id as string, username: row.username as string, displayName: (row.display_name as string) ?? (row.username as string), avatarUrl: (row.avatar_url as string | null) ?? null, bio: null, city: null, country: null, role: (row.role as PublicUser['role']) ?? 'user', isVerified: (row.is_verified as boolean) ?? false, lastSeenAt: null, onlineStatus: 'offline' }
  }

  function _mapConv(row: Record<string, unknown>, myId: string): DirectConversation {
    const other = (row.user1_id === myId ? row.user2 : row.user1) as Record<string, unknown>
    return { id: row.id as string, user1Id: row.user1_id as string, user2Id: row.user2_id as string, createdAt: row.created_at as string, lastMessageAt: (row.last_message_at as string | null) ?? null, otherUser: other ? _mapUser(other) : undefined, unreadCount: 0 }
  }

  function _mapMessage(row: Record<string, unknown>): DirectMessage {
    const senderRaw = row.sender as Record<string, unknown> | undefined
    return { id: row.id as string, conversationId: row.conversation_id as string, senderId: row.sender_id as string, content: (row.content as string) ?? '', type: (row.type as DirectMessage['type']) ?? 'text', replyToId: (row.reply_to_id as string | null) ?? null, isEdited: (row.is_edited as boolean) ?? false, isDeleted: (row.is_deleted as boolean) ?? false, readAt: (row.read_at as string | null) ?? null, reactions: (row.reactions as Record<string, string[]>) ?? {}, createdAt: row.created_at as string, sender: senderRaw ? _mapUser(senderRaw) : undefined }
  }

  return { conversations, messages, loading, sending, typing, hasMore, fetchConversations, getOrCreateConversation, fetchMessages, sendMessage, markRead, subscribe, unsubscribe, broadcastTyping }
})
