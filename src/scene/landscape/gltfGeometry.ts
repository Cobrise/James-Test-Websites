import * as THREE from 'three'

/**
 * Clones a mesh geometry as plain Float32 attributes.
 *
 * The optimised models use KHR_mesh_quantization (positions, normals and UVs
 * stored as normalised integers) and may be interleaved. Baking a transform
 * into such attributes would clamp them, so we expand to floats first.
 */
export function floatGeometry(src: THREE.BufferGeometry) {
  const g = new THREE.BufferGeometry()
  if (src.index) g.setIndex(src.index.clone())
  for (const [name, attr] of Object.entries(src.attributes)) {
    const a = attr as THREE.BufferAttribute | THREE.InterleavedBufferAttribute
    const size = a.itemSize
    const out = new Float32Array(a.count * size)
    for (let i = 0; i < a.count; i++) {
      out[i * size] = a.getX(i)
      if (size > 1) out[i * size + 1] = a.getY(i)
      if (size > 2) out[i * size + 2] = a.getZ(i)
      if (size > 3) out[i * size + 3] = a.getW(i)
    }
    g.setAttribute(name, new THREE.BufferAttribute(out, size))
  }
  return g
}

/** Path to an optimised model in public/models (see scripts/optimize-models.mjs). */
export const modelUrl = (id: string) => `${import.meta.env.BASE_URL}models/${id}.glb`
