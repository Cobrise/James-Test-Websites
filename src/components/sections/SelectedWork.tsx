import { useState } from 'react'
import { selectedWork, type StudyProject } from '../../config/content'
import { CourtyardDrawing, RidgePavilionDrawing } from '../drawings/Drawings'
import { Dialog } from '../Dialog'

function Drawing({ project, large }: { project: StudyProject; large?: boolean }) {
  const cls = large ? 'drawing--large' : ''
  return project.id === 'ridge' ? (
    <RidgePavilionDrawing title={project.drawingTitle} className={cls} />
  ) : (
    <CourtyardDrawing title={project.drawingTitle} className={cls} />
  )
}

export function SelectedWork() {
  const [openId, setOpenId] = useState<StudyProject['id'] | null>(null)
  const open = selectedWork.find((p) => p.id === openId) ?? null

  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <div className="grid work__head">
        <p className="eyebrow">Selected work</p>
        <h2 className="display display--md work__title" id="work-title">
          Further studies.
        </h2>
        <p className="lead work__intro">
          Two more concept projects in the same language: one open to the horizon, one turned inward.
        </p>
      </div>

      <ul className="work-list">
        {selectedWork.map((p, i) => (
          <li key={p.id} className={`study study--${p.id}`}>
            <div className="study__visual">
              <Drawing project={p} />
            </div>
            <div className="study__text">
              <span className="study__num">{String(i + 2).padStart(2, '0')}</span>
              <h3 className="study__title">{p.title}</h3>
              <p className="study__summary">{p.summary}</p>
              <p className="study__status">{p.meta.find(([k]) => k === 'Status')?.[1]}</p>
              <button type="button" className="text-link" onClick={() => setOpenId(p.id)} aria-haspopup="dialog">
                View study<span className="visually-hidden">: {p.title}</span> <span aria-hidden="true">→</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onClose={() => setOpenId(null)} labelledBy="study-dialog-title" className="dialog--study">
        {open && (
          <article className="study-detail">
            <div className="study-detail__visual">
              <Drawing project={open} large />
            </div>
            <div className="study-detail__text">
              <p className="eyebrow">Concept study</p>
              <h2 className="display display--sm" id="study-dialog-title">
                {open.title}
              </h2>
              {open.concept.map((c, i) => (
                <p key={i}>{c}</p>
              ))}
              <dl className="meta-table">
                {open.meta.map(([k, v]) => (
                  <div className="meta-table__row" key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="fine-print">A fictional design study. Drawing produced for this website.</p>
            </div>
          </article>
        )}
      </Dialog>
    </section>
  )
}
