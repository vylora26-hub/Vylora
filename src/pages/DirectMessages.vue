<script setup lang="ts">
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

const loading = false
</script>

<template>
  <div class="dm-page">
    <header class="dm-page__header">
      <h1 class="dm-page__title">Mensajes directos</h1>
      <AppButton variant="ghost" size="sm" aria-label="Nuevo mensaje">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </AppButton>
    </header>

    <div v-if="loading" class="dm-page__list">
      <div v-for="i in 5" :key="i" class="dm-page__skeleton">
        <AppSkeleton width="44px" height="44px" :circle="true" />
        <div style="flex:1">
          <AppSkeleton width="45%" height="0.875rem" />
          <AppSkeleton width="70%" height="0.75rem" style="margin-top:0.375rem" />
        </div>
      </div>
    </div>

    <AppEmptyState
      v-else
      title="Sin conversaciones aún"
      description="Los mensajes directos se implementan en la Fase 4. Busca un amigo y empieza a chatear."
      icon="envelope"
    >
      <AppButton variant="outline" size="sm">Buscar usuarios</AppButton>
    </AppEmptyState>
  </div>
</template>

<style scoped>
.dm-page          { padding: 1.75rem; max-width: 680px; margin: 0 auto; }
.dm-page__header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.dm-page__title   { font-size: 1.375rem; font-weight: 700; color: var(--cs-text); }
.dm-page__list    { display: flex; flex-direction: column; gap: 0.75rem; }
.dm-page__skeleton{ display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem; background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; }
</style>
