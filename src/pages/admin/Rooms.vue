<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useUiStore } from '@/stores/ui'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { Room } from '@/types'

const uiStore  = useUiStore()
const rooms    = ref<Room[]>([])
const loading  = ref(false)
const search   = ref('')
const updating = ref<Record<string, boolean>>({})
const showDeleteModal  = ref(false)
const deleteTarget     = ref<Room | null>(null)
const deleting         = ref(false)

const MOCK: Room[] = [
  { id: 'r1', name: 'General',       slug: 'general',       description: 'Sala principal', coverUrl: null, categoryId: 'general', category: null, ownerId: 'admin', type: 'public', isFeatured: true,  isVerified: true,  isArchived: false, maxMembers: 500, memberCount: 42, createdAt: new Date().toISOString() },
  { id: 'r2', name: 'Tecnología',    slug: 'tecnologia',    description: 'Tech y programación', coverUrl: null, categoryId: 'tech',    category: null, ownerId: 'admin', type: 'public', isFeatured: true,  isVerified: false, isArchived: false, maxMembers: 500, memberCount: 28, createdAt: new Date().toISOString() },
  { id: 'r3', name: 'VIP Lounge',    slug: 'vip-lounge',    description: 'Sala privada',    coverUrl: null, categoryId: 'general', category: null, ownerId: 'admin', type: 'password_protected', isFeatured: false, isVerified: false, isArchived: false, maxMembers: 50,  memberCount: 3,  createdAt: new Date().toISOString() },
  { id: 'r4', name: 'Sala archivada', slug: 'archivada',    description: 'Ya no activa',    coverUrl: null, categoryId: 'general', category: null, ownerId: 'admin', type: 'public', isFeatured: false, isVerified: false, isArchived: true,  maxMembers: 200, memberCount: 0,  createdAt: new Date().toISOString() },
]

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    if (isMockMode) { rooms.value = MOCK; return }
    const q = supabase!.from(SUPABASE_CONFIG.TABLES.ROOMS).select('*, category:room_categories(id,name,slug,icon)').order('created_at', { ascending: false }).limit(100)
    const { data } = search.value ? await q.ilike('name', `%${search.value}%`) : await q
    rooms.value = (data ?? []) as unknown as Room[]
  } finally { loading.value = false }
}

async function toggleProp(room: Room, prop: 'is_featured' | 'is_verified' | 'is_archived') {
  updating.value[room.id + prop] = true
  const newVal = prop === 'is_featured' ? !room.isFeatured : prop === 'is_verified' ? !room.isVerified : !room.isArchived
  try {
    if (!isMockMode && supabase) {
      await supabase.from(SUPABASE_CONFIG.TABLES.ROOMS).update({ [prop]: newVal }).eq('id', room.id)
    }
    if (prop === 'is_featured') room.isFeatured = newVal
    if (prop === 'is_verified') room.isVerified = newVal
    if (prop === 'is_archived') room.isArchived = newVal
    uiStore.toast.success('Sala actualizada')
  } catch { uiStore.toast.error('Error al actualizar') }
  finally { delete updating.value[room.id + prop] }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    if (!isMockMode && supabase) {
      await supabase.from(SUPABASE_CONFIG.TABLES.ROOMS).delete().eq('id', deleteTarget.value.id)
    }
    rooms.value = rooms.value.filter(r => r.id !== deleteTarget.value!.id)
    uiStore.toast.success('Sala eliminada')
    showDeleteModal.value = false
  } catch { uiStore.toast.error('Error al eliminar') }
  finally { deleting.value = false }
}

const typeLabels: Record<string, string> = { public: 'Pública', private: 'Privada', password_protected: 'Con clave' }
const typeBadge:  Record<string, string> = { public: 'success', private: 'warning', password_protected: 'default' }
</script>

