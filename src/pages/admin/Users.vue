<script setup lang="ts">
import { ref } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

const search = ref('')
const loading = ref(false)
</script>

<template>
  <div class="admin-users">
    <div class="admin-users__toolbar">
      <AppInput v-model="search" placeholder="Buscar usuario..." type="search" size="sm" />
    </div>

    <div v-if="loading" class="admin-users__list">
      <div v-for="i in 8" :key="i" class="admin-users__skeleton">
        <AppSkeleton width="36px" height="36px" :circle="true" />
        <div style="flex:1">
          <AppSkeleton width="30%" height="0.875rem" />
          <AppSkeleton width="45%" height="0.75rem" style="margin-top:0.35rem" />
        </div>
        <AppSkeleton width="70px" height="28px" />
      </div>
    </div>

    <AppEmptyState
      v-else
      title="Gestión de usuarios"
      description="La tabla de usuarios con filtros, roles y acciones de moderación se implementa en la Fase 5."
      icon="users"
    />
  </div>
</template>

<style scoped>
.admin-users__toolbar { margin-bottom: 1.25rem; max-width: 320px; }
.admin-users__list    { display: flex; flex-direction: column; gap: 0.625rem; }
.admin-users__skeleton{ display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem; background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; }
</style>
