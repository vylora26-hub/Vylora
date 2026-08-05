<script setup lang="ts">
// No recibe props — se controla desde App.vue con v-if / Transition
</script>

<template>
  <div class="preloader" role="status" aria-label="Cargando Vylora...">

    <!-- Blobs de fondo -->
    <div class="preloader__blobs" aria-hidden="true">
      <div class="preloader__blob preloader__blob--1" />
      <div class="preloader__blob preloader__blob--2" />
      <div class="preloader__blob preloader__blob--3" />
      <div class="preloader__blob preloader__blob--4" />
    </div>

    <!-- Partículas flotantes -->
    <div class="preloader__particles" aria-hidden="true">
      <span v-for="i in 24" :key="i" class="preloader__particle" :style="particleStyle(i)" />
    </div>

    <!-- Contenido central -->
    <div class="preloader__center">

      <!-- ===== LOGO PRINCIPAL ===== -->
      <div class="preloader__logo-wrap">

        <!-- Halo exterior suave -->
        <div class="preloader__halo preloader__halo--3" aria-hidden="true" />
        <div class="preloader__halo preloader__halo--2" aria-hidden="true" />
        <div class="preloader__halo preloader__halo--1" aria-hidden="true" />

        <!-- Anillo giratorio externo -->
        <svg class="preloader__ring preloader__ring--outer" viewBox="0 0 220 220" fill="none" aria-hidden="true">
          <circle cx="110" cy="110" r="102"
            stroke="url(#ring-a)"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-dasharray="260 390" />
          <defs>
            <linearGradient id="ring-a" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
              <stop stop-color="#6366f1" stop-opacity="1" />
              <stop offset="0.4" stop-color="#a855f7" stop-opacity="0.5" />
              <stop offset="1"   stop-color="#ec4899" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Anillo giratorio interno (reverso) -->
        <svg class="preloader__ring preloader__ring--inner" viewBox="0 0 160 160" fill="none" aria-hidden="true">
          <circle cx="80" cy="80" r="72"
            stroke="url(#ring-b)"
            stroke-width="1"
            stroke-linecap="round"
            stroke-dasharray="100 350" />
          <defs>
            <linearGradient id="ring-b" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ec4899" stop-opacity="0.9" />
              <stop offset="0.5" stop-color="#8b5cf6" stop-opacity="0.4" />
              <stop offset="1"   stop-color="#ec4899" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Logo imagen -->
        <div class="preloader__logo">
          <img
            src="/LOGO-Vylora.png"
            alt="Vylora"
            class="preloader__logo-img"
            draggable="false"
          />
        </div>
      </div>

      <!-- ===== MARCA ===== -->
      <div class="preloader__brand">
        <h1 class="preloader__name">Vylora</h1>
        <p class="preloader__tagline">Conecta en tiempo real</p>
      </div>

      <!-- ===== PROGRESO ===== -->
      <div class="preloader__progress-wrap" role="progressbar" aria-valuemin="0" aria-valuemax="100">
        <div class="preloader__progress-track">
          <div class="preloader__progress-bar" />
        </div>
        <div class="preloader__dots">
          <span v-for="i in 3" :key="i" class="preloader__dot" :style="{ animationDelay: `${(i - 1) * 0.18}s` }" />
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
function particleStyle(i: number): Record<string, string> {
  const seed  = i * 137.508
  const size  = `${(seed % 3) + 1.5}px`
  const x     = `${(seed * 2.3) % 100}%`
  const y     = `${(seed * 1.7) % 100}%`
  const delay = `${(seed * 0.03) % 5}s`
  const dur   = `${((seed * 0.07) % 4) + 4}s`
  const op    = `${((seed * 0.009) % 0.35) + 0.08}`
  return { width: size, height: size, left: x, top: y, animationDelay: delay, animationDuration: dur, opacity: op }
}
</script>

<style scoped>
/* ============================================================
   PRELOADER — Vylora
   ============================================================ */

.preloader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #08080f;
  overflow: hidden;
}

/* ---- Blobs ---- */
.preloader__blobs { position: absolute; inset: 0; pointer-events: none; }

.preloader__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.preloader__blob--1 {
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%);
  top: -250px; left: -250px;
  animation: blob-1 9s ease-in-out infinite;
}

.preloader__blob--2 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 65%);
  bottom: -200px; right: -200px;
  animation: blob-2 11s ease-in-out infinite;
}

