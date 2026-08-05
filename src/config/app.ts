// ============================================================
// APP CONFIG — Valores globales de la aplicación
// ============================================================

export const APP_CONFIG = {
  NAME: 'Vylora',
  VERSION: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
  DESCRIPTION: 'Plataforma de chat moderna, rápida y segura.',

  // Paginación
  MESSAGES_PER_PAGE: 50,
  ROOMS_PER_PAGE: 20,
  NOTIFICATIONS_PER_PAGE: 30,
  USERS_PER_PAGE: 25,

  // Onboarding
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 50,
  BIO_MAX: 300,
  PASSWORD_MIN: 8,

  // UI
  TOAST_DURATION_MS: 4000,
  TYPING_TIMEOUT_MS: 3000,
  DEBOUNCE_SEARCH_MS: 300,
  VIRTUAL_SCROLL_ITEM_HEIGHT: 72,

  // Sesión
  SESSION_STORAGE_KEY: 'cs_session',
  THEME_STORAGE_KEY: 'cs_theme',
} as const
