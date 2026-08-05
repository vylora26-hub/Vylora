<script setup lang="ts">
import type { BadgeVariant } from '@/types'

interface Props {
  variant?: BadgeVariant
  dot?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  dot: false,
})
</script>

<template>
  <span class="badge" :class="[`badge--${variant}`, { 'badge--dot': dot }]">
    <span v-if="dot" class="badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2em 0.6em;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
}

.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.badge--default  { background: var(--cs-surface-2);    color: var(--cs-text-secondary); }
.badge--primary  { background: var(--cs-primary-subtle); color: var(--cs-primary);       }
.badge--success  { background: rgba(34,197,94,0.12);    color: #22c55e;                 }
.badge--warning  { background: rgba(245,158,11,0.12);   color: #f59e0b;                 }
.badge--danger   { background: rgba(239,68,68,0.12);    color: #ef4444;                 }
.badge--outline  { background: transparent; border: 1px solid var(--cs-border); color: var(--cs-text-secondary); }
</style>
