<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const authStore = useAuthStore()
const uiStore   = useUiStore()

// ---- Sesiones activas ----
interface ActiveSession {
  id: string
  device_type: string
  browser: string | null
  os: string | null
  country: string | null
  city: string | null
  ip_masked: string | null
  is_current: boolean
  last_seen_at: string
  created_at: string
}

const sessions       = ref<ActiveSession[]>([])
const loadingSessions = ref(false)
const revokeTarget   = ref<ActiveSession | null>(null)
const showRevokeModal = ref(false)
const revoking       = ref(false)
const revokingAll    = ref(false)
const showRevokeAllModal = ref(false)

// ---- Resumen de seguridad de la cuenta ----
const securityScore = ref(0)
const securityItems = ref<{ label: string; done: boolean; tip: string }[]>([])

// Dispositivos mock para desarrollo
const MOCK_SESSIONS: ActiveSession[] = [
  { id: 's1', device_type: 'desktop', browser: 'Chrome', os: 'Windows', country: 'CO', city: 'Bogotá',    ip_masked: '181.55.XXX.XXX', is_current: true,  last_seen_at: new Date().toISOString(),                         created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 's2', device_type: 'mobile',  browser: 'Safari', os: 'iOS',     country: 'CO', city: 'Medellín',  ip_masked: '190.24.XXX.XXX', is_current: false, last_seen_at: new Date(Date.now() - 86400000).toISOString(),  created_at: new Date(Date.now() - 172800000).toISOString() },
]

const deviceIcons: Record<string, string> = {
  desktop: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  mobile:  'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  tablet:  'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  unknown: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
}

const countryNames: Record<string, string> = {
  CO: 'Colombia', US: 'EE.UU.', MX: 'México', ES: 'España', AR: 'Argentina',
  VE: 'Venezuela', PE: 'Perú', CL: 'Chile', EC: 'Ecuador', BR: 'Brasil',
}

function getCountryName(country: string | null) {
  if (!country) return 'Desconocida'
  return countryNames[country.toUpperCase()] ?? country
}

function formatLastSeen(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000)      return 'Ahora mismo'
  if (diff < 3600000)    return `Hace ${Math.floor(diff/60000)} min`
  if (diff < 86400000)   return `Hace ${Math.floor(diff/3600000)} h`
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

onMounted(async () => {
  await loadSessions()
  buildSecurityScore()
})

async function loadSessions() {
  loadingSessions.value = true
  try {
    if (isMockMode) { sessions.value = MOCK_SESSIONS; return }
    const { data } = await supabase!.rpc('get_active_sessions')
    sessions.value = (data ?? []) as ActiveSession[]
  } finally { loadingSessions.value = false }
}

async function revokeSession() {
  if (!revokeTarget.value) return
  revoking.value = true
  try {
    if (!isMockMode && supabase) {
      await supabase.rpc('revoke_session', { p_session_id: revokeTarget.value.id })
    }
    sessions.value = sessions.value.filter(s => s.id !== revokeTarget.value!.id)
    uiStore.toast.success('Sesión cerrada correctamente')
    showRevokeModal.value = false
  } catch { uiStore.toast.error('No se pudo cerrar la sesión') }
  finally { revoking.value = false }
}

async function revokeAllSessions() {
  revokingAll.value = true
  try {
    const others = sessions.value.filter(s => !s.is_current)
    if (!isMockMode && supabase) {
      for (const s of others) {
        await supabase.rpc('revoke_session', { p_session_id: s.id })
      }
    }
    sessions.value = sessions.value.filter(s => s.is_current)
    uiStore.toast.success('Todas las otras sesiones fueron cerradas')
    showRevokeAllModal.value = false
  } catch { uiStore.toast.error('Error al cerrar sesiones') }
  finally { revokingAll.value = false }
}

