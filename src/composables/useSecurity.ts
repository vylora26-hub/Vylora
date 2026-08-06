// ============================================================
// useSecurity — Lógica de seguridad anti-estafa del cliente
// Detección de patrones, badges de seguridad, advertencias
// ============================================================

import { ref } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'

// ---- Tipos ----
export interface SpamPattern {
  pattern: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecurityWarning {
  pattern: string
  category: string
  severity: SpamPattern['severity']
  message: string
}

// ---- Patrones hardcoded como fallback (sin BD) ----
const FALLBACK_PATTERNS: SpamPattern[] = [
  { pattern: 'western union',          category: 'scam',     severity: 'high'     },
  { pattern: 'moneygram',              category: 'scam',     severity: 'high'     },
  { pattern: 'transferencia bancaria', category: 'scam',     severity: 'high'     },
  { pattern: 'número de cuenta',       category: 'scam',     severity: 'high'     },
  { pattern: 'tarjeta de regalo',      category: 'scam',     severity: 'high'     },
  { pattern: 'gift card',              category: 'scam',     severity: 'high'     },
  { pattern: 'te gané un premio',      category: 'scam',     severity: 'high'     },
  { pattern: 'ganaste un premio',      category: 'scam',     severity: 'high'     },
  { pattern: 'inversión garantizada',  category: 'scam',     severity: 'high'     },
  { pattern: 'gana dinero rápido',     category: 'scam',     severity: 'high'     },
  { pattern: 'confirma tu contraseña', category: 'phishing', severity: 'critical' },
  { pattern: 'soy del banco',          category: 'scam',     severity: 'critical' },
  { pattern: 'trabajo en paypal',      category: 'scam',     severity: 'critical' },
  { pattern: 'bitcoin',                category: 'scam',     severity: 'medium'   },
  { pattern: 'criptomoneda',           category: 'scam',     severity: 'medium'   },
  { pattern: 'bit.ly',                 category: 'phishing', severity: 'medium'   },
]

// Caché de patrones (se carga una vez por sesión)
let patternsCache: SpamPattern[] | null = null

/** Mensajes de advertencia por severidad */
const WARNING_MESSAGES: Record<SpamPattern['severity'], string> = {
  low:      '⚠️ Este mensaje podría contener un enlace sospechoso.',
  medium:   '⚠️ Este mensaje contiene contenido que podría ser una estafa. Sé precavido.',
  high:     '🚨 Este mensaje tiene características comunes de estafa. No compartas dinero ni datos personales.',
  critical: '🚨 ALERTA: Este mensaje es altamente sospechoso. Nunca compartas contraseñas ni datos bancarios.',
}

/** Etiquetas de categoría para el usuario */
const CATEGORY_LABELS: Record<string, string> = {
  scam:     'Posible estafa',
  phishing: 'Posible phishing',
  adult:    'Contenido adulto',
  violence: 'Contenido violento',
}

export function useSecurity() {
  const patterns = ref<SpamPattern[]>([])
  const loaded   = ref(false)

  /** Cargar patrones desde Supabase (o usar fallback) */
  async function loadPatterns(): Promise<void> {
    if (patternsCache) { patterns.value = patternsCache; loaded.value = true; return }

    try {
      if (isMockMode || !supabase) {
        patterns.value = FALLBACK_PATTERNS
      } else {
        const { data } = await supabase.rpc('get_spam_patterns')
        patterns.value = data?.length ? (data as SpamPattern[]) : FALLBACK_PATTERNS
      }
    } catch {
      patterns.value = FALLBACK_PATTERNS
    }

    patternsCache = patterns.value
    loaded.value = true
  }

  /**
   * Analiza un texto y devuelve la advertencia más severa encontrada.
   * Devuelve null si el texto es seguro.
   */
  function analyzeText(text: string): SecurityWarning | null {
    if (!text.trim() || patterns.value.length === 0) return null

    const lower = text.toLowerCase()
    const severityOrder: SpamPattern['severity'][] = ['critical', 'high', 'medium', 'low']

    // Buscar el patrón más severo encontrado
    let worst: (SpamPattern & { index: number }) | null = null

    for (const p of patterns.value) {
      if (lower.includes(p.pattern.toLowerCase())) {
        const currentSeverityIndex = severityOrder.indexOf(p.severity)
        const worstSeverityIndex   = worst ? severityOrder.indexOf(worst.severity) : 999

        if (currentSeverityIndex < worstSeverityIndex) {
          worst = { ...p, index: currentSeverityIndex }
        }
      }
    }

    if (!worst) return null

    return {
      pattern:  worst.pattern,
      category: worst.category,
      severity: worst.severity,
      message:  WARNING_MESSAGES[worst.severity],
    }
  }

  /** Detecta URLs sospechosas (acortadores y dominios comunes de phishing) */
  function hasShortUrl(text: string): boolean {
    const shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'tiny.cc', 'is.gd', 'buff.ly']
    const lower = text.toLowerCase()
    return shorteners.some(s => lower.includes(s))
  }

  // ---- Badges de seguridad ----

  /** True si la cuenta fue creada hace menos de 30 días */
  function isNewAccount(createdAt?: string): boolean {
    if (!createdAt) return false
    const diff = Date.now() - new Date(createdAt).getTime()
    return diff < 30 * 24 * 60 * 60 * 1000 // 30 días en ms
  }

  /** Días que lleva la cuenta activa */
  function accountAgeDays(createdAt?: string): number {
    if (!createdAt) return 0
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000))
  }

  /** Color del badge de cuenta nueva según antigüedad */
  function newAccountBadgeColor(createdAt?: string): 'orange' | 'yellow' | 'gray' {
    const days = accountAgeDays(createdAt)
    if (days < 7)  return 'orange' // Muy nueva — más advertencia
    if (days < 30) return 'yellow' // Nueva
    return 'gray'
  }

  return {
    patterns,
    loaded,
    loadPatterns,
    analyzeText,
    hasShortUrl,
    isNewAccount,
    accountAgeDays,
    newAccountBadgeColor,
    CATEGORY_LABELS,
    WARNING_MESSAGES,
  }
}
