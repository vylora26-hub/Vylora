<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { Theme } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const showLogoutModal   = ref(false)
const showDeleteModal   = ref(false)
const deleteConfirmText = ref('')
const savingSettings    = ref(false)
const exporting         = ref(false)
const deleting          = ref(false)

const settings = reactive({
  theme:                uiStore.theme as Theme,
  soundEnabled:         true,
  showOnlineStatus:     true,
  allowDmFromStrangers: true,
  pushNotifications:    false,
  dataCollectionConsent: false,
  marketingConsent:     false,
})

onMounted(async () => {
  if (isMockMode || !supabase || !authStore.userId) return
  const { data } = await supabase
    .from(SUPABASE_CONFIG.TABLES.USER_SETTINGS)
    .select('*')
    .eq('user_id', authStore.userId)
    .single()
  if (data) {
    settings.theme                = data.theme as Theme
    settings.soundEnabled         = data.sound_enabled
    settings.showOnlineStatus     = data.show_online_status
    settings.allowDmFromStrangers = data.allow_dm_from_strangers
    settings.pushNotifications    = data.push_notifications
    settings.dataCollectionConsent = data.data_collection_consent ?? false
    settings.marketingConsent     = data.marketing_consent ?? false
    uiStore.setTheme(data.theme as Theme)
  }
})

