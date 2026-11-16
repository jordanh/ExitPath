import { useEffect, useRef, useState } from 'react'
import { IconSearch } from './icons.tsx'
import { SearchBox } from './SearchBox.tsx'

const TYPING = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

/**
 * The header's search button, and the dialog it opens. Also opens with "/"
 * (when not typing somewhere) and with Ctrl+K or ⌘K from anywhere.
 */
export function SearchDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = event.target instanceof Element && event.target.closest(TYPING) !== null
      const slash = event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey
      const palette = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (slash || palette) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // The native dialog gives us the focus trap, Escape to close and the backdrop.
  // Where showModal() is missing (very old browsers), it still opens, just
  // without those extras.
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const isOpen = element.hasAttribute('open')
    if (open && !isOpen) {
      if (typeof element.showModal === 'function') element.showModal()
      else element.setAttribute('open', '')
      element.querySelector('input')?.focus()
    } else if (!open && isOpen) {
      if (typeof element.close === 'function') element.close()
      else element.removeAttribute('open')
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the catalog"
        aria-keyshortcuts="/"
        title="Search (press /)"
        className="icon-button"
      >
        <IconSearch />
      </button>

      {/* A click on the dialog element itself is a click on the backdrop: the panel inside covers the rest. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- Escape already closes it */}
      <dialog
        ref={dialog}
        aria-label="Search the catalog"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}
        className="panel mt-[12vh] w-[min(40rem,calc(100vw-2rem))]"
      >
        <div className="p-3">
          {/* Mounted only while open, so each opening starts with an empty, focused field. */}
          {open && <SearchBox variant="dialog" onNavigate={() => setOpen(false)} />}
          <p className="px-2 pt-2.5 pb-0.5 text-sm text-muted">
            <kbd>↑</kbd> <kbd>↓</kbd> to move, <kbd>Enter</kbd> to open, <kbd>Esc</kbd> to close
          </p>
        </div>
      </dialog>
    </>
  )
}
