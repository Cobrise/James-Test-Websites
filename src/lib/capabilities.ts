/** Runtime capability checks. Evaluated once; none of these rebuild the scene. */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(window.location.search)
  if (q.get('motion') === 'reduced') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let webglCache: boolean | null = null
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache
  const q = new URLSearchParams(window.location.search)
  if (q.get('fallback') === '1') return (webglCache = false)
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    webglCache = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglCache = false
  }
  return webglCache
}

export type QualityTier = 'high' | 'low'

/**
 * Coarse, stable quality choice. Phones and tablets with coarse pointers get the
 * "low" tier (no post-processing, smaller shadow map, no planar reflection).
 * `?quality=low|high` overrides for testing.
 */
export function initialQuality(): QualityTier {
  const q = new URLSearchParams(window.location.search).get('quality')
  if (q === 'low' || q === 'high') return q
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.screen.width, window.screen.height) < 820
  const lowMem = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4
  return coarse && (small || lowMem) ? 'low' : coarse ? 'low' : 'high'
}

export function isCompactViewport(): boolean {
  return window.matchMedia('(max-width: 760px)').matches
}

export function isCaptureMode(): boolean {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).has('capture')
}
