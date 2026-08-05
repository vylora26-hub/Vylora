<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  retry?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Algo salió mal',
  message: 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
  retry: false,
})

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-state" role="alert">
    <div class="error-state__icon" aria-hidden="true">
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 class="error-state__title">{{ title }}</h3>
    <p class="error-state__message">{{ message }}</p>
    <button v-if="retry" class="error-state__retry" @click="emit('retry')">
      Intentar de nuevo
    </button>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  gap: 0.625rem;
}

.error-state__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239,68,68,0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.error-state__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--cs-text);
  margin: 0;
}

.error-state__message {
  font-size: 0.9rem;
  color: var(--cs-text-muted);
  max-width: 320px;
  line-height: 1.5;
  margin: 0;
}

.error-state__retry {
  margin-top: 0.5rem;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  background: var(--cs-primary);
  color: #fff;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.error-state__retry:hover { background: var(--cs-primary-hover); }
</style>
