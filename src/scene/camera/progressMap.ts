import { computeTimeline } from '../../config/chapters'

/**
 * Scroll → camera-path mapping, kept free of three.js so the DOM layer (the
 * film player) can share it without pulling the 3D bundle into the main chunk.
 * Curve parameter u runs 0–1 across the control points in cameraPath.ts;
 * control point i sits at u = i / (KEY_COUNT - 1).
 */
export const KEY_COUNT = 19

/** Rest ranges per chapter, as control-point indices (same order as chapters). */
export const chapterRests: [number, number][] = [
  [0, 1],
  [4, 5],
  [10, 11],
  [14, 15],
  [17, 18],
]

/**
 * Maps scroll progress p (0–1) to curve parameter u (0–1).
 * Rests are linear (slow drift). Travels between rests are cubic Hermite
 * segments whose end slopes match the adjacent rests, so speed is continuous
 * (no jolt entering or leaving a rest) in both scroll directions.
 */
export function createProgressMap(compact: boolean) {
  const { timings } = computeTimeline(compact)
  const N = KEY_COUNT - 1
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

