<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomsStore } from '@/stores/rooms'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const router    = useRouter()
const roomsStore = useRoomsStore()
const authStore  = useAuthStore()
const notifStore = useNotificationsStore()

onMounted(async () => {
  await Promise.all([
    roomsStore.fetchRooms({ featured: false }),
    roomsStore.fetchCategories(),
  ])
})

const hour = new Date().getHours()
const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
</script>

<template>
  <div class="home-page">

    <!-- Hero de bienvenida -->
    <section class="home-page__hero">
      <div class="home-page__hero-bg" aria-hidden="true">
        <div class="home-page__hero-blob home-page__hero-blob--1" />
        <div class="home-page__hero-blob home-page__hero-blob--2" />
      </div>
      <div class="home-page__hero-content">
        <AppAvatar
          :src="authStore.user?.avatarUrl"
          :name="authStore.user?.displayName"
          size="lg"
          :show-status="true"
          status="online"
        />
        <div>
          <h1 class="home-page__greeting">
            {{ greeting }}, <span class="home-page__name">{{ authStore.user?.displayName ?? 'bienvenido' }}</span>
          </h1>
          <p class="home-page__sub">
            <span v-if="notifStore.unreadCount > 0" class="home-page__notif-hint">
              Tienes {{ notifStore.unreadCount }} notificación{{ notifStore.unreadCount > 1 ? 'es' : '' }} sin leer.
            </span>
            <span v-else>Todo al día.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Accesos rápidos -->
    <section class="home-page__quick" aria-labelledby="quick-title">
      <div class="home-page__quick-grid">
        <button class="home-page__quick-card" @click="router.push('/app/rooms')">
          <div class="home-page__quick-icon home-page__quick-icon--indigo" aria-hidden="true">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <span class="home-page__quick-label">Salas</span>
          <span class="home-page__quick-count">{{ roomsStore.rooms.length }}</span>
        </button>
        <button class="home-page__quick-card" @click="router.push('/app/dm')">
          <div class="home-page__quick-icon home-page__quick-icon--violet" aria-hidden="true">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </div>
          <span class="home-page__quick-label">Mensajes</span>
        </button>
        <button class="home-page__quick-card" @click="router.push('/app/friends')">
          <div class="home-page__quick-icon home-page__quick-icon--pink" aria-hidden="true">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <span class="home-page__quick-label">Amigos</span>
        </button>
        <button class="home-page__quick-card" @click="router.push('/app/notifications')">
          <div class="home-page__quick-icon home-page__quick-icon--amber" aria-hidden="true">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </div>
          <span class="home-page__quick-label">Notificaciones</span>
          <span v-if="notifStore.unreadCount" class="home-page__quick-badge">{{ notifStore.unreadCount }}</span>
        </button>
      </div>
    </section>

    <!-- Salas activas -->
    <section class="home-page__section" aria-labelledby="rooms-title">
      <div class="home-page__section-header">
        <h2 id="rooms-title" class="home-page__section-title">Salas activas</h2>
        <AppButton variant="ghost" size="sm" @click="router.push('/app/rooms')">Ver todas</AppButton>
      </div>

      <!-- Skeletons -->
      <div v-if="roomsStore.loading" class="home-page__rooms-grid">
        <div v-for="i in 4" :key="i" class="home-room-skeleton">
          <AppSkeleton height="0.875rem" width="55%" />
          <AppSkeleton height="0.75rem" width="35%" />
          <AppSkeleton height="0.75rem" width="40%" />
        </div>
      </div>

      <div v-else-if="roomsStore.rooms.length" class="home-page__rooms-grid">
        <button
          v-for="room in roomsStore.rooms.slice(0, 6)"
          :key="room.id"
          class="home-room-card"
          @click="router.push(`/app/room/${room.slug}`)"
        >
          <div class="home-room-card__header">
            <div class="home-room-card__icon" aria-hidden="true">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <div class="home-room-card__badges">
              <AppBadge v-if="room.isVerified" variant="primary">
                <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              </AppBadge>
              <AppBadge v-if="room.isMember" variant="success">Unido</AppBadge>
            </div>
          </div>
          <h3 class="home-room-card__name">{{ room.name }}</h3>
          <p v-if="room.description" class="home-room-card__desc">{{ room.description }}</p>
          <div class="home-room-card__footer">
            <span class="home-room-card__members">
              <span class="home-room-card__dot" aria-hidden="true" />
              {{ room.memberCount }} miembro{{ room.memberCount !== 1 ? 's' : '' }}
            </span>
          </div>
        </button>
      </div>

      <AppEmptyState v-else title="Sin salas aún" description="Crea la primera sala de la plataforma." icon="chat">
        <AppButton variant="outline" size="sm" @click="router.push('/app/rooms')">Crear sala</AppButton>
      </AppEmptyState>
    </section>

  </div>
