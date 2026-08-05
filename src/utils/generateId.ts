// ============================================================
// GENERATE ID — IDs locales para mensajes optimistas
// ============================================================

/**
 * Genera un ID local temporal para mensajes optimistas.
 * Reemplazado por el ID real de Supabase cuando se confirma el envío.
 */
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
