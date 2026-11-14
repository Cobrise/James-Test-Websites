import * as THREE from 'three'
import { PartBuilder, type Vec3 } from './builder'
import type { MaterialKey } from '../materials/materials'
import { D, riserHeight, stairBottomZ } from './dimensions'

/** A repeated element rendered with one InstancedMesh. */
export interface InstanceSpec {
  key: MaterialKey
  size: Vec3
  matrices: THREE.Matrix4[]
  cast: boolean
}

type Rect = [number, number, number, number] // u0, u1, v0, v1

/**
 * Splits a rectangle into sub-rectangles that avoid the given holes. Used for
 * walls with window openings so every opening has real reveals (the wall
 * thickness is visible in the jambs, head and sill).
 */
function rectMinusHoles(outer: Rect, holes: Rect[]): Rect[] {
  const us = new Set([outer[0], outer[1]])
  const vs = new Set([outer[2], outer[3]])
  holes.forEach((h) => {
    us.add(Math.max(outer[0], Math.min(outer[1], h[0])))
    us.add(Math.max(outer[0], Math.min(outer[1], h[1])))
    vs.add(Math.max(outer[2], Math.min(outer[3], h[2])))
    vs.add(Math.max(outer[2], Math.min(outer[3], h[3])))
  })
  const U = [...us].sort((a, b) => a - b)
  const V = [...vs].sort((a, b) => a - b)
  const out: Rect[] = []
  for (let j = 0; j < V.length - 1; j++) {
    let run: Rect | null = null
    for (let i = 0; i < U.length - 1; i++) {
      const cu = (U[i] + U[i + 1]) / 2
      const cv = (V[j] + V[j + 1]) / 2
      const inHole = holes.some((h) => cu > h[0] && cu < h[1] && cv > h[2] && cv < h[3])
      if (!inHole && U[i + 1] - U[i] > 1e-4 && V[j + 1] - V[j] > 1e-4) {
        if (run && Math.abs(run[1] - U[i]) < 1e-6) run[1] = U[i + 1]
        else {
          if (run) out.push(run)
          run = [U[i], U[i + 1], V[j], V[j + 1]]
        }
      } else if (run) {
        out.push(run)
        run = null
      }
    }
    if (run) out.push(run)
  }
  return out
}

/** Wall in an X–Y plane (normal along z) between z0..z1, with openings in (x, y). */
function wallXY(b: PartBuilder, key: MaterialKey, z0: number, z1: number, outer: Rect, holes: Rect[] = []) {
  rectMinusHoles(outer, holes).forEach(([x0, x1, y0, y1]) => b.span(key, [x0, y0, z0], [x1, y1, z1]))
}
/** Wall in a Z–Y plane (normal along x) between x0..x1, with openings in (z, y). */
function wallZY(b: PartBuilder, key: MaterialKey, x0: number, x1: number, outer: Rect, holes: Rect[] = []) {
  rectMinusHoles(outer, holes).forEach(([z0, z1, y0, y1]) => b.span(key, [x0, y0, z0], [x1, y1, z1]))
}

const m4 = (x: number, y: number, z: number, ry = 0, rx = 0, sx = 1, sy = 1, sz = 1) => {
  const m = new THREE.Matrix4()
  m.compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0, 'YXZ')),
    new THREE.Vector3(sx, sy, sz),
  )
  return m
}

