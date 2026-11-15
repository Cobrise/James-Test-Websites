import * as THREE from 'three'
import { PartBuilder } from './builder'
import { D } from './dimensions'

/**
 * Procedural pieces that remain in the living gallery: the hand-loomed rug and
 * (until a modern sofa model is chosen) the low 3.2 m sofa from v1. All other
 * furniture, objects and artwork are Poly Haven models in Interior.tsx.
 */

const F = D.floor

/** Rounded box placed with a rotation about X (for reclined cushions). */
function tilted(b: PartBuilder, c: [number, number, number], s: [number, number, number], rx: number, bevel: number) {
  const tmp = new PartBuilder()
  tmp.box('fabric', [0, 0, 0], s, { bevel, grain: 'x' })
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...c),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  )
  tmp.build().forEach(({ geometry }) => b.geometry('fabric', geometry, m, true, 'x'))
}

export function buildFurniture(b: PartBuilder) {
  // Rug: 4.6 × 5.2 m.
  b.box('rug', [0, F + 0.008, -0.5], [4.6, 0.016, 5.2], { bevel: 0.006, grain: 'z', cast: false })

  // Sofa (faces south, toward the glazing): seat 400 mm, back 720 mm.
  const sz0 = -2.7
  const sz1 = -1.7
  b.span('timber', [-1.48, F + 0.016, sz0 + 0.1], [1.48, F + 0.1, sz1 - 0.1]) // recessed plinth
  b.box('fabric', [0, F + 0.17, (sz0 + sz1) / 2], [3.2, 0.14, 1.0], { bevel: 0.03, grain: 'x' })
  b.box('fabric', [0, F + 0.43, sz0 + 0.1], [3.2, 0.4, 0.2], { bevel: 0.05, grain: 'x' })
  b.box('fabric', [-1.525, F + 0.38, (sz0 + sz1) / 2], [0.15, 0.3, 1.0], { bevel: 0.05 })
  b.box('fabric', [1.525, F + 0.38, (sz0 + sz1) / 2], [0.15, 0.3, 1.0], { bevel: 0.05 })
  const seatW = (2.9 - 0.04) / 3
  for (let i = 0; i < 3; i++) {
    const x = -1.45 + seatW / 2 + i * (seatW + 0.02)
    b.box('fabric', [x, F + 0.32, -2.1], [seatW, 0.16, 0.78], { bevel: 0.06, grain: 'x' })
    tilted(b, [x, F + 0.56, -2.42], [seatW - 0.02, 0.34, 0.2], -0.14, 0.08)
  }
}
