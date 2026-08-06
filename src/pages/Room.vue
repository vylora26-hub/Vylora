<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useRoomsStore } from '@/stores/rooms'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { usePresence } from '@/composables/usePresence'
import { useRateLimit } from '@/composables/useRateLimit'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { formatDateSeparator } from '@/utils/formatDate'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import type { Message } from '@/types'

const props = defineProps<{ slug: string }>()

const router     = useRouter()
const chatStore  = useChatStore()
const roomsStore = useRoomsStore()
const authStore  = useAuthStore()
const uiStore    = useUiStore()
const rateLimit  = useRateLimit()

const msgListRef = ref<HTMLElement | null>(null)
const replyTo    = ref<Message | null>(null)
const editTarget = ref<Message | null>(null)
const showMembers = ref(false)
const showSearch  = ref(false)
const searchQuery = ref('')
const showDeleteModal = ref(false)
const deleteTargetId  = ref('')
const joined = ref(false)

const room    = computed(() => roomsStore.currentRoom)
const messages = computed(() => chatStore.messages[room.value?.id ?? ''] ?? [])
const typingUsers = computed(() => Array.from(chatStore.typing[room.value?.id ?? ''] ?? []))
const canSend = computed(() => authStore.isAuthenticated && joined.value && !roomsStore.loadingRoom)

// Presencia
const { onlineCount, subscribe: presSubscribe, unsubscribe: presUnsub } = usePresence(props.slug)

// Infinite scroll (cargar mensajes anteriores)
const { isLoadingMore } = useInfiniteScroll(msgListRef, async () => {
  const roomId = room.value?.id
  if (!roomId || !chatStore.hasMore[roomId]) return
  const oldest = messages.value[0]?.createdAt
  await chatStore.fetchMessages(roomId, oldest)
})

// Agrupar mensajes por fecha
const groupedMessages = computed(() => {
  const groups: { date: string; messages: Message[] }[] = []
  let lastDate = ''
  for (const msg of messages.value) {
    const d = formatDateSeparator(msg.createdAt)
    if (d !== lastDate) { groups.push({ date: d, messages: [] }); lastDate = d }
    groups[groups.length - 1].messages.push(msg)
  }
  return groups
})

// Scroll al fondo
async function scrollToBottom(smooth = false) {
  await nextTick()
  const el = msgListRef.value
  if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
}

onMounted(async () => {
  // Cargar sala
  const r = await roomsStore.fetchRoom(props.slug)
  if (!r) { router.push('/app/rooms'); return }

  // Unirse si es pública y usuario autenticado
  if (authStore.isAuthenticated && !r.isMember && r.type === 'public') {
    await roomsStore.joinRoom(r.id)
    joined.value = true
  } else {
    joined.value = !!r.isMember || !authStore.isAuthenticated
  }

  // Cargar mensajes y subscribir realtime
  await chatStore.fetchMessages(r.id)
  chatStore.subscribe(r.id)
  presSubscribe()
  scrollToBottom()
})

onUnmounted(() => {
  if (room.value) chatStore.unsubscribe()
  presUnsub()
})

// Scroll al fondo cuando llegan mensajes nuevos
watch(() => messages.value.length, (n, o) => {
  if (n > o) {
    const el = msgListRef.value
    const isNearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 120 : true
    if (isNearBottom) scrollToBottom(true)
  }
})

// ---- Acciones de chat ----

async function handleSend(content: string) {
  if (!room.value || !canSend.value) return
  if (!rateLimit.check()) { uiStore.toast.warning('Demasiado rápido', 'Espera un momento antes de enviar otro mensaje.'); return }
  await chatStore.sendMessage({ roomId: room.value.id, content, replyToId: replyTo.value?.id })
  replyTo.value = null
  scrollToBottom(true)
}

