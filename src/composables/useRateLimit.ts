// ============================================================
// useRateLimit — Límite de frecuencia client-side
// Evita spam de mensajes antes de llegar al servidor
// ============================================================

import { ref } from 'vue'
import { RATE_LIMITS } from '@/config/security'

export function useRateLimit() {
  const blocked = ref(false)
  const timestamps: number[] = []

  /**
   * Devuelve true si la acción está permitida, false si excede el límite.
   */
  function check(): boolean {
    const now = Date.now()
    const window = RATE_LIMITS.MESSAGE_WINDOW_MS

    // Limpiar timestamps fuera de la ventana
    while (timestamps.length && timestamps[0] < now - window) timestamps.shift()

    if (timestamps.length >= RATE_LIMITS.MESSAGES_PER_WINDOW) {
      blocked.value = true
      setTimeout(() => { blocked.value = false }, window - (now - (timestamps[0] ?? now)))
      return false
    }

    timestamps.push(now)
    blocked.value = false
    return true
  }

  function reset(): void {
    timestamps.length = 0
    blocked.value = false
  }

  return { blocked, check, reset }
}
