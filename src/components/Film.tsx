import { useEffect, useMemo, useRef } from 'react'
import { filmClips, type FilmClip } from '../config/film'
import { cinemaProgress } from '../scroll/progress'
import { createProgressMap, KEY_COUNT } from '../scene/camera/progressMap'

interface Props {
  compact: boolean
  /** Reports whether a clip currently covers the whole stage. */
  onCoverChange: (covered: boolean) => void
}

/** Share of a clip, at an edge that meets the live model, used for the cross-fade. */
const FADE = 0.12
/** Parallel frame downloads per sequence. */
const CONCURRENCY = 6

/** Piecewise-linear lookup of clip seconds for a control-point position. */
function timeAt(tl: [number, number][], k: number) {
  if (k <= tl[0][0]) return tl[0][1]
  for (let j = 1; j < tl.length; j++) {
    const [k1, t1] = tl[j]
    if (k <= k1) {
      const [k0, t0] = tl[j - 1]
      return t0 + ((k - k0) / (k1 - k0)) * (t1 - t0)
    }
  }
  return tl[tl.length - 1][1]
}

/**
 * Frame-sequence player: the film is a folder of stills drawn to a canvas, so
 * scrubbing is instant in both directions (seeking a compressed video stalls on
 * every scroll step). Frames load coarse-to-fine — every 16th, then 8th, 4th,
 * 2nd, then all — so scrubbing works early and sharpens as loading completes;
 * until a frame arrives, the nearest loaded one is shown.
 */
class Sequence {
  private images: (HTMLImageElement | null)[]
  /** Wanted fractional frame position, and the position last drawn (-1 = none). */
  private want = 0
  private shown = -1
  private raf = 0
  private alive = true
  private canvas: HTMLCanvasElement
  private clip: FilmClip & { kind: 'sequence' }

  constructor(canvas: HTMLCanvasElement, clip: FilmClip & { kind: 'sequence' }) {
    this.canvas = canvas
    this.clip = clip
    this.images = new Array(clip.frames).fill(null)
    this.load()
    if (import.meta.env.DEV) (window as unknown as { __seq: Sequence }).__seq = this
  }

  /** Frames downloaded so far (diagnostics). */
  get loaded() {
    return this.images.filter(Boolean).length
  }

  private url(i: number) {
    return `${this.clip.src}/${String(i + 1).padStart(4, '0')}.webp`
  }

  private load() {
    const n = this.clip.frames
    const order: number[] = []
    const seen = new Set<number>()
    for (const step of [16, 8, 4, 2, 1])
      for (let i = 0; i < n; i += step)
        if (!seen.has(i)) {
          seen.add(i)
          order.push(i)
        }
    let next = 0
    const pump = () => {
      if (!this.alive || next >= order.length) return
      const i = order[next++]
      const img = new Image()
      img.decoding = 'async'
      // Download pacing follows `load`, never `decode()`: browsers may defer
      // decoding (e.g. in a background tab), which would stall the queue.
      img.onload = () => {
        if (!this.alive) return
        this.images[i] = img
        img.decode().catch(() => {}) // warm the decode cache; not awaited
        // Redraw if this frame is one of (or near) the frames being shown.
        if (this.shown < 0 || Math.abs(i - this.want) < 2) this.request()
        pump()
      }
      img.onerror = () => pump()
      img.src = this.url(i)
    }
    for (let c = 0; c < CONCURRENCY; c++) pump()
  }

  /** Show clip time t (seconds); fractional positions blend neighbouring frames. */
  seek(t: number) {
    const pos = Math.min(this.clip.frames - 1, Math.max(0, t * this.clip.fps))
    if (Math.abs(pos - this.want) < 1 / 64 && this.shown >= 0) return
    this.want = pos
    this.request()
  }

  resize() {
    const c = this.canvas
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.round(c.clientWidth * dpr)
    const h = Math.round(c.clientHeight * dpr)
    if (w && h && (c.width !== w || c.height !== h)) {
      c.width = w
      c.height = h
      this.shown = -1
      this.request()
    }
  }

  private request() {
    if (!this.raf) this.raf = requestAnimationFrame(() => this.draw())
  }

  /** Nearest loaded frame index to `target`, or -1. */
  private nearest(target: number) {
    for (let d = 0; d < this.clip.frames; d++) {
      if (this.images[target - d]) return target - d
      if (this.images[target + d]) return target + d
    }
    return -1
  }

