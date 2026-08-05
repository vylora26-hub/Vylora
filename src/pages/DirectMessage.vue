<script setup lang="ts">
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

defineProps<{ id: string }>()
</script>

<template>
  <div class="dm-chat">
    <header class="dm-chat__header">
      <RouterLink to="/app/dm" class="dm-chat__back" aria-label="Volver a mensajes">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </RouterLink>
      <div class="dm-chat__user">
        <div class="dm-chat__avatar" aria-hidden="true">?</div>
        <div>
          <p class="dm-chat__name">Conversación #{{ id }}</p>
          <p class="dm-chat__status">En línea</p>
        </div>
      </div>
    </header>

    <div class="dm-chat__messages" role="log" aria-label="Mensajes privados" aria-live="polite">
      <AppEmptyState
        title="Chat privado — Fase 4"
        description="Los mensajes directos con cifrado y estado de lectura se implementan próximamente."
        icon="lock"
      />
    </div>

    <div class="dm-chat__input-bar">
      <div class="dm-chat__input-wrap">
        <input class="dm-chat__input" type="text" placeholder="Escribe un mensaje..." disabled aria-label="Mensaje privado" />
        <button class="dm-chat__send" disabled aria-label="Enviar">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dm-chat { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
.dm-chat__header { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--cs-border); background: var(--cs-surface); flex-shrink: 0; }
.dm-chat__back { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; color: var(--cs-text-muted); transition: background 0.15s, color 0.15s; }
.dm-chat__back:hover { background: var(--cs-surface-hover); color: var(--cs-text); }
.dm-chat__user { display: flex; align-items: center; gap: 0.625rem; }
.dm-chat__avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--cs-primary-subtle); color: var(--cs-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
.dm-chat__name { font-size: 0.9375rem; font-weight: 600; color: var(--cs-text); }
.dm-chat__status { font-size: 0.75rem; color: #22c55e; }
.dm-chat__messages { flex: 1; overflow-y: auto; display: flex; align-items: center; justify-content: center; }
.dm-chat__input-bar { padding: 0.875rem 1.25rem; border-top: 1px solid var(--cs-border); background: var(--cs-surface); flex-shrink: 0; }
.dm-chat__input-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--cs-surface-2); border: 1.5px solid var(--cs-border); border-radius: 0.75rem; padding: 0.5rem 0.625rem 0.5rem 1rem; }
.dm-chat__input { flex: 1; background: none; border: none; outline: none; color: var(--cs-text); font-size: 0.9375rem; }
.dm-chat__input::placeholder { color: var(--cs-text-muted); }
.dm-chat__input:disabled { opacity: 0.5; cursor: not-allowed; }
.dm-chat__send { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: var(--cs-primary); border: none; color: #fff; cursor: pointer; transition: background 0.15s; flex-shrink: 0; }
.dm-chat__send:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
