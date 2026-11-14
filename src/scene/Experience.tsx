import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { createSceneTextures } from './materials/textures'
import { applyTimberFinish, createMaterials } from './materials/materials'
import { Residence } from './architecture/Residence'
import { Landscape } from './landscape/Landscape'
import { Lighting } from './lighting/Lighting'
import { CameraRig, type PoseOverride } from './camera/CameraRig'
import { restPose, stillViews } from './camera/cameraPath'
import { getState, subscribe } from '../state/store'
import type { QualityTier } from '../lib/capabilities'

export interface ExperienceProps {
  quality: QualityTier
  portrait: boolean
  compact: boolean
  parallax: boolean
  capture?: boolean
  onReady: () => void
  onFail: (reason: string) => void
}

/** Builds textures + materials once; keeps the timber finish in sync with the store. */
function useSceneMaterials(quality: QualityTier) {
  const invalidate = useThree((s) => s.invalidate)
  const lib = useMemo(() => {
    const t0 = performance.now()
    const textures = createSceneTextures(quality === 'high' ? 1024 : 512)
    performance.measure('stillwater-textures', { start: t0, end: performance.now() })
    const materials = createMaterials(textures, getState().timberFinish)
    return { textures, materials }
  }, [quality])
  useEffect(
    () =>
      subscribe(() => {
        applyTimberFinish(lib.materials.timberFeature, getState().timberFinish)
        invalidate()
      }),
    [lib, invalidate],
  )
  useLayoutEffect(
    () => () => {
      lib.materials.dispose()
      lib.textures.dispose()
    },
    [lib],
  )
  return lib.materials
}

/**
 * Signals readiness only after shaders are compiled and two real frames have
 * been drawn with the correct camera — so the canvas never reveals a frame of
 * unfinished geometry or a wrong viewpoint.
 */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera, invalidate } = useThree()
  const frames = useRef(0)
  const done = useRef(false)
  useEffect(() => {
    gl.compile(scene, camera)
    gl.shadowMap.needsUpdate = true
    invalidate()
  }, [gl, scene, camera, invalidate])
  useFrame(() => {
    if (done.current) return
    frames.current++
    if (frames.current < 3) {
      invalidate()
      return
    }
    done.current = true
    // Static scene: the sun's shadow map is rendered once, then frozen.
    gl.shadowMap.autoUpdate = false
    performance.mark('stillwater-scene-ready')
    if (import.meta.env.DEV) console.info(`[Stillwater] scene ready at ${Math.round(performance.now())} ms after navigation start`)
    onReady()
  })
  return null
}

/** Pauses all rendering while the stage is scrolled out of view or the tab is hidden. */
function VisibilityGate({ container }: { container: React.RefObject<HTMLDivElement | null> }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let inView = true
    const apply = () => {
      const on = inView && !document.hidden
      setFrameloop(on ? 'demand' : 'never')
      if (on) invalidate()
    }
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      apply()
    })
    if (container.current) io.observe(container.current)
    document.addEventListener('visibilitychange', apply)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', apply)
    }
  }, [container, setFrameloop, invalidate])
  return null
}

/** Dev-only still capture: window.__ff.snap('name') renders a pose to public/renders. */
function CaptureApi({ override }: { override: React.RefObject<PoseOverride | null> }) {
  const { gl, invalidate, advance } = useThree()
  useEffect(() => {
    const api = {
      poses: { ...Object.fromEntries([0, 1, 2, 3, 4].map((i) => [`chapter-${i + 1}`, restPose(i)])), ...stillViews },
      view(pos: [number, number, number], target: [number, number, number], fov = 40) {
        override.current = { pos, target, fov }
        invalidate()
      },
      release() {
        override.current = null
        invalidate()
      },
      pose(name: string) {
        const p = (api.poses as Record<string, PoseOverride>)[name]
        if (!p) throw new Error(`unknown pose ${name}`)
        override.current = p
        invalidate()
      },
      async snap(file: string, quality = 0.86) {
        // Drive the normal render loop (camera rig + post-processing) by hand
        // so the captured frame is never one pose behind, even when the page
        // is not being composited; preserveDrawingBuffer keeps it readable.
        for (let i = 0; i < 3; i++) advance(performance.now() + i * 16)
        await new Promise((r) => setTimeout(r, 50))
        const type = file.endsWith('.jpg') ? 'image/jpeg' : 'image/webp'
        const blob: Blob = await new Promise((r) => gl.domElement.toBlob((b) => r(b!), type, quality))
        const res = await fetch(`/__capture/${file}`, { method: 'POST', body: blob })
        return `${res.status} ${blob.size}`
      },
    }
    ;(window as unknown as { __ff: typeof api }).__ff = api
  }, [gl, invalidate, advance, override])
  return null
}

function Scene({ quality, portrait, compact, parallax, capture, onReady }: ExperienceProps) {
  const materials = useSceneMaterials(quality)
  const override = useRef<PoseOverride | null>(null)
  return (
    <>
      <fog attach="fog" args={['#4f5660', 45, 250]} />
      <Lighting quality={quality} />
      <Residence materials={materials} />
      <Landscape materials={materials} quality={quality} />
      <CameraRig portrait={portrait} compact={compact} parallax={parallax} override={override} />
      <ReadySignal onReady={onReady} />
      {capture && <CaptureApi override={override} />}
    </>
  )
}

function Effects({ degraded }: { degraded: boolean }) {
  return (
    <EffectComposer multisampling={degraded ? 0 : 4}>
      <N8AO
        enabled={!degraded}
        halfRes
        quality="medium"
        aoRadius={1.1}
        distanceFalloff={0.7}
        intensity={2.4}
        color="#120d0a"
      />
      <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.2} intensity={0.32} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.42} />
    </EffectComposer>
  )
}

export default function Experience(props: ExperienceProps) {
  const { quality, capture, onFail } = props
  const container = useRef<HTMLDivElement>(null)
  const [degraded, setDegraded] = useState(false)
  const first = restPose(0, props.portrait)
  const maxDpr = quality === 'high' ? (degraded ? 1 : 1.75) : 1.5

  return (
    <div ref={container} className="experience-canvas">
      <Canvas
        frameloop="demand"
        dpr={capture ? 1 : [1, maxDpr]}
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: first.pos, fov: first.fov, near: 0.05, far: 900 }}
        gl={{
          antialias: quality === 'low',
          powerPreference: 'high-performance',
          preserveDrawingBuffer: !!capture,
          stencil: false,
        }}
        onCreated={({ gl, camera }) => {
          camera.lookAt(...first.target)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            onFail('WebGL context lost')
          })
        }}
        aria-hidden="true"
      >
        <VisibilityGate container={container} />
        {quality === 'high' && !capture && (
          <PerformanceMonitor flipflops={2} onDecline={() => setDegraded(true)} />
        )}
        <Scene {...props} />
        {quality === 'high' && <Effects degraded={degraded} />}
      </Canvas>
    </div>
  )
}
