<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useUiStore } from '@/stores/ui'
import AppInput from '@/components/ui/AppInput.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { User } from '@/types'

const uiStore = useUiStore()
const users    = ref<User[]>([])
const loading  = ref(false)
const search   = ref('')
const banTarget = ref<User | null>(null)
const banReason = ref('')
const showBanModal = ref(false)
const banning  = ref(false)

const MOCK: User[] = [
  { id: 'm1', username: 'alice_99', displayName: 'Alice', avatarUrl: null, bio: null, city: null, country: null, role: 'user', isBanned: false, isVerified: true,  createdAt: new Date().toISOString(), lastSeenAt: new Date().toISOString() },
  { id: 'm2', username: 'bob_dev',  displayName: 'Bob',   avatarUrl: null, bio: null, city: null, country: null, role: 'user', isBanned: false, isVerified: false, createdAt: new Date().toISOString(), lastSeenAt: null },
  { id: 'm3', username: 'bad_user', displayName: 'Bad',   avatarUrl: null, bio: null, city: null, country: null, role: 'user', isBanned: true,  isVerified: false, createdAt: new Date().toISOString(), lastSeenAt: null },
]

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    if (isMockMode) { users.value = MOCK; return }
    const q = supabase!.from(SUPABASE_CONFIG.TABLES.USERS).select('*').order('created_at', { ascending: false }).limit(50)
    const { data } = search.value ? await q.ilike('username', `%${search.value}%`) : await q
    users.value = (data ?? []) as User[]
  } finally { loading.value = false }
}

async function ban(user: User) {
  banTarget.value = user
  showBanModal.value = true
}

async function confirmBan() {
  if (!banTarget.value) return
  banning.value = true
  try {
    if (!isMockMode && supabase) {
      await supabase.from(SUPABASE_CONFIG.TABLES.BANS).insert({ user_id: banTarget.value.id, banned_by: 'admin', reason: banReason.value || 'Sin motivo especificado' })
    }
    const u = users.value.find(u => u.id === banTarget.value!.id)
    if (u) u.isBanned = true
    uiStore.toast.success(`@${banTarget.value.username} baneado`)
    showBanModal.value = false
    banReason.value = ''
  } finally { banning.value = false }
}

async function unban(user: User) {
  if (!isMockMode && supabase) {
    await supabase.from(SUPABASE_CONFIG.TABLES.BANS).delete().eq('user_id', user.id)
    await supabase.from(SUPABASE_CONFIG.TABLES.USERS).update({ is_banned: false }).eq('id', user.id)
  }
  user.isBanned = false
  uiStore.toast.success(`@${user.username} desbaneado`)
}

const roleColors: Record<string, string> = { admin: 'danger', moderator: 'warning', user: 'default', guest: 'default' }
</script>

<template>
  <div class="admin-users">
    <div class="admin-users__toolbar">
      <AppInput v-model="search" placeholder="Buscar usuario..." size="sm" @keyup.enter="load" />
      <AppButton variant="secondary" size="sm" @click="load">Buscar</AppButton>
    </div>

    <div v-if="loading" class="admin-users__list">
      <div v-for="i in 6" :key="i" class="admin-users__skeleton">
        <AppSkeleton width="36px" height="36px" :circle="true" />
        <div style="flex:1"><AppSkeleton width="35%" height="0.875rem" /><AppSkeleton width="25%" height="0.75rem" style="margin-top:0.35rem" /></div>
      </div>
    </div>

    <div v-else-if="users.length" class="admin-users__table" role="table" aria-label="Usuarios">
      <div class="admin-users__head" role="row">
        <span role="columnheader">Usuario</span>
        <span role="columnheader">Rol</span>
        <span role="columnheader">Estado</span>
        <span role="columnheader">Registrado</span>
        <span role="columnheader">Acciones</span>
      </div>
      <div v-for="u in users" :key="u.id" class="admin-users__row" role="row">
        <div class="admin-users__cell admin-users__cell--user" role="cell">
          <AppAvatar :src="u.avatarUrl" :name="u.displayName" size="sm" />
          <div><p class="admin-users__display">{{ u.displayName }}</p><p class="admin-users__tag">@{{ u.username }}</p></div>
        </div>
        <div class="admin-users__cell" role="cell">
          <AppBadge :variant="(roleColors[u.role] as any) ?? 'default'">{{ u.role }}</AppBadge>
        </div>
        <div class="admin-users__cell" role="cell">
          <AppBadge :variant="u.isBanned ? 'danger' : 'success'">{{ u.isBanned ? 'Baneado' : 'Activo' }}</AppBadge>
        </div>
        <div class="admin-users__cell" role="cell">
          <span class="admin-users__date">{{ new Date(u.createdAt).toLocaleDateString('es') }}</span>
        </div>
        <div class="admin-users__cell" role="cell">
          <AppButton v-if="!u.isBanned" variant="danger" size="xs" @click="ban(u)">Banear</AppButton>
          <AppButton v-else variant="secondary" size="xs" @click="unban(u)">Desbanear</AppButton>
        </div>
      </div>
    </div>

    <p v-else class="admin-users__empty">No se encontraron usuarios.</p>

    <AppModal v-model="showBanModal" title="Banear usuario" :description="`Banear a @${banTarget?.username}. Esta acción se puede revertir.`" confirm-label="Confirmar baneo" variant="danger" @confirm="confirmBan">
      <AppInput v-model="banReason" label="Motivo del baneo" placeholder="Especifica el motivo..." />
    </AppModal>
  </div>
</template>

<style scoped>
.admin-users__toolbar { display: flex; gap: 0.625rem; margin-bottom: 1.25rem; align-items: center; }
.admin-users__list { display: flex; flex-direction: column; gap: 0.5rem; }
.admin-users__skeleton { display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem; background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 0.75rem; }

.admin-users__table { border: 1px solid var(--cs-border); border-radius: 0.875rem; overflow: hidden; }
.admin-users__head, .admin-users__row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; align-items: center; padding: 0.75rem 1rem; gap: 0.5rem; }
.admin-users__head { background: var(--cs-surface-2); font-size: 0.75rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.admin-users__row { border-top: 1px solid var(--cs-border); background: var(--cs-surface); transition: background 0.12s; }
.admin-users__row:hover { background: var(--cs-surface-hover); }
.admin-users__cell--user { display: flex; align-items: center; gap: 0.625rem; }
.admin-users__display { font-size: 0.875rem; font-weight: 600; color: var(--cs-text); }
.admin-users__tag { font-size: 0.75rem; color: var(--cs-text-muted); }
.admin-users__date { font-size: 0.8125rem; color: var(--cs-text-muted); }
.admin-users__empty { text-align: center; padding: 2rem; color: var(--cs-text-muted); }

@media (max-width: 767px) {
  .admin-users__head { display: none; }
  .admin-users__row { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
}
</style>
