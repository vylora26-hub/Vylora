<script setup lang="ts">
defineProps<{ users: string[] }>()
</script>

<template>
  <Transition name="typing-fade">
    <div v-if="users.length" class="typing" aria-live="polite" :aria-label="`${users.join(', ')} ${users.length === 1 ? 'está' : 'están'} escribiendo`">
      <div class="typing__dots" aria-hidden="true">
        <span class="typing__dot" />
        <span class="typing__dot" />
        <span class="typing__dot" />
      </div>
      <span class="typing__text">
        <strong>{{ users.slice(0, 2).join(', ') }}</strong>
        {{ users.length > 2 ? ` y ${users.length - 2} más` : '' }}
        {{ users.length === 1 ? 'está escribiendo...' : 'están escribiendo...' }}
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.typing {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  font-size: 0.8125rem;
  color: var(--cs-text-muted);
  min-height: 28px;
}

.typing__dots { display: flex; align-items: center; gap: 3px; }

.typing__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--cs-text-muted);
  animation: typing-bounce 1.2s ease-in-out infinite;
}
.typing__dot:nth-child(2) { animation-delay: 0.2s; }
.typing__dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30%            { transform: translateY(-5px); }
}

.typing-fade-enter-active, .typing-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.typing-fade-enter-from, .typing-fade-leave-to       { opacity: 0; transform: translateY(4px); }
</style>
