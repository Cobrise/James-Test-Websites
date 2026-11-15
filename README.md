# Alpheon Resorts

A one-page website for **Alpheon Resorts**, a fictional line of luxury interstellar resort voyages. The hero is a live 3D pool pavilion aboard the starliner, built entirely in code with three.js. Scrolling plays a 16-second camera move, from 12 cm above the water up to a wide view of Saturn.

All prices, voyage lengths, suite sizes, opening hours and guest numbers on the page are placeholders made up for this fictional brand. They're marked `data-assumed` in `index.html`.

## View it

The site is static: plain HTML, CSS and JavaScript, with the 3D hero already built into `hero3d/pavilion.js`. It needs a local web server, because browsers block module scripts on `file://` pages:

```bash
python3 -m http.server 5722
```

Then open http://localhost:5722.

### GitHub Pages

The repository root is the site, so it can be published as is. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`. The empty `.nojekyll` file tells Pages to serve the files exactly as they are.

## Edit the 3D hero

The pavilion is TypeScript in `src/pavilion/`, bundled by Vite into `hero3d/pavilion.js`. It needs Node 20.19 or newer.

```bash
npm install        # three.js, TypeScript and Vite
npm run build      # type-check, then build hero3d/pavilion.js
npm run watch      # rebuild on every save
```

Commit the rebuilt `hero3d/` folder, because the published site loads that file directly.

| File | What it holds |
| --- | --- |
| `src/pavilion/config.ts` | Every number: sizes, positions, colours, lights and the camera timing. Change a value and rebuild. |
| `src/pavilion/build.ts` | Assembles the room, pool, props, Saturn, stars and lights. Parts that share a material are merged, and repeated parts are instanced. |
| `src/pavilion/textures.ts` | Stone, mosaic, plaster, walnut, fabric, ripples, Saturn's bands and the rings, all drawn on canvas in code. |
| `src/pavilion/water.ts` | The water: a planar reflection bent by the ripple map. |
| `src/pavilion/camera-path.ts` | The camera move as a smooth function of time, and Saturn's placement. |
| `src/pavilion/main.ts` | Mounts the scene in the hero and renders a frame only when the scroll or the window size changes. |

To check a single moment of the move, open the page with `?pavilion-debug` and run `pavilionDebug.draw(8)` in the browser console, giving the time in seconds.

### Fallbacks

- **Reduced motion:** the hero is one still screen.
- **No WebGL:** `film.js` plays the earlier scroll film, a slow camera move across three of the renders.

## Folder layout

```
index.html        the page
assets/           layout, motion and UI styles and scripts
images/           photographs (the client's renders) and logos
hero3d/           the built 3D hero (generated: run npm run build)
src/pavilion/     the 3D hero's TypeScript source
film.js           the no-WebGL fallback film
```

## Credits

- Renders and logo: supplied by the Alpheon Resorts client.
- Fonts: Instrument Serif and Instrument Sans, from Google Fonts.
- 3D: [three.js](https://threejs.org) (MIT licence). Every model and texture in the hero is generated in code, with no downloaded assets.
