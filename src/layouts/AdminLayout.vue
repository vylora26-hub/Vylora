<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import ToastContainer from '@/components/common/ToastContainer.vue'

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()

const adminNav = [
  { label: 'Dashboard',    path: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Usuarios',     path: '/admin/users',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Salas',        path: '/admin/rooms',     icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { label: 'Reportes',     path: '/admin/reports',   icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { label: 'Baneos',       path: '/admin/bans',      icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { label: 'Logs',         path: '/admin/logs',      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Estadísticas', path: '/admin/stats',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const isActive = (path: string) => route.path.startsWith(path)
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar admin -->
    <aside class="admin-sidebar" role="navigation" aria-label="Navegación de administración">
      <!-- Header -->
      <div class="admin-sidebar__header">
        <RouterLink to="/admin/dashboard" class="admin-sidebar__brand">
          <span class="admin-sidebar__badge" aria-hidden="true">A</span>
          <span class="admin-sidebar__title">Panel Admin</span>
        </RouterLink>
      </div>

      <!-- Nav -->
      <nav class="admin-sidebar__nav">
        <ul role="list" class="admin-sidebar__list">
          <li v-for="item in adminNav" :key="item.path">
            <RouterLink
              :to="item.path"
              class="admin-sidebar__item"
              :class="{ 'is-active': isActive(item.path) }"
              :aria-current="isActive(item.path) ? 'page' : undefined"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
              </svg>
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Footer -->
      <div class="admin-sidebar__footer">
        <RouterLink to="/app/home" class="admin-sidebar__back">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a la app
        </RouterLink>
        <span class="admin-sidebar__user">{{ authStore.user?.displayName }}</span>
      </div>
    </aside>

    <!-- Contenido -->
    <main class="admin-layout__main" role="main">
      <!-- Topbar -->
      <header class="admin-topbar">
        <div class="admin-topbar__left">
          <h1 class="admin-topbar__title">
            {{ adminNav.find(n => isActive(n.path))?.label ?? 'Admin' }}
          </h1>
        </div>
        <div class="admin-topbar__right">
          <button
            class="admin-topbar__theme"
            :aria-label="`Cambiar a modo ${uiStore.isDark ? 'claro' : 'oscuro'}`"
            @click="uiStore.setTheme(uiStore.isDark ? 'light' : 'dark')"
          >
            <svg v-if="uiStore.isDark" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Vista de página -->
      <div class="admin-layout__view">
        <RouterView />
      </div>
    </main>

    <ToastContainer />
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  background: var(--cs-bg);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-width: 220px;
  background: var(--cs-surface);
  border-right: 1px solid var(--cs-border);
  height: 100dvh;
}

.admin-sidebar__header {
  padding: 1.125rem 1rem;
  border-bottom: 1px solid var(--cs-border);
}

.admin-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
}

.admin-sidebar__badge {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #ef4444;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.admin-sidebar__title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--cs-text);
}

.admin-sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.5rem;
}

.admin-sidebar__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.admin-sidebar__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--cs-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.admin-sidebar__item:hover {
  background: var(--cs-surface-hover);
  color: var(--cs-text);
}

.admin-sidebar__item.is-active {
  background: rgba(239,68,68,0.08);
  color: #ef4444;
}

.admin-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--cs-border);
}

.admin-sidebar__back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--cs-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.admin-sidebar__back:hover { color: var(--cs-text); }

.admin-sidebar__user {
  font-size: 0.75rem;
  color: var(--cs-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Main */
.admin-layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid var(--cs-border);
  background: var(--cs-surface);
  flex-shrink: 0;
}

.admin-topbar__title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--cs-text);
  margin: 0;
}

.admin-topbar__theme {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--cs-border);
  color: var(--cs-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.admin-topbar__theme:hover {
  background: var(--cs-surface-hover);
  color: var(--cs-text);
}

.admin-layout__view {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

@media (max-width: 767px) {
  .admin-sidebar { display: none; }
}
</style>
