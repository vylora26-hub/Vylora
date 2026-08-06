<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useNotificationsStore } from '@/stores/notifications'
import { useDmStore } from '@/stores/dm'
import ToastContainer from '@/components/common/ToastContainer.vue'
import type { NavItem } from '@/types'

const route  = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const notifStore = useNotificationsStore()
const dmStore    = useDmStore()

onMounted(() => {
  notifStore.fetchNotifications()
  notifStore.subscribe()
  if (authStore.isAuthenticated) {
    dmStore.fetchConversations()
  }
})

onUnmounted(() => {
  notifStore.unsubscribe()
})

async function logout() {
  await authStore.logout()
  router.push('/')
}

const navItems: NavItem[] = [
  { label: 'Inicio',         path: '/app/home',          icon: 'home'            },
  { label: 'Salas',          path: '/app/rooms',         icon: 'chat'            },
  { label: 'Mensajes',       path: '/app/dm',            icon: 'envelope'        },
  { label: 'Amigos',         path: '/app/friends',       icon: 'users'           },
  { label: 'Notificaciones', path: '/app/notifications', icon: 'bell'            },
  { label: 'Mi perfil',      path: '/app/profile',       icon: 'user'            },
  { label: 'Seguridad',      path: '/app/security',      icon: 'shield'          },
  { label: 'Ajustes',        path: '/app/settings',      icon: 'cog'             },
]

const adminNavItems: NavItem[] = [
  { label: 'Admin', path: '/admin/dashboard', icon: 'shield' },
]

const isActive = (path: string) => route.path.startsWith(path)

const unreadNotifications = computed(() => notifStore.unreadCount)
const unreadDms = computed(() =>
  dmStore.conversations.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)
)

function getNavIcon(icon: string): string {
  const icons: Record<string, string> = {
    home:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    chat:     'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    envelope: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    users:    'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    cog:      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  }
  return icons[icon] ?? icons['home']
}
</script>

<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': !uiStore.sidebarOpen }">

    <!-- ======== SIDEBAR (desktop) ======== -->
    <aside class="sidebar" role="navigation" aria-label="Navegación principal">
      <!-- Logo / Marca -->
      <div class="sidebar__brand">
        <RouterLink to="/app/home" class="sidebar__logo-link" aria-label="Vylora — Inicio">
          <img
            src="/LOGO-Vylora.png"
            alt="Vylora"
            class="sidebar__logo-img"
            draggable="false"
          />
          <span v-show="uiStore.sidebarOpen" class="sidebar__brand-name">Vylora</span>
        </RouterLink>

        <!-- Toggle sidebar -->
        <button
          class="sidebar__toggle"
          :aria-label="uiStore.sidebarOpen ? 'Colapsar sidebar' : 'Expandir sidebar'"
          @click="uiStore.toggleSidebar()"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path v-if="uiStore.sidebarOpen" stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Nav items -->
      <nav class="sidebar__nav">
        <ul role="list" class="sidebar__nav-list">
          <li v-for="item in navItems" :key="item.path">
            <RouterLink
              :to="item.path"
              class="sidebar__nav-item"
              :class="{ 'is-active': isActive(item.path) }"
              :aria-current="isActive(item.path) ? 'page' : undefined"
            >
              <span class="sidebar__nav-icon" aria-hidden="true">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="getNavIcon(item.icon)" />
                </svg>
              </span>
              <span v-show="uiStore.sidebarOpen" class="sidebar__nav-label">{{ item.label }}</span>
              <!-- Badge de notificaciones -->
              <span
                v-if="item.icon === 'bell' && unreadNotifications > 0"
                class="sidebar__badge"
                :aria-label="`${unreadNotifications} notificaciones sin leer`"
              >
                {{ unreadNotifications > 99 ? '99+' : unreadNotifications }}
              </span>
              <!-- Badge de DMs no leídos -->
              <span
                v-if="item.icon === 'envelope' && unreadDms > 0"
                class="sidebar__badge"
                :aria-label="`${unreadDms} mensajes sin leer`"
              >
                {{ unreadDms > 99 ? '99+' : unreadDms }}
              </span>
            </RouterLink>
          </li>
        </ul>

        <!-- Admin link si aplica -->
        <ul v-if="authStore.isAdmin" role="list" class="sidebar__nav-list sidebar__nav-list--admin">
          <li v-for="item in adminNavItems" :key="item.path">
            <RouterLink
              :to="item.path"
              class="sidebar__nav-item sidebar__nav-item--admin"
              :class="{ 'is-active': isActive(item.path) }"
            >
              <span class="sidebar__nav-icon" aria-hidden="true">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="getNavIcon(item.icon)" />
                </svg>
              </span>
              <span v-show="uiStore.sidebarOpen" class="sidebar__nav-label">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Usuario en el fondo del sidebar -->
      <div class="sidebar__user">
        <!-- Fila superior: avatar + nombre + tema -->
        <div class="sidebar__user-top">
          <RouterLink to="/app/profile" class="sidebar__user-link" :aria-label="`Perfil de ${authStore.user?.displayName}`">
            <div class="sidebar__user-avatar" aria-hidden="true">
              <img
                v-if="authStore.user?.avatarUrl"
                :src="authStore.user.avatarUrl"
                :alt="authStore.user.displayName"
                class="sidebar__user-avatar-img"
              />
              <span v-else class="sidebar__user-avatar-fallback">
                {{ authStore.user?.displayName?.charAt(0)?.toUpperCase() ?? '?' }}
              </span>
              <span class="sidebar__user-online" aria-label="En línea" />
            </div>
            <div v-show="uiStore.sidebarOpen" class="sidebar__user-info">
              <span class="sidebar__user-name">{{ authStore.user?.displayName }}</span>
              <span class="sidebar__user-handle">@{{ authStore.user?.username }}</span>
            </div>
          </RouterLink>

          <!-- Cambio de tema -->
          <button
            v-show="uiStore.sidebarOpen"
            class="sidebar__theme-btn"
            :aria-label="`Cambiar a modo ${uiStore.isDark ? 'claro' : 'oscuro'}`"
            @click="uiStore.setTheme(uiStore.isDark ? 'light' : 'dark')"
          >
            <svg v-if="uiStore.isDark" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>

        <!-- Fila inferior: cerrar sesión (siempre visible) -->
        <div v-show="uiStore.sidebarOpen" class="sidebar__user-actions">
          <button
            class="sidebar__logout-btn"
            aria-label="Cerrar sesión"
            @click="logout"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>

    <!-- ======== CONTENIDO PRINCIPAL ======== -->
    <div class="main-layout__content">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="currentRoute.path" />
        </Transition>
      </RouterView>
    </div>

    <!-- ======== NAV MÓVIL (dock) ======== -->
    <nav class="mobile-nav" role="navigation" aria-label="Navegación móvil">
      <ul role="list" class="mobile-nav__list">
        <li v-for="item in navItems.slice(0, 5)" :key="item.path" class="mobile-nav__item">
          <RouterLink
            :to="item.path"
            class="mobile-nav__link"
            :class="{ 'is-active': isActive(item.path) }"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            :aria-label="item.label"
          >
            <span class="mobile-nav__icon" aria-hidden="true">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" :d="getNavIcon(item.icon)" />
              </svg>
            </span>
            <span
              v-if="item.icon === 'bell' && unreadNotifications > 0"
              class="mobile-nav__badge"
              :aria-label="`${unreadNotifications} notificaciones`"
            >
              {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
            </span>
            <span
              v-if="item.icon === 'envelope' && unreadDms > 0"
              class="mobile-nav__badge"
              :aria-label="`${unreadDms} mensajes`"
            >
              {{ unreadDms > 9 ? '9+' : unreadDms }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- ======== TOAST CONTAINER ======== -->
    <ToastContainer />
  </div>
</template>

<style scoped>
/* ---- Layout base ---- */
.main-layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  background: var(--cs-bg);
}

/* ---- Sidebar ---- */
.sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  height: 100dvh;
  background: var(--cs-surface);
  border-right: 1px solid var(--cs-border);
  transition: width 0.25s ease, min-width 0.25s ease;
  overflow: hidden;
  z-index: 20;
}

