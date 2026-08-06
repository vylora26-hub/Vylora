<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDmStore } from '@/stores/dm'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useRateLimit } from '@/composables/useRateLimit'
import { formatDateSeparator, formatMessageTime } from '@/utils/formatDate'
import MessageInput from '@/components/chat/MessageInput.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import type { DirectMessage } from '@/types'

const props = defineProps<{ id: string }>()

const router    = useRouter()
const dmStore   = useDmStore()
const authStore = useAuthStore()
const uiStore   = useUiStore()
const rateLimit = useRateLimit()

const msgListRef = ref<HTMLElement | null>(null)

const conversation = computed(() => dmStore.conversations.find(c => c.id === props.id))
const messages     = computed(() => dmStore.messages[props.id] ?? [])
const isTyping     = computed(() => dmStore.typing[props.id] ?? false)

const groupedMessages = computed(() => {
  const groups: { date: string; messages: DirectMessage[] }[] = []
  let lastDate = ''
  for (const msg of messages.value) {
    const d = formatDateSeparator(msg.createdAt)
    if (d !== lastDate) { groups.push({ date: d, messages: [] }); lastDate = d }
    groups[groups.length - 1].messages.push(msg)
  }
  return groups
})

async function scrollToBottom() {
  await nextTick()
  const el = msgListRef.value
  if (el) el.scrollTop = el.scrollHeight
}

onMounted(async () => {
  if (!dmStore.conversations.length) await dmStore.fetchConversations()
  await dmStore.fetchMessages(props.id)
  dmStore.subscribe(props.id)
  dmStore.markRead(props.id)
  scrollToBottom()
})

onUnmounted(() => dmStore.unsubscribe())

watch(() => messages.value.length, (n, o) => {
  if (n > o) {
    const el = msgListRef.value
    const near = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 120 : true
    if (near) scrollToBottom()
  }
})

async function handleSend(content: string) {
  if (!rateLimit.check()) { uiStore.toast.warning('Espera un momento'); return }
  await dmStore.sendMessage(props.id, content)
  scrollToBottom()
}

function handleTyping() { dmStore.broadcastTyping(props.id, true) }

const isOwn = (msg: DirectMessage) => msg.senderId === authStore.userId
</script>

<template>
  <div class="dm-page">
    <!-- Header -->
    <header class="dm-page__header">
      <button class="dm-page__back" aria-label="Volver a mensajes" @click="router.push('/app/dm')">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </button>
      <AppAvatar v-if="conversation?.otherUser" :src="conversation.otherUser.avatarUrl" :name="conversation.otherUser.displayName" size="sm" :show-status="true" status="online" />
      <AppSkeleton v-else width="36px" height="36px" :circle="true" />
      <div class="dm-page__user-info">
        <p class="dm-page__username">{{ conversation?.otherUser?.displayName ?? '...' }}</p>
        <p class="dm-page__status">En línea</p>
      </div>
    </header>

    <!-- Messages -->
    <div ref="msgListRef" class="dm-page__messages" role="log" aria-label="Mensajes privados" aria-live="polite">
      <template v-if="dmStore.loading && !messages.length">
        <div v-for="i in 6" :key="i" class="dm-page__skeleton" :class="{ 'dm-page__skeleton--own': i % 2 === 0 }">
          <AppSkeleton :width="`${Math.random() * 25 + 25}%`" height="2.25rem" />
        </div>
      </template>

      <AppEmptyState v-else-if="!messages.length && !dmStore.loading" title="Inicia la conversación" :description="`Envía el primer mensaje a ${conversation?.otherUser?.displayName ?? 'esta persona'}.`" icon="envelope" class="dm-page__empty" />

      <template v-else>
        <template v-for="group in groupedMessages" :key="group.date">
          <div class="dm-page__date-sep" role="separator"><span>{{ group.date }}</span></div>
          <div v-for="msg in group.messages" :key="msg.id" class="dm-page__msg-wrap" :class="{ 'dm-page__msg-wrap--own': isOwn(msg) }">
            <div class="dm-bubble" :class="[isOwn(msg) ? 'dm-bubble--own' : 'dm-bubble--other', { 'dm-bubble--deleted': msg.isDeleted }]">
              <p v-if="!msg.isDeleted" class="dm-bubble__content">{{ msg.content }}</p>
              <p v-else class="dm-bubble__deleted">Mensaje eliminado</p>
              <div class="dm-bubble__meta">
                <time class="dm-bubble__time" :datetime="msg.createdAt">{{ formatMessageTime(msg.createdAt) }}</time>
                <svg v-if="isOwn(msg) && msg.readAt" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#6366f1" stroke-width="2.5" aria-label="Leído" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                <svg v-else-if="isOwn(msg)" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-label="Enviado" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- Typing -->
    <TypingIndicator :users="isTyping && conversation?.otherUser ? [conversation.otherUser.displayName] : []" />

    <!-- Input -->
    <MessageInput
      :disabled="rateLimit.blocked.value"
      :placeholder="`Mensaje a ${conversation?.otherUser?.displayName ?? '...'}`"
      @send="handleSend"
      @typing="handleTyping"
    />
  </div>
</template>

<style scoped>
.dm-page { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

.dm-page__header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--cs-border);
  background: var(--cs-surface);
  flex-shrink: 0;
}
.dm-page__back { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; color: var(--cs-text-muted); cursor: pointer; transition: background 0.15s; }
.dm-page__back:hover { background: var(--cs-surface-hover); color: var(--cs-text); }
.dm-page__user-info { display: flex; flex-direction: column; }
.dm-page__username  { font-size: 1rem; font-weight: 700; color: var(--cs-text); }
.dm-page__status    { font-size: 0.75rem; color: #22c55e; }

.dm-page__messages { flex: 1; overflow-y: auto; padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.375rem; }
.dm-page__empty    { flex: 1; display: flex; align-items: center; justify-content: center; }

.dm-page__skeleton { padding: 0.25rem 0; }
.dm-page__skeleton--own { display: flex; justify-content: flex-end; }

.dm-page__date-sep {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0; margin: 0.375rem 0;
}
.dm-page__date-sep::before, .dm-page__date-sep::after { content: ''; flex: 1; height: 1px; background: var(--cs-border); }
.dm-page__date-sep span { font-size: 0.6875rem; font-weight: 600; color: var(--cs-text-muted); white-space: nowrap; padding: 0.15rem 0.5rem; border-radius: 9999px; border: 1px solid var(--cs-border); }

.dm-page__msg-wrap { display: flex; }
.dm-page__msg-wrap--own { justify-content: flex-end; }

.dm-bubble { max-width: min(70%, 480px); padding: 0.5rem 0.875rem; border-radius: 1rem; word-break: break-word; }
.dm-bubble--other { background: var(--cs-surface); border: 1px solid var(--cs-border); border-bottom-left-radius: 0.25rem; }
.dm-bubble--own   { background: var(--cs-primary); color: #fff; border-bottom-right-radius: 0.25rem; }
.dm-bubble--deleted { opacity: 0.5; font-style: italic; }
.dm-bubble__content { font-size: 0.9375rem; line-height: 1.55; white-space: pre-wrap; }
.dm-bubble__deleted { font-size: 0.875rem; color: var(--cs-text-muted); }
.dm-bubble--own .dm-bubble__deleted { color: rgba(255,255,255,0.6); }
.dm-bubble__meta  { display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem; margin-top: 0.2rem; }
.dm-bubble__time  { font-size: 0.6875rem; opacity: 0.6; }
</style>
