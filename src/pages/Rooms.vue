<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomsStore } from '@/stores/rooms'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDebounce } from '@/composables/useDebounce'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import type { CreateRoomPayload } from '@/types'

const router     = useRouter()
const roomsStore = useRoomsStore()
const authStore  = useAuthStore()
const uiStore    = useUiStore()

const search        = ref('')
const searchDebounced = useDebounce(search, 300)
const activeCategory = ref('')
const showCreate    = ref(false)
const showJoinModal = ref(false)
const joinPassword  = ref('')
const joiningRoomId = ref('')
const joining       = ref(false)
const creating      = ref(false)

const newRoom = ref<CreateRoomPayload>({ name: '', description: '', categoryId: '', type: 'public' })

const roomTypeIcons: Record<string, string> = {
  public:             'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
  private:            'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  password_protected: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
}

onMounted(async () => {
  await Promise.all([
    roomsStore.fetchCategories(),
    roomsStore.fetchRooms(),
  ])
})

watch(searchDebounced, (q) => roomsStore.fetchRooms({ search: q, categoryId: activeCategory.value || undefined }))
watch(activeCategory, (cat) => roomsStore.fetchRooms({ search: searchDebounced.value, categoryId: cat || undefined }))

async function handleJoin(roomId: string, type: string) {
  if (!authStore.isAuthenticated) { router.push('/auth/login'); return }
  if (type === 'password_protected') {
    joiningRoomId.value = roomId
    showJoinModal.value = true
    return
  }
  joining.value = true
  const ok = await roomsStore.joinRoom(roomId)
  joining.value = false
  if (ok) {
    const room = roomsStore.rooms.find(r => r.id === roomId)
    if (room) router.push(`/app/room/${room.slug}`)
  } else {
    uiStore.toast.error('No se pudo unir a la sala')
  }
}

async function handleJoinWithPassword() {
  joining.value = true
  const ok = await roomsStore.joinRoom(joiningRoomId.value, joinPassword.value)
  joining.value = false
  if (ok) {
    showJoinModal.value = false
    joinPassword.value = ''
    const room = roomsStore.rooms.find(r => r.id === joiningRoomId.value)
    if (room) router.push(`/app/room/${room.slug}`)
  } else {
    uiStore.toast.error('Contraseña incorrecta')
  }
}

async function handleCreate() {
  if (!newRoom.value.name.trim()) { uiStore.toast.error('El nombre es obligatorio'); return }
  creating.value = true
  const room = await roomsStore.createRoom(newRoom.value)
  creating.value = false
  if (room) {
    showCreate.value = false
    newRoom.value = { name: '', description: '', categoryId: '', type: 'public' }
    router.push(`/app/room/${room.slug}`)
  } else {
    uiStore.toast.error('No se pudo crear la sala')
  }
}

function goToRoom(slug: string, isMember: boolean, type: string, roomId: string) {
  if (isMember) { router.push(`/app/room/${slug}`); return }
  handleJoin(roomId, type)
}

const filteredRooms = computed(() => roomsStore.rooms)
</script>

