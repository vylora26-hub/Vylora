<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import type { AuditLog } from '@/types'

const logs    = ref<AuditLog[]>([])
const loading = ref(false)

const MOCK: AuditLog[] = [
  { id: 'l1', actorId: 'admin', action: 'user.ban',      targetType: 'user',    targetId: 'u1', metadata: { reason: 'Spam' },     ip: '127.0.0.1', createdAt: new Date().toISOString() },
  { id: 'l2', actorId: 'admin', action: 'message.delete', targetType: 'message', targetId: 'm1', metadata: {},                    ip: '127.0.0.1', createdAt: new Date().toISOString() },
  { id: 'l3', actorId: 'admin', action: 'report.resolve', targetType: 'report',  targetId: 'r1', metadata: {},                    ip: '127.0.0.1', createdAt: new Date().toISOString() },
]

onMounted(async () => {
  loading.value = true
  try {
    if (isMockMode) { logs.value = MOCK; return }
    const { data } = await supabase!.from(SUPABASE_CONFIG.TABLES.AUDIT_LOGS).select('*').order('created_at', { ascending: false }).limit(100)
    logs.value = (data ?? []) as AuditLog[]
  } finally { loading.value = false }
})

const actionColors: Partial<Record<AuditLog['action'], string>> = {
  'user.ban': 'danger', 'user.unban': 'success', 'user.role_change': 'warning',
  'message.delete': 'warning', 'room.delete': 'danger', 'room.archive': 'default',
  'report.resolve': 'success', 'report.dismiss': 'default',
}
</script>

<template>
  <div class="admin-logs">
    <div v-if="loading" class="admin-logs__list">
      <div v-for="i in 5" :key="i" class="admin-logs__skeleton">
        <AppSkeleton width="100px" height="0.875rem" />
        <AppSkeleton width="55%" height="0.75rem" />
      </div>
    </div>

    <div v-else-if="logs.length" class="admin-logs__list" role="list">
      <div v-for="log in logs" :key="log.id" class="admin-logs__entry" role="listitem">
        <div class="admin-logs__entry-left">
          <AppBadge :variant="(actionColors[log.action] as any) ?? 'default'" class="admin-logs__action">{{ log.action }}</AppBadge>
          <span class="admin-logs__target">{{ log.targetType }}:{{ log.targetId.slice(0, 8) }}</span>
        </div>
        <div class="admin-logs__entry-right">
          <span class="admin-logs__ip">{{ log.ip }}</span>
          <time class="admin-logs__time" :datetime="log.createdAt">{{ new Date(log.createdAt).toLocaleString('es') }}</time>
        </div>
      </div>
    </div>

    <AppEmptyState v-else title="Sin registros" description="Las acciones de moderación aparecerán aquí." icon="inbox" />
  </div>
</template>

<style scoped>
.admin-logs__list    { display: flex; flex-direction: column; gap: 0.375rem; }
.admin-logs__skeleton{ background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.5rem; padding: 0.875rem; display: flex; flex-direction: column; gap: 0.4rem; }
.admin-logs__entry   { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.625rem; flex-wrap: wrap; }
.admin-logs__entry-left  { display: flex; align-items: center; gap: 0.625rem; }
.admin-logs__entry-right { display: flex; align-items: center; gap: 0.875rem; flex-shrink: 0; }
.admin-logs__action  { font-family: monospace; font-size: 0.75rem; }
.admin-logs__target  { font-size: 0.8125rem; color: var(--cs-text-muted); font-family: monospace; }
.admin-logs__ip      { font-size: 0.75rem; color: var(--cs-text-muted); }
.admin-logs__time    { font-size: 0.75rem; color: var(--cs-text-muted); white-space: nowrap; }
</style>
