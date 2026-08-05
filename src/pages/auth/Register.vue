<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import {
  validateEmail, validatePassword,
  validateUsername, validateDisplayName,
} from '@/utils/validation'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const router    = useRouter()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const form = reactive({ email: '', password: '', username: '', displayName: '' })
const errors = reactive({ email: '', password: '', username: '', displayName: '' })

function validate(): boolean {
  errors.email       = validateEmail(form.email).error       ?? ''
  errors.password    = validatePassword(form.password).error    ?? ''
  errors.username    = validateUsername(form.username).error    ?? ''
  errors.displayName = validateDisplayName(form.displayName).error ?? ''
  return Object.values(errors).every(e => !e)
}

async function submit() {
  if (!validate()) return
  const ok = await authStore.register(form.email, form.password, form.username, form.displayName)
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
      <p class="register__subtitle">Únete a Vylora en segundos.</p>
    </div>

    <form class="register__form" novalidate @submit.prevent="submit">
      <AppInput
        v-model="form.displayName"
        label="Nombre visible"
        placeholder="Tu nombre"
        autocomplete="name"
        :error="errors.displayName"
        :required="true"
      />

      <AppInput
        v-model="form.username"
        label="Nombre de usuario"
        placeholder="usuario_123"
        autocomplete="username"
        :error="errors.username"
        :required="true"
        hint="Solo letras, números y guion bajo (_)."
      />

      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="tu@email.com"
        autocomplete="email"
        :error="errors.email"
        :required="true"
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
.register__header  { margin-bottom: 1.5rem; }
.register__title   { font-size: 1.375rem; font-weight: 700; color: var(--cs-text); margin-bottom: 0.375rem; }
.register__subtitle{ font-size: 0.9rem; color: var(--cs-text-muted); }
.register__form    { display: flex; flex-direction: column; gap: 1rem; }
.register__login   { margin-top: 1.25rem; text-align: center; font-size: 0.875rem; color: var(--cs-text-muted); }
.register__link    { color: var(--cs-primary); transition: opacity 0.15s; }
.register__link:hover { opacity: 0.75; }
</style>
