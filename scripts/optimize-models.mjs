// Optimise downloaded Poly Haven models for the web.
//
//   node scripts/optimize-models.mjs
//
// Reads originals from assets-source/models/<id>/<id>_1k.gltf (kept out of
// Git) and writes compact .glb files to public/models/<id>.glb:
//   1. weld + dedup     merge duplicate vertices and data
//   2. simplify         meshoptimizer simplification to a per-asset ratio
//   3. quantize         store positions/normals/UVs with fewer bits
//   4. meshopt          EXT_meshopt_compression (decoded in the browser by
//                       the MeshoptDecoder that ships with three.js)
// Textures (1K JPEGs) are embedded unchanged.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import { dedup, prune, quantize, simplify, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer'
import { mkdirSync, statSync } from 'node:fs'

/** ratio: target fraction of triangles to keep; error: max deviation (relative to mesh size). */
const ASSETS = {
  fir_sapling: { ratio: 0.12, error: 0.004 },
  searsia_lucida: { ratio: 0.14, error: 0.004 },
  dead_tree_trunk: { ratio: 0.25, error: 0.002 },
  tree_stump_01: { ratio: 0.35, error: 0.002 },
  shrub_02: { ratio: 0.6, error: 0.003 },
  rock_moss_set_01: { ratio: 0.4, error: 0.002 },
  fern_02: { ratio: 1, error: 0 },
  grass_medium_01: { ratio: 1, error: 0 },
  // Interior
  sofa_03: { ratio: 1, error: 0 },
  mid_century_lounge_chair: { ratio: 1, error: 0 },
  Ottoman_01: { ratio: 1, error: 0 },
  modern_coffee_table_01: { ratio: 1, error: 0 },
  side_table_01: { ratio: 1, error: 0 },
  modern_wooden_cabinet: { ratio: 0.7, error: 0.001 },
  modern_ceiling_lamp_01: { ratio: 1, error: 0 },
  ceramic_vase_01: { ratio: 0.6, error: 0.001 },
  ceramic_vase_02: { ratio: 0.6, error: 0.001 },
  ceramic_vase_03: { ratio: 0.6, error: 0.001 },
  ceramic_vase_04: { ratio: 0.6, error: 0.001 },
  wooden_bowl_02: { ratio: 1, error: 0 },
  throw_pillows_01: { ratio: 1, error: 0 },
  potted_plant_02: { ratio: 0.45, error: 0.002 },
  hanging_picture_frame_01: { ratio: 1, error: 0 },
  hanging_picture_frame_02: { ratio: 1, error: 0 },
}

const only = process.argv.slice(2)

await MeshoptEncoder.ready
await MeshoptDecoder.ready
await MeshoptSimplifier.ready

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)

mkdirSync('public/models', { recursive: true })

for (const [id, opts] of Object.entries(ASSETS)) {
  if (only.length && !only.includes(id)) continue
  const src = `assets-source/models/${id}/${id}_1k.gltf`
  const out = `public/models/${id}.glb`
  const doc = await io.read(src)
  const before = triangles(doc)
  const steps = [dedup(), weld()]
  if (opts.ratio < 1) steps.push(simplify({ simplifier: MeshoptSimplifier, ratio: opts.ratio, error: opts.error }))
  steps.push(prune(), quantize())
  await doc.transform(...steps)
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER })
  await io.write(out, doc)
  const after = triangles(doc)
  console.log(
    `${id.padEnd(18)} ${Math.round(before).toLocaleString().padStart(9)} → ${Math.round(after).toLocaleString().padStart(8)} tris   ${(statSync(out).size / 1e6).toFixed(2)} MB`,
  )
}
