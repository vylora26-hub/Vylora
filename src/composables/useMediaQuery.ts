// ============================================================
// useMediaQuery — Reactivo a breakpoints CSS
// ============================================================

import { ref, onMounted, onUnmounted } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mq: MediaQueryList

  function update() { matches.value = mq.matches }

  onMounted(() => {
    mq = window.matchMedia(query)
    matches.value = mq.matches
    mq.addEventListener('change', update)
  })

  onUnmounted(() => mq?.removeEventListener('change', update))

  return { matches }
}

/** Atajos comunes */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
