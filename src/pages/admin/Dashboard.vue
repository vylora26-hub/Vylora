<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { AdminStats } from '@/types'

const stats = ref<AdminStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  if (isMockMode) {
    stats.value = { totalUsers: 42, activeUsers24h: 8, totalRooms: 5, activeRooms24h: 3, totalMessages24h: 127, pendingReports: 2, activeBans: 1 }
  } else {
    const { data } = await supabase!.rpc('get_admin_stats')
    stats.value = data as AdminStats
  }
  loading.value = false
})

const statCards = [
  { key: 'totalUsers',       label: 'Usuarios totales',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'indigo' },
  { key: 'activeUsers24h',   label: 'Activos (24h)',         icon: 'M13 10V3L4 14h7v7l9-11h-7z',                                                                                    color: 'green'  },
  { key: 'totalRooms',       label: 'Salas activas',         icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'blue'  },
  { key: 'totalMessages24h', label: 'Mensajes (24h)',        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',        color: 'purple' },
  { key: 'pendingReports',   label: 'Reportes pendientes',   icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'yellow' },
  { key: 'activeBans',       label: 'Baneos activos',        icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',               color: 'red'    },
]
</script>

<template>
  <div class="admin-dashboard">
    <div class="admin-dashboard__grid">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="admin-dashboard__card"
        :class="`admin-dashboard__card--${card.color}`"
      >
        <div class="admin-dashboard__card-icon" aria-hidden="true">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" :d="card.icon" />
          </svg>
        </div>
        <div>
          <p class="admin-dashboard__card-label">{{ card.label }}</p>
          <p class="admin-dashboard__card-value">
            <AppSkeleton v-if="loading" width="48px" height="1.5rem" />
            <template v-else>{{ stats?.[card.key as keyof AdminStats] ?? 0 }}</template>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard { }
.admin-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.admin-dashboard__card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  transition: border-color 0.15s;
}

.admin-dashboard__card-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* Color variants */
.admin-dashboard__card--indigo .admin-dashboard__card-icon { background: rgba(99,102,241,0.12); color: #6366f1; }
.admin-dashboard__card--green  .admin-dashboard__card-icon { background: rgba(34,197,94,0.12);  color: #22c55e; }
.admin-dashboard__card--blue   .admin-dashboard__card-icon { background: rgba(59,130,246,0.12); color: #3b82f6; }
.admin-dashboard__card--purple .admin-dashboard__card-icon { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.admin-dashboard__card--yellow .admin-dashboard__card-icon { background: rgba(245,158,11,0.12); color: #f59e0b; }
.admin-dashboard__card--red    .admin-dashboard__card-icon { background: rgba(239,68,68,0.12);  color: #ef4444; }

.admin-dashboard__card-label { font-size: 0.8125rem; color: var(--cs-text-muted); margin-bottom: 0.25rem; }
.admin-dashboard__card-value { font-size: 1.625rem; font-weight: 700; color: var(--cs-text); }
</style>
