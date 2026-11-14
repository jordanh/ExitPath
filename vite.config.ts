/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'

/**
 * The public address of the site, when the build knows it: set SITE_URL
 * yourself, or let Vercel provide its production domain. Link previews need
 * absolute URLs, so without one those tags are simply left out.
 */
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL
const siteUrl = (process.env.SITE_URL ?? (vercelDomain ? `https://${vercelDomain}` : '')).replace(/\/+$/, '')

function linkPreviewTags(): Plugin {
  return {
    name: 'exitpath:link-preview-tags',
    transformIndexHtml(): HtmlTagDescriptor[] {
      if (!siteUrl) return []
      const image = `${siteUrl}/og.png`
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:alt',
            content: 'ExitPath: find your way out. Open-source exits from big-platform lock-in.',
          },
          injectTo: 'head',
        },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
      ]
    },
  }
}

// `base: './'` plus hash routing means the build works from any path:
// GitHub Pages, a subfolder on your own server, or a file opened in a desktop shell.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), linkPreviewTags()],
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
