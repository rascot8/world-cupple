import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` is the repo name so assets resolve on the GitHub Pages project site
// (https://rascot8.github.io/world-cupple/). Kept as `/` in dev for convenience.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/world-cupple/' : '/',
  plugins: [react()],
}))
