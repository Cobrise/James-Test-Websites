import { approach, studio } from '../../config/content'
import { creator, creditLine, site } from '../../config/site'

export function Approach() {
  return (
    <section className="section approach" id="approach" aria-labelledby="approach-title">
      <div className="grid approach__head">
        <p className="eyebrow">{approach.label}</p>
        <h2 className="display display--md approach__title" id="approach-title">
          {approach.title}
        </h2>
      </div>
      <ol className="principles">
        {approach.principles.map((p) => (
          <li key={p.n} className="principle">
            <span className="principle__num">{p.n}</span>
            <h3 className="principle__title">{p.title}</h3>
            <p className="principle__text">{p.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Studio() {
  return (
    <section className="section studio" id="studio" aria-labelledby="studio-title">
      <div className="grid studio__grid">
        <p className="eyebrow">{studio.label}</p>
        <h2 className="display display--md studio__title" id="studio-title">
          {studio.title}
        </h2>
        <div className="studio__body prose">
          {studio.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Contact() {
  const email = site.demoEmail
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="grid contact__grid">
        <p className="eyebrow">Contact</p>
        <h2 className="display contact__title" id="contact-title">
          <span className="chapter__line">Begin with</span>
          <span className="chapter__line">a conversation.</span>
        </h2>
        <div className="contact__action">
          <a className="button" href={`mailto:${email}?subject=${encodeURIComponent('Project enquiry')}`}>
            Start a project enquiry
          </a>
          <p className="contact__address">
            <span className="contact__email">{email}</span>
            {site.demoEmailIsPlaceholder && <span className="tag">Demonstration address</span>}
          </p>
          <p className="fine-print">
            This is a portfolio concept. The address above is a placeholder on a reserved domain and does not reach an
            inbox; the button opens your own mail app and nothing is sent from this site.
          </p>
          {creator.email && (
            <p className="contact__creator">
              To contact {creator.name} about this website: <a href={`mailto:${creator.email}`}>{creator.email}</a>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export function Footer({ onAbout }: { onAbout: () => void }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <p className="site-footer__mark">
          FORM <span aria-hidden="true">/</span> FIELD
        </p>
        <a
          className="site-footer__credit"
          href="#about-this-build"
          onClick={(e) => {
            e.preventDefault()
            onAbout()
          }}
          aria-haspopup="dialog"
        >
          {creditLine}
          <span className="site-footer__credit-hint">About this build</span>
        </a>
      </div>
      <div className="site-footer__bottom">
        <p className="site-footer__fiction">{site.fictionStatement}</p>
        <ul className="site-footer__links">
          <li>
            <a href="#top">Back to the beginning</a>
          </li>
          {creator.portfolioUrl && (
            <li>
              <a href={creator.portfolioUrl}>Portfolio</a>
            </li>
          )}
          {creator.repositoryUrl && (
            <li>
              <a href={creator.repositoryUrl}>Source code</a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  )
}
