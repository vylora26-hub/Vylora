// ============================================================
// AUTH STORE — Sesión, perfil y onboarding
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { APP_CONFIG } from '@/config'
import { ROLES } from '@/constants'
import { sanitizeText } from '@/utils/sanitize'
import type { AuthSession, User, UserRole } from '@/types'

// ---- Mock data ----
const MOCK_USER: User = {
  id: 'mock_user_001',
  username: 'demo_user',
  displayName: 'Demo User',
  avatarUrl: null,
  bio: 'Usuario de prueba en modo desarrollo.',
  city: 'Bogotá',
  country: 'Colombia',
  role: 'user',
  isBanned: false,
  isVerified: false,
  createdAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
}

export const useAuthStore = defineStore('auth', () => {
  // ---- Estado ----
  const session = ref<AuthSession | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // ---- Computed ----
  const isAuthenticated = computed(() => !!session.value)
  const isGuest = computed(() => !session.value)
  const userId = computed(() => session.value?.userId ?? null)
  const userRole = computed<UserRole>(() => session.value?.role ?? 'guest')
  const isAdmin = computed(() => userRole.value === ROLES.ADMIN)
  const isModerator = computed(
    () => userRole.value === ROLES.MODERATOR || userRole.value === ROLES.ADMIN,
  )
  const needsOnboarding = computed(
    () => isAuthenticated.value && user.value?.displayName === user.value?.username,
  )

  // ---- Helpers ----
  function setError(msg: string | null): void {
    error.value = msg
  }

  function clearError(): void {
    error.value = null
  }

  function persistSession(s: AuthSession): void {
    session.value = s
    localStorage.setItem(APP_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(s))
  }

  function clearSession(): void {
    session.value = null
    user.value = null
    localStorage.removeItem(APP_CONFIG.SESSION_STORAGE_KEY)
  }

  // ---- Acciones ----

  /**
   * Inicializa la sesión al arrancar la app.
   * Lee del localStorage en mock mode o del token de Supabase en producción.
   */
  async function initialize(): Promise<void> {
    if (initialized.value) return
    loading.value = true
    clearError()

    try {
      if (isMockMode) {
        const stored = localStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as AuthSession
          session.value = parsed
          user.value = JSON.parse(
            localStorage.getItem(`cs_user_${parsed.userId}`) ?? 'null',
          ) as User | null
          if (!user.value) {
            user.value = { ...MOCK_USER, id: parsed.userId }
          }
        }
      } else {
        const { data, error: err } = await supabase!.auth.getSession()
        if (err) throw err

        if (data.session) {
          await _loadSessionFromSupabase(
            data.session.user.id,
            data.session.user.email ?? '',
            data.session.access_token,
            data.session.expires_at ?? 0,
          )
        }
      }
    } catch (err) {
      setError('No se pudo restaurar la sesión.')
      console.error('[auth] initialize error:', err)
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  /**
   * Inicio de sesión con username y contraseña.
   * Busca el email asociado al username y luego autentica con Supabase.
   */
  async function loginWithUsername(username: string, password: string): Promise<boolean> {
    loading.value = true
    clearError()

    try {
      if (isMockMode) {
        const mockId = `mock_${username}`
        const mockSession: AuthSession = {
          userId: mockId,
          email: `${username}@vylora.local`,
          role: username.includes('admin') ? 'admin' : 'user',
          accessToken: 'mock_token',
          expiresAt: Date.now() + 86_400_000,
        }
        persistSession(mockSession)
        user.value = {
          ...MOCK_USER,
          id: mockId,
          username: sanitizeText(username),
          displayName: sanitizeText(username),
          role: mockSession.role,
        }
        localStorage.setItem(`cs_user_${mockId}`, JSON.stringify(user.value))
        return true
      }

      // ESTRATEGIA 1: Buscar en public.users por username → obtener email via RPC
      const { data: profile } = await supabase!
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle()

      let emailToUse: string | null = null

      if (profile?.id) {
        const { data: emailData } = await supabase!
          .rpc('get_email_by_user_id', { p_user_id: profile.id })
        emailToUse = emailData as string | null
      }

      // Si tenemos email real de la BD, usarlo directamente
      if (emailToUse) {
        const { data, error: err } = await supabase!.auth.signInWithPassword({
          email: emailToUse,
          password,
        })
        if (!err && data.session) {
          await _loadSessionFromSupabase(
            data.session.user.id,
            data.session.user.email ?? '',
            data.session.access_token,
            data.session.expires_at ?? 0,
          )
          return true
        }
      }

      // ESTRATEGIA 2: Probar los dos formatos de email interno posibles
      const cleanUsername = sanitizeText(username.toLowerCase().trim())
      const emailVariants = [
        `${cleanUsername}@users.vylora.app`,
        `${cleanUsername}@vylora.app`,
        `${cleanUsername}@vylora.local`,
      ]

      for (const email of emailVariants) {
        const { data, error: err } = await supabase!.auth.signInWithPassword({
          email,
          password,
        })
        if (!err && data.session) {
          await _loadSessionFromSupabase(
            data.session.user.id,
            data.session.user.email ?? '',
            data.session.access_token,
            data.session.expires_at ?? 0,
          )
          return true
        }
      }

      // Todas las estrategias fallaron
      setError('Usuario o contraseña incorrectos.')
      return false
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.'
      setError(_mapAuthError(msg))
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Inicio de sesión con email y contraseña (mantenido internamente).
   */
  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    clearError()

    try {
      if (isMockMode) {
        const mockId = `mock_${btoa(email).slice(0, 8)}`
        const mockSession: AuthSession = {
          userId: mockId,
          email: sanitizeText(email),
          role: email.includes('admin') ? 'admin' : 'user',
          accessToken: 'mock_token',
          expiresAt: Date.now() + 86_400_000,
        }
        persistSession(mockSession)
        user.value = {
          ...MOCK_USER,
          id: mockId,
          displayName: email.split('@')[0],
          role: mockSession.role,
        }
        localStorage.setItem(`cs_user_${mockId}`, JSON.stringify(user.value))
        return true
      }

      const { data, error: err } = await supabase!.auth.signInWithPassword({ email, password })
      if (err) throw err
      if (!data.session) throw new Error('No se recibió sesión.')

      await _loadSessionFromSupabase(
        data.session.user.id,
        data.session.user.email ?? '',
        data.session.access_token,
        data.session.expires_at ?? 0,
      )
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.'
      setError(_mapAuthError(msg))
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Registro sin email público.
   * Genera un email interno basado en el username para Supabase Auth.
   */
  async function register(
    _email: string,
    password: string,
    username: string,
    displayName: string,
  ): Promise<boolean> {
    loading.value = true
    clearError()

    try {
      // Generar email interno — no se muestra al usuario nunca
      const internalEmail = isMockMode
        ? `${sanitizeText(username)}@vylora.local`
        : `${sanitizeText(username)}@users.vylora.app`

      if (isMockMode) {
        const mockId = `mock_${username}`
        const mockSession: AuthSession = {
          userId: mockId,
          email: internalEmail,
          role: 'user',
          accessToken: 'mock_token',
          expiresAt: Date.now() + 86_400_000,
        }
        persistSession(mockSession)
        user.value = {
          ...MOCK_USER,
          id: mockId,
          username: sanitizeText(username),
          displayName: sanitizeText(displayName),
        }
        localStorage.setItem(`cs_user_${mockId}`, JSON.stringify(user.value))
        return true
      }

      const { data, error: err } = await supabase!.auth.signUp({
        email: internalEmail,
        password,
        options: {
          data: {
            display_name: sanitizeText(displayName),
            username: sanitizeText(username),
          },
        },
      })
      if (err) throw err
      if (!data.session) return true // email confirmation pendiente (no aplica aquí)

      await _loadSessionFromSupabase(
        data.session.user.id,
        data.session.user.email ?? '',
        data.session.access_token,
        data.session.expires_at ?? 0,
      )
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse.'
      setError(_mapAuthError(msg))
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Envía email de recuperación de contraseña.
   */
  async function recoverPassword(email: string): Promise<boolean> {
    loading.value = true
    clearError()

    try {
      if (isMockMode) {
        console.log(`[mock] Recovery email sent to: ${email}`)
        return true
      }

      const { error: err } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (err) throw err
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar email de recuperación.'
      setError(msg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Cierre de sesión.
   */
  async function logout(): Promise<void> {
    loading.value = true
    try {
      if (!isMockMode && supabase) {
        await supabase.auth.signOut()
      }
    } finally {
      clearSession()
      loading.value = false
    }
  }

  /**
   * Continúa como invitado (sin cuenta).
   */
  function continueAsGuest(): void {
    clearSession()
  }

  /**
   * Actualiza datos del usuario en el store (sin llamada a BD).
   * La llamada a BD la hace el ProfileStore.
   */
  function updateUserLocally(updates: Partial<User>): void {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      if (isMockMode && user.value.id) {
        localStorage.setItem(`cs_user_${user.value.id}`, JSON.stringify(user.value))
      }
    }
  }

  // ---- Helpers privados ----

  async function _loadSessionFromSupabase(
    userId: string,
    email: string,
    accessToken: string,
    expiresAt: number,
  ): Promise<void> {
    // Obtener perfil del usuario
    const { data: profile, error: profileErr } = await supabase!
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileErr) throw profileErr

    const role: UserRole = profile.role as UserRole

    persistSession({ userId, email, role, accessToken, expiresAt })
    user.value = _mapDbUserToUser(profile)
  }

  function _mapDbUserToUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      username: row.username as string,
      displayName: row.display_name as string,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      bio: (row.bio as string | null) ?? null,
      city: (row.city as string | null) ?? null,
      country: (row.country as string | null) ?? null,
      role: row.role as UserRole,
      isBanned: row.is_banned as boolean,
      isVerified: row.is_verified as boolean,
      createdAt: row.created_at as string,
      lastSeenAt: (row.last_seen_at as string | null) ?? null,
    }
  }

  function _mapAuthError(msg: string): string {
    if (msg.includes('Invalid login credentials'))   return 'Usuario o contraseña incorrectos.'
    if (msg.includes('Email not confirmed'))         return 'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
    if (msg.includes('User already registered'))     return 'Este nombre de usuario ya está registrado.'
    if (msg.includes('Password should be at least')) return 'La contraseña es demasiado corta.'
    if (msg.includes('username no coincide'))        return 'El nombre de usuario no coincide.'
    if (msg.includes('No autenticado'))              return 'No estás autenticado.'
    return msg
  }

  return {
    // State
    session,
    user,
    loading,
    error,
    initialized,
    // Computed
    isAuthenticated,
    isGuest,
    userId,
    userRole,
    isAdmin,
    isModerator,
    needsOnboarding,
    // Actions
    initialize,
    login,
    loginWithUsername,
    register,
    recoverPassword,
    logout,
    continueAsGuest,
    updateUserLocally,
    clearError,
  }
})
