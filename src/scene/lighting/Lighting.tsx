import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { Environment, Lightformer } from '@react-three/drei'
import { SUN_COLOR, SUN_DIRECTION } from './sun'
import { D, stairBottomZ } from '../architecture/dimensions'

RectAreaLightUniformsLib.init()

/**
 * Orientation note: a light aimed (near-)vertically takes its local X axis
 * from Object3D.lookAt's up-vector maths, so each target is nudged slightly
 * along Z to keep `width` running along world X (and along Z for the floor slot).
 *
 * Lighting plan
 *  - Sun: the single shadow-casting light (directional, low WSW).
 *  - Environment: a one-time, locally generated cube map from Lightformers
 *    (no HDR file download) for soft sky fill and believable reflections.
 *  - Warm interior sources: rectangular area lights placed exactly where the
 *    visible linear LEDs are — feature-wall washer, glazing line, porch,
 *    stair-hall floor slot and the skylight. Area lights are soft by nature
 *    and cost no shadow maps.
 */
interface AreaProps {
  position: [number, number, number]
  target: [number, number, number]
  width: number
  height: number
  intensity: number
  color?: string
}

function Area({ position, target, width, height, intensity, color = '#ffb978' }: AreaProps) {
  const ref = useRef<THREE.RectAreaLight>(null)
  useLayoutEffect(() => {
    ref.current?.lookAt(...target)
  }, [target])
  return <rectAreaLight ref={ref} position={position} width={width} height={height} intensity={intensity} color={color} />
}

export function Lighting({ quality }: { quality: 'high' | 'low' }) {
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const sunPos = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(60).add(new THREE.Vector3(-1, 0, 2)), [])

  useLayoutEffect(() => {
    target.position.set(-1, 0, 2)
    target.updateMatrixWorld()
    if (sunRef.current) sunRef.current.target = target
  }, [target])

  const { floor: F, ceil: C, upperCeil: UC } = D
  const shadowSize = quality === 'high' ? 4096 : 2048

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={sunRef}
        position={sunPos}
        intensity={2.6}
        color={SUN_COLOR}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
        shadow-camera-near={20}
        shadow-camera-far={110}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={['#8296ab', '#2e2a24', 0.5]} />

      {/* Living gallery: washer grazing the timber feature wall. */}
      <Area position={[-1.15, C - 0.03, -4.7]} target={[-1.15, F, -4.45]} width={9.2} height={0.12} intensity={14} />
      {/* Living gallery: linear light along the glazing. */}
      <Area position={[0.35, C - 0.03, 3.3]} target={[0.35, F, 2.6]} width={5.9} height={0.1} intensity={12} />
      {/* Soft general fill from the ceiling plane (indirect bounce stand-in). */}
      <Area position={[-0.5, C - 0.05, -0.6]} target={[-0.5, F, -0.5]} width={7} height={5} intensity={0.9} color="#ffd2a6" />
      {/* Porch downlight. */}
      <Area position={[-4.5, C - 0.03, 3.33]} target={[-4.5, F, 3.2]} width={1.8} height={0.1} intensity={18} />
      {/* Stair hall: low-ceiling line light by the glazing. */}
      <Area position={[5.75, C - 0.03, 3.3]} target={[5.75, F, 2.7]} width={3.9} height={0.1} intensity={12} />
      {/* Stair hall: floor slot grazing the stone wall upward. */}
      <Area
        position={[7.95, F + 0.01, (stairBottomZ - 0.6 + 3.86) / 2]}
        target={[8.6, F + 3, (stairBottomZ - 0.6 + 3.86) / 2]}
        width={8.7}
        height={0.08}
        intensity={22}
      />
      {/* Skylight: cool-warm daylight washing down the back wall. */}
      <Area
        position={[(D.skylight.x0 + D.skylight.x1) / 2, UC - 0.05, (D.skylight.z0 + D.skylight.z1) / 2]}
        target={[(D.skylight.x0 + D.skylight.x1) / 2, F, (D.skylight.z0 + D.skylight.z1) / 2 - 0.4]}
        width={D.skylight.x1 - D.skylight.x0}
        height={D.skylight.z1 - D.skylight.z0}
        intensity={7}
        color="#ffe7cc"
      />
      {/* Under the cantilever: soffit downlights washing the deck and water. */}
      <Area position={[5.75, C - 0.04, 6.8]} target={[5.75, F, 6.9]} width={4.6} height={4.6} intensity={2.2} color="#ffc188" />
      {/* Upper landing doorway glow spilling onto the landing. */}
      <pointLight position={[5.6, D.upperFloor + 2.0, 2.9]} intensity={4} distance={6} decay={2} color="#ffb070" />

      <Environment resolution={quality === 'high' ? 256 : 128} frames={1} environmentIntensity={0.8}>
        <color attach="background" args={['#18212b']} />
        {/* Sky dome overhead. */}
        <Lightformer form="rect" intensity={0.9} color="#93a3b3" scale={[60, 60, 1]} position={[0, 30, 0]} rotation-x={Math.PI / 2} />
        {/* Low sun glow toward WSW. */}
        <Lightformer form="rect" intensity={3.4} color="#ffc58a" scale={[30, 8, 1]} position={SUN_DIRECTION.clone().multiplyScalar(40).toArray()} target={[0, 0, 0]} />
        {/* Horizon band. */}
        <Lightformer form="ring" intensity={0.35} color="#b9a98f" scale={[80, 80, 1]} position={[0, 2, 0]} rotation-x={Math.PI / 2} />
        {/* Dark forest floor. */}
        <Lightformer form="rect" intensity={0.15} color="#2b2a22" scale={[60, 60, 1]} position={[0, -10, 0]} rotation-x={-Math.PI / 2} />
      </Environment>
    </>
  )
}
