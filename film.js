/*
  Alpheon hero film. The client asked for a hero that plays a video as you scroll down. Until a clip
  exists, this draws a camera move through three of the client's renders on a canvas, scrubbed to the
  scroll: the reception deck, then the grand atrium, then the observation lounge window. Each shot
  pushes in while the next one dissolves over it, so it reads as one continuous move.

  A real clip replaces it with one line in index.html (see the comment on the hero):
    <video class="film__video" data-film-video src="alpheon-hero.mp4" muted playsinline preload="auto"></video>
  then its currentTime is scrubbed instead of the canvas.

  Reduced motion or no script: the hero is one still screen showing the reception render.
*/
const hero = document.querySelector('[data-film]');
const live = document.documentElement.classList.contains('film-js');

// each shot: its render, the share of the scroll it covers [in, out], and the camera [scale, x, y]
// at its start and end (x, y: the point of the picture held at the centre of the screen)
const SHOTS = [
  { src: 'images/welcome-aboard.jpg',     span: [0.00, 0.40], from: [1.00, 0.50, 0.50], to: [1.30, 0.47, 0.54] },
  { src: 'images/grand-atrium.jpg',       span: [0.30, 0.72], from: [1.12, 0.50, 0.58], to: [1.48, 0.50, 0.34] },
  { src: 'images/observation-lounge.jpg', span: [0.62, 1.00], from: [1.05, 0.55, 0.52], to: [1.70, 0.83, 0.42] },
];
const FADE = 0.08;            // the share of the scroll each dissolve takes
const SMOOTH = 0.14;          // how fast the drawn frame catches up with the scroll (0 to 1)

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

if (hero && live) {
  const canvas = hero.querySelector('.film__canvas');
  const video = hero.querySelector('video[data-film-video]');
  const ctx = canvas.getContext('2d');
  let target = 0, shown = -1, raf = 0, ready = false, w = 0, h = 0;

  const progress = () => {
    const range = hero.offsetHeight - innerHeight;
    return range > 0 ? clamp(-hero.getBoundingClientRect().top / range) : 0;
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = Math.round(canvas.clientWidth * dpr); h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.imageSmoothingQuality = 'high';
    if (ready) { shown = target = progress(); paint(shown); }
  };

  const drawShot = (shot, p, alpha) => {
    const img = shot.img;
    if (!img || !img.naturalWidth || alpha <= 0) return;
    const t = ease(clamp((p - shot.span[0]) / (shot.span[1] - shot.span[0])));
    const s = lerp(shot.from[0], shot.to[0], t), fx = lerp(shot.from[1], shot.to[1], t), fy = lerp(shot.from[2], shot.to[2], t);
    const k = Math.max(w / img.naturalWidth, h / img.naturalHeight) * s;
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
    const x = clamp(w / 2 - fx * dw, w - dw, 0), y = clamp(h / 2 - fy * dh, h - dh, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, dw, dh);
  };

  const draw = p => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0d1220'; ctx.fillRect(0, 0, w, h);
    SHOTS.forEach((shot, i) => {
      if (p < shot.span[0] || p > shot.span[1] + 0.001) return;
      const a = i === 0 ? 1 : clamp((p - shot.span[0]) / FADE);
      drawShot(shot, p, a);
    });
  };

  const paint = p => { if (video) { if (video.duration) video.currentTime = p * (video.duration - 0.05); } else draw(p); };

  const tick = () => {
    if (raf) return;
    raf = requestAnimationFrame(function frame() {
      raf = 0;
      if (!ready) return;
      const next = shown < 0 ? target : shown + (target - shown) * SMOOTH;
      const done = Math.abs(target - next) < 0.0004;
      shown = done ? target : next;
      paint(shown);
      if (!done) tick();
    });
  };

  const onScroll = () => { target = progress(); tick(); };

  if (video) {
    video.pause();
    const go = () => { ready = true; hero.classList.add('is-video'); onScroll(); };
    video.readyState >= 1 ? go() : video.addEventListener('loadedmetadata', go, { once: true });
  } else {
    Promise.all(SHOTS.map(shot => new Promise(res => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => res(img));
      img.onerror = () => res(null);
      img.src = shot.src;
      shot.img = img;
    }))).then(imgs => {
      if (!imgs[0]) return;               // the poster stays
      ready = true;
      resize();                            // paints the frame for the current scroll at once
      hero.classList.add('is-live');
    });
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', resize);
  // the hero is three screens only while the film can run; a switch to reduced motion makes it one still screen
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', e => {
    if (e.matches) { document.documentElement.classList.remove('film-js'); hero.classList.remove('is-live', 'is-video'); }
  });
}
