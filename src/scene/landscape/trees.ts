import * as THREE from 'three'
import { terrainHeight } from './terrain'

/**
 * Deliberately composed tree placement. Rather than scattering, trees are
 * planted in named stands that frame the house: a dense backdrop on the slope
 * behind, groups that hold the west and east edges of the view, a pair of
 * near trees that give the arrival shot a foreground, and one courtyard maple.
 * Positions are jittered deterministically inside each stand.
 */
interface Stand {
  name: string
  center: [number, number]
  radius: [number, number]
  count: number
  height: [number, number]
  /** Keep this rectangle clear (camera path, house) — x0, x1, z0, z1. */
}

const stands: Stand[] = [
  { name: 'slope-backdrop', center: [-4, -30], radius: [40, 12], count: 70, height: [16, 24] },
  { name: 'slope-high', center: [6, -52], radius: [60, 10], count: 60, height: [18, 26] },
  { name: 'west-edge', center: [-30, -15], radius: [8, 10], count: 16, height: [14, 22] },
  { name: 'east-edge', center: [23, -12], radius: [7, 7], count: 10, height: [13, 20] },
  { name: 'far-east', center: [46, 0], radius: [9, 20], count: 16, height: [15, 23] },
]

/** Hand-placed trees for composition. */
const placed: { x: number; z: number; h: number }[] = [
  { x: 33.5, z: 21.5, h: 22 }, // right edge of the arrival frame
  { x: 15.5, z: -14.5, h: 18 }, // behind the cantilever, gives it a dark ground
  { x: -15.5, z: -12.5, h: 20 },
  { x: -14.5, z: 22.5, h: 16 },
]

// Areas that must stay clear: house + plinth, the camera's approach corridor.
const clear: [number, number, number, number][] = [
  [-15, 12.5, -9, 15.5], // plinth and steps
  [-8, 34, 12, 34], // approach corridor south of the pool
  [10, 34, 8, 30],
]

function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Conifer {
  x: number
  y: number
  z: number
  h: number
  lean: number
  tone: number
}

export function planConifers(density = 1): Conifer[] {
  const rand = mulberry(2026)
  const out: Conifer[] = []
  const ok = (x: number, z: number) =>
    !clear.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1) &&
    out.every((t) => Math.hypot(t.x - x, t.z - z) > 2.4)
  for (const s of stands) {
    const n = Math.round(s.count * density)
    let tries = 0
    let made = 0
    while (made < n && tries < n * 30) {
      tries++
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand())
      const x = s.center[0] + Math.cos(a) * r * s.radius[0]
      const z = s.center[1] + Math.sin(a) * r * s.radius[1]
      if (!ok(x, z)) continue
      const h = s.height[0] + rand() * (s.height[1] - s.height[0])
      out.push({ x, z, y: terrainHeight(x, z), h, lean: (rand() - 0.5) * 0.04, tone: rand() })
      made++
    }
  }
  placed.forEach((p, i) => out.push({ ...p, y: terrainHeight(p.x, p.z), lean: 0, tone: (i * 0.37) % 1 }))
  return out
}

/**
 * Builds instance matrices for conifers: a tapered trunk plus five stacked
 * crown tiers (cones) whose radii narrow toward the top and are slightly
 * rotated per tier so the silhouette is irregular, like a spruce.
 */
export function coniferInstances(trees: Conifer[]) {
  const trunks: THREE.Matrix4[] = []
  const tiers: THREE.Matrix4[] = []
  const tierColors: THREE.Color[] = []
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const dark = new THREE.Color('#0f1511')
  const light = new THREE.Color('#1b241e')
  trees.forEach((t, i) => {
    e.set(t.lean, i * 1.7, t.lean * 0.5)
    q.setFromEuler(e)
    trunks.push(
      new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y + t.h * 0.45, t.z), q, new THREE.Vector3(t.h * 0.012, t.h * 0.9, t.h * 0.012)),
    )
    const crownBase = t.h * 0.22
    const tierCount = 7
    for (let k = 0; k < tierCount; k++) {
      const f = k / (tierCount - 1)
      const radius = t.h * (0.115 - f * 0.085)
      const height = t.h * (0.24 - f * 0.08)
      const y = t.y + crownBase + f * (t.h - crownBase - height * 0.55) + height / 2
      e.set(t.lean, i * 0.9 + k * 1.3, 0)
      q.setFromEuler(e)
      tiers.push(new THREE.Matrix4().compose(new THREE.Vector3(t.x, y, t.z), q, new THREE.Vector3(radius, height, radius)))
      tierColors.push(dark.clone().lerp(light, t.tone * 0.7 + f * 0.3))
    }
  })
  return { trunks, tiers, tierColors }
}
