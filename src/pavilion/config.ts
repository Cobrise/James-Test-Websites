/*
  Alpheon pool pavilion: every number that shapes the scene and the camera move.
  Change a value here and run `npm run build`; the geometry, materials and camera all follow.

  Units are metres and seconds. Z is up, +Y runs down the pool toward the panoramic window,
  +X is to the right. The water surface is z = 0.
*/

export const FILM = {
  duration: 16,            // seconds of camera move, played by the hero's scroll
  fps: 24,                 // only used to describe frames (1-384); the move itself is continuous
  lensMm: 28,
  sensorMm: 36,            // full-frame width, horizontal fit
  aspect: 16 / 9,          // the composed frame; other screens crop it (see FRAMING)
  near: 0.05,
  far: 4000,
};

export const POOL = {
  waterZ: 0,
  deckZ: 0.12,             // deck top above the water
  x0: -3, x1: 3,           // 6 m wide
  y0: 0, y1: 14,           // 14 m long
  floorZ: -1.4,            // basin depth
  wallT: 0.25,             // basin wall thickness
  copingH: 0.05,           // stone coping on the walls
  copingLip: 0.03,         // coping overhang into the pool
  edgeT: 0.15,             // infinity edge wall
  edgeTopZ: -0.01,         // just under the water line
  catchFloorZ: -1.0,       // catch basin behind the infinity edge
  tileSize: 0.5,           // metres covered by one repeat of the mosaic texture (8 x 8 tiles)
};

export const HALL = {
  x0: -5.5, x1: 6.0,       // inside faces of the side walls
  y0: -2.0,                // the hall starts just behind the camera
  windowY: 17.0,           // panoramic window plane
  ceilingZ: 3.9,           // ceiling underside
  slabT: 0.3,
  wallT: 0.3,
  column: 0.45,            // side column section
  windowColumn: 0.55,
  beamDepth: 0.4,
  beamWidth: 0.4,
  headerDepth: 0.5,        // beam over the window
  sideColumnY: [5.0, 11.0],
  floorTile: 1.2,          // stone floor slab size
  coveDrop: 0.06,          // lit cove along the top of each side wall
};

// Water: a planar reflection bent by code-drawn ripples (water.ts).
export const WATER = {
  tint: 0xd6e2e4,          // colour of the reflected room
  rippleRepeat: [2, 4] as [number, number],   // ripple map repeats across and along the pool
  distortion: 0.018,       // how far the ripples bend the reflection
  clarity: 0.8,            // opacity when looking straight down (lower shows more of the mosaic)
  reflectionScale: 0.5,    // reflection resolution relative to the screen
};

export const LEDGE = { x0: -3.55, x1: -3.05, y0: 4.4, y1: 6.8, h: 0.25, radius: 0.02 };

export const PROPS = {
  towel: {
    x: -3.22, y: 5.95, turnDeg: 98,
    // folded layers bottom to top: [length, width, thickness, offset x, offset y, turn deg]
    layers: [
      [0.40, 0.30, 0.052, 0, 0, 0],
      [0.39, 0.29, 0.050, 0.004, -0.003, 2],
      [0.38, 0.29, 0.048, -0.003, 0.004, -1.5],
    ] as [number, number, number, number, number, number][],
    radius: 0.016,
  },
  glass: { x: -3.12, y: 5.40, radius: 0.038, height: 0.14, wall: 0.0025, base: 0.008, fill: 0.62 },
  loungers: {
    ys: [12.0, 14.7],      // two loungers along the right walkway, backrest toward the camera
    x: 4.15,
    length: 2.0,
    width: 0.72,
    plinthH: 0.30,
    backAngleDeg: 38,
    backLength: 0.80,
    cushionT: 0.10,
  },
};

// The camera path (see camera-path.ts). Times are seconds into the 16 s move.
export const CAM = {
  yStart: 0.55, yEnd: 6.6,          // forward glide down the pool
  xStart: -2.45, xEnd: -0.55,       // starts near the ledge, drifts toward the centre as it rises
  zStart: 0.12, zLow: 0.24,         // 12 cm above the water until 4 s, 24 cm by the end of the ledge
  zHigh: 1.50, zEnd: 1.55,          // crane up to 1.5 m, then a last settle
  yawProps: -4, yawEnd: 6,          // degrees, + turns right: a touch left toward the props, then right
  pitchStart: 1.5, pitchEnd: -5,    // degrees, + looks up
  speed: { easeIn: 1.4, decayStart: 6.0, decayEnd: 15.6, drift: 0.035 },
  timing: {
    x: [6.5, 14.5], zLow: [3.0, 7.5], zRise: [6.8, 12.6], zSettle: [11.5, 16.0],
    yawProps: [1.0, 5.5], yawEnd: [6.5, 15.0], pitch: [6.5, 14.0],
  },
  smooth: 0.14,                     // how fast the drawn frame catches up with the scroll (0..1)
};

// Screens narrower than 16:9 crop the composed frame from the side and widen it a little;
// the crop pans from the props (early) to Saturn (late).
export const FRAMING = { portraitWiden: 1.3, cropStart: 0.40, cropEnd: 0.60, cropShift: [5.0, 12.0] };

// Saturn is placed from the camera's final position, so the composition holds if the camera moves.
export const SATURN = {
  az: 14,              // degrees right of straight down the pool, seen from the final camera
  el: -4.6,            // degrees above the horizontal
  dist: 260,           // metres; far enough that the 1.4 m rise barely shifts it
  angRadius: 6.5,      // degrees; the planet's size in frame
  oblate: 0.90,        // polar flattening
  ringIn: 1.24, ringOut: 2.27,    // ring radii in planet radii
  ringOpen: 18,        // how far the ring plane opens toward the camera, degrees
  ringRoll: 20,        // diagonal tilt across the frame, rising to the right, degrees
  segments: 128,
};

export const SPACE = { background: 0x04060b, stars: 3200, starRadius: 2500, seed: 11 };

export const LIGHT = {
  sunDir: [0.62, 0.70, -0.36] as [number, number, number],   // the way the sunlight travels
  sun: 2.4,
  sunColor: 0xfff3e2,
  hemiSky: 0x8a96ad, hemiGround: 0x3b342b, hemi: 0.55,
  lamps: [[-1.5, 2.5, 3.3], [1.5, 8.5, 3.3], [-1.0, 13.5, 3.3]] as [number, number, number][],
  lamp: 6.0, lampColor: 0xffd9a8, lampRange: 14,
  cove: 0xffe2b8,
  exposure: 1.05,
  envCapture: [0, 7, 1.0] as [number, number, number],      // where the water's reflection is captured
  envSize: 512,
};

// Brand colours from the Alpheon logo, plus the pavilion's stone and lacquer.
export const PALETTE = {
  ivory: 0xf6f3ee,
  navy: 0x1d2538,
  brass: 0xb79964,
  stone: 0xd9d1c3,
  plaster: 0xe6e0d6,
  mosaic: 0x6f8f99,
  water: 0x0a2830,
  walnut: 0x4a3426,
  cushion: 0xe8e1d3,
  towel: 0xf4f0e8,
  saturn: [0xe3cfa4, 0xd2b483, 0xc6a473, 0xe8d8b4, 0xb8966a, 0xdcc49a, 0xa88a63],
};
