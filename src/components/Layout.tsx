import { useEffect } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom'
import { lastReviewed } from '../catalog/index.ts'
import { REPO_URL } from '../lib/site.ts'
import { setPrefs, usePrefs, type Theme } from '../lib/storage.ts'
import { IconMoon, IconSun, IconSystem, Logo } from './icons.tsx'
import { ExternalLink } from './ui.tsx'

const NAV = [
  { to: '/browse', label: 'Browse' },
  { to: '/guides', label: 'Guides' },
  { to: '/about', label: 'How it works', short: 'About' },
]

const THEME_ORDER: Theme[] = ['system', 'light', 'dark']
const THEME_LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

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
      className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-lg text-muted hover:border-line-strong hover:text-ink"
      aria-label={`Colour theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[next]}.`}
      title={`Theme: ${THEME_LABEL[theme]}`}
    >
      <Icon />
    </button>
  )
}

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* A button, not an anchor: "#main" would be read as a route by the hash router. */}
      <button
        type="button"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-accent"
        onClick={() => document.getElementById('main')?.focus()}
      >
        Skip to content
      </button>

      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-md text-[1.05rem] font-bold tracking-tight"
          >
            <Logo className="size-7" />
            ExitPath
          </Link>
          <nav aria-label="Main" className="ml-auto flex items-center text-sm font-medium">
            {NAV.map(({ to, label, short }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-md px-2 py-1.5 whitespace-nowrap sm:px-3 ${isActive ? 'text-accent' : 'text-muted hover:text-ink'}`
                }
              >
                {short ? (
                  <>
                    <span className="sm:hidden">{short}</span>
                    <span className="max-sm:hidden">{label}</span>
                  </>
                ) : (
                  label
                )}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-sunken">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-md">
            <p className="font-semibold text-ink">Nothing you do here leaves your browser.</p>
            <p className="mt-1">
              No account, no analytics, no web fonts, no network requests after the page loads. Your checklist
              progress is stored on this device only.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end">
            <ExternalLink href={REPO_URL}>Source and catalog on GitHub</ExternalLink>
            <Link to="/about" className="link">
              How ratings and scores work
            </Link>
            <p>MIT licensed{lastReviewed ? ` · catalog reviewed ${lastReviewed}` : ''}</p>
          </div>
        </div>
      </footer>

      <ScrollRestoration />
    </div>
  )
}
