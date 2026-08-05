<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import AppPreloader from '@/components/common/AppPreloader.vue'

const uiStore   = useUiStore()
const authStore = useAuthStore()

const showPreloader = ref(true)

onMounted(async () => {
  // 1. Aplicar tema antes de mostrar cualquier cosa
  uiStore.applyTheme()

  // 2. Inicializar sesión (puede ser instantáneo en mock mode)
  await authStore.initialize()

  // 3. Duración mínima del preloader para que se vea la animación (1.4s)
  const MIN_DURATION = 1400
  const start = performance.now()
  const elapsed = performance.now() - start
  const remaining = Math.max(0, MIN_DURATION - elapsed)

  setTimeout(() => {
    showPreloader.value = false
  }, remaining)

  // 4. Escuchar cambios de tema del sistema
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (uiStore.theme === 'system') uiStore.applyTheme()
  })
})

// Sincroniza clase en <html> cuando el usuario cambia el tema manualmente
watch(
  () => uiStore.resolvedTheme,
  () => uiStore.applyTheme(),
)
</script>

<template>
  <!-- Preloader con transición de salida suave -->
  <Transition name="preloader">
    <AppPreloader v-if="showPreloader" />
  </Transition>

  <!-- App principal — se renderiza detrás del preloader mientras carga -->
  <RouterView v-if="!showPreloader" />
</template>

<style>
/* Transición global del preloader */
.preloader-leave-active {
  transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}

.preloader-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
