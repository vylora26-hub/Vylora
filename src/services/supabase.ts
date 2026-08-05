// ============================================================
// SUPABASE CLIENT
// Único punto de inicialización del cliente Supabase.
// El resto del código importa desde aquí, nunca directamente
// desde @supabase/supabase-js.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/config'

const { URL, ANON_KEY } = SUPABASE_CONFIG

/**
 * True cuando las variables de entorno no están configuradas.
 * En este modo la app funciona con datos simulados en memoria/localStorage.
 */
export const isMockMode: boolean =
  !URL ||
  !ANON_KEY ||
  URL.includes('your-project-id') ||
  ANON_KEY.includes('your-anon-key-here')

if (isMockMode) {
  console.warn(
    '[Vylora] Mock Mode activo — Supabase no configurado. ' +
    'La app funciona con datos simulados. Configura .env para producción.',
  )
}

/**
 * Cliente Supabase tipado.
 * En Mock Mode es `null` — los servicios deben comprobar `isMockMode`
 * antes de usarlo.
 */
export const supabase = isMockMode
  ? null
  : createClient(URL, ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
