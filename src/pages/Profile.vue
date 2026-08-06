<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { validateDisplayName, validateBio } from '@/utils/validation'
import { sanitizeText } from '@/utils/sanitize'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
// AppModal y AppSkeleton reservados para funcionalidad futura

const authStore = useAuthStore()
const uiStore = useUiStore()

const editing = ref(false)
const savingProfile = ref(false)
const uploadingAvatar = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  displayName: '',
  bio: '',
  city: '',
  country: '',
})
const errors = reactive({ displayName: '', bio: '' })

onMounted(() => {
  if (authStore.user) {
    form.displayName = authStore.user.displayName
    form.bio = authStore.user.bio ?? ''
    form.city = authStore.user.city ?? ''
    form.country = authStore.user.country ?? ''
  }
})

const stats = computed(() => [
  { label: 'Miembro desde', value: authStore.user?.createdAt ? new Date(authStore.user.createdAt).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : '—' },
  { label: 'Último acceso', value: authStore.user?.lastSeenAt ? new Date(authStore.user.lastSeenAt).toLocaleDateString('es') : 'Hoy' },
])

function startEdit() {
  form.displayName = authStore.user?.displayName ?? ''
  form.bio = authStore.user?.bio ?? ''
  form.city = authStore.user?.city ?? ''
  form.country = authStore.user?.country ?? ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  errors.displayName = ''
  errors.bio = ''
}

async function saveProfile() {
  errors.displayName = validateDisplayName(form.displayName).error ?? ''
  errors.bio = validateBio(form.bio).error ?? ''
  if (errors.displayName || errors.bio) return

  savingProfile.value = true
  try {
    const updates = {
      display_name: sanitizeText(form.displayName),
      bio: sanitizeText(form.bio),
      city: sanitizeText(form.city),
      country: sanitizeText(form.country),
    }

    if (!isMockMode && supabase && authStore.userId) {
      const { error } = await supabase.from(SUPABASE_CONFIG.TABLES.USERS).update(updates).eq('id', authStore.userId)
      if (error) throw error
    }

    authStore.updateUserLocally({
      displayName: updates.display_name,
      bio: updates.bio,
      city: updates.city,
      country: updates.country,
    })

    editing.value = false
    uiStore.toast.success('Perfil actualizado')
  } catch {
    uiStore.toast.error('Error al guardar', 'Intenta de nuevo.')
  } finally {
    savingProfile.value = false
  }
}

