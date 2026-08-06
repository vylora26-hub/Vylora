<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatMessageTime, formatFullDate } from '@/utils/formatDate'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import type { Message } from '@/types'
import { REACTION_EMOJIS } from '@/constants/messageTypes'

const props = defineProps<{
  message: Message
  showAvatar?: boolean
}>()

const emit = defineEmits<{
  reply:   [message: Message]
  react:   [messageId: string, emoji: string]
  edit:    [message: Message]
  delete:  [messageId: string]
  copy:    [content: string]
}>()

const authStore  = useAuthStore()
const showMenu   = ref(false)
const showPicker = ref(false)

const isOwn = computed(() => props.message.senderId === authStore.userId)
const isDeleted = computed(() => props.message.isDeleted)

const totalReactions = computed(() => {
  const map: Record<string, number> = {}
  for (const [emoji, users] of Object.entries(props.message.reactions ?? {})) {
    if (users.length) map[emoji] = users.length
  }
  return map
})

function myReaction(emoji: string) {
  return (props.message.reactions?.[emoji] ?? []).includes(authStore.userId ?? '')
}

function copyText() {
  navigator.clipboard.writeText(props.message.content)
  showMenu.value = false
}
</script>

<template>
  <div
    class="bubble-wrap"
    :class="{ 'bubble-wrap--own': isOwn }"
    @mouseenter="showMenu = true"
    @mouseleave="showMenu = false; showPicker = false"
  >
    <!-- Avatar (solo mensajes ajenos) -->
    <div class="bubble-wrap__avatar">
      <AppAvatar
        v-if="!isOwn && showAvatar"
        :src="message.sender?.avatarUrl"
        :name="message.sender?.displayName"
        size="sm"
      />
      <div v-else-if="!isOwn" class="bubble-wrap__avatar-spacer" />
    </div>

    <div class="bubble-wrap__main">
      <!-- Nombre del remitente -->
      <span v-if="!isOwn && showAvatar" class="bubble-wrap__sender">
        {{ message.sender?.displayName ?? message.sender?.username }}
      </span>

      <!-- Reply preview -->
      <div v-if="message.replyTo" class="bubble-reply">
        <span class="bubble-reply__name">{{ message.replyTo.sender?.displayName ?? '—' }}</span>
        <span class="bubble-reply__content">{{ message.replyTo.content }}</span>
      </div>

      <!-- Burbuja principal -->
      <div class="bubble" :class="[isOwn ? 'bubble--own' : 'bubble--other', { 'bubble--deleted': isDeleted, 'bubble--failed': message.status === 'failed' }]">
        <p v-if="isDeleted" class="bubble__deleted">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          Mensaje eliminado
        </p>
        <p v-else class="bubble__content">{{ message.content }}</p>

        <div class="bubble__meta">
          <time :datetime="message.createdAt" :title="formatFullDate(message.createdAt)" class="bubble__time">
            {{ formatMessageTime(message.createdAt) }}
          </time>
          <span v-if="message.isEdited && !isDeleted" class="bubble__edited">(editado)</span>
          <svg v-if="isOwn && message.status === 'sending'" class="animate-spin bubble__status-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-label="Enviando" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" stroke-linecap="round"/></svg>
          <svg v-else-if="isOwn && message.status !== 'failed'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-label="Enviado" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <svg v-else-if="message.status === 'failed'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#ef4444" stroke-width="2.5" aria-label="Error al enviar" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>
      </div>

      <!-- Reacciones -->
      <div v-if="Object.keys(totalReactions).length" class="bubble-reactions" :class="{ 'bubble-reactions--own': isOwn }">
        <button
          v-for="(count, emoji) in totalReactions" :key="emoji"
          class="reaction-chip"
          :class="{ 'is-mine': myReaction(emoji as string) }"
          :aria-label="`${emoji} ${count} reacciones`"
          @click="emit('react', message.id, emoji as string)"
        >
          {{ emoji }} <span>{{ count }}</span>
        </button>
      </div>

      <!-- Menú contextual -->
      <Transition name="menu-fade">
        <div v-if="showMenu && !isDeleted" class="bubble-menu" :class="{ 'bubble-menu--own': isOwn }">
          <!-- Emoji picker trigger -->
          <div class="bubble-menu__picker-wrap">
            <button class="bubble-menu__btn" aria-label="Reaccionar" @click.stop="showPicker = !showPicker">😊</button>
            <Transition name="menu-fade">
              <div v-if="showPicker" class="emoji-picker">
                <button
                  v-for="emoji in REACTION_EMOJIS" :key="emoji"
                  class="emoji-picker__btn"
                  :aria-label="`Reaccionar con ${emoji}`"
                  @click.stop="emit('react', message.id, emoji); showPicker = false"
                >{{ emoji }}</button>
              </div>
            </Transition>
          </div>

          <button class="bubble-menu__btn" aria-label="Responder" @click="emit('reply', message); showMenu = false">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
          </button>

          <button class="bubble-menu__btn" aria-label="Copiar" @click="copyText">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
          </button>

          <button v-if="isOwn" class="bubble-menu__btn" aria-label="Editar" @click="emit('edit', message); showMenu = false">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>

          <button v-if="isOwn || authStore.isModerator" class="bubble-menu__btn bubble-menu__btn--danger" aria-label="Eliminar" @click="emit('delete', message.id); showMenu = false">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.bubble-wrap { display: flex; align-items: flex-end; gap: 0.5rem; position: relative; padding: 0.125rem 1rem; }
