<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const LAST_UPDATED   = '1 de agosto de 2026'
const TERMS_VERSION  = '1.0'
const CONTACT_EMAIL  = 'privacidad@vylora.app'
</script>

<template>
  <div class="legal-page">
    <div class="legal-page__inner">
      <!-- Header -->
      <div class="legal-page__header">
        <button class="legal-page__back" @click="router.back()">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Volver
        </button>
        <div class="legal-page__badge">🔒 Documento Legal</div>
      </div>

      <h1 class="legal-page__title">Política de Privacidad</h1>
      <p class="legal-page__meta">
        Versión {{ TERMS_VERSION }} · Última actualización: {{ LAST_UPDATED }}
      </p>

      <div class="legal-body">

        <!-- Intro -->
        <div class="legal-alert">
          <strong>Resumen en lenguaje simple:</strong> Recogemos solo los datos mínimos necesarios para que la plataforma funcione. Nunca vendemos tus datos. Puedes eliminar tu cuenta y todos tus datos en cualquier momento.
        </div>

        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p><strong>Vylora</strong> es la plataforma responsable del tratamiento de tus datos personales. Para cualquier consulta relacionada con privacidad escríbenos a <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.</p>
        </section>

        <section>
          <h2>2. Qué datos recopilamos</h2>
          <p>Recopilamos únicamente los datos necesarios para el funcionamiento de la plataforma:</p>
          <ul>
            <li><strong>Datos de registro:</strong> nombre de usuario, nombre visible y contraseña (almacenada con hash bcrypt, nunca en texto plano).</li>
            <li><strong>Datos de perfil opcionales:</strong> foto de perfil, biografía, ciudad y país. Todos son opcionales y los controlas tú.</li>
            <li><strong>Datos de uso:</strong> mensajes enviados, salas a las que perteneces, lista de amigos.</li>
            <li><strong>Datos técnicos:</strong> dirección IP (anonimizada — el último octeto se elimina), tipo de dispositivo y navegador, para seguridad y detección de fraude.</li>
            <li><strong>Cookies de sesión:</strong> necesarias para mantener tu sesión activa. No usamos cookies de seguimiento ni publicidad.</li>
          </ul>
          <p><strong>NO recopilamos:</strong> número de teléfono, datos bancarios, documentos de identidad (a menos que solicites verificación voluntariamente), ubicación GPS ni datos biométricos.</p>
        </section>

        <section>
          <h2>3. Para qué usamos tus datos</h2>
          <ul>
            <li>Crear y gestionar tu cuenta de usuario.</li>
            <li>Permitirte comunicarte con otros usuarios en tiempo real.</li>
            <li>Proteger la plataforma contra spam, estafas y abusos.</li>
            <li>Enviarte notificaciones relevantes (solo si las activas).</li>
            <li>Cumplir obligaciones legales aplicables.</li>
          </ul>
          <p><strong>NO usamos tus datos para:</strong> publicidad personalizada, venta a terceros, perfilado comercial ni toma de decisiones automatizadas que te afecten significativamente.</p>
        </section>

        <section>
          <h2>4. Base legal del tratamiento</h2>
          <p>El tratamiento de tus datos se basa en:</p>
          <ul>
            <li><strong>Ejecución del contrato:</strong> necesario para prestarte el servicio (Art. 6.1.b GDPR).</li>
            <li><strong>Consentimiento explícito:</strong> que otorgas al registrarte marcando el checkbox de aceptación (Art. 6.1.a GDPR, Art. 9 Ley 1581/2012).</li>
            <li><strong>Interés legítimo:</strong> para la seguridad de la plataforma y prevención del fraude (Art. 6.1.f GDPR).</li>
          </ul>
        </section>

        <section>
          <h2>5. Tus derechos</h2>
          <p>Tienes los siguientes derechos reconocidos por la ley:</p>
          <ul>
            <li>✅ <strong>Acceso:</strong> Puedes descargar todos tus datos desde Configuración → Privacidad → Exportar mis datos.</li>
            <li>✅ <strong>Rectificación:</strong> Puedes actualizar tus datos desde la sección Perfil en cualquier momento.</li>
            <li>✅ <strong>Eliminación (derecho al olvido):</strong> Puedes eliminar permanentemente tu cuenta y todos tus datos desde Configuración → Privacidad → Eliminar cuenta. Plazo máximo: 30 días calendario.</li>
            <li>✅ <strong>Portabilidad:</strong> Puedes exportar tus datos en formato JSON desde Configuración → Privacidad.</li>
            <li>✅ <strong>Oposición:</strong> Puedes oponerte al tratamiento escribiéndonos a {{ CONTACT_EMAIL }}.</li>
            <li>✅ <strong>Revocación del consentimiento:</strong> Puedes revocar tu consentimiento en cualquier momento, lo que implicará la eliminación de tu cuenta.</li>
          </ul>
        </section>

        <section>
          <h2>6. Compartición de datos con terceros</h2>
          <p>Utilizamos los siguientes proveedores de servicios que procesan datos en tu nombre:</p>
          <ul>
            <li><strong>Supabase Inc.</strong> (Estados Unidos) — almacenamiento de datos y autenticación. Cumple con el DPA estándar UE-EEUU.</li>
            <li><strong>Netlify Inc.</strong> (Estados Unidos) — hosting del frontend. Solo procesa metadatos de conexión.</li>
          </ul>
          <p>No compartimos tus datos con anunciantes, brokers de datos ni ningún otro tercero con fines comerciales.</p>
        </section>

        <section>
          <h2>7. Retención de datos</h2>
          <ul>
            <li><strong>Cuenta activa:</strong> Conservamos tus datos mientras tu cuenta esté activa.</li>
            <li><strong>Mensajes:</strong> Los mensajes se conservan hasta que eliminas tu cuenta. Al eliminarla, el contenido se anonimiza.</li>
            <li><strong>Logs de seguridad:</strong> Se conservan por 90 días para prevención del fraude.</li>
            <li><strong>Registros de consentimiento:</strong> Se conservan por 5 años conforme a obligaciones legales.</li>
          </ul>
        </section>

        <section>
          <h2>8. Seguridad</h2>
          <p>Implementamos medidas técnicas y organizativas para proteger tus datos:</p>
          <ul>
            <li>Cifrado en tránsito (HTTPS/TLS 1.3) y en reposo.</li>
            <li>Contraseñas hasheadas con bcrypt (nunca almacenadas en texto plano).</li>
            <li>Row Level Security (RLS) en base de datos — cada usuario solo accede a sus propios datos.</li>
            <li>IPs anonimizadas antes del almacenamiento.</li>
            <li>Auditoría de accesos administrativos.</li>
          </ul>
        </section>

        <section>
          <h2>9. Transferencias internacionales</h2>
          <p>Tus datos pueden ser procesados en servidores ubicados en Estados Unidos a través de Supabase y Netlify. Estas transferencias se realizan bajo garantías adecuadas (Cláusulas Contractuales Tipo de la UE).</p>
        </section>

        <section>
          <h2>10. Usuarios menores de edad</h2>
          <p><strong>Vylora es exclusivamente para mayores de 18 años.</strong> No recopilamos intencionadamente datos de menores. Si detectamos que un usuario es menor de edad, eliminaremos su cuenta inmediatamente. Si eres padre o tutor y crees que un menor ha creado una cuenta, contáctanos en {{ CONTACT_EMAIL }}.</p>
        </section>

        <section>
          <h2>11. Cambios en esta política</h2>
          <p>Notificaremos cualquier cambio material a través de un aviso en la plataforma con al menos 15 días de anticipación. El uso continuado de la plataforma tras ese período constituye aceptación de los cambios.</p>
        </section>

        <section>
          <h2>12. Contacto y reclamaciones</h2>
          <p>Para ejercer tus derechos o para cualquier consulta sobre privacidad: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a></p>
          <p>Si consideras que no hemos tratado adecuadamente tu solicitud, tienes derecho a presentar una reclamación ante la autoridad de protección de datos de tu país.</p>
        </section>

      </div>

      <!-- Footer de navegación legal -->
      <div class="legal-page__footer">
        <router-link to="/terms" class="legal-page__footer-link">Términos y Condiciones</router-link>
        <span>·</span>
        <router-link to="/cookies" class="legal-page__footer-link">Política de Cookies</router-link>
        <span>·</span>
        <router-link to="/privacy" class="legal-page__footer-link legal-page__footer-link--active">Privacidad</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100dvh;
  background: var(--cs-bg);
  padding: 2rem 1.5rem;
}