async function handleEdit(msg: Message) {
  editTarget.value = msg
  // Reabre el mismo MessageInput en modo edición — por simplicidad usamos un prompt nativo aquí
  // En una v2 se reemplazaría por un input inline en la burbuja
  const newContent = window.prompt('Editar mensaje:', msg.content)
  if (newContent && newContent !== msg.content && room.value) {
    await chatStore.editMessage(msg.id, room.value.id, newContent)
  }
  editTarget.value = null
}

function handleDelete(messageId: string) {
  deleteTargetId.value = messageId
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!room.value) return
  await chatStore.deleteMessage(deleteTargetId.value, room.value.id)
  showDeleteModal.value = false
}

async function handleReact(messageId: string, emoji: string) {
  if (!room.value) return
  await chatStore.toggleReaction(messageId, room.value.id, emoji)
}

function handleTyping() {
  if (room.value) chatStore.broadcastTyping(room.value.id, true)
}
</script>

<template>
  <div class="room-page">
    <!-- ======== HEADER ======== -->
    <header class="room-page__header">
      <div class="room-page__header-left">
        <!-- Volver en móvil -->
        <button class="room-page__back-btn" aria-label="Volver" @click="router.push('/app/rooms')">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </button>

        <div class="room-page__icon" aria-hidden="true">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>

        <div>
          <div class="room-page__name-row">
            <AppSkeleton v-if="roomsStore.loadingRoom" width="120px" height="1.125rem" />
            <h1 v-else class="room-page__name">{{ room?.name ?? slug }}</h1>
            <AppBadge v-if="room?.isVerified" variant="primary" class="room-page__verified">
              <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </AppBadge>
          </div>
          <p class="room-page__meta">
            <span class="room-page__online">
              <span class="room-page__online-dot" aria-hidden="true" />
              {{ onlineCount }} en línea
            </span>
            <span v-if="room?.category"> · {{ room.category.name }}</span>
          </p>
        </div>
      </div>

      <div class="room-page__header-actions">
        <button class="room-page__icon-btn" :aria-label="showSearch ? 'Cerrar búsqueda' : 'Buscar mensajes'" @click="showSearch = !showSearch">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
        <button class="room-page__icon-btn" :aria-label="showMembers ? 'Cerrar miembros' : 'Ver miembros'" @click="showMembers = !showMembers">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Barra de búsqueda -->
    <Transition name="search-slide">
      <div v-if="showSearch" class="room-page__search-bar">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar en esta sala..."
          class="room-page__search-input"
          aria-label="Buscar mensajes"
        />
      </div>
    </Transition>

    <!-- ======== LAYOUT PRINCIPAL ======== -->
    <div class="room-page__layout" :class="{ 'room-page__layout--with-sidebar': showMembers }">

      <!-- Área de mensajes -->
      <div class="room-page__chat">
        <!-- Loading más mensajes -->
        <div v-if="isLoadingMore" class="room-page__load-more">
          <AppSkeleton v-for="i in 3" :key="i" height="2.5rem" :rounded="true" />
        </div>

        <!-- Lista de mensajes -->
        <div ref="msgListRef" class="room-page__messages" role="log" aria-label="Mensajes de la sala" aria-live="polite">
          <template v-if="chatStore.loading && !messages.length">
            <div v-for="i in 8" :key="i" class="room-page__msg-skeleton" :class="{ 'room-page__msg-skeleton--own': i % 3 === 0 }">
              <AppSkeleton v-if="i % 3 !== 0" width="32px" height="32px" :circle="true" />
              <div>
                <AppSkeleton :width="`${Math.random() * 30 + 30}%`" height="2.5rem" />
              </div>
            </div>
          </template>

          <template v-else-if="!messages.length && !chatStore.loading">
            <AppEmptyState
              title="Sin mensajes aún"
              description="Sé el primero en decir algo."
              icon="chat"
              class="room-page__empty"
            />
          </template>

          <template v-else>
            <template v-for="group in groupedMessages" :key="group.date">
              <!-- Separador de fecha -->
              <div class="room-page__date-sep" role="separator" :aria-label="group.date">
                <span>{{ group.date }}</span>
              </div>
              <!-- Mensajes del grupo -->
              <MessageBubble
                v-for="(msg, idx) in group.messages"
                :key="msg.id"
                :message="msg"
                :show-avatar="idx === 0 || group.messages[idx - 1]?.senderId !== msg.senderId"
                @reply="replyTo = $event"
                @react="handleReact"
                @edit="handleEdit"
                @delete="handleDelete"
                @copy="uiStore.toast.success('Copiado', 'Mensaje copiado al portapapeles.')"
              />
            </template>
          </template>
        </div>

        <!-- Indicador de escritura -->
        <TypingIndicator :users="typingUsers" />

        <!-- Aviso si no está unido / no está autenticado -->
        <div v-if="!authStore.isAuthenticated" class="room-page__join-bar">
          <p>Debes iniciar sesión para enviar mensajes.</p>
          <AppButton variant="primary" size="sm" @click="router.push('/auth/login')">Iniciar sesión</AppButton>
        </div>
        <div v-else-if="!joined && !roomsStore.loadingRoom" class="room-page__join-bar">
          <p>Únete a la sala para participar.</p>
          <AppButton variant="primary" size="sm" :loading="roomsStore.loading" @click="roomsStore.joinRoom(room!.id).then(ok => { if(ok) joined = true })">Unirse</AppButton>
        </div>
        <div v-else-if="rateLimit.blocked.value" class="room-page__rate-limit" role="alert">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          Enviando demasiado rápido. Espera un momento.
        </div>

        <!-- Input de mensaje -->
        <MessageInput
          v-if="canSend"
          ref="inputRef"
          :reply-to="replyTo"
          :disabled="rateLimit.blocked.value"
          @send="handleSend"
          @typing="handleTyping"
          @cancel-reply="replyTo = null"
        />
      </div>

      <!-- Sidebar de miembros -->
      <Transition name="sidebar-slide">
        <aside v-if="showMembers" class="room-page__members-panel" aria-label="Miembros en línea">
          <div class="members-panel__header">
            <p class="members-panel__title">En línea — {{ onlineCount }}</p>
            <button class="members-panel__close" aria-label="Cerrar panel" @click="showMembers = false">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="members-panel__body">
            <div class="members-panel__user">
              <AppAvatar :src="authStore.user?.avatarUrl" :name="authStore.user?.displayName" size="sm" :show-status="true" status="online" />
              <div>
                <p class="members-panel__username">{{ authStore.user?.displayName }}</p>
                <p class="members-panel__tag">@{{ authStore.user?.username }}</p>
              </div>
            </div>
          </div>
        </aside>
      </Transition>
    </div>

    <!-- Modal confirmar borrado -->
    <AppModal
      v-model="showDeleteModal"
      title="Eliminar mensaje"
      description="¿Seguro? Esta acción no se puede deshacer."
      confirm-label="Eliminar"
      variant="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.room-page { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; background: var(--cs-bg); }