<template>
  <div class="admin-rooms">
    <!-- Toolbar -->
    <div class="admin-rooms__toolbar">
      <AppInput v-model="search" placeholder="Buscar sala..." size="sm" @keyup.enter="load" />
      <AppButton variant="secondary" size="sm" @click="load">Buscar</AppButton>
    </div>

    <!-- Skeletons -->
    <div v-if="loading" class="admin-rooms__list">
      <div v-for="i in 5" :key="i" class="admin-rooms__skeleton">
        <AppSkeleton width="40%" height="0.875rem" />
        <AppSkeleton width="25%" height="0.75rem" />
        <div style="display:flex;gap:0.5rem"><AppSkeleton width="60px" height="24px" /><AppSkeleton width="60px" height="24px" /></div>
      </div>
    </div>

    <!-- Tabla de salas -->
    <div v-else-if="rooms.length" class="admin-rooms__table" role="table" aria-label="Salas">
      <div class="admin-rooms__head" role="row">
        <span role="columnheader">Sala</span>
        <span role="columnheader">Tipo</span>
        <span role="columnheader">Miembros</span>
        <span role="columnheader">Estado</span>
        <span role="columnheader">Acciones</span>
      </div>
      <div v-for="room in rooms" :key="room.id" class="admin-rooms__row" role="row" :class="{ 'admin-rooms__row--archived': room.isArchived }">

        <!-- Nombre -->
        <div class="admin-rooms__cell admin-rooms__cell--name" role="cell">
          <div class="admin-rooms__room-icon" aria-hidden="true">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <div>
            <p class="admin-rooms__room-name">{{ room.name }}</p>
            <p class="admin-rooms__room-slug">/{{ room.slug }}</p>
          </div>
        </div>

        <!-- Tipo -->
        <div class="admin-rooms__cell" role="cell">
          <AppBadge :variant="(typeBadge[room.type] as any) ?? 'default'">{{ typeLabels[room.type] }}</AppBadge>
        </div>

        <!-- Miembros -->
        <div class="admin-rooms__cell" role="cell">
          <span class="admin-rooms__count">{{ room.memberCount }}</span>
        </div>

        <!-- Estado badges -->
        <div class="admin-rooms__cell admin-rooms__cell--badges" role="cell">
          <AppBadge v-if="room.isFeatured" variant="warning">Destacada</AppBadge>
          <AppBadge v-if="room.isVerified" variant="primary">Verificada</AppBadge>
          <AppBadge v-if="room.isArchived" variant="default">Archivada</AppBadge>
        </div>

        <!-- Acciones -->
        <div class="admin-rooms__cell admin-rooms__cell--actions" role="cell">
          <button
            class="admin-rooms__action-btn"
            :class="{ 'is-active': room.isFeatured }"
            :aria-label="room.isFeatured ? 'Quitar destacada' : 'Destacar sala'"
            :disabled="!!updating[room.id + 'is_featured']"
            :title="room.isFeatured ? 'Quitar destacada' : 'Destacar'"
            @click="toggleProp(room, 'is_featured')"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" :stroke="room.isFeatured ? '#f59e0b' : 'currentColor'" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          </button>
          <button
            class="admin-rooms__action-btn"
            :class="{ 'is-active': room.isVerified }"
            :aria-label="room.isVerified ? 'Quitar verificación' : 'Verificar sala'"
            :disabled="!!updating[room.id + 'is_verified']"
            :title="room.isVerified ? 'Quitar verificación' : 'Verificar'"
            @click="toggleProp(room, 'is_verified')"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" :stroke="room.isVerified ? '#6366f1' : 'currentColor'" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </button>
          <button
            class="admin-rooms__action-btn"
            :class="{ 'is-active': room.isArchived }"
            :aria-label="room.isArchived ? 'Restaurar sala' : 'Archivar sala'"
            :disabled="!!updating[room.id + 'is_archived']"
            :title="room.isArchived ? 'Restaurar' : 'Archivar'"
            @click="toggleProp(room, 'is_archived')"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" :stroke="room.isArchived ? '#f59e0b' : 'currentColor'" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
          </button>
          <button
            class="admin-rooms__action-btn admin-rooms__action-btn--danger"
            aria-label="Eliminar sala"
            title="Eliminar"
            @click="deleteTarget = room; showDeleteModal = true"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    </div>

    <AppEmptyState v-else title="Sin salas" description="No hay salas que coincidan con la búsqueda." icon="chat" />

    <!-- Modal confirmar borrado -->
    <AppModal
      v-model="showDeleteModal"
      title="Eliminar sala"
      :description="`¿Eliminar permanentemente la sala &quot;${deleteTarget?.name}&quot;? Se borrarán todos sus mensajes.`"
      confirm-label="Eliminar"
      variant="danger"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.admin-rooms__toolbar { display: flex; gap: 0.625rem; margin-bottom: 1.25rem; align-items: center; }

.admin-rooms__list { display: flex; flex-direction: column; gap: 0.75rem; }
.admin-rooms__skeleton { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }

.admin-rooms__table { border: 1px solid var(--cs-border); border-radius: 0.875rem; overflow: hidden; }
.admin-rooms__head, .admin-rooms__row { display: grid; grid-template-columns: 2.5fr 1fr 0.75fr 1.5fr 1fr; align-items: center; padding: 0.75rem 1rem; gap: 0.5rem; }
.admin-rooms__head { background: var(--cs-surface-2); font-size: 0.75rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.admin-rooms__row { border-top: 1px solid var(--cs-border); background: var(--cs-surface); transition: background 0.12s; }
.admin-rooms__row:hover { background: var(--cs-surface-hover); }
.admin-rooms__row--archived { opacity: 0.55; }

.admin-rooms__cell--name { display: flex; align-items: center; gap: 0.625rem; }
.admin-rooms__room-icon { width: 30px; height: 30px; border-radius: 7px; background: var(--cs-primary-subtle); color: var(--cs-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.admin-rooms__room-name { font-size: 0.875rem; font-weight: 600; color: var(--cs-text); }
.admin-rooms__room-slug { font-size: 0.75rem; color: var(--cs-text-muted); font-family: monospace; }
.admin-rooms__count { font-size: 0.875rem; font-weight: 600; color: var(--cs-text); }

.admin-rooms__cell--badges { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.admin-rooms__cell--actions { display: flex; gap: 0.25rem; }

.admin-rooms__action-btn {
  width: 30px; height: 30px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--cs-border);
  color: var(--cs-text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.admin-rooms__action-btn:hover { background: var(--cs-surface-hover); color: var(--cs-text); border-color: var(--cs-border-strong); }
.admin-rooms__action-btn.is-active { background: var(--cs-primary-subtle); border-color: var(--cs-primary); }
.admin-rooms__action-btn--danger:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }
.admin-rooms__action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 767px) {
  .admin-rooms__head { display: none; }
  .admin-rooms__row  { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .admin-rooms__cell--badges, .admin-rooms__cell--actions { grid-column: span 2; }
}
</style>
