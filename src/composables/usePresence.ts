// ============================================================
// usePresence — Presencia en tiempo real por sala
// Respeta la configuración showOnlineStatus del usuario:
//   - Si está desactivada, el usuario NO se rastrea (aparece offline)
//   - Los demás usuarios siguen siendo visibles para él
// ============================================================

import { ref, onUnmounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useAuthStore } from '@/stores/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
  userId:   string
  username: string
  avatarUrl: string | null
  online_at: string
}

export function usePresence(roomId: string) {
  const onlineUsers = ref<PresenceUser[]>([])
  const onlineCount = ref(0)
  let channel: RealtimeChannel | null = null

  async function subscribe() {
    if (isMockMode || !supabase) {
      onlineCount.value = Math.floor(Math.random() * 15) + 1
      return
    }

    const authStore = useAuthStore()

    // ---- Leer preferencia showOnlineStatus ----
    let showOnlineStatus = true
    if (authStore.userId) {
      try {
        const { data } = await supabase
          .from(SUPABASE_CONFIG.TABLES.USER_SETTINGS)
          .select('show_online_status')
          .eq('user_id', authStore.userId)
          .single()
        if (data) showOnlineStatus = data.show_online_status ?? true
      } catch { /* fallback: mostrar online */ }
    }

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
          // Si showOnlineStatus = false → NO trackear la presencia propia
          // El usuario puede ver a otros, pero él no aparece en la lista
          if (showOnlineStatus) {
            await channel!.track({
              userId:    authStore.user.id,
              username:  authStore.user.username,
              avatarUrl: authStore.user.avatarUrl,
              online_at: new Date().toISOString(),
            })
          }
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
