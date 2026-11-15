import * as THREE from 'three'
import { TEXTURE_METRES, type SceneTextures, type TextureSet } from './textures'
import { timberFinishById, type TimberFinishId } from './presets'

/**
 * Material library. Every architectural part references one of these keys, so
 * the builder can merge geometry per material (one draw call per material).
 * `uvMetres` tells the builder the physical size one texture repeat covers.
 */
export type MaterialKey =
  | 'timber'
  | 'timberFeature'
  | 'timberCladding'
  | 'stone'
  | 'floor'
  | 'plaster'
  | 'basalt'
  | 'bronze'
  | 'glass'
  | 'fabric'
  | 'fabricDark'
  | 'rug'
  | 'ceramicLight'
  | 'ceramicDark'
  | 'shadowGap'
  | 'lightStrip'
  | 'upperGlow'
  | 'ground'
  | 'water'
  | 'soffit'
  | 'skyGlow'

export const uvMetres: Record<MaterialKey, number> = {
  timber: TEXTURE_METRES.timber,
  timberFeature: TEXTURE_METRES.timber,
  timberCladding: TEXTURE_METRES.timber,
  soffit: TEXTURE_METRES.timber,
  stone: TEXTURE_METRES.stone,
  floor: TEXTURE_METRES.floor,
  plaster: TEXTURE_METRES.plaster,
  basalt: TEXTURE_METRES.basalt,
  bronze: 1,
  glass: 1,
  fabric: TEXTURE_METRES.fabric,
  fabricDark: TEXTURE_METRES.fabric,
  rug: TEXTURE_METRES.rug,
  ceramicLight: 1,
  ceramicDark: 1,
  shadowGap: 1,
  lightStrip: 1,
  upperGlow: 1,
  ground: TEXTURE_METRES.ground,
  water: 1,
  skyGlow: 1,
}

function std(set: TextureSet | null, params: THREE.MeshStandardMaterialParameters, normal = 1) {
  const m = new THREE.MeshStandardMaterial({
    ...params,
    map: set?.map ?? null,
    normalMap: set?.normalMap ?? null,
    roughnessMap: set?.roughnessMap ?? null,
  })
  if (set) m.normalScale.set(normal, normal)
  return m
}

export type MaterialLibrary = Record<MaterialKey, THREE.Material> & { dispose(): void }

export function createMaterials(tex: SceneTextures, finish: TimberFinishId): MaterialLibrary {
  const f = timberFinishById[finish]
  const lib: Record<MaterialKey, THREE.Material> = {
    // Smoked oak: feature wall, door, furniture frames, soffit.
    timber: std(tex.timber, { color: '#7a5640', roughness: 0.6 }, 0.55),
    // Selectable finish: stair treads + stair-hall bench only.
    timberFeature: std(tex.timber, { color: f.color, roughness: f.roughness }, f.normalScale),
    // Exterior battens: dark weathered timber (palette "Timber" #493329).
    timberCladding: std(tex.timber, { color: '#5a4134', roughness: 0.78 }, 0.8),
    soffit: std(tex.timber, { color: '#8a6448', roughness: 0.64 }, 0.4),
    // Honed limestone walls.
    stone: std(tex.stone, { color: '#e2dbcd', roughness: 0.72 }, 0.5),
    // Honed limestone floor tiles (slightly warmer, a touch more polished).
    floor: std(tex.floor, { color: '#d9d0c0', roughness: 0.5 }, 0.45),
    plaster: std(tex.plaster, { color: '#e9e3d8', roughness: 0.92 }, 0.25),
    basalt: std(tex.basalt, { color: '#6f6c66', roughness: 0.82 }, 0.6),
    // Brushed bronze (palette "Warm metal" #A68B68).
    bronze: new THREE.MeshStandardMaterial({ color: '#a68b68', metalness: 0.85, roughness: 0.38 }),
    // Glass: a thin transparent sheet with environment reflections. No
    // transmission pass — reliable and cheap, and it never sorts unstably
    // because each pane is a separate, flat, depth-tested surface.
    glass: new THREE.MeshPhysicalMaterial({
      color: '#c9d4d2',
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.09,
      envMapIntensity: 1.1,
      depthWrite: false,
      side: THREE.DoubleSide,
      reflectivity: 0.6,
    }),
    fabric: std(tex.fabric, { color: '#cfc6b6', roughness: 0.95 }, 0.6),
    fabricDark: std(tex.fabric, { color: '#6b5c4f', roughness: 0.95 }, 0.7),
    rug: std(tex.rug, { color: '#bdb2a0', roughness: 1 }, 0.9),
    ceramicLight: new THREE.MeshStandardMaterial({ color: '#d8d1c4', roughness: 0.55 }),
    ceramicDark: new THREE.MeshStandardMaterial({ color: '#3b3632', roughness: 0.45 }),
    shadowGap: new THREE.MeshStandardMaterial({ color: '#0d0d0c', roughness: 1 }),
    // Linear LED: emissive only; intensity is pushed above 1 so a subtle bloom
    // picks it up on the high tier.
    lightStrip: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: '#ffc58a',
      emissiveIntensity: 3.2,
      toneMapped: true,
    }),
    // Warm glow seen through the upper-floor windows (rooms not modelled
    // inside; the panel sits behind the glazing like a lit interior wall).
    upperGlow: new THREE.MeshStandardMaterial({
      color: '#2a1d14',
      emissive: '#e7a56a',
      emissiveIntensity: 0.55,
      roughness: 0.9,
    }),
    // Seen through the skylight from below: bright evening sky.
    skyGlow: new THREE.MeshBasicMaterial({ color: '#f3e6d2' }),
    ground: std(tex.ground, { color: '#6d7262', roughness: 0.98 }, 0.8),
    water: new THREE.MeshStandardMaterial({ color: '#0f1514', roughness: 0.06, metalness: 0.1 }),
  }
  return Object.assign(lib, {
    dispose() {
      // Only the materials: `dispose` itself is attached to the same object.
      Object.values(lib).forEach((m) => {
        if (m instanceof THREE.Material) m.dispose()
      })
    },
  })
}

/** Applies a timber finish to an existing timberFeature material in place. */
export function applyTimberFinish(mat: THREE.Material, finish: TimberFinishId) {
  const f = timberFinishById[finish]
  const m = mat as THREE.MeshStandardMaterial
  m.color.set(f.color)
  m.roughness = f.roughness
  m.normalScale.set(f.normalScale, f.normalScale)
}
