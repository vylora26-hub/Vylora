// ============================================================
// usePresence — Presencia en tiempo real por sala
// ============================================================

import { ref, onUnmounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
  userId: string
  username: string
  avatarUrl: string | null
  online_at: string
}

export function usePresence(roomId: string) {
  const onlineUsers = ref<PresenceUser[]>([])
  const onlineCount = ref(0)
  let channel: RealtimeChannel | null = null

  function subscribe() {
    if (isMockMode || !supabase) {
      onlineCount.value = Math.floor(Math.random() * 15) + 1
      return
    }

    const authStore = useAuthStore()
    channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: authStore.userId ?? 'anon' } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel!.presenceState<PresenceUser>()
        onlineUsers.value = Object.values(state).flat()
        onlineCount.value = onlineUsers.value.length
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        onlineUsers.value.push(...(newPresences as unknown as PresenceUser[]))
        onlineCount.value = onlineUsers.value.length
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = (leftPresences as unknown as PresenceUser[]).map(p => p.userId)
        onlineUsers.value = onlineUsers.value.filter(u => !leftIds.includes(u.userId))
        onlineCount.value = onlineUsers.value.length
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && authStore.user) {
          await channel!.track({
            userId: authStore.user.id,
            username: authStore.user.username,
            avatarUrl: authStore.user.avatarUrl,
            online_at: new Date().toISOString(),
          })
        }
      })
  }

  function unsubscribe() {
    if (channel) { channel.unsubscribe(); channel = null }
    onlineUsers.value = []
    onlineCount.value = 0
  }

  onUnmounted(unsubscribe)

  return { onlineUsers, onlineCount, subscribe, unsubscribe }
}
