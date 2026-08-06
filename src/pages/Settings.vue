<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { ref } from 'vue'
import type { Theme } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const showLogoutModal = ref(false)
const savingSettings = ref(false)

const settings = reactive({
  theme: uiStore.theme as Theme,
  soundEnabled: true,
  showOnlineStatus: true,
  allowDmFromStrangers: true,
  pushNotifications: false,
})

onMounted(async () => {
  if (isMockMode || !supabase || !authStore.userId) return
  const { data } = await supabase.from(SUPABASE_CONFIG.TABLES.USER_SETTINGS).select('*').eq('user_id', authStore.userId).single()
  if (data) {
    settings.theme = data.theme as Theme
    settings.soundEnabled = data.sound_enabled
    settings.showOnlineStatus = data.show_online_status
    settings.allowDmFromStrangers = data.allow_dm_from_strangers
    settings.pushNotifications = data.push_notifications
    uiStore.setTheme(data.theme as Theme)
  }
})

async function saveSettings() {
  savingSettings.value = true
  uiStore.setTheme(settings.theme)
  try {
    if (!isMockMode && supabase && authStore.userId) {
      await supabase.from(SUPABASE_CONFIG.TABLES.USER_SETTINGS).update({
        theme: settings.theme,
        sound_enabled: settings.soundEnabled,
        show_online_status: settings.showOnlineStatus,
        allow_dm_from_strangers: settings.allowDmFromStrangers,
        push_notifications: settings.pushNotifications,
      }).eq('user_id', authStore.userId)
    }
    uiStore.toast.success('Configuración guardada')
  } catch { uiStore.toast.error('Error al guardar') }
  finally { savingSettings.value = false }
}

async function confirmLogout() {
  showLogoutModal.value = false
  await authStore.logout()
  router.push('/')
}

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'dark',   label: 'Oscuro',  icon: '🌙' },
  { value: 'light',  label: 'Claro',   icon: '☀️' },
  { value: 'system', label: 'Sistema', icon: '💻' },
]
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <h1 class="settings-page__title">Configuración</h1>
    </div>

    <!-- Apariencia -->
    <section class="settings-page__section" aria-labelledby="s-appearance">
      <h2 id="s-appearance" class="settings-page__section-title">Apariencia</h2>
      <div class="settings-card">
        <p class="settings-card__label">Tema</p>
        <div class="settings-card__themes" role="radiogroup" aria-label="Seleccionar tema">
          <label
            v-for="t in themes"
            :key="t.value"
            class="theme-option"
            :class="{ 'is-active': settings.theme === t.value }"
          >
            <input type="radio" name="theme" :value="t.value" :checked="settings.theme === t.value" class="sr-only" @change="settings.theme = t.value" />
            <span class="theme-option__icon">{{ t.icon }}</span>
            <span>{{ t.label }}</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Privacidad -->
    <section class="settings-page__section" aria-labelledby="s-privacy">
      <h2 id="s-privacy" class="settings-page__section-title">Privacidad</h2>
      <div class="settings-card">
        <div v-for="toggle in toggles" :key="toggle.key" class="settings-toggle">
          <div class="settings-toggle__info">
            <p class="settings-toggle__label">{{ toggle.label }}</p>
            <p class="settings-toggle__desc">{{ toggle.desc }}</p>
          </div>
          <button
            role="switch"
            :aria-checked="settings[toggle.key as keyof typeof settings] as boolean"
            class="toggle-btn"
            :class="{ 'is-on': settings[toggle.key as keyof typeof settings] }"
            @click="(settings[toggle.key as keyof typeof settings] as boolean) = !(settings[toggle.key as keyof typeof settings] as boolean)"
          >
            <span class="toggle-btn__thumb" />
          </button>
        </div>
      </div>
    </section>

    <!-- Cuenta -->
    <section class="settings-page__section" aria-labelledby="s-account">
      <h2 id="s-account" class="settings-page__section-title">Cuenta</h2>
      <div class="settings-card">
        <div class="settings-account-row">
          <div>
            <p class="settings-card__label">Usuario</p>
            <p class="settings-account-row__value">@{{ authStore.user?.username }}</p>
          </div>
        </div>
        <hr class="divider" style="margin: 1rem 0" />
        <div class="settings-account-row">
          <div>
            <p class="settings-card__label">Cerrar sesión</p>
            <p class="settings-account-row__hint">Saldrás de tu cuenta en este dispositivo.</p>
          </div>
          <AppButton variant="danger" size="sm" @click="showLogoutModal = true">Salir</AppButton>
        </div>
      </div>
    </section>

    <!-- Guardar -->
    <div class="settings-page__footer">
      <AppButton variant="primary" size="md" :loading="savingSettings" @click="saveSettings">
        Guardar cambios
      </AppButton>
    </div>

    <!-- Modal logout -->
    <AppModal
      v-model="showLogoutModal"
      title="Cerrar sesión"
      description="¿Seguro que quieres salir de tu cuenta?"
      confirm-label="Sí, salir"
      cancel-label="Cancelar"
      variant="danger"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script lang="ts">
