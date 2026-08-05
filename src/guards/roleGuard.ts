// ============================================================
// ROLE GUARD — Protege rutas por rol (moderator, admin)
// ============================================================

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { hasRole } from '@/constants'
import type { UserRole } from '@/types'

/**
 * Fábrica que devuelve un guard para un rol mínimo requerido.
 *
 * Uso en el router:
 *   beforeEnter: roleGuard('admin')
 *   beforeEnter: roleGuard('moderator')
 */
export function roleGuard(requiredRole: UserRole) {
  return async function (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ): Promise<void> {
    const authStore = useAuthStore()

    if (!authStore.initialized) {
      await authStore.initialize()
    }

    if (!authStore.isAuthenticated) {
      next({ name: 'Login' })
      return
    }

    if (!hasRole(authStore.userRole, requiredRole)) {
      // Usuario autenticado pero sin permisos → home
      next({ name: 'Home' })
      return
    }

    next()
  }
}
