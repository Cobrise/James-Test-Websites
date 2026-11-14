import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PartBuilder } from './builder'
import { buildResidence, type InstanceSpec } from './buildResidence'
import { buildFurniture } from './furniture'
import type { MaterialLibrary } from '../materials/materials'

function Instanced({ spec, material }: { spec: InstanceSpec; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => new THREE.BoxGeometry(...spec.size), [spec])
  useLayoutEffect(() => {
    const mesh = ref.current!
    spec.matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    return () => geo.dispose()
  }, [spec, geo])
  return <instancedMesh ref={ref} args={[geo, material, spec.matrices.length]} castShadow={spec.cast} receiveShadow />
}

/**
 * The residence: all static architecture and furniture merged into one mesh
 * per material, plus instanced repeats (battens, screen fins, balusters).
 * Built once per canvas; geometry is disposed on unmount.
 */
export function Residence({ materials }: { materials: MaterialLibrary }) {
  const { meshes, instances } = useMemo(() => {
    const b = new PartBuilder()
    const instances = buildResidence(b)
    buildFurniture(b)
    return { meshes: b.build(), instances }
  }, [])
  useLayoutEffect(() => () => meshes.forEach((m) => m.geometry.dispose()), [meshes])

  return (
    <group>
      {meshes.map(({ key, geometry, cast }) => (
        <mesh
          key={`${key}-${cast}`}
          geometry={geometry}
          material={materials[key]}
          castShadow={cast && key !== 'glass'}
          receiveShadow={key !== 'glass' && key !== 'lightStrip' && key !== 'skyGlow'}
          renderOrder={key === 'glass' ? 2 : 0}
        />
      ))}
      {instances.map((spec, i) => (
        <Instanced key={i} spec={spec} material={materials[spec.key]} />
      ))}
    </group>
  )
}