.main-layout.sidebar-collapsed .sidebar {
  width: 64px;
  min-width: 64px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.125rem 1rem;
  gap: 0.5rem;
  border-bottom: 1px solid var(--cs-border);
}

.sidebar__logo-link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar__brand-name {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--cs-text);
  letter-spacing: -0.02em;
}

.sidebar__logo-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 6px rgba(139,92,246,0.35));
}

.sidebar__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.sidebar__toggle:hover {
  background: var(--cs-surface-hover);
  color: var(--cs-text);
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar__nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.sidebar__nav-list--admin {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--cs-border);
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5625rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--cs-text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  transition: background 0.15s, color 0.15s;
}

.sidebar__nav-item:hover {
  background: var(--cs-surface-hover);
  color: var(--cs-text);
}

.sidebar__nav-item.is-active {
  background: var(--cs-primary-subtle);
  color: var(--cs-primary);
}

.sidebar__nav-item--admin.is-active {
  background: rgba(239,68,68,0.08);
  color: #ef4444;
}

.sidebar__nav-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.sidebar__nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--cs-primary);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
}

/* ---- User footer ---- */
.sidebar__user {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border-top: 1px solid var(--cs-border);
  gap: 0.5rem;
}

.sidebar__user-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sidebar__user-link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.sidebar__user-avatar {
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--cs-primary-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__user-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.sidebar__user-avatar-fallback {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--cs-primary);
}

.sidebar__user-online {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--cs-surface);
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.sidebar__user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cs-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-handle {
  font-size: 0.75rem;
  color: var(--cs-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__theme-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.sidebar__theme-btn:hover {
  background: var(--cs-surface-hover);
  color: var(--cs-text);
}

/* Acciones del footer */
.sidebar__user-actions {
  display: flex;
  gap: 0.375rem;
}

.sidebar__logout-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.75rem;
  border-radius: 0.5rem;
  background: transparent;
  border: 1px solid var(--cs-border);
  color: var(--cs-text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.sidebar__logout-btn:hover {
  background: rgba(239,68,68,0.08);
  color: #ef4444;
  border-color: rgba(239,68,68,0.3);
}

/* ---- Contenido ---- */
.main-layout__content {
  flex: 1;
  min-width: 0;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ---- Transición de página ---- */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ---- Mobile nav ---- */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--cs-surface);
  border-top: 1px solid var(--cs-border);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-nav__list {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-nav__item {
  flex: 1;
}

.mobile-nav__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 0.25rem;
  text-decoration: none;
  color: var(--cs-text-muted);
  position: relative;
  transition: color 0.15s;
}

.mobile-nav__link.is-active {
  color: var(--cs-primary);
}

.mobile-nav__icon {
  display: flex;
}

.mobile-nav__badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 20px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background: var(--cs-primary);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
}

/* ---- Responsive: ocultar sidebar, mostrar mobile nav ---- */
@media (max-width: 767px) {
  .sidebar {
    display: none;
  }

  .mobile-nav {
    display: block;
  }

  .main-layout__content {
    padding-bottom: 64px;
  }
}
</style>
