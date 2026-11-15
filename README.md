# FORM / FIELD — Stillwater House

**An interactive architecture concept website by James.**

A scroll-driven architectural film through *Stillwater House*, a fictional residence by *FORM / FIELD*, a fictional architecture studio. The site was created by James as an independent portfolio project exploring real-time 3D, scroll-driven storytelling and architectural web design.

**Version 2:** the opening is now a photo-real, AI-generated film (scrubbed by scrolling) that hands over to the real-time 3D model. See "Film" below.

> FORM / FIELD, Stillwater House, Ridge Pavilion and Courtyard No. 04 are fictional concepts. They do not represent a real practice, client, commission or building, and nothing on the site claims otherwise.

---

## Quick start

Requirements: Node.js 20+ (developed on Node 24) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Vite development server with hot reload                  |
| `npm run typecheck` | TypeScript project check (`tsc -b`)                       |
| `npm run lint`      | ESLint (TypeScript + React hooks rules)                   |
| `npm run build`     | Type check, then production build into `dist/`            |
| `npm run preview`   | Serves `dist/` locally to check the production build      |

Useful URL switches for testing (they work in production too):

- `?motion=reduced` — forces the reduced-motion presentation
- `?fallback=1` — simulates a device without WebGL (still-image experience)
- `?quality=low` / `?quality=high` — forces a rendering tier
- `#about-this-build` — opens the "About this build" dialog directly

## Stack

React 19 · TypeScript · Vite · Three.js via React Three Fiber · Drei · React Postprocessing (N8AO ambient occlusion, bloom, tone mapping, vignette) · GSAP ScrollTrigger · plain CSS with design tokens. Fonts are self-hosted via Fontsource.

No API keys are needed to run or build the site. The architecture and its textures are generated from the project source. Binary assets are: interior furniture models in `public/models/` (Poly Haven, CC0), the AI-generated film in `film-src/` and the chapter photographs in `public/film/` (see "Film"), and the stills in `public/renders/` plus `public/og-image.jpg`, rendered from the scene itself (see "Stills").

## Project structure

```
src/
  config/
    site.ts            creator + site configuration (add surname, links, email here)
    chapters.ts        the five chapters: copy, labels, scroll lengths, timeline maths
    content.ts         editorial copy: overview, materials, selected work, approach, studio
  scene/
    Experience.tsx     canvas, renderer settings, quality tier, readiness, capture API
    MaterialView.tsx   the dedicated timber-finish sample canvas
    architecture/
      dimensions.ts    the plan: every level and key dimension, in metres
      builder.ts       box/part builder with metre-scaled UVs, merges per material
      buildResidence.ts walls, glazing, roofs, cantilever, skylight, stair, cladding
      furniture.ts     sofa, chairs, table, rug, ceramics
      Residence.tsx    renders merged meshes + instanced repeats
    materials/
      textures.ts      procedural timber, limestone, plaster, fabric, rug, basalt, ground
      materials.ts     PBR material library
      presets.ts       the three timber finishes for the material selector
    lighting/          sun, area lights, generated environment map
    landscape/         terrain, composed conifer stands, courtyard maple, tree-line bands, sky, pool
    camera/
      cameraPath.ts    typed camera keyframes, rest ranges, progress → path mapping
      CameraRig.tsx    applies the path each rendered frame (+ subtle pointer parallax)
  scroll/
    progress.ts        the single authoritative scroll progress value
    useCinemaScroll.ts ScrollTrigger binding (native scroll, scrub only)
  components/          header + mobile menu, cinema stage, chapter index, loader, stills,
                       dialogs, About this build, editorial sections, SVG drawings
  state/store.ts       tiny external store (timber finish, scene status, active chapter)
  styles/              tokens.css, base.css, cinema.css, sections.css
public/
  renders/             chapter and editorial stills rendered from the scene
  og-image.jpg         social preview image (1200 × 630), rendered from the scene
  favicon.svg
```

## Camera choreography

