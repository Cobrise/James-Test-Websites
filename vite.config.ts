import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * SITE_URL (optional, e.g. "https://your-name.github.io/form-field/") is read at
 * build time. When present, a canonical link and absolute Open Graph image URLs
 * are written into index.html. When absent, nothing is invented: the canonical
 * tag is omitted and social images use a relative path.
 */
function siteMeta(): Plugin {
  const raw = process.env.SITE_URL?.trim()
  const site = raw ? (raw.endsWith('/') ? raw : `${raw}/`) : ''
  return {
    name: 'form-field-site-meta',
    transformIndexHtml(html) {
      const ogImage = `${site || './'}og-image.jpg`
      const canonical = site
        ? `<link rel="canonical" href="${site}" />\n    <meta property="og:url" content="${site}" />`
        : ''
      return html.replace('%OG_IMAGE%', ogImage).replace('%OG_IMAGE%', ogImage).replace('<!--CANONICAL-->', canonical)
    },
  }
}

/**
 * Development-only still capture. The scene exposes window.__ff.snap(name) in
 * `?capture` mode; it POSTs a rendered frame here and the file is written to
 * public/renders. This is how the editorial stills, reduced-motion stills and
 * social image are produced from the real scene in a repeatable way.
 * It is never part of the production build.
 */
function captureEndpoint(): Plugin {
  return {
    name: 'form-field-capture',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__capture', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const file = (req.url ?? '').replace(/^\//, '')
        if (!/^[a-z0-9-]+\.(webp|jpg|png)$/.test(file)) {
          res.statusCode = 400
          res.end('bad name')
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          const target = file === 'og-image.jpg' ? resolve('public') : resolve('public/renders')
          mkdirSync(target, { recursive: true })
          writeFileSync(resolve(target, file), Buffer.concat(chunks))
          res.end('ok')
        })
      })
    },
  }
}

export default defineConfig({
  // Relative base so the build works from a domain root or a sub-path
  // (e.g. GitHub Pages project sites) without reconfiguration.
  base: './',
  plugins: [react(), siteMeta(), captureEndpoint()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1400,
  },
})
