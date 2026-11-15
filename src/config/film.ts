/**
 * The photo-real film that plays over the live scene. Each clip was generated
 * (Dreamina / Seedance) from a motion guide rendered along our own camera path,
 * so it covers a known stretch of that path: from control point `from` to `to`
 * (see scene/camera/cameraPath.ts). Scrolling scrubs the clip; outside every
 * clip the real-time model shows, and where a clip ends next to the model it
 * cross-fades into the same view.
 *
 * Add clips here as they are made — nothing else needs to change.
 */
interface ClipBase {
  from: number
  to: number
  /** Width of a cross-fade into the live model, in control points (default 12% of the clip). */
  fade?: number
}

export type FilmClip =
  | (ClipBase & { kind: 'still'; src: string })
  | (ClipBase & {
      kind: 'sequence'
      /** Folder of frames named 0001.webp, 0002.webp, … */
      src: string
      poster: string
      frames: number
      fps: number
      /**
       * Optional [control point, seconds] pairs pinning moments of the clip to
       * the camera path. Between pairs the time is interpolated linearly;
       * without it, time is linear along the clip.
       */
      timeline?: [number, number][]
    })

const film = (file: string) => `${import.meta.env.BASE_URL}film/${file}`

export const filmClips: FilmClip[] = [
  // One continuous take (Seedance 2.5 draft, multi-reference from our stills):
  // aerial → across the pool → pool corner → porch → hall, then a cut into the
  // living room. Times were measured against each still.
  {
    kind: 'sequence',
    src: film('opening'),
    poster: film('opening-poster.jpg'),
    frames: 719, // 24 fps source, motion-interpolated to 48
    fps: 48,
    from: 0,
    to: 11.5,
    fade: 0.4,
    timeline: [
      [0, 0], // 01 rest: the drone descent under the opening text
      [1, 2.2],
      [2, 4.2], // across the pool
      [3, 6.7], // pool corner
      [4, 9.0], // 02 rest: the open porch
      [5, 10.0],
      [7, 12.6], // through the door
      [9.9, 13.95], // the hall
      [10, 14.1], // cut into the living room as 03 begins
      [11, 15],
    ],
  },
  // Photo-real stills for the chapters the film does not reach yet.
  { kind: 'still', src: film('frame-4.jpg'), from: 13.8, to: 15.8 }, // 04 stair hall
  { kind: 'still', src: film('frame-5.jpg'), from: 16.8, to: 18 }, // 05 bench corner
]
