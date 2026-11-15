/*
  Pool water: a true planar reflection (three's Reflector renders the room mirrored in the water plane) with a
  code-drawn ripple map bending it, Fresnel so it mirrors at grazing angles, and a deep tint that lets the
  mosaic show through where you look down into the pool.
*/
import { Color, PlaneGeometry, Vector2, type Texture } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { PALETTE, POOL, WATER } from './config';

const vertexShader = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vMirror;
  varying vec3 vWorld;
  varying vec2 vTex;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  void main() {
    vMirror = textureMatrix * vec4(position, 1.0);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vTex = uv;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }`;

const fragmentShader = /* glsl */ `
  uniform vec3 color;                                             // the deep water tint (Reflector sets it)
  uniform vec3 tint;
  uniform sampler2D tDiffuse;
  uniform sampler2D tNormal;
  uniform vec2 rippleScale;
  uniform float distortion;
  uniform float clarity;
  varying vec4 vMirror;
  varying vec3 vWorld;
  varying vec2 vTex;
  #include <logdepthbuf_pars_fragment>
  void main() {
    #include <logdepthbuf_fragment>
    vec3 n = texture2D(tNormal, vTex * rippleScale).xyz * 2.0 - 1.0;
    vec3 view = normalize(cameraPosition - vWorld);
    float facing = clamp(view.z + n.y * 0.04, 0.0, 1.0);          // the water's normal is +Z
    float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
    vec4 coord = vMirror;
    coord.xy += n.xy * distortion * coord.w;
    vec3 reflection = texture2DProj(tDiffuse, coord).rgb * tint;
    vec3 colour = mix(color, reflection, fresnel);
    float alpha = mix(clarity, 1.0, fresnel);                       // see into the pool when looking down
    gl_FragColor = vec4(colour, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function makeWater(ripples: Texture, width: number, height: number): Reflector {
  const geometry = new PlaneGeometry(POOL.x1 - POOL.x0, POOL.y1 - POOL.y0);
  const water = new Reflector(geometry, {
    textureWidth: width,
    textureHeight: height,
    clipBias: 0.002,
    color: PALETTE.water,
    multisample: 0,
    shader: {
      name: 'PoolWater',
      uniforms: {
        color: { value: null },
        tint: { value: new Color(WATER.tint) },
        tDiffuse: { value: null },
        tNormal: { value: null },
        textureMatrix: { value: null },
        rippleScale: { value: new Vector2(...WATER.rippleRepeat) },
        distortion: { value: WATER.distortion },
        clarity: { value: WATER.clarity },
      },
      vertexShader,
      fragmentShader,
    },
  });
  const material = water.material as unknown as { uniforms: Record<string, { value: unknown }>; transparent: boolean; depthWrite: boolean };
  material.uniforms.tNormal.value = ripples;
  material.transparent = true;
  water.name = 'water';
  water.position.set((POOL.x0 + POOL.x1) / 2, (POOL.y0 + POOL.y1) / 2, POOL.waterZ);
  return water;
}
