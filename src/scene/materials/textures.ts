import * as THREE from 'three'

/**
 * Procedural texture generation. Everything is produced at runtime on a 2D
 * canvas, so the site ships no texture files. Each generator returns a
 * greyscale-friendly albedo plus a height field converted to a normal map.
 *
 * Scale convention: every texture represents a known physical size (see
 * TEXTURE_METRES) and geometry UVs are written in metres divided by that size
 * (architecture/builder.ts), so grain and grit stay consistent across parts.
 */
export const TEXTURE_METRES = {
  timber: 1.2,
  stone: 2.4,
  floor: 2.4, // 4 tiles of 1.2 m
  plaster: 1.5,
  fabric: 0.5,
  rug: 1.0,
  basalt: 2.0,
  ground: 6.0,
} as const

// ---------- deterministic noise ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tileable value noise on an integer lattice of `period` cells. */
function makeNoise(seed: number) {
  const rand = mulberry32(seed)
  const perm = new Float32Array(512 * 512)
  for (let i = 0; i < perm.length; i++) perm[i] = rand()
  return (x: number, y: number, px: number, py: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    const mx = (n: number) => ((n % px) + px) % px
    const my = (n: number) => ((n % py) + py) % py
    const a = perm[mx(xi) * 512 + my(yi)]
    const b = perm[mx(xi + 1) * 512 + my(yi)]
    const c = perm[mx(xi) * 512 + my(yi + 1)]
    const d = perm[mx(xi + 1) * 512 + my(yi + 1)]
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
}

/**
 * Tileable fractal noise in [0,1]. x,y are in [0,1). `bx`/`by` are integer
 * lattice frequencies per axis; unequal values stretch features while keeping
 * the texture seamless (used for directional timber grain).
 */
function fbm(
  noise: ReturnType<typeof makeNoise>,
  x: number,
  y: number,
  bx: number,
  octaves: number,
  by: number = bx,
) {
  let amp = 0.5
  let sum = 0
  let norm = 0
  let px = bx
  let py = by
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * px, y * py, px, py)
    norm += amp
    amp *= 0.5
    px *= 2
    py *= 2
  }
  return sum / norm
}

interface Generated {
  albedo: Uint8ClampedArray // RGBA
  height: Float32Array // 0..1
  rough?: Float32Array // 0..1
}

function toCanvasTexture(size: number, rgba: Uint8ClampedArray, srgb: boolean) {
  const tex = new THREE.DataTexture(rgba, size, size, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

/** Sobel normal map from a tileable height field. */
function heightToNormal(size: number, h: Float32Array, strength: number) {
  const out = new Uint8ClampedArray(size * size * 4)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const nx = -dx
      const ny = -dy
      const nz = 1
      const len = Math.hypot(nx, ny, nz)
      const i = (y * size + x) * 4
      out[i] = ((nx / len) * 0.5 + 0.5) * 255
      out[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
      out[i + 2] = ((nz / len) * 0.5 + 0.5) * 255
      out[i + 3] = 255
    }
  }
  return out
}

function greyToRGBA(size: number, g: Float32Array) {
  const out = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const v = Math.max(0, Math.min(1, g[i])) * 255
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v
    out[i * 4 + 3] = 255
  }
  return out
}

// ---------- generators ----------

/**
 * Timber: straight, directional grain running along V (texture "up"), with
 * slow growth-ring waviness, fine pores and board-to-board tone variation.
 * Albedo is a neutral light value; finish colour is applied by the material,
 * so one texture serves all three timber finishes.
 */
