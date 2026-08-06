// ============================================================
// AUTH GUARD — Protege rutas que requieren autenticación
// ============================================================

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Redirige a /auth/login si el usuario no está autenticado.
 * Permite acceso a rutas marcadas con meta.allowGuest = true.
 */
export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initialize()
  }

  // Rutas que permiten invitados (ej. /app/home, /app/rooms)
  if (to.meta.allowGuest) {
    next()
    return
  }

  if (!authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
}
