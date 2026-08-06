// ============================================================
// FRIENDS STORE — Amistades, solicitudes y bloqueos
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useAuthStore } from './auth'
import type { Friendship, PublicUser } from '@/types'

export const useFriendsStore = defineStore('friends', () => {
  const friends = ref<Friendship[]>([])
  const pending = ref<Friendship[]>([])
  const sent = ref<Friendship[]>([])
  const loading = ref(false)
  const searchResults = ref<PublicUser[]>([])

  const friendIds = computed(() =>
    friends.value.filter(f => f.status === 'accepted').map(f => f.otherUser?.id).filter(Boolean)
  )

  async function fetchFriends(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    loading.value = true
    try {
      if (isMockMode) { friends.value = []; pending.value = []; sent.value = []; return }
      const uid = authStore.userId
      const { data } = await supabase!
        .from(SUPABASE_CONFIG.TABLES.FRIENDSHIPS)
        .select('*, requester:users!friendships_requester_id_fkey(id,username,display_name,avatar_url,role,is_verified,last_seen_at), addressee:users!friendships_addressee_id_fkey(id,username,display_name,avatar_url,role,is_verified,last_seen_at)')
        .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
        .order('created_at', { ascending: false })
      if (!data) return
      const all: Friendship[] = data.map((row: Record<string, unknown>) => _mapFriendship(row, uid))
      friends.value = all.filter(f => f.status === 'accepted')
      pending.value = all.filter(f => f.status === 'pending' && f.addresseeId === uid)
      sent.value    = all.filter(f => f.status === 'pending' && f.requesterId === uid)
    } finally { loading.value = false }
  }

  async function sendRequest(toUserId: string): Promise<boolean> {
    const authStore = useAuthStore()
    if (!authStore.userId) return false
    if (isMockMode) return true
    const { error } = await supabase!.from(SUPABASE_CONFIG.TABLES.FRIENDSHIPS)
      .insert({ requester_id: authStore.userId, addressee_id: toUserId })
    return !error
  }

  async function acceptRequest(friendshipId: string): Promise<void> {
    if (!isMockMode) {
      await supabase!.from(SUPABASE_CONFIG.TABLES.FRIENDSHIPS)
        .update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', friendshipId)
    }
    const f = pending.value.find(f => f.id === friendshipId)
    if (f) { f.status = 'accepted'; friends.value.unshift(f); pending.value = pending.value.filter(p => p.id !== friendshipId) }
  }

  async function rejectRequest(friendshipId: string): Promise<void> {
    if (!isMockMode) {
      await supabase!.from(SUPABASE_CONFIG.TABLES.FRIENDSHIPS)
        .update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', friendshipId)
    }
    pending.value = pending.value.filter(f => f.id !== friendshipId)
  }

  async function removeFriend(friendshipId: string): Promise<void> {
    if (!isMockMode) {
      await supabase!.from(SUPABASE_CONFIG.TABLES.FRIENDSHIPS).delete().eq('id', friendshipId)
    }
    friends.value = friends.value.filter(f => f.id !== friendshipId)
  }

  async function searchUsers(query: string): Promise<void> {
    const authStore = useAuthStore()
    if (!query.trim()) { searchResults.value = []; return }
    if (isMockMode) {
      searchResults.value = [{ id: 'u_search', username: query, displayName: query, avatarUrl: null, bio: null, city: null, country: null, role: 'user', isVerified: false, lastSeenAt: null, onlineStatus: 'offline' }]
      return
    }
    const { data } = await supabase!.from(SUPABASE_CONFIG.TABLES.USERS)
      .select('id,username,display_name,avatar_url,role,is_verified,last_seen_at')
      .ilike('username', `%${query}%`).neq('id', authStore.userId).limit(10)
    searchResults.value = (data ?? []).map(_mapUser)
  }

  function _mapUser(row: Record<string, unknown>): PublicUser {
    return { id: row.id as string, username: row.username as string, displayName: (row.display_name as string) ?? (row.username as string), avatarUrl: (row.avatar_url as string | null) ?? null, bio: null, city: null, country: null, role: (row.role as PublicUser['role']) ?? 'user', isVerified: (row.is_verified as boolean) ?? false, lastSeenAt: (row.last_seen_at as string | null) ?? null, onlineStatus: 'offline' }
  }

  function _mapFriendship(row: Record<string, unknown>, myId: string): Friendship {
    const isRequester = row.requester_id === myId
    const otherRaw = isRequester ? row.addressee as Record<string, unknown> : row.requester as Record<string, unknown>
    return { id: row.id as string, requesterId: row.requester_id as string, addresseeId: row.addressee_id as string, status: row.status as Friendship['status'], createdAt: row.created_at as string, updatedAt: (row.updated_at as string) ?? (row.created_at as string), otherUser: otherRaw ? _mapUser(otherRaw) : undefined }
  }

  return { friends, pending, sent, loading, searchResults, friendIds, fetchFriends, sendRequest, acceptRequest, rejectRequest, removeFriend, searchUsers }
})
