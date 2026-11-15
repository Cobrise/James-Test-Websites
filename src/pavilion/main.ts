/*
  Alpheon hero: the pool pavilion, built in code and played by the scroll.
  The hero is three screens tall while the film runs; its scroll position picks the moment of the 16 s camera move.
  Rendering is on demand: a frame is drawn only when the scroll or the screen size changes.
  Reduced motion or no WebGL: the page keeps its still hero (and, without WebGL, the earlier photo film).
*/
import { ACESFilmicToneMapping, PerspectiveCamera, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
import { STAR_LAYER, buildPavilion } from './build';
import { cameraState, viewDir, type CameraState } from './camera-path';
import { CAM, FILM, FRAMING, LIGHT, WATER } from './config';
import { clamp, lerp, smootherstep } from './math';

const hero = document.querySelector<HTMLElement>('[data-film]');
const root = document.documentElement;

const fallback = () => import(/* @vite-ignore */ new URL('film.js', document.baseURI).href);

function start(hero: HTMLElement) {
  const old = hero.querySelector<HTMLCanvasElement>('canvas.film__canvas');
  const canvas = document.createElement('canvas');
  canvas.className = 'film__canvas layer';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    void fallback();
    return;
  }
  if (old) old.replaceWith(canvas); else hero.prepend(canvas);

  const pixelRatio = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = LIGHT.exposure;

  const reflection = (): [number, number] => [
    Math.max(64, Math.round(canvas.clientWidth * pixelRatio * WATER.reflectionScale)),
    Math.max(64, Math.round(canvas.clientHeight * pixelRatio * WATER.reflectionScale)),
  ];
  const pavilion = buildPavilion(renderer, pixelRatio, reflection());
  const baseFov = (2 * Math.atan(FILM.sensorMm / 2 / FILM.lensMm / FILM.aspect) * 180) / Math.PI;
  const camera = new PerspectiveCamera(baseFov, FILM.aspect, FILM.near, FILM.far);
  camera.up.set(0, 0, 1);
  camera.layers.enable(STAR_LAYER);
  // the water's mirror camera is a clone of this one; keep the stars out of the reflection
  (pavilion.water as unknown as { getReflectionCamera(c: PerspectiveCamera): PerspectiveCamera })
    .getReflectionCamera(camera).layers.disable(STAR_LAYER);

  const state: CameraState = { pos: new Vector3(), yaw: 0, pitch: 0 };
  const look = new Vector3(), dir = new Vector3();
  let w = 0, h = 0;

  const draw = (t: number) => {
    cameraState(t, state);
    camera.position.copy(state.pos);
    camera.lookAt(look.copy(state.pos).add(viewDir(state.yaw, state.pitch, dir)));
    // the composed frame is 16:9; a narrower screen shows a slice of it (a little wider), panned with the action
    const aspect = w / h;
    if (aspect < FILM.aspect) {
      camera.fov = baseFov * lerp(1, FRAMING.portraitWiden, clamp((FILM.aspect - aspect) / (FILM.aspect - 0.5)));
      const fullW = h * FILM.aspect;
      const centre = lerp(FRAMING.cropStart, FRAMING.cropEnd, smootherstep(FRAMING.cropShift[0], FRAMING.cropShift[1], t));
      camera.setViewOffset(fullW, h, clamp(centre * fullW - w / 2, 0, fullW - w), 0, w, h);
    } else {
      camera.fov = baseFov;
      const fullH = w / FILM.aspect;
      camera.setViewOffset(w, fullH, 0, (fullH - h) / 2, w, h);
    }
    camera.updateProjectionMatrix();
    renderer.render(pavilion.scene, camera);
  };

  const progress = () => {
    const range = hero.offsetHeight - innerHeight;
    return range > 0 ? clamp(-hero.getBoundingClientRect().top / range) : 0;
  };

  let target = progress(), shown = target, raf = 0;
  const tick = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const next = shown + (target - shown) * CAM.smooth;
      const done = Math.abs(target - next) < 0.0003;
      shown = done ? target : next;
      draw(shown * FILM.duration);
      if (!done) tick();
    });
  };
  const onScroll = () => { target = progress(); tick(); };

  const resize = () => {
    w = Math.max(1, canvas.clientWidth); h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    pavilion.water.getRenderTarget().setSize(...reflection());
    draw(shown * FILM.duration);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  hero.classList.add('is-3d');

  addEventListener('scroll', onScroll, { passive: true });
  // for checking frames by hand: add ?pavilion-debug to the URL, then pavilionDebug.draw(seconds)
  if (new URLSearchParams(location.search).has('pavilion-debug')) {
    // drawing by hand stops the scroll from driving the camera
    const drawAt = (t: number) => {
      removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); raf = 0;
      shown = target = clamp(t / FILM.duration); draw(t);
    };
    (window as unknown as { pavilionDebug: object }).pavilionDebug = { draw: drawAt, renderer, scene: pavilion.scene };
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); });
  const stop = () => {
    removeEventListener('scroll', onScroll);
    root.classList.remove('film-js');
    hero.classList.remove('is-3d');
    pavilion.dispose();
    renderer.dispose();
  };
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', e => { if (e.matches) stop(); });
}

if (hero && root.classList.contains('film-js')) start(hero);
