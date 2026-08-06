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

const uiStore = useUiStore()

// ---- Estado salas ----
const rooms    = ref<Room[]>([])
const loading  = ref(false)
const search   = ref('')
const updating = ref<Record<string, boolean>>({})
const showDeleteModal  = ref(false)
const deleteTarget     = ref<Room | null>(null)
const deleting         = ref(false)

// ---- Estado crear sala ----
const showCreateModal = ref(false)
const creating        = ref(false)
const newRoom = ref({ name: '', description: '', categoryId: 'general', isFeatured: false, maxMembers: 500 })

// ---- Estado solicitudes ----
interface RoomRequest {
  id: string
  room_name: string
  description: string | null
  category_id: string | null
  reason: string | null
  status: string
  created_at: string
  user?: { username: string; display_name: string }
}
const requests    = ref<RoomRequest[]>([])
const loadingReqs = ref(false)
const approvingId = ref('')
const rejectingId = ref('')

const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: 'General', slug: 'general', description: 'Sala principal', coverUrl: null, categoryId: 'general', category: null, ownerId: 'admin', type: 'public', isFeatured: true, isVerified: true, isArchived: false, maxMembers: 1000, memberCount: 0, createdAt: new Date().toISOString() },
]

onMounted(() => { load(); loadRequests() })

async function load() {
  loading.value = true
  try {
    if (isMockMode) { rooms.value = MOCK_ROOMS; return }
    const q = supabase!.from(SUPABASE_CONFIG.TABLES.ROOMS).select('*, category:room_categories(id,name,slug,icon)').order('created_at', { ascending: false }).limit(100)
    const { data } = search.value ? await q.ilike('name', `%${search.value}%`) : await q
    rooms.value = (data ?? []) as unknown as Room[]
  } finally { loading.value = false }
}

async function loadRequests() {
  loadingReqs.value = true
  try {
    if (isMockMode) { requests.value = []; return }
    const { data } = await supabase!
      .from('room_requests')
      .select('*, user:users(username,display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    requests.value = (data ?? []) as RoomRequest[]
  } finally { loadingReqs.value = false }
}

async function createRoom() {
  if (!newRoom.value.name.trim()) { uiStore.toast.error('El nombre es obligatorio'); return }
  creating.value = true
  try {
    if (isMockMode) {
      rooms.value.unshift({ id: `r_${Date.now()}`, name: newRoom.value.name, slug: newRoom.value.name.toLowerCase().replace(/\s+/g,'-'), description: newRoom.value.description, coverUrl: null, categoryId: newRoom.value.categoryId, category: null, ownerId: 'admin', type: 'public', isFeatured: newRoom.value.isFeatured, isVerified: true, isArchived: false, maxMembers: newRoom.value.maxMembers, memberCount: 0, createdAt: new Date().toISOString() })
      uiStore.toast.success('Sala creada')
      showCreateModal.value = false
      return
    }
    const { error } = await supabase!.rpc('create_room_as_admin', {
      p_name:        newRoom.value.name,
      p_slug:        newRoom.value.name.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'-'),
      p_description: newRoom.value.description || null,
      p_category_id: newRoom.value.categoryId || 'general',
      p_type:        'public',
      p_is_featured: newRoom.value.isFeatured,
      p_max_members: newRoom.value.maxMembers,
    })
    if (error) throw error
    uiStore.toast.success('Sala creada correctamente')
    showCreateModal.value = false
    newRoom.value = { name: '', description: '', categoryId: 'general', isFeatured: false, maxMembers: 500 }
    await load()
  } catch (e: unknown) {
    uiStore.toast.error('Error al crear sala', e instanceof Error ? e.message : '')
  } finally { creating.value = false }
}

async function approveRequest(req: RoomRequest) {
  approvingId.value = req.id
  try {
    if (!isMockMode && supabase) {
      const { error } = await supabase.rpc('approve_room_request', { p_request_id: req.id, p_is_featured: false })
      if (error) throw error
    }
    requests.value = requests.value.filter(r => r.id !== req.id)
    uiStore.toast.success(`Sala "${req.room_name}" creada y aprobada`)
    await load()
  } catch (e: unknown) {
    uiStore.toast.error('Error', e instanceof Error ? e.message : '')
  } finally { approvingId.value = '' }
}

