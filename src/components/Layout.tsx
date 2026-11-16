import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { lastReviewed } from '../catalog/index.ts'
import { hillRings } from '../lib/contours.ts'
import { REPO_URL } from '../lib/site.ts'
import { setPrefs, usePlan, usePrefs, type Theme } from '../lib/storage.ts'
import { IconMoon, IconSun, IconSystem, Logo } from './icons.tsx'
import { SearchDialog } from './SearchDialog.tsx'
import { ExternalLink } from './ui.tsx'

// "How it works" is also linked from the footer, so it gives way first on a narrow phone.
const NAV = [
  { to: '/browse', label: 'Browse' },
  { to: '/plan', label: 'Plan' },
  { to: '/guides', label: 'Guides' },
  { to: '/about', label: 'How it works', wideOnly: true },
]

const THEME_ORDER: Theme[] = ['system', 'light', 'dark']
const THEME_LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

// The hills the footer rests on.
const FOOTER_RINGS = [
  ...hillRings({ cx: 300, cy: 190, radius: 180, rings: 7, seed: 12, stretch: 1.5 }),
  ...hillRings({ cx: 660, cy: 150, radius: 130, rings: 5, seed: 9, stretch: 1.2 }),
]

function ThemeToggle() {
  const { theme } = usePrefs()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])

  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]!
  const Icon = theme === 'light' ? IconSun : theme === 'dark' ? IconMoon : IconSystem
  return (
    <button
      type="button"
      onClick={() => setPrefs({ theme: next })}
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-leaf border-[1.5px] border-line-strong text-lg text-muted hover:border-ink hover:text-ink"
      aria-label={`Colour theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[next]}.`}
      title={`Theme: ${THEME_LABEL[theme]}`}
    >
      <Icon />
    </button>
  )
}

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

      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-line bg-bg print:hidden">
        <div className="mx-auto flex h-[3.75rem] max-w-6xl items-center gap-1 px-4 sm:gap-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md">
            <Logo className="size-8" />
            <span className="font-display text-[1.45rem] leading-none font-black tracking-tight max-sm:sr-only">
              Exit<span className="font-extrabold text-accent italic">Path</span>
            </span>
          </Link>
          <nav aria-label="Main" className="ml-auto flex items-center font-medium">
            {NAV.map(({ to, label, wideOnly }) => (
              <NavLink
                key={to}
                to={to}
                aria-label={
                  to === '/plan' && planned > 0
                    ? `${label}, ${planned} ${planned === 1 ? 'move' : 'moves'} planned`
                    : undefined
                }
                className={({ isActive }) =>
                  `items-center gap-1.5 rounded-md px-1.5 py-1.5 whitespace-nowrap decoration-accent decoration-[1.5px] underline-offset-[5px] sm:px-3 ${wideOnly ? 'hidden sm:inline-flex' : 'inline-flex'} ${isActive ? 'text-ink underline decoration-wavy' : 'text-muted hover:text-ink hover:underline'}`
                }
              >
                {label}
                {to === '/plan' && planned > 0 && (
                  <span
                    aria-hidden="true"
                    className="rounded-leaf bg-accent px-1.5 text-[0.8rem] leading-[1.2rem] font-bold text-on-accent figures max-sm:hidden"
                  >
                    {planned}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <SearchDialog />
          <ThemeToggle />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <footer className="relative overflow-hidden bg-sunken print:hidden">
        <svg
          viewBox="0 0 820 300"
          preserveAspectRatio="xMaxYMid slice"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-full max-w-3xl opacity-60"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <g className="stroke-contour">
            {FOOTER_RINGS.map((d, index) => (
              <path key={index} d={d} strokeWidth={index % 4 === 0 ? 1.6 : 0.9} />
            ))}
          </g>
        </svg>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-md">
            <p className="font-display text-xl font-extrabold">Nothing you do here leaves your browser.</p>
            <p className="mt-2 text-muted">
              No account, no analytics, no font service, no network requests after the page loads. Your plan
              and checklist progress are stored on this device only.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end">
            <ExternalLink href={REPO_URL}>Source and catalog on GitHub</ExternalLink>
            <Link to="/about" className="link">
              How ratings and scores work
            </Link>
            <p className="text-muted">
              MIT licensed{lastReviewed ? ` · catalog reviewed ${lastReviewed}` : ''}
            </p>
          </div>
        </div>
      </footer>

      <ScrollRestoration />
    </div>
  )
}
