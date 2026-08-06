<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'
import { useDmStore } from '@/stores/dm'
import { useUiStore } from '@/stores/ui'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { PublicUser } from '@/types'

const props = defineProps<{ username: string }>()

const router       = useRouter()
const authStore    = useAuthStore()
const friendsStore = useFriendsStore()
const dmStore      = useDmStore()
const uiStore      = useUiStore()

const profile    = ref<PublicUser | null>(null)
const loading    = ref(true)
const notFound   = ref(false)
const sendingReq = ref(false)
const startingDm = ref(false)

const isOwnProfile = computed(() => authStore.user?.username === props.username)
const isFriend     = computed(() => friendsStore.friendIds.includes(profile.value?.id ?? ''))
const alreadySent  = computed(() => friendsStore.sent.some(f => f.otherUser?.id === profile.value?.id))

const stats = computed(() => [
  { label: 'Miembro desde', value: profile.value?.lastSeenAt ? new Date(profile.value.lastSeenAt).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : '—' },
  { label: 'Estado', value: profile.value?.onlineStatus === 'online' ? 'En línea' : 'Desconectado' },
])

onMounted(async () => {
  // Redirigir a mi propio perfil si es el mismo usuario
  if (authStore.isAuthenticated && authStore.user?.username === props.username) {
    router.replace('/app/profile')
    return
  }

  await loadProfile()
  if (authStore.isAuthenticated) {
    await friendsStore.fetchFriends()
  }
})

async function loadProfile() {
  loading.value = true
  notFound.value = false
  try {
    if (isMockMode) {
      // Mock: usar resultados de búsqueda o datos básicos
      await friendsStore.searchUsers(props.username)
      const found = friendsStore.searchResults.find(u => u.username === props.username)
      if (found) { profile.value = found }
      else { notFound.value = true }
      return
    }
    const { data, error } = await supabase!
      .from(SUPABASE_CONFIG.TABLES.USERS)
      .select('id,username,display_name,avatar_url,bio,city,country,role,is_verified,last_seen_at,is_banned')
      .eq('username', props.username)
      .single()
    if (error || !data) { notFound.value = true; return }
    profile.value = {
      id: data.id, username: data.username,
      displayName: data.display_name ?? data.username,
      avatarUrl: data.avatar_url ?? null,
      bio: data.bio ?? null, city: data.city ?? null, country: data.country ?? null,
      role: data.role, isVerified: data.is_verified ?? false,
      lastSeenAt: data.last_seen_at ?? null,
      onlineStatus: 'offline',
    }
  } finally { loading.value = false }
}

async function sendFriendRequest() {
  if (!profile.value || !authStore.isAuthenticated) { router.push('/auth/login'); return }
  sendingReq.value = true
  const ok = await friendsStore.sendRequest(profile.value.id)
  sendingReq.value = false
  if (ok) uiStore.toast.success(`Solicitud enviada a @${profile.value.username}`)
  else uiStore.toast.error('No se pudo enviar la solicitud')
}

async function openDm() {
  if (!profile.value || !authStore.isAuthenticated) { router.push('/auth/login'); return }
  startingDm.value = true
  const convId = await dmStore.getOrCreateConversation(profile.value.id)
  startingDm.value = false
  if (convId) router.push(`/app/dm/${convId}`)
  else uiStore.toast.error('No se pudo abrir la conversación')
}
</script>

