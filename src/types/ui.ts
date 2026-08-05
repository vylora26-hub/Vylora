// ============================================================
// UI / COMPONENT TYPES
// ============================================================

export type Theme = 'light' | 'dark' | 'system'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export type InputSize = 'sm' | 'md' | 'lg'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'

export interface ModalConfig {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

/** Estado de carga para operaciones async */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/** Elemento de navegación lateral */
export interface NavItem {
  label: string
  path: string
  icon: string
  badge?: number
  requiresAuth?: boolean
  roles?: string[]
}
