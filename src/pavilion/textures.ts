/*
  Every texture is drawn in code on a canvas: no image files. Colour maps are sRGB, normal maps linear.
  Sizes are kept small (256-1024 px) so the scene builds in a fraction of a second.
*/
import { CanvasTexture, ClampToEdgeWrapping, NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { PALETTE, SATURN } from './config';
import { clamp, lerp, makeNoise, rng } from './math';

type RGB = [number, number, number];
const hex = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function surface(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  return { canvas, ctx, img, data: img.data };
}

function toTexture(canvas: HTMLCanvasElement, colour: boolean, repeat = true): Texture {
  const t = new CanvasTexture(canvas);
  t.colorSpace = colour ? SRGBColorSpace : NoColorSpace;
  t.wrapS = t.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  t.anisotropy = 8;
  return t;
}

/** A tangent-space normal map from a tileable height field (0..1). */
function normalMap(height: Float32Array, w: number, h: number, strength: number): Texture {
  const { canvas, ctx, img, data } = surface(w, h);
  const at = (x: number, y: number) => height[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      data[i] = (-dx / len * 0.5 + 0.5) * 255;
      data[i + 1] = (dy / len * 0.5 + 0.5) * 255;
      data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas, false);
}

/** Honed stone slabs: soft clouding, a faint vein and recessed joints. One repeat = 2 x 2 slabs. */
export function stoneTextures(size = 512) {
  const n = makeNoise(3, 6), vein = makeNoise(9, 3);
  const base = hex(PALETTE.stone), dark = mix(base, [150, 140, 126], 0.6), light = mix(base, [255, 252, 246], 0.5);
  const { canvas, ctx, img, data } = surface(size, size);
  const height = new Float32Array(size * size);
  const half = size / 2, joint = Math.max(1, Math.round(size / 340));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const cloud = n(u, v, 5);
      const vv = Math.abs(vein(u * 0.7 + cloud * 0.25, v * 0.35, 3) - 0.5);
      let c = mix(dark, light, clamp(cloud * 1.25 - 0.12));
      c = mix(c, dark, clamp(1 - vv * 28) * 0.35);
      const inJoint = x % half < joint || y % half < joint;
      if (inJoint) c = mix(c, [120, 112, 100], 0.6);
      const i = (y * size + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
      height[y * size + x] = (inJoint ? 0 : 1) * 0.6 + cloud * 0.08;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { map: toTexture(canvas, true), normal: normalMap(height, size, size, 2.0) };
}

/** Glass mosaic for the basin: 8 x 8 small tiles with colour jitter and light grout. */
export function mosaicTextures(size = 512, tiles = 8) {
  const rand = rng(21), n = makeNoise(5, 16);
  const base = hex(PALETTE.mosaic);
  const jitter: RGB[] = [];
  for (let i = 0; i < tiles * tiles; i++) {
    const k = rand();
    jitter.push(mix(mix(base, [40, 70, 84], 0.35), mix(base, [190, 215, 220], 0.35), k));
  }
  const { canvas, ctx, img, data } = surface(size, size);
  const height = new Float32Array(size * size);
  const cell = size / tiles, grout = Math.max(1, Math.round(cell * 0.07));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tx = Math.floor(x / cell), ty = Math.floor(y / cell);
      const gx = x % cell, gy = y % cell;
      const inGrout = gx < grout || gy < grout;
      const c = inGrout ? [205, 208, 204] as RGB : mix(jitter[ty * tiles + tx], [255, 255, 255], n(x / size, y / size, 2) * 0.12);
      const i = (y * size + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
      const edge = Math.min(gx, gy, cell - gx, cell - gy) / cell;
      height[y * size + x] = inGrout ? 0 : Math.min(1, edge * 10);
    }
  }
  ctx.putImageData(img, 0, 0);
  return { map: toTexture(canvas, true), normal: normalMap(height, size, size, 3.0) };
}

/** Gentle ripples for the water surface (normal map only; the colour comes from the reflection). */
export function waterNormal(size = 512): Texture {
  const a = makeNoise(31, 4), b = makeNoise(37, 9);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      height[y * size + x] = a(u, v, 3) * 0.7 + b(u, v, 2) * 0.3;
    }
  }
  return normalMap(height, size, size, 6.0);
}