  private paint(ctx: CanvasRenderingContext2D, img: HTMLImageElement, alpha: number) {
    const c = this.canvas
    // object-fit: cover
    const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    ctx.globalAlpha = alpha
    ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h)
  }

  private draw() {
    this.raf = 0
    const c = this.canvas
    const ctx = c.getContext('2d')
    if (!ctx || !c.width) return
    const a = Math.floor(this.want)
    const frac = this.want - a
    const imgA = this.images[a]
    const imgB = this.images[a + 1]
    if (imgA && (frac < 0.02 || !imgB)) {
      this.paint(ctx, imgA, 1)
    } else if (imgA && imgB) {
      // Between two frames: cross-blend, so slow scrolling never steps.
      this.paint(ctx, imgA, 1)
      this.paint(ctx, imgB, frac)
    } else {
      const pick = this.nearest(Math.round(this.want))
      if (pick < 0) return
      this.paint(ctx, this.images[pick] as HTMLImageElement, 1)
    }
    ctx.globalAlpha = 1
    this.shown = this.want
  }

  dispose() {
    this.alive = false
    cancelAnimationFrame(this.raf)
    this.images = []
  }
}

/**
 * Scroll-scrubbed film layer. Clip time follows the same scroll → path mapping
 * as the 3D camera, so a clip hands over to the model near the pose it ends on.
 */
export function Film({ compact, onCoverChange }: Props) {
  const map = useMemo(() => createProgressMap(compact), [compact])
  const canvases = useRef<(HTMLCanvasElement | null)[]>([])
  const wrappers = useRef<(HTMLDivElement | null)[]>([])
  const covered = useRef<boolean | null>(null)

  useEffect(() => {
    const N = KEY_COUNT - 1
    const spans = filmClips.map((c, i) => ({
      u0: c.from / N,
      u1: c.to / N,
      fadeF: c.fade ? c.fade / (c.to - c.from) : FADE,
      // An edge only fades if it meets the live model rather than another clip or the path's end.
      fadeIn: c.from > 0 && !filmClips.some((o, j) => j !== i && o.to === c.from),
      fadeOut: c.to < N && !filmClips.some((o, j) => j !== i && o.from === c.to),
    }))
    const players = filmClips.map((c, i) => {
      const el = canvases.current[i]
      return c.kind === 'sequence' && el ? new Sequence(el, c) : null
    })
    const onResize = () => players.forEach((p) => p?.resize())
    onResize()
    window.addEventListener('resize', onResize)

    const apply = (p: number) => {
      const u = map(p)
      let cover = false
      spans.forEach((s, i) => {
        const clip = filmClips[i]
        const f = (u - s.u0) / (s.u1 - s.u0)
        const inside = f >= 0 && f <= 1
        let o = inside ? 1 : 0
        if (inside && s.fadeOut && f > 1 - s.fadeF) o = (1 - f) / s.fadeF
        if (inside && s.fadeIn && f < s.fadeF) o = f / s.fadeF
        const w = wrappers.current[i]
        if (w) {
          w.style.opacity = o.toFixed(3)
          w.style.visibility = o > 0 ? 'visible' : 'hidden'
        }
        if (o >= 0.999) cover = true
        if (!inside) return
        if (clip.kind === 'still') {
          // Slow push-in, matching the camera's forward travel.
          const img = w?.firstElementChild as HTMLElement | null
          if (img) img.style.transform = `scale(${(1 + 0.05 * f).toFixed(4)})`
          return
        }
        const duration = clip.frames / clip.fps
        const t = clip.timeline ? timeAt(clip.timeline, u * N) : f * duration
        players[i]?.seek(t)
      })
      if (cover !== covered.current) {
        covered.current = cover
        onCoverChange(cover)
      }
    }
    apply(cinemaProgress.smoothed)
    const unsub = cinemaProgress.subscribe(apply)
    return () => {
      unsub()
      window.removeEventListener('resize', onResize)
      players.forEach((p) => p?.dispose())
    }
  }, [map, onCoverChange])

  return (
    <div className="film" aria-hidden="true">
      {filmClips.map((c, i) => (
        <div
          key={c.src}
          className="film__clip"
          ref={(el) => {
            wrappers.current[i] = el
          }}
          style={c.kind === 'sequence' ? { backgroundImage: `url(${c.poster})` } : undefined}
        >
          {c.kind === 'still' ? (
            <img className="film__video" src={c.src} alt="" decoding="async" />
          ) : (
            <canvas
              className="film__video"
              ref={(el) => {
                canvases.current[i] = el
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
