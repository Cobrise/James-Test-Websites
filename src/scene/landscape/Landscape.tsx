import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { terrainHeight } from './terrain'
import { coniferInstances, planConifers } from './trees'
import { createTreelineTexture, TEXTURE_METRES } from '../materials/textures'
import type { MaterialLibrary } from '../materials/materials'
import { D } from '../architecture/dimensions'
import { SUN_DIRECTION } from '../lighting/sun'

interface Props {
  materials: MaterialLibrary
  quality: 'high' | 'low'
}

function Terrain({ material }: { material: THREE.Material }) {
  const geo = useMemo(() => {
    const size = 420
    const seg = 140
    const g = new THREE.PlaneGeometry(size, size, seg, seg)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, terrainHeight(x, z))
      uv.setXY(i, x / TEXTURE_METRES.ground, z / TEXTURE_METRES.ground)
    }
    g.computeVertexNormals()
    return g
  }, [])
  useLayoutEffect(() => () => geo.dispose(), [geo])
  return <mesh geometry={geo} material={material} receiveShadow />
}

function Conifers({ density }: { density: number }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const tierRef = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(() => coniferInstances(planConifers(density)), [density])
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.55, 1, 1, 6, 1), [])
  const tierGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(1, 1, 9, 1)
    // Droop the tier's skirt slightly so branches read as hanging, not flat.
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) < -0.49) p.setY(i, -0.5 - 0.08 * Math.abs(Math.sin(i * 2.1)))
    }
    g.computeVertexNormals()
    return g
  }, [])
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a221d', roughness: 1 }), [])
  const tierMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }), [])
  useLayoutEffect(() => {
    data.trunks.forEach((m, i) => trunkRef.current!.setMatrixAt(i, m))
    data.tiers.forEach((m, i) => {
      tierRef.current!.setMatrixAt(i, m)
      tierRef.current!.setColorAt(i, data.tierColors[i])
    })
    trunkRef.current!.instanceMatrix.needsUpdate = true
    tierRef.current!.instanceMatrix.needsUpdate = true
    if (tierRef.current!.instanceColor) tierRef.current!.instanceColor.needsUpdate = true
    trunkRef.current!.computeBoundingSphere()
    tierRef.current!.computeBoundingSphere()
  }, [data])
  useLayoutEffect(
    () => () => {
      trunkGeo.dispose()
      tierGeo.dispose()
      trunkMat.dispose()
      tierMat.dispose()
    },
    [trunkGeo, tierGeo, trunkMat, tierMat],
  )
  return (
    <>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, data.trunks.length]} castShadow receiveShadow />
      <instancedMesh ref={tierRef} args={[tierGeo, tierMat, data.tiers.length]} castShadow receiveShadow />
    </>
  )
}

/**
 * Distant forest: three concentric tree-line bands drawn as alpha
 * silhouettes. Linear fog lightens each successive band, giving the layered,
 * atmospheric depth of a wooded valley at dusk.
 */
function ForestLayers() {
  const layers = useMemo(
    () =>
      [
        { r: 75, h: 30, y: -3, seed: 3, repeat: 5, color: '#121815' },
        { r: 115, h: 40, y: -4, seed: 5, repeat: 7, color: '#131916' },
        { r: 165, h: 52, y: -6, seed: 8, repeat: 9, color: '#141a17' },
      ].map((l) => {
        const tex = createTreelineTexture(l.seed)
        tex.repeat.set(l.repeat, 1)
        const geo = new THREE.CylinderGeometry(l.r, l.r, l.h, 96, 1, true)
        geo.translate(0, l.y + l.h / 2, 0)
        // Seat each band on the slope: lift it by the terrain height beneath.
        const p = geo.attributes.position
        for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + terrainHeight(p.getX(i), p.getZ(i)))
        const mat = new THREE.MeshBasicMaterial({
          color: l.color,
          alphaMap: tex,
          alphaTest: 0.5,
          side: THREE.BackSide,
          fog: true,
        })
        return { geo, mat, tex }
      }),
    [],
  )
  useLayoutEffect(
    () => () =>
      layers.forEach((l) => {
        l.geo.dispose()
        l.mat.dispose()
        l.tex.dispose()
      }),
    [layers],
  )
  return (
    <>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.geo} material={l.mat} renderOrder={-1} />
      ))}
    </>
  )
}

/** Sky dome: warm haze toward the low sun, cooling to slate overhead. */
function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          sunDir: { value: SUN_DIRECTION.clone() },
          zenith: { value: new THREE.Color('#1f2e40') },
          horizon: { value: new THREE.Color('#9a8a78') },
          glow: { value: new THREE.Color('#f0a964') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 sunDir; uniform vec3 zenith; uniform vec3 horizon; uniform vec3 glow;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 col = mix(horizon, zenith, pow(smoothstep(-0.02, 0.6, h), 0.7));
            float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
            col += glow * (pow(s, 6.0) * 0.55 + pow(s, 64.0) * 0.6) * smoothstep(-0.1, 0.25, 1.0 - h);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useLayoutEffect(() => () => mat.dispose(), [mat])
  return (
    <mesh material={mat} renderOrder={-2} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  )
}

function Water({ quality, material }: { quality: 'high' | 'low'; material: THREE.Material }) {
  const P = D.pool
  const w = P.x1 - P.x0
  const d = P.z1 - P.z0
  return (
    <mesh rotation-x={-Math.PI / 2} position={[(P.x0 + P.x1) / 2, P.water, (P.z0 + P.z1) / 2]} receiveShadow userData={{ keepInClay: true }}>
      <planeGeometry args={[w, d]} />
      {quality === 'high' ? (
        <MeshReflectorMaterial
          resolution={1024}
          mirror={0.92}
          mixBlur={0.6}
          mixStrength={3.2}
          blur={[120, 40]}
          roughness={0.08}
          metalness={0.1}
          depthScale={0}
          color="#1a2120"
          envMapIntensity={0.4}
        />
      ) : (
        <primitive object={material} attach="material" />
      )}
    </mesh>
  )
}

export function Landscape({ materials, quality }: Props) {
  return (
    <>
      <Sky />
      <ForestLayers />
      <Terrain material={materials.ground} />
      <Conifers density={quality === 'high' ? 1 : 0.6} />
      <Water quality={quality} material={materials.water} />
    </>
  )
}
