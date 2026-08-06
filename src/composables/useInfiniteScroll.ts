// ============================================================
// useInfiniteScroll — Scroll infinito hacia arriba para chat
// Dispara el callback cuando el usuario llega al tope
// ============================================================

import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useInfiniteScroll(
  containerRef: Ref<HTMLElement | null>,
  onLoadMore: () => Promise<void>,
  options = { threshold: 80 },
) {
  const isLoadingMore = ref(false)

  async function handleScroll() {
    const el = containerRef.value
    if (!el || isLoadingMore.value) return
    // Disparar cuando el scroll está cerca del tope (para chat invertido)
    if (el.scrollTop <= options.threshold) {
      isLoadingMore.value = true
      const prevHeight = el.scrollHeight
      await onLoadMore()
      // Mantener posición de scroll después de cargar mensajes anteriores
      await Promise.resolve() // esperar re-render
      el.scrollTop = el.scrollHeight - prevHeight
      isLoadingMore.value = false
    }
  }

  onMounted(() => containerRef.value?.addEventListener('scroll', handleScroll, { passive: true }))
  onUnmounted(() => containerRef.value?.removeEventListener('scroll', handleScroll))

  return { isLoadingMore }
}
