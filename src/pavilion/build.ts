/*
  Builds the pool pavilion from config.ts: architecture, pool, props, Saturn, stars and lights.
  Parts that share a material are merged into one mesh; repeated parts (columns, beams, loungers) are instanced.
*/
import {
  AdditiveBlending, BufferGeometry, Color, CubeCamera, CylinderGeometry, DirectionalLight, DoubleSide,
  ExtrudeGeometry, Float32BufferAttribute, Group, HalfFloatType, HemisphereLight, InstancedMesh, LatheGeometry,
  Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator,
  PointLight, Points, PointsMaterial, RingGeometry, Scene, SphereGeometry, Vector2, Vector3, WebGLCubeRenderTarget,
  type Material, type Texture, type WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Reflector } from 'three/addons/objects/Reflector.js';
import { makeWater } from './water';
import { HALL, LEDGE, LIGHT, PALETTE, POOL, PROPS, SATURN, SPACE } from './config';
import { saturnPlacement } from './camera-path';
import { merge, outline, sideViewToWorld, span, worldUV } from './geometry';
import { deg, rng } from './math';
import {
  fabricTextures, mosaicTextures, plasterTexture, ringTexture, saturnTexture, stoneTextures, waterNormal, woodTexture,
} from './textures';

/** The layer the stars live on; the hero camera enables it, the reflection cameras do not. */
export const STAR_LAYER = 1;

export interface Pavilion { scene: Scene; water: Reflector; dispose(): void }

const repeat = (t: Texture, x: number, y = x) => { t.repeat.set(x, y); return t; };

