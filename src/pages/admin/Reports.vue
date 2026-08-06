<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useUiStore } from '@/stores/ui'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import type { Report } from '@/types'

const uiStore  = useUiStore()
const reports  = ref<Report[]>([])
const loading  = ref(false)
const updating = ref<Record<string, boolean>>({})

const MOCK: Report[] = [
  { id: 'r1', reporterId: 'u1', targetType: 'message', targetId: 'm1', reason: 'Contenido inapropiado', details: null, status: 'pending', resolvedBy: null, createdAt: new Date().toISOString() },
  { id: 'r2', reporterId: 'u2', targetType: 'user',    targetId: 'u3', reason: 'Spam',                  details: 'Enviando publicidad',  status: 'reviewing', resolvedBy: null, createdAt: new Date().toISOString() },
]

onMounted(async () => {
  loading.value = true
  try {
    if (isMockMode) { reports.value = MOCK; return }
    const { data } = await supabase!.from(SUPABASE_CONFIG.TABLES.REPORTS).select('*').order('created_at', { ascending: false }).limit(50)
    reports.value = (data ?? []) as Report[]
  } finally { loading.value = false }
})

async function updateStatus(id: string, status: Report['status']) {
  updating.value[id] = true
  try {
    if (!isMockMode && supabase) await supabase.from(SUPABASE_CONFIG.TABLES.REPORTS).update({ status }).eq('id', id)
    const r = reports.value.find(r => r.id === id)
    if (r) r.status = status
    uiStore.toast.success('Reporte actualizado')
  } finally { delete updating.value[id] }
}

const statusColors: Record<Report['status'], string> = { pending: 'warning', reviewing: 'primary', resolved: 'success', dismissed: 'default' }
const targetTypeLabels: Record<Report['targetType'], string> = { message: 'Mensaje', user: 'Usuario', room: 'Sala' }
</script>

<template>
  <div class="admin-reports">
    <div v-if="loading" class="admin-reports__list">
      <div v-for="i in 4" :key="i" class="admin-reports__skeleton">
        <AppSkeleton width="60%" height="0.875rem" />
        <AppSkeleton width="40%" height="0.75rem" />
      </div>
    </div>

    <div v-else-if="reports.length" class="admin-reports__list">
      <div v-for="r in reports" :key="r.id" class="admin-reports__card">
        <div class="admin-reports__card-header">
          <div class="admin-reports__badges">
            <AppBadge :variant="(statusColors[r.status] as any)">{{ r.status }}</AppBadge>
            <AppBadge variant="default">{{ targetTypeLabels[r.targetType] }}</AppBadge>
          </div>
          <span class="admin-reports__date">{{ new Date(r.createdAt).toLocaleDateString('es') }}</span>
        </div>
        <p class="admin-reports__reason"><strong>Motivo:</strong> {{ r.reason }}</p>
        <p v-if="r.details" class="admin-reports__details">{{ r.details }}</p>
        <div v-if="r.status === 'pending' || r.status === 'reviewing'" class="admin-reports__actions">
          <AppButton variant="primary" size="xs" :loading="updating[r.id]" @click="updateStatus(r.id, 'resolved')">Resolver</AppButton>
          <AppButton variant="secondary" size="xs" :loading="updating[r.id]" @click="updateStatus(r.id, 'reviewing')">Revisar</AppButton>
          <AppButton variant="ghost" size="xs" :loading="updating[r.id]" @click="updateStatus(r.id, 'dismissed')">Desestimar</AppButton>
        </div>
      </div>
    </div>

    <AppEmptyState v-else title="Sin reportes pendientes" description="Todos los reportes han sido atendidos." icon="bell" />
  </div>
</template>

<style scoped>
.admin-reports__list { display: flex; flex-direction: column; gap: 0.875rem; }
.admin-reports__skeleton { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.admin-reports__card { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.875rem; padding: 1.125rem; display: flex; flex-direction: column; gap: 0.625rem; }
.admin-reports__card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
.admin-reports__badges { display: flex; gap: 0.375rem; }
.admin-reports__date   { font-size: 0.8125rem; color: var(--cs-text-muted); }
.admin-reports__reason { font-size: 0.9rem; color: var(--cs-text); }
.admin-reports__details{ font-size: 0.8125rem; color: var(--cs-text-muted); }
.admin-reports__actions{ display: flex; gap: 0.5rem; flex-wrap: wrap; }
</style>
