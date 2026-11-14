import * as THREE from 'three'
import { chapters, computeTimeline } from '../../config/chapters'

/**
 * Camera choreography.
 *
 * The journey is one continuous Catmull-Rom spline through the control points
 * below — one for the eye, one (with the same count) for the look-at target,
 * plus a field of view per point. Each chapter "rests" between two control
 * points (restA → restB): while the reader takes in the text the camera only
 * drifts along that short stretch; between rests it travels.
 *
 * World units are metres. Interior eye height is ~1.5 m above the 0.47 m floor.
 * Clearances were planned against the plan in architecture/dimensions.ts:
 *  - the threshold passes the open pivot door at x ≈ -4.25, 0.6 m clear of
 *    both the jamb (x -3.6) and the door leaf (x ≈ -5.05);
 *  - the living move runs between the feature wall (z -4.95) and the sofa back
 *    (z -2.7), above sofa height;
 *  - the stair-hall entry crosses the screen opening (z -1.6…0.8) at z ≈ -0.45.
 */
export interface CameraKey {
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
  /** Overrides for portrait (phone) framing. */
  portrait?: Partial<Omit<CameraKey, 'portrait'>>
}

export const cameraKeys: CameraKey[] = [
  // 0 ─ 01 Arrival (rest A): oblique from the south-east across the pool.
  { pos: [25, 2.9, 25.5], target: [1.2, 3.3, 3], fov: 36, portrait: { pos: [33, 4.2, 36], target: [5.2, 0.9, 3.8], fov: 50 } },
  // 1 ─ 01 Arrival (rest B): the gentle approach as the type leaves.
  { pos: [23.5, 2.8, 24.2], target: [0.9, 3.25, 3.1], fov: 36, portrait: { pos: [31.4, 4.0, 34.4], target: [4.8, 0.95, 3.9], fov: 50 } },
  // 2 ─ gliding west along the pool.
  { pos: [14, 2.7, 19.6], target: [-2.5, 2.4, 3], fov: 38, portrait: { fov: 54 } },
  // 3
  { pos: [3.5, 2.5, 15.8], target: [-4.6, 2.0, 1.5], fov: 40, portrait: { fov: 56 } },
  // 4 ─ 02 Threshold (rest A): on axis with the porch, the open door framing the timber wall.
  { pos: [-6.2, 2.08, 10.6], target: [-2.9, 1.95, 0], fov: 40, portrait: { pos: [-4.4, 2.08, 11.2], target: [-4.4, 1.95, 0], fov: 60 } },
  // 5 ─ 02 Threshold (rest B)
  { pos: [-5.7, 2.05, 8.7], target: [-3.3, 1.95, 0], fov: 41, portrait: { pos: [-4.35, 2.05, 9.4], target: [-4.4, 1.95, 0], fov: 60 } },
  // 6 ─ under the porch roof.
  { pos: [-4.2, 2.02, 4.8], target: [-4.35, 1.95, -3], fov: 44, portrait: { fov: 62 } },
  // 7 ─ in the door opening (door plane z 2.4–2.7).
  { pos: [-4.27, 2.0, 2.55], target: [-4.1, 1.95, -4], fov: 46, portrait: { fov: 64 } },
  // 8 ─ inside; beginning the turn east.
  { pos: [-4.05, 1.98, 0.35], target: [-2.6, 1.8, -4.4], fov: 48, portrait: { fov: 66 } },
  // 9
  { pos: [-3.45, 1.96, -2.1], target: [1.6, 1.45, -1.4], fov: 48, portrait: { fov: 66 } },
  // 10 ─ 03 Inhabitation (rest A): behind the sofa, looking toward glazing and pool.
  { pos: [-2.55, 1.95, -3.55], target: [1.8, 1.2, 3.4], fov: 48, portrait: { fov: 66 } },
  // 11 ─ 03 Inhabitation (rest B): lateral drift east.
  { pos: [0.45, 1.93, -3.6], target: [4.3, 1.25, 3.6], fov: 48, portrait: { fov: 66 } },
  // 12 ─ clearing the east end of the sofa.
  { pos: [2.3, 1.95, -3.0], target: [6.4, 2.0, -0.6], fov: 48, portrait: { fov: 66 } },
  // 13 ─ through the opening in the timber screen.
  { pos: [3.5, 1.97, -0.3], target: [7.4, 2.9, -1.9], fov: 52, portrait: { fov: 70 } },
  // 14 ─ 04 Structure (rest A): inside the double-height hall.
  { pos: [4.3, 1.95, 0.55], target: [7.3, 3.5, -2.7], fov: 54, portrait: { pos: [4.1, 1.95, 0.7], target: [7.1, 3.8, -2.9], fov: 72 } },
  // 15 ─ 04 Structure (rest B): a modest rise, tilting up to the skylight.
  { pos: [4.5, 2.4, 0.75], target: [6.9, 5.4, -3.5], fov: 56, portrait: { pos: [4.3, 2.4, 0.9], target: [6.8, 5.6, -3.6], fov: 74 } },
  // 16 ─ descending toward the corner.
  { pos: [5.65, 1.75, 1.05], target: [7.8, 1.05, 3.2], fov: 46, portrait: { fov: 62 } },
  // 17 ─ 05 Material (rest A): close on the bench, stone and bronze frame.
  { pos: [6.45, 1.32, 2.05], target: [7.85, 0.82, 3.7], fov: 40, portrait: { fov: 56 } },
  // 18 ─ 05 Material (rest B)
  { pos: [6.62, 1.24, 2.25], target: [7.88, 0.8, 3.75], fov: 38, portrait: { fov: 54 } },
]

