<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Message } from '@/types'

const props = defineProps<{
  replyTo?: Message | null
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  send:        [content: string]
  typing:      []
  cancelReply: []
}>()

const content  = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function handleInput() {
  autoResize()
  emit('typing')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
  if (e.key === 'Escape' && props.replyTo) {
    emit('cancelReply')
  }
}

function handleSend() {
  const text = content.value.trim()
  if (!text) return
  emit('send', text)
  content.value = ''
  nextTick(() => { autoResize(); textarea.value?.focus() })
}

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <div class="msg-input">
    <!-- Reply preview -->
    <Transition name="reply-slide">
      <div v-if="replyTo" class="msg-input__reply">
        <div class="msg-input__reply-body">
          <span class="msg-input__reply-name">Respondiendo a {{ replyTo.sender?.displayName ?? replyTo.sender?.username }}</span>
          <span class="msg-input__reply-content">{{ replyTo.content }}</span>
        </div>
        <button class="msg-input__reply-close" aria-label="Cancelar respuesta" @click="emit('cancelReply')">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Input row -->
    <div class="msg-input__row">
      <textarea
        ref="textarea"
        v-model="content"
        class="msg-input__textarea"
        :placeholder="placeholder ?? 'Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)'"
        :disabled="disabled"
        rows="1"
        maxlength="2000"
        aria-label="Mensaje"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <button
        class="msg-input__send"
        :disabled="disabled || !content.trim()"
        :aria-label="disabled ? 'No puedes enviar mensajes' : 'Enviar mensaje'"
        @click="handleSend"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.msg-input { background: var(--cs-surface); border-top: 1px solid var(--cs-border); padding: 0.75rem 1rem; }

.msg-input__reply {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--cs-surface-2);
  border-left: 3px solid var(--cs-primary);
  border-radius: 0.5rem;
  margin-bottom: 0.625rem;
}
.msg-input__reply-body { display: flex; flex-direction: column; gap: 0.1rem; overflow: hidden; }
.msg-input__reply-name { font-size: 0.75rem; font-weight: 600; color: var(--cs-primary); }
.msg-input__reply-content { font-size: 0.8125rem; color: var(--cs-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg-input__reply-close { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; background: transparent; border: none; color: var(--cs-text-muted); cursor: pointer; transition: background 0.12s; }
.msg-input__reply-close:hover { background: var(--cs-surface-hover); }

.msg-input__row { display: flex; align-items: flex-end; gap: 0.625rem; }

.msg-input__textarea {
  flex: 1;
  background: var(--cs-surface-2);
  border: 1.5px solid var(--cs-border);
  border-radius: 0.75rem;
  padding: 0.625rem 1rem;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--cs-text);
  resize: none;
  outline: none;
  max-height: 160px;
  line-height: 1.5;
  transition: border-color 0.15s;
  scrollbar-width: thin;
}
.msg-input__textarea:focus { border-color: var(--cs-primary); }
.msg-input__textarea::placeholder { color: var(--cs-text-muted); }
.msg-input__textarea:disabled { opacity: 0.5; cursor: not-allowed; }

.msg-input__send {
  flex-shrink: 0;
  width: 40px; height: 40px;
  border-radius: 10px;
  background: var(--cs-primary);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.1s;
}
.msg-input__send:hover:not(:disabled) { background: var(--cs-primary-hover); }
.msg-input__send:active:not(:disabled) { transform: scale(0.93); }
.msg-input__send:disabled { opacity: 0.4; cursor: not-allowed; }

.reply-slide-enter-active, .reply-slide-leave-active { transition: all 0.18s ease; }
.reply-slide-enter-from, .reply-slide-leave-to { opacity: 0; transform: translateY(-6px); max-height: 0; }
</style>
