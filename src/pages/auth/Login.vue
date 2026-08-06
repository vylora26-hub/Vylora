<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { validateUsername, validatePassword } from '@/utils/validation'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const form   = reactive({ username: '', password: '' })
const errors = reactive({ username: '', password: '' })

function validate(): boolean {
  errors.username = validateUsername(form.username).error ?? ''
  errors.password = validatePassword(form.password).error ?? ''
  return !errors.username && !errors.password
}

async function submit() {
  if (!validate()) return
  const ok = await authStore.loginWithUsername(form.username, form.password)
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
      <p class="login__subtitle">Ingresa tu usuario y contraseña para continuar.</p>
    </div>

    <form class="login__form" novalidate @submit.prevent="submit">
      <AppInput
        v-model="form.username"
        label="Nombre de usuario"
        type="text"
        placeholder="tu_usuario"
        autocomplete="username"
        :error="errors.username"
        :required="true"
        @blur="errors.username = validateUsername(form.username).error ?? ''"
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
      <RouterLink to="/auth/register" class="login__link">Regístrate</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.login__header   { margin-bottom: 1.5rem; }
.login__title    { font-size: 1.375rem; font-weight: 700; color: var(--cs-text); margin-bottom: 0.375rem; }
.login__subtitle { font-size: 0.9rem; color: var(--cs-text-muted); }
.login__form     { display: flex; flex-direction: column; gap: 1rem; }
.login__link     { font-size: 0.875rem; color: var(--cs-primary); transition: opacity 0.15s; }
.login__link:hover { opacity: 0.75; }
.login__register { margin-top: 1.25rem; text-align: center; font-size: 0.875rem; color: var(--cs-text-muted); }
</style>
