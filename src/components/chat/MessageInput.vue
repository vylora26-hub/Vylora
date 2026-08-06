<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useSecurity } from '@/composables/useSecurity'
import type { Message } from '@/types'
import type { SecurityWarning } from '@/composables/useSecurity'

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

const { loadPatterns, analyzeText, hasShortUrl } = useSecurity()
onMounted(() => loadPatterns())

const content      = ref('')
const textarea     = ref<HTMLTextAreaElement | null>(null)
const warning      = ref<SecurityWarning | null>(null)
const showWarning  = ref(false)
const pendingText  = ref('')

function autoResize() {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

// Analizar en tiempo real mientras escribe (con debounce leve)
let analyzeTimer: ReturnType<typeof setTimeout> | null = null
function handleInput() {
  autoResize()
  emit('typing')
  if (analyzeTimer) clearTimeout(analyzeTimer)
  analyzeTimer = setTimeout(() => {
    const w = analyzeText(content.value)
    const shortUrl = hasShortUrl(content.value)
    if (w) {
      warning.value = w
    } else if (shortUrl) {
      warning.value = { pattern: 'url acortada', category: 'phishing', severity: 'medium', message: '⚠️ Este mensaje contiene un enlace acortado. Los links acortados pueden ocultar sitios peligrosos.' }
    } else {
      warning.value = null
    }
  }, 400)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
  if (e.key === 'Escape' && props.replyTo) emit('cancelReply')
}

function handleSend() {
  const text = content.value.trim()
  if (!text) return

  // Si hay advertencia crítica/alta — pedir confirmación
  if (warning.value && (warning.value.severity === 'critical' || warning.value.severity === 'high')) {
    pendingText.value = text
    showWarning.value = true
    return
  }

  doSend(text)
}

function doSend(text: string) {
  emit('send', text)
  content.value = ''
  warning.value = null
  showWarning.value = false
  pendingText.value = ''
  nextTick(() => { autoResize(); textarea.value?.focus() })
}

function confirmSend() { doSend(pendingText.value) }
function cancelSend()  { showWarning.value = false; pendingText.value = '' }

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

    <!-- Advertencia de seguridad en tiempo real (baja/media) -->
    <Transition name="warn-slide">
      <div
        v-if="warning && !showWarning && (warning.severity === 'low' || warning.severity === 'medium')"
        class="msg-input__warn msg-input__warn--inline"
        role="alert"
        aria-live="polite"
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        {{ warning.message }}
      </div>
    </Transition>

    <!-- Modal de confirmación para severidades alta/crítica -->
    <Transition name="warn-slide">
      <div v-if="showWarning" class="msg-input__warn-modal" role="alertdialog" aria-modal="true" aria-labelledby="warn-title">
        <div class="msg-input__warn-modal-inner">
          <div class="msg-input__warn-modal-icon" aria-hidden="true">🚨</div>
          <div class="msg-input__warn-modal-body">
            <p id="warn-title" class="msg-input__warn-modal-title">
              {{ warning?.severity === 'critical' ? 'Advertencia crítica de seguridad' : 'Posible contenido de estafa' }}
            </p>
            <p class="msg-input__warn-modal-text">{{ warning?.message }}</p>
            <p class="msg-input__warn-modal-sub">
              ¿Estás seguro de que quieres enviar este mensaje?
            </p>
          </div>
          <div class="msg-input__warn-modal-actions">
            <button class="msg-input__warn-btn msg-input__warn-btn--cancel" @click="cancelSend">
              Cancelar
            </button>
            <button class="msg-input__warn-btn msg-input__warn-btn--confirm" @click="confirmSend">
              Enviar de todas formas
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Input row -->
    <div class="msg-input__row">
      <textarea
        ref="textarea"
        v-model="content"
        class="msg-input__textarea"
        :class="{ 'msg-input__textarea--warn': !!warning }"
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
        :class="{ 'msg-input__send--warn': warning?.severity === 'high' || warning?.severity === 'critical' }"
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
.msg-input { background: var(--cs-surface); border-top: 1px solid var(--cs-border); padding: 0.75rem 1rem; position: relative; }

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

/* ---- Advertencias ---- */
.msg-input__warn--inline {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.25);
  color: #d97706;
  font-size: 0.8125rem;
  line-height: 1.45;
}

.msg-input__textarea--warn {
  border-color: #f59e0b !important;
}

.msg-input__send--warn {
  background: #ef4444 !important;
}

.msg-input__warn-modal {
  position: absolute;
  bottom: 100%;
  left: 0; right: 0;
  z-index: 50;
  padding: 0 1rem 0.5rem;
}

.msg-input__warn-modal-inner {
  background: var(--cs-surface);
  border: 1.5px solid #ef4444;
  border-radius: 0.875rem;
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(239,68,68,0.2);
}

.msg-input__warn-modal-icon { font-size: 1.5rem; text-align: center; }
.msg-input__warn-modal-title { font-size: 0.9375rem; font-weight: 700; color: #ef4444; margin: 0; }
.msg-input__warn-modal-text  { font-size: 0.875rem; color: var(--cs-text-secondary); margin: 0.25rem 0 0; line-height: 1.5; }
.msg-input__warn-modal-sub   { font-size: 0.8125rem; color: var(--cs-text-muted); margin: 0.25rem 0 0; }

.msg-input__warn-modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

.msg-input__warn-btn {
  padding: 0.4375rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: background 0.15s, transform 0.1s;
}
.msg-input__warn-btn:active { transform: scale(0.97); }
.msg-input__warn-btn--cancel  { background: var(--cs-surface-2); color: var(--cs-text); }
.msg-input__warn-btn--cancel:hover { background: var(--cs-surface-hover); }
.msg-input__warn-btn--confirm { background: #ef4444; color: #fff; }
.msg-input__warn-btn--confirm:hover { background: #dc2626; }

.warn-slide-enter-active, .warn-slide-leave-active { transition: all 0.2s ease; }
.warn-slide-enter-from, .warn-slide-leave-to { opacity: 0; transform: translateY(6px); }

.reply-slide-enter-active, .reply-slide-leave-active { transition: all 0.18s ease; }
.reply-slide-enter-from, .reply-slide-leave-to { opacity: 0; transform: translateY(-6px); max-height: 0; }
</style>
