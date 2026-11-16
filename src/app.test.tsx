import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { alternatives, guides, suites, tools } from './catalog/index.ts'
import { stepIds } from './lib/guides.ts'
import { PROGRESS_KEY, getPlan, getPrefs, setPlanChoice, setPlanChoices, setStepDone } from './lib/storage.ts'
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
    expect(progress).toHaveTextContent(`0 of ${total} steps`)

    const [first, second] = screen.getAllByRole('checkbox')
    await user.click(first!)
    await user.click(second!)
    expect(progress).toHaveTextContent(`2 of ${total} steps`)

    await user.click(first!)
    expect(progress).toHaveTextContent(`1 of ${total} steps`)

    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY)!)
    expect(stored[guide.id].done).toEqual([stepIds(guide)[1]])
  })

  it('asks before clearing a guide, in the page rather than a browser dialog', async () => {
    const user = userEvent.setup()
    const guide = guides[0]!
    const total = stepIds(guide).length
    renderAt(`/guides/${guide.id}`)
    const progress = screen.getByRole('complementary', { name: 'Your progress' })

    await user.click(screen.getAllByRole('checkbox')[0]!)
    expect(progress).toHaveTextContent(`1 of ${total} steps`)

    // Cancelling keeps everything.
    await user.click(screen.getByRole('button', { name: 'Clear my progress' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(progress).toHaveTextContent(`1 of ${total} steps`)

    // Confirming clears it.
    await user.click(screen.getByRole('button', { name: 'Clear my progress' }))
    await user.click(screen.getByRole('button', { name: 'Yes, clear' }))
    expect(progress).toHaveTextContent(`0 of ${total} steps`)
    expect(localStorage.getItem(PROGRESS_KEY)).toBe('{}')
  })

  it('export always offers the data as text, and erase asks first', async () => {
    const user = userEvent.setup()
    const guide = guides[0]!
    renderAt(`/guides/${guide.id}`)
    await user.click(screen.getAllByRole('checkbox')[0]!)
    cleanup()

    renderAt('/guides')
    await user.click(screen.getByRole('button', { name: 'Export my data' }))
    const exported = JSON.parse((screen.getByLabelText('Your data as text') as HTMLTextAreaElement).value)
    expect(exported.format).toBe('exitpath-export')
    expect(exported.progress[guide.id].done).toEqual([stepIds(guide)[0]])

    await user.click(screen.getByRole('button', { name: 'Erase everything' }))
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Erase everything' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Erase everything' }))
    await user.click(screen.getByRole('button', { name: 'Yes, erase' }))
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(/has been erased/)
    expect(screen.queryByLabelText('Your data as text')).toBeNull()
  })

  it('builds a plan from the tools you tick', async () => {
    const user = userEvent.setup()
    renderAt('/plan')
    expect(screen.getByText('Nothing in your plan yet')).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Slack' }))
    await user.click(screen.getByRole('button', { name: 'Visual Studio Code' }))
    expect(heading()).toHaveTextContent('Everything you want to leave')
    expect(screen.getByRole('heading', { name: '2 moves, easiest first' })).toBeDefined()
    expect(getPlan()).toEqual({ slack: null, vscode: null })

    // Easiest first: swapping an editor is easier than moving a team's chat.
    const moves = screen.getAllByRole('listitem').filter((item) => within(item).queryByRole('combobox'))
    expect(moves).toHaveLength(2)
    expect(within(moves[0]!).getByRole('heading')).toHaveTextContent('VSCodium')

    // Choosing a specific destination is remembered.
    await user.selectOptions(within(moves[1]!).getByRole('combobox'), 'zulip')
    expect(getPlan().slack).toBe('zulip')
    expect(
      within(
        screen.getAllByRole('listitem').filter((item) => within(item).queryByRole('combobox'))[1]!,
      ).getByRole('heading'),
    ).toHaveTextContent('Zulip')

    await user.click(screen.getByRole('button', { name: 'Remove Slack from the plan' }))
    expect(getPlan()).toEqual({ vscode: null })
    expect(screen.getByRole('heading', { name: '1 move, easiest first' })).toBeDefined()
  })

  it('adds a whole suite to the plan without overriding earlier picks', async () => {
    const user = userEvent.setup()
    setPlanChoice('onedrive', 'seafile')
    renderAt('/plan')
    await user.click(screen.getByRole('button', { name: 'Add all of Microsoft 365' }))
    const plan = getPlan()
    expect(Object.keys(plan).sort()).toEqual([
      'microsoft-office',
      'microsoft-teams',
      'onedrive',
      'outlook-exchange',
      'zoom',
    ])
    expect(plan.onedrive).toBe('seafile')
  })

  it('adds a path to the plan from a tool page and counts it in the header', async () => {
    const user = userEvent.setup()
    renderAt('/tools/notion')
    const outline = screen.getByRole('article', { name: 'Outline' })
    await user.click(within(outline).getByRole('button', { name: 'Add to my plan' }))
    expect(getPlan()).toEqual({ notion: 'outline' })
    expect(within(outline).getByRole('button', { name: 'In your plan' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('link', { name: 'Plan, 1 move planned' })).toBeDefined()

    // Another path for the same tool offers to switch rather than add.
    const appflowy = screen.getByRole('article', { name: 'AppFlowy' })
    await user.click(within(appflowy).getByRole('button', { name: 'Use this path in my plan' }))
    expect(getPlan()).toEqual({ notion: 'appflowy' })
  })

  it('opens search from any page with the slash key', async () => {
    const user = userEvent.setup()
    const router = renderAt('/about')
    expect(screen.queryByRole('combobox')).toBeNull()

    await user.keyboard('/')
    const input = screen.getByRole('combobox')
    expect(input).toHaveFocus()
    await user.type(input, 'immich')
    await user.keyboard('{Enter}')
    expect(router.state.location.pathname).toBe('/alternatives/immich')
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('does not hijack the slash key while typing', async () => {
    const user = userEvent.setup()
    renderAt('/browse')
    await user.type(screen.getByRole('searchbox'), 'a/b')
    expect(screen.getByRole('searchbox')).toHaveValue('a/b')
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('shows returning visitors where they left off', async () => {
    const guide = guides[0]!
    setStepDone(guide.id, stepIds(guide)[0]!, true)
    setPlanChoices({ slack: 'mattermost', notion: null })
    renderAt('/')
    const pickUp = screen.getByRole('region', { name: 'Pick up where you left off' })
    expect(within(pickUp).getByRole('link', { name: new RegExp(guide.title) })).toHaveAttribute(
      'href',
      `/guides/${guide.id}`,
    )
    expect(within(pickUp).getByRole('link', { name: /2 moves/ })).toHaveAttribute('href', '/plan')
  })

  it('says nothing about picking up to a newcomer', () => {
    renderAt('/')
    expect(screen.queryByRole('region', { name: 'Pick up where you left off' })).toBeNull()
  })

  it('links every entry to its file in the repository', () => {
    renderAt('/tools/slack')
    expect(screen.getByRole('link', { name: /Edit this entry/ })).toHaveAttribute(
      'href',
      'https://github.com/noobmaster69/ExitPath/edit/main/catalog/tools/slack.json',
    )
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
