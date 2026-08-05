// ============================================================
// ERROR HANDLER — Interceptor global de errores no capturados
// Se registra en main.ts vía app.config.errorHandler
// ============================================================

import type { App } from 'vue'

export function registerErrorHandler(app: App): void {
  // Errores de componentes Vue
  app.config.errorHandler = (err, instance, info) => {
    console.error('[Vue Error]', { err, component: instance?.$options?.name, info })
    // En producción se enviaría a un servicio de logging (Sentry, etc.)
  }

  // Errores de promesas no capturadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason)
    event.preventDefault()
  })

  // Errores globales de JS
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.message, event.filename, event.lineno)
  })
}
