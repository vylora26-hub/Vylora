// ============================================================
// IAUTHSERVICE — Contrato del servicio de autenticación
// ============================================================

import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  RecoverPasswordPayload,
  ResetPasswordPayload,
} from '@/types'

export interface IAuthService {
  /** Inicializa la sesión desde almacenamiento local / cookie */
  initialize(): Promise<AuthSession | null>

  /** Login con email y contraseña */
  login(credentials: LoginCredentials): Promise<AuthSession>

  /** Registro de nuevo usuario */
  register(credentials: RegisterCredentials): Promise<AuthSession>

  /** Cierre de sesión */
  logout(): Promise<void>

  /** Envía email de recuperación de contraseña */
  recoverPassword(payload: RecoverPasswordPayload): Promise<void>

  /** Restablece la contraseña con token */
  resetPassword(payload: ResetPasswordPayload): Promise<void>

  /** Devuelve la sesión activa o null */
  getSession(): Promise<AuthSession | null>

  /** Refresca el token de acceso */
  refreshSession(): Promise<AuthSession | null>
}
