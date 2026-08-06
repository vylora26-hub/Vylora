<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useUiStore } from '@/stores/ui'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { Ban } from '@/types'

const uiStore   = useUiStore()
const bans      = ref<Ban[]>([])
const loading   = ref(false)
const unbanTarget = ref<Ban | null>(null)
const showModal   = ref(false)

const MOCK: Ban[] = [
  { id: 'b1', userId: 'u3', bannedBy: 'admin', reason: 'Spam repetido', expiresAt: null, createdAt: new Date().toISOString() },
]

onMounted(async () => {
  loading.value = true
  try {
    if (isMockMode) { bans.value = MOCK; return }
    const { data } = await supabase!.from(SUPABASE_CONFIG.TABLES.BANS).select('*').order('created_at', { ascending: false })
    bans.value = (data ?? []) as Ban[]
  } finally { loading.value = false }
})

async function confirmUnban() {
  if (!unbanTarget.value) return
  if (!isMockMode && supabase) {
    await supabase.from(SUPABASE_CONFIG.TABLES.BANS).delete().eq('id', unbanTarget.value.id)
    await supabase.from(SUPABASE_CONFIG.TABLES.USERS).update({ is_banned: false }).eq('id', unbanTarget.value.userId)
  }
  bans.value = bans.value.filter(b => b.id !== unbanTarget.value!.id)
  uiStore.toast.success('Usuario desbaneado')
  showModal.value = false
}

const isActive = (ban: Ban) => !ban.expiresAt || new Date(ban.expiresAt) > new Date()
</script>

<template>
  <div class="admin-bans">
    <div v-if="loading" class="admin-bans__list">
      <div v-for="i in 3" :key="i" class="admin-bans__skeleton">
        <AppSkeleton width="55%" height="0.875rem" />
        <AppSkeleton width="40%" height="0.75rem" />
      </div>
    </div>

    <div v-else-if="bans.length" class="admin-bans__list">
      <div v-for="ban in bans" :key="ban.id" class="admin-bans__card">
        <div class="admin-bans__info">
          <div class="admin-bans__user">
            <span class="admin-bans__userid">User: {{ ban.userId.slice(0, 8) }}…</span>
            <span class="admin-bans__type" :class="{ 'admin-bans__type--permanent': !ban.expiresAt }">
              {{ ban.expiresAt ? 'Temporal' : 'Permanente' }}
            </span>
          </div>
          <p class="admin-bans__reason">{{ ban.reason }}</p>
          <p v-if="ban.expiresAt" class="admin-bans__expires">
            Expira: {{ new Date(ban.expiresAt).toLocaleString('es') }}
          </p>
          <p class="admin-bans__date">Baneado: {{ new Date(ban.createdAt).toLocaleDateString('es') }}</p>
        </div>
        <AppButton v-if="isActive(ban)" variant="secondary" size="sm" @click="unbanTarget = ban; showModal = true">Desbanear</AppButton>
      </div>
    </div>

    <AppEmptyState v-else title="Sin baneos activos" description="No hay usuarios baneados en este momento." icon="lock" />

    <AppModal v-model="showModal" title="Desbanear usuario" description="¿Confirmas que quieres levantar el baneo?" confirm-label="Desbanear" @confirm="confirmUnban" />
  </div>
</template>

<style scoped>
.admin-bans__list { display: flex; flex-direction: column; gap: 0.75rem; }
.admin-bans__skeleton { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.admin-bans__card { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; background: var(--cs-surface); border: 1px solid rgba(239,68,68,0.2); border-radius: 0.875rem; flex-wrap: wrap; }
.admin-bans__info { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
.admin-bans__user { display: flex; align-items: center; gap: 0.625rem; }
.admin-bans__userid { font-size: 0.875rem; font-weight: 600; color: var(--cs-text); font-family: monospace; }
.admin-bans__type   { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background: rgba(245,158,11,0.1); color: #f59e0b; font-weight: 600; }
.admin-bans__type--permanent { background: rgba(239,68,68,0.1); color: #ef4444; }
.admin-bans__reason  { font-size: 0.875rem; color: var(--cs-text-secondary); }
.admin-bans__expires { font-size: 0.8125rem; color: var(--cs-text-muted); }
.admin-bans__date    { font-size: 0.75rem; color: var(--cs-text-muted); }
</style>
