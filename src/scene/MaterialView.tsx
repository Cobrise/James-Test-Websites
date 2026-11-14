import { useEffect, useLayoutEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { createSceneTextures } from './materials/textures'
import { applyTimberFinish, createMaterials } from './materials/materials'
import { PartBuilder } from './architecture/builder'
import { getState, subscribe } from '../state/store'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

RectAreaLightUniformsLib.init()

/**
 * Dedicated material sample: one stair tread exactly as built in the house
 * (1.1 m × 280 mm × 80 mm oak, 6 mm arrises) cantilevered from a honed
 * limestone wall, with a bronze baluster and a limestone floor below.
 * Rendered on demand — it only redraws when the finish changes.
 */
function Sample() {
  const invalidate = useThree((s) => s.invalidate)
  const { materials, textures, meshes } = useMemo(() => {
    const textures = createSceneTextures(512)
    const materials = createMaterials(textures, getState().timberFinish)
    const b = new PartBuilder()
    b.span('stone', [-0.3, -1.2, -1.2], [0, 1.6, 1.2]) // wall
    b.span('shadowGap', [0, -0.42, -1.2], [0.12, -0.4, 1.2], { cast: false }) // floor slot
    b.span('floor', [0.12, -0.6, -1.2], [2.4, -0.4, 1.2]) // floor
    b.span('floor', [0, -0.6, -1.2], [0.12, -0.43, 1.2])
    b.box('timberFeature', [0.54, 0.36, 0], [1.1, 0.08, 0.31], { bevel: 0.006, grain: 'x' }) // tread
    b.box('timberFeature', [0.54, 0.535, -0.28], [1.1, 0.08, 0.31], { bevel: 0.006, grain: 'x' }) // next tread up
    b.span('bronze', [1.05, 0.4, 0.07], [1.064, 1.3, 0.084]) // baluster
    b.span('bronze', [1.05, 0.575, -0.21], [1.064, 1.45, -0.196])
    b.span('lightStrip', [0.02, -0.425, -1.2], [0.1, -0.41, 1.2], { cast: false })
    return { materials, textures, meshes: b.build() }
  }, [])

  useEffect(
    () =>
      subscribe(() => {
        applyTimberFinish(materials.timberFeature, getState().timberFinish)
        invalidate()
      }),
    [materials, invalidate],
  )
  useLayoutEffect(
    () => () => {
      meshes.forEach((m) => m.geometry.dispose())
      materials.dispose()
      textures.dispose()
    },
    [meshes, materials, textures],
  )

  return (
    <>
      {meshes.map(({ key, geometry, cast }) => (
        <mesh key={`${key}-${cast}`} geometry={geometry} material={materials[key]} castShadow={cast} receiveShadow />
      ))}
      <spotLight
        position={[2.2, 2.6, 1.4]}
        angle={0.5}
        penumbra={0.9}
        intensity={42}
        color="#ffc690"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <rectAreaLight position={[0.06, -0.39, 0]} width={0.06} height={2.4} intensity={10} color="#ffb978" rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
      <ambientLight intensity={0.08} />
      <Environment resolution={64} frames={1} environmentIntensity={0.45}>
        <Lightformer form="rect" intensity={2} color="#ffd9b0" scale={[6, 3, 1]} position={[4, 3, 3]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#9fb0c0" scale={[10, 10, 1]} position={[0, 6, 0]} rotation-x={Math.PI / 2} />
      </Environment>
    </>
  )
}

export default function MaterialView({ onFail }: { onFail: () => void }) {
  return (
    <Canvas
      className="material-view"
      frameloop="demand"
      dpr={[1, 1.75]}
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ position: [2.4, 1.05, 1.7], fov: 30, near: 0.05, far: 30 }}
      gl={{ antialias: true, powerPreference: 'default' }}
      onCreated={({ camera, gl, scene }) => {
        camera.lookAt(0.45, 0.32, -0.1)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        scene.background = new THREE.Color('#151614')
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onFail()
        })
      }}
      aria-hidden="true"
    >
      <Sample />
    </Canvas>
  )
}
