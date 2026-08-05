// ============================================================
// SECURITY CONFIG — Rate limits y reglas de seguridad
// Estos valores se aplican en el cliente como primera capa.
// La validación real ocurre en Supabase Edge Functions y RLS.
// ============================================================

export const RATE_LIMITS = {
  /** Mensajes por ventana de tiempo */
  MESSAGES_PER_WINDOW: 10,
  MESSAGE_WINDOW_MS: 5000, // 5 segundos → max 10 mensajes cada 5s

  /** Intentos de login */
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutos

  /** Solicitudes de amistad */
  FRIEND_REQUESTS_PER_HOUR: 20,

  /** Creación de salas */
  ROOMS_PER_DAY: 5,
} as const

export const CONTENT_RULES = {
  /** Mensajes idénticos consecutivos bloqueados */
  BLOCK_DUPLICATE_MESSAGES: true,

  /** Tiempo mínimo entre mensajes idénticos (ms) */
  DUPLICATE_WINDOW_MS: 30 * 1000,

  /** Longitud máxima de mensaje */
  MAX_MESSAGE_LENGTH: 2000,

  /** Patrones de spam básicos (regex strings) */
  SPAM_PATTERNS: [
    /(.)\1{9,}/, // 10+ caracteres repetidos
    /(https?:\/\/[^\s]+\s*){4,}/, // 4+ URLs en un mensaje
  ],
} as const

/** Tipos MIME realmente permitidos para upload */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]
