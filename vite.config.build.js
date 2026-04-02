import { defineConfig } from 'vite';
import { resolve } from 'path';
import browserslistToEsbuild from 'browserslist-to-esbuild';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/scorm_client.js'),
        utils:  resolve(import.meta.dirname, 'src/utils.js'),
      },
      formats: ['es'],
    },
    target: browserslistToEsbuild(),
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'oxc',
  },
});