async function handleAvatarUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { uiStore.toast.error('La imagen no puede superar 2 MB'); return }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { uiStore.toast.error('Formato no válido. Usa JPG, PNG o WebP'); return }

  uploadingAvatar.value = true
  try {
    if (isMockMode) {
      const localUrl = URL.createObjectURL(file)
      authStore.updateUserLocally({ avatarUrl: localUrl })
      uiStore.toast.success('Avatar actualizado')
      return
    }
    const ext = file.name.split('.').pop()
    const path = `${authStore.userId}/avatar.${ext}`
    const { error: upErr } = await supabase!.storage.from(SUPABASE_CONFIG.STORAGE.AVATARS).upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data } = supabase!.storage.from(SUPABASE_CONFIG.STORAGE.AVATARS).getPublicUrl(path)
    const avatarUrl = data.publicUrl + '?t=' + Date.now()
    await supabase!.from(SUPABASE_CONFIG.TABLES.USERS).update({ avatar_url: avatarUrl }).eq('id', authStore.userId)
    authStore.updateUserLocally({ avatarUrl })
    uiStore.toast.success('Avatar actualizado')
  } catch {
    uiStore.toast.error('Error al subir la imagen')
  } finally {
    uploadingAvatar.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- Cover -->
    <div class="profile-page__cover" aria-hidden="true">
      <div class="profile-page__cover-gradient" />
    </div>

    <div class="profile-page__body">
      <!-- Top row: avatar + acciones -->
      <div class="profile-page__top">
        <!-- Avatar con botón de cambio -->
        <div class="profile-page__avatar-wrap">
          <AppAvatar
            :src="authStore.user?.avatarUrl"
            :name="authStore.user?.displayName"
            size="xl"
            :show-status="true"
            status="online"
            class="profile-page__avatar"
          />
          <button
            class="profile-page__avatar-btn"
            :aria-label="uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'"
            :disabled="uploadingAvatar"
            @click="fileInput?.click()"
          >
            <svg v-if="!uploadingAvatar" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <svg v-else class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round" />
            </svg>
          </button>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" aria-hidden="true" @change="handleAvatarUpload" />
        </div>

        <!-- Acciones -->
        <div class="profile-page__actions">
          <AppButton v-if="!editing" variant="secondary" size="sm" @click="startEdit">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar perfil
          </AppButton>
          <template v-else>
            <AppButton variant="primary" size="sm" :loading="savingProfile" @click="saveProfile">Guardar</AppButton>
            <AppButton variant="ghost" size="sm" @click="cancelEdit">Cancelar</AppButton>
          </template>
        </div>
      </div>

      <!-- Info del perfil -->
      <div class="profile-page__info">
        <template v-if="!editing">
          <div class="profile-page__name-row">
            <h1 class="profile-page__name">{{ authStore.user?.displayName }}</h1>
            <AppBadge v-if="authStore.user?.isVerified" variant="primary">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              Verificado
            </AppBadge>
            <AppBadge v-if="authStore.isAdmin" variant="danger">Admin</AppBadge>
            <AppBadge v-else-if="authStore.isModerator" variant="warning">Mod</AppBadge>
          </div>
          <p class="profile-page__username">@{{ authStore.user?.username }}</p>
          <p v-if="authStore.user?.bio" class="profile-page__bio">{{ authStore.user.bio }}</p>
          <div class="profile-page__meta">
            <span v-if="authStore.user?.city || authStore.user?.country" class="profile-page__meta-item">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {{ [authStore.user?.city, authStore.user?.country].filter(Boolean).join(', ') }}
            </span>
            <span v-for="s in stats" :key="s.label" class="profile-page__meta-item">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {{ s.label }}: <strong>{{ s.value }}</strong>
            </span>
          </div>
        </template>

        <!-- Formulario de edición -->
        <template v-else>
          <div class="profile-page__form">
            <AppInput v-model="form.displayName" label="Nombre visible" placeholder="Tu nombre" :error="errors.displayName" :maxlength="50" />
            <AppInput v-model="form.bio" label="Biografía" placeholder="Cuéntanos algo sobre ti..." :error="errors.bio" :maxlength="300" />
            <div class="profile-page__form-row">
              <AppInput v-model="form.city" label="Ciudad" placeholder="Bogotá" />
              <AppInput v-model="form.country" label="País" placeholder="Colombia" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page { max-width: 720px; margin: 0 auto; min-height: 100dvh; }

.profile-page__cover {
  height: 180px;
  position: relative;
  overflow: hidden;
}

.profile-page__cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  opacity: 0.75;
}

.profile-page__body { padding: 0 1.5rem 2.5rem; }

.profile-page__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: -44px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.profile-page__avatar-wrap { position: relative; }

.profile-page__avatar {
  outline: 4px solid var(--cs-bg);
  border-radius: 50%;
}

.profile-page__avatar-btn {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--cs-primary);
  border: 2px solid var(--cs-bg);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.profile-page__avatar-btn:hover { background: var(--cs-primary-hover); }
.profile-page__avatar-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.profile-page__actions { display: flex; gap: 0.5rem; }

.profile-page__info { display: flex; flex-direction: column; gap: 0.5rem; }

.profile-page__name-row { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
.profile-page__name { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); letter-spacing: -0.02em; }
.profile-page__username { font-size: 0.9375rem; color: var(--cs-text-muted); }
.profile-page__bio { font-size: 0.9375rem; color: var(--cs-text-secondary); line-height: 1.6; max-width: 520px; }

.profile-page__meta { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.25rem; }
.profile-page__meta-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--cs-text-muted); }
.profile-page__meta-item strong { color: var(--cs-text-secondary); font-weight: 500; }

.profile-page__form { display: flex; flex-direction: column; gap: 0.875rem; max-width: 480px; margin-top: 0.5rem; }
.profile-page__form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
</style>
