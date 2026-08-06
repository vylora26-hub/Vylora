<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import AppButton from './AppButton.vue'
import type { ModalConfig } from '@/types'

interface Props extends ModalConfig {
  modelValue: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'default',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => window.addEventListener('keydown', handleKey))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined"
        :aria-describedby="description ? 'modal-desc' : undefined"
        @click.self="close"
      >
        <div class="modal-panel" :class="`modal-panel--${variant}`">
          <!-- Header -->
          <div v-if="title" class="modal-header">
            <h2 id="modal-title" class="modal-title">{{ title }}</h2>
            <button class="modal-close" aria-label="Cerrar" @click="close">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Description -->
          <p v-if="description" id="modal-desc" class="modal-description">
            {{ description }}
          </p>

          <!-- Body (slot) -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer || confirmLabel" class="modal-footer">
            <slot name="footer">
              <AppButton variant="secondary" size="sm" @click="close">
                {{ cancelLabel }}
              </AppButton>
              <AppButton
                :variant="variant === 'danger' ? 'danger' : 'primary'"
                size="sm"
                :loading="loading"
                @click="confirm"
              >
                {{ confirmLabel }}
              </AppButton>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-panel {
  width: 100%;
  max-width: 480px;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0;
}

.modal-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--cs-text);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  transition: background 0.15s;
}
.modal-close:hover { background: var(--cs-surface-hover); }

.modal-description {
  padding: 0.75rem 1.5rem 0;
  font-size: 0.9375rem;
  color: var(--cs-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.modal-body {
  padding: 1rem 1.5rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.5rem 1.25rem;
}

/* Danger variant border */
.modal-panel--danger { border-top: 3px solid #ef4444; }

/* Transition */
.modal-enter-active { animation: modal-in 0.2s ease; }
.modal-leave-active { animation: modal-in 0.15s ease reverse; }

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
