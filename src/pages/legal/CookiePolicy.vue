<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const LAST_UPDATED  = '1 de agosto de 2026'
const CONTACT_EMAIL = 'privacidad@vylora.app'
</script>

<template>
  <div class="legal-page">
    <div class="legal-page__inner">
      <div class="legal-page__header">
        <button class="legal-page__back" @click="router.back()">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Volver
        </button>
        <div class="legal-page__badge">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Política de Cookies
        </div>
      </div>

      <h1 class="legal-page__title">Política de Cookies</h1>
      <p class="legal-page__meta">Última actualización: {{ LAST_UPDATED }}</p>

      <div class="legal-body">
        <div class="legal-alert">
          <strong>Resumen:</strong> Vylora usa solo cookies estrictamente necesarias para el funcionamiento de la plataforma. No usamos cookies de seguimiento, publicidad ni analítica de terceros.
        </div>

        <section>
          <h2>1. ¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo para recordar información sobre tu visita. Pueden ser cookies de sesión (se eliminan al cerrar el navegador) o persistentes (permanecen durante un tiempo definido).</p>
        </section>

        <section>
          <h2>2. Cookies que usamos</h2>
          <p>Vylora utiliza <strong>exclusivamente cookies técnicas necesarias</strong>:</p>
          <div class="cookie-table">
            <div class="cookie-table__header">
              <span>Nombre</span><span>Propósito</span><span>Duración</span><span>Tipo</span>
            </div>
            <div class="cookie-table__row">
              <span><code>sb-auth-token</code></span>
              <span>Mantener tu sesión de usuario activa</span>
              <span>Sesión</span>
              <span class="badge-necessary">Necesaria</span>
            </div>
            <div class="cookie-table__row">
              <span><code>cs_theme</code></span>
              <span>Recordar tu preferencia de tema (claro/oscuro)</span>
              <span>1 año</span>
              <span class="badge-necessary">Necesaria</span>
            </div>
            <div class="cookie-table__row">
              <span><code>vylora_age_verified</code></span>
              <span>Recordar que confirmaste ser mayor de edad</span>
              <span>1 año</span>
              <span class="badge-necessary">Necesaria</span>
            </div>
          </div>
        </section>

        <section>
          <h2>3. Cookies que NO usamos</h2>
          <p>Vylora <strong>NO usa</strong> ninguno de los siguientes tipos de cookies:</p>
          <ul>
            <li>Cookies de publicidad o seguimiento entre sitios</li>
            <li>Cookies de analítica de terceros (Google Analytics, etc.)</li>
            <li>Cookies de redes sociales</li>
            <li>Cookies de marketing o retargeting</li>
          </ul>
        </section>

        <section>
          <h2>4. Base legal</h2>
          <p>Las cookies que usamos son estrictamente necesarias para el funcionamiento de la plataforma. No requieren consentimiento explícito según el Art. 5.3 de la Directiva ePrivacy europea, ya que sin ellas el servicio no puede funcionar correctamente.</p>
        </section>

        <section>
          <h2>5. Cómo gestionar las cookies</h2>
          <p>Puedes controlar y eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que eliminar la cookie de sesión cerrará tu cuenta. Guías por navegador:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
          </ul>
        </section>

        <section>
          <h2>6. Almacenamiento local (localStorage)</h2>
          <p>Además de cookies, Vylora utiliza el <code>localStorage</code> del navegador para guardar tu preferencia de tema y el token de sesión. Esta tecnología no puede ser leída por otros dominios y no envía datos a servidores automáticamente.</p>
        </section>

        <section>
          <h2>7. Contacto</h2>
          <p>Para consultas sobre esta política: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a></p>
        </section>
      </div>

      <div class="legal-page__footer">
        <router-link to="/terms" class="legal-page__footer-link">Términos</router-link>
        <span>·</span>
        <router-link to="/privacy" class="legal-page__footer-link">Privacidad</router-link>
        <span>·</span>
        <router-link to="/cookies" class="legal-page__footer-link legal-page__footer-link--active">Cookies</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-page { min-height: 100dvh; background: var(--cs-bg); padding: 2rem 1.5rem; }
.legal-page__inner { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
.legal-page__header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
.legal-page__back { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: var(--cs-text-muted); background: none; border: none; cursor: pointer; transition: color 0.15s; padding: 0; }
.legal-page__back:hover { color: var(--cs-text); }
.legal-page__badge { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 9999px; background: var(--cs-surface-2); color: var(--cs-text-secondary); border: 1px solid var(--cs-border); }
.legal-page__title { font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800; color: var(--cs-text); letter-spacing: -0.03em; margin: 0; }
.legal-page__meta { font-size: 0.875rem; color: var(--cs-text-muted); margin: -0.5rem 0 0; }
.legal-body { display: flex; flex-direction: column; gap: 1.75rem; color: var(--cs-text-secondary); line-height: 1.7; font-size: 0.9375rem; }
.legal-alert { background: var(--cs-primary-subtle); border: 1px solid rgba(99,102,241,0.25); border-left: 4px solid var(--cs-primary); border-radius: 0.625rem; padding: 1rem 1.25rem; color: var(--cs-text); }
.legal-body section { display: flex; flex-direction: column; gap: 0.75rem; }
.legal-body h2 { font-size: 1.0625rem; font-weight: 700; color: var(--cs-text); margin: 0; padding-bottom: 0.5rem; border-bottom: 1px solid var(--cs-border); }
.legal-body p { margin: 0; }
.legal-body ul { padding-left: 1.25rem; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }
.legal-body a { color: var(--cs-primary); text-decoration: none; }
.legal-body a:hover { text-decoration: underline; }
.legal-body strong { color: var(--cs-text); font-weight: 600; }
code { background: var(--cs-surface-2); padding: 0.1em 0.4em; border-radius: 4px; font-size: 0.875em; color: var(--cs-text); }

.cookie-table { border: 1px solid var(--cs-border); border-radius: 0.75rem; overflow: hidden; font-size: 0.875rem; }
.cookie-table__header, .cookie-table__row { display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr; gap: 0.5rem; padding: 0.625rem 1rem; align-items: center; }
.cookie-table__header { background: var(--cs-surface-2); font-weight: 600; color: var(--cs-text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
.cookie-table__row { border-top: 1px solid var(--cs-border); background: var(--cs-surface); color: var(--cs-text-secondary); }
.badge-necessary { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 9999px; background: rgba(34,197,94,0.1); color: #22c55e; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
.legal-page__footer { display: flex; align-items: center; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--cs-border); flex-wrap: wrap; color: var(--cs-text-muted); font-size: 0.875rem; }
.legal-page__footer-link { color: var(--cs-text-muted); text-decoration: none; transition: color 0.15s; }
.legal-page__footer-link:hover { color: var(--cs-primary); }
.legal-page__footer-link--active { color: var(--cs-primary); font-weight: 600; }

@media (max-width: 600px) {
  .cookie-table__header, .cookie-table__row { grid-template-columns: 1fr 1fr; }
}
</style>
