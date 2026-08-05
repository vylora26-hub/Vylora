<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="home-page">
    <header class="home-page__header">
      <div>
        <h1 class="home-page__title">
          Hola, {{ authStore.user?.displayName ?? 'bienvenido' }} 👋
        </h1>
        <p class="home-page__subtitle">¿Qué quieres explorar hoy?</p>
      </div>
    </header>

    <!-- Salas destacadas — placeholder hasta Fase 3 -->
    <section class="home-page__section" aria-labelledby="featured-title">
      <h2 id="featured-title" class="home-page__section-title">Salas destacadas</h2>
      <div class="home-page__grid">
        <div v-for="i in 6" :key="i" class="home-page__room-skeleton">
          <AppSkeleton height="140px" />
          <AppSkeleton width="60%" height="1rem" />
          <AppSkeleton width="40%" height="0.85rem" />
        </div>
      </div>
    </section>

    <!-- Actividad reciente -->
    <section class="home-page__section" aria-labelledby="recent-title">
      <h2 id="recent-title" class="home-page__section-title">Actividad reciente</h2>
      <div class="home-page__list">
        <div v-for="i in 4" :key="i" class="home-page__activity-skeleton">
          <AppSkeleton width="40px" height="40px" :circle="true" />
          <div style="flex:1">
            <AppSkeleton width="50%" height="0.875rem" />
            <AppSkeleton width="75%" height="0.75rem" style="margin-top:0.375rem" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page { padding: 1.75rem; max-width: 960px; margin: 0 auto; }

.home-page__header {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home-page__title    { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.home-page__subtitle { font-size: 0.9375rem; color: var(--cs-text-muted); margin-top: 0.25rem; }

.home-page__section       { margin-bottom: 2.5rem; }
.home-page__section-title { font-size: 1.0625rem; font-weight: 600; color: var(--cs-text); margin-bottom: 1rem; }

.home-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.home-page__room-skeleton { display: flex; flex-direction: column; gap: 0.5rem; }

.home-page__list          { display: flex; flex-direction: column; gap: 0.875rem; }

.home-page__activity-skeleton {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.75rem;
}
</style>
