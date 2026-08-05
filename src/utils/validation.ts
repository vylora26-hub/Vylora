// ============================================================
// VALIDATION — Validadores reutilizables
// Usados tanto en formularios (frontend) como referencia
// para las constraints de la BD (backend).
// ============================================================

import { APP_CONFIG } from '@/config'

export interface ValidationResult {
  valid: boolean
  error?: string
}

const ok = (): ValidationResult => ({ valid: true })
const fail = (error: string): ValidationResult => ({ valid: false, error })

// ---- Auth ----

export function validateEmail(email: string): ValidationResult {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.trim()) return fail('El email es obligatorio.')
  if (!re.test(email)) return fail('Formato de email inválido.')
  return ok()
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return fail('La contraseña es obligatoria.')
  if (password.length < APP_CONFIG.PASSWORD_MIN)
    return fail(`La contraseña debe tener al menos ${APP_CONFIG.PASSWORD_MIN} caracteres.`)
  return ok()
}

// ---- Usuario ----

export function validateUsername(username: string): ValidationResult {
  if (!username.trim()) return fail('El nombre de usuario es obligatorio.')
  if (username.length < APP_CONFIG.USERNAME_MIN)
    return fail(`Mínimo ${APP_CONFIG.USERNAME_MIN} caracteres.`)
  if (username.length > APP_CONFIG.USERNAME_MAX)
    return fail(`Máximo ${APP_CONFIG.USERNAME_MAX} caracteres.`)
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return fail('Solo letras, números y guion bajo (_).')
  return ok()
}

export function validateDisplayName(name: string): ValidationResult {
  if (!name.trim()) return fail('El nombre visible es obligatorio.')
  if (name.length < APP_CONFIG.DISPLAY_NAME_MIN)
    return fail(`Mínimo ${APP_CONFIG.DISPLAY_NAME_MIN} caracteres.`)
  if (name.length > APP_CONFIG.DISPLAY_NAME_MAX)
    return fail(`Máximo ${APP_CONFIG.DISPLAY_NAME_MAX} caracteres.`)
  return ok()
}

export function validateBio(bio: string): ValidationResult {
  if (bio.length > APP_CONFIG.BIO_MAX)
    return fail(`Máximo ${APP_CONFIG.BIO_MAX} caracteres.`)
  return ok()
}

// ---- Chat ----

export function validateMessageContent(content: string): ValidationResult {
  if (!content.trim()) return fail('El mensaje no puede estar vacío.')
  if (content.length > 2000) return fail('Máximo 2000 caracteres.')
  return ok()
}

// ---- Salas ----

export function validateRoomName(name: string): ValidationResult {
  if (!name.trim()) return fail('El nombre de la sala es obligatorio.')
  if (name.length < 3) return fail('Mínimo 3 caracteres.')
  if (name.length > 50) return fail('Máximo 50 caracteres.')
  return ok()
}

export function validateRoomPassword(password: string): ValidationResult {
  if (password.length < 4) return fail('Mínimo 4 caracteres.')
  if (password.length > 32) return fail('Máximo 32 caracteres.')
  return ok()
}

// ---- Archivos ----

export function validateFile(
  file: File,
  allowedTypes: readonly string[],
  maxBytes: number,
): ValidationResult {
  if (!allowedTypes.includes(file.type))
    return fail(`Tipo de archivo no permitido: ${file.type}`)
  if (file.size > maxBytes)
    return fail(`El archivo supera el tamaño máximo (${Math.round(maxBytes / 1024 / 1024)} MB).`)
  return ok()
}
