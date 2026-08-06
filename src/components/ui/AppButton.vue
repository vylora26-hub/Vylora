<script setup lang="ts">
import type { ButtonVariant, ButtonSize } from '@/types'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  fullWidth: false,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

function handleClick(e: MouseEvent) {
  if (!props.loading && !props.disabled) emit('click', e)
}
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--full': fullWidth, 'btn--loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading"
    @click="handleClick"
  >
    <!-- Spinner -->
    <span v-if="loading" class="btn__spinner" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>

    <!-- Content -->
    <span class="btn__content" :class="{ 'btn__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: background 0.15s, opacity 0.15s, transform 0.1s, box-shadow 0.15s;
  font-family: inherit;
  text-decoration: none;
  outline: none;
}

.btn:focus-visible {
  outline: 2px solid var(--cs-primary);
  outline-offset: 2px;
}

.btn:active:not(:disabled) { transform: scale(0.97); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ---- Sizes ---- */
.btn--xs { font-size: 0.75rem;    padding: 0.25rem 0.625rem;  gap: 0.25rem;  }
.btn--sm { font-size: 0.8125rem;  padding: 0.375rem 0.875rem; gap: 0.375rem; }
.btn--md { font-size: 0.9375rem;  padding: 0.5625rem 1.25rem; gap: 0.5rem;   }
.btn--lg { font-size: 1rem;       padding: 0.75rem 1.75rem;   gap: 0.5rem;   }

/* ---- Variants ---- */
.btn--primary {
  background: var(--cs-primary);
  color: #fff;
  box-shadow: 0 1px 3px rgba(99,102,241,0.35);
}
.btn--primary:hover:not(:disabled) {
  background: var(--cs-primary-hover);
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}

.btn--secondary {
  background: var(--cs-surface-2);
  color: var(--cs-text);
  border: 1px solid var(--cs-border);
}
.btn--secondary:hover:not(:disabled) { background: var(--cs-surface-hover); }

.btn--ghost {
  background: transparent;
  color: var(--cs-text-secondary);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--cs-surface-hover);
  color: var(--cs-text);
}

.btn--outline {
  background: transparent;
  color: var(--cs-primary);
  border: 1.5px solid var(--cs-primary);
}
.btn--outline:hover:not(:disabled) { background: var(--cs-primary-subtle); }

.btn--success {
  background: #16a34a;
  color: #fff;
  box-shadow: 0 1px 3px rgba(22,163,74,0.3);
}
.btn--success:hover:not(:disabled) {
  background: #15803d;
  box-shadow: 0 4px 12px rgba(22,163,74,0.35);
}

.btn--danger {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 1px 3px rgba(239,68,68,0.3);
}
.btn--danger:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239,68,68,0.35);
}

/* ---- Util ---- */
.btn--full { width: 100%; }

.btn__spinner {
  position: absolute;
  animation: btn-spin 0.7s linear infinite;
}
@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

.btn__content { display: inline-flex; align-items: center; gap: inherit; }
.btn__content--hidden { visibility: hidden; }
</style>