<template>
  <div class="rooms-page">
    <!-- Header -->
    <header class="rooms-page__header">
      <div>
        <h1 class="rooms-page__title">Salas</h1>
        <p class="rooms-page__sub">Explora y únete a conversaciones</p>
      </div>
      <AppButton v-if="authStore.isAuthenticated" variant="primary" size="sm" @click="showCreate = true">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Nueva sala
      </AppButton>
    </header>

    <!-- Búsqueda -->
    <div class="rooms-page__search">
      <AppInput v-model="search" placeholder="Buscar salas..." type="search" autocomplete="off" />
    </div>

    <!-- Categorías -->
    <div class="rooms-page__cats" role="list" aria-label="Categorías">
      <button
        class="cat-btn" :class="{ 'is-active': activeCategory === '' }"
        role="listitem" @click="activeCategory = ''"
      >Todas</button>
      <button
        v-for="cat in roomsStore.categories" :key="cat.id"
        class="cat-btn" :class="{ 'is-active': activeCategory === cat.id }"
        role="listitem" @click="activeCategory = cat.id"
      >{{ cat.name }}</button>
    </div>

    <!-- Skeletons -->
    <div v-if="roomsStore.loading" class="rooms-page__grid">
      <div v-for="i in 6" :key="i" class="room-skeleton">
        <AppSkeleton height="1rem" width="60%" />
        <AppSkeleton height="0.75rem" width="80%" />
        <AppSkeleton height="0.75rem" width="40%" />
      </div>
    </div>

    <!-- Grid de salas -->
    <div v-else-if="filteredRooms.length" class="rooms-page__grid">
      <article
        v-for="room in filteredRooms" :key="room.id"
        class="room-card"
        :class="{ 'room-card--member': room.isMember }"
        @click="goToRoom(room.slug, !!room.isMember, room.type, room.id)"
      >
        <!-- Cabecera de la card -->
        <div class="room-card__header">
          <div class="room-card__icon" aria-hidden="true">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="roomTypeIcons[room.type]" />
            </svg>
          </div>
          <div class="room-card__badges">
            <AppBadge v-if="room.isVerified" variant="primary">
              <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              Verificada
            </AppBadge>
            <AppBadge v-if="room.isFeatured" variant="warning">Destacada</AppBadge>
            <AppBadge v-if="room.isMember" variant="success">Unido</AppBadge>
          </div>
        </div>

        <!-- Info -->
        <h3 class="room-card__name">{{ room.name }}</h3>
        <p v-if="room.description" class="room-card__desc">{{ room.description }}</p>

        <!-- Footer -->
        <div class="room-card__footer">
          <span class="room-card__members">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {{ room.memberCount }}
          </span>
          <span v-if="room.category" class="room-card__cat">{{ room.category.name }}</span>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <AppEmptyState
      v-else
      title="No hay salas"
      :description="search ? `Sin resultados para &quot;${search}&quot;` : 'Sé el primero en crear una sala.'"
      icon="chat"
    >
      <AppButton v-if="authStore.isAuthenticated" variant="outline" size="sm" @click="showCreate = true">
        Crear sala
      </AppButton>
    </AppEmptyState>

    <!-- Modal: Unirse con contraseña -->
    <AppModal
      v-model="showJoinModal"
      title="Sala protegida"
      description="Esta sala requiere contraseña para entrar."
      confirm-label="Entrar"
      :loading="joining"
      @confirm="handleJoinWithPassword"
    >
      <AppInput v-model="joinPassword" label="Contraseña" type="password" placeholder="••••••••" :required="true" />
    </AppModal>

    <!-- Modal: Crear sala -->
    <AppModal
      v-model="showCreate"
      title="Nueva sala"
      confirm-label="Crear"
      @confirm="handleCreate"
    >
      <div style="display:flex;flex-direction:column;gap:0.875rem">
        <AppInput v-model="newRoom.name" label="Nombre" placeholder="Mi sala genial" :maxlength="50" :required="true" />
        <AppInput v-model="newRoom.description" label="Descripción" placeholder="¿De qué se trata esta sala?" :maxlength="300" />

        <div>
          <p class="modal-label">Tipo</p>
          <div class="modal-type-btns">
            <button v-for="t in ['public','private','password_protected']" :key="t" class="type-btn" :class="{ 'is-active': newRoom.type === t }" @click="newRoom.type = t as CreateRoomPayload['type']">
              {{ t === 'public' ? '🌐 Pública' : t === 'private' ? '🔒 Privada' : '🔑 Contraseña' }}
            </button>
          </div>
        </div>

        <AppInput
          v-if="newRoom.type === 'password_protected'"
          v-model="(newRoom as any).password"
          label="Contraseña de la sala"
          type="password"
          placeholder="Mínimo 4 caracteres"
          :required="true"
        />
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.rooms-page { padding: 1.75rem; max-width: 1100px; margin: 0 auto; }

.rooms-page__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
.rooms-page__title  { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.rooms-page__sub    { font-size: 0.875rem; color: var(--cs-text-muted); margin-top: 0.2rem; }

.rooms-page__search { margin-bottom: 1rem; max-width: 420px; }

.rooms-page__cats { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }

.cat-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  border: 1px solid var(--cs-border);
  background: var(--cs-surface);
  color: var(--cs-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.cat-btn:hover, .cat-btn.is-active { background: var(--cs-primary-subtle); color: var(--cs-primary); border-color: var(--cs-primary); }

.rooms-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.room-skeleton { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.875rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }

.room-card {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.room-card:hover { border-color: var(--cs-primary); transform: translateY(-2px); box-shadow: var(--cs-shadow-md); }
.room-card--member { border-color: rgba(34,197,94,0.3); }

.room-card__header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.room-card__icon { width: 36px; height: 36px; border-radius: 8px; background: var(--cs-primary-subtle); color: var(--cs-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.room-card__badges { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.room-card__name { font-size: 1rem; font-weight: 700; color: var(--cs-text); }
.room-card__desc { font-size: 0.8125rem; color: var(--cs-text-muted); line-height: 1.5; flex: 1; }
.room-card__footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.5rem; border-top: 1px solid var(--cs-border); }
.room-card__members { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8125rem; color: var(--cs-text-muted); }
.room-card__cat { font-size: 0.75rem; color: var(--cs-text-muted); background: var(--cs-surface-2); padding: 0.2rem 0.5rem; border-radius: 9999px; }

.modal-label { font-size: 0.875rem; font-weight: 500; color: var(--cs-text-secondary); margin-bottom: 0.5rem; }
.modal-type-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.type-btn { padding: 0.4rem 0.875rem; border-radius: 0.5rem; border: 1.5px solid var(--cs-border); background: var(--cs-surface-2); font-size: 0.8125rem; font-weight: 500; color: var(--cs-text-secondary); cursor: pointer; transition: all 0.15s; }
.type-btn.is-active { border-color: var(--cs-primary); color: var(--cs-primary); background: var(--cs-primary-subtle); }
</style>
