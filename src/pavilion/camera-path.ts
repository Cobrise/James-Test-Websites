/*
  The 16 s camera move as a continuous function of time, so a scroll position anywhere between two frames
  still gives a smooth camera. 0-4 s: a glide 12 cm over the water. 4-7 s: past the ledge, towel and glass in the
  foreground. 7-12 s: a crane up to 1.5 m that lifts Saturn over the infinity edge. 12-16 s: settling to a
  near-still wide view with open space in the upper left.
*/
import { Matrix4, Vector3 } from 'three';
import { CAM, FILM, SATURN } from './config';
import { clamp, deg, lerp, smootherstep, smoothstep } from './math';

const S = CAM.speed;
// forward speed: eases in, holds a steady glide past the ledge, then decelerates to a slow drift
const speed = (t: number) =>
  smoothstep(0, S.easeIn, t) * (1 - (1 - S.drift) * smootherstep(S.decayStart, S.decayEnd, t));

const N = 4000;
const travelTable = new Float64Array(N + 1);
for (let i = 1; i <= N; i++) {
  const t0 = (FILM.duration * (i - 1)) / N, t1 = (FILM.duration * i) / N;
  travelTable[i] = travelTable[i - 1] + 0.5 * (speed(t0) + speed(t1)) * (t1 - t0);
}
const travel = (t: number) => {
  const u = clamp(t / FILM.duration) * N;
  const i = Math.min(Math.floor(u), N - 1);
  return lerp(travelTable[i], travelTable[i + 1], u - i) / travelTable[N];
};

export interface CameraState { pos: Vector3; yaw: number; pitch: number }

export function cameraState(t: number, out: CameraState = { pos: new Vector3(), yaw: 0, pitch: 0 }): CameraState {
  const c = CAM, k = CAM.timing;
  out.pos.set(
    lerp(c.xStart, c.xEnd, smootherstep(k.x[0], k.x[1], t)),
    lerp(c.yStart, c.yEnd, travel(t)),
    c.zStart
      + (c.zLow - c.zStart) * smoothstep(k.zLow[0], k.zLow[1], t)
      + (c.zHigh - c.zLow) * smootherstep(k.zRise[0], k.zRise[1], t)
      + (c.zEnd - c.zHigh) * smoothstep(k.zSettle[0], k.zSettle[1], t),
  );
  out.yaw = c.yawProps * smoothstep(k.yawProps[0], k.yawProps[1], t)
    + (c.yawEnd - c.yawProps) * smootherstep(k.yawEnd[0], k.yawEnd[1], t);
  out.pitch = lerp(c.pitchStart, c.pitchEnd, smootherstep(k.pitch[0], k.pitch[1], t));
  return out;
}

export function viewDir(yaw: number, pitch: number, out = new Vector3()): Vector3 {
  const a = deg(yaw), b = deg(pitch);
  return out.set(Math.sin(a) * Math.cos(b), Math.cos(a) * Math.cos(b), Math.sin(b));
}

/** Saturn's centre, radius and orientation (local Z = pole and ring normal), from the final camera. */
export function saturnPlacement(): { centre: Vector3; radius: number; matrix: Matrix4 } {
  const s = SATURN;
  const eye = cameraState(FILM.duration).pos;
  const centre = eye.clone().add(viewDir(s.az, s.el).multiplyScalar(s.dist));
  const radius = s.dist * Math.sin(deg(s.angRadius));
  const f = centre.clone().sub(eye).normalize();
  const r = f.clone().cross(new Vector3(0, 0, 1)).normalize();
  const u = r.clone().cross(f);
  const al = deg(s.ringOpen), be = deg(s.ringRoll);
  const x = r.clone().multiplyScalar(Math.cos(be)).addScaledVector(u, Math.sin(be));          // ring major axis in frame
  const upInView = u.clone().multiplyScalar(Math.cos(be)).addScaledVector(r, -Math.sin(be));
  const z = upInView.multiplyScalar(Math.cos(al)).addScaledVector(f, -Math.sin(al)).normalize(); // pole
  const y = z.clone().cross(x);
  const matrix = new Matrix4().makeBasis(x, y, z).setPosition(centre);
  return { centre, radius, matrix };
}
