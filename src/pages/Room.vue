<script setup lang="ts">
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{ slug: string }>()
</script>

<template>
  <div class="room-page">
    <!-- Header de sala -->
    <header class="room-page__header">
      <div class="room-page__info">
        <div class="room-page__icon" aria-hidden="true">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h1 class="room-page__name">{{ slug }}</h1>
          <p class="room-page__meta">0 miembros · Sala pública</p>
        </div>
      </div>
      <div class="room-page__actions">
        <AppButton variant="ghost" size="sm" aria-label="Miembros">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </AppButton>
        <AppButton variant="ghost" size="sm" aria-label="Buscar mensajes">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </AppButton>
      </div>
    </header>

    <!-- Área de mensajes -->
    <div class="room-page__messages" role="log" aria-label="Mensajes de la sala" aria-live="polite">
      <AppEmptyState
        title="Chat en tiempo real — Fase 3"
        description="El sistema de mensajería con scroll infinito, reacciones y archivos se implementa en la siguiente fase."
        icon="chat"
      />
    </div>

    <!-- Input de mensaje -->
    <div class="room-page__input-bar">
      <div class="room-page__input-wrap">
        <input
          class="room-page__input"
          type="text"
          placeholder="Escribe un mensaje..."
          disabled
          aria-label="Escribe un mensaje"
        />
        <button class="room-page__send" disabled aria-label="Enviar mensaje">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

.room-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--cs-border);
  background: var(--cs-surface);
  flex-shrink: 0;
  gap: 1rem;
}

.room-page__info { display: flex; align-items: center; gap: 0.75rem; }

.room-page__icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: var(--cs-primary-subtle);
  color: var(--cs-primary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.room-page__name { font-size: 1rem; font-weight: 700; color: var(--cs-text); }
.room-page__meta { font-size: 0.8125rem; color: var(--cs-text-muted); }
.room-page__actions { display: flex; gap: 0.25rem; }

.room-page__messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-page__input-bar {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--cs-border);
  background: var(--cs-surface);
  flex-shrink: 0;
}

.room-page__input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--cs-surface-2);
  border: 1.5px solid var(--cs-border);
  border-radius: 0.75rem;
  padding: 0.5rem 0.625rem 0.5rem 1rem;
}

.room-page__input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--cs-text);
  font-size: 0.9375rem;
}

.room-page__input::placeholder { color: var(--cs-text-muted); }
.room-page__input:disabled { opacity: 0.5; cursor: not-allowed; }

.room-page__send {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  border-radius: 8px;
  background: var(--cs-primary);
  border: none;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.room-page__send:disabled { opacity: 0.4; cursor: not-allowed; }
.room-page__send:hover:not(:disabled) { background: var(--cs-primary-hover); }
</style>
