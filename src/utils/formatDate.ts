// ============================================================
// FORMAT DATE — Utilidades de formato de fechas
// ============================================================

/**
 * Formatea una fecha ISO para mostrar en el chat.
 * < 1 min → "Ahora"
 * < 1 hora → "Hace X min"
 * < 24 horas → "HH:MM"
 * >= 24 horas → "DD MMM"
 * >= 1 año → "DD MMM YYYY"
 */
export function formatMessageTime(isoString: string): string {
  const date = new Date(isoString)
  const now = Date.now()
  const diff = now - date.getTime()

  if (diff < 60_000) return 'Ahora'
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`
  if (diff < 86_400_000) {
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 365 * 86_400_000) {
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Formatea fecha completa para tooltips (hover sobre timestamp).
 */
export function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Agrupa mensajes por fecha para separadores de día en el chat.
 */
export function formatDateSeparator(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isToday) return 'Hoy'
  if (isYesterday) return 'Ayer'
  return date.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}
