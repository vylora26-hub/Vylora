<script setup lang="ts">
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

defineProps<{ username: string }>()
</script>

<template>
  <div class="user-profile-page">
    <AppEmptyState
      title="Perfil de usuario"
      :description="`El perfil público de @${username} estará disponible en la Fase 2.`"
      icon="user"
    />
  </div>
</template>

<style scoped>
.user-profile-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
