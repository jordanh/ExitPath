import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { closeOptions } from './lib/options-dialog.ts'

afterEach(() => {
  cleanup()
  localStorage.clear()
  closeOptions()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.text
})

// jsdom has no layout, so these browser APIs need stand-ins.
window.scrollTo = () => {}
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList
}
