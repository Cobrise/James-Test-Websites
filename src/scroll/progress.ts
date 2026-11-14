/**
 * The single authoritative scroll value for the cinematic sequence.
 * ScrollTrigger (scroll/useCinemaScroll.ts) writes `smoothed` through a scrubbed
 * tween; the camera rig and text overlays only read it. Nothing else smooths
 * or hijacks scrolling.
 */
type Listener = (p: number) => void

export const cinemaProgress = {
  /** Raw progress straight from the scroll position, 0–1. */
  raw: 0,
  /** Scrub-smoothed progress used for camera and text, 0–1. */
  smoothed: 0,
  listeners: new Set<Listener>(),
  emit() {
    this.listeners.forEach((l) => l(this.smoothed))
  },
  subscribe(l: Listener) {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  },
}

if (import.meta.env.DEV) (window as unknown as { __cp: typeof cinemaProgress }).__cp = cinemaProgress
