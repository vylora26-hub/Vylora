<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

const notifStore = useNotificationsStore()

onMounted(() => notifStore.fetchNotifications())
</script>

<template>
  <div class="notif-page">
    <header class="notif-page__header">
      <h1 class="notif-page__title">Notificaciones</h1>
      <AppButton
        v-if="notifStore.unreadCount > 0"
        variant="ghost"
        size="sm"
        @click="notifStore.markAllAsRead()"
      >
        Marcar todas como leídas
      </AppButton>
    </header>

    <!-- Skeletons -->
    <div v-if="notifStore.loading" class="notif-page__list">
      <div v-for="i in 6" :key="i" class="notif-page__skeleton">
        <AppSkeleton width="40px" height="40px" :circle="true" />
        <div style="flex:1">
          <AppSkeleton width="50%" height="0.875rem" />
          <AppSkeleton width="70%" height="0.75rem" style="margin-top:0.375rem" />
        </div>
      </div>
    </div>

    <!-- Lista real -->
    <ul
      v-else-if="notifStore.notifications.length > 0"
      class="notif-page__list"
      role="list"
    >
      <li
        v-for="n in notifStore.notifications"
        :key="n.id"
        class="notif-page__item"
        :class="{ 'notif-page__item--unread': !n.isRead }"
        @click="notifStore.markAsRead(n.id)"
      >
        <div class="notif-page__dot" :class="{ 'notif-page__dot--hidden': n.isRead }" aria-label="No leída" />
        <div class="notif-page__body">
          <p class="notif-page__item-title">{{ n.title }}</p>
          <p class="notif-page__item-body">{{ n.body }}</p>
          <time class="notif-page__time" :datetime="n.createdAt">
            {{ new Date(n.createdAt).toLocaleString('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }}
          </time>
        </div>
      </li>
    </ul>

    <!-- Empty -->
    <AppEmptyState
      v-else
      title="Todo al día"
      description="No tienes notificaciones nuevas."
      icon="bell"
    />
  </div>
</template>

<style scoped>
.notif-page           { padding: 1.75rem; max-width: 680px; margin: 0 auto; }
.notif-page__header   { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.notif-page__title    { font-size: 1.5rem; font-weight: 700; color: var(--cs-text); }
.notif-page__list     { display: flex; flex-direction: column; gap: 0.5rem; }

.notif-page__item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}

.notif-page__item:hover { background: var(--cs-surface-hover); }
.notif-page__item--unread { border-color: var(--cs-primary); }

.notif-page__dot {
  flex-shrink: 0;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--cs-primary);
  margin-top: 5px;
}
.notif-page__dot--hidden { background: transparent; }

.notif-page__body       { flex: 1; min-width: 0; }
.notif-page__item-title { font-size: 0.9rem; font-weight: 600; color: var(--cs-text); }
.notif-page__item-body  { font-size: 0.8125rem; color: var(--cs-text-secondary); margin-top: 0.2rem; }
.notif-page__time       { font-size: 0.75rem; color: var(--cs-text-muted); display: block; margin-top: 0.375rem; }

.notif-page__skeleton {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem; background: var(--cs-surface);
  border: 1px solid var(--cs-border); border-radius: 0.75rem;
}
</style>
