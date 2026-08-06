<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase, isMockMode } from '@/services/supabase'
import {
  validatePassword,
  validateUsername,
  validateDisplayName,
} from '@/utils/validation'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const router    = useRouter()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const TERMS_VERSION   = '1.0'
const PRIVACY_VERSION = '1.0'

const form = reactive({
  displayName: '',
  username:    '',
  password:    '',
  confirm:     '',
})

const errors = reactive({
  displayName: '',
  username:    '',
  password:    '',
  confirm:     '',
})

// Consentimientos — obligatorios por ley (GDPR Art.7, Ley 1581 Art.9)
const acceptTerms    = ref(false)
const acceptAge      = ref(false)
const acceptPrivacy  = ref(false)
const consentErrors  = reactive({ terms: '', age: '', privacy: '' })

function validate(): boolean {
  errors.displayName = validateDisplayName(form.displayName).error ?? ''
  errors.username    = validateUsername(form.username).error        ?? ''
  errors.password    = validatePassword(form.password).error        ?? ''
  errors.confirm     = form.confirm !== form.password ? 'Las contraseñas no coinciden.' : ''

  // Validar consentimientos — OBLIGATORIOS
  consentErrors.terms   = !acceptTerms.value   ? 'Debes aceptar los Términos y Condiciones.' : ''
  consentErrors.age     = !acceptAge.value     ? 'Debes confirmar que tienes 18 años o más.' : ''
  consentErrors.privacy = !acceptPrivacy.value ? 'Debes aceptar la Política de Privacidad.' : ''

  return (
    Object.values(errors).every(e => !e) &&
    Object.values(consentErrors).every(e => !e)
  )
}

async function submit() {
  if (!validate()) return

  const ok = await authStore.register('', form.password, form.username, form.displayName)

  if (ok && authStore.userId) {
    // Registrar consentimiento en BD — GDPR Art.7 (evidencia de consentimiento)
    try {
      if (!isMockMode && supabase) {
        await supabase.rpc('record_consent', {
          p_terms_version:   TERMS_VERSION,
          p_privacy_version: PRIVACY_VERSION,
          p_user_agent:      navigator.userAgent.slice(0, 255),
        })
      }
    } catch (e) {
      // No bloquear el registro si falla — pero sí loguear
      console.warn('[consent] No se pudo registrar el consentimiento:', e)
    }

    uiStore.toast.success('¡Cuenta creada!', 'Bienvenido a Vylora.')
    router.push('/app/home')
  } else {
    uiStore.toast.error('Error al registrarse', authStore.error ?? undefined)
  }
}
</script>

