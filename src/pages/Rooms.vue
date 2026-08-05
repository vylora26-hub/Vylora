<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const search = ref('')
const loading = ref(false)
</script>

<template>
  <div class="rooms-page">
    <!-- Header -->
    <header class="rooms-page__header">
      <div>
        <h1 class="rooms-page__title">Salas</h1>
        <p class="rooms-page__subtitle">Explora y únete a conversaciones.</p>
      </div>
      <AppButton variant="primary" size="sm">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nueva sala
      </AppButton>
    </header>

    <!-- Búsqueda -->
    <div class="rooms-page__search">
      <AppInput
        v-model="search"
        placeholder="Buscar salas..."
        type="search"
        autocomplete="off"
      />
    </div>

    <!-- Categorías -->
    <div class="rooms-page__categories" role="list" aria-label="Categorías">
      <button
        v-for="cat in categories"
        :key="cat"
        class="rooms-page__cat-btn"
        role="listitem"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Grid de salas -->
    <div v-if="loading" class="rooms-page__grid">
      <div v-for="i in 9" :key="i" class="rooms-page__skeleton">
        <AppSkeleton height="100px" />
        <AppSkeleton width="55%" height="1rem" />
        <AppSkeleton width="35%" height="0.8rem" />
      </div>
    </div>

    <AppEmptyState
      v-else
      title="Las salas llegarán pronto"
      description="Esta sección se implementará en la Fase 3 con chat en tiempo real."
      icon="chat"
    >
      <AppButton variant="outline" size="sm">Crear primera sala</AppButton>
    </AppEmptyState>
  </div>
</template>

<script lang="ts">
const categories = ['Todas', 'General', 'Tecnología', 'Gaming', 'Música', 'Arte', 'Deportes']
</script>

<style scoped>
.rooms-page           { padding: 1.75rem; max-width: 1080px; margin: 0 auto; }
.rooms-page__header   { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
.rooms-page__title    { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.rooms-page__subtitle { font-size: 0.9375rem; color: var(--cs-text-muted); margin-top: 0.25rem; }
.rooms-page__search   { margin-bottom: 1rem; max-width: 400px; }

.rooms-page__categories {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.rooms-page__cat-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  border: 1px solid var(--cs-border);
  background: var(--cs-surface);
  color: var(--cs-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.rooms-page__cat-btn:hover,
.rooms-page__cat-btn.is-active {
  background: var(--cs-primary-subtle);
  color: var(--cs-primary);
  border-color: var(--cs-primary);
}

.rooms-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.rooms-page__skeleton { display: flex; flex-direction: column; gap: 0.5rem; }
</style>
