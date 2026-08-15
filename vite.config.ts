import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site is served from GitHub Pages at /<repo-name>/ by default.
// When a custom domain (or any root-level host such as Vercel/Netlify) is used,
// build with:  VITE_BASE=/ npm run build
const base = process.env.VITE_BASE ?? '/Marriage-Invitation/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    cssTarget: 'safari14',
    assetsInlineLimit: 2048,
  },
});
