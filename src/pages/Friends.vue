<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendsStore } from '@/stores/friends'
import { useUiStore } from '@/stores/ui'
import { useDebounce } from '@/composables/useDebounce'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { Friendship, PublicUser } from '@/types'

const router       = useRouter()
const friendsStore = useFriendsStore()
const uiStore      = useUiStore()

type Tab = 'friends' | 'requests' | 'blocked' | 'search'
const tab = ref<Tab>('friends')

const searchQuery   = ref('')
const searchDebounced = useDebounce(searchQuery, 350)
const removingId    = ref('')
const showRemoveModal = ref(false)
const targetFriend  = ref<Friendship | null>(null)
const accepting     = ref<Record<string, boolean>>({})
const rejecting     = ref<Record<string, boolean>>({})
const sendingTo     = ref<Record<string, boolean>>({})

onMounted(() => friendsStore.fetchFriends())

watch(searchDebounced, async (q) => {
  if (tab.value === 'search' && q.trim()) await friendsStore.searchUsers(q)
  else if (!q.trim()) friendsStore.searchResults = []
})

watch(tab, (t) => { if (t !== 'search') { searchQuery.value = ''; friendsStore.searchResults = [] } })

async function handleAccept(id: string) {
  accepting.value[id] = true
  await friendsStore.acceptRequest(id)
  delete accepting.value[id]
  uiStore.toast.success('Solicitud aceptada')
}

async function handleReject(id: string) {
  rejecting.value[id] = true
  await friendsStore.rejectRequest(id)
  delete rejecting.value[id]
}

function confirmRemove(f: Friendship) {
  targetFriend.value = f
  removingId.value   = f.id
  showRemoveModal.value = true
}

async function doRemove() {
  if (!removingId.value) return
  await friendsStore.removeFriend(removingId.value)
  showRemoveModal.value = false
  uiStore.toast.info('Amigo eliminado')
}

async function sendRequest(user: PublicUser) {
  sendingTo.value[user.id] = true
  const ok = await friendsStore.sendRequest(user.id)
  delete sendingTo.value[user.id]
  if (ok) uiStore.toast.success(`Solicitud enviada a @${user.username}`)
  else uiStore.toast.error('No se pudo enviar la solicitud')
}

const tabs: { key: Tab; label: string; count?: () => number }[] = [
  { key: 'friends',  label: 'Amigos',      count: () => friendsStore.friends.length },
  { key: 'requests', label: 'Solicitudes',  count: () => friendsStore.pending.length },
  { key: 'search',   label: 'Buscar' },
]
</script>