- One Catmull-Rom spline for the eye and one for the look-at target, both through the 19 keyframes in `scene/camera/cameraPath.ts`, with a field of view per keyframe.
- Each chapter rests between two keyframes (`chapterRests`). While its text is on screen the camera drifts slowly along that short stretch; between chapters it travels.
- `createProgressMap` converts scroll progress into curve position: linear during rests, cubic Hermite between them with matched end slopes, so speed is continuous entering and leaving every rest and behaves identically in reverse.
- Scroll progress comes from the page's native scroll position (ScrollTrigger, `scrub: 0.9`). There is no wheel hijacking and no second smoothing library.
- Portrait screens use their own framing (`portrait` overrides per keyframe) and shorter scroll lengths (`lengthCompact` in `chapters.ts`).
- Clearances were planned against `dimensions.ts`: the threshold passes ~0.6 m clear of the door jamb and the open pivot door, and the stair-hall entry crosses the centre of the opening in the timber screen.

## Material controls

The "Stair timber finish" selector (Smoked oak / Limed oak / Ebonised oak) changes **only** the stair treads and the stair-hall bench (material key `timberFeature`), both in the material sample view and in the live residence. All other timber stays smoked oak. Presets are typed in `scene/materials/presets.ts`.

## Accessibility

- All copy is real HTML in reading order; the canvases are `aria-hidden` and decorative.
- Landmarks (`header`, `main`, `nav`, `footer`), one `h1`, a logical heading hierarchy, visible focus styles and 44 px minimum touch targets.
- "Skip cinematic introduction" link appears on focus.
- Mobile menu: `aria-expanded`, focus moved in and looped while open, Escape to close, focus returned to the toggle.
- Dialogs use the native `<dialog>` element (focus containment, Escape, inert background) and return focus to their opener.
- The finish selector is a radio group with arrow-key support and a live description of the selection.
- `prefers-reduced-motion`: camera travel is replaced by composed still views of each chapter (short cross-fades), text no longer translates, decorative animations stop.
- No WebGL, a lost context, a render error or a scene that is not ready within 25 s → the same still-image presentation. Nothing is hidden behind the canvas.

No formal accessibility audit or certification has been carried out.

## Performance approach

- Rendering is on demand: frames are drawn only when scroll progress changes or pointer parallax is settling, and rendering stops while the stage is off screen or the tab is hidden.
- Static architecture and furniture are merged into one mesh per material; battens, screen fins, balusters and trees are instanced.
- One shadow-casting light. The shadow map is rendered once after load and then frozen (the scene is static).
- Device pixel ratio capped (1.75 desktop, 1.5 touch). Touch devices get the "low" tier: no post-processing, no planar pool reflection, 512 px textures, fewer trees.
- On desktop, a frame-rate monitor can drop resolution and switch off ambient occlusion once, without rebuilding the scene.
- The 3D code is code-split and loads after the page shell.

Measured during development (in an embedded preview browser, which throttles background frames, so treat as indicative only): production first contentful paint ≈ 0.13 s; procedural texture generation ≈ 0.28 s on the low tier. No Lighthouse or field measurements have been taken.

## Stills

The editorial views, the reduced-motion / fallback chapter stills and the social image are rendered from the live scene in development:

1. `npm run dev`, open `http://localhost:5173/?capture`
2. In the browser console: `__ff.pose('chapter-1'); await __ff.snap('chapter-1.webp')` (poses: `chapter-1`…`chapter-5`, `view-pool`, `view-feature-wall`, `view-stair-up`, `og-image`). Set the frame size first with  
   `document.querySelector('.stage').style.setProperty('--capture-w','1920px')` (and `--capture-h`).
3. A dev-only Vite middleware (`vite.config.ts`) writes the file to `public/renders/` (or `public/og-image.jpg`). It does not exist in production builds.

Re-capture the stills after changing the model, materials or camera poses.

## Film

The photo-real opening is **AI-generated video**, not live rendering:

1. Camera moves were rendered from the 3D scene as plain white models along the site's own camera path (dev-only `?capture` mode).
2. Photo-real stills of the same views were generated with ChatGPT from renders of the scene.
3. Dreamina (Seedance 2.5) turned the stills into one continuous take.
4. The take was re-timed evenly, motion-interpolated to 48 fps with ffmpeg, and stored as `film-src/opening.mp4`.

