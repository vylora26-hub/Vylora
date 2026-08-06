<script setup lang="ts">
/**
 * AgeGate — Modal de verificación de mayoría de edad.
 * Se muestra una sola vez y guarda la confirmación en localStorage.
 * Si el usuario niega, es redirigido fuera de la plataforma.
 */

const emit = defineEmits<{
  confirm: []
  deny: []
}>()

function handleConfirm() {
  localStorage.setItem('vylora_age_verified', 'true')
  emit('confirm')
}

function handleDeny() {
  // Redirigir a Google — el usuario no puede continuar
  window.location.href = 'https://www.google.com'
}
</script>

<template>
  <Teleport to="body">
    <div class="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title" aria-describedby="age-gate-desc">

      <!-- Fondo oscuro -->
      <div class="age-gate__backdrop" aria-hidden="true" />

      <!-- Panel central -->
      <div class="age-gate__panel">

        <!-- Ícono 18+ -->
        <div class="age-gate__badge" aria-hidden="true">
          <span class="age-gate__badge-text">18+</span>
        </div>

        <h2 id="age-gate-title" class="age-gate__title">
          Contenido para adultos
        </h2>

        <p id="age-gate-desc" class="age-gate__desc">
          Vylora es una plataforma de chat diseñada exclusivamente para
          personas mayores de <strong>18 años</strong>. Algunas salas
          pueden contener conversaciones, lenguaje o contenido destinado
          a una audiencia adulta.
        </p>

        <div class="age-gate__notice">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Al ingresar, confirmas que tienes 18 años o más y aceptas los Términos de Uso.</span>
        </div>

        <!-- Acciones -->
        <div class="age-gate__actions">
          <button class="age-gate__btn age-gate__btn--confirm" @click="handleConfirm">
            Sí, tengo 18 años o más
          </button>
          <button class="age-gate__btn age-gate__btn--deny" @click="handleDeny">
            No, soy menor de edad
          </button>
        </div>

        <!-- Nota legal -->
        <p class="age-gate__legal">
          Esta verificación cumple con los estándares de protección a menores.
          El acceso no autorizado de menores está prohibido.
        </p>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.age-gate {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.age-gate__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
}

.age-gate__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: #111116;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1.25rem;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.125rem;
  text-align: center;
  box-shadow:
    0 0 0 1px rgba(99,102,241,0.15),
    0 32px 80px rgba(0,0,0,0.7);
  animation: gate-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
}

/* Badge 18+ */
.age-gate__badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 32px rgba(99,102,241,0.4);
  flex-shrink: 0;
}

.age-gate__badge-text {
  font-size: 1.375rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
}

.age-gate__title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: -0.02em;
}

.age-gate__desc {
  font-size: 0.9375rem;
  color: rgba(255,255,255,0.55);
  line-height: 1.65;
  margin: 0;
}

.age-gate__desc strong {
  color: rgba(255,255,255,0.85);
  font-weight: 600;
}

.age-gate__notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 0.625rem;
  color: rgba(165,180,252,0.85);
  font-size: 0.8125rem;
  line-height: 1.5;
  text-align: left;
  width: 100%;
}

.age-gate__notice svg { flex-shrink: 0; margin-top: 1px; color: #818cf8; }

.age-gate__actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 100%;
  margin-top: 0.25rem;
}

.age-gate__btn {
  width: 100%;
  padding: 0.8125rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  font-family: inherit;
}

.age-gate__btn--confirm {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 16px rgba(99,102,241,0.35);
}

.age-gate__btn--confirm:hover {
  box-shadow: 0 6px 24px rgba(99,102,241,0.5);
  transform: translateY(-1px);
}

.age-gate__btn--deny {
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.08);
}

.age-gate__btn--deny:hover {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.6);
}

.age-gate__legal {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.2);
  margin: 0;
  line-height: 1.5;
}

@keyframes gate-in {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