async function saveSettings() {
  savingSettings.value = true
  uiStore.setTheme(settings.theme)
  try {
    if (!isMockMode && supabase && authStore.userId) {
      await supabase.from(SUPABASE_CONFIG.TABLES.USER_SETTINGS).update({
        theme:                  settings.theme,
        sound_enabled:          settings.soundEnabled,
        show_online_status:     settings.showOnlineStatus,
        allow_dm_from_strangers: settings.allowDmFromStrangers,
        push_notifications:     settings.pushNotifications,
        data_collection_consent: settings.dataCollectionConsent,
        marketing_consent:      settings.marketingConsent,
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

// ---- Exportar mis datos (GDPR Art. 20 portabilidad) ----
async function exportData() {
  exporting.value = true
  try {
    if (isMockMode) {
      const data = { exported_at: new Date().toISOString(), username: authStore.user?.username, note: 'Modo desarrollo — datos de ejemplo' }
      downloadJson(data, 'vylora-mis-datos.json')
      uiStore.toast.success('Datos exportados')
      return
    }
    const { data, error } = await supabase!.rpc('get_my_data_export')
    if (error) throw error
    downloadJson(data, 'vylora-mis-datos.json')
    uiStore.toast.success('Tus datos han sido descargados')
  } catch { uiStore.toast.error('Error al exportar datos') }
  finally { exporting.value = false }
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---- Eliminar cuenta (derecho al olvido GDPR Art. 17) ----
const deleteConfirmValid = computed(() =>
  deleteConfirmText.value.trim().toLowerCase() === (authStore.user?.username ?? '').toLowerCase()
)

async function confirmDelete() {
  if (!deleteConfirmValid.value) return
  deleting.value = true
  try {
    if (isMockMode) {
      await authStore.logout()
      router.push('/')
      uiStore.toast.info('Cuenta eliminada (modo demo)')
      return
    }
    const { data, error } = await supabase!.rpc('delete_own_account', {
      p_confirmation_username: deleteConfirmText.value.trim(),
    })
    if (error) throw error
    if (data?.success) {
      await authStore.logout()
      router.push('/')
      uiStore.toast.success('Tu cuenta ha sido eliminada')
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.'
    uiStore.toast.error('Error', msg)
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

const themes: { value: Theme; label: string }[] = [
  { value: 'dark',   label: 'Oscuro'  },
  { value: 'light',  label: 'Claro'   },
  { value: 'system', label: 'Sistema' },
]

const privacyToggles = [
  { key: 'showOnlineStatus',     label: 'Mostrar estado en línea',     desc: 'Otros usuarios ven cuando estás conectado. Si desactivas esto tu estado siempre aparecerá como desconectado.' },
  { key: 'allowDmFromStrangers', label: 'Recibir mensajes de extraños', desc: 'Permite que usuarios que no son tus amigos te envíen mensajes directos.' },
  { key: 'soundEnabled',         label: 'Sonidos de notificación',      desc: 'Reproduce sonido al recibir mensajes nuevos.' },
  { key: 'pushNotifications',    label: 'Notificaciones push',          desc: 'Recibe notificaciones aunque la app esté cerrada.' },
]

const dataToggles = [
  { key: 'dataCollectionConsent', label: 'Análisis anónimo de uso',    desc: 'Ayúdanos a mejorar la plataforma con datos anónimos de cómo usas la app. Nunca incluye el contenido de tus mensajes.' },
  { key: 'marketingConsent',      label: 'Comunicaciones del equipo',   desc: 'Recibir noticias sobre nuevas funciones y actualizaciones de Vylora. Puedes darte de baja en cualquier momento.' },
]
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <h1 class="settings-page__title">Configuración</h1>
    </div>

    <!-- ===== APARIENCIA ===== -->
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
            <!-- Ícono SVG por tema -->
            <span class="theme-option__icon" aria-hidden="true">
              <svg v-if="t.value === 'dark'" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
              <svg v-else-if="t.value === 'light'" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <svg v-else width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </span>
            <span>{{ t.label }}</span>
          </label>
        </div>
      </div>
    </section>

    <!-- ===== PRIVACIDAD ===== -->
    <section class="settings-page__section" aria-labelledby="s-privacy">
      <h2 id="s-privacy" class="settings-page__section-title">Privacidad y notificaciones</h2>
      <div class="settings-card">
        <div v-for="toggle in privacyToggles" :key="toggle.key" class="settings-toggle">
          <div class="settings-toggle__info">
            <p class="settings-toggle__label">{{ toggle.label }}</p>
            <p class="settings-toggle__desc">{{ toggle.desc }}</p>
          </div>
          <button
            role="switch"
            :aria-checked="settings[toggle.key as keyof typeof settings] as boolean"
            :aria-label="toggle.label"
            class="toggle-btn"
            :class="{ 'is-on': settings[toggle.key as keyof typeof settings] }"
            @click="(settings[toggle.key as keyof typeof settings] as boolean) = !(settings[toggle.key as keyof typeof settings] as boolean)"
          >
            <span class="toggle-btn__thumb" />
          </button>
        </div>
      </div>
    </section>

    <!-- ===== CONSENTIMIENTOS DE DATOS ===== -->
    <section class="settings-page__section" aria-labelledby="s-data">
      <h2 id="s-data" class="settings-page__section-title">Consentimientos de datos</h2>
      <p class="settings-page__section-desc">
        Estos consentimientos son voluntarios y puedes cambiarlos en cualquier momento.
        Consulta nuestra <RouterLink to="/privacy" class="settings-link">Política de Privacidad</RouterLink> para más detalles.
      </p>
      <div class="settings-card">
        <div v-for="toggle in dataToggles" :key="toggle.key" class="settings-toggle">
          <div class="settings-toggle__info">
            <p class="settings-toggle__label">{{ toggle.label }}</p>
            <p class="settings-toggle__desc">{{ toggle.desc }}</p>
          </div>
          <button
            role="switch"
            :aria-checked="settings[toggle.key as keyof typeof settings] as boolean"
            :aria-label="toggle.label"
            class="toggle-btn"
            :class="{ 'is-on': settings[toggle.key as keyof typeof settings] }"
            @click="(settings[toggle.key as keyof typeof settings] as boolean) = !(settings[toggle.key as keyof typeof settings] as boolean)"
          >
            <span class="toggle-btn__thumb" />
          </button>
        </div>
      </div>
    </section>

    <!-- ===== TUS DATOS (GDPR) ===== -->
    <section class="settings-page__section" aria-labelledby="s-your-data">
      <h2 id="s-your-data" class="settings-page__section-title">Tus datos</h2>
      <p class="settings-page__section-desc">
        Tienes derecho a acceder, exportar y eliminar tus datos según el GDPR y la Ley 1581/2012.
      </p>
      <div class="settings-card">
        <!-- Exportar datos -->
        <div class="settings-data-row">
          <div>
            <p class="settings-data-row__label">Exportar mis datos</p>
            <p class="settings-data-row__desc">Descarga una copia de todos tus datos personales en formato JSON (GDPR Art. 20 — portabilidad).</p>
          </div>
          <AppButton variant="secondary" size="sm" :loading="exporting" @click="exportData">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar
          </AppButton>
        </div>

        <hr class="divider" style="margin: 0.875rem 0" />

        <!-- Ver documentos legales -->
        <div class="settings-data-row">
          <div>
            <p class="settings-data-row__label">Documentos legales</p>
            <p class="settings-data-row__desc">Revisa los documentos que aceptaste al registrarte.</p>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <RouterLink to="/terms">
              <AppButton variant="ghost" size="sm">Términos</AppButton>
            </RouterLink>
            <RouterLink to="/privacy">
              <AppButton variant="ghost" size="sm">Privacidad</AppButton>
            </RouterLink>
          </div>
        </div>

        <hr class="divider" style="margin: 0.875rem 0" />

        <!-- Seguridad -->
        <div class="settings-data-row">
          <div>
            <p class="settings-data-row__label">Seguridad de la cuenta</p>
            <p class="settings-data-row__desc">Gestiona tus sesiones activas y configuración de seguridad.</p>
          </div>
          <RouterLink to="/app/security">
            <AppButton variant="secondary" size="sm">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Ver seguridad
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ===== CUENTA ===== -->
    <section class="settings-page__section" aria-labelledby="s-account">
      <h2 id="s-account" class="settings-page__section-title">Cuenta</h2>
      <div class="settings-card">
        <!-- Cerrar sesión -->
        <div class="settings-data-row">
          <div>
            <p class="settings-data-row__label">Cerrar sesión</p>
            <p class="settings-data-row__desc">Saldrás de tu cuenta en este dispositivo.</p>
          </div>
          <AppButton variant="secondary" size="sm" @click="showLogoutModal = true">Salir</AppButton>
        </div>

        <hr class="divider" style="margin: 0.875rem 0" />

        <!-- Eliminar cuenta -->
        <div class="settings-data-row settings-data-row--danger">
          <div>
            <p class="settings-data-row__label settings-data-row__label--danger">Eliminar mi cuenta</p>
            <p class="settings-data-row__desc">
              Elimina permanentemente tu cuenta y todos tus datos personales.
              Esta acción no se puede deshacer (GDPR Art. 17 — derecho al olvido).
            </p>
          </div>
          <AppButton variant="danger" size="sm" @click="showDeleteModal = true">Eliminar cuenta</AppButton>
        </div>
      </div>
    </section>

    <!-- Botón guardar -->
    <div class="settings-page__footer">
      <AppButton variant="primary" size="md" :loading="savingSettings" @click="saveSettings">
        Guardar cambios
      </AppButton>
    </div>

    <!-- Modal: Cerrar sesión -->
    <AppModal
      v-model="showLogoutModal"
      title="Cerrar sesión"
      description="¿Seguro que quieres salir de tu cuenta?"
      confirm-label="Sí, salir"
      cancel-label="Cancelar"
      variant="danger"
      @confirm="confirmLogout"
    />

    <!-- Modal: Eliminar cuenta -->
    <AppModal
      v-model="showDeleteModal"
      title="Eliminar cuenta permanentemente"
      variant="danger"
      confirm-label="Eliminar mi cuenta"
      :loading="deleting"
      :disabled="!deleteConfirmValid"
      @confirm="confirmDelete"
    >
      <div class="delete-modal-body">
        <div class="delete-modal-warning" role="alert">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <div>
            <p class="delete-modal-warning__title">Esta acción es irreversible</p>
            <p class="delete-modal-warning__desc">Se eliminarán todos tus datos personales: perfil, mensajes, amigos, sesiones y configuración. El contenido de tus mensajes será anonimizado permanentemente.</p>
          </div>
        </div>

        <p class="delete-modal-confirm-label">
          Escribe tu nombre de usuario <strong>@{{ authStore.user?.username }}</strong> para confirmar:
        </p>
        <AppInput
          v-model="deleteConfirmText"
          :placeholder="authStore.user?.username ?? 'tu_usuario'"
          :error="deleteConfirmText && !deleteConfirmValid ? 'El nombre de usuario no coincide.' : ''"
          autocomplete="off"
        />
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.settings-page { padding: 1.75rem; max-width: 680px; margin: 0 auto; }
.settings-page__header { margin-bottom: 2rem; }
.settings-page__title  { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.settings-page__section { margin-bottom: 1.75rem; }
.settings-page__section-title { font-size: 0.875rem; font-weight: 600; color: var(--cs-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.625rem; }
.settings-page__section-desc  { font-size: 0.8125rem; color: var(--cs-text-muted); line-height: 1.5; margin-bottom: 0.75rem; }
.settings-page__footer { padding-top: 0.5rem; }
.settings-link { color: var(--cs-primary); text-decoration: none; }
.settings-link:hover { opacity: 0.8; }

.settings-card {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  padding: 1.25rem;
}

.settings-card__label { font-size: 0.875rem; font-weight: 500; color: var(--cs-text-secondary); margin-bottom: 0.625rem; }
.settings-card__themes { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.theme-option {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border-radius: 0.5rem;
  border: 1.5px solid var(--cs-border); background: var(--cs-surface-2);
  font-size: 0.875rem; font-weight: 500; color: var(--cs-text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.theme-option.is-active { border-color: var(--cs-primary); color: var(--cs-primary); background: var(--cs-primary-subtle); }
.theme-option__icon { font-size: 1rem; }

.settings-toggle {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.875rem 0; border-bottom: 1px solid var(--cs-border);
}
.settings-toggle:last-child { border-bottom: none; padding-bottom: 0; }
.settings-toggle:first-child { padding-top: 0; }
.settings-toggle__label { font-size: 0.9375rem; font-weight: 500; color: var(--cs-text); }
.settings-toggle__desc  { font-size: 0.8125rem; color: var(--cs-text-muted); margin-top: 0.125rem; }

.toggle-btn {
  flex-shrink: 0; width: 44px; height: 24px; border-radius: 12px;
  background: var(--cs-surface-2); border: 1.5px solid var(--cs-border);
  cursor: pointer; position: relative; transition: background 0.2s, border-color 0.2s;
}
.toggle-btn.is-on { background: var(--cs-primary); border-color: var(--cs-primary); }
.toggle-btn__thumb {
  position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
  border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.toggle-btn.is-on .toggle-btn__thumb { transform: translateX(20px); }

.settings-data-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; padding: 0.5rem 0; flex-wrap: wrap;
}
.settings-data-row--danger {}
.settings-data-row__label { font-size: 0.9375rem; font-weight: 500; color: var(--cs-text); margin-bottom: 0.2rem; }
.settings-data-row__label--danger { color: #ef4444; }
.settings-data-row__desc  { font-size: 0.8125rem; color: var(--cs-text-muted); line-height: 1.5; max-width: 380px; }

/* ---- Modal de eliminación ---- */
.delete-modal-body { display: flex; flex-direction: column; gap: 1rem; }

.delete-modal-warning {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.875rem; border-radius: 0.625rem;
  background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2);
}
.delete-modal-warning__title { font-size: 0.875rem; font-weight: 700; color: #ef4444; margin-bottom: 0.25rem; }
.delete-modal-warning__desc  { font-size: 0.8125rem; color: var(--cs-text-secondary); line-height: 1.5; }

.delete-modal-confirm-label { font-size: 0.875rem; color: var(--cs-text-secondary); }
.delete-modal-confirm-label strong { color: var(--cs-text); }
</style>
