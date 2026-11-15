import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Bundles the production Node server (static files + API) into one file.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@server': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },
  ssr: { noExternal: true, target: 'node' },
  // The server reads the site's files from dist/client; copying public/ here too would
  // add a second, unused copy of every image and film (about 140 MB) to each deployment.
  publicDir: false,
  build: {
    ssr: 'server/node.ts',
    outDir: 'dist/server',
    target: 'node22',
    emptyOutDir: true,
    minify: false,
    rollupOptions: { output: { entryFileNames: 'node.js', format: 'es' } },
  },
});
