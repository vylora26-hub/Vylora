<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()

const icons = {
  success: 'M5 13l4 4L19 7',
  error:   'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="toast-container"
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      aria-atomic="false"
    >
      <TransitionGroup name="toast" tag="ul" class="toast-list">
        <li
          v-for="toast in uiStore.toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          role="alert"
        >
          <!-- Ícono -->
          <span class="toast__icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="icons[toast.type]" />
            </svg>
          </span>

          <!-- Texto -->
          <div class="toast__body">
            <p class="toast__title">{{ toast.title }}</p>
            <p v-if="toast.message" class="toast__message">{{ toast.message }}</p>
          </div>

          <!-- Cerrar -->
          <button
            class="toast__close"
            :aria-label="`Cerrar notificación: ${toast.title}`"
            @click="uiStore.dismissToast(toast.id)"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </li>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 200;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: flex-end;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  min-width: 280px;
  max-width: 380px;
  pointer-events: all;
  position: relative;
  overflow: hidden;
}

/* Barra de color izquierda */
.toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.toast--success::before { background: #22c55e; }
.toast--error::before   { background: #ef4444; }
.toast--warning::before { background: #f59e0b; }
.toast--info::before    { background: var(--cs-primary); }

.toast__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.toast--success .toast__icon { color: #22c55e; background: rgba(34,197,94,0.1);   }
.toast--error   .toast__icon { color: #ef4444; background: rgba(239,68,68,0.1);   }
.toast--warning .toast__icon { color: #f59e0b; background: rgba(245,158,11,0.1);  }
.toast--info    .toast__icon { color: var(--cs-primary); background: var(--cs-primary-subtle); }

.toast__body { flex: 1; min-width: 0; }

.toast__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--cs-text);
  margin: 0;
}

.toast__message {
  font-size: 0.8125rem;
  color: var(--cs-text-muted);
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

.toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  transition: background 0.15s;
}
.toast__close:hover { background: var(--cs-surface-hover); }

/* Animaciones */
.toast-enter-active { animation: toast-in 0.25s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { animation: toast-in 0.2s ease reverse; transition: all 0.2s; }
.toast-move         { transition: transform 0.25s ease; }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(24px) scale(0.95); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

/* Mobile */
@media (max-width: 767px) {
  .toast-container { bottom: 5.5rem; left: 1rem; right: 1rem; }
  .toast { min-width: unset; max-width: unset; width: 100%; }
  .toast-list { align-items: stretch; }
}
</style>
