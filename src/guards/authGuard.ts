// ============================================================
// AUTH GUARD — Protege rutas que requieren autenticación
// ============================================================

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Redirige a /auth/login si el usuario no está autenticado.
 * Guarda la ruta destino para redirigir después del login.
 */
export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> {
  const authStore = useAuthStore()

  // Esperar a que se inicialice la sesión (solo la primera vez)
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (!authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
}
