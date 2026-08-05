<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const tab = ref<'friends' | 'requests' | 'blocked'>('friends')
</script>

<template>
  <div class="friends-page">
    <header class="friends-page__header">
      <h1 class="friends-page__title">Amigos</h1>
      <AppButton variant="primary" size="sm">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Añadir amigo
      </AppButton>
    </header>

    <!-- Tabs -->
    <div class="friends-page__tabs" role="tablist" aria-label="Secciones de amigos">
      <button
        v-for="t in tabs"
        :key="t.key"
        role="tab"
        class="friends-page__tab"
        :class="{ 'is-active': tab === t.key }"
        :aria-selected="tab === t.key"
        @click="tab = t.key as typeof tab"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Contenido -->
    <div role="tabpanel">
      <AppEmptyState
        :title="emptyTitles[tab]"
        :description="emptyDescs[tab]"
        icon="users"
      >
        <AppButton v-if="tab === 'friends'" variant="outline" size="sm">Buscar personas</AppButton>
      </AppEmptyState>
    </div>
  </div>
</template>

<script lang="ts">
const tabs = [
  { key: 'friends',  label: 'Amigos'     },
  { key: 'requests', label: 'Solicitudes' },
  { key: 'blocked',  label: 'Bloqueados'  },
]

const emptyTitles = {
  friends:  'Aún no tienes amigos',
  requests: 'Sin solicitudes pendientes',
  blocked:  'No hay usuarios bloqueados',
}

const emptyDescs = {
  friends:  'El sistema de amigos se implementa en la Fase 4. Busca personas por nombre de usuario.',
  requests: 'Aquí aparecerán las solicitudes de amistad que recibas.',
  blocked:  'Aquí aparecerán los usuarios que hayas bloqueado.',
}
</script>

<style scoped>
.friends-page           { padding: 1.75rem; max-width: 720px; margin: 0 auto; }
.friends-page__header   { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.friends-page__title    { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }

.friends-page__tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.75rem;
  border-bottom: 1px solid var(--cs-border);
}

.friends-page__tab {
  padding: 0.5rem 1.125rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--cs-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.friends-page__tab:hover { color: var(--cs-text); }
.friends-page__tab.is-active { color: var(--cs-primary); border-bottom-color: var(--cs-primary); }
</style>
