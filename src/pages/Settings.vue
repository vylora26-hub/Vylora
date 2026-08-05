<script setup lang="ts">
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { Theme } from '@/types'

const authStore = useAuthStore()
const uiStore   = useUiStore()

const profile = reactive({
  displayName: authStore.user?.displayName ?? '',
  bio:         authStore.user?.bio ?? '',
  city:        authStore.user?.city ?? '',
  country:     authStore.user?.country ?? '',
})

const themes: { value: Theme; label: string }[] = [
  { value: 'dark',   label: '🌙 Oscuro'   },
  { value: 'light',  label: '☀️ Claro'    },
  { value: 'system', label: '💻 Sistema'  },
]

async function logout() {
  await authStore.logout()
}
</script>

<template>
  <div class="settings-page">
    <h1 class="settings-page__title">Configuración</h1>

    <!-- Perfil -->
    <section class="settings-page__section" aria-labelledby="section-profile">
      <h2 id="section-profile" class="settings-page__section-title">Perfil</h2>
      <div class="settings-page__card">
        <div class="settings-page__form">
          <AppInput
            v-model="profile.displayName"
            label="Nombre visible"
            placeholder="Tu nombre"
            :maxlength="50"
          />
          <AppInput
            v-model="profile.bio"
            label="Biografía"
            placeholder="Cuéntanos algo sobre ti..."
            :maxlength="300"
          />
          <div class="settings-page__row">
            <AppInput v-model="profile.city"    label="Ciudad"  placeholder="Bogotá" />
            <AppInput v-model="profile.country" label="País"    placeholder="Colombia" />
          </div>
          <AppButton variant="primary" size="sm">Guardar cambios</AppButton>
        </div>
      </div>
    </section>

    <!-- Apariencia -->
    <section class="settings-page__section" aria-labelledby="section-appearance">
      <h2 id="section-appearance" class="settings-page__section-title">Apariencia</h2>
      <div class="settings-page__card">
        <p class="settings-page__label">Tema</p>
        <div class="settings-page__themes" role="radiogroup" aria-label="Seleccionar tema">
          <label
            v-for="t in themes"
            :key="t.value"
            class="settings-page__theme-option"
            :class="{ 'is-active': uiStore.theme === t.value }"
          >
            <input
              type="radio"
              name="theme"
              :value="t.value"
              :checked="uiStore.theme === t.value"
              class="sr-only"
              @change="uiStore.setTheme(t.value)"
            />
            {{ t.label }}
          </label>
        </div>
      </div>
    </section>

    <!-- Cuenta -->
    <section class="settings-page__section" aria-labelledby="section-account">
      <h2 id="section-account" class="settings-page__section-title">Cuenta</h2>
      <div class="settings-page__card">
        <div class="settings-page__account-row">
          <div>
            <p class="settings-page__label">Email</p>
            <p class="settings-page__value">{{ authStore.session?.email ?? '—' }}</p>
          </div>
        </div>
        <hr class="divider" />
        <div class="settings-page__account-row">
          <div>
            <p class="settings-page__label">Cerrar sesión</p>
            <p class="settings-page__hint">Se cerrará la sesión en este dispositivo.</p>
          </div>
          <AppButton variant="danger" size="sm" @click="logout">Cerrar sesión</AppButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page        { padding: 1.75rem; max-width: 680px; margin: 0 auto; }
.settings-page__title { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); margin-bottom: 2rem; }

.settings-page__section       { margin-bottom: 2rem; }
.settings-page__section-title { font-size: 1rem; font-weight: 600; color: var(--cs-text); margin-bottom: 0.875rem; }

.settings-page__card {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.875rem;
  padding: 1.25rem;
}

.settings-page__form  { display: flex; flex-direction: column; gap: 1rem; }

.settings-page__row   { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }

.settings-page__label { font-size: 0.875rem; font-weight: 500; color: var(--cs-text-secondary); margin-bottom: 0.5rem; }
.settings-page__hint  { font-size: 0.8125rem; color: var(--cs-text-muted); margin-top: 0.25rem; }
.settings-page__value { font-size: 0.9375rem; color: var(--cs-text); }

.settings-page__themes {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.settings-page__theme-option {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--cs-border);
  background: var(--cs-surface-2);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cs-text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.settings-page__theme-option.is-active {
  border-color: var(--cs-primary);
  color: var(--cs-primary);
  background: var(--cs-primary-subtle);
}

.settings-page__account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}

.settings-page__account-row + .divider { margin: 0.875rem 0; }
</style>