const toggles = [
  { key: 'showOnlineStatus',     label: 'Mostrar estado en línea',      desc: 'Otros usuarios pueden ver cuando estás conectado.' },
  { key: 'allowDmFromStrangers', label: 'Recibir mensajes de extraños',  desc: 'Permitir DMs de usuarios que no son tus amigos.' },
  { key: 'soundEnabled',         label: 'Sonidos de notificación',       desc: 'Reproducir sonido al recibir mensajes nuevos.' },
  { key: 'pushNotifications',    label: 'Notificaciones push',           desc: 'Recibir notificaciones aunque la app esté cerrada.' },
]
</script>

<style scoped>
.settings-page { padding: 1.75rem; max-width: 680px; margin: 0 auto; }
.settings-page__header { margin-bottom: 2rem; }
.settings-page__title { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.settings-page__section { margin-bottom: 1.75rem; }
.settings-page__section-title { font-size: 0.875rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.75rem; }
.settings-page__footer { padding-top: 0.5rem; }

.settings-card {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  padding: 1.25rem;
}

.settings-card__label { font-size: 0.875rem; font-weight: 500; color: var(--cs-text-secondary); margin-bottom: 0.625rem; }

.settings-card__themes { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--cs-border);
  background: var(--cs-surface-2);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cs-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.theme-option.is-active { border-color: var(--cs-primary); color: var(--cs-primary); background: var(--cs-primary-subtle); }
.theme-option__icon { font-size: 1rem; }

.settings-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--cs-border);
}
.settings-toggle:last-child { border-bottom: none; padding-bottom: 0; }
.settings-toggle:first-child { padding-top: 0; }
.settings-toggle__label { font-size: 0.9375rem; font-weight: 500; color: var(--cs-text); }
.settings-toggle__desc  { font-size: 0.8125rem; color: var(--cs-text-muted); margin-top: 0.125rem; }

.toggle-btn {
  flex-shrink: 0;
  width: 44px; height: 24px;
  border-radius: 12px;
  background: var(--cs-surface-2);
  border: 1.5px solid var(--cs-border);
  cursor: pointer;
  position: relative;
  transition: background 0.2s, border-color 0.2s;
}
.toggle-btn.is-on { background: var(--cs-primary); border-color: var(--cs-primary); }

.toggle-btn__thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.toggle-btn.is-on .toggle-btn__thumb { transform: translateX(20px); }

.settings-account-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.settings-account-row__value { font-size: 0.9375rem; color: var(--cs-text); margin-top: 0.25rem; }
.settings-account-row__hint { font-size: 0.8125rem; color: var(--cs-text-muted); margin-top: 0.25rem; }
</style>
