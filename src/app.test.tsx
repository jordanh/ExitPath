import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { alternatives, guides, suites, tools } from './catalog/index.ts'
import { stepIds } from './lib/guides.ts'
import { PROGRESS_KEY, getPrefs } from './lib/storage.ts'
import { routes } from './routes.tsx'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

const heading = () => screen.getByRole('heading', { level: 1 })

describe('pages', () => {
  it('home lists every tool, suite and guide', () => {
    renderAt('/')
    expect(heading()).toHaveTextContent('Find your way out.')
    for (const tool of tools)
      expect(screen.getAllByRole('link', { name: new RegExp(tool.name) }).length).toBeGreaterThan(0)
    for (const suite of suites)
      expect(screen.getByRole('link', { name: `Leaving ${suite.name}` })).toBeDefined()
    for (const guide of guides) expect(screen.getAllByText(guide.title).length).toBeGreaterThan(0)
  })

  it.each(tools.map((tool) => [tool.id, tool] as const))('tool page renders: %s', (_id, tool) => {
    renderAt(`/tools/${tool.id}`)
    expect(heading()).toHaveTextContent(tool.name)
    // One card per path out, and a comparison table when there is something to compare.
    expect(screen.getAllByRole('article')).toHaveLength(tool.paths.length)
    expect(screen.getByRole('table')).toBeDefined()
  })

  it.each(alternatives.map((alternative) => [alternative.id, alternative] as const))(
    'alternative page renders: %s',
    (_id, alternative) => {
      renderAt(`/alternatives/${alternative.id}`)
      expect(heading()).toHaveTextContent(alternative.name)
      expect(screen.getByText(alternative.weaknesses[0]!)).toBeDefined()
      expect(screen.getByRole('link', { name: /Source code/ })).toHaveAttribute(
        'href',
        alternative.links.source,
      )
    },
  )

  it.each(suites.map((suite) => [suite.id, suite] as const))('suite page renders: %s', (_id, suite) => {
    renderAt(`/suites/${suite.id}`)
    expect(heading()).toHaveTextContent(suite.name)
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(suite.components.length)
  })

  it.each(guides.map((guide) => [guide.id, guide] as const))('guide page renders: %s', (_id, guide) => {
    renderAt(`/guides/${guide.id}`)
    expect(heading()).toHaveTextContent(guide.title)
    expect(screen.getAllByRole('checkbox')).toHaveLength(stepIds(guide).length)
  })

  it.each(['/browse', '/browse?view=alternatives', '/guides', '/about'])('%s renders', (path) => {
    renderAt(path)
    expect(heading()).toBeDefined()
  })

  it.each(['/nowhere', '/tools/nope', '/alternatives/nope', '/guides/nope', '/suites/nope'])(
    '%s shows the not-found page',
    (path) => {
      renderAt(path)
      expect(heading()).toHaveTextContent(/not in the catalog/)
    },
  )

  it('external links open safely in a new tab', () => {
    renderAt('/alternatives/nextcloud')
    for (const link of screen.getAllByRole('link')) {
      if (link.getAttribute('href')?.startsWith('https://')) {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link.getAttribute('rel')).toContain('noopener')
      }
    }
  })
})

describe('interactions', () => {
  it('search finds a tool and opens it', async () => {
    const user = userEvent.setup()
    const router = renderAt('/')
    await user.type(screen.getByRole('combobox'), 'onedrive')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('OneDrive & SharePoint files')
    await user.keyboard('{Enter}')
    expect(router.state.location.pathname).toBe('/tools/onedrive')
  })

  it('search says so when nothing matches', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.type(screen.getByRole('combobox'), 'zzzzzz')
    expect(screen.getByRole('option')).toHaveTextContent(/Nothing in the catalog matches/)
  })

  it('changing your situation changes the scores and is remembered', async () => {
    const user = userEvent.setup()
    renderAt('/tools/onedrive')
    const nextcloud = () => screen.getByRole('article', { name: 'Nextcloud' })
    expect(within(nextcloud()).getByText(/to set up and secure the server/)).toBeDefined()

    await user.click(screen.getByRole('radio', { name: /Managed/ }))
    expect(within(nextcloud()).getByText(/Assumes a hosted Nextcloud/)).toBeDefined()
    expect(getPrefs().hosting).toBe('managed')
  })

  it('says when managed hosting was asked for but does not exist', async () => {
    const user = userEvent.setup()
    renderAt('/tools/outlook-exchange')
    await user.click(screen.getByRole('radio', { name: /Managed/ }))
    const stalwart = screen.getByRole('article', { name: 'Stalwart' })
    expect(within(stalwart).getByText(/No managed Stalwart hosting is listed/)).toBeDefined()
  })

  it('ticking a step updates progress and saves it', async () => {
    const user = userEvent.setup()
    const guide = guides[0]!
    const total = stepIds(guide).length
    renderAt(`/guides/${guide.id}`)

    const progress = screen.getByRole('complementary', { name: 'Your progress' })
    expect(progress).toHaveTextContent(`0 / ${total} steps`)

    const [first, second] = screen.getAllByRole('checkbox')
    await user.click(first!)
    await user.click(second!)
    expect(progress).toHaveTextContent(`2 / ${total} steps`)

    await user.click(first!)
    expect(progress).toHaveTextContent(`1 / ${total} steps`)

    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY)!)
    expect(stored[guide.id].done).toEqual([stepIds(guide)[1]])
  })

  it('browse filters by category and by name', async () => {
    const user = userEvent.setup()
    renderAt('/browse')
    expect(screen.getByRole('status')).toHaveTextContent(`Showing ${tools.length} tools`)

    await user.click(screen.getByRole('button', { name: 'Team chat' }))
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 tools')

    await user.type(screen.getByRole('searchbox'), 'sla')
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 tool')
    expect(screen.getByRole('link', { name: /Slack/ })).toBeDefined()

    await user.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText('Nothing matches those filters')).toBeDefined()
  })
})
