import { chapters } from '../config/chapters'
import { useStore } from '../state/store'

/**
 * Chapter index for the cinematic sequence. Each control scrolls to that
 * chapter's real rest position; the active state follows the page position.
 */
export function ChapterIndex({ onSelect }: { onSelect: (i: number) => void }) {
  const active = useStore((s) => s.activeChapter)
  return (
    <nav className="chapter-index" aria-label="Chapters">
      <ol>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className="chapter-index__item"
              aria-current={active === i ? 'step' : undefined}
              onClick={() => onSelect(i)}
            >
              <span className="chapter-index__num">{c.number}</span>
              <span className="chapter-index__label">{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="chapter-index__progress" aria-hidden="true">
        <span style={{ transform: `scaleY(${(active + 1) / chapters.length})` }} />
      </div>
    </nav>
  )
}
