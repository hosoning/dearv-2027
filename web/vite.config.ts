import { defineConfig } from 'vite';

// Relative base so the build works from any sub-path (GitHub Pages, artifacts, file servers).
export default defineConfig({
  base: './',
  css: { postcss: {} }, // don't inherit the legacy Next.js PostCSS/Tailwind config from the repo root
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 },
});