.bubble-wrap--own { flex-direction: row-reverse; }

.bubble-wrap__avatar { width: 32px; flex-shrink: 0; }
.bubble-wrap__avatar-spacer { width: 32px; }
.bubble-wrap__main { display: flex; flex-direction: column; max-width: min(72%, 520px); gap: 0.25rem; }
.bubble-wrap--own .bubble-wrap__main { align-items: flex-end; }

.bubble-wrap__sender { font-size: 0.75rem; font-weight: 600; color: var(--cs-primary); padding-left: 0.75rem; }

.bubble-reply {
  background: var(--cs-surface-2);
  border-left: 3px solid var(--cs-primary);
  border-radius: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  max-width: 100%;
}
.bubble-reply__name { font-weight: 600; color: var(--cs-primary); }
.bubble-reply__content { color: var(--cs-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.bubble {
  padding: 0.5625rem 0.875rem;
  border-radius: 1rem;
  position: relative;
  word-break: break-word;
}
.bubble--other {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-bottom-left-radius: 0.25rem;
}
.bubble--own {
  background: var(--cs-primary);
  color: #fff;
  border-bottom-right-radius: 0.25rem;
}
.bubble--deleted { opacity: 0.5; font-style: italic; }
.bubble--failed  { border: 1px solid #ef4444; }

.bubble__content { font-size: 0.9375rem; line-height: 1.55; white-space: pre-wrap; }
.bubble__deleted { font-size: 0.875rem; display: flex; align-items: center; gap: 0.375rem; color: var(--cs-text-muted); }
.bubble--own .bubble__deleted { color: rgba(255,255,255,0.6); }

.bubble__meta { display: flex; align-items: center; gap: 0.3rem; margin-top: 0.2rem; justify-content: flex-end; }
.bubble__time { font-size: 0.6875rem; opacity: 0.6; }
.bubble__edited { font-size: 0.6875rem; opacity: 0.5; }
.bubble__status-icon { opacity: 0.7; }

.bubble-reactions { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
.bubble-reactions--own { justify-content: flex-end; }

.reaction-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  background: var(--cs-surface-2);
  border: 1px solid var(--cs-border);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s;
}
.reaction-chip.is-mine { background: var(--cs-primary-subtle); border-color: var(--cs-primary); color: var(--cs-primary); }
.reaction-chip span { font-size: 0.75rem; font-weight: 600; }

.bubble-menu {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 2.75rem;
  display: flex;
  align-items: center;
  gap: 0.125rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.625rem;
  padding: 0.25rem;
  box-shadow: var(--cs-shadow-md);
  z-index: 10;
}
.bubble-menu--own { left: auto; right: 0; }

.bubble-menu__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.12s, color 0.12s;
}
.bubble-menu__btn:hover { background: var(--cs-surface-hover); color: var(--cs-text); }
.bubble-menu__btn--danger:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

.bubble-menu__picker-wrap { position: relative; }

.emoji-picker {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  display: flex;
  gap: 0.125rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.5rem;
  padding: 0.375rem;
  box-shadow: var(--cs-shadow-lg);
  z-index: 20;
  white-space: nowrap;
}
.emoji-picker__btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; cursor: pointer; border-radius: 6px;
  font-size: 1rem; transition: background 0.12s;
}
.emoji-picker__btn:hover { background: var(--cs-surface-hover); }

.menu-fade-enter-active, .menu-fade-leave-active { transition: opacity 0.12s, transform 0.12s; }
.menu-fade-enter-from, .menu-fade-leave-to { opacity: 0; transform: scale(0.94) translateY(4px); }
</style>