async function rejectRequest(req: RoomRequest) {
  rejectingId.value = req.id
  try {
    if (!isMockMode && supabase) {
      const { error } = await supabase.rpc('reject_room_request', { p_request_id: req.id })
      if (error) throw error
    }
    requests.value = requests.value.filter(r => r.id !== req.id)
    uiStore.toast.info('Solicitud rechazada')
  } catch (e: unknown) {
    uiStore.toast.error('Error', e instanceof Error ? e.message : '')
  } finally { rejectingId.value = '' }
}

async function toggleProp(room: Room, prop: 'is_featured' | 'is_verified' | 'is_archived') {
  updating.value[room.id + prop] = true
  const newVal = prop === 'is_featured' ? !room.isFeatured : prop === 'is_verified' ? !room.isVerified : !room.isArchived
  try {
    if (!isMockMode && supabase) await supabase.from(SUPABASE_CONFIG.TABLES.ROOMS).update({ [prop]: newVal }).eq('id', room.id)
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
    if (!isMockMode && supabase) await supabase.from(SUPABASE_CONFIG.TABLES.ROOMS).delete().eq('id', deleteTarget.value.id)
    rooms.value = rooms.value.filter(r => r.id !== deleteTarget.value!.id)
    uiStore.toast.success('Sala eliminada')
    showDeleteModal.value = false
  } catch { uiStore.toast.error('Error al eliminar') }
  finally { deleting.value = false }
}

const typeLabels: Record<string, string> = { public: 'Pública', private: 'Privada', password_protected: 'Con clave' }
const typeBadge:  Record<string, string> = { public: 'success', private: 'warning', password_protected: 'default' }
const categories = ['general', 'tech', 'gaming', 'music', 'sports', 'art', 'science', 'travel', 'food', 'language', 'study', 'news']
</script>

