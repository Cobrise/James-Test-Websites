import { defineConfig } from 'vite';

// Builds the code-generated 3D hero (src/pavilion) into one module the static page loads: hero3d/pavilion.js.
// The rest of the site stays plain files; `npm run watch` rebuilds on every save.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'hero3d',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: true,
    lib: {
      entry: 'src/pavilion/main.ts',
      formats: ['es'],
      fileName: () => 'pavilion.js',
    },
  },
});
