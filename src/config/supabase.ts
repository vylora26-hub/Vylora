// ============================================================
// SUPABASE CONFIG
// ============================================================

export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL as string,
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,

  // Nombres de tablas (evita magic strings)
  TABLES: {
    USERS: 'users',
    SESSIONS: 'sessions',
    ROOM_CATEGORIES: 'room_categories',
    ROOMS: 'rooms',
    ROOM_MEMBERS: 'room_members',
    MESSAGES: 'messages',
    ATTACHMENTS: 'attachments',
    REACTIONS: 'reactions',
    DIRECT_CONVERSATIONS: 'direct_conversations',
    DIRECT_MESSAGES: 'direct_messages',
    FRIENDSHIPS: 'friendships',
    BLOCKS: 'blocks',
    NOTIFICATIONS: 'notifications',
    REPORTS: 'reports',
    BANS: 'bans',
    AUDIT_LOGS: 'audit_logs',
    RATE_LIMITS: 'rate_limits',
    USER_SETTINGS: 'user_settings',
    PRESENCE: 'presence',
  },

  // Buckets de Storage
  STORAGE: {
    AVATARS: 'avatars',
    ATTACHMENTS: 'attachments',
    ROOM_COVERS: 'room-covers',
  },
} as const
