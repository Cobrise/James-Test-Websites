export const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const deg = (d: number): number => (d * Math.PI) / 180;

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export function smootherstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * t * (t * (6 * t - 15) + 10);
}

/** Seeded random numbers (mulberry32), so every generated texture and star field is the same each load. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable 2D value noise with fractal octaves; `period` cells across the tile. */
export function makeNoise(seed: number, period: number): (x: number, y: number, octaves?: number) => number {
  const rand = rng(seed);
  const size = 256;
  const table = new Float32Array(size * size);
  for (let i = 0; i < table.length; i++) table[i] = rand();
  const cell = (ix: number, iy: number, p: number) => table[(((iy % p) + p) % p) * size + (((ix % p) + p) % p)];
  const one = (x: number, y: number, p: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = cell(ix, iy, p), b = cell(ix + 1, iy, p), c = cell(ix, iy + 1, p), d = cell(ix + 1, iy + 1, p);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  };
  // x, y in 0..1 across the tile
  return (x, y, octaves = 4) => {
    let sum = 0, amp = 0.5, norm = 0, p = period;
    for (let o = 0; o < octaves; o++) {
      sum += one(x * p, y * p, Math.min(p, size)) * amp;
      norm += amp; amp *= 0.5; p *= 2;
    }
    return sum / norm;
  };
}
