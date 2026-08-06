<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
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

function validate(): boolean {
  errors.displayName = validateDisplayName(form.displayName).error ?? ''
  errors.username    = validateUsername(form.username).error        ?? ''
  errors.password    = validatePassword(form.password).error        ?? ''
  errors.confirm     = form.confirm !== form.password ? 'Las contraseñas no coinciden.' : ''
  return Object.values(errors).every(e => !e)
}

async function submit() {
  if (!validate()) return
  const ok = await authStore.register(form.username, form.password, form.username, form.displayName)
  if (ok) {
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
      <span>Al registrarte confirmas que tienes <strong>18 años o más</strong>. Esta plataforma contiene salas para adultos.</span>
    </div>

    <form class="register__form" novalidate @submit.prevent="submit">
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
        hint="Solo letras, números y guion bajo. Único e irrepetible."
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

      <AppButton
        type="submit"
        variant="primary"
        size="md"
        :full-width="true"
        :loading="authStore.loading"
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
.register__login { margin-top: 1.25rem; text-align: center; font-size: 0.875rem; color: var(--cs-text-muted); }
.register__link  { color: var(--cs-primary); transition: opacity 0.15s; }
.register__link:hover { opacity: 0.75; }
</style>
