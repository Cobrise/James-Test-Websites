import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Cinema } from './components/Cinema'
import { Overview } from './components/sections/Overview'
import { MaterialStudy } from './components/sections/MaterialStudy'
import { SelectedWork } from './components/sections/SelectedWork'
import { Approach, Contact, Footer, Studio } from './components/sections/Editorial'
import { AboutBuild } from './components/AboutBuild'
import { hasWebGL, prefersReducedMotion } from './lib/capabilities'
import { setState } from './state/store'
import { computeTimeline } from './config/chapters'
import { scrollTopForProgress } from './scroll/useCinemaScroll'

const ABOUT_HASH = '#about-this-build'

export default function App() {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)
  const [liveFailed, setLiveFailed] = useState(() => !hasWebGL())
  const [aboutOpen, setAboutOpen] = useState(() => window.location.hash === ABOUT_HASH)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReducedMotion(prefersReducedMotion())
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // The about dialog is addressable: #about-this-build opens it directly.
  useEffect(() => {
    const on = () => setAboutOpen(window.location.hash === ABOUT_HASH)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const openAbout = useCallback(() => {
    history.replaceState(null, '', ABOUT_HASH)
    setAboutOpen(true)
  }, [])
  const closeAbout = useCallback(() => {
    if (window.location.hash === ABOUT_HASH) history.replaceState(null, '', window.location.pathname + window.location.search)
    setAboutOpen(false)
  }, [])

  const onLiveFailed = useCallback((reason: string) => {
    console.warn('[Stillwater] real-time scene unavailable, showing stills:', reason)
    setState({ sceneStatus: 'failed' })
    setLiveFailed(true)
  }, [])

  const mode = reducedMotion || liveFailed ? 'stills' : 'live'

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full'
  }, [reducedMotion])

  const viewStair = useCallback(() => {
    const cinema = document.getElementById('cinema')
    if (!cinema) return
    const compact = window.matchMedia('(max-width: 760px)').matches
    const t = computeTimeline(compact).timings[3]
    window.scrollTo({ top: scrollTopForProgress(cinema, (t.restStart + t.restEnd) / 2), behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [reducedMotion])

  return (
    <>
      <div id="top" />
      <Header />
      <main id="main">
        <Cinema mode={mode} reducedMotion={reducedMotion} onLiveFailed={onLiveFailed} />
        <div className="editorial">
          <Overview />
          <MaterialStudy onViewInScene={viewStair} />
          <SelectedWork />
          <Approach />
          <Studio />
          <Contact />
        </div>
      </main>
      <Footer onAbout={openAbout} />
      <AboutBuild open={aboutOpen} onClose={closeAbout} />
    </>
  )
}