export function buildPavilion(renderer: WebGLRenderer, pixelRatio: number, reflectionSize: [number, number]): Pavilion {
  const scene = new Scene();
  scene.background = new Color(SPACE.background);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => { disposables.push(x); return x; };

  // ---------------------------------------------------------------- materials
  const stone = stoneTextures();
  const mosaic = mosaicTextures();
  const fabric = fabricTextures(PALETTE.cushion, 256, 64);
  repeat(fabric.map, 3); repeat(fabric.normal, 3);
  const terry = fabricTextures(PALETTE.towel, 256, 96);
  const M = {
    stone: new MeshStandardMaterial({ map: stone.map, normalMap: stone.normal, roughness: 0.5, envMapIntensity: 0.6 }),
    mosaic: new MeshStandardMaterial({ map: mosaic.map, normalMap: mosaic.normal, roughness: 0.25, envMapIntensity: 0.8 }),
    plaster: new MeshStandardMaterial({ map: plasterTexture(PALETTE.plaster), roughness: 0.92, envMapIntensity: 0.4 }),
    ceiling: new MeshStandardMaterial({ map: plasterTexture(PALETTE.ivory), roughness: 0.95, envMapIntensity: 0.3 }),
    lacquer: new MeshStandardMaterial({ color: PALETTE.navy, roughness: 0.32, metalness: 0.1, envMapIntensity: 0.9 }),
    brass: new MeshStandardMaterial({ color: PALETTE.brass, roughness: 0.28, metalness: 1, envMapIntensity: 1.2 }),
    cove: new MeshBasicMaterial({ color: LIGHT.cove }),
    towel: new MeshStandardMaterial({ map: terry.map, normalMap: terry.normal, roughness: 1, envMapIntensity: 0.3 }),
    cushion: new MeshStandardMaterial({ map: fabric.map, normalMap: fabric.normal, roughness: 0.95, envMapIntensity: 0.3 }),
    walnut: new MeshStandardMaterial({ map: repeat(woodTexture(), 0.6, 0.6), roughness: 0.45, envMapIntensity: 0.6 }),
    glass: new MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.28, clearcoat: 1,
      envMapIntensity: 1.6, side: DoubleSide, depthWrite: false,
    }),
    drink: new MeshStandardMaterial({ color: 0xcfe6ea, roughness: 0.05, transparent: true, opacity: 0.45, depthWrite: false }),
    saturn: new MeshStandardMaterial({ map: saturnTexture(), roughness: 1, metalness: 0, envMapIntensity: 0 }),
    rings: new MeshStandardMaterial({
      map: ringTexture(), roughness: 1, metalness: 0, envMapIntensity: 0, transparent: true, side: DoubleSide, depthWrite: false,
    }),
  };
  Object.values(M).forEach(m => keep(m as Material));
  const add = (geo: BufferGeometry, mat: Material, name: string) => {
    const mesh = new Mesh(geo, mat);
    mesh.name = name;
    scene.add(mesh);
    keep(geo);
    return mesh;
  };
  const instanced = (geo: BufferGeometry, mat: Material, name: string, at: [number, number, number][]) => {
    const mesh = new InstancedMesh(geo, mat, at.length);
    const m = new Matrix4();
    at.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p[0], p[1], p[2])));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.name = name;
    scene.add(mesh);
    keep(geo);
    return mesh;
  };

  const { deckZ } = POOL;
  const slabZ0 = deckZ - HALL.slabT;
  const wx0 = POOL.x0 - POOL.wallT, wx1 = POOL.x1 + POOL.wallT;
  const copeZ0 = deckZ - POOL.copingH;
  const ledgeTop = deckZ + LEDGE.h;

  // ---------------------------------------------------------------- floors, coping and the ledge (stone)
  const ledge = new RoundedBoxGeometry(LEDGE.x1 - LEDGE.x0, LEDGE.y1 - LEDGE.y0, LEDGE.h, 2, LEDGE.radius);
  ledge.translate((LEDGE.x0 + LEDGE.x1) / 2, (LEDGE.y0 + LEDGE.y1) / 2, deckZ + LEDGE.h / 2);
  add(worldUV(merge([
    span(HALL.x0, wx0, HALL.y0, HALL.windowY, slabZ0, deckZ),
    span(wx1, HALL.x1, HALL.y0, HALL.windowY, slabZ0, deckZ),
    span(wx0, wx1, HALL.y0, POOL.y0 - POOL.wallT, slabZ0, deckZ),
    span(wx0, POOL.x0 + POOL.copingLip, POOL.y0 - POOL.wallT, HALL.windowY, copeZ0, deckZ),
    span(POOL.x1 - POOL.copingLip, wx1, POOL.y0 - POOL.wallT, HALL.windowY, copeZ0, deckZ),
    span(wx0, wx1, POOL.y0 - POOL.wallT, POOL.y0 + POOL.copingLip, copeZ0, deckZ),
    ledge,
  ]), HALL.floorTile * 2), M.stone, 'floor-stone');

  // ---------------------------------------------------------------- the basin (mosaic)
  const bottom = POOL.floorZ - 0.2;
  add(worldUV(merge([
    span(POOL.x0, POOL.x1, POOL.y0, POOL.y1, bottom, POOL.floorZ),
    span(wx0, wx1, POOL.y0 - POOL.wallT, POOL.y0, bottom, copeZ0),
    span(wx0, POOL.x0, POOL.y0, HALL.windowY, bottom, copeZ0),
    span(POOL.x1, wx1, POOL.y0, HALL.windowY, bottom, copeZ0),
    span(POOL.x0, POOL.x1, POOL.y1, POOL.y1 + POOL.edgeT, bottom, POOL.edgeTopZ),       // infinity edge
    span(POOL.x0, POOL.x1, POOL.y1 + POOL.edgeT, HALL.windowY - 0.1, POOL.catchFloorZ - 0.2, POOL.catchFloorZ),
  ]), POOL.tileSize), M.mosaic, 'pool-mosaic');

  const ripples = keep(waterNormal());
  const water = makeWater(ripples, reflectionSize[0], reflectionSize[1]);
  scene.add(water);
  keep(water);

  // ---------------------------------------------------------------- walls and ceiling (plaster)
  const top = HALL.ceilingZ + HALL.slabT;
  add(worldUV(merge([
    span(HALL.x0 - HALL.wallT, HALL.x0, HALL.y0, HALL.windowY + 0.25, slabZ0, top),
    span(HALL.x1, HALL.x1 + HALL.wallT, HALL.y0, HALL.windowY + 0.25, slabZ0, top),
  ]), 3), M.plaster, 'walls');
  add(worldUV(span(HALL.x0 - HALL.wallT, HALL.x1 + HALL.wallT, HALL.y0, HALL.windowY + 0.25, HALL.ceilingZ, top), 3),
    M.ceiling, 'ceiling');
  add(merge([
    span(HALL.x0, HALL.x0 + 0.12, HALL.y0, HALL.windowY - 0.3, HALL.ceilingZ - HALL.coveDrop, HALL.ceilingZ),
    span(HALL.x1 - 0.12, HALL.x1, HALL.y0, HALL.windowY - 0.3, HALL.ceilingZ - HALL.coveDrop, HALL.ceilingZ),
  ]), M.cove, 'cove-light');

  // ---------------------------------------------------------------- structure (navy lacquer), instanced where repeated
  const c = HALL.column, colTop = HALL.ceilingZ - HALL.beamDepth;
  instanced(span(-c / 2, c / 2, -c / 2, c / 2, deckZ, colTop), M.lacquer, 'side-columns',
    HALL.sideColumnY.flatMap(y => [[HALL.x0 + c / 2, y, 0], [HALL.x1 - c / 2, y, 0]] as [number, number, number][]));
  instanced(span(HALL.x0, HALL.x1, -HALL.beamWidth / 2, HALL.beamWidth / 2, colTop, HALL.ceilingZ), M.lacquer, 'beams',
    HALL.sideColumnY.map(y => [0, y, 0] as [number, number, number]));
  const hz0 = HALL.ceilingZ - HALL.headerDepth, wc = HALL.windowColumn;
  instanced(span(-wc / 2, wc / 2, -0.3, 0.25, deckZ, hz0), M.lacquer, 'window-columns',
    [[HALL.x0 + wc / 2, HALL.windowY, 0], [HALL.x1 - wc / 2, HALL.windowY, 0]]);
  add(merge([
    span(HALL.x0, HALL.x1, HALL.windowY - 0.25, HALL.windowY + 0.25, hz0, HALL.ceilingZ),               // window header
    span(POOL.x0, POOL.x1, HALL.windowY - 0.1, HALL.windowY + 0.25, POOL.catchFloorZ - 0.25, POOL.catchFloorZ + 0.05),
  ]), M.lacquer, 'window-frame');
  // brass reveals: under the header and at each column foot
  add(merge([
    span(HALL.x0 + wc, HALL.x1 - wc, HALL.windowY - 0.27, HALL.windowY - 0.2, hz0 - 0.03, hz0),
    ...HALL.sideColumnY.flatMap(y => [
      span(HALL.x0, HALL.x0 + c + 0.02, y - c / 2 - 0.01, y + c / 2 + 0.01, deckZ, deckZ + 0.08),
      span(HALL.x1 - c - 0.02, HALL.x1, y - c / 2 - 0.01, y + c / 2 + 0.01, deckZ, deckZ + 0.08),
    ]),
  ]), M.brass, 'brass-trim');

  // ---------------------------------------------------------------- props: towel, glass, loungers
  const T = PROPS.towel;
  const layers: BufferGeometry[] = [];
  let z = 0;
  for (const [len, wid, thick, ox, oy, turn] of T.layers) {
    const g = new RoundedBoxGeometry(len, wid, thick, 3, Math.min(T.radius, thick / 2 - 0.001));
    g.rotateZ(deg(turn));
    g.translate(ox, oy, z + thick / 2);
    layers.push(g);
    z += thick;
  }
  const towel = merge(layers);
  towel.rotateZ(deg(T.turnDeg));
  towel.translate(T.x, T.y, ledgeTop);
  add(towel, M.towel, 'towel');

  const G = PROPS.glass;
  const glass = new LatheGeometry([
    new Vector2(0, 0), new Vector2(G.radius, 0), new Vector2(G.radius, G.height),
    new Vector2(G.radius - G.wall, G.height), new Vector2(G.radius - G.wall, G.base), new Vector2(0, G.base),
  ], 48);
  glass.rotateX(Math.PI / 2);
  glass.translate(G.x, G.y, ledgeTop);
  add(glass, M.glass, 'glass').renderOrder = 2;
  const fillH = (G.height - G.base) * G.fill;
  const drink = new CylinderGeometry(G.radius - G.wall - 0.0006, G.radius - G.wall - 0.0006, fillH, 48);
  drink.rotateX(Math.PI / 2);
  drink.translate(G.x, G.y, ledgeTop + G.base + fillH / 2);
  add(drink, M.drink, 'drink').renderOrder = 1;

  const L = PROPS.loungers;
  const half = L.length / 2, a = deg(L.backAngleDeg);
  const plinth = new ExtrudeGeometry(outline([
    [-half + 0.06, 0], [half - 0.06, 0], [half - 0.06, 0.06], [half, 0.06], [half, L.plinthH],
    [-half, L.plinthH], [-half, 0.06], [-half + 0.06, 0.06],
  ]), { depth: L.width, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
  plinth.applyMatrix4(sideViewToWorld(L.width));
  // cushion: a flat seat that folds up into a reclined back at the head end
  const hu = half - L.backLength * Math.cos(a) - 0.01, t = L.cushionT, base = L.plinthH;
  const p1: [number, number] = [hu + L.backLength * Math.cos(a), base + L.backLength * Math.sin(a)];
  const p2: [number, number] = [p1[0] - Math.sin(a) * t, p1[1] + Math.cos(a) * t];
  const k = (p2[1] - (base + t)) / Math.sin(a);
  const cushionW = L.width - 0.05;
  const cushion = new ExtrudeGeometry(outline([
    [-half + 0.03, base], [hu, base], p1, p2, [p2[0] - k * Math.cos(a), base + t], [-half + 0.03, base + t],
  ]), { depth: cushionW, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 4, curveSegments: 6 });
  cushion.translate(0, 0.02, 0);
  cushion.applyMatrix4(sideViewToWorld(cushionW));
  const loungerAt = L.ys.map(y => [L.x, y, deckZ] as [number, number, number]);
  instanced(plinth, M.walnut, 'lounger-plinths', loungerAt);
  instanced(cushion, M.cushion, 'lounger-cushions', loungerAt);

  // ---------------------------------------------------------------- Saturn and its rings
  const sat = saturnPlacement();
  const planetGeo = new SphereGeometry(sat.radius, SATURN.segments, SATURN.segments / 2);
  planetGeo.rotateX(Math.PI / 2);                     // poles on local Z, the ring normal
  planetGeo.scale(1, 1, SATURN.oblate);
  const ringIn = sat.radius * SATURN.ringIn, ringOut = sat.radius * SATURN.ringOut;
  const ringGeo = new RingGeometry(ringIn, ringOut, SATURN.segments * 2, 1);
  const pos = ringGeo.getAttribute('position'), uv = ringGeo.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) - ringIn) / (ringOut - ringIn), 0.5);
  const saturn = new Group();
  saturn.name = 'saturn';
  saturn.matrixAutoUpdate = false;
  saturn.matrix.copy(sat.matrix);
  saturn.add(new Mesh(planetGeo, M.saturn), new Mesh(ringGeo, M.rings));
  keep(planetGeo); keep(ringGeo);
  scene.add(saturn);

  // ---------------------------------------------------------------- stars
  const rand = rng(SPACE.seed);
  const starPos: number[] = [], starCol: number[] = [];
  for (let i = 0; i < SPACE.stars; i++) {
    const zz = rand() * 2 - 1, th = rand() * Math.PI * 2, rr = Math.sqrt(1 - zz * zz);
    const d = new Vector3(rr * Math.cos(th), rr * Math.sin(th), zz);
    if (d.y < -0.1) continue;                         // only the sky the window can see
    d.multiplyScalar(SPACE.starRadius).add(new Vector3(0, 8, 0));
    starPos.push(d.x, d.y, d.z);
    const b = 0.25 + rand() ** 3 * 0.75, warm = rand();
    starCol.push(b * (0.9 + warm * 0.1), b * 0.95, b * (1 - warm * 0.12));
  }
  const starGeo = keep(new BufferGeometry());
  starGeo.setAttribute('position', new Float32BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new Float32BufferAttribute(starCol, 3));
  const stars = new Points(starGeo, keep(new PointsMaterial({
    size: 1.3 * pixelRatio, sizeAttenuation: false, vertexColors: true, depthWrite: false, blending: AdditiveBlending,
  })));
  stars.name = 'stars';
  stars.layers.set(STAR_LAYER);                     // seen by the main camera only, never in the water or reflections
  scene.add(stars);

  // ---------------------------------------------------------------- lights
  const hemi = new HemisphereLight(LIGHT.hemiSky, LIGHT.hemiGround, LIGHT.hemi);
  hemi.position.set(0, 0, 1);
  const sun = new DirectionalLight(LIGHT.sunColor, LIGHT.sun);
  sun.position.set(-LIGHT.sunDir[0], -LIGHT.sunDir[1], -LIGHT.sunDir[2]).multiplyScalar(100);
  scene.add(hemi, sun);
  for (const p of LIGHT.lamps) {
    const lamp = new PointLight(LIGHT.lampColor, LIGHT.lamp, LIGHT.lampRange, 2);
    lamp.position.set(p[0], p[1], p[2]);
    scene.add(lamp);
  }

  // ---------------------------------------------------------------- reflections: one capture of the finished room
  const cubeTarget = new WebGLCubeRenderTarget(LIGHT.envSize, { type: HalfFloatType });
  const cubeCam = new CubeCamera(0.1, SPACE.starRadius * 1.5, cubeTarget);
  cubeCam.position.set(...LIGHT.envCapture);
  water.visible = false;
  cubeCam.update(renderer, scene);
  water.visible = true;
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromCubemap(cubeTarget.texture);
  scene.environment = env.texture;
  pmrem.dispose();
  cubeTarget.dispose();
  keep(env);

  return {
    scene,
    water,
    dispose() {
      disposables.forEach(d => d.dispose());
      for (const m of Object.values(M)) for (const v of Object.values(m)) if ((v as Texture)?.isTexture) (v as Texture).dispose();
    },
  };
}