<template>
  <div class="friends-page">
    <header class="friends-page__header">
      <h1 class="friends-page__title">Amigos</h1>
    </header>

    <!-- Tabs -->
    <div class="friends-page__tabs" role="tablist" aria-label="Secciones">
      <button
        v-for="t in tabs" :key="t.key"
        role="tab"
        class="friends-page__tab"
        :class="{ 'is-active': tab === t.key }"
        :aria-selected="tab === t.key"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span v-if="t.count && t.count() > 0" class="friends-page__tab-badge">{{ t.count() }}</span>
      </button>
    </div>

    <!-- Tab: Mis amigos -->
    <div v-if="tab === 'friends'" role="tabpanel">
      <div v-if="friendsStore.loading" class="friends-list">
        <div v-for="i in 4" :key="i" class="friend-skeleton">
          <AppSkeleton width="40px" height="40px" :circle="true" />
          <div style="flex:1"><AppSkeleton width="45%" height="0.875rem" /><AppSkeleton width="30%" height="0.75rem" style="margin-top:0.35rem" /></div>
        </div>
      </div>
      <ul v-else-if="friendsStore.friends.length" class="friends-list" role="list">
        <li v-for="f in friendsStore.friends" :key="f.id" class="friend-item">
          <button class="friend-item__info" @click="router.push(`/app/user/${f.otherUser?.username}`)">
            <AppAvatar :src="f.otherUser?.avatarUrl" :name="f.otherUser?.displayName" size="sm" :show-status="true" status="offline" />
            <div class="friend-item__text">
              <span class="friend-item__name">{{ f.otherUser?.displayName }}</span>
              <span class="friend-item__tag">@{{ f.otherUser?.username }}</span>
            </div>
          </button>
          <div class="friend-item__actions">
            <AppButton variant="ghost" size="xs" @click="router.push('/app/dm')">Mensaje</AppButton>
            <AppButton variant="ghost" size="xs" @click="confirmRemove(f)">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg>
            </AppButton>
          </div>
        </li>
      </ul>
      <AppEmptyState v-else title="Sin amigos aún" description="Busca personas por su nombre de usuario y envíales una solicitud." icon="users">
        <AppButton variant="outline" size="sm" @click="tab = 'search'">Buscar personas</AppButton>
      </AppEmptyState>
    </div>

    <!-- Tab: Solicitudes pendientes -->
    <div v-else-if="tab === 'requests'" role="tabpanel">
      <div v-if="friendsStore.pending.length">
        <p class="friends-page__section-label">Recibidas</p>
        <ul class="friends-list" role="list">
          <li v-for="f in friendsStore.pending" :key="f.id" class="friend-item">
            <div class="friend-item__info" style="cursor:default">
              <AppAvatar :src="f.otherUser?.avatarUrl" :name="f.otherUser?.displayName" size="sm" />
              <div class="friend-item__text">
                <span class="friend-item__name">{{ f.otherUser?.displayName }}</span>
                <span class="friend-item__tag">@{{ f.otherUser?.username }}</span>
              </div>
            </div>
            <div class="friend-item__actions">
              <AppButton variant="primary" size="xs" :loading="accepting[f.id]" @click="handleAccept(f.id)">Aceptar</AppButton>
              <AppButton variant="secondary" size="xs" :loading="rejecting[f.id]" @click="handleReject(f.id)">Rechazar</AppButton>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="friendsStore.sent.length" style="margin-top:1.5rem">
        <p class="friends-page__section-label">Enviadas</p>
        <ul class="friends-list" role="list">
          <li v-for="f in friendsStore.sent" :key="f.id" class="friend-item">
            <div class="friend-item__info" style="cursor:default">
              <AppAvatar :src="f.otherUser?.avatarUrl" :name="f.otherUser?.displayName" size="sm" />
              <div class="friend-item__text">
                <span class="friend-item__name">{{ f.otherUser?.displayName }}</span>
                <span class="friend-item__tag">@{{ f.otherUser?.username }}</span>
              </div>
            </div>
            <AppBadge variant="default">Pendiente</AppBadge>
          </li>
        </ul>
      </div>

      <AppEmptyState v-if="!friendsStore.pending.length && !friendsStore.sent.length" title="Sin solicitudes" description="Aquí aparecerán las solicitudes de amistad que recibas o envíes." icon="bell" />
    </div>

    <!-- Tab: Buscar -->
    <div v-else-if="tab === 'search'" role="tabpanel">
      <div class="friends-page__search">
        <AppInput v-model="searchQuery" placeholder="Buscar por nombre de usuario..." type="search" autocomplete="off" />
      </div>

      <ul v-if="friendsStore.searchResults.length" class="friends-list" role="list">
        <li v-for="user in friendsStore.searchResults" :key="user.id" class="friend-item">
          <button class="friend-item__info" @click="router.push(`/app/user/${user.username}`)">
            <AppAvatar :src="user.avatarUrl" :name="user.displayName" size="sm" />
            <div class="friend-item__text">
              <span class="friend-item__name">{{ user.displayName }}</span>
              <span class="friend-item__tag">@{{ user.username }}</span>
            </div>
          </button>
          <AppButton
            variant="primary"
            size="xs"
            :loading="sendingTo[user.id]"
            :disabled="friendsStore.friendIds.includes(user.id)"
            @click="sendRequest(user)"
          >
            {{ friendsStore.friendIds.includes(user.id) ? 'Amigo' : 'Agregar' }}
          </AppButton>
        </li>
      </ul>

      <AppEmptyState v-else-if="!searchQuery.trim()" title="Busca personas" description="Escribe el nombre de usuario de la persona que quieres agregar." icon="search" />
      <AppEmptyState v-else title="Sin resultados" :description="`No encontramos a ningún usuario con &quot;${searchQuery}&quot;.`" icon="search" />
    </div>

    <!-- Modal confirmar eliminar amigo -->
    <AppModal
      v-model="showRemoveModal"
      title="Eliminar amigo"
      :description="`¿Eliminar a ${targetFriend?.otherUser?.displayName} de tus amigos?`"
      confirm-label="Eliminar"
      variant="danger"
      @confirm="doRemove"
    />
  </div>
</template>

<style scoped>
.friends-page          { padding: 1.75rem; max-width: 680px; margin: 0 auto; }
.friends-page__header  { margin-bottom: 1.5rem; }
.friends-page__title   { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }

.friends-page__tabs    { display: flex; gap: 0; margin-bottom: 1.75rem; border-bottom: 1px solid var(--cs-border); }
.friends-page__tab {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1.125rem;
  font-size: 0.9375rem; font-weight: 500; color: var(--cs-text-muted);
  background: transparent; border: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}
.friends-page__tab:hover          { color: var(--cs-text); }
.friends-page__tab.is-active      { color: var(--cs-primary); border-bottom-color: var(--cs-primary); }
.friends-page__tab-badge {
  min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px;
  background: var(--cs-primary); color: #fff; font-size: 0.6875rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.friends-page__section-label { font-size: 0.75rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.75rem; }
.friends-page__search { margin-bottom: 1.25rem; }

.friends-list  { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }

.friend-item   {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.75rem 1rem;
  background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem;
  transition: border-color 0.15s;
}
.friend-item:hover { border-color: var(--cs-border-strong); }

.friend-item__info   { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; background: none; border: none; cursor: pointer; text-align: left; }
.friend-item__text   { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.friend-item__name   { font-size: 0.9375rem; font-weight: 600; color: var(--cs-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.friend-item__tag    { font-size: 0.8125rem; color: var(--cs-text-muted); }
.friend-item__actions{ display: flex; gap: 0.375rem; flex-shrink: 0; }

.friend-skeleton { display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem 1rem; background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; }
</style>
