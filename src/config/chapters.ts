/**
 * Chapter definitions — the single source for navigation labels, overlay copy,
 * scroll lengths and the camera rest index. The camera path (scene/camera/
 * cameraPath.ts) supplies one rest pose per chapter in the same order.
 */
export type ChapterId = 'arrival' | 'threshold' | 'inhabitation' | 'structure' | 'material'

export type TextPlacement = 'left-low' | 'right-mid' | 'left-mid' | 'right-low'

export interface Chapter {
  id: ChapterId
  number: string
  label: string
  /** Headline lines; each entry is rendered on its own line (deliberate breaks). */
  headline: string[]
  body: string
  /** Scroll length in viewport heights on wide screens. */
  length: number
  /** Scroll length in viewport heights on narrow (phone) screens. */
  lengthCompact: number
  placement: TextPlacement
  /** Alt text for the still used in reduced-motion and fallback modes. */
  stillAlt: string
}

export const chapters: Chapter[] = [
  {
    id: 'arrival',
    number: '01',
    label: 'Arrival',
    headline: ['Spaces for', 'a quieter world.'],
    body: 'FORM / FIELD is an independent architecture practice exploring the relationship between landscape, material, and everyday life.',
    length: 120,
    lengthCompact: 100,
    placement: 'left-low',
    stillAlt:
      'Stillwater House at dusk seen across its reflecting pool: a low glazed pavilion on a dark stone plinth, a timber-clad upper volume cantilevered over the water, warm light inside, conifers behind.',
  },
  {
    id: 'threshold',
    number: '02',
    label: 'Threshold',
    headline: ['Drawn from', 'the landscape.'],
    body: 'A low horizon, a sheltered threshold, and a sequence of spaces shaped around the trees.',
    length: 150,
    lengthCompact: 120,
    placement: 'right-low',
    stillAlt:
      'The recessed entrance porch, its timber pivot door held open, framing a lit timber feature wall inside.',
  },
  {
    id: 'inhabitation',
    number: '03',
    label: 'Inhabitation',
    headline: ['Room to', 'slow down.'],
    body: 'Generous proportions meet restrained materials. Light, rather than ornament, defines the room.',
    length: 140,
    lengthCompact: 115,
    placement: 'right-mid',
    stillAlt:
      'The living gallery: a low sofa and two lounge chairs around a stone table, full-height glazing beyond opening to the pool and forest in evening light.',
  },
  {
    id: 'structure',
    number: '04',
    label: 'Structure',
    headline: ['Structure becomes', 'sculpture.'],
    body: 'A single stair connects the home’s quieter upper rooms to the shared spaces below.',
    length: 140,
    lengthCompact: 115,
    placement: 'right-low',
    stillAlt:
      'The double-height stair hall: timber treads cantilever from a stone wall, rising beneath a skylight that washes the back wall with light.',
  },
  {
    id: 'material',
    number: '05',
    label: 'Material',
    headline: ['Honest materials.', 'Lasting character.'],
    body: 'Timber, stone, and light. A limited palette, resolved through proportion and detail.',
    length: 130,
    lengthCompact: 110,
    placement: 'left-low',
    stillAlt:
      'A close view of a corner: a smoked oak bench cantilevered from a limestone wall, light grazing the stone from a recessed floor slot, a bronze glazing frame beside it.',
  },
]

/**
 * Derived scroll timeline, measured in viewport heights (vh).
 * The cinematic section is `total` vh tall with a 100vh sticky stage, so the
 * scrollable distance is `total - 100`. Each chapter has a reading "rest"
 * centred on its section; the camera eases between rests and drifts slowly
 * during them.
 */
export interface ChapterTiming {
  /** Normalised progress (0–1) at the centre of the rest. */
  center: number
  /** Normalised progress where the rest begins / ends. */
  restStart: number
  restEnd: number
}

export function computeTimeline(compact: boolean) {
  const lengths = chapters.map((c) => (compact ? c.lengthCompact : c.length))
  const total = lengths.reduce((a, b) => a + b, 0)
  const scrollable = total - 100
  let top = 0
  const timings: ChapterTiming[] = lengths.map((len, i) => {
    // Section centre aligned with the viewport centre.
    let c = top + len / 2 - 50
    if (i === 0) c = 0
    if (i === lengths.length - 1) c = scrollable - len * 0.12
    top += len
    const half = len * 0.2
    const restStart = i === 0 ? 0 : (c - half) / scrollable
    const restEnd = i === lengths.length - 1 ? 1 : (c + half) / scrollable
    return { center: c / scrollable, restStart, restEnd }
  })
  return { lengths, total, scrollable, timings }
}
