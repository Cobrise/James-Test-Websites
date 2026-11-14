/**
 * Stillwater House — key levels and plan dimensions (metres).
 *
 * Plan (looking down, +x east, +z south toward the pool):
 *
 *   z -5.3 ┌───────────────── north wall (feature wall inside) ─────────────┬──────────┐
 *          │  kitchen wing   │ vestibule │      living gallery          │screen│ stair  │
 *          │  (closed)       │           │  sofa · table · chairs       │x=3.5 │ hall   │
 *   z  2.4 │                 ├─door──────┤                              │      │ (double│
 *   z  4.0 └──── solid ──────┘  porch    └──── full-height glazing ─────┴──────┴ height)┘
 *                            x -5.8..-3.2                                 upper timber
 *          x -11                                                  x 3.2 ─ volume ─ x 8.3
 *                                         reflecting pool z 5..11.6   cantilevers to z 9.5
 *
 * The stair runs along the inside of the east stone wall (x = 8.0) rising
 * from z -4.32 (north) to the upper floor edge at z = 1.0.
 */
export const D = {
  /** Top of the dark stone plinth. */
  plinth: 0.45,
  /** Interior finished floor (20 mm limestone over the plinth slab). */
  floor: 0.47,
  /** Underside of the ground-floor ceiling. */
  ceil: 3.6,
  /** Top of the ground-floor roof = upper floor structural level. */
  roof: 3.95,
  /** Upper finished floor. */
  upperFloor: 3.97,
  /** Underside of the upper roof (double-height ceiling in the stair hall). */
  upperCeil: 7.05,
  /** Top of the upper roof. */
  upperTop: 7.4,

  ground: { x0: -11, x1: 8.3, z0: -5.3, z1: 4.0 },
  upper: { x0: 3.2, x1: 8.3, z0: -5.3, z1: 9.5 },
  porch: { x0: -5.8, x1: -3.2, doorZ0: 2.4, doorZ1: 2.7, openX0: -5.4, openX1: -3.6, openTop: 3.2 },
  glazingZ: 3.95,
  screenX: 3.5,
  screenOpening: { z0: -1.6, z1: 0.8 },
  /** Double-height void over the stair hall. */
  void: { x0: 3.5, x1: 8.0, z0: -5.0, z1: 1.0 },
  skylight: { x0: 4.0, x1: 7.5, z0: -4.7, z1: -3.4 },
  stair: { x0: 6.9, x1: 8.0, zTop: 1.0, risers: 20, going: 0.28 },
  pool: { x0: -2.4, x1: 9.8, z0: 5.0, z1: 11.6, water: 0.38 },
  plinthExtent: { x0: -13, x1: 10.5, z0: -7, z1: 13.2 },
} as const

export const riserHeight = (D.upperFloor - D.floor) / D.stair.risers
export const stairBottomZ = D.stair.zTop - (D.stair.risers - 1) * D.stair.going
