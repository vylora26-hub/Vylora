<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const LAST_UPDATED  = '1 de agosto de 2026'
const TERMS_VERSION = '1.0'
const CONTACT_EMAIL = 'legal@vylora.app'
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Términos y Condiciones
        </div>
      </div>

      <h1 class="legal-page__title">Términos y Condiciones</h1>
      <p class="legal-page__meta">Versión {{ TERMS_VERSION }} · Última actualización: {{ LAST_UPDATED }}</p>

      <div class="legal-body">

        <div class="legal-alert">
          <strong>Importante:</strong> Al crear una cuenta en Vylora confirmas que tienes <strong>18 años o más</strong> y que aceptas estos términos. La plataforma contiene salas para adultos.
        </div>

        <section>
          <h2>1. Descripción del servicio</h2>
          <p>Vylora es una plataforma de comunicación en tiempo real que permite a sus usuarios crear salas de chat, enviar mensajes públicos y privados, y conectarse con otras personas. El servicio se proporciona "tal como está" y puede modificarse o interrumpirse en cualquier momento.</p>
        </section>

        <section>
          <h2>2. Elegibilidad y mayoría de edad</h2>
          <p>Para usar Vylora debes:</p>
          <ul>
            <li>Tener <strong>18 años o más</strong>. Vylora es una plataforma exclusivamente para adultos.</li>
            <li>Tener capacidad legal para celebrar contratos en tu jurisdicción.</li>
            <li>No estar baneado de la plataforma previamente.</li>
          </ul>
          <p>Al aceptar estos términos, declaras bajo tu responsabilidad que cumples con estos requisitos.</p>
        </section>

        <section>
          <h2>3. Conducta del usuario</h2>
          <p>Al usar Vylora te comprometes a <strong>NO</strong>:</p>
          <ul>
            <li>Publicar contenido ilegal, difamatorio, amenazante o que incite al odio.</li>
            <li>Acosar, intimidar o amenazar a otros usuarios.</li>
            <li>Suplantar la identidad de otras personas o hacerse pasar por personal de Vylora.</li>
            <li>Realizar spam, publicidad no solicitada o actividades de phishing.</li>
            <li>Intentar estafar o defraudar a otros usuarios (solicitar dinero, datos bancarios, etc.).</li>
            <li>Distribuir malware, virus u otro software dañino.</li>
            <li>Acceder de forma no autorizada a cuentas ajenas.</li>
            <li>Usar bots, scrapers u otros medios automatizados sin permiso expreso.</li>
            <li>Publicar contenido sexual que involucre a menores de edad (delito penal en todos los países).</li>
          </ul>
        </section>

        <section>
          <h2>4. Contenido del usuario</h2>
          <p>Eres el único responsable del contenido que publicas. Al publicar contenido en Vylora:</p>
          <ul>
            <li>Otorgas a Vylora una licencia limitada, no exclusiva y gratuita para mostrar ese contenido dentro de la plataforma.</li>
            <li>Declaras que tienes los derechos necesarios sobre dicho contenido.</li>
            <li>Vylora puede eliminar cualquier contenido que viole estos términos sin previo aviso.</li>
          </ul>
        </section>

        <section>
          <h2>5. Sistema de moderación</h2>
          <p>Vylora tiene un sistema activo de moderación. Podemos:</p>
          <ul>
            <li>Suspender o banear cuentas que violen estos términos.</li>
            <li>Eliminar mensajes o salas que contengan contenido prohibido.</li>
            <li>Cooperar con autoridades legales cuando sea requerido por ley.</li>
          </ul>
          <p>Los baneos permanentes no son reembolsables. Puedes apelar un baneo escribiendo a {{ CONTACT_EMAIL }}.</p>
        </section>

        <section>
          <h2>6. Contenido para adultos</h2>
          <p>Algunas salas de Vylora pueden contener conversaciones, lenguaje o contenido orientado a audiencias adultas. Este contenido está disponible solo para usuarios que han confirmado tener 18 años o más. Vylora no es responsable del contenido generado por los usuarios en estas salas, pero mantiene un sistema de reportes para gestionar abusos.</p>
        </section>

        <section>
          <h2>7. Privacidad</h2>
          <p>El tratamiento de tus datos personales se rige por nuestra <router-link to="/privacy">Política de Privacidad</router-link>, que forma parte integral de estos términos.</p>
        </section>

        <section>
          <h2>8. Limitación de responsabilidad</h2>
          <p>Vylora no se hace responsable de:</p>
          <ul>
            <li>El contenido publicado por los usuarios.</li>
            <li>Las interacciones entre usuarios (incluyendo estafas o fraudes entre particulares).</li>
            <li>Pérdidas de datos por causas fuera de nuestro control.</li>
            <li>Daños indirectos, incidentales o consecuentes derivados del uso del servicio.</li>
          </ul>
        </section>

        <section>
          <h2>9. Cancelación de cuenta</h2>
          <p>Puedes eliminar tu cuenta en cualquier momento desde Configuración → Privacidad → Eliminar cuenta. Vylora también puede cancelar tu cuenta en caso de violación de estos términos.</p>
        </section>

        <section>
          <h2>10. Ley aplicable</h2>
          <p>Estos términos se rigen por las leyes de Colombia. Para usuarios en la Unión Europea, también aplica el GDPR. Cualquier disputa se resolverá preferiblemente de forma amigable; en caso contrario, ante los tribunales competentes.</p>
        </section>

        <section>
          <h2>11. Cambios en los términos</h2>
          <p>Notificaremos cambios materiales con al menos 15 días de anticipación. El uso continuado tras ese período implica aceptación. Si no estás de acuerdo con los cambios, puedes eliminar tu cuenta.</p>
        </section>

        <section>
          <h2>12. Contacto</h2>
          <p>Para consultas legales: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a></p>
        </section>

      </div>

      <div class="legal-page__footer">
        <router-link to="/terms" class="legal-page__footer-link legal-page__footer-link--active">Términos</router-link>
        <span>·</span>
        <router-link to="/privacy" class="legal-page__footer-link">Privacidad</router-link>
        <span>·</span>
        <router-link to="/cookies" class="legal-page__footer-link">Cookies</router-link>
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
.legal-page__badge { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 9999px; background: var(--cs-surface-2); color: var(--cs-text-secondary); border: 1px solid var(--cs-border); display: inline-flex; align-items: center; gap: 0.375rem; }
.legal-page__title { font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800; color: var(--cs-text); letter-spacing: -0.03em; margin: 0; }
.legal-page__meta { font-size: 0.875rem; color: var(--cs-text-muted); margin: -0.5rem 0 0; }
.legal-body { display: flex; flex-direction: column; gap: 1.75rem; color: var(--cs-text-secondary); line-height: 1.7; font-size: 0.9375rem; }
.legal-alert { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-left: 4px solid #f59e0b; border-radius: 0.625rem; padding: 1rem 1.25rem; color: var(--cs-text); }
.legal-body section { display: flex; flex-direction: column; gap: 0.75rem; }
.legal-body h2 { font-size: 1.0625rem; font-weight: 700; color: var(--cs-text); margin: 0; padding-bottom: 0.5rem; border-bottom: 1px solid var(--cs-border); }
.legal-body p { margin: 0; }
.legal-body ul { padding-left: 1.25rem; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }
.legal-body a { color: var(--cs-primary); text-decoration: none; }
.legal-body a:hover { opacity: 0.8; }
.legal-body strong { color: var(--cs-text); font-weight: 600; }
.legal-page__footer { display: flex; align-items: center; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--cs-border); flex-wrap: wrap; color: var(--cs-text-muted); font-size: 0.875rem; }
.legal-page__footer-link { color: var(--cs-text-muted); text-decoration: none; transition: color 0.15s; }
.legal-page__footer-link:hover { color: var(--cs-primary); }
.legal-page__footer-link--active { color: var(--cs-primary); font-weight: 600; }
</style>
