import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { lastReviewed } from '../catalog/index.ts'
import { REPO_URL } from '../lib/site.ts'
import { usePlan } from '../lib/storage.ts'
import { Logo } from './icons.tsx'
import { OptionsDialog } from './OptionsDialog.tsx'
import { SearchDialog } from './SearchDialog.tsx'
import { ExternalLink } from './ui.tsx'

const NAV = [
  { to: '/browse', label: 'Browse' },
  { to: '/plan', label: 'Plan' },
  { to: '/guides', label: 'Guides' },
]

export function Layout() {
  const { pathname } = useLocation()
  const planned = Object.keys(usePlan()).length

  // Moving to another page puts keyboard and screen-reader focus at the top of
  // the new content, as a full page load would. Not on first load, and not
  // when only the query string changes (filters on the browse page).
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])

  // Things that stick below the header (a checklist's progress line) need its
  // real height, which changes when it wraps.
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = header.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', `${element.offsetHeight}px`)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      {/* A button, not an anchor: "#main" would be read as a route by the hash router. */}
      <button
        type="button"
        className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
        onClick={() => document.getElementById('main')?.focus()}
      >
        Skip to content
      </button>

      <header
        ref={header}
        className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-line bg-bg print:hidden"
      >
        {/* Wraps onto a second line rather than overflow, which large text on a small phone needs. */}
        <div className="mx-auto flex min-h-14 max-w-[60rem] flex-wrap items-center justify-end px-4 sm:px-6">
          <Link to="/" className="mr-auto flex shrink-0 items-center gap-2 rounded-md">
            <Logo className="size-7" />
            <span className="font-display text-[1.3rem] leading-none font-black tracking-tight max-sm:sr-only">
              Exit<span className="font-extrabold text-accent italic">Path</span>
            </span>
          </Link>
          <nav aria-label="Main" className="mr-1 flex items-center font-medium sm:mr-3">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                aria-label={
                  to === '/plan' && planned > 0
                    ? `${label}, ${planned} ${planned === 1 ? 'move' : 'moves'} planned`
                    : undefined
                }
                className={({ isActive }) =>
                  `inline-flex items-baseline gap-1 rounded-md px-2 py-1.5 whitespace-nowrap decoration-accent decoration-[1.5px] underline-offset-[5px] sm:px-3 ${isActive ? 'text-ink underline' : 'text-muted hover:text-ink hover:underline'}`
                }
              >
                {label}
                {to === '/plan' && planned > 0 && (
                  <span aria-hidden="true" className="figures text-[0.8rem] font-bold text-accent">
                    {planned}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center">
            <SearchDialog />
            <OptionsDialog />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-line print:hidden">
        <div className="mx-auto flex max-w-[60rem] flex-wrap items-baseline gap-x-6 gap-y-1 px-4 py-6 text-muted sm:px-6">
          <p className="mr-auto">Nothing you do here leaves your browser.</p>
          <Link to="/about" className="link">
            How it works
          </Link>
          <ExternalLink href={REPO_URL}>Source</ExternalLink>
          {lastReviewed && <p>Catalog reviewed {lastReviewed}</p>}
        </div>
      </footer>

      <ScrollRestoration />
    </div>
  )
}