/* Header */
.room-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--cs-border);
  background: var(--cs-surface);
  flex-shrink: 0;
  gap: 0.75rem;
  z-index: 10;
}
.room-page__header-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
.room-page__header-actions { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }

.room-page__back-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--cs-text-muted);
  cursor: pointer;
  transition: background 0.15s;
}
.room-page__back-btn:hover { background: var(--cs-surface-hover); color: var(--cs-text); }

@media (max-width: 767px) { .room-page__back-btn { display: flex; } }

.room-page__icon { width: 36px; height: 36px; border-radius: 8px; background: var(--cs-primary-subtle); color: var(--cs-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.room-page__name-row { display: flex; align-items: center; gap: 0.375rem; }
.room-page__name { font-size: 1rem; font-weight: 700; color: var(--cs-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.room-page__meta { font-size: 0.75rem; color: var(--cs-text-muted); display: flex; align-items: center; gap: 0.25rem; margin-top: 0.1rem; }
.room-page__online { display: flex; align-items: center; gap: 0.3rem; }
.room-page__online-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

.room-page__icon-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: transparent; border: none; color: var(--cs-text-muted); cursor: pointer; transition: background 0.15s, color 0.15s; }
.room-page__icon-btn:hover { background: var(--cs-surface-hover); color: var(--cs-text); }

/* Search bar */
.room-page__search-bar { padding: 0.625rem 1.25rem; border-bottom: 1px solid var(--cs-border); background: var(--cs-surface); flex-shrink: 0; }
.room-page__search-input { width: 100%; background: var(--cs-surface-2); border: 1.5px solid var(--cs-border); border-radius: 0.5rem; padding: 0.4375rem 0.875rem; font-size: 0.9rem; color: var(--cs-text); outline: none; font-family: inherit; transition: border-color 0.15s; }
.room-page__search-input:focus { border-color: var(--cs-primary); }

.search-slide-enter-active, .search-slide-leave-active { transition: all 0.18s ease; }
.search-slide-enter-from, .search-slide-leave-to { opacity: 0; transform: translateY(-8px); max-height: 0; }

/* Layout */
.room-page__layout { flex: 1; display: flex; overflow: hidden; }
.room-page__chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

/* Messages */
.room-page__messages { flex: 1; overflow-y: auto; padding: 0.75rem 0; display: flex; flex-direction: column; gap: 0; scroll-behavior: smooth; }
.room-page__empty { flex: 1; display: flex; align-items: center; justify-content: center; }

.room-page__load-more { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem 1.5rem; }

.room-page__msg-skeleton { display: flex; align-items: flex-end; gap: 0.5rem; padding: 0.25rem 1rem; }
.room-page__msg-skeleton--own { flex-direction: row-reverse; }

/* Date separator */
.room-page__date-sep {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  margin: 0.5rem 0;
}
.room-page__date-sep::before,
.room-page__date-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--cs-border);
}
.room-page__date-sep span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cs-text-muted);
  white-space: nowrap;
  background: var(--cs-bg);
  padding: 0.2rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid var(--cs-border);
}

