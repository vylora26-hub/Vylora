<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { AdminStats } from '@/types'

const stats   = ref<AdminStats | null>(null)
const loading = ref(true)

const MOCK: AdminStats = {
  totalUsers: 142, activeUsers24h: 38, totalRooms: 12,
  activeRooms24h: 7, totalMessages24h: 1847, pendingReports: 3, activeBans: 2,
}

// Datos simulados para las barras de los últimos 7 días
const dailyMessages = ref([320, 480, 210, 670, 540, 920, 1847])
const dailyUsers    = ref([12, 18, 9, 25, 20, 31, 38])
const days          = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy']

onMounted(async () => {
  try {
    if (isMockMode) { stats.value = MOCK; return }
    const { data } = await supabase!.rpc('get_admin_stats')
    stats.value = data as AdminStats
  } finally { loading.value = false }
})

const maxMessages = computed(() => Math.max(...dailyMessages.value, 1))
const maxUsers    = computed(() => Math.max(...dailyUsers.value, 1))

function barHeight(val: number, max: number) {
  return `${Math.round((val / max) * 100)}%`
}

const statCards = [
  { key: 'totalUsers',       label: 'Usuarios totales',  color: '#6366f1', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { key: 'activeUsers24h',   label: 'Activos (24h)',      color: '#22c55e', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'totalRooms',       label: 'Salas activas',      color: '#3b82f6', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { key: 'totalMessages24h', label: 'Mensajes (24h)',     color: '#8b5cf6', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'pendingReports',   label: 'Reportes pendientes', color: '#f59e0b', icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
  { key: 'activeBans',       label: 'Baneos activos',     color: '#ef4444', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
]
</script>

<template>
  <div class="stats-page">

    <!-- Stat cards -->
    <div class="stats-page__cards">
      <div
        v-for="card in statCards" :key="card.key"
        class="stat-card"
        :style="{ '--card-color': card.color }"
      >
        <div class="stat-card__icon" aria-hidden="true">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" :d="card.icon" />
          </svg>
        </div>
        <div class="stat-card__body">
          <p class="stat-card__label">{{ card.label }}</p>
          <p class="stat-card__value">
            <AppSkeleton v-if="loading" width="52px" height="1.75rem" />
            <template v-else>{{ stats?.[card.key as keyof AdminStats] ?? 0 }}</template>
          </p>
        </div>
        <!-- Barra de acento -->
        <div class="stat-card__accent" aria-hidden="true" />
      </div>
    </div>

    <!-- Gráfico de mensajes 7 días -->
    <div class="stats-chart">
      <div class="stats-chart__header">
        <h2 class="stats-chart__title">Mensajes — últimos 7 días</h2>
        <span class="stats-chart__total">
          Total: {{ dailyMessages.reduce((a, b) => a + b, 0).toLocaleString() }}
        </span>
      </div>
      <div class="stats-chart__area" role="img" :aria-label="`Gráfico de mensajes: ${dailyMessages.join(', ')}`">
        <div
          v-for="(val, i) in dailyMessages" :key="i"
          class="bar-col"
        >
          <span class="bar-col__val">{{ val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val }}</span>
          <div class="bar-col__track">
            <div
              class="bar-col__fill bar-col__fill--messages"
              :style="{ height: barHeight(val, maxMessages) }"
            />
          </div>
          <span class="bar-col__label">{{ days[i] }}</span>
        </div>
      </div>
    </div>

    <!-- Gráfico de usuarios activos 7 días -->
    <div class="stats-chart">
      <div class="stats-chart__header">
        <h2 class="stats-chart__title">Usuarios activos — últimos 7 días</h2>
        <span class="stats-chart__total">Pico: {{ Math.max(...dailyUsers) }}</span>
      </div>
      <div class="stats-chart__area" role="img" :aria-label="`Gráfico de usuarios: ${dailyUsers.join(', ')}`">
        <div
          v-for="(val, i) in dailyUsers" :key="i"
          class="bar-col"
        >
          <span class="bar-col__val">{{ val }}</span>
          <div class="bar-col__track">
            <div
              class="bar-col__fill bar-col__fill--users"
              :style="{ height: barHeight(val, maxUsers) }"
            />
          </div>
          <span class="bar-col__label">{{ days[i] }}</span>
        </div>
      </div>
    </div>

    <!-- Métricas de salud -->
    <div class="stats-health">
      <h2 class="stats-chart__title" style="margin-bottom:1rem">Salud de la plataforma</h2>
      <div class="stats-health__grid">
        <div
          v-for="metric in healthMetrics" :key="metric.label"
          class="health-metric"
        >
          <div class="health-metric__top">
            <span class="health-metric__label">{{ metric.label }}</span>
            <span class="health-metric__value" :style="{ color: metric.color }">{{ metric.value }}</span>
          </div>
          <div class="health-metric__bar-track">
            <div
              class="health-metric__bar-fill"
              :style="{ width: metric.pct + '%', background: metric.color }"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
const healthMetrics = [
  { label: 'Tasa de retención',       value: '74%',  pct: 74, color: '#22c55e' },
  { label: 'Mensajes / usuario / día', value: '12.4', pct: 62, color: '#6366f1' },
  { label: 'Salas con actividad',      value: '58%',  pct: 58, color: '#3b82f6' },
  { label: 'Reportes resueltos',       value: '91%',  pct: 91, color: '#8b5cf6' },
]
</script>

<style scoped>
.stats-page { display: flex; flex-direction: column; gap: 1.75rem; }

/* ---- Cards ---- */
.stats-page__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.125rem 1rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  overflow: hidden;
  transition: border-color 0.15s;
}
.stat-card:hover { border-color: var(--card-color, var(--cs-primary)); }

.stat-card__icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--card-color) 12%, transparent);
  color: var(--card-color);
}