function buildSecurityScore() {
  const user = authStore.user
  const items = [
    { label: 'Nombre visible configurado',     done: !!user?.displayName && user.displayName !== user.username, tip: 'Agrega un nombre visible en tu perfil.' },
    { label: 'Foto de perfil agregada',        done: !!user?.avatarUrl,  tip: 'Agregar una foto ayuda a que otros confíen más en ti.' },
    { label: 'Biografía completada',           done: !!user?.bio,        tip: 'Cuéntales algo sobre ti en tu perfil.' },
    { label: 'Ciudad o país configurados',     done: !!(user?.city || user?.country), tip: 'Tu ubicación general (nunca exacta) genera más confianza.' },
    { label: 'Cuenta verificada',              done: !!user?.isVerified, tip: 'Solicita verificación al equipo de Vylora.' },
  ]
  securityItems.value = items
  const done  = items.filter(i => i.done).length
  securityScore.value = Math.round((done / items.length) * 100)
}

const scoreColor = (score: number) =>
  score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'

const scoreLabel = (score: number) =>
  score >= 80 ? 'Perfil confiable' : score >= 50 ? 'Perfil parcial' : 'Perfil incompleto'
</script>

<template>
  <div class="security-page">
    <header class="security-page__header">
      <div>
        <h1 class="security-page__title">Seguridad</h1>
        <p class="security-page__sub">Controla tu cuenta y mantente protegido.</p>
      </div>
    </header>

    <!-- ===== Puntuación de seguridad del perfil ===== -->
    <section class="security-page__section" aria-labelledby="score-title">
      <h2 id="score-title" class="security-page__section-title">Confianza de tu perfil</h2>
      <div class="security-card">
        <div class="security-score">
          <!-- Círculo de progreso CSS -->
          <div
            class="security-score__ring"
            :style="{ '--score': securityScore, '--color': scoreColor(securityScore) }"
            role="progressbar"
            :aria-valuenow="securityScore"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Puntuación de confianza: ${securityScore}%`"
          >
            <span class="security-score__value">{{ securityScore }}%</span>
          </div>
          <div class="security-score__info">
            <p class="security-score__label" :style="{ color: scoreColor(securityScore) }">
              {{ scoreLabel(securityScore) }}
            </p>
            <p class="security-score__desc">
              Un perfil completo genera más confianza en la comunidad y reduce las sospechas de estafa.
            </p>
          </div>
        </div>

        <!-- Checklist de perfil -->
        <ul class="security-checklist" role="list">
          <li
            v-for="item in securityItems"
            :key="item.label"
            class="security-checklist__item"
            :class="{ 'is-done': item.done }"
            role="listitem"
          >
            <span class="security-checklist__icon" aria-hidden="true">
              <svg v-if="item.done" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#22c55e" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <svg v-else width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="9"/>
              </svg>
            </span>
            <div class="security-checklist__body">
              <span class="security-checklist__label">{{ item.label }}</span>
              <span v-if="!item.done" class="security-checklist__tip">{{ item.tip }}</span>
            </div>
            <AppBadge v-if="item.done" variant="success" class="security-checklist__badge">Completado</AppBadge>
            <AppBadge v-else variant="default" class="security-checklist__badge">Pendiente</AppBadge>
          </li>
        </ul>
      </div>
    </section>

    <!-- ===== Sesiones activas ===== -->
    <section class="security-page__section" aria-labelledby="sessions-title">
      <div class="security-page__section-header">
        <h2 id="sessions-title" class="security-page__section-title">Sesiones activas</h2>
        <AppButton
          v-if="sessions.filter(s => !s.is_current).length > 1"
          variant="danger"
          size="xs"
          @click="showRevokeAllModal = true"
        >
          Cerrar todas las otras
        </AppButton>
      </div>

      <p class="security-page__sessions-desc">
        Estos son los dispositivos donde está activa tu cuenta. Si ves alguno que no reconoces, ciérralo inmediatamente.
      </p>

      <!-- Skeletons -->
      <div v-if="loadingSessions" class="security-sessions">
        <div v-for="i in 2" :key="i" class="session-skeleton">
          <AppSkeleton width="40px" height="40px" :circle="false" />
          <div style="flex:1">
            <AppSkeleton width="50%" height="0.875rem" />
            <AppSkeleton width="35%" height="0.75rem" style="margin-top:0.35rem" />
          </div>
        </div>
      </div>

      <div v-else-if="sessions.length" class="security-sessions">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-card"
          :class="{ 'session-card--current': session.is_current }"
        >
          <!-- Ícono de dispositivo -->
          <div class="session-card__icon" :class="{ 'session-card__icon--current': session.is_current }" aria-hidden="true">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="deviceIcons[session.device_type] ?? deviceIcons.unknown" />
            </svg>
          </div>

          <!-- Información -->
          <div class="session-card__info">
            <div class="session-card__top">
              <span class="session-card__device">
                {{ session.browser ?? 'Navegador desconocido' }} en {{ session.os ?? 'SO desconocido' }}
              </span>
              <AppBadge v-if="session.is_current" variant="success">Este dispositivo</AppBadge>
            </div>
            <div class="session-card__meta">
              <span class="session-card__location">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ [session.city, getCountryName(session.country)].filter(Boolean).join(', ') || 'Ubicación desconocida' }}
              </span>
              <span class="session-card__sep" aria-hidden="true">·</span>
              <span class="session-card__ip">{{ session.ip_masked ?? '—' }}</span>
              <span class="session-card__sep" aria-hidden="true">·</span>
              <time class="session-card__time" :datetime="session.last_seen_at">
                {{ formatLastSeen(session.last_seen_at) }}
              </time>
            </div>
          </div>

          <!-- Botón cerrar sesión -->
          <AppButton
            v-if="!session.is_current"
            variant="danger"
            size="xs"
            @click="revokeTarget = session; showRevokeModal = true"
          >
            Cerrar
          </AppButton>
        </div>
      </div>

      <AppEmptyState v-else title="Sin sesiones registradas" description="No hay sesiones activas registradas para tu cuenta." icon="lock" />
    </section>

    <!-- ===== Consejos de seguridad ===== -->
    <section class="security-page__section" aria-labelledby="tips-title">
      <h2 id="tips-title" class="security-page__section-title">Cómo protegerte de estafas</h2>
      <div class="security-tips">
        <div v-for="tip in SECURITY_TIPS" :key="tip.title" class="security-tip">
          <div class="security-tip__icon" aria-hidden="true">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="tip.path" />
            </svg>
          </div>
          <div class="security-tip__body">
            <p class="security-tip__title">{{ tip.title }}</p>
            <p class="security-tip__desc">{{ tip.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal: confirmar revocar una sesión -->
    <AppModal
      v-model="showRevokeModal"
      title="Cerrar sesión"
      :description="`¿Cerrar la sesión de ${revokeTarget?.browser} en ${revokeTarget?.city ?? 'ubicación desconocida'}?`"
      confirm-label="Sí, cerrar sesión"
      variant="danger"
      :loading="revoking"
      @confirm="revokeSession"
    />

    <!-- Modal: confirmar revocar todas -->
    <AppModal
      v-model="showRevokeAllModal"
      title="Cerrar todas las otras sesiones"
      description="Se cerrarán todas las sesiones excepto la actual. Tendrás que volver a iniciar sesión en esos dispositivos."
      confirm-label="Cerrar todas"
      variant="danger"
      :loading="revokingAll"
      @confirm="revokeAllSessions"
    />
  </div>
</template>

<script lang="ts">
const SECURITY_TIPS = [
  { title: 'Nunca envíes dinero',            desc: 'Ningún usuario legítimo de Vylora te pedirá dinero, gift cards ni transferencias bancarias.', path: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { title: 'No compartas contraseñas',       desc: 'Vylora nunca te pedirá tu contraseña por mensajes. Si alguien lo hace, es una estafa.',       path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { title: 'Cuidado con links acortados',    desc: 'Los links de bit.ly, tinyurl y similares pueden ocultar sitios de phishing.',                  path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { title: 'Verifica las cuentas nuevas',    desc: 'Las cuentas con el badge "Cuenta nueva" llevan menos de 30 días. Actúa con más precaución.',   path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { title: 'Revisa tus sesiones',             desc: 'Entra regularmente a esta página y cierra cualquier sesión que no reconozcas.',                 path: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { title: 'Reporta comportamientos raros',  desc: 'Si alguien te pide información personal o actúa de forma sospechosa, usa el botón Reportar.', path: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
]
</script>

<style scoped>
.security-page          { padding: 1.75rem; max-width: 720px; margin: 0 auto; }
.security-page__header  { margin-bottom: 2rem; }
.security-page__title   { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.security-page__sub     { font-size: 0.9rem; color: var(--cs-text-muted); margin-top: 0.25rem; }

.security-page__section { margin-bottom: 2rem; }
.security-page__section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; flex-wrap: wrap; gap: 0.5rem; }
.security-page__section-title  { font-size: 0.875rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.security-page__sessions-desc  { font-size: 0.875rem; color: var(--cs-text-muted); margin-bottom: 1rem; line-height: 1.5; }

/* ---- Score ---- */
.security-card {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.security-score {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

/* Círculo de progreso con cónico CSS */
.security-score__ring {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color) calc(var(--score) * 1%),
    var(--cs-surface-2) 0%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.security-score__ring::before {
  content: '';
  position: absolute;
  width: 62px; height: 62px;
  border-radius: 50%;
  background: var(--cs-surface);
}

.security-score__value {
  position: relative;
  z-index: 1;
  font-size: 1rem;
  font-weight: 800;
  color: var(--cs-text);
}

.security-score__label { font-size: 1rem; font-weight: 700; color: var(--cs-text); margin: 0; }
.security-score__desc  { font-size: 0.8125rem; color: var(--cs-text-muted); line-height: 1.5; max-width: 380px; }

/* ---- Checklist ---- */
.security-checklist      { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; }
.security-checklist__item{
  display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0;
  border-bottom: 1px solid var(--cs-border);
}
.security-checklist__item:last-child { border-bottom: none; }
.security-checklist__item.is-done .security-checklist__label { color: var(--cs-text); }
.security-checklist__icon { flex-shrink: 0; margin-top: 2px; width: 16px; }
.security-checklist__body { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.security-checklist__label{ font-size: 0.9rem; font-weight: 500; color: var(--cs-text-secondary); }
.security-checklist__tip  { font-size: 0.8125rem; color: var(--cs-text-muted); }
.security-checklist__badge{ flex-shrink: 0; }

/* ---- Sesiones ---- */
.security-sessions { display: flex; flex-direction: column; gap: 0.625rem; }
.session-skeleton  {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem; background: var(--cs-surface);
  border: 1px solid var(--cs-border); border-radius: 0.75rem;
}

.session-card {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: var(--cs-surface); border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  transition: border-color 0.15s;
  flex-wrap: wrap;
}
.session-card--current { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.03); }

.session-card__icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--cs-surface-2);
  color: var(--cs-text-muted);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.session-card__icon--current { background: rgba(34,197,94,0.1); color: #22c55e; }

.session-card__info  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
.session-card__top   { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.session-card__device{ font-size: 0.9375rem; font-weight: 600; color: var(--cs-text); }
.session-card__meta  { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.session-card__location { font-size: 0.8125rem; color: var(--cs-text-muted); }
.session-card__sep   { color: var(--cs-border-strong); }
.session-card__ip    { font-size: 0.75rem; color: var(--cs-text-muted); font-family: monospace; }
.session-card__time  { font-size: 0.75rem; color: var(--cs-text-muted); }

/* ---- Consejos ---- */
.security-tips { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.875rem; }
.security-tip  {
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 1rem;
  background: var(--cs-surface); border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
}
.security-tip__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--cs-primary-subtle);
  color: var(--cs-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}
.security-tip__title { font-size: 0.9rem; font-weight: 700; color: var(--cs-text); margin-bottom: 0.25rem; }
.security-tip__desc  { font-size: 0.8125rem; color: var(--cs-text-muted); line-height: 1.5; }
</style>
