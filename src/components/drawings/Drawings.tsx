import { D, riserHeight, stairBottomZ } from '../../scene/architecture/dimensions'

/**
 * Architectural line drawings, drawn as SVG in metres.
 * The Stillwater plan is generated from the same dimensions that build the 3D
 * scene, so drawing and model cannot disagree.
 */

interface DrawingProps {
  title: string
  className?: string
}

export function StillwaterPlan({ title, className }: DrawingProps) {
  const G = D.ground
  const U = D.upper
  const P = D.pool
  const PE = D.plinthExtent
  const treads = Array.from({ length: D.stair.risers - 1 }, (_, k) => stairBottomZ + k * D.stair.going)
  const fins: number[] = []
  for (let z = G.z0 + 0.36; z < D.glazingZ - 0.1; z += 0.33) {
    if (z > D.screenOpening.z0 && z < D.screenOpening.z1) continue
    fins.push(z)
  }
  void riserHeight
  return (
    <svg className={`drawing ${className ?? ''}`} viewBox="-14.5 -9 27 24.5" role="img" aria-labelledby="plan-title">
      <title id="plan-title">{title}</title>
      <g fill="none" stroke="currentColor" strokeWidth="0.04" strokeLinejoin="miter">
        {/* plinth */}
        <rect x={PE.x0} y={PE.z0} width={PE.x1 - PE.x0} height={PE.z1 - PE.z0} strokeWidth="0.03" opacity="0.6" />
        <rect x={-8.4} y={PE.z1} width={5.8} height={0.84} strokeWidth="0.025" opacity="0.5" />
        <line x1={-8.4} y1={PE.z1 + 0.42} x2={-2.6} y2={PE.z1 + 0.42} strokeWidth="0.02" opacity="0.5" />
        {/* pool with water hatching */}
        <rect x={P.x0} y={P.z0} width={P.x1 - P.x0} height={P.z1 - P.z0} />
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={P.x0 + 0.4} x2={P.x1 - 0.4} y1={P.z0 + 0.4 + i * 0.4} y2={P.z0 + 0.4 + i * 0.4} strokeWidth="0.012" opacity="0.35" />
        ))}
        {/* upper volume (dashed: above) */}
        <rect x={U.x0} y={U.z0} width={U.x1 - U.x0} height={U.z1 - U.z0} strokeDasharray="0.3 0.18" strokeWidth="0.035" />
        {/* skylight */}
        <rect x={D.skylight.x0} y={D.skylight.z0} width={D.skylight.x1 - D.skylight.x0} height={D.skylight.z1 - D.skylight.z0} strokeDasharray="0.12 0.1" strokeWidth="0.02" />
      </g>
      {/* cut walls (poché) */}
      <g fill="currentColor">
        <rect x={G.x0} y={G.z0} width={G.x1 - G.x0} height={0.3} />
        <rect x={G.x0} y={G.z0} width={0.3} height={G.z1 - G.z0} />
        <rect x={8.0} y={G.z0} width={0.3} height={G.z1 - G.z0} />
        <rect x={G.x0} y={G.z1 - 0.3} width={D.porch.x0 - 0.3 - G.x0} height={0.3} />
        <rect x={D.porch.x0 - 0.3} y={G.z0} width={0.3} height={G.z1 - G.z0} />
        <rect x={D.porch.x1} y={D.porch.doorZ0} width={0.3} height={G.z1 - D.porch.doorZ0} />
        <rect x={D.porch.x0} y={D.porch.doorZ0} width={D.porch.openX0 - D.porch.x0} height={0.3} />
        <rect x={D.porch.openX1} y={D.porch.doorZ0} width={D.porch.x1 - D.porch.openX1} height={0.3} />
        <rect x={D.porch.x0} y={G.z0 + 0.3} width={D.screenX - D.porch.x0} height={0.05} opacity="0.6" />
      </g>
      <g fill="none" stroke="currentColor">
        {/* glazing */}
        <line x1={D.porch.x1 + 0.3} x2={8.0} y1={D.glazingZ - 0.03} y2={D.glazingZ - 0.03} strokeWidth="0.02" />
        <line x1={D.porch.x1 + 0.3} x2={8.0} y1={D.glazingZ + 0.03} y2={D.glazingZ + 0.03} strokeWidth="0.02" />
        {/* pivot door and swing */}
        <line x1={D.porch.openX0 + 0.3} y1={2.55} x2={D.porch.openX0 + 0.3 + 0.15} y2={2.55 - 1.45} strokeWidth="0.05" />
        <path d={`M ${D.porch.openX1} 2.55 A 1.5 1.5 0 0 0 ${D.porch.openX0 + 0.45} 1.1`} strokeWidth="0.015" strokeDasharray="0.08 0.06" />
        {/* timber screen */}
        {fins.map((z) => (
          <line key={z} x1={D.screenX - 0.09} x2={D.screenX} y1={z} y2={z} strokeWidth="0.035" />
        ))}
        {/* stair treads */}
        {treads.map((z) => (
          <rect key={z} x={D.stair.x0} y={z} width={D.stair.x1 - D.stair.x0} height={D.stair.going} strokeWidth="0.015" />
        ))}
        <line x1={D.stair.x0 + 0.55} y1={stairBottomZ + 0.2} x2={D.stair.x0 + 0.55} y2={D.stair.zTop - 0.25} strokeWidth="0.02" markerEnd="url(#arrow)" />
        {/* bench */}
        <rect x={7.45} y={1.6} width={0.55} height={2.1} strokeWidth="0.02" />
        {/* furniture */}
        <rect x={-1.6} y={-2.7} width={3.2} height={1.0} strokeWidth="0.02" />
        <rect x={-0.8} y={-0.85} width={1.6} height={0.9} strokeWidth="0.02" />
        <rect x={-1.45} y={0.9} width={0.8} height={0.8} strokeWidth="0.02" transform="rotate(-7 -1.05 1.3)" />
        <rect x={0.65} y={0.9} width={0.8} height={0.8} strokeWidth="0.02" transform="rotate(7 1.05 1.3)" />
        <rect x={-2.3} y={-3.1} width={4.6} height={5.2} strokeWidth="0.012" strokeDasharray="0.1 0.08" />
        {/* courtyard tree */}
        <circle cx={-10.4} cy={8.4} r={1.9} strokeWidth="0.02" strokeDasharray="0.15 0.1" />
        {/* north arrow */}
        <g transform="translate(10.6 -7.4)">
          <circle r="0.7" strokeWidth="0.025" />
          <path d="M 0 -0.6 L 0.22 0.3 L 0 0.12 L -0.22 0.3 Z" fill="currentColor" stroke="none" />
        </g>
      </g>
      {/* scale bar: 5 m */}
      <g transform="translate(-13 14.4)" fill="currentColor">
        <rect width="2.5" height="0.12" />
        <rect x="2.5" width="2.5" height="0.12" fill="none" stroke="currentColor" strokeWidth="0.02" />
      </g>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  )
}