function genTimber(size: number): Generated {
  const n = makeNoise(11)
  const n2 = makeNoise(23)
  const albedo = new Uint8ClampedArray(size * size * 4)
  const height = new Float32Array(size * size)
  const rough = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    const v = y / size
    for (let x = 0; x < size; x++) {
      const u = x / size
      // Warp the across-grain coordinate slowly along the grain.
      const warp = (fbm(n, u, v, 1, 3, 2) - 0.5) * 0.035
      const across = u + warp
      // Growth rings: sharp-ish periodic bands across the board.
      const ring = Math.sin(across * Math.PI * 2 * 38 + fbm(n2, u, v, 4, 2) * 6)
      const ringBand = Math.pow(0.5 + 0.5 * ring, 3)
      // Fine pores: high-frequency streaks stretched along v.
      const pore = fbm(n2, u, v, 96, 2, 6)
      const streak = fbm(n, u, v, 24, 3, 2)
      // Board variation: 8 boards across the 1.2 m tile (~150 mm boards).
      const board = Math.floor(u * 8)
      const boardTone = (mulberry32(board * 97 + 5)() - 0.5) * 0.12
      let tone = 0.78 + boardTone - ringBand * 0.09 - (streak - 0.5) * 0.14 - (pore < 0.32 ? 0.05 : 0)
      // Board joints: a crisp dark line every board.
      const fx = (u * 8) % 1
      const joint = fx < 0.008 || fx > 0.992
      if (joint) tone *= 0.55
      tone = Math.max(0, Math.min(1, tone))
      const i = y * size + x
      albedo[i * 4] = tone * 255
      albedo[i * 4 + 1] = tone * 244
      albedo[i * 4 + 2] = tone * 228
      albedo[i * 4 + 3] = 255
      height[i] = 0.5 - ringBand * 0.25 - (pore < 0.3 ? 0.15 : 0) - (joint ? 0.6 : 0)
      rough[i] = 0.62 + ringBand * 0.12 + (pore < 0.3 ? 0.1 : 0)
    }
  }
  return { albedo, height, rough }
}

/** Honed limestone: pale, low-contrast mottling with sparse fossil flecks. */
function genStone(size: number, tiles: number, seed: number): Generated {
  const n = makeNoise(seed)
  const n2 = makeNoise(seed + 7)
  const albedo = new Uint8ClampedArray(size * size * 4)
  const height = new Float32Array(size * size)
  const rough = new Float32Array(size * size)
  const rand = mulberry32(seed * 13)
  const tileTone: number[] = []
  for (let i = 0; i < tiles * tiles * 4; i++) tileTone.push((rand() - 0.5) * 0.05)
  for (let y = 0; y < size; y++) {
    const v = y / size
    for (let x = 0; x < size; x++) {
      const u = x / size
      const cloud = fbm(n, u, v, 3, 5)
      const grit = fbm(n2, u, v, 64, 2)
      // Faint horizontal bedding (stretched noise) instead of hard veins.
      const bed = fbm(n2, u, v, 2, 3, 14)
      const fleck = grit > 0.8 ? -0.035 : grit < 0.16 ? 0.02 : 0
      let tone = 0.8 + (cloud - 0.5) * 0.09 + (bed - 0.5) * 0.06 + fleck
      let joint = false
      if (tiles > 0) {
        // Large-format tiles; 3 mm joints in a stack bond, offset rows.
        const tx = u * tiles
        const ty = v * tiles
        const row = Math.floor(ty)
        const ox = (tx + (row % 2) * 0.5) % 1
        const oy = ty % 1
        joint = ox < 0.004 || ox > 0.996 || oy < 0.004 || oy > 0.996
        tone += tileTone[(row * tiles + Math.floor(tx + (row % 2) * 0.5)) % tileTone.length] ?? 0
        if (joint) tone *= 0.72
      }
      tone = Math.max(0, Math.min(1, tone))
      const i = y * size + x
      albedo[i * 4] = tone * 255
      albedo[i * 4 + 1] = tone * 250
      albedo[i * 4 + 2] = tone * 240
      albedo[i * 4 + 3] = 255
      height[i] = 0.5 + (grit - 0.5) * 0.22 + (cloud - 0.5) * 0.06 - (joint ? 0.7 : 0)
      rough[i] = 0.55 + (grit - 0.5) * 0.25 + (joint ? 0.3 : 0)
    }
  }
  return { albedo, height, rough }
}

