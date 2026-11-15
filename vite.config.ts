import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { apiDevPlugin } from './server/dev-plugin';
import { holdBackPlugin } from './scripts/hold-back';

export default defineConfig({
  // holdBackPlugin: production builds leave out work not cleared for publication (scripts/hold-back.ts).
  plugins: [react(), tailwindcss(), apiDevPlugin(), holdBackPlugin(fileURLToPath(new URL('.', import.meta.url)))],
  // Only PUBLIC_-prefixed variables are exposed to client code; secrets never are.
  envPrefix: 'PUBLIC_',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@server': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/client',
    manifest: true,
    sourcemap: false,
    target: 'es2022',
    cssCodeSplit: true,
    assetsInlineLimit: 0,
  },
  server: { port: 5173, strictPort: false },
});
