// ============================================================
// MAIN — Punto de entrada de la aplicación
// ============================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { registerErrorHandler } from './middlewares/errorHandler'

// Estilos globales (Tailwind + variables CSS + animaciones)
import './styles/index.css'

// ---- Crear la app ----
const app = createApp(App)

// ---- Plugins ----
app.use(createPinia())
app.use(router)

// ---- Manejo global de errores ----
registerErrorHandler(app)

// ---- Montar ----
app.mount('#app')