/* Join / Rate limit banners */
.room-page__join-bar, .room-page__rate-limit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--cs-border);
  background: var(--cs-surface);
  flex-shrink: 0;
  font-size: 0.9rem;
  color: var(--cs-text-secondary);
  flex-wrap: wrap;
}
.room-page__rate-limit { color: #f59e0b; background: rgba(245,158,11,0.06); }

/* Members panel */
.room-page__members-panel { width: 220px; min-width: 220px; border-left: 1px solid var(--cs-border); background: var(--cs-surface); display: flex; flex-direction: column; }

.members-panel__header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-bottom: 1px solid var(--cs-border); }
.members-panel__title { font-size: 0.8125rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.members-panel__close { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; border: none; background: transparent; color: var(--cs-text-muted); cursor: pointer; transition: background 0.15s; }
.members-panel__close:hover { background: var(--cs-surface-hover); }

.members-panel__body { flex: 1; overflow-y: auto; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.members-panel__user { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem; border-radius: 0.5rem; transition: background 0.15s; cursor: pointer; }
.members-panel__user:hover { background: var(--cs-surface-hover); }
.members-panel__username { font-size: 0.875rem; font-weight: 500; color: var(--cs-text); }
.members-panel__tag { font-size: 0.75rem; color: var(--cs-text-muted); }

.sidebar-slide-enter-active, .sidebar-slide-leave-active { transition: all 0.2s ease; }
.sidebar-slide-enter-from, .sidebar-slide-leave-to { opacity: 0; transform: translateX(20px); width: 0; min-width: 0; }

@media (max-width: 767px) {
  .room-page__members-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 30; box-shadow: var(--cs-shadow-lg); }
}
</style>
