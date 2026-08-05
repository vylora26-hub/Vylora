<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found__content">
      <p class="not-found__code" aria-hidden="true">404</p>
      <h1 class="not-found__title">Página no encontrada</h1>
      <p class="not-found__desc">
        La página que buscas no existe o fue movida.
      </p>
      <div class="not-found__actions">
        <AppButton variant="primary" size="md" @click="router.push('/app/home')">
          Ir al inicio
        </AppButton>
        <AppButton variant="ghost" size="md" @click="router.back()">
          Volver atrás
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cs-bg);
  padding: 2rem;
}

.not-found__content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: cs-slide-up 0.3s ease both;
}

.not-found__code {
  font-size: clamp(6rem, 18vw, 10rem);
  font-weight: 900;
  background: linear-gradient(135deg, var(--cs-primary), var(--cs-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  letter-spacing: -0.05em;
}

.not-found__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cs-text);
}

.not-found__desc {
  font-size: 1rem;
  color: var(--cs-text-muted);
  max-width: 320px;
  line-height: 1.5;
}

.not-found__actions {
  display: flex;
  gap: 0.875rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}
</style>