.legal-page__inner {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.legal-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.legal-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--cs-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
}
.legal-page__back:hover { color: var(--cs-text); }

.legal-page__badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: var(--cs-primary-subtle);
  color: var(--cs-primary);
  border: 1px solid rgba(99,102,241,0.2);
}

.legal-page__title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 800;
  color: var(--cs-text);
  letter-spacing: -0.03em;
  margin: 0;
}

.legal-page__meta {
  font-size: 0.875rem;
  color: var(--cs-text-muted);
  margin: -0.5rem 0 0;
}

.legal-body {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  color: var(--cs-text-secondary);
  line-height: 1.7;
  font-size: 0.9375rem;
}

.legal-alert {
  background: var(--cs-primary-subtle);
  border: 1px solid rgba(99,102,241,0.25);
  border-left: 4px solid var(--cs-primary);
  border-radius: 0.625rem;
  padding: 1rem 1.25rem;
  font-size: 0.9375rem;
  color: var(--cs-text);
  line-height: 1.6;
}

.legal-body section { display: flex; flex-direction: column; gap: 0.75rem; }

.legal-body h2 {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--cs-text);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--cs-border);
}

.legal-body p { margin: 0; }
.legal-body ul { padding-left: 1.25rem; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }
.legal-body li { color: var(--cs-text-secondary); }
.legal-body a { color: var(--cs-primary); text-decoration: none; }
.legal-body a:hover { opacity: 0.8; text-decoration: underline; }
.legal-body strong { color: var(--cs-text); font-weight: 600; }

.legal-page__footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--cs-border);
  flex-wrap: wrap;
  color: var(--cs-text-muted);
  font-size: 0.875rem;
}

.legal-page__footer-link { color: var(--cs-text-muted); text-decoration: none; transition: color 0.15s; }
.legal-page__footer-link:hover { color: var(--cs-primary); }
.legal-page__footer-link--active { color: var(--cs-primary); font-weight: 600; }
</style>