/** Fine lime plaster: barely-there trowel clouds and grit. */
function genPlaster(size: number): Generated {
  const n = makeNoise(41)
  const albedo = new Uint8ClampedArray(size * size * 4)
  const height = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const c = fbm(n, u, v, 4, 4)
      const g = fbm(n, u, v, 96, 2, 96)
      const tone = 0.86 + (c - 0.5) * 0.06
      const i = y * size + x
      albedo[i * 4] = tone * 255
      albedo[i * 4 + 1] = tone * 251
      albedo[i * 4 + 2] = tone * 244
      albedo[i * 4 + 3] = 255
      height[i] = c * 0.4 + g * 0.6
    }
  }
  return { albedo, height }
}

/** Woven upholstery: a tight basket weave with slubs. */
function genFabric(size: number): Generated {
  const n = makeNoise(57)
  const albedo = new Uint8ClampedArray(size * size * 4)
  const height = new Float32Array(size * size)
  const threads = 160
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const tu = (u * threads) % 1
      const tv = (v * threads) % 1
      const over = (Math.floor(u * threads) + Math.floor(v * threads)) % 2 === 0
      const w = over ? Math.sin(tu * Math.PI) : Math.sin(tv * Math.PI)
      const slub = fbm(n, u, v, 24, 2, 6)
      const tone = 0.82 + (slub - 0.5) * 0.12 + w * 0.06
      const i = y * size + x
      albedo[i * 4] = tone * 255
      albedo[i * 4 + 1] = tone * 252
      albedo[i * 4 + 2] = tone * 246
      albedo[i * 4 + 3] = 255
      height[i] = w * 0.7 + slub * 0.3
    }
  }
  return { albedo, height }
}

/** Hand-loomed wool rug: chunky loops with a soft tonal stripe. */
function genRug(size: number): Generated {
  const n = makeNoise(71)
  const albedo = new Uint8ClampedArray(size * size * 4)
  const height = new Float32Array(size * size)
  const loops = 90
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const lx = (u * loops) % 1
      const ly = (v * loops * 1.4) % 1
      const loop = Math.sin(lx * Math.PI) * Math.sin(ly * Math.PI)
      const cloud = fbm(n, u, v, 3, 3)
      const stripe = Math.floor(v * 10) % 5 === 0 ? -0.05 : 0
      const tone = 0.74 + loop * 0.12 + (cloud - 0.5) * 0.1 + stripe
      const i = y * size + x
      albedo[i * 4] = tone * 255
      albedo[i * 4 + 1] = tone * 247
      albedo[i * 4 + 2] = tone * 234
      albedo[i * 4 + 3] = 255
      height[i] = loop
    }
  }
  return { albedo, height }
}

/** Dark flamed basalt for the plinth and steps. */
function genBasalt(size: number): Generated {
  const n = makeNoise(83)
  const albedo = new Uint8ClampedArray(size * size * 4)
  const height = new Float32Array(size * size)
  const rough = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const c = fbm(n, u, v, 4, 4)
      const g = fbm(n, u, v, 128, 2)
      const ox = (u * 2) % 1
      const oy = (v * 4) % 1
      const joint = ox < 0.003 || ox > 0.997 || oy < 0.006 || oy > 0.994
      const tone = (0.42 + (c - 0.5) * 0.1 + (g - 0.5) * 0.12) * (joint ? 0.6 : 1)
      const i = y * size + x
      albedo[i * 4] = tone * 255
      albedo[i * 4 + 1] = tone * 252
      albedo[i * 4 + 2] = tone * 246
      albedo[i * 4 + 3] = 255
      height[i] = g * 0.7 + c * 0.3 - (joint ? 0.5 : 0)
      rough[i] = 0.75 + (g - 0.5) * 0.2
    }
  }
  return { albedo, height, rough }
}

