import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cinemaProgress } from './progress'

gsap.registerPlugin(ScrollTrigger)
// Mobile URL-bar show/hide changes the viewport height constantly; ignore
// those resizes so the timeline does not recalculate mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Connects the cinematic section's native scroll position to `cinemaProgress`.
 * The browser scrolls normally (no wheel hijacking, no smooth-scroll library);
 * ScrollTrigger's scrub tween is the only smoothing layer. Works identically
 * scrolling up or down because progress is a pure function of position.
 */
export function useCinemaScroll(
  cinema: React.RefObject<HTMLElement | null>,
  options: { scrub: number | boolean; key: string },
) {
  useEffect(() => {
    const el = cinema.current
    if (!el) return
    const proxy = { p: cinemaProgress.smoothed }
    const ctx = gsap.context(() => {
      gsap.fromTo(proxy, { p: 0 }, {
        p: 1,
        ease: 'none',
        onUpdate: () => {
          cinemaProgress.smoothed = proxy.p
          cinemaProgress.emit()
        },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: options.scrub,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            cinemaProgress.raw = self.progress
          },
          onRefresh: (self) => {
            cinemaProgress.raw = self.progress
          },
        },
      })
    })
    return () => ctx.revert()
  }, [cinema, options.scrub, options.key])
}

/** Scroll position (px) at which the cinematic progress equals `p`. */
export function scrollTopForProgress(cinema: HTMLElement, p: number) {
  const top = cinema.getBoundingClientRect().top + window.scrollY
  const distance = cinema.offsetHeight - window.innerHeight
  return top + distance * p
}
