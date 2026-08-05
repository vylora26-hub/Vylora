<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  rounded?: boolean
  circle?: boolean
  lines?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  rounded: true,
  circle: false,
  lines: 1,
})
</script>

<template>
  <!-- Varias líneas -->
  <div v-if="lines > 1" class="skeleton-lines" role="status" aria-label="Cargando...">
    <span
      v-for="i in lines"
      :key="i"
      class="skeleton"
      :class="{ 'skeleton--rounded': rounded, 'skeleton--circle': circle }"
      :style="{
        width: i === lines && lines > 1 ? '65%' : width,
        height,
      }"
      aria-hidden="true"
    />
  </div>

  <!-- Una línea -->
  <span
    v-else
    class="skeleton"
    :class="{ 'skeleton--rounded': rounded, 'skeleton--circle': circle }"
    :style="{ width, height }"
    role="status"
    aria-label="Cargando..."
    aria-hidden="true"
  />
</template>

<style scoped>
.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    var(--cs-surface-2) 25%,
    var(--cs-surface-hover) 50%,
    var(--cs-surface-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

.skeleton--rounded { border-radius: 0.375rem; }
.skeleton--circle  { border-radius: 50%; aspect-ratio: 1; }

@keyframes shimmer {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}
</style>
