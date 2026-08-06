// ============================================================
// ROUTER — Todas las rutas con lazy loading y guards
// ============================================================

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard } from '@/guards/authGuard'
import { guestGuard } from '@/guards/guestGuard'
import { roleGuard } from '@/guards/roleGuard'
import { useAuthStore } from '@/stores/auth'
import { supabase, isMockMode } from '@/services/supabase'

// ============================================================
// RUTAS
// ============================================================

const routes: RouteRecordRaw[] = [
  // ---- Welcome / Landing ----
  {
    path: '/',
    name: 'Welcome',
    component: () => import('@/pages/Welcome.vue'),
    meta: { title: 'Bienvenido — Vylora' },
  },

  // ---- Páginas legales (públicas, sin auth) ----
  {
    path: '/privacy',
    name: 'PrivacyPolicy',
    component: () => import('@/pages/legal/PrivacyPolicy.vue'),
    meta: { title: 'Política de Privacidad — Vylora' },
  },
  {
    path: '/terms',
    name: 'TermsOfService',
    component: () => import('@/pages/legal/TermsOfService.vue'),
    meta: { title: 'Términos y Condiciones — Vylora' },
  },
  {
    path: '/cookies',
    name: 'CookiePolicy',
    component: () => import('@/pages/legal/CookiePolicy.vue'),
    meta: { title: 'Política de Cookies — Vylora' },
  },

  // ---- Auth (solo para no autenticados) ----
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    beforeEnter: guestGuard,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/pages/auth/Login.vue'),
        meta: { title: 'Iniciar sesión — Vylora' },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/pages/auth/Register.vue'),
        meta: { title: 'Crear cuenta — Vylora' },
      },
      {
        path: 'recover',
        name: 'RecoverPassword',
        component: () => import('@/pages/auth/RecoverPassword.vue'),
        meta: { title: 'Recuperar contraseña — Vylora' },
      },
    ],
  },

  // ---- App principal (requiere auth) ----
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    beforeEnter: authGuard,
    children: [
      {
        path: '',
        redirect: { name: 'Home' },
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/pages/Home.vue'),
        meta: { title: 'Inicio — Vylora', allowGuest: true },
      },
      {
        path: 'rooms',
        name: 'Rooms',
        component: () => import('@/pages/Rooms.vue'),
        meta: { title: 'Salas — Vylora', allowGuest: true },
      },
      {
        path: 'room/:slug',
        name: 'Room',
        component: () => import('@/pages/Room.vue'),
        meta: { title: 'Sala — Vylora', allowGuest: true },
        props: true,
      },
      {
        path: 'dm',
        name: 'DirectMessages',
        component: () => import('@/pages/DirectMessages.vue'),
        meta: { title: 'Mensajes — Vylora' },
      },
      {
        path: 'dm/:id',
        name: 'DirectMessage',
        component: () => import('@/pages/DirectMessage.vue'),
        meta: { title: 'Chat — Vylora' },
        props: true,
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('@/pages/Friends.vue'),
        meta: { title: 'Amigos — Vylora' },
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/pages/Notifications.vue'),
        meta: { title: 'Notificaciones — Vylora' },
      },
      {
        path: 'profile',
        name: 'MyProfile',
        component: () => import('@/pages/Profile.vue'),
        meta: { title: 'Mi perfil — Vylora' },
      },
      {
        path: 'user/:username',
        name: 'UserProfile',
        component: () => import('@/pages/UserProfile.vue'),
        meta: { title: 'Perfil — Vylora' },
        props: true,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/pages/Settings.vue'),
        meta: { title: 'Configuración — Vylora' },
      },
      {
        path: 'security',
        name: 'Security',
        component: () => import('@/pages/Security.vue'),
        meta: { title: 'Seguridad — Vylora' },
      },
    ],
  },

  // ---- Admin (requiere rol admin) ----
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    beforeEnter: roleGuard('admin'),
    children: [
      {
        path: '',
        redirect: { name: 'AdminDashboard' },
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/pages/admin/Dashboard.vue'),
        meta: { title: 'Dashboard — Admin' },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/pages/admin/Users.vue'),
        meta: { title: 'Usuarios — Admin' },
      },
      {
        path: 'rooms',
        name: 'AdminRooms',
        component: () => import('@/pages/admin/Rooms.vue'),
        meta: { title: 'Salas — Admin' },
      },
      {
        path: 'reports',
        name: 'AdminReports',
        component: () => import('@/pages/admin/Reports.vue'),
        meta: { title: 'Reportes — Admin' },
      },
      {
        path: 'bans',
        name: 'AdminBans',
        component: () => import('@/pages/admin/Bans.vue'),
        meta: { title: 'Baneos — Admin' },
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('@/pages/admin/Logs.vue'),
        meta: { title: 'Logs — Admin' },
      },
      {
        path: 'stats',
        name: 'AdminStats',
        component: () => import('@/pages/admin/Stats.vue'),
        meta: { title: 'Estadísticas — Admin' },
      },
    ],
  },

  // ---- 404 ----
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
    meta: { title: 'Página no encontrada — Vylora' },
  },
]

// ============================================================
// INSTANCIA DEL ROUTER
// ============================================================

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

// ============================================================
// GLOBAL NAVIGATION GUARD
// Actualiza el título de la pestaña y last_seen
// ============================================================

router.afterEach((to) => {
  // Actualizar <title>
  const title = to.meta.title as string | undefined
  document.title = title ?? 'Vylora'

  // Actualizar last_seen en Supabase (no en mock)
  if (!isMockMode && supabase) {
    const authStore = useAuthStore()
    if (authStore.userId) {
      supabase.rpc('update_last_seen', { p_user_id: authStore.userId }).then(() => {
        // Fire-and-forget — no bloquea la navegación
      })
    }
  }
})

export default router
