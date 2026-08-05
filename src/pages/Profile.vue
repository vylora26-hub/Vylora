<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="profile-page">
    <!-- Cover -->
    <div class="profile-page__cover" aria-hidden="true" />

    <div class="profile-page__content">
      <!-- Avatar + acciones -->
      <div class="profile-page__top">
        <AppAvatar
          :src="authStore.user?.avatarUrl"
          :name="authStore.user?.displayName"
          size="xl"
          :show-status="true"
          status="online"
          class="profile-page__avatar"
        />
        <div class="profile-page__actions">
          <RouterLink to="/app/settings">
            <AppButton variant="secondary" size="sm">Editar perfil</AppButton>
          </RouterLink>
        </div>
      </div>

      <!-- Info -->
      <div class="profile-page__info">
        <div class="profile-page__name-row">
          <h1 class="profile-page__name">{{ authStore.user?.displayName }}</h1>
          <AppBadge v-if="authStore.user?.isVerified" variant="primary">
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Verificado
          </AppBadge>
          <AppBadge v-if="authStore.isAdmin" variant="danger">Admin</AppBadge>
          <AppBadge v-else-if="authStore.isModerator" variant="warning">Mod</AppBadge>
        </div>

        <p class="profile-page__username">@{{ authStore.user?.username }}</p>

        <p v-if="authStore.user?.bio" class="profile-page__bio">
          {{ authStore.user.bio }}
        </p>

        <div class="profile-page__meta">
          <span v-if="authStore.user?.city || authStore.user?.country" class="profile-page__meta-item">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ [authStore.user?.city, authStore.user?.country].filter(Boolean).join(', ') }}
          </span>
          <span v-if="authStore.user?.createdAt" class="profile-page__meta-item">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Se unió en {{ new Date(authStore.user.createdAt).toLocaleDateString('es', { month: 'long', year: 'numeric' }) }}
          </span>
        </div>
      </div>

      <!-- Stats -->
      <div class="profile-page__stats" role="list" aria-label="Estadísticas de perfil">
        <div v-for="stat in stats" :key="stat.label" class="profile-page__stat" role="listitem">
          <span class="profile-page__stat-value">{{ stat.value }}</span>
          <span class="profile-page__stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const stats = [
  { label: 'Mensajes',  value: '0' },
  { label: 'Amigos',    value: '0' },
  { label: 'Salas',     value: '0' },
]
</script>

<style scoped>
.profile-page { max-width: 700px; margin: 0 auto; }

.profile-page__cover {
  height: 160px;
  background: linear-gradient(135deg, var(--cs-primary), var(--cs-accent));
  opacity: 0.7;
}

.profile-page__content { padding: 0 1.75rem 2rem; }

.profile-page__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: -36px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.profile-page__avatar {
  outline: 4px solid var(--cs-bg);
}

.profile-page__info    { margin-bottom: 1.5rem; }

.profile-page__name-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.profile-page__name    { font-size: 1.375rem; font-weight: 700; color: var(--cs-text); }
.profile-page__username{ font-size: 0.9375rem; color: var(--cs-text-muted); margin-bottom: 0.75rem; }

.profile-page__bio {
  font-size: 0.9375rem;
  color: var(--cs-text-secondary);
  line-height: 1.6;
  margin-bottom: 0.875rem;
  max-width: 480px;
}

.profile-page__meta     { display: flex; gap: 1.25rem; flex-wrap: wrap; }
.profile-page__meta-item{
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.875rem; color: var(--cs-text-muted);
}

.profile-page__stats {
  display: flex;
  gap: 1.75rem;
  padding: 1.25rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
}

.profile-page__stat       { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
.profile-page__stat-value { font-size: 1.25rem; font-weight: 700; color: var(--cs-text); }
.profile-page__stat-label { font-size: 0.8125rem; color: var(--cs-text-muted); }
</style>
