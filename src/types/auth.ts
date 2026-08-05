// ============================================================
// AUTH TYPES
// ============================================================

export type UserRole = 'guest' | 'user' | 'moderator' | 'admin'

export type AuthProvider = 'email' | 'google' | 'github'

export interface AuthUser {
  id: string
  email: string
  createdAt: string
  role: UserRole
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  username: string
  displayName: string
}

export interface RecoverPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

export interface AuthSession {
  userId: string
  email: string
  role: UserRole
  accessToken: string
  expiresAt: number
}

export interface AuthState {
  session: AuthSession | null
  loading: boolean
  error: string | null
  initialized: boolean
}
