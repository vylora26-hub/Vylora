// ============================================================
// NOTIFICATIONS STORE — Notificaciones in-app
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useAuthStore } from './auth'
import type { Notification } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  let channel: RealtimeChannel | null = null

  // ---- Computed ----
  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.isRead).length,
  )

  // ---- Acciones ----

  async function fetchNotifications(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    loading.value = true

    try {
      if (isMockMode) {
        notifications.value = []
        return
      }

      const { data, error } = await supabase!
        .from(SUPABASE_CONFIG.TABLES.NOTIFICATIONS)
        .select('*')
        .eq('user_id', authStore.userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      notifications.value = (data ?? []).map(_mapRow)
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target || target.isRead) return
    target.isRead = true

    if (!isMockMode && supabase) {
      await supabase
        .from(SUPABASE_CONFIG.TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('id', id)
    }
  }

  async function markAllAsRead(): Promise<void> {
    const authStore = useAuthStore()
    notifications.value.forEach((n) => { n.isRead = true })

    if (!isMockMode && supabase && authStore.userId) {
      await supabase.rpc('mark_all_notifications_read', {
        p_user_id: authStore.userId,
      })
    }
  }

  /** Suscripción Realtime para notificaciones nuevas */
  function subscribe(): void {
    const authStore = useAuthStore()
    if (!authStore.userId || isMockMode || !supabase) return

    channel = supabase
      .channel(`notifications:${authStore.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: SUPABASE_CONFIG.TABLES.NOTIFICATIONS,
          filter: `user_id=eq.${authStore.userId}`,
        },
        (payload) => {
          notifications.value.unshift(_mapRow(payload.new as Record<string, unknown>))
        },
      )
      .subscribe()
  }

  function unsubscribe(): void {
    if (channel) {
      channel.unsubscribe()
      channel = null
    }
  }

  // ---- Mapper ----
  function _mapRow(row: Record<string, unknown>): Notification {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      type: row.type as Notification['type'],
      title: row.title as string,
      body: row.body as string,
      data: (row.data as Record<string, string>) ?? {},
      isRead: row.is_read as boolean,
      createdAt: row.created_at as string,
    }
  }

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribe,
    unsubscribe,
  }
})
