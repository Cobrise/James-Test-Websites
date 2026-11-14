import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { materialsCopy } from '../../config/content'
import { timberFinishes } from '../../scene/materials/presets'
import { setState, useStore } from '../../state/store'
import { hasWebGL } from '../../lib/capabilities'
import { ErrorBoundary } from '../ErrorBoundary'

const MaterialView = lazy(() => import('../../scene/MaterialView'))

/** Mounts children only while the element is near the viewport (frees the GPU context otherwise). */
function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '300px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, near] as const
}

export function MaterialStudy({ onViewInScene }: { onViewInScene?: () => void }) {
  const finish = useStore((s) => s.timberFinish)
  const [frameRef, near] = useNearViewport<HTMLDivElement>()
  const [viewFailed, setViewFailed] = useState(!hasWebGL())
  const selected = timberFinishes.find((f) => f.id === finish)!

  return (
    <section className="section materials" id="materials" aria-labelledby="materials-title">
      <div className="grid materials__head">
        <p className="eyebrow">{materialsCopy.label}</p>
        <h2 className="display display--md materials__title" id="materials-title">
          {materialsCopy.title}
        </h2>
        <p className="lead materials__intro">{materialsCopy.intro}</p>
      </div>

      <ol className="material-list">
        {materialsCopy.materials.map((m, i) => (
          <li key={m.id} className={`material material--${m.id}`}>
            <span className="material__swatch" aria-hidden="true" />
            <span className="material__num">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="material__name">{m.name}</h3>
            <p className="material__where">{m.where}</p>
            <p className="material__note">{m.note}</p>
          </li>
        ))}
      </ol>

      <div className="finish-study">
        <div className="finish-study__view" ref={frameRef}>
          {near && !viewFailed ? (
            <ErrorBoundary onError={() => setViewFailed(true)}>
              <Suspense fallback={<div className="finish-study__placeholder" />}>
                <MaterialView onFail={() => setViewFailed(true)} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <div className="finish-study__placeholder" data-finish={finish}>
              {viewFailed && <p>Live sample unavailable on this device. The finish still updates the residence above.</p>}
            </div>
          )}
          <p className="finish-study__caption">
            Sample: two stair treads cantilevered from the limestone wall, with their bronze balusters.
          </p>
        </div>

        <div className="finish-study__controls">
          <h3 className="finish-study__title" id="finish-title">
            Stair timber finish
          </h3>
          <p className="finish-study__scope">
            Changes the finish of the <strong>stair treads and the stair-hall bench</strong> — in this sample and in the
            live residence above. All other timber in the house stays smoked oak.
          </p>
          <div className="finish-options" role="radiogroup" aria-labelledby="finish-title">
            {timberFinishes.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={finish === f.id}
                tabIndex={finish === f.id ? 0 : -1}
                className="finish-option"
                onClick={() => setState({ timberFinish: f.id })}
                onKeyDown={(e) => {
                  const i = timberFinishes.findIndex((x) => x.id === finish)
                  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
                  if (!dir) return
                  e.preventDefault()
                  const next = timberFinishes[(i + dir + timberFinishes.length) % timberFinishes.length]
                  setState({ timberFinish: next.id })
                  const group = e.currentTarget.parentElement
                  requestAnimationFrame(() => group?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
                }}
              >
                <span className="finish-option__swatch" style={{ background: f.swatch }} aria-hidden="true" />
                <span className="finish-option__name">{f.name}</span>
              </button>
            ))}
          </div>
          <p className="finish-study__desc" aria-live="polite">
            <span className="visually-hidden">Selected: </span>
            {selected.name}. {selected.description}
          </p>
          {onViewInScene && (
            <button type="button" className="text-link" onClick={onViewInScene}>
              See it on the stair <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
