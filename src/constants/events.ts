// ============================================================
// REALTIME EVENT NAMES
// Centralizado para evitar magic strings dispersos en el código
// ============================================================

export const REALTIME_EVENTS = {
  // Mensajes de sala
  MESSAGE_INSERT: 'message:insert',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',

  // Mensajes directos
  DM_INSERT: 'dm:insert',
  DM_UPDATE: 'dm:update',

  // Reacciones
  REACTION_INSERT: 'reaction:insert',
  REACTION_DELETE: 'reaction:delete',

  // Presencia
  PRESENCE_SYNC: 'presence:sync',
  PRESENCE_JOIN: 'presence:join',
  PRESENCE_LEAVE: 'presence:leave',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Notificaciones
  NOTIFICATION_INSERT: 'notification:insert',
} as const

export const REALTIME_CHANNELS = {
  room: (roomId: string) => `room:${roomId}`,
  dm: (conversationId: string) => `dm:${conversationId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  presence: (roomId: string) => `presence:${roomId}`,
} as const