<template>
  <div class="register">
    <div class="register__header">
      <h1 class="register__title">Crear cuenta</h1>
      <p class="register__subtitle">Solo necesitas un usuario y contraseña.</p>
    </div>

    <!-- Aviso de mayoría de edad -->
    <div class="register__age-notice" role="note">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span>Al registrarte confirmas que tienes <strong>18 años o más</strong>. Esta plataforma contiene contenido para adultos.</span>
    </div>

    <form class="register__form" novalidate @submit.prevent="submit">
      <!-- Campos del perfil -->
      <AppInput
        v-model="form.displayName"
        label="Nombre visible"
        placeholder="Como te verán los demás"
        autocomplete="name"
        :error="errors.displayName"
        :required="true"
      />
      <AppInput
        v-model="form.username"
        label="Nombre de usuario"
        placeholder="sin_espacios_123"
        autocomplete="username"
        :error="errors.username"
        :required="true"
        hint="Solo letras, números y guion bajo (_). Único e irrepetible."
      />
      <AppInput
        v-model="form.password"
        label="Contraseña"
        type="password"
        placeholder="Mínimo 8 caracteres"
        autocomplete="new-password"
        :error="errors.password"
        :required="true"
      />
      <AppInput
        v-model="form.confirm"
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        autocomplete="new-password"
        :error="errors.confirm"
        :required="true"
      />

      <!-- ===== CONSENTIMIENTOS LEGALES ===== -->
      <div class="register__consents" role="group" aria-label="Consentimientos obligatorios">
        <p class="register__consents-title">Consentimientos requeridos</p>

        <!-- 1. Mayoría de edad -->
        <label class="consent-item" :class="{ 'has-error': consentErrors.age }">
          <input
            v-model="acceptAge"
            type="checkbox"
            class="consent-item__checkbox"
            :aria-describedby="consentErrors.age ? 'err-age' : undefined"
            required
          />
          <span class="consent-item__text">
            Confirmo que tengo <strong>18 años o más</strong> y que soy mayor de edad en mi país.
          </span>
        </label>
        <p v-if="consentErrors.age" id="err-age" class="consent-item__error" role="alert">
          {{ consentErrors.age }}
        </p>

        <!-- 2. Términos y Condiciones -->
        <label class="consent-item" :class="{ 'has-error': consentErrors.terms }">
          <input
            v-model="acceptTerms"
            type="checkbox"
            class="consent-item__checkbox"
            :aria-describedby="consentErrors.terms ? 'err-terms' : undefined"
            required
          />
          <span class="consent-item__text">
            He leído y acepto los
            <RouterLink to="/terms" target="_blank" class="consent-link">Términos y Condiciones</RouterLink>
            de Vylora, incluyendo las normas de conducta.
          </span>
        </label>
        <p v-if="consentErrors.terms" id="err-terms" class="consent-item__error" role="alert">
          {{ consentErrors.terms }}
        </p>

        <!-- 3. Política de Privacidad -->
        <label class="consent-item" :class="{ 'has-error': consentErrors.privacy }">
          <input
            v-model="acceptPrivacy"
            type="checkbox"
            class="consent-item__checkbox"
            :aria-describedby="consentErrors.privacy ? 'err-privacy' : undefined"
            required
          />
          <span class="consent-item__text">
            He leído y acepto la
            <RouterLink to="/privacy" target="_blank" class="consent-link">Política de Privacidad</RouterLink>
            y el tratamiento de mis datos según lo descrito en ella.
          </span>
        </label>
        <p v-if="consentErrors.privacy" id="err-privacy" class="consent-item__error" role="alert">
          {{ consentErrors.privacy }}
        </p>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        size="md"
        :full-width="true"
        :loading="authStore.loading"
        :disabled="!acceptTerms || !acceptAge || !acceptPrivacy"
      >
        Crear cuenta
      </AppButton>
    </form>

    <p class="register__login">
      ¿Ya tienes cuenta?
      <RouterLink to="/auth/login" class="register__link">Iniciar sesión</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.register__header   { margin-bottom: 1.25rem; }
.register__title    { font-size: 1.375rem; font-weight: 700; color: var(--cs-text); margin-bottom: 0.375rem; }
.register__subtitle { font-size: 0.9rem; color: var(--cs-text-muted); }

.register__age-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.25);
  color: #f59e0b;
  font-size: 0.8125rem;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}
.register__age-notice svg { flex-shrink: 0; margin-top: 1px; }
.register__age-notice strong { color: #fbbf24; }

.register__form  { display: flex; flex-direction: column; gap: 1rem; }

/* ---- Consentimientos ---- */
.register__consents {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1rem;
  background: var(--cs-surface-2);
  border: 1.5px solid var(--cs-border);
  border-radius: 0.625rem;
}

.register__consents-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--cs-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.25rem;
}

.consent-item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
  padding: 0.5rem 0.625rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  transition: background 0.12s, border-color 0.12s;
}
.consent-item:hover { background: var(--cs-surface-hover); }
.consent-item.has-error { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }

.consent-item__checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--cs-primary);
  cursor: pointer;
}

.consent-item__text {
  font-size: 0.8125rem;
  color: var(--cs-text-secondary);
  line-height: 1.5;
}
.consent-item__text strong { color: var(--cs-text); }

.consent-link {
  color: var(--cs-primary);
  text-decoration: underline;
  font-weight: 500;
  transition: opacity 0.15s;
}
.consent-link:hover { opacity: 0.75; }

.consent-item__error {
  font-size: 0.75rem;
  color: #ef4444;
  margin: -0.25rem 0 0 2.25rem;
}

.register__login { margin-top: 1.25rem; text-align: center; font-size: 0.875rem; color: var(--cs-text-muted); }
.register__link  { color: var(--cs-primary); transition: opacity 0.15s; }
.register__link:hover { opacity: 0.75; }
</style>
