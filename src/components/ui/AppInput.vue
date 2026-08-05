<script setup lang="ts">
import { computed, useId } from 'vue'
import type { InputSize } from '@/types'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  type?: string
  size?: InputSize
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  autocomplete?: string
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  size: 'md',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputId = useId()
const errorId = `${inputId}-error`
const hintId  = `${inputId}-hint`

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint)  ids.push(hintId)
  if (props.error) ids.push(errorId)
  return ids.join(' ') || undefined
})
</script>

<template>
  <div class="input-wrap" :class="{ 'input-wrap--error': !!error }">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required" aria-hidden="true">*</span>
    </label>

    <input
      :id="inputId"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :aria-describedby="describedBy"
      :aria-invalid="!!error"
      class="input-field"
      :class="`input-field--${size}`"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />

    <p v-if="hint && !error" :id="hintId" class="input-hint">{{ hint }}</p>
    <p v-if="error"          :id="errorId" class="input-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.input-wrap { display: flex; flex-direction: column; gap: 0.375rem; }

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cs-text-secondary);
}

.input-required { color: #ef4444; margin-left: 2px; }

.input-field {
  width: 100%;
  background: var(--cs-surface-2);
  border: 1.5px solid var(--cs-border);
  border-radius: 0.5rem;
  color: var(--cs-text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-field::placeholder { color: var(--cs-text-muted); }

.input-field:focus {
  border-color: var(--cs-primary);
  box-shadow: 0 0 0 3px var(--cs-primary-subtle);
}

.input-field:disabled { opacity: 0.5; cursor: not-allowed; }

.input-wrap--error .input-field {
  border-color: #ef4444;
}
.input-wrap--error .input-field:focus {
  box-shadow: 0 0 0 3px rgba(239,68,68,0.15);
}

/* Sizes */
.input-field--sm { font-size: 0.8125rem; padding: 0.375rem 0.75rem;  }
.input-field--md { font-size: 0.9375rem; padding: 0.5625rem 0.875rem; }
.input-field--lg { font-size: 1rem;      padding: 0.75rem 1rem;       }

.input-hint  { font-size: 0.8125rem; color: var(--cs-text-muted); margin: 0; }
.input-error { font-size: 0.8125rem; color: #ef4444; margin: 0; }
</style>
