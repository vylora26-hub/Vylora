<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDmStore } from '@/stores/dm'
import { formatMessageTime } from '@/utils/formatDate'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const router  = useRouter()
const dmStore = useDmStore()

onMounted(() => dmStore.fetchConversations())
</script>

<template>
  <div class="dms-page">
    <header class="dms-page__header">
      <h1 class="dms-page__title">Mensajes</h1>
    </header>

    <!-- Skeletons -->
    <div v-if="dmStore.loading && !dmStore.conversations.length" class="dms-page__list">
      <div v-for="i in 5" :key="i" class="dms-page__skeleton">
        <AppSkeleton width="44px" height="44px" :circle="true" />
        <div style="flex:1;display:flex;flex-direction:column;gap:0.375rem">
          <AppSkeleton width="45%" height="0.875rem" />
          <AppSkeleton width="70%" height="0.75rem" />
        </div>
      </div>
    </div>

    <!-- Lista de conversaciones -->
    <ul v-else-if="dmStore.conversations.length" class="dms-page__list" role="list">
      <li v-for="conv in dmStore.conversations" :key="conv.id">
        <button class="dms-conv" @click="router.push(`/app/dm/${conv.id}`)">
          <AppAvatar
            :src="conv.otherUser?.avatarUrl"
            :name="conv.otherUser?.displayName"
            size="md"
            :show-status="true"
            status="offline"
          />
          <div class="dms-conv__body">
            <div class="dms-conv__top">
              <span class="dms-conv__name">{{ conv.otherUser?.displayName }}</span>
              <span v-if="conv.lastMessageAt" class="dms-conv__time">
                {{ formatMessageTime(conv.lastMessageAt) }}
              </span>
            </div>
            <div class="dms-conv__bottom">
              <span class="dms-conv__preview">
                {{ conv.lastMessage?.content ?? 'Inicia la conversación' }}
              </span>
              <AppBadge v-if="conv.unreadCount" variant="primary">{{ conv.unreadCount }}</AppBadge>
            </div>
          </div>
        </button>
      </li>
    </ul>

    <AppEmptyState
      v-else
      title="Sin conversaciones"
      description="Aún no tienes mensajes privados. Ve al perfil de un usuario y envíale un mensaje."
      icon="envelope"
    />
  </div>
</template>

<style scoped>
.dms-page          { padding: 1.75rem; max-width: 680px; margin: 0 auto; }
.dms-page__header  { margin-bottom: 1.5rem; }
.dms-page__title   { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.dms-page__list    { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
.dms-page__skeleton{ display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem; background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; }

.dms-conv {
  width: 100%; display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1rem; border-radius: 0.75rem;
  background: var(--cs-surface); border: 1px solid var(--cs-border);
  cursor: pointer; text-align: left;
  transition: border-color 0.15s, background 0.15s;
}
.dms-conv:hover { border-color: var(--cs-primary); background: var(--cs-surface-hover); }

.dms-conv__body  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
.dms-conv__top   { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.dms-conv__name  { font-size: 0.9375rem; font-weight: 600; color: var(--cs-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dms-conv__time  { font-size: 0.75rem; color: var(--cs-text-muted); flex-shrink: 0; }
.dms-conv__bottom{ display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.dms-conv__preview{ font-size: 0.8125rem; color: var(--cs-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
