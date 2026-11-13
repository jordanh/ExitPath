/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base: './'` plus hash routing means the build works from any path:
// GitHub Pages, a subfolder on your own server, or a file opened in a desktop shell.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // The catalog is bundled on purpose (the app makes no data requests), so
    // the single chunk is larger than Vite's default warning threshold.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
})
