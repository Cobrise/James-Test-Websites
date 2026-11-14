import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cinemaProgress } from '../../scroll/progress'
import { buildCameraPath, createProgressMap, fovAt } from './cameraPath'

export interface PoseOverride {
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
}

interface Props {
  portrait: boolean
  compact: boolean
  /** Fine-pointer parallax (a few tenths of a degree). Off for touch / reduced motion. */
  parallax: boolean
  /** When set, the rig holds this pose (still capture). */
  override?: React.RefObject<PoseOverride | null>
}

const tmpPos = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()
const tmpDir = new THREE.Vector3()
const tmpRight = new THREE.Vector3()

/**
 * Drives the camera from the single scroll progress value. Rendering is on
 * demand: the rig invalidates only when progress changes or while the pointer
 * parallax is still settling, so an idle page renders nothing.
 */
export function CameraRig({ portrait, compact, parallax, override }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const invalidate = useThree((s) => s.invalidate)
  const path = useMemo(() => buildCameraPath(portrait), [portrait])
  const map = useMemo(() => createProgressMap(compact), [compact])
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 })

  useEffect(() => cinemaProgress.subscribe(() => invalidate()), [invalidate])
  useEffect(() => {
    invalidate()
  }, [path, map, invalidate])

  useEffect(() => {
    if (!parallax) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
      invalidate()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [parallax, invalidate])

  useFrame((_, delta) => {
    const o = override?.current
    if (o) {
      camera.position.set(...o.pos)
      camera.lookAt(...o.target)
      if (camera.fov !== o.fov) {
        camera.fov = o.fov
        camera.updateProjectionMatrix()
      }
      return
    }
    const u = map(cinemaProgress.smoothed)
    path.pos.getPoint(u, tmpPos)
    path.target.getPoint(u, tmpTarget)

    // Pointer parallax: shift the look-at target slightly sideways/up.
    const pr = pointer.current
    const k = 1 - Math.exp(-delta * 4)
    pr.sx += (pr.x - pr.sx) * k
    pr.sy += (pr.y - pr.sy) * k
    if (parallax) {
      const dist = tmpPos.distanceTo(tmpTarget)
      tmpDir.subVectors(tmpTarget, tmpPos).normalize()
      tmpRight.crossVectors(tmpDir, camera.up).normalize()
      tmpTarget.addScaledVector(tmpRight, pr.sx * dist * 0.012)
      tmpTarget.y -= pr.sy * dist * 0.008
      if (Math.abs(pr.x - pr.sx) > 0.002 || Math.abs(pr.y - pr.sy) > 0.002) invalidate()
    }

    camera.position.copy(tmpPos)
    camera.lookAt(tmpTarget)
    const fov = fovAt(path, u)
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
