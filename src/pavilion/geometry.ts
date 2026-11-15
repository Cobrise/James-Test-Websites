/* Small geometry helpers: boxes from extents, world-scaled UVs, and merging parts into one mesh. */
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Matrix4, Shape, Vector2 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A box given by its extents. */
export function span(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): BufferGeometry {
  const g = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/**
 * UVs from world position, projected along each face's main axis, so a texture keeps the same real-world
 * scale on every part (`metres` = one texture repeat).
 */
export function worldUV<T extends BufferGeometry>(g: T, metres: number): T {
  const p = g.getAttribute('position'), n = g.getAttribute('normal');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u: number, v: number;
    if (az >= ax && az >= ay) { u = p.getX(i); v = p.getY(i); }
    else if (ax >= ay) { u = p.getY(i); v = p.getZ(i); }
    else { u = p.getX(i); v = p.getZ(i); }
    uv[i * 2] = u / metres; uv[i * 2 + 1] = v / metres;
  }
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return g;
}

/** Merge parts that share a material into one geometry. */
export function merge(parts: BufferGeometry[]): BufferGeometry {
  const flat = parts.map(g => (g.index ? g.toNonIndexed() : g));
  for (const g of flat) for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  const merged = mergeGeometries(flat, false);
  if (!merged) throw new Error('pavilion: parts could not be merged');
  parts.forEach(g => g.dispose());
  return merged;
}

/** A closed 2D outline from points. */
export function outline(points: [number, number][]): Shape {
  return new Shape(points.map(([x, y]) => new Vector2(x, y)));
}

/**
 * Turn geometry drawn in a side-view plane (x = along the object, y = up, z = across) into the world,
 * with "along" running down -Y and "across" along X, centred on its depth.
 */
export function sideViewToWorld(depth: number): Matrix4 {
  return new Matrix4().set(
    0, 0, -1, depth / 2,
    -1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 0, 1,
  );
}
