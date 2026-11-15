import { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { renderToStaticMarkup } from 'react-dom/server'
import * as THREE from 'three'
import { modelUrl } from '../landscape/gltfGeometry'
import { D } from './dimensions'
import { CourtyardDrawing, RidgePavilionDrawing } from '../../components/drawings/Drawings'

/**
 * Furniture, objects and artwork from Poly Haven (CC0), compressed into
 * public/models (scripts/optimize-models.mjs). Each piece is a clone of its
 * loaded glTF scene placed by hand. The picture frames carry FORM / FIELD's
 * own concept drawings instead of Poly Haven's sample artwork.
 *
 * Plan reference (dimensions.ts): living gallery x −2.9…3.5, sofa faces the
 * south glazing, timber feature wall at z −4.95, vestibule plaster wall at
 * x −5.8, stair-hall back wall at z −4.98.
 */

const F = D.floor
type V3 = [number, number, number]

interface Placement {
  id: string
  pos: V3
  yaw?: number
  scale?: number
  /** Override the colour of every material (e.g. tone a fabric). */
  tint?: string
}

const deg = THREE.MathUtils.degToRad

const PIECES: Placement[] = [
  // Seating group
  { id: 'throw_pillows_01', pos: [-0.95, F + 0.44, -2.38], yaw: deg(8) },
  { id: 'throw_pillows_01', pos: [1.0, F + 0.44, -2.38], yaw: deg(-172), scale: 0.95 },
  { id: 'mid_century_lounge_chair', pos: [-1.15, F, 1.35], yaw: deg(180 - 14) },
  { id: 'mid_century_lounge_chair', pos: [1.15, F, 1.35], yaw: deg(180 + 14) },
  { id: 'modern_coffee_table_01', pos: [0, F, -0.35], yaw: deg(90) },
  { id: 'side_table_01', pos: [-2.0, F, -2.2] },
  // Objects
  { id: 'ceramic_vase_02', pos: [0.3, F + 0.39, -0.48], scale: 0.9 },
  { id: 'wooden_bowl_02', pos: [-0.3, F + 0.39, -0.28], scale: 2.4 },
  { id: 'ceramic_vase_04', pos: [-2.0, F + 0.45, -2.25], scale: 0.85 },
  { id: 'potted_plant_02', pos: [-2.35, F, 3.1], yaw: deg(40), scale: 1.35 },
  // Low cabinet against the timber wall, with ceramics on top
  { id: 'modern_wooden_cabinet', pos: [-0.6, F, -4.66] },
  { id: 'ceramic_vase_01', pos: [-1.35, F + 0.68, -4.72] },
  { id: 'ceramic_vase_03', pos: [-1.08, F + 0.68, -4.66] },
  { id: 'wooden_bowl_02', pos: [0.4, F + 0.68, -4.7], scale: 2 },
  // Vessel on the stone plinth framed by the entrance door
  { id: 'ceramic_vase_01', pos: [-4.5, F + 0.8, -4.35], scale: 1.4 },
]

/** Where the framed drawings hang. Frames face +z by default. */
const ART: (Placement & { art: 'ridge' | 'courtyard' })[] = [
  // Above the cabinet on the timber wall: the long Ridge Pavilion elevation.
  { id: 'hanging_picture_frame_02', pos: [-0.6, F + 1.72, -4.935], scale: 2.3, art: 'ridge' },
  // Vestibule plaster wall, facing the living room.
  { id: 'hanging_picture_frame_01', pos: [-5.79, F + 1.5, -1.2], yaw: deg(90), scale: 1.35, art: 'courtyard' },
  // Stair hall back wall, washed by the skylight.
  { id: 'hanging_picture_frame_01', pos: [5.2, F + 1.55, -4.965], scale: 1.45, art: 'ridge' },
]

/** Renders one of the studio's SVG drawings onto paper as a canvas texture. */
function drawingTexture(kind: 'ridge' | 'courtyard', w: number, h: number) {
  const el =
    kind === 'ridge' ? <RidgePavilionDrawing title="Ridge Pavilion" /> : <CourtyardDrawing title="Courtyard No. 04" />
  const svg = renderToStaticMarkup(el)
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" style="color:#2b2a26" ')
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ece6da'
  ctx.fillRect(0, 0, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const img = new Image()
  img.onload = () => {
    // Generous paper margins, like a mounted print.
    const m = Math.min(w, h) * 0.14
    const scale = Math.min((w - 2 * m) / img.width, (h - 2 * m) / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    tex.needsUpdate = true
  }
  img.width = kind === 'ridge' ? 1500 : 1000
  img.height = kind === 'ridge' ? 450 : 1000
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return tex
}

function prepare(scene: THREE.Object3D, tint?: string) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    m.castShadow = true
    m.receiveShadow = true
    const mats = Array.isArray(m.material) ? m.material : [m.material]
    mats.forEach((mat) => {
      const s = mat as THREE.MeshStandardMaterial
      s.envMapIntensity = 0.5
      if (s.transparent && !s.name.includes('glass')) {
        s.transparent = false
        s.alphaTest = 0.45
        s.side = THREE.DoubleSide
      }
      if (tint) s.color.set(tint)
    })
  })
}