/** Rest ranges per chapter, as control-point indices (same order as chapters). */
export const chapterRests: [number, number][] = [
  [0, 1],
  [4, 5],
  [10, 11],
  [14, 15],
  [17, 18],
]

if (import.meta.env.DEV && chapterRests.length !== chapters.length) {
  throw new Error('cameraPath: one rest range per chapter is required')
}

/** Additional composed viewpoints used only for editorial stills. */
export const stillViews: Record<string, Omit<CameraKey, 'portrait'>> = {
  'view-pool': { pos: [11.5, 1.35, 13.2], target: [4.6, 3.6, 6.0], fov: 46 },
  'view-feature-wall': { pos: [2.7, 1.55, 3.35], target: [-2.4, 1.45, -4.6], fov: 46 },
  'view-stair-up': { pos: [5.3, 1.45, 0.5], target: [6.7, 7.0, -3.7], fov: 62 },
  'og-image': { pos: [25, 2.9, 25.5], target: [2.6, 3.4, 3], fov: 34 },
}

export interface CameraPath {
  pos: THREE.CatmullRomCurve3
  target: THREE.CatmullRomCurve3
  fov: number[]
}

export function buildCameraPath(portrait: boolean): CameraPath {
  const pick = (k: CameraKey) => (portrait && k.portrait ? { ...k, ...k.portrait } : k)
  const keys = cameraKeys.map(pick)
  return {
    pos: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal'),
    target: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.target)), false, 'centripetal'),
    fov: keys.map((k) => k.fov),
  }
}

/**
 * Maps scroll progress p (0–1) to curve parameter u (0–1).
 * Rests are linear (slow drift). Travels between rests are cubic Hermite
 * segments whose end slopes match the adjacent rests, so speed is continuous
 * (no jolt entering or leaving a rest) in both scroll directions.
 */
export function createProgressMap(compact: boolean) {
  const { timings } = computeTimeline(compact)
  const N = cameraKeys.length - 1
  const anchors = timings.map((t, i) => {
    const [a, b] = chapterRests[i]
    const u0 = a / N
    const u1 = b / N
    const slope = t.restEnd > t.restStart ? (u1 - u0) / (t.restEnd - t.restStart) : 0
    return { p0: t.restStart, p1: t.restEnd, u0, u1, slope }
  })
  return (p: number) => {
    const x = Math.min(1, Math.max(0, p))
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i]
      if (x <= a.p1) {
        if (x >= a.p0) return a.p1 > a.p0 ? a.u0 + (x - a.p0) * a.slope : a.u0
        // Travel from previous rest end to this rest start.
        const prev = anchors[i - 1]
        if (!prev) return a.u0
        const h = a.p0 - prev.p1
        const t = (x - prev.p1) / h
        const t2 = t * t
        const t3 = t2 * t
        // Limit the matched slopes so the travel stays monotonic.
        const secant = (a.u0 - prev.u1) / h
        const m0 = Math.min(prev.slope, secant * 2.5)
        const m1 = Math.min(a.slope, secant * 2.5)
        return (
          (2 * t3 - 3 * t2 + 1) * prev.u1 +
          (t3 - 2 * t2 + t) * h * m0 +
          (-2 * t3 + 3 * t2) * a.u0 +
          (t3 - t2) * h * m1
        )
      }
    }
    return anchors[anchors.length - 1].u1
  }
}

/** Fov at curve parameter u: linear between control points, smoothed. */
export function fovAt(path: CameraPath, u: number) {
  const n = path.fov.length - 1
  const f = Math.min(n, Math.max(0, u * n))
  const i = Math.min(n - 1, Math.floor(f))
  const t = f - i
  const s = t * t * (3 - 2 * t)
  return path.fov[i] + (path.fov[i + 1] - path.fov[i]) * s
}

/** Exact rest pose for a chapter (used for stills and reduced-motion views). */
export function restPose(index: number, portrait = false) {
  const key = cameraKeys[chapterRests[index][0]]
  const k = portrait && key.portrait ? { ...key, ...key.portrait } : key
  return { pos: k.pos, target: k.target, fov: k.fov }
}