/** Forest floor: moss, needles and soil, low contrast. */
function genGround(size: number): Generated {
  const n = makeNoise(97)
  const n2 = makeNoise(101)
  const albedo = new Uint8ClampedArray(size * size * 4)
  const height = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const c = fbm(n, u, v, 4, 5)
      const g = fbm(n2, u, v, 48, 3)
      const moss = c > 0.5
      const r = moss ? 0.2 + g * 0.08 : 0.24 + g * 0.08
      const gg = moss ? 0.24 + g * 0.1 : 0.2 + g * 0.06
      const b = moss ? 0.13 + g * 0.04 : 0.14 + g * 0.05
      const i = y * size + x
      albedo[i * 4] = r * 255
      albedo[i * 4 + 1] = gg * 255
      albedo[i * 4 + 2] = b * 255
      albedo[i * 4 + 3] = 255
      height[i] = g * 0.6 + c * 0.4
    }
  }
  return { albedo, height }
}

export interface TextureSet {
  map: THREE.Texture
  normalMap: THREE.Texture
  roughnessMap?: THREE.Texture
}

function finish(size: number, g: Generated, normalStrength: number): TextureSet {
  return {
    map: toCanvasTexture(size, g.albedo, true),
    normalMap: toCanvasTexture(size, heightToNormal(size, g.height, normalStrength), false),
    roughnessMap: g.rough ? toCanvasTexture(size, greyToRGBA(size, g.rough), false) : undefined,
  }
}

export interface SceneTextures {
  timber: TextureSet
  stone: TextureSet
  floor: TextureSet
  plaster: TextureSet
  fabric: TextureSet
  rug: TextureSet
  basalt: TextureSet
  ground: TextureSet
  dispose(): void
}

/**
 * Generates all textures. `size` is 1024 on capable devices, 512 on the low
 * tier. Runs once per canvas; disposed on unmount.
 */
export function createSceneTextures(size: number): SceneTextures {
  const half = Math.max(256, size / 2)
  const set: Omit<SceneTextures, 'dispose'> = {
    timber: finish(size, genTimber(size), 3.2),
    stone: finish(size, genStone(size, 0, 5), 2.2),
    floor: finish(size, genStone(size, 2, 9), 2.2),
    plaster: finish(half, genPlaster(half), 0.9),
    fabric: finish(half, genFabric(half), 1.6),
    rug: finish(half, genRug(half), 2.4),
    basalt: finish(half, genBasalt(half), 2.6),
    ground: finish(half, genGround(half), 2.0),
  }
  return {
    ...set,
    dispose() {
      Object.values(set).forEach((t: TextureSet) => {
        t.map.dispose()
        t.normalMap.dispose()
        t.roughnessMap?.dispose()
      })
    },
  }
}

/**
 * Tree-line silhouette for the distant forest layers: an alpha strip of
 * conifer crowns drawn on a 2D canvas. Height variation is deliberate: denser
 * and taller toward the centre of each strip.
 */
export function createTreelineTexture(seed: number, width = 2048, height = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(seed)
  ctx.fillStyle = '#fff'
  // Continuous understorey band.
  ctx.fillRect(0, height * 0.72, width, height * 0.28)
  // Each crown is its own spire with ragged, stepped branch tiers, so
  // overlapping trees merge into a believable canopy edge.
  let x = -30
  while (x < width + 30) {
    const w = 46 + rand() * 70
    const h = (0.42 + rand() * 0.5) * height
    const cx = x + w / 2
    const top = height - h
    const tiers = 6 + Math.floor(rand() * 3)
    ctx.beginPath()
    ctx.moveTo(cx, top)
    for (let t = 1; t <= tiers; t++) {
      const f = t / tiers
      const y = top + f * h * 0.78
      const half = (w / 2) * (0.25 + f * 0.75) * (0.85 + rand() * 0.3)
      ctx.lineTo(cx + half, y)
      ctx.lineTo(cx + half * 0.55, y - h * 0.02)
    }
    ctx.lineTo(cx + w * 0.4, height)
    ctx.lineTo(cx - w * 0.4, height)
    for (let t = tiers; t >= 1; t--) {
      const f = t / tiers
      const y = top + f * h * 0.78
      const half = (w / 2) * (0.25 + f * 0.75) * (0.85 + rand() * 0.3)
      ctx.lineTo(cx - half * 0.55, y - h * 0.02)
      ctx.lineTo(cx - half, y)
    }
    ctx.closePath()
    ctx.fill()
    x += w * (0.35 + rand() * 0.35)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  return tex
}
