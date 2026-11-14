import { chapters } from '../config/chapters'
import { useStore } from '../state/store'
import { renderUrl } from '../lib/assets'

/**
 * Composed still views of each chapter, captured from the real scene. Used
 * when the user prefers reduced motion or WebGL is unavailable: the camera no
 * longer travels; the stage changes view per chapter with a short cross-fade.
 */
export function Stills() {
  const active = useStore((s) => s.activeChapter)
  return (
    <div className="stills">
      {chapters.map((c, i) => (
        <img
          key={c.id}
          className="stills__img"
          src={renderUrl(`chapter-${i + 1}.webp`)}
          alt={c.stillAlt}
          data-active={active === i}
          aria-hidden={active === i ? undefined : true}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).dataset.missing = 'true'
          }}
        />
      ))}
    </div>
  )
}
