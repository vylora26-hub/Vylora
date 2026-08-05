// ============================================================
// SANITIZE — Protección contra XSS
// DOMPurify elimina cualquier HTML/JS malicioso antes de
// mostrar contenido generado por el usuario en el DOM.
// ============================================================

import DOMPurify from 'dompurify'

/**
 * Sanitiza HTML arbitrario.
 * Usar en cualquier contenido que se renderice con v-html.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: true,
  })
}

/**
 * Elimina TODOS los tags HTML — para texto plano.
 * Usar en displayName, bio, mensajes de chat, etc.
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Valida que una URL sea segura (http/https solamente).
 * Previene javascript: y data: URIs.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