.stat-card__label { font-size: 0.75rem; color: var(--cs-text-muted); font-weight: 500; margin-bottom: 0.25rem; }
.stat-card__value { font-size: 1.75rem; font-weight: 800; color: var(--cs-text); line-height: 1; letter-spacing: -0.03em; }

.stat-card__accent {
  position: absolute;
  top: 0; left: 0;
  width: 3px; height: 100%;
  background: var(--card-color);
  border-radius: 3px 0 0 3px;
}

/* ---- Charts ---- */
.stats-chart {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 1rem;
  padding: 1.5rem;
}

.stats-chart__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stats-chart__title { font-size: 1rem; font-weight: 700; color: var(--cs-text); }
.stats-chart__total { font-size: 0.8125rem; color: var(--cs-text-muted); }

.stats-chart__area {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 180px;
  padding-top: 1.5rem;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  height: 100%;
}

.bar-col__val {
  font-size: 0.6875rem;
  color: var(--cs-text-muted);
  font-weight: 600;
  min-height: 1rem;
  display: flex;
  align-items: flex-end;
}

.bar-col__track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: var(--cs-surface-2);
  border-radius: 4px 4px 0 0;
}

.bar-col__fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-height: 4px;
}

.bar-col__fill--messages { background: linear-gradient(to top, #6366f1, #8b5cf6); }
.bar-col__fill--users    { background: linear-gradient(to top, #22c55e, #4ade80); }

.bar-col__label {
  font-size: 0.6875rem;
  color: var(--cs-text-muted);
  font-weight: 500;
  white-space: nowrap;
}

/* ---- Health metrics ---- */
.stats-health {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 1rem;
  padding: 1.5rem;
}

.stats-health__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.health-metric { display: flex; flex-direction: column; gap: 0.5rem; }
.health-metric__top { display: flex; align-items: center; justify-content: space-between; }
.health-metric__label { font-size: 0.875rem; color: var(--cs-text-secondary); font-weight: 500; }
.health-metric__value { font-size: 0.9375rem; font-weight: 700; }
.health-metric__bar-track { height: 6px; background: var(--cs-surface-2); border-radius: 9999px; overflow: hidden; }
.health-metric__bar-fill  { height: 100%; border-radius: 9999px; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