function Piece({ p }: { p: Placement }) {
  const gltf = useGLTF(modelUrl(p.id), false, true)
  const obj = useMemo(() => {
    const c = gltf.scene.clone(true)
    prepare(c, p.tint)
    return c
  }, [gltf, p.tint])
  return <primitive object={obj} position={p.pos} rotation={[0, p.yaw ?? 0, 0]} scale={p.scale ?? 1} />
}

function Artwork({ p }: { p: (typeof ART)[number] }) {
  const gltf = useGLTF(modelUrl(p.id), false, true)
  const obj = useMemo(() => {
    const c = gltf.scene.clone(true)
    prepare(c)
    const portrait = p.id.endsWith('_01')
    const tex = drawingTexture(p.art, portrait ? 768 : 1024, portrait ? 1024 : 640)
    const swap = (mat: THREE.Material) => {
      if (mat.name.includes('glass')) {
        return new THREE.MeshPhysicalMaterial({
          color: '#ffffff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.1,
          depthWrite: false, envMapIntensity: 0.6,
        })
      }
      if (!mat.name.includes('artwork')) return mat
      const art = (mat as THREE.MeshStandardMaterial).clone()
      art.map = tex
      art.color.set('#ffffff')
      art.roughness = 0.9
      return art
    }
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material)
    })
    return c
  }, [gltf, p])
  return <primitive object={obj} position={p.pos} rotation={[0, p.yaw ?? 0, 0]} scale={p.scale ?? 1} />
}

/** Pendant over the side table: lamp model, a slim cord to the ceiling and a warm bulb. */
function Pendant() {
  const gltf = useGLTF(modelUrl('modern_ceiling_lamp_01'), false, true)
  const obj = useMemo(() => {
    const c = gltf.scene.clone(true)
    prepare(c)
    return c
  }, [gltf])
  const x = -2.0
  const z = -2.2
  const s = 0.8
  const y = F + 2.05 // shade bottom ≈ 2.2 m above the floor, above eye level
  const cordTop = D.ceil
  const cordBottom = y + 0.53 * s
  const cord = useMemo(() => new THREE.CylinderGeometry(0.004, 0.004, cordTop - cordBottom, 6), [cordTop, cordBottom])
  useLayoutEffect(() => () => cord.dispose(), [cord])
  return (
    <group>
      <primitive object={obj} position={[x, y, z]} scale={s} />
      <mesh geometry={cord} position={[x, (cordTop + cordBottom) / 2, z]}>
        <meshStandardMaterial color="#1a1a18" roughness={0.6} />
      </mesh>
      <pointLight position={[x, y + 0.32 * s, z]} intensity={2.2} distance={4.5} decay={2} color="#ffbf7a" />
    </group>
  )
}

export function Interior() {
  return (
    <>
      {PIECES.map((p, i) => (
        <Piece key={i} p={p} />
      ))}
      {ART.map((p, i) => (
        <Artwork key={i} p={p} />
      ))}
      <Pendant />
    </>
  )
}

for (const id of new Set([...PIECES, ...ART].map((p) => p.id).concat('modern_ceiling_lamp_01'))) {
  useGLTF.preload(modelUrl(id), false, true)
}
