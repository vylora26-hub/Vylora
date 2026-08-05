<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/ui/AppButton.vue'

const authStore = useAuthStore()

const features = [
  {
    title: 'Tiempo real',
    desc: 'Mensajes instantáneos con Supabase Realtime.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'Salas públicas y privadas',
    desc: 'Crea tu espacio con controles de acceso.',
    icon: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
  },
  {
    title: 'Seguro por diseño',
    desc: 'RLS, sanitización y rate limiting en cada capa.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: 'PWA instalable',
    desc: 'Funciona como app nativa en cualquier dispositivo.',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
]
</script>

<template>
  <div class="welcome">
    <!-- Fondo decorativo -->
    <div class="welcome__bg" aria-hidden="true">
      <div class="welcome__blob welcome__blob--1" />
      <div class="welcome__blob welcome__blob--2" />
      <div class="welcome__blob welcome__blob--3" />
    </div>

    <main class="welcome__main">
      <!-- Hero -->
      <div class="welcome__hero">
        <!-- Logo -->
        <div class="welcome__logo-wrap">
          <img
            src="/LOGO-Vylora.png"
            alt="Vylora"
            class="welcome__logo-img"
            draggable="false"
          />
        </div>

        <h1 class="welcome__title">
          Conecta, chatea,<br />
          <span class="welcome__title-accent">crea comunidad.</span>
        </h1>

        <p class="welcome__subtitle">
          Vylora es la plataforma de chat moderna donde puedes crear salas,
          hacer amigos y conversar en tiempo real — rápido, seguro y sin complicaciones.
        </p>

        <!-- CTA -->
        <div class="welcome__actions">
          <RouterLink to="/auth/register">
            <AppButton variant="primary" size="lg">Crear cuenta gratis</AppButton>
          </RouterLink>
          <RouterLink to="/auth/login">
            <AppButton variant="secondary" size="lg">Iniciar sesión</AppButton>
          </RouterLink>
        </div>

        <!-- Invitado -->
        <button
          class="welcome__guest"
          @click="authStore.continueAsGuest(); $router.push('/app/home')"
        >
          Continuar como invitado
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Features -->
      <div class="welcome__features" aria-label="Características principales">
        <div v-for="feat in features" :key="feat.title" class="welcome__feature">
          <div class="welcome__feature-icon" aria-hidden="true">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="feat.icon" />
            </svg>
          </div>
          <div>
            <p class="welcome__feature-title">{{ feat.title }}</p>
            <p class="welcome__feature-desc">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.welcome {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--cs-bg);
  padding: 2rem 1.5rem;
}

.welcome__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.welcome__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.08;
}

.welcome__blob--1 {
  width: 600px; height: 600px;
  background: var(--cs-primary);
  top: -200px; left: -200px;
}

.welcome__blob--2 {
  width: 500px; height: 500px;
  background: var(--cs-accent);
  bottom: -150px; right: -150px;
}

.welcome__blob--3 {
  width: 300px; height: 300px;
  background: #ec4899;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

.welcome__main {
  position: relative;
  z-index: 1;
  max-width: 680px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  text-align: center;
}

.welcome__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.welcome__logo-img {
  width: 180px;
  height: 180px;
  object-fit: contain;
  filter:
    drop-shadow(0 4px 32px rgba(139,92,246,0.55))
    drop-shadow(0 0 80px rgba(236,72,153,0.2));
  animation: cs-scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
}

.welcome__logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cs-scale-in 0.4s ease both;
}

.welcome__title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--cs-text);
  letter-spacing: -0.03em;
  animation: cs-slide-up 0.35s ease 0.1s both;
}

.welcome__title-accent {
  background: linear-gradient(135deg, var(--cs-primary), var(--cs-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome__subtitle {
  font-size: 1.0625rem;
  color: var(--cs-text-secondary);
  max-width: 500px;
  line-height: 1.65;
  animation: cs-slide-up 0.35s ease 0.2s both;
}

.welcome__actions {
  display: flex;
  gap: 0.875rem;
  flex-wrap: wrap;
  justify-content: center;
  animation: cs-slide-up 0.35s ease 0.3s both;
}

.welcome__guest {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--cs-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  animation: cs-fade-in 0.35s ease 0.4s both;
}

.welcome__guest:hover { color: var(--cs-text); }

.welcome__features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
  animation: cs-slide-up 0.35s ease 0.45s both;
}

.welcome__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.75rem;
  text-align: left;
}

.welcome__feature-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--cs-primary-subtle);
  color: var(--cs-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome__feature-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cs-text);
  margin-bottom: 0.2rem;
}

.welcome__feature-desc {
  font-size: 0.8125rem;
  color: var(--cs-text-muted);
  line-height: 1.45;
}

@media (max-width: 500px) {
  .welcome__features { grid-template-columns: 1fr; }
}
</style>