export function buildResidence(b: PartBuilder): InstanceSpec[] {
  const { floor: F, ceil: C, roof: R, upperCeil: UC, upperTop: UT, plinth: P } = D
  const G = D.ground
  const U = D.upper
  const instances: InstanceSpec[] = []

  // ───────────────────────── plinth, pool and approach ─────────────────────────
  const PE = D.plinthExtent
  const pool = D.pool
  const plinthBottom = -0.8
  // Plinth around the pool basin (four spans leave the basin open).
  b.span('basalt', [PE.x0, plinthBottom, PE.z0], [PE.x1, P, pool.z0])
  b.span('basalt', [PE.x0, plinthBottom, pool.z1], [PE.x1, P, PE.z1])
  b.span('basalt', [PE.x0, plinthBottom, pool.z0], [pool.x0, P, pool.z1])
  b.span('basalt', [pool.x1, plinthBottom, pool.z0], [PE.x1, P, pool.z1])
  // Basin: dark floor just below the water line, and a bronze coping lip.
  b.span('shadowGap', [pool.x0, plinthBottom, pool.z0], [pool.x1, pool.water - 0.25, pool.z1], { cast: false })
  // Broad steps down from the forecourt to the forest floor.
  b.span('basalt', [-8.4, plinthBottom, PE.z1], [-2.6, P - 0.15, PE.z1 + 0.42])
  b.span('basalt', [-8.4, plinthBottom, PE.z1 + 0.42], [-2.6, P - 0.3, PE.z1 + 0.84])
  // Low garden wall closing the west side of the courtyard.
  b.span('stone', [PE.x0, P, 1.5], [PE.x0 + 0.35, P + 1.1, PE.z1])
  // Moss planting bed for the courtyard tree (inset into the plinth).
  b.span('ground', [-12.3, P - 0.05, 6.2], [-8.6, P + 0.02, 10.6], { cast: false })

  // ───────────────────────── interior floors ─────────────────────────
  // One continuous limestone floor (porch included), leaving the 140 mm floor
  // slot open along the east wall of the stair hall.
  b.span('floor', [G.x0 + 0.3, P, G.z0 + 0.3], [7.86, F, D.glazingZ])
  b.span('floor', [7.86, P, G.z0 + 0.3], [8.0, F, -4.95])
  b.span('floor', [7.86, P, 3.9], [8.0, F, D.glazingZ])
  b.span('floor', [D.porch.x0, P, D.glazingZ], [D.porch.x1, F, G.z1])

  // ───────────────────────── ground-floor walls ─────────────────────────
  // North wall (stone outside). Living section is clad inside with the timber feature wall.
  b.span('stone', [G.x0, P, G.z0], [3.2, R, G.z0 + 0.3])
  // North wall of the stair hall rises the full double height; plaster inside.
  b.span('plaster', [3.2, P, G.z0], [G.x1, UC, G.z0 + 0.3])
  // West wall.
  b.span('stone', [G.x0, P, G.z0], [G.x0 + 0.3, R, G.z1])
  // East wall: honed limestone, full double height inside the stair hall.
  b.span('stone', [8.0, P, G.z0], [G.x1, UC, G.z1])
  // South wall of the closed kitchen wing (solid, monumental base).
  b.span('stone', [G.x0, P, G.z1 - 0.3], [D.porch.x0 - 0.3, R, G.z1])
  // Vestibule / kitchen partition (plaster) running from the north wall to the porch.
  b.span('plaster', [D.porch.x0 - 0.3, F, G.z0 + 0.3], [D.porch.x0, C, G.z1])
  // Porch east return (timber clad) — the glazing begins beyond it.
  b.span('timber', [D.porch.x1, P, D.porch.doorZ0], [D.porch.x1 + 0.3, C, G.z1], { grain: 'y' })
  // Door wall with a 1.8 m × 2.73 m opening.
  wallXY(b, 'timber', D.porch.doorZ0, D.porch.doorZ1, [D.porch.x0, D.porch.x1, F, C], [
    [D.porch.openX0, D.porch.openX1, F - 1, D.porch.openTop],
  ])
  // Bronze threshold plate.
  b.span('bronze', [D.porch.openX0, F, D.porch.doorZ0], [D.porch.openX1, F + 0.006, D.porch.doorZ1])
  // Pivot door, held open (~84°), pivot 0.3 m from the west jamb.
  {
    const w = D.porch.openX1 - D.porch.openX0 - 0.02
    const h = D.porch.openTop - F - 0.02
    const pivotX = D.porch.openX0 + 0.3
    const pivotZ = (D.porch.doorZ0 + D.porch.doorZ1) / 2
    const angle = THREE.MathUtils.degToRad(84)
    const geo = new THREE.BoxGeometry(w, h, 0.07)
    // Leaf local origin at the pivot: leaf extends -0.3..(w-0.3) along local x.
    geo.translate(w / 2 - 0.3, h / 2, 0)
    b.geometry('timber', geo, m4(pivotX, F + 0.01, pivotZ, angle))
    // Bronze pull: a slim vertical bar on the inside face.
    const pull = new THREE.BoxGeometry(0.025, 1.4, 0.03)
    pull.translate(w - 0.42, 1.05, -0.05)
    b.geometry('bronze', pull, m4(pivotX, F + 0.01, pivotZ, angle))
  }

  // ───────────────────────── glazing (south) ─────────────────────────
  const gz = D.glazingZ
  const glazingStart = D.porch.x1 + 0.3
  const mullions = [glazingStart, -1.3, 0.3, 1.9, 3.5, 5.0, 6.5, 8.0]
  // Floor channel (bronze sill recessed flush) and ceiling head channel.
  b.span('bronze', [glazingStart, P, gz - 0.06], [8.0, F + 0.004, gz + 0.06])
  b.span('shadowGap', [glazingStart, C - 0.04, gz - 0.07], [8.0, C, gz + 0.07], { cast: false })
  mullions.forEach((x, i) => {
    const edge = i === 0 || i === mullions.length - 1
    const w = edge ? 0.06 : 0.05
    const x0 = i === 0 ? x : i === mullions.length - 1 ? x - w : x - w / 2
    b.span('bronze', [x0, F, gz - 0.08], [x0 + w, C, gz + 0.05])
  })
  for (let i = 0; i < mullions.length - 1; i++) {
    b.span('glass', [mullions[i] + 0.03, F + 0.004, gz - 0.012], [mullions[i + 1] - 0.03, C - 0.04, gz], { cast: false })
  }

  // ───────────────────────── ceilings and roof ─────────────────────────
  // Ground roof slab with 0.6 m eaves to the south and west.
  b.span('stone', [G.x0 - 0.6, C, G.z0 - 0.3], [U.x0, R, G.z1 + 0.6])
  // Slab over the south part of the stair hall (upper landing above).
  b.span('stone', [U.x0, C, D.void.z1], [G.x1, R, G.z1])
  // Beam carrying the upper west wall over the timber screen.
  b.span('stone', [U.x0, C, G.z0], [D.screenX, R, D.void.z1])
  // Cantilevered upper floor slab, timber soffit beneath.
  b.span('stone', [U.x0, C, G.z1], [U.x1, R, U.z1])
  b.span('soffit', [U.x0, C - 0.03, G.z1], [U.x1, C, U.z1], { grain: 'z' })
  // Recessed downlights in the soffit (visible as small warm points from the pool).
  for (let x = U.x0 + 0.9; x < U.x1 - 0.5; x += 1.65)
    for (let z = G.z1 + 1.1; z < U.z1 - 0.4; z += 1.8)
      b.span('lightStrip', [x - 0.05, C - 0.034, z - 0.05], [x + 0.05, C - 0.031, z + 0.05], { cast: false })
  // Plaster ceilings with a 20 mm shadow gap at the walls.
  b.span('plaster', [G.x0 + 0.32, C - 0.02, G.z0 + 0.32], [D.screenX, C, gz - 0.07], { cast: false })
  b.span('plaster', [D.void.x0 + 0.02, C - 0.02, D.void.z1 + 0.02], [7.98, C, gz - 0.07], { cast: false })
  // Linear lights recessed in the ceiling.
  b.span('lightStrip', [-2.6, C - 0.024, 3.28], [3.3, C - 0.019, 3.34], { cast: false }) // glazing line
  b.span('lightStrip', [D.porch.x0 + 0.2, C - 0.024, -4.72], [3.3, C - 0.019, -4.66], { cast: false }) // feature-wall washer
  b.span('lightStrip', [3.8, C - 0.024, 3.28], [7.7, C - 0.019, 3.34], { cast: false }) // stair hall low ceiling
  b.span('lightStrip', [-5.4, C - 0.024, 3.3], [-3.6, C - 0.019, 3.36], { cast: false }) // porch
  // Floor slot along the east wall: grazing light up the stone.
  b.span('shadowGap', [7.86, P, -4.95], [8.0, F - 0.001, 3.9], { cast: false })
  b.span('lightStrip', [7.9, F - 0.02, -4.9], [7.99, F - 0.004, 3.86], { cast: false })

  // ───────────────────────── timber feature wall ─────────────────────────
  // 40 mm smoked-oak boards on battens, 30 mm floor shadow gap, stopped 20 mm
  // short of the ceiling so the washer light reads as a clean line.
  b.span('shadowGap', [D.porch.x0, F, G.z0 + 0.3], [D.screenX, C, G.z0 + 0.31], { cast: false })
  b.span('timber', [D.porch.x0, F + 0.03, G.z0 + 0.31], [D.screenX - 0.02, C - 0.02, G.z0 + 0.35], { grain: 'y' })

  // Sculptural vessel on a limestone plinth, framed by the door from the porch.
  b.box('stone', [-4.5, F + 0.4, -4.35], [0.55, 0.8, 0.55], { bevel: 0.008 })

  // ───────────────────────── timber screen (living ↔ stair hall) ─────────────────────────
  {
    const fins: THREE.Matrix4[] = []
    const spacing = 0.11
    for (let z = G.z0 + 0.36; z < gz - 0.1; z += spacing) {
      if (z > D.screenOpening.z0 && z < D.screenOpening.z1) continue
      fins.push(m4(D.screenX - 0.045, (F + C) / 2, z))
    }
    instances.push({ key: 'timber', size: [0.09, C - F, 0.032], matrices: fins, cast: true })
    // Opening framed by two deeper posts.
    b.box('timber', [D.screenX - 0.06, (F + C) / 2, D.screenOpening.z0], [0.12, C - F, 0.06], { bevel: 0.004 })
    b.box('timber', [D.screenX - 0.06, (F + C) / 2, D.screenOpening.z1], [0.12, C - F, 0.06], { bevel: 0.004 })
  }

  // ───────────────────────── stair hall and upper volume ─────────────────────────
  // Upper volume structure (plaster faces inside, clad outside).
  // West wall over the ground roof (and down to the soffit over the cantilever).
  b.span('plaster', [U.x0, R, U.z0], [D.screenX, UC, G.z1])
  b.span('plaster', [U.x0, C, G.z1], [D.screenX, UT, U.z1])
  // East wall over the cantilever (stone wall continues below z = 4).
  const eastWindow: Rect = [4.5, 9.0, 5.0, 6.4]
  wallZY(b, 'plaster', 8.0, U.x1, [G.z1, U.z1, C, UT], [eastWindow])
  // South end wall with the long window.
  const southWindow: Rect = [3.7, 7.8, 4.5, 6.6]
  wallXY(b, 'plaster', U.z1 - 0.3, U.z1, [U.x0, U.x1, C, UT], [southWindow])
  // Glass in the upper windows.
  b.span('glass', [8.12, eastWindow[2], eastWindow[0]], [8.14, eastWindow[3], eastWindow[1]], { cast: false })
  b.span('glass', [southWindow[0], southWindow[2], U.z1 - 0.16], [southWindow[1], southWindow[3], U.z1 - 0.14], { cast: false })
  // Lit interior walls seen through the upper windows (rooms are not modelled;
  // these read as the warm inner walls of the bedrooms).
  b.span('upperGlow', [3.5, D.upperFloor, U.z1 - 1.3], [8.0, UC, U.z1 - 1.28], { cast: false })
  b.span('upperGlow', [7.1, D.upperFloor, 4.3], [7.12, UC, 9.2], { cast: false })
  b.span('timber', [3.5, R, 4.0], [8.0, D.upperFloor, U.z1 - 0.3]) // upper floor boards (cantilever)

  // Upper roof with the skylight opening and a plaster light well.
  const S = D.skylight
  rectMinusHoles([U.x0 - 0.06, U.x1 + 0.06, U.z0 - 0.06, U.z1 + 0.06], [[S.x0, S.x1, S.z0, S.z1]]).forEach(
    ([x0, x1, z0, z1]) => b.span('basalt', [x0, UC, z0], [x1, UT, z1]),
  )
  rectMinusHoles([D.void.x0, 8.0, U.z0 + 0.3, U.z1 - 0.3], [[S.x0, S.x1, S.z0, S.z1]]).forEach(([x0, x1, z0, z1]) =>
    b.span('plaster', [x0, UC - 0.02, z0], [x1, UC, z1], { cast: false }),
  )
  // Light well: plaster reveals lining the roof opening.
  b.span('plaster', [S.x0 - 0.02, UC - 0.02, S.z0 - 0.02], [S.x1 + 0.02, UT - 0.02, S.z0], { cast: false })
  b.span('plaster', [S.x0 - 0.02, UC - 0.02, S.z1], [S.x1 + 0.02, UT - 0.02, S.z1 + 0.02], { cast: false })
  b.span('plaster', [S.x0 - 0.02, UC - 0.02, S.z0], [S.x0, UT - 0.02, S.z1], { cast: false })
  b.span('plaster', [S.x1, UC - 0.02, S.z0], [S.x1 + 0.02, UT - 0.02, S.z1], { cast: false })
  b.span('glass', [S.x0, UT - 0.04, S.z0], [S.x1, UT - 0.02, S.z1], { cast: false })
  // Bright evening sky seen through the skylight: a lid closing the top of the
  // light well, flush below the roof surface so it never shows from outside.
  b.span('skyGlow', [S.x0, UT - 0.018, S.z0], [S.x1, UT - 0.005, S.z1], { cast: false })

  // Upper landing partition with a doorway into the (unseen) upper rooms.
  wallXY(b, 'plaster', 2.2, 2.35, [D.screenX, 8.0, R, UC], [[5.0, 6.2, R, R + 2.3]])
  b.span('upperGlow', [4.6, D.upperFloor, 3.3], [6.6, R + 2.6, 3.32], { cast: false })
  b.span('timber', [D.screenX, R, D.void.z1], [8.0, D.upperFloor, 2.2]) // landing floor
  // Upper slab edge facing the void: a crisp limestone fascia.
  b.span('stone', [D.screenX, C - 0.02, D.void.z1 - 0.01], [8.0, D.upperFloor + 0.0, D.void.z1 + 0.01])

  // ───────────────────────── cantilevered stair ─────────────────────────
  // 20 risers of 175 mm, 280 mm going. Each 80 mm oak tread is fixed to a steel
  // flitch plate cast into the 300 mm stone wall, so it cantilevers 1.1 m.
  const St = D.stair
  const balusters: THREE.Matrix4[] = []
  for (let k = 1; k < St.risers; k++) {
    const top = D.floor + k * riserHeight
    const z0 = stairBottomZ + (k - 1) * St.going
    b.box('timberFeature', [(St.x0 + St.x1) / 2 + 0.01, top - 0.04, z0 + St.going / 2 + 0.015], [St.x1 - St.x0 + 0.02, 0.08, St.going + 0.03], {
      bevel: 0.006,
      grain: 'x',
    })
    // Two 12 mm bronze balusters per tread, on the open side.
    for (const f of [0.28, 0.75]) {
      balusters.push(m4(St.x0 + 0.04, top + 0.46, z0 + St.going * f, 0, 0, 1, 0.92, 1))
    }
  }
  instances.push({ key: 'bronze', size: [0.014, 1, 0.014], matrices: balusters, cast: true })
  // Handrail: a flat bronze bar on the pitch line, 0.92 m above the nosings.
  {
    const pitch = Math.atan2(riserHeight, St.going)
    const run = (St.risers - 1) * St.going
    const len = Math.hypot(run, run * Math.tan(pitch)) + 0.1
    const rail = new THREE.BoxGeometry(0.03, 0.05, len)
    const midZ = stairBottomZ + run / 2
    const midY = D.floor + (St.risers / 2) * riserHeight + 0.92
    b.geometry('bronze', rail, m4(St.x0 + 0.04, midY, midZ, 0, -pitch))
  }
  // Landing balustrade along the slab edge.
  {
    const rods: THREE.Matrix4[] = []
    for (let x = D.screenX + 0.12; x < St.x0; x += 0.12) rods.push(m4(x, D.upperFloor + 0.5, D.void.z1 + 0.05))
    instances.push({ key: 'bronze', size: [0.014, 1, 0.014], matrices: rods, cast: true })
    b.span('bronze', [D.screenX, D.upperFloor + 0.98, D.void.z1 + 0.03], [St.x0 + 0.06, D.upperFloor + 1.02, D.void.z1 + 0.08])
  }
  // Cantilevered bench in the same timber as the treads, at the south end of the stair wall.
  b.box('timberFeature', [7.73, F + 0.4, 2.65], [0.56, 0.08, 2.1], { bevel: 0.006, grain: 'z' })

  // ───────────────────────── exterior cladding of the upper volume ─────────────────────────
  // Black backing membrane + 40 × 60 mm vertical battens at 100 mm centres.
  // Battens run continuously across the upper windows as a fine screen.
  const battens: THREE.Matrix4[] = []
  const BS = 0.1
  const skin = (
    axis: 'x' | 'z',
    plane: number,
    outward: number,
    a0: number,
    a1: number,
    y0: number,
    y1: number,
    holes: Rect[] = [],
  ) => {
    const h = y1 - y0
    const p0 = Math.min(plane, plane + outward * 0.02)
    const p1 = Math.max(plane, plane + outward * 0.02)
    rectMinusHoles([a0, a1, y0, y1], holes).forEach(([u0, u1, v0, v1]) => {
      if (axis === 'x') b.span('shadowGap', [p0, v0, u0], [p1, v1, u1])
      else b.span('shadowGap', [u0, v0, p0], [u1, v1, p1])
    })
    for (let a = a0 + BS / 2; a < a1; a += BS) {
      // Battens are 40 mm wide along the face, 60 mm deep out from it.
      if (axis === 'x') battens.push(m4(plane + outward * 0.05, y0 + h / 2, a, Math.PI / 2, 0, 1, h, 1))
      else battens.push(m4(a, y0 + h / 2, plane + outward * 0.05, 0, 0, 1, h, 1))
    }
  }
  skin('x', U.x1, 1, U.z0, U.z1, C, UT, [eastWindow]) // east
  skin('x', U.x0, -1, U.z0, G.z1, R, UT) // west over the ground roof
  skin('x', U.x0, -1, G.z1, U.z1, C, UT) // west over the cantilever
  skin('z', U.z1, 1, U.x0 - 0.06, U.x1 + 0.06, C, UT, [southWindow]) // south end
  skin('z', U.z0, -1, U.x0, U.x1, R, UT) // north
  instances.push({ key: 'timberCladding', size: [0.04, 1, 0.06], matrices: battens, cast: true })

  return instances
}
