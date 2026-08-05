// ============================================================
// MESSAGE CONSTANTS
// ============================================================

export const MESSAGE_LIMITS = {
  CONTENT_MAX: 2000,
  CONTENT_MIN: 1,
  EDIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos para editar
} as const

export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'text/plain'],
  // GIFs animados permitidos
  GIF: ['image/gif'],
} as const

export const FILE_SIZE_LIMITS = {
  IMAGE_MB: 5,
  FILE_MB: 10,
  IMAGE_BYTES: 5 * 1024 * 1024,
  FILE_BYTES: 10 * 1024 * 1024,
} as const

export const MESSAGES_PER_PAGE = 50

/** Emojis de reacción permitidos */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉'] as const

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]
