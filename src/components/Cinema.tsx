import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chapters, computeTimeline } from '../config/chapters'
import { creditLine } from '../config/site'
import { cinemaProgress } from '../scroll/progress'
import { scrollTopForProgress, useCinemaScroll } from '../scroll/useCinemaScroll'
import { setState, useStore } from '../state/store'
import { initialQuality, isCaptureMode } from '../lib/capabilities'
import { useViewport } from '../lib/useViewport'
import { ChapterIndex } from './ChapterIndex'
import { Loader } from './Loader'
import { Stills } from './Stills'
import { ErrorBoundary } from './ErrorBoundary'
import { Film } from './Film'

const Experience = lazy(() => import('../scene/Experience'))

interface Props {
  /** 'live' renders the real-time scene; 'stills' is the reduced-motion / no-WebGL presentation. */
  mode: 'live' | 'stills'
  reducedMotion: boolean
  onLiveFailed: (reason: string) => void
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/**
 * The cinematic introduction: a tall scroll section with a sticky stage that
 * holds the canvas (or stills), the chapter text, the chapter index and the
 * scroll cue. Chapter text lives in the DOM in reading order; its opacity is
 * driven directly from the shared progress value (no React re-render per frame).
 */
export function Cinema({ mode, reducedMotion, onLiveFailed }: Props) {
  const { compact, portrait } = useViewport()
  const timeline = useMemo(() => computeTimeline(compact), [compact])
  const cinemaRef = useRef<HTMLElement>(null)
  const chapterRefs = useRef<(HTMLElement | null)[]>([])
  const fadeRef = useRef<HTMLDivElement>(null)
  const status = useStore((s) => s.sceneStatus)
  const [quality] = useState(initialQuality)
  const capture = isCaptureMode()
  const [filmCovers, setFilmCovers] = useState(false)

  useCinemaScroll(cinemaRef, { scrub: reducedMotion ? true : 0.9, key: `${compact}` })

  // Text choreography + active chapter.
  useEffect(() => {
    const { timings } = timeline
    const last = timings.length - 1
    const apply = (p: number) => {
      timings.forEach((t, i) => {
        const el = chapterRefs.current[i]
        if (!el) return
        const enter = i === 0 ? 1 : smooth(t.restStart - 0.04, t.restStart + 0.004, p)
        const exit = i === last ? 0 : smooth(t.restEnd - 0.006, t.restEnd + 0.03, p)
        const o = enter * (1 - exit)
        el.style.opacity = o.toFixed(3)
        el.style.transform = reducedMotion ? '' : `translate3d(0, ${((1 - enter) * 28 - exit * 18).toFixed(1)}px, 0)`
        el.dataset.visible = o > 0.02 ? 'true' : 'false'
      })
      if (fadeRef.current) fadeRef.current.style.opacity = smooth(0.965, 1, p).toFixed(3)
    }
    apply(cinemaProgress.smoothed)
    return cinemaProgress.subscribe(apply)
  }, [timeline, reducedMotion])

  // Active chapter follows the real page position (not the smoothed value),
  // read directly on scroll so it is correct even after an instant jump.
  useEffect(() => {
    const { timings } = timeline
    const update = () => {
      const el = cinemaRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      const distance = el.offsetHeight - window.innerHeight
      const p = clamp01(-top / Math.max(1, distance))
      let active = 0
      timings.forEach((t, i) => {
        if (p >= t.restStart - 0.05) active = i
      })
      setState({ activeChapter: active })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [timeline])

  const goTo = useCallback(
    (index: number) => {
      const el = cinemaRef.current
      if (!el) return
      const t = timeline.timings[index]
      const p = index === 0 ? 0 : (t.restStart + t.restEnd) / 2
      window.scrollTo({ top: scrollTopForProgress(el, p), behavior: reducedMotion ? 'auto' : 'smooth' })
    },
    [timeline, reducedMotion],
  )

  useEffect(() => {
    if (mode === 'live') setState({ sceneStatus: 'loading' })
  }, [mode])

  // Never leave a loader spinning: if the scene is not ready in 25 s, fall back.
  useEffect(() => {
    if (mode !== 'live' || status !== 'loading') return
    const id = window.setTimeout(() => onLiveFailed('timeout'), 25000)
    return () => window.clearTimeout(id)
  }, [mode, status, onLiveFailed])

  const onReady = useCallback(() => setState({ sceneStatus: 'ready' }), [])

  return (
    <section
      ref={cinemaRef}
      className="cinema"
      id="cinema"
      aria-label="Stillwater House — a cinematic introduction in five chapters"
      style={{ height: `${timeline.total}vh` }}
      data-mode={mode}
    >
      <div className="stage" data-capture={capture || undefined}>
        <div className="stage__visual" data-ready={mode === 'stills' || status === 'ready'}>
          {mode === 'live' ? (
            <ErrorBoundary onError={(e) => onLiveFailed(String(e))}>
              <Suspense fallback={null}>
                <Experience
                  quality={quality}
                  portrait={portrait}
                  compact={compact}
                  parallax={!reducedMotion && !compact}
                  capture={capture}
                  // Only after the first frames are drawn, so readiness is never blocked.
                  paused={filmCovers && status === 'ready'}
                  onReady={onReady}
                  onFail={onLiveFailed}
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <Stills />
          )}
        </div>
        {!reducedMotion && !capture && <Film compact={compact} onCoverChange={setFilmCovers} />}
        <div className="stage__scrim" aria-hidden="true" />
        <div className="stage__fade" ref={fadeRef} aria-hidden="true" />
        {mode === 'live' && <Loader visible={status !== 'ready' && !filmCovers} />}

        <div className="chapters">
          {chapters.map((c, i) => {
            const Heading = i === 0 ? 'h1' : 'h2'
            return (
              <section
                key={c.id}
                id={`chapter-${c.id}`}
                className={`chapter chapter--${c.placement} chapter--${c.id}`}
                aria-labelledby={`chapter-${c.id}-title`}
                ref={(el) => {
                  chapterRefs.current[i] = el
                }}
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <p className="chapter__label">
                  <span className="chapter__num">{c.number}</span>
                  <span className="chapter__rule" aria-hidden="true" />
                  {c.label}
                </p>
                <Heading className="chapter__headline" id={`chapter-${c.id}-title`}>
                  {c.headline.map((line, li) => (
                    <span key={li} className="chapter__line">
                      {line}
                    </span>
                  ))}
                </Heading>
                <p className="chapter__body">{c.body}</p>
                {c.id === 'arrival' && (
                  <dl className="hero-meta">
                    <div>
                      <dt>Featured study</dt>
                      <dd>Featured study — Stillwater House</dd>
                    </div>
                    <div>
                      <dt>Type and year</dt>
                      <dd>Concept residence / 2026</dd>
                    </div>
                    <div className="hero-meta__credit">
                      <dt>Credit</dt>
                      <dd>{creditLine}</dd>
                    </div>
                  </dl>
                )}
              </section>
            )
          })}
        </div>

        <ChapterIndex onSelect={goTo} />
        <ScrollCue />
      </div>
    </section>
  )
}

function ScrollCue() {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const on = () => {
      if (window.scrollY > 40) setGone(true)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <div className="scroll-cue" data-gone={gone} aria-hidden="true">
      <span>Scroll to enter</span>
      <span className="scroll-cue__line" />
    </div>
  )
}
