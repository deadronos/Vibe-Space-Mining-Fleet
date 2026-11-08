import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  root: 'web',
  // Relative URLs, so the site works on Pages (/Vibe-Space-Mining-Fleet/) and any other path.
  base: './',
  // web/public/unity is the Unity build; Vite copies it to dist/unity untouched.
  publicDir: 'public',
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2023',
  },
});