</template>

<style scoped>
.home-page { max-width: 960px; margin: 0 auto; padding-bottom: 2rem; }

/* Hero */
.home-page__hero {
  position: relative;
  overflow: hidden;
  padding: 2.25rem 2rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--cs-border);
}
.home-page__hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.home-page__hero-blob {
  position: absolute; border-radius: 50%; filter: blur(80px);
}
.home-page__hero-blob--1 { width: 400px; height: 400px; background: rgba(99,102,241,0.08); top: -100px; right: -100px; }
.home-page__hero-blob--2 { width: 300px; height: 300px; background: rgba(236,72,153,0.06); bottom: -80px; left: -80px; }

.home-page__hero-content {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 1.25rem;
}
.home-page__greeting { font-size: clamp(1.25rem, 3vw, 1.625rem); font-weight: 700; color: var(--cs-text); margin: 0; letter-spacing: -0.02em; }
.home-page__name { color: var(--cs-primary); }
.home-page__sub { font-size: 0.875rem; color: var(--cs-text-muted); margin-top: 0.25rem; }
.home-page__notif-hint { color: #f59e0b; }

/* Quick cards */
.home-page__quick { padding: 1.25rem 2rem; border-bottom: 1px solid var(--cs-border); }
.home-page__quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.875rem; }

.home-page__quick-card {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 1rem 0.5rem;
  background: var(--cs-surface); border: 1px solid var(--cs-border);
  border-radius: 0.875rem; cursor: pointer;
  position: relative;
  transition: border-color 0.15s, transform 0.15s;
}
.home-page__quick-card:hover { border-color: var(--cs-primary); transform: translateY(-2px); }

.home-page__quick-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.home-page__quick-icon--indigo { background: rgba(99,102,241,0.12); color: #6366f1; }
.home-page__quick-icon--violet { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.home-page__quick-icon--pink   { background: rgba(236,72,153,0.12); color: #ec4899; }
.home-page__quick-icon--amber  { background: rgba(245,158,11,0.12); color: #f59e0b; }

.home-page__quick-label { font-size: 0.8125rem; font-weight: 500; color: var(--cs-text-secondary); }
.home-page__quick-count { font-size: 0.75rem; color: var(--cs-text-muted); }
.home-page__quick-badge {
  position: absolute; top: 8px; right: 8px;
  min-width: 18px; height: 18px; padding: 0 4px;
  border-radius: 9px; background: var(--cs-primary);
  color: #fff; font-size: 0.6875rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* Salas */
.home-page__section { padding: 1.75rem 2rem; }
.home-page__section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.125rem; }
.home-page__section-title  { font-size: 1.0625rem; font-weight: 700; color: var(--cs-text); }

.home-page__rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.875rem; }

.home-room-skeleton { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.875rem; padding: 1.125rem; display: flex; flex-direction: column; gap: 0.5rem; }

.home-room-card {
  background: var(--cs-surface); border: 1px solid var(--cs-border);
  border-radius: 0.875rem; padding: 1.125rem;
  cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 0.375rem;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.home-room-card:hover { border-color: var(--cs-primary); transform: translateY(-2px); box-shadow: var(--cs-shadow-sm); }

.home-room-card__header { display: flex; align-items: center; justify-content: space-between; }
.home-room-card__icon { width: 30px; height: 30px; border-radius: 7px; background: var(--cs-primary-subtle); color: var(--cs-primary); display: flex; align-items: center; justify-content: center; }
.home-room-card__badges { display: flex; gap: 0.25rem; }
.home-room-card__name  { font-size: 0.9375rem; font-weight: 700; color: var(--cs-text); }
.home-room-card__desc  { font-size: 0.8125rem; color: var(--cs-text-muted); line-height: 1.45; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.home-room-card__footer{ margin-top: auto; padding-top: 0.5rem; border-top: 1px solid var(--cs-border); }
.home-room-card__members{ display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: var(--cs-text-muted); }
.home-room-card__dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

@media (max-width: 767px) {
  .home-page__hero { padding: 1.5rem; }
  .home-page__quick { padding: 1rem 1.25rem; }
  .home-page__quick-grid { grid-template-columns: repeat(2, 1fr); }
  .home-page__section { padding: 1.5rem 1.25rem; }
}
</style>
