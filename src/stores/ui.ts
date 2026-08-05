// ============================================================
// UI STORE — Tema, toasts, sidebar, modales globales
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { APP_CONFIG } from '@/config'
import type { Theme, Toast, ToastType } from '@/types'

export const useUiStore = defineStore('ui', () => {
  // ---- Estado ----
  const theme = ref<Theme>(
    (localStorage.getItem(APP_CONFIG.THEME_STORAGE_KEY) as Theme) ?? 'system',
  )
  const sidebarOpen = ref(true)
  const toasts = ref<Toast[]>([])

  // ---- Computed ----

  /** Tema efectivo resuelto (nunca 'system' — siempre 'light' o 'dark') */
  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme.value
  })

  const isDark = computed(() => resolvedTheme.value === 'dark')

  // ---- Acciones ----

  function setTheme(newTheme: Theme): void {
    theme.value = newTheme
    localStorage.setItem(APP_CONFIG.THEME_STORAGE_KEY, newTheme)
    applyTheme()
  }

  function applyTheme(): void {
    const html = document.documentElement
    if (resolvedTheme.value === 'dark') {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
    }
  }

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value
  }

  /**
   * Muestra una notificación toast.
   * Se elimina automáticamente después de `duration` ms.
   */
  function showToast(
    type: ToastType,
    title: string,
    message?: string,
    duration = APP_CONFIG.TOAST_DURATION_MS,
  ): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    toasts.value.push({ id, type, title, message, duration })

    setTimeout(() => dismissToast(id), duration)

    return id
  }

  function dismissToast(id: string): void {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  // Atajos de toast tipados
  const toast = {
    success: (title: string, message?: string) => showToast('success', title, message),
    error: (title: string, message?: string) => showToast('error', title, message),
    warning: (title: string, message?: string) => showToast('warning', title, message),
    info: (title: string, message?: string) => showToast('info', title, message),
  }

  return {
    // State
    theme,
    sidebarOpen,
    toasts,
    // Computed
    resolvedTheme,
    isDark,
    // Actions
    setTheme,
    applyTheme,
    toggleSidebar,
    showToast,
    dismissToast,
    toast,
  }
})