`npm run dev` and `npm run build` run `scripts/film-frames.mjs` first, which turns each `film-src/<name>.mp4` into a frame sequence in `public/film/<name>/` (generated, not committed). `src/components/Film.tsx` draws those frames to a canvas as you scroll: frames load coarse-to-fine and neighbouring frames are blended, so scrubbing is smooth in both directions, and the 3D renderer pauses while the film covers the screen. Clips, their span on the camera path and their timing are configured in `src/config/film.ts`. The "About this build" dialog discloses the AI-generated film.

## Deployment

`npm run build` produces a fully static site in `dist/`. Asset paths are relative (`base: './'`), so it works at a domain root or under a sub-path (for example GitHub Pages project sites). There are no client-side routes, so refreshes and direct links always resolve to `index.html`. No secrets are embedded.

Set `SITE_URL` at build time once the public address is known. This adds a canonical link and absolute Open Graph image URLs; without it, no address is invented:

```bash
SITE_URL="https://your-public-address/" npm run build
```

### Option A — Netlify (drag and drop, no Git required)

1. `npm run build`
2. Sign in at app.netlify.com → **Add new site → Deploy manually** → drag the `dist` folder in.
3. Note the `https://<name>.netlify.app` address, rebuild with `SITE_URL` set to it, and drag `dist` in again.

### Option B — GitHub Pages

1. Create a repository and push this project.
2. In the repository: **Settings → Pages → Source: GitHub Actions**, and add a workflow that runs `npm ci && npm run build` and uploads `dist` with `actions/upload-pages-artifact` + `actions/deploy-pages`.
3. The site is served at `https://<user>.github.io/<repo>/` over HTTPS.

### Option C — Vercel / Cloudflare Pages

Import the repository; framework preset **Vite**, build command `npm run build`, output directory `dist`.

After deploying, open the public URL and check: the opening scene loads, all five chapters play in both directions, the stills and fonts load (no 404s in the network panel), and `#about-this-build` opens the dialog.

## Asset provenance and licensing

The architecture, textures, sky and tree lines are generated procedurally by this project's code. Most interior furniture and objects are CC0 models from Poly Haven (https://polyhaven.com), compressed with gltf-transform and meshoptimizer (`scripts/optimize-models.mjs`). The opening film and chapter photographs are AI-generated (ChatGPT images, Dreamina / Seedance video) from renders of this scene. The stills and social image were rendered from the scene. The SVG drawings were drawn in code for this project.

Third-party software and fonts:

| Package | Licence |
| --- | --- |
| React, React DOM | MIT |
| three.js | MIT |
| @react-three/fiber, @react-three/drei, @react-three/postprocessing | MIT |
| postprocessing | Zlib |
| n8ao | ISC |
| GSAP (incl. ScrollTrigger) | GSAP Standard "no charge" licence |
| Cormorant Garamond (Christian Thalmann), Inter (Rasmus Andersson), IBM Plex Mono (IBM) via Fontsource | SIL Open Font Licence 1.1 |
| Vite, TypeScript, ESLint | MIT / Apache-2.0 |
| ffmpeg-static (build-time frame extraction) | GPL-3.0 (tool only; not shipped in the site) |
| gltf-transform, meshoptimizer (model compression) | MIT |

The project was developed with the help of AI coding tools.

## Credit and configuration

Creator details live in one place: `src/config/site.ts`. Only the name "James" is set. Add a surname, portfolio URL, repository URL or email there; portfolio and repository links appear in the footer and About dialog only when configured. The contact section uses `studio@example.com`, a reserved placeholder domain, clearly labelled as a demonstration address; no form submits anywhere.

## Known limitations

- The upper-floor rooms are not modelled inside; they read through the windows as lit interior walls.
- Trees are stylised (stacked tiers and painted tree-line bands) rather than botanical models.
- The glass is a thin reflective sheet, not physically refractive.
- Stills must be re-captured manually after design changes.
- Performance has only been checked on the development machine and in device emulation, not on physical phones.
