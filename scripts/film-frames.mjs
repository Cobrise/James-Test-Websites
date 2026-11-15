// Rebuilds the film frame sequences the site plays (public/film/<name>/0001.webp …)
// from the videos in film-src/<name>.mp4. Runs automatically before `dev` and
// `build`, and skips any film whose frames are already up to date.
// The videos are already re-timed and interpolated to 48 fps (see README).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ffmpeg from 'ffmpeg-static'

const SRC = 'film-src'
const OUT = 'public/film'

for (const file of existsSync(SRC) ? readdirSync(SRC) : []) {
  if (!file.endsWith('.mp4')) continue
  const name = file.replace(/\.mp4$/, '')
  const video = join(SRC, file)
  const dir = join(OUT, name)
  const frames = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.webp')) : []
  if (frames.length && statSync(dir).mtimeMs >= statSync(video).mtimeMs) {
    console.log(`film-frames: ${name} up to date (${frames.length} frames)`)
    continue
  }
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', video, '-an', '-fps_mode', 'passthrough',
    '-c:v', 'libwebp', '-quality', '66', '-compression_level', '4', join(dir, '%04d.webp')], { stdio: 'inherit' })
  console.log(`film-frames: ${name} → ${readdirSync(dir).length} frames`)
}
