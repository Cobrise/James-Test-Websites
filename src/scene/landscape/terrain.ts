import { D } from '../architecture/dimensions'

/**
 * Terrain height (metres) at a plan position. The site is a wooded slope that
 * rises to the north behind the house and falls gently to the south. Within
 * 2 m of the plinth the ground is held level so it meets the stone cleanly.
 */
export function terrainHeight(x: number, z: number): number {
  const PE = D.plinthExtent
  const dx = Math.max(PE.x0 - x, 0, x - PE.x1)
  const dz = Math.max(PE.z0 - z, 0, z - (PE.z1 + 0.9))
  const dist = Math.hypot(dx, dz)
  const blend = Math.min(1, Math.max(0, (dist - 2) / 10))

  const north = z < -8 ? (-8 - z) * 0.2 : 0
  const south = z > 16 ? -(z - 16) * 0.07 : 0
  const undulation =
    Math.sin(x * 0.11 + z * 0.05) * 0.6 + Math.sin(x * 0.043 - z * 0.09 + 1.3) * 0.9 + Math.cos(z * 0.13) * 0.3
  return (north + south + undulation) * blend - 0.02
}
