/**
 * Timber finish presets for the material selector. The selected finish is
 * applied ONLY to the stair treads and the stair-hall bench (material key
 * "timberFeature"), in the live residence and in the material sample view.
 * Every other timber surface stays smoked oak.
 */
export type TimberFinishId = 'smoked' | 'limed' | 'ebonised'

export interface TimberFinish {
  id: TimberFinishId
  name: string
  description: string
  /** Multiplies the neutral grain albedo (linear workflow, sRGB hex). */
  color: string
  roughness: number
  /** Normal strength; ebonised oak is wire-brushed so its grain reads deeper. */
  normalScale: number
  swatch: string
}

export const timberFinishes: TimberFinish[] = [
  {
    id: 'smoked',
    name: 'Smoked oak',
    description: 'Fumed European oak, oiled. Deep brown with a soft sheen.',
    color: '#7a5640',
    roughness: 0.58,
    normalScale: 0.55,
    swatch: '#5b3f2e',
  },
  {
    id: 'limed',
    name: 'Limed oak',
    description: 'Oak with white pigment worked into the open grain. Pale and matt.',
    color: '#d9c6a8',
    roughness: 0.74,
    normalScale: 0.7,
    swatch: '#c9b597',
  },
  {
    id: 'ebonised',
    name: 'Ebonised oak',
    description: 'Oak darkened with iron acetate and wire-brushed. Near black, strongly textured.',
    color: '#3a2c25',
    roughness: 0.66,
    normalScale: 1.05,
    swatch: '#2a211c',
  },
]

export const timberFinishById = Object.fromEntries(timberFinishes.map((f) => [f.id, f])) as Record<
  TimberFinishId,
  TimberFinish
>