/** Ridge Pavilion — long elevation: a single roof plane balanced on a ridge line. */
export function RidgePavilionDrawing({ title, className }: DrawingProps) {
  const ridge = 'M 0 62 C 40 58 70 46 110 44 C 150 42 175 47 205 52 C 235 57 262 66 300 70'
  const trees = [12, 24, 31, 236, 248, 259, 272, 285]
  return (
    <svg className={`drawing ${className ?? ''}`} viewBox="0 0 300 90" role="img" aria-labelledby="ridge-title">
      <title id="ridge-title">{title}</title>
      <g fill="none" stroke="currentColor" strokeWidth="0.5">
        <path d={ridge} />
        {/* ground hatch below the ridge */}
        {Array.from({ length: 30 }, (_, i) => (
          <line key={i} x1={i * 10} y1={88} x2={i * 10 + 16} y2={72} strokeWidth="0.18" opacity="0.35" />
        ))}
        {/* roof plane: thin, long, slightly cantilevered at both ends */}
        <rect x="78" y="30" width="146" height="2.6" fill="currentColor" stroke="none" />
        <line x1="72" y1="33.6" x2="230" y2="33.6" strokeWidth="0.25" />
        {/* glazed enclosure set back under the roof */}
        <rect x="102" y="33.6" width="98" height="11.4" strokeWidth="0.35" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={102 + i * 12.25} x2={102 + i * 12.25} y1={33.6} y2={45} strokeWidth="0.22" />
        ))}
        {/* slender columns to the ridge */}
        {[86, 214].map((x) => (
          <line key={x} x1={x} y1={33.6} x2={x} y2={x < 150 ? 45.4 : 50.2} strokeWidth="0.5" />
        ))}
        {/* stone base on the ridge */}
        <path d="M 100 45 L 202 45 L 204 49.5 L 98 47.4 Z" fill="currentColor" stroke="none" opacity="0.55" />
        {/* conifers */}
        {trees.map((x, i) => {
          const h = 18 + ((i * 7) % 9)
          const base = x < 150 ? 60 - x * 0.08 : 52 + (x - 205) * 0.2
          return <path key={x} d={`M ${x} ${base} L ${x + 4} ${base - h * 0.55} L ${x + 2.4} ${base - h * 0.55} L ${x + 5} ${base - h} L ${x + 7.6} ${base - h * 0.55} L ${x + 6} ${base - h * 0.55} L ${x + 10} ${base}`} strokeWidth="0.35" />
        })}
        {/* figure for scale */}
        <path d="M 150 45 l 0 -3.2 m -0.8 1 l 0.8 -0.8 l 0.8 0.8 m -0.8 -1 a 0.45 0.45 0 1 1 0.01 0" strokeWidth="0.3" />
      </g>
    </svg>
  )
}

