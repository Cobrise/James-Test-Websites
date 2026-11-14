import { useEffect, useState } from 'react'

/**
 * Viewport class used for camera framing and scroll lengths. Only changes when
 * crossing a breakpoint or orientation, so resizing does not rebuild the scene.
 */
export function useViewport() {
  const read = () => ({
    compact: window.matchMedia('(max-width: 760px)').matches,
    portrait: window.innerWidth / window.innerHeight < 0.8,
  })
  const [v, setV] = useState(read)
  useEffect(() => {
    const on = () => {
      const n = read()
      setV((o) => (o.compact === n.compact && o.portrait === n.portrait ? o : n))
    }
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}
