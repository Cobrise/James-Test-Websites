import * as THREE from 'three'
import { PartBuilder } from './builder'
import { D } from './dimensions'

/**
 * Living-gallery furniture. Proportions follow real pieces: a 3.2 m low sofa
 * (seat 400 mm, back 720 mm), 340 mm stone table, lounge chairs with a 330 mm
 * seat. Upholstered parts are rounded boxes so cushions read as soft volumes.
 */

const F = D.floor

function lathe(profile: [number, number][], segments = 40) {
  const geo = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  )
  geo.computeVertexNormals()
  return geo
}

const at = (x: number, y: number, z: number, rx = 0, ry = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0, 'YXZ')),
    new THREE.Vector3(1, 1, 1),
  )

/** Rounded box placed with a rotation about X (for reclined cushions). */
function tilted(b: PartBuilder, key: 'fabric' | 'fabricDark', c: [number, number, number], s: [number, number, number], rx: number, bevel: number) {
  // Build at the origin with the builder's UV projection, then rotate/translate.
  const tmp = new PartBuilder()
  tmp.box(key, [0, 0, 0], s, { bevel, grain: 'x' })
  const built = tmp.build()
  built.forEach(({ geometry }) => b.geometry(key, geometry, at(c[0], c[1], c[2], rx), true, 'x'))
}

export function buildFurniture(b: PartBuilder) {
  // ── Rug: hand-loomed wool, 4.6 × 5.2 m ──
  b.box('rug', [0, F + 0.008, -0.5], [4.6, 0.016, 5.2], { bevel: 0.006, grain: 'z', cast: false })

  // ── Sofa (faces south, toward the glazing) ──
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
    tilted(b, 'fabric', [x, F + 0.56, -2.42], [seatW - 0.02, 0.34, 0.2], -0.14, 0.08)
  }
  // Folded throw over the east arm.
  b.box('fabricDark', [1.18, F + 0.415, -2.0], [0.48, 0.03, 0.6], { bevel: 0.012, grain: 'z' })

  // ── Stone coffee table: monolithic basalt top on a recessed base ──
  b.box('basalt', [0, F + 0.3, -0.4], [1.6, 0.08, 0.9], { bevel: 0.012 })
  b.box('basalt', [0, F + 0.14, -0.4], [1.2, 0.25, 0.6], { bevel: 0.006 })
  const top = F + 0.34
  b.geometry('ceramicLight', lathe([[0.001, 0], [0.12, 0.004], [0.17, 0.03], [0.185, 0.075], [0.178, 0.078], [0.16, 0.035], [0.001, 0.012]]), at(-0.4, top, -0.32))
  b.geometry('ceramicDark', lathe([[0.001, 0], [0.065, 0.004], [0.075, 0.08], [0.07, 0.2], [0.03, 0.27], [0.018, 0.33], [0.022, 0.335], [0.001, 0.335]]), at(0.32, top, -0.55))
  b.geometry('ceramicLight', lathe([[0.001, 0], [0.05, 0.003], [0.085, 0.06], [0.07, 0.13], [0.04, 0.15], [0.045, 0.155], [0.001, 0.15]]), at(0.52, top, -0.24))
  // Two stacked books (cloth bound).
  b.box('fabricDark', [-0.05, top + 0.015, -0.12], [0.3, 0.03, 0.22], { bevel: 0.004 })
  b.box('fabric', [-0.03, top + 0.045, -0.13], [0.26, 0.03, 0.2], { bevel: 0.004, rotY: 0.08 })

  // ── Two lounge chairs facing the sofa ──
  for (const cx of [-1.05, 1.05]) {
    const cz = 1.3
    const ry = cx < 0 ? 0.12 : -0.12
    const rot = (x: number, z: number): [number, number] => {
      const c = Math.cos(ry)
      const s = Math.sin(ry)
      return [cx + x * c + z * s, cz - x * s + z * c]
    }
    // Oak sled frame: two side panels and a stretcher.
    for (const side of [-0.38, 0.38]) {
      const [x, z] = rot(side, 0.02)
      b.box('timber', [x, F + 0.24, z], [0.045, 0.44, 0.8], { bevel: 0.008, grain: 'z', rotY: ry })
    }
    {
      const [x, z] = rot(0, 0.36)
      b.box('timber', [x, F + 0.12, z], [0.72, 0.05, 0.05], { bevel: 0.006, grain: 'x', rotY: ry })
    }
    // Seat and back cushions in a darker woven wool.
    {
      const [x, z] = rot(0, -0.02)
      b.box('fabricDark', [x, F + 0.34, z], [0.72, 0.13, 0.72], { bevel: 0.05, grain: 'x', rotY: ry })
    }
    {
      const [x, z] = rot(0, 0.36)
      tilted(b, 'fabricDark', [x, F + 0.62, z], [0.7, 0.5, 0.13], 0.26, 0.05)
    }
  }

  // ── Side table by the sofa (turned oak drum) with a small vessel ──
  b.geometry('timber', lathe([[0.001, 0], [0.2, 0], [0.21, 0.01], [0.21, 0.44], [0.2, 0.45], [0.001, 0.45]], 48), at(-2.05, F, -2.2))
  b.geometry('ceramicDark', lathe([[0.001, 0], [0.06, 0.004], [0.09, 0.09], [0.06, 0.17], [0.035, 0.19], [0.04, 0.2], [0.001, 0.2]]), at(-2.05, F + 0.45, -2.2))

  // ── Tall floor vessel by the glazing, and the vessel on the hall plinth ──
  b.geometry('ceramicDark', lathe([[0.001, 0], [0.12, 0.006], [0.2, 0.18], [0.2, 0.36], [0.12, 0.58], [0.08, 0.66], [0.09, 0.68], [0.001, 0.67]]), at(-2.35, F, 3.25))
  b.geometry('ceramicLight', lathe([[0.001, 0], [0.1, 0.006], [0.19, 0.12], [0.2, 0.22], [0.12, 0.36], [0.07, 0.4], [0.08, 0.41], [0.001, 0.405]]), at(-4.5, F + 0.8, -4.35))
}