<template>
  <div class="admin-rooms">

    <!-- ===== SOLICITUDES PENDIENTES ===== -->
    <div v-if="loadingReqs || requests.length > 0" class="admin-rooms__requests-section">
      <div class="admin-rooms__section-header">
        <h2 class="admin-rooms__section-title">
          Solicitudes de salas
          <span v-if="requests.length > 0" class="admin-rooms__badge-count">{{ requests.length }}</span>
        </h2>
      </div>

      <div v-if="loadingReqs" class="admin-rooms__list">
        <div v-for="i in 2" :key="i" class="admin-rooms__req-skeleton">
          <AppSkeleton width="40%" height="0.875rem" />
          <AppSkeleton width="60%" height="0.75rem" />
        </div>
      </div>

      <div v-else class="admin-rooms__requests">
        <div v-for="req in requests" :key="req.id" class="admin-rooms__request-card">
          <div class="admin-rooms__request-info">
            <div class="admin-rooms__request-header">
              <p class="admin-rooms__request-name">{{ req.room_name }}</p>
              <span class="admin-rooms__request-user">
                solicitada por <strong>@{{ req.user?.username }}</strong>
              </span>
            </div>
            <p v-if="req.description" class="admin-rooms__request-desc">{{ req.description }}</p>
            <p v-if="req.reason" class="admin-rooms__request-reason">
              <strong>Motivo:</strong> {{ req.reason }}
            </p>
            <time class="admin-rooms__request-time" :datetime="req.created_at">
              {{ new Date(req.created_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
            </time>
          </div>
          <div class="admin-rooms__request-actions">
            <AppButton variant="success" size="sm" :loading="approvingId === req.id" @click="approveRequest(req)">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Aprobar y crear
            </AppButton>
            <AppButton variant="secondary" size="sm" :loading="rejectingId === req.id" @click="rejectRequest(req)">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Rechazar
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== SALAS EXISTENTES ===== -->
    <div class="admin-rooms__toolbar">
      <AppInput v-model="search" placeholder="Buscar sala..." size="sm" style="max-width:280px" @keyup.enter="load" />
      <AppButton variant="secondary" size="sm" @click="load">Buscar</AppButton>
      <AppButton variant="primary" size="sm" @click="showCreateModal = true">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Nueva sala
      </AppButton>
    </div>

    <!-- Skeletons -->
    <div v-if="loading" class="admin-rooms__list">
      <div v-for="i in 4" :key="i" class="admin-rooms__skeleton">
        <AppSkeleton width="40%" height="0.875rem" />
        <AppSkeleton width="25%" height="0.75rem" />
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
        <div class="admin-rooms__cell admin-rooms__cell--name" role="cell">
          <div class="admin-rooms__room-icon" aria-hidden="true">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <div>
            <p class="admin-rooms__room-name">{{ room.name }}</p>
            <p class="admin-rooms__room-slug">/{{ room.slug }}</p>
          </div>
        </div>
        <div class="admin-rooms__cell" role="cell">
          <AppBadge :variant="(typeBadge[room.type] as any) ?? 'default'">{{ typeLabels[room.type] }}</AppBadge>
        </div>
        <div class="admin-rooms__cell" role="cell">
          <span class="admin-rooms__count">{{ room.memberCount }}</span>
        </div>
        <div class="admin-rooms__cell admin-rooms__cell--badges" role="cell">
          <AppBadge v-if="room.isFeatured" variant="warning">Destacada</AppBadge>
          <AppBadge v-if="room.isVerified" variant="primary">Verificada</AppBadge>
          <AppBadge v-if="room.isArchived" variant="default">Archivada</AppBadge>
        </div>
        <div class="admin-rooms__cell admin-rooms__cell--actions" role="cell">
          <button class="admin-rooms__action-btn" :class="{ 'is-active': room.isFeatured }" :disabled="!!updating[room.id + 'is_featured']" title="Destacar" @click="toggleProp(room, 'is_featured')">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" :stroke="room.isFeatured ? '#f59e0b' : 'currentColor'" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          </button>
          <button class="admin-rooms__action-btn" :class="{ 'is-active': room.isVerified }" :disabled="!!updating[room.id + 'is_verified']" title="Verificar" @click="toggleProp(room, 'is_verified')">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" :stroke="room.isVerified ? '#6366f1' : 'currentColor'" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </button>
          <button class="admin-rooms__action-btn" :class="{ 'is-active': room.isArchived }" :disabled="!!updating[room.id + 'is_archived']" title="Archivar" @click="toggleProp(room, 'is_archived')">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" :stroke="room.isArchived ? '#f59e0b' : 'currentColor'" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
          </button>
          <button class="admin-rooms__action-btn admin-rooms__action-btn--danger" title="Eliminar" @click="deleteTarget = room; showDeleteModal = true">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    </div>

    <AppEmptyState v-else title="Sin salas" description="Crea la primera sala desde el botón Nueva sala." icon="chat">
      <AppButton variant="primary" size="sm" @click="showCreateModal = true">Nueva sala</AppButton>
    </AppEmptyState>

    <!-- Modal: Crear sala -->
    <AppModal v-model="showCreateModal" title="Nueva sala" confirm-label="Crear sala" :loading="creating" @confirm="createRoom">
      <div style="display:flex;flex-direction:column;gap:0.875rem">
        <AppInput v-model="newRoom.name" label="Nombre de la sala" placeholder="Mi sala genial" :maxlength="50" :required="true" />
        <AppInput v-model="newRoom.description" label="Descripción" placeholder="¿De qué trata esta sala?" :maxlength="300" />

        <div>
          <p style="font-size:0.875rem;font-weight:500;color:var(--cs-text-secondary);margin-bottom:0.5rem">Categoría</p>
          <select v-model="newRoom.categoryId" style="width:100%;background:var(--cs-surface-2);border:1.5px solid var(--cs-border);border-radius:0.5rem;padding:0.5625rem 0.875rem;font-size:0.9375rem;color:var(--cs-text);outline:none;font-family:inherit">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat.charAt(0).toUpperCase() + cat.slice(1) }}</option>
          </select>
        </div>

        <label style="display:flex;align-items:center;gap:0.625rem;cursor:pointer;font-size:0.875rem;color:var(--cs-text-secondary)">
          <input v-model="newRoom.isFeatured" type="checkbox" style="accent-color:var(--cs-primary);width:16px;height:16px" />
          Marcar como sala destacada
        </label>
      </div>
    </AppModal>

    <!-- Modal: Confirmar borrado -->
    <AppModal v-model="showDeleteModal" title="Eliminar sala" :description="`¿Eliminar permanentemente &quot;${deleteTarget?.name}&quot;?`" confirm-label="Eliminar" variant="danger" :loading="deleting" @confirm="confirmDelete" />
  </div>
</template>

<style scoped>
.admin-rooms__toolbar { display: flex; gap: 0.625rem; margin-bottom: 1.25rem; align-items: center; flex-wrap: wrap; }

/* Solicitudes */
.admin-rooms__requests-section { margin-bottom: 2rem; }
.admin-rooms__section-header   { display: flex; align-items: center; margin-bottom: 0.875rem; }
.admin-rooms__section-title    { font-size: 1rem; font-weight: 700; color: var(--cs-text); display: flex; align-items: center; gap: 0.5rem; }
.admin-rooms__badge-count { min-width: 22px; height: 22px; padding: 0 5px; border-radius: 11px; background: var(--cs-primary); color: #fff; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }

.admin-rooms__requests { display: flex; flex-direction: column; gap: 0.75rem; }
.admin-rooms__req-skeleton { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }

.admin-rooms__request-card {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--cs-surface);
  border: 1px solid rgba(99,102,241,0.25);
  border-left: 4px solid var(--cs-primary);
  border-radius: 0.875rem;
  flex-wrap: wrap;
}

.admin-rooms__request-info { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
.admin-rooms__request-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.admin-rooms__request-name { font-size: 1rem; font-weight: 700; color: var(--cs-text); }
.admin-rooms__request-user { font-size: 0.8125rem; color: var(--cs-text-muted); }
.admin-rooms__request-user strong { color: var(--cs-primary); }
.admin-rooms__request-desc   { font-size: 0.875rem; color: var(--cs-text-secondary); }
.admin-rooms__request-reason { font-size: 0.8125rem; color: var(--cs-text-muted); }
.admin-rooms__request-time   { font-size: 0.75rem; color: var(--cs-text-muted); }
.admin-rooms__request-actions { display: flex; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; }

/* Tabla de salas */
.admin-rooms__list { display: flex; flex-direction: column; gap: 0.75rem; }
.admin-rooms__skeleton { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.admin-rooms__table { border: 1px solid var(--cs-border); border-radius: 0.875rem; overflow: hidden; }
.admin-rooms__head, .admin-rooms__row { display: grid; grid-template-columns: 2.5fr 1fr 0.75fr 1.5fr 1fr; align-items: center; padding: 0.75rem 1rem; gap: 0.5rem; }
.admin-rooms__head { background: var(--cs-surface-2); font-size: 0.75rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.admin-rooms__row  { border-top: 1px solid var(--cs-border); background: var(--cs-surface); transition: background 0.12s; }
.admin-rooms__row:hover { background: var(--cs-surface-hover); }
.admin-rooms__row--archived { opacity: 0.55; }
.admin-rooms__cell--name { display: flex; align-items: center; gap: 0.625rem; }
.admin-rooms__room-icon { width: 30px; height: 30px; border-radius: 7px; background: var(--cs-primary-subtle); color: var(--cs-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.admin-rooms__room-name { font-size: 0.875rem; font-weight: 600; color: var(--cs-text); }
.admin-rooms__room-slug { font-size: 0.75rem; color: var(--cs-text-muted); font-family: monospace; }
.admin-rooms__count { font-size: 0.875rem; font-weight: 600; color: var(--cs-text); }
.admin-rooms__cell--badges { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.admin-rooms__cell--actions { display: flex; gap: 0.25rem; }
.admin-rooms__action-btn { width: 30px; height: 30px; border-radius: 6px; background: transparent; border: 1px solid var(--cs-border); color: var(--cs-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
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
