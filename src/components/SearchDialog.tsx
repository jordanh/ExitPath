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
        className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-sm text-muted hover:border-line-strong hover:text-ink max-md:w-9 max-md:justify-center max-md:px-0"
      >
        <IconSearch className="text-base" />
        <span className="max-md:hidden">Search</span>
        <kbd className="rounded border border-line bg-sunken px-1.5 font-mono text-[0.6875rem] leading-5 max-md:hidden">
          /
        </kbd>
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
        className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] max-w-none rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/50"
      >
        <div className="p-2">
          {/* Mounted only while open, so each opening starts with an empty, focused field. */}
          {open && <SearchBox variant="dialog" onNavigate={() => setOpen(false)} />}
          <p className="px-2 pt-2 pb-1 text-xs text-muted">
            <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> to move,{' '}
            <kbd className="font-mono">Enter</kbd> to open, <kbd className="font-mono">Esc</kbd> to close
          </p>
        </div>
      </dialog>
    </>
  )
}
