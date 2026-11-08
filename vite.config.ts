import { defineConfig, type Plugin } from 'vite';
import pkg from './package.json' with { type: 'json' };

// Puts the package.json version in the page as <meta name="version">, so the deploy workflow
// (scripts/verify-deploy.sh) can tell which build the live site is serving. See GitHub #34.
const versionMeta: Plugin = {
  name: 'version-meta',
  transformIndexHtml: (html) => html.replace('%APP_VERSION%', pkg.version),
};

export default defineConfig({
  plugins: [versionMeta],
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
