import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from a /<repo-name>/ subpath, so the
// Pages workflow builds with GH_PAGES=true to prefix all asset URLs;
// local dev/build (Vercel, Netlify, `npm run dev`) stays at the domain root.
export default defineConfig({
  base: process.env.GH_PAGES ? '/imc-blocking/' : '/',
  plugins: [react()],
})
