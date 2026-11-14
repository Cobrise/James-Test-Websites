import { overview } from '../../config/content'
import { renderUrl } from '../../lib/assets'
import { StillwaterPlan } from '../drawings/Drawings'

export function Overview() {
  return (
    <section className="section overview" id="overview" aria-labelledby="overview-title" tabIndex={-1}>
      <div className="overview__head grid">
        <p className="eyebrow">{overview.label}</p>
        <h2 className="display overview__title" id="overview-title">
          {overview.title}
        </h2>
        <p className="lead overview__lead">{overview.lead}</p>
      </div>

      <div className="overview__body grid">
        <div className="overview__text prose">
          {overview.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <dl className="meta-table overview__meta">
          {overview.meta.map(([k, v]) => (
            <div key={k} className="meta-table__row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="overview__views">
        {overview.views.map((v, i) => (
          <figure key={v.file} className={`view view--${i + 1}`}>
            <div className="view__frame">
              <img src={renderUrl(v.file)} alt={v.alt} loading="lazy" decoding="async" width={1600} height={1000} />
            </div>
            <figcaption>
              <span className="view__num">{String(i + 1).padStart(2, '0')}</span>
              {v.caption}
            </figcaption>
          </figure>
        ))}
        <figure className="view view--plan">
          <div className="view__frame view__frame--drawing">
            <StillwaterPlan title="Stillwater House, schematic ground-floor plan: limestone pavilion with porch, living gallery, timber screen and stair hall; dashed outline of the upper timber volume cantilevering over the pool." />
          </div>
          <figcaption>
            <span className="view__num">04</span>
            Ground floor, schematic. Generated from the same dimensions as the 3D model.
          </figcaption>
        </figure>
      </div>
      <p className="render-note">Views 01–03 are stills rendered from this site’s real-time scene.</p>
    </section>
  )
}
