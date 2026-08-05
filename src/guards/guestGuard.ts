// ============================================================
// GUEST GUARD — Redirige usuarios autenticados fuera de auth pages
// ============================================================

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Evita que un usuario ya autenticado acceda a /auth/login,
 * /auth/register o /auth/recover.
 * Si ya tiene sesión, va directamente a /app/home.
 */
export async function guestGuard(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
}
