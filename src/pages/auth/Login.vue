<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { validateEmail, validatePassword } from '@/utils/validation'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const router = useRouter()
const route  = useRoute()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })

function validate(): boolean {
  errors.email    = validateEmail(form.email).error    ?? ''
  errors.password = validatePassword(form.password).error ?? ''
  return !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  const ok = await authStore.login(form.email, form.password)
  if (ok) {
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? '/app/home')
  } else {
    uiStore.toast.error('Error al iniciar sesión', authStore.error ?? undefined)
  }
}
</script>

<template>
  <div class="login">
    <div class="login__header">
      <h1 class="login__title">Bienvenido de nuevo</h1>
      <p class="login__subtitle">Ingresa tus credenciales para continuar.</p>
    </div>

    <form class="login__form" novalidate @submit.prevent="submit">
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="tu@email.com"
        autocomplete="email"
        :error="errors.email"
        :required="true"
        @blur="errors.email = validateEmail(form.email).error ?? ''"
      />

      <AppInput
        v-model="form.password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
        :error="errors.password"
        :required="true"
      />

      <div class="login__forgot">
        <RouterLink to="/auth/recover" class="login__link">¿Olvidaste tu contraseña?</RouterLink>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        size="md"
        :full-width="true"
        :loading="authStore.loading"
      >
        Iniciar sesión
      </AppButton>
    </form>

    <p class="login__register">
      ¿No tienes cuenta?
      <RouterLink to="/auth/register" class="login__link">Regístrate gratis</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.login__header { margin-bottom: 1.5rem; }
.login__title  { font-size: 1.375rem; font-weight: 700; color: var(--cs-text); margin-bottom: 0.375rem; }
.login__subtitle { font-size: 0.9rem; color: var(--cs-text-muted); }
.login__form   { display: flex; flex-direction: column; gap: 1rem; }
.login__forgot { display: flex; justify-content: flex-end; margin-top: -0.25rem; }
.login__link   { font-size: 0.875rem; color: var(--cs-primary); transition: opacity 0.15s; }
.login__link:hover { opacity: 0.75; }
.login__register { margin-top: 1.25rem; text-align: center; font-size: 0.875rem; color: var(--cs-text-muted); }
</style>
