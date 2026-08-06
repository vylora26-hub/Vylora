<script setup lang="ts">
// Layout para páginas de autenticación: login, register, recover
// Sin sidebar ni navegación — foco total en el formulario
</script>

<template>
  <div class="auth-layout">
    <!-- Fondo decorativo con gradiente -->
    <div class="auth-layout__bg" aria-hidden="true">
      <div class="auth-layout__bg-blob auth-layout__bg-blob--1" />
      <div class="auth-layout__bg-blob auth-layout__bg-blob--2" />
    </div>

    <!-- Contenedor central -->
    <main class="auth-layout__main" role="main">
      <!-- Logo -->
      <div class="auth-layout__brand">
        <img
          src="/LOGO-Vylora.png"
          alt="Vylora"
          class="auth-layout__logo-img"
          draggable="false"
        />
        <span class="auth-layout__brand-name">Vylora</span>
      </div>

      <!-- Tarjeta del formulario -->
      <div class="auth-layout__card">
        <RouterView />
      </div>

      <!-- Footer legal -->
      <footer class="auth-layout__footer">
        <p>
          Al continuar aceptas nuestros
          <RouterLink to="/terms" class="auth-layout__link">Términos</RouterLink>,
          <RouterLink to="/privacy" class="auth-layout__link">Privacidad</RouterLink> y
          <RouterLink to="/cookies" class="auth-layout__link">Cookies</RouterLink>.
        </p>
        <p style="margin-top:0.375rem">
          Plataforma exclusiva para mayores de <strong>18 años</strong>.
        </p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: var(--cs-bg);
  padding: 1.5rem;
}

.auth-layout__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.auth-layout__bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
}

.auth-layout__bg-blob--1 {
  width: 500px;
  height: 500px;
  background: var(--cs-primary);
  top: -200px;
  left: -150px;
}

.auth-layout__bg-blob--2 {
  width: 400px;
  height: 400px;
  background: var(--cs-accent);
  bottom: -150px;
  right: -100px;
}

.auth-layout__main {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.auth-layout__brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.auth-layout__logo-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(139,92,246,0.4));
}

.auth-layout__logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-layout__brand-name {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--cs-text);
  letter-spacing: -0.02em;
}

.auth-layout__card {
  width: 100%;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.auth-layout__footer {
  font-size: 0.75rem;
  color: var(--cs-text-muted);
  text-align: center;
}

.auth-layout__link {
  color: var(--cs-primary);
  text-decoration: none;
  transition: opacity 0.15s;
}

.auth-layout__link:hover {
  opacity: 0.8;
}
</style>