<template>
  <div class="user-profile">
    <!-- Loading -->
    <template v-if="loading">
      <div class="user-profile__cover" aria-hidden="true">
        <div class="user-profile__cover-gradient" />
      </div>
      <div class="user-profile__body">
        <div class="user-profile__top">
          <AppSkeleton width="80px" height="80px" :circle="true" />
          <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
            <AppSkeleton width="90px" height="32px" />
            <AppSkeleton width="90px" height="32px" />
          </div>
        </div>
        <AppSkeleton width="45%" height="1.5rem" style="margin-top:0.75rem" />
        <AppSkeleton width="25%" height="1rem" style="margin-top:0.375rem" />
        <AppSkeleton width="70%" height="0.875rem" style="margin-top:0.75rem" :lines="2" />
      </div>
    </template>

    <!-- No encontrado -->
    <div v-else-if="notFound" class="user-profile__not-found">
      <div class="user-profile__nf-icon" aria-hidden="true">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.25">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h2 class="user-profile__nf-title">Usuario no encontrado</h2>
      <p class="user-profile__nf-desc">@{{ username }} no existe o fue eliminado.</p>
      <AppButton variant="secondary" size="sm" @click="router.back()">Volver</AppButton>
    </div>

    <!-- Perfil real -->
    <template v-else-if="profile">
      <!-- Cover -->
      <div class="user-profile__cover" aria-hidden="true">
        <div class="user-profile__cover-gradient" />
      </div>

      <div class="user-profile__body">
        <!-- Top: avatar + acciones -->
        <div class="user-profile__top">
          <AppAvatar
            :src="profile.avatarUrl"
            :name="profile.displayName"
            size="xl"
            :show-status="true"
            :status="profile.onlineStatus"
            class="user-profile__avatar"
          />

          <div class="user-profile__actions" v-if="!isOwnProfile && authStore.isAuthenticated">
            <!-- Enviar mensaje directo -->
            <AppButton
              variant="primary"
              size="sm"
              :loading="startingDm"
              @click="openDm"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Mensaje
            </AppButton>

            <!-- Agregar amigo / estado solicitud -->
            <AppButton
              v-if="!isFriend && !alreadySent"
              variant="secondary"
              size="sm"
              :loading="sendingReq"
              @click="sendFriendRequest"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Agregar
            </AppButton>
            <AppBadge v-else-if="alreadySent" variant="default">Solicitud enviada</AppBadge>
            <AppBadge v-else variant="success">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Amigos
            </AppBadge>
          </div>

          <!-- No autenticado: invitar a iniciar sesión -->
          <div v-else-if="!isOwnProfile && !authStore.isAuthenticated" class="user-profile__actions">
            <AppButton variant="primary" size="sm" @click="router.push('/auth/login')">
              Inicia sesión para interactuar
            </AppButton>
          </div>
        </div>

        <!-- Info -->
        <div class="user-profile__info">
          <div class="user-profile__name-row">
            <h1 class="user-profile__name">{{ profile.displayName }}</h1>
            <AppBadge v-if="profile.isVerified" variant="primary">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Verificado
            </AppBadge>
            <AppBadge v-if="profile.role === 'admin'" variant="danger">Admin</AppBadge>
            <AppBadge v-else-if="profile.role === 'moderator'" variant="warning">Mod</AppBadge>
          </div>

          <p class="user-profile__username">@{{ profile.username }}</p>

          <p v-if="profile.bio" class="user-profile__bio">{{ profile.bio }}</p>

          <div class="user-profile__meta">
            <span v-if="profile.city || profile.country" class="user-profile__meta-item">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ [profile.city, profile.country].filter(Boolean).join(', ') }}
            </span>
            <span
              class="user-profile__meta-item"
              :class="profile.onlineStatus === 'online' ? 'user-profile__meta-item--online' : ''"
            >
              <span class="user-profile__status-dot" :class="`user-profile__status-dot--${profile.onlineStatus}`" aria-hidden="true" />
              {{ profile.onlineStatus === 'online' ? 'En línea ahora' : profile.lastSeenAt ? `Visto el ${new Date(profile.lastSeenAt).toLocaleDateString('es')}` : 'Nunca conectado' }}
            </span>
          </div>
        </div>

        <!-- Stats cards -->
        <div class="user-profile__stats" role="list" aria-label="Información del perfil">
          <div v-for="s in stats" :key="s.label" class="user-profile__stat" role="listitem">
            <span class="user-profile__stat-value">{{ s.value }}</span>
            <span class="user-profile__stat-label">{{ s.label }}</span>
          </div>
          <div v-if="isFriend" class="user-profile__stat" role="listitem">
            <span class="user-profile__stat-value" style="color:#22c55e">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </span>
            <span class="user-profile__stat-label">Son amigos</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-profile { max-width: 720px; margin: 0 auto; min-height: 100dvh; }

.user-profile__cover {
  height: 180px;
  position: relative;
  overflow: hidden;
}
.user-profile__cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  opacity: 0.65;
}

.user-profile__body { padding: 0 1.5rem 2.5rem; }

.user-profile__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: -44px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.user-profile__avatar {
  outline: 4px solid var(--cs-bg);
  border-radius: 50%;
}

.user-profile__actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.user-profile__info { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }

.user-profile__name-row { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
.user-profile__name     { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); letter-spacing: -0.02em; }
.user-profile__username { font-size: 0.9375rem; color: var(--cs-text-muted); }
.user-profile__bio      { font-size: 0.9375rem; color: var(--cs-text-secondary); line-height: 1.6; max-width: 520px; }

.user-profile__meta { display: flex; flex-wrap: wrap; gap: 1.125rem; }
.user-profile__meta-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--cs-text-muted); }
.user-profile__meta-item--online { color: #22c55e; }

.user-profile__status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.user-profile__status-dot--online  { background: #22c55e; }
.user-profile__status-dot--away    { background: #f59e0b; }
.user-profile__status-dot--offline { background: #6b7280; }

.user-profile__stats {
  display: flex;
  gap: 1.5rem;
  padding: 1.25rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  flex-wrap: wrap;
}
.user-profile__stat       { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
.user-profile__stat-value { font-size: 1.125rem; font-weight: 700; color: var(--cs-text); }
.user-profile__stat-label { font-size: 0.75rem; color: var(--cs-text-muted); }

/* Not found */
.user-profile__not-found {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 4rem 2rem; gap: 0.875rem; min-height: 60vh;
}
.user-profile__nf-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: var(--cs-surface-2); color: var(--cs-text-muted);
  display: flex; align-items: center; justify-content: center;
}
.user-profile__nf-title { font-size: 1.25rem; font-weight: 700; color: var(--cs-text); }
.user-profile__nf-desc  { font-size: 0.9rem; color: var(--cs-text-muted); }
</style>
