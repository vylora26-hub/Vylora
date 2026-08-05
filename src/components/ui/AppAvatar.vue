<script setup lang="ts">
import { computed } from 'vue'
import type { AvatarSize } from '@/types'
import type { OnlineStatus } from '@/types'

interface Props {
  src?: string | null
  name?: string
  size?: AvatarSize
  status?: OnlineStatus
  showStatus?: boolean
  /** Anillo de color (ej. salas verificadas) */
  ring?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  name: '',
  size: 'md',
  showStatus: false,
  ring: false,
})

/** Inicial del nombre para el fallback */
const initial = computed(() =>
  props.name?.trim()?.charAt(0)?.toUpperCase() ?? '?'
)

/** Color de fondo determinístico según nombre */
const bgColor = computed(() => {
  const colors = [
    '#6366f1','#8b5cf6','#ec4899','#f43f5e',
    '#f97316','#eab308','#22c55e','#06b6d4',
    '#3b82f6','#a855f7',
  ]
  let hash = 0
  for (const ch of props.name ?? '') hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
})

const statusColors: Record<OnlineStatus, string> = {
  online:  '#22c55e',
  away:    '#f59e0b',
  offline: '#6b7280',
}
</script>

<template>
  <div
    class="avatar"
    :class="[`avatar--${size}`, { 'avatar--ring': ring }]"
    role="img"
    :aria-label="name || 'Avatar'"
  >
    <!-- Imagen real -->
    <img
      v-if="src"
      :src="src"
      :alt="name || 'Avatar'"
      class="avatar__img"
      loading="lazy"
      decoding="async"
    />
    <!-- Fallback con inicial -->
    <span
      v-else
      class="avatar__fallback"
      :style="{ backgroundColor: bgColor }"
      aria-hidden="true"
    >
      {{ initial }}
    </span>

    <!-- Indicador de estado -->
    <span
      v-if="showStatus"
      class="avatar__status"
      :style="{ backgroundColor: statusColors[status ?? 'offline'] }"
      :aria-label="`Estado: ${status ?? 'desconectado'}`"
    />
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: visible;
  display: inline-flex;
}

.avatar--ring {
  box-shadow: 0 0 0 2px var(--cs-primary);
}

.avatar__img,
.avatar__fallback {
  border-radius: 50%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
}

.avatar__fallback {
  color: #fff;
  font-weight: 700;
  font-size: 0.45em;
  letter-spacing: 0;
  text-transform: uppercase;
  user-select: none;
}

.avatar__status {
  position: absolute;
  bottom: 0;
  right: 0;
  border-radius: 50%;
  border: 2px solid var(--cs-bg);
}

/* Sizes */
.avatar--xs { width: 24px;  height: 24px;  font-size: 24px;  }
.avatar--sm { width: 32px;  height: 32px;  font-size: 32px;  }
.avatar--md { width: 40px;  height: 40px;  font-size: 40px;  }
.avatar--lg { width: 52px;  height: 52px;  font-size: 52px;  }
.avatar--xl { width: 72px;  height: 72px;  font-size: 72px;  }

/* Status dot sizes */
.avatar--xs .avatar__status { width: 7px;  height: 7px;  }
.avatar--sm .avatar__status { width: 9px;  height: 9px;  }
.avatar--md .avatar__status { width: 11px; height: 11px; }
.avatar--lg .avatar__status { width: 13px; height: 13px; }
.avatar--xl .avatar__status { width: 16px; height: 16px; }
</style>
