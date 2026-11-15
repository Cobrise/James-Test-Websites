import { aboutLead, creator, site } from '../config/site'
import { Dialog } from './Dialog'

/**
 * "About this build" — portfolio transparency. Every statement here describes
 * what the code actually does; update it if the implementation changes.
 */
export function AboutBuild({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="about-title" className="dialog--about">
      <article className="about">
        <p className="eyebrow">About this build</p>
        <h2 className="display display--sm" id="about-title">
          {aboutLead}
        </h2>

        <div className="about__grid">
          <section>
            <h3>What is fictional</h3>
            <p>{site.fictionStatement} The drawings of Ridge Pavilion and Courtyard No. 04 are likewise invented studies.</p>
          </section>
          <section>
            <h3>Real-time architecture</h3>
            <p>
              Stillwater House is modelled and rendered live in the browser with Three.js. Walls, slabs, glazing and
              the stair are procedural geometry built from one set of plan dimensions; repeated elements (timber
              battens, screen fins, balusters, trees) are instanced. Most interior furniture and objects are free CC0
              models from Poly Haven, compressed for the web.
            </p>
          </section>
          <section>
            <h3>AI-generated film</h3>
            <p>
              The photo-real opening is AI-generated video, not live rendering. Camera moves were first rendered as
              plain white models along the site’s own camera path; those guides and AI-generated stills (ChatGPT) were
              turned into clips with Dreamina (Seedance). Scrolling scrubs the clip, which then cross-fades into the
              live model at the same viewpoint.
            </p>
          </section>
          <section>
            <h3>Camera and scroll</h3>
            <p>
              The camera follows a spline through the house. Its position is a function of the page’s native scroll
              position, read by GSAP ScrollTrigger with a light scrub; nothing intercepts the scroll wheel, and every
              chapter plays the same way in reverse.
            </p>
          </section>
          <section>
            <h3>Materials</h3>
            <p>
              Architectural surfaces use no texture files: timber grain, limestone, plaster, fabric and the distant tree
              lines are generated procedurally at load time; the sky is a small shader, and reflections come from an
              environment map assembled in the scene. The material study re-tints the stair timber live.
            </p>
          </section>
          <section>
            <h3>Performance</h3>
            <p>
              Rendering happens on demand — only when the scroll position or pointer changes — and stops when the scene
              is off screen or the tab is hidden. Static geometry is merged by material, the sun’s shadow map is drawn
              once, device pixel ratio is capped, and touch devices get a lighter tier without post-processing or
              reflections. On desktop, a frame-rate monitor can lower resolution and switch off ambient occlusion.
            </p>
          </section>
          <section>
            <h3>Accessibility and fallbacks</h3>
            <p>
              All text is real HTML in reading order; the canvas is decorative. With reduced motion requested, camera
              travel is replaced by composed still views of each chapter. Without WebGL the same stills are shown. The
              stills were rendered from the scene itself. Menus and dialogs are keyboard operable.
            </p>
          </section>
          <section className="about__credits">
            <h3>Third-party software and fonts</h3>
            <ul>
              <li>React — MIT licence, Meta Platforms.</li>
              <li>Three.js — MIT licence, three.js authors.</li>
              <li>React Three Fiber, Drei and React Postprocessing — MIT licence, Poimandres.</li>
              <li>postprocessing — Zlib licence, Raoul van Rüschen. N8AO — ISC licence, N8python.</li>
              <li>GSAP and ScrollTrigger — GSAP Standard “no charge” licence.</li>
              <li>Cormorant Garamond (Christian Thalmann), Inter (Rasmus Andersson) and IBM Plex Mono (IBM) — SIL Open Font Licence, self-hosted via Fontsource.</li>
              <li>Built with Vite and TypeScript. Developed with the help of AI coding tools.</li>
            </ul>
          </section>
        </div>

        <p className="about__sign">
          Design and build: {creator.surname ? `${creator.name} ${creator.surname}` : creator.name}
          {creator.portfolioUrl && (
            <>
              {' · '}
              <a href={creator.portfolioUrl}>Portfolio</a>
            </>
          )}
          {creator.repositoryUrl && (
            <>
              {' · '}
              <a href={creator.repositoryUrl}>Source code</a>
            </>
          )}
        </p>
      </article>
    </Dialog>
  )
}