.preloader__blob--3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 65%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: blob-3 7s ease-in-out infinite;
}

.preloader__blob--4 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%);
  top: 10%; right: 10%;
  animation: blob-1 13s ease-in-out infinite reverse;
}

/* ---- Partículas ---- */
.preloader__particles { position: absolute; inset: 0; pointer-events: none; }

.preloader__particle {
  position: absolute;
  border-radius: 50%;
  background: #8b5cf6;
  animation: particle-float linear infinite;
}

/* ---- Centro ---- */
.preloader__center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.25rem;
}

/* ---- Logo wrap ---- */
.preloader__logo-wrap {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Halos brillantes concéntricos */
.preloader__halo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.preloader__halo--1 {
  inset: 24px;
  background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
  animation: halo-pulse 2.2s ease-in-out infinite;
}

.preloader__halo--2 {
  inset: 8px;
  background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
  animation: halo-pulse 2.2s ease-in-out 0.4s infinite;
}

.preloader__halo--3 {
  inset: -16px;
  background: radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 65%);
  animation: halo-pulse 2.2s ease-in-out 0.8s infinite;
}

/* Anillos giratorios */
.preloader__ring {
  position: absolute;
  inset: 0;
}

.preloader__ring--outer {
  width: 220px;
  height: 220px;
  animation: ring-cw 3s linear infinite;
}

.preloader__ring--inner {
  width: 160px;
  height: 160px;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: ring-ccw 2s linear infinite;
}

/* Logo imagen */
.preloader__logo {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preloader__logo-img {
  width: 148px;
  height: 148px;
  object-fit: contain;
  animation: logo-breathe 2.8s ease-in-out infinite;
  filter:
    drop-shadow(0 0 28px rgba(139,92,246,0.7))
    drop-shadow(0 0 60px rgba(99,102,241,0.35))
    drop-shadow(0 8px 32px rgba(0,0,0,0.6));
}

/* ---- Marca ---- */
.preloader__brand {
  text-align: center;
  animation: fade-up 0.7s ease 0.25s both;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
}

.preloader__name {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.045em;
  background: linear-gradient(135deg, #fff 0%, #c4b5fd 45%, #f9a8d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
  filter: drop-shadow(0 0 20px rgba(139,92,246,0.3));
}

.preloader__tagline {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0;
}

/* ---- Progreso ---- */
.preloader__progress-wrap {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: fade-up 0.7s ease 0.45s both;
}

.preloader__progress-track {
  width: 100%;
  height: 2px;
  background: rgba(255,255,255,0.05);
  border-radius: 9999px;
  overflow: hidden;
}

.preloader__progress-bar {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #a855f7, #6366f1);
  background-size: 300% 100%;
  animation: bar-shimmer 2s ease-in-out infinite;
}

.preloader__dots {
  display: flex;
  gap: 0.5rem;
}

.preloader__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  animation: dot-bounce 1.3s ease-in-out infinite;
}

/* ============================================================
   KEYFRAMES
   ============================================================ */

@keyframes ring-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes ring-ccw {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(-360deg); }
}

@keyframes logo-breathe {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 28px rgba(139,92,246,0.7)) drop-shadow(0 0 60px rgba(99,102,241,0.35)) drop-shadow(0 8px 32px rgba(0,0,0,0.6));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 40px rgba(168,85,247,0.9)) drop-shadow(0 0 80px rgba(236,72,153,0.5)) drop-shadow(0 12px 40px rgba(0,0,0,0.7));
  }
}

@keyframes halo-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.12); }
}

@keyframes blob-1 {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(50px, 40px); }
}

@keyframes blob-2 {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(-40px, -50px); }
}

@keyframes blob-3 {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
  50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.25); }
}

@keyframes particle-float {
  0%   { transform: translateY(0) scale(1);    opacity: inherit; }
  50%  { transform: translateY(-40px) scale(1.3); opacity: 0.5; }
  100% { transform: translateY(0) scale(1);    opacity: inherit; }
}

@keyframes bar-shimmer {
  0%   { background-position: 100% 0; width: 10%; }
  50%  { background-position: 0% 0;   width: 80%; }
  100% { background-position: 100% 0; width: 10%; }
}

@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0) scale(1);    opacity: 0.35; }
  40%            { transform: translateY(-7px) scale(1.4); opacity: 1;   }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Transición de salida ---- */
.preloader-leave-active {
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.preloader-leave-to {
  opacity: 0;
  transform: scale(1.06);
}
</style>