/** Ivory plaster with a faint trowelled cloud. */
export function plasterTexture(colour: number, size = 256): Texture {
  const n = makeNoise(13, 5);
  const base = hex(colour);
  const { canvas, ctx, img, data } = surface(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = (n(x / size, y / size, 4) - 0.5) * 0.10;
      const c = mix(base, k > 0 ? [255, 255, 255] : [120, 110, 95], Math.abs(k));
      const i = (y * size + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas, true);
}

/** Close fabric weave for cushions and towels: a colour map with a soft normal map. */
export function fabricTextures(colour: number, size = 256, fine = 48) {
  const n = makeNoise(17, fine);
  const base = hex(colour);
  const { canvas, ctx, img, data } = surface(size, size);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = n(x / size, y / size, 2);
      const c = mix(base, [150, 140, 125], (1 - k) * 0.08);
      const i = (y * size + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
      height[y * size + x] = k;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { map: toTexture(canvas, true), normal: normalMap(height, size, size, 1.5) };
}

/** Walnut grain running along the lounger's length. */
export function woodTexture(size = 512): Texture {
  const n = makeNoise(41, 4), g = makeNoise(43, 64);
  const base = hex(PALETTE.walnut);
  const { canvas, ctx, img, data } = surface(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const ring = Math.sin((v * 22 + n(u * 0.3, v, 3) * 6) * Math.PI) * 0.5 + 0.5;
      const k = ring * 0.22 + g(u * 0.05, v, 2) * 0.18;
      const c = mix(mix(base, [30, 20, 14], 0.4), mix(base, [120, 88, 62], 0.5), k + 0.25);
      const i = (y * size + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas, true);
}

/** Saturn's cloud bands, pole to pole, with soft turbulence and darker poles. */
export function saturnTexture(w = 1024, h = 512): Texture {
  const rand = rng(57), turb = makeNoise(59, 8), fine = makeNoise(61, 32);
  const tones = PALETTE.saturn.map(hex);
  // a band sequence: [start latitude 0..1, colour]
  const bands: { at: number; c: RGB }[] = [];
  for (let at = 0; at < 1; at += 0.012 + rand() * 0.05) bands.push({ at, c: tones[Math.floor(rand() * tones.length)] });
  const colourAt = (v: number): RGB => {
    let i = 0;
    while (i < bands.length - 1 && bands[i + 1].at <= v) i++;
    const a = bands[i], b = bands[Math.min(i + 1, bands.length - 1)];
    const span = (b.at - a.at) || 1;
    return mix(a.c, b.c, clamp((v - a.at) / span) ** 3);
  };
  const { canvas, ctx, img, data } = surface(w, h);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const pole = Math.abs(v - 0.5) * 2;                    // 0 at the equator, 1 at the poles
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const vv = clamp(v + (turb(u, v, 3) - 0.5) * 0.012);
      let c = colourAt(vv);
      c = mix(c, [255, 246, 226], (fine(u, v * 4, 2) - 0.5) * 0.12 + 0.02);
      c = mix(c, [120, 112, 104], smooth(0.7, 1, pole) * 0.55);  // greyer, darker polar caps
      const i = (y * w + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas, true, false);
}
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** The rings' radial profile: faint C ring, bright B ring, the Cassini division, the A ring and the Encke gap. */
export function ringTexture(w = 1024): Texture {
  const n = makeNoise(71, 128);
  const { canvas, ctx, img, data } = surface(w, 4);
  const span = SATURN.ringOut - SATURN.ringIn;
  for (let x = 0; x < w; x++) {
    const r = SATURN.ringIn + (x / (w - 1)) * span;
    let alpha: number;
    if (r < 1.53) alpha = 0.10 + 0.12 * smooth(1.24, 1.53, r);            // C ring
    else if (r < 1.95) alpha = 0.78 + 0.16 * Math.sin((r - 1.53) * 7);    // B ring
    else if (r < 2.03) alpha = 0.06;                                      // Cassini division
    else if (r > 2.212 && r < 2.222) alpha = 0.12;                        // Encke gap
    else alpha = 0.62 - 0.18 * smooth(2.2, 2.27, r);                      // A ring
    alpha = clamp(alpha * (0.82 + n(x / w, 0, 2) * 0.36));
    const c = mix([168, 156, 136], [226, 212, 186], clamp((r - 1.4) / 0.6));
    for (let y = 0; y < 4; y++) {
      const i = (y * w + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = alpha * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas, true, false);
}
