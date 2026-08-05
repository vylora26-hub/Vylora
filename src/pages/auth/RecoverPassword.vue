<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { validateEmail } from '@/utils/validation'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const authStore = useAuthStore()
const uiStore   = useUiStore()

const email = ref('')
const emailError = ref('')
const sent = ref(false)

async function submit() {
  const v = validateEmail(email.value)
  emailError.value = v.error ?? ''
  if (!v.valid) return

  const ok = await authStore.recoverPassword(email.value)
  if (ok) {
    sent.value = true
  } else {
    uiStore.toast.error('Error', 'No se pudo enviar el correo.')
  }
}
</script>

<template>
  <div class="recover">
    <!-- Estado: email enviado -->
    <div v-if="sent" class="recover__sent">
      <div class="recover__sent-icon" aria-hidden="true">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 class="recover__title">Revisa tu email</h1>
      <p class="recover__subtitle">
        Enviamos un enlace de recuperación a <strong>{{ email }}</strong>.
        Puede tardar unos minutos.
      </p>
      <RouterLink to="/auth/login" class="recover__link">Volver al inicio de sesión</RouterLink>
    </div>

    <!-- Formulario -->
    <template v-else>
      <div class="recover__header">
        <h1 class="recover__title">Recuperar contraseña</h1>
        <p class="recover__subtitle">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <form class="recover__form" novalidate @submit.prevent="submit">
        <AppInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="tu@email.com"
          autocomplete="email"
          :error="emailError"
          :required="true"
        />

        <AppButton
          type="submit"
          variant="primary"
          size="md"
          :full-width="true"
          :loading="authStore.loading"
        >
          Enviar enlace
        </AppButton>
      </form>

      <p class="recover__back">
        <RouterLink to="/auth/login" class="recover__link">← Volver al inicio de sesión</RouterLink>
      </p>
    </template>
  </div>
</template>

<style scoped>
.recover__header   { margin-bottom: 1.5rem; }
.recover__title    { font-size: 1.375rem; font-weight: 700; color: var(--cs-text); margin-bottom: 0.375rem; }
.recover__subtitle { font-size: 0.9rem; color: var(--cs-text-muted); line-height: 1.5; }
.recover__form     { display: flex; flex-direction: column; gap: 1rem; }
.recover__back     { margin-top: 1.25rem; text-align: center; }
.recover__link     { font-size: 0.875rem; color: var(--cs-primary); transition: opacity 0.15s; }
.recover__link:hover { opacity: 0.75; }
.recover__sent     { display: flex; flex-direction: column; align-items: center; gap: 0.875rem; text-align: center; }
.recover__sent-icon{
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--cs-primary-subtle); color: var(--cs-primary);
  display: flex; align-items: center; justify-content: center;
}
</style>