/** Courtyard No. 04 — plan: four wings around a square court, one corner left open. */
export function CourtyardDrawing({ title, className }: DrawingProps) {
  return (
    <svg className={`drawing ${className ?? ''}`} viewBox="0 0 100 100" role="img" aria-labelledby="court-title">
      <title id="court-title">{title}</title>
      <g fill="currentColor">
        {/* wings: walls in poché */}
        <path d="M 14 14 H 86 V 17 H 17 V 64 H 14 Z" />
        <path d="M 83 17 H 86 V 86 H 36 V 83 H 83 Z" />
        <path d="M 14 70 H 17 V 83 H 30 V 86 H 14 Z" opacity="0.9" />
      </g>
      <g fill="none" stroke="currentColor">
        {/* inner courtyard line (glazed) */}
        <rect x="32" y="32" width="36" height="36" strokeWidth="0.45" />
        <rect x="32.8" y="32.8" width="34.4" height="34.4" strokeWidth="0.18" />
        {/* wing partitions */}
        {[
          [17, 32, 32, 32],
          [68, 32, 83, 32],
          [68, 68, 83, 68],
          [32, 68, 32, 83],
          [17, 50, 32, 50],
          [50, 17, 50, 32],
          [68, 50, 83, 50],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.35" />
        ))}
        {/* paving grid in the court */}
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i} strokeWidth="0.12" opacity="0.45">
            <line x1={32 + (i + 1) * 6} x2={32 + (i + 1) * 6} y1={32} y2={68} />
            <line y1={32 + (i + 1) * 6} y2={32 + (i + 1) * 6} x1={32} x2={68} />
          </g>
        ))}
        {/* single tree */}
        <circle cx="50" cy="50" r="7.5" strokeWidth="0.3" strokeDasharray="1.2 0.8" fill="var(--draw-fill, transparent)" />
        <circle cx="50" cy="50" r="0.9" fill="currentColor" stroke="none" />
        {/* open corner: entry path */}
        <path d="M 14 66 C 22 72 26 76 32 84" strokeWidth="0.3" strokeDasharray="1 1" />
        {/* north */}
        <g transform="translate(92 8)">
          <circle r="3" strokeWidth="0.3" />
          <path d="M 0 -2.4 L 0.9 1.2 L 0 0.5 L -0.9 1.2 Z" fill="currentColor" stroke="none" />
        </g>
      </g>
    </svg>
  )
}
