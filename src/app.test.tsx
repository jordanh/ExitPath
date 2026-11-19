import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { alternatives, getTool, guides, suites, tools } from './catalog/index.ts'
import { stepIds } from './lib/guides.ts'
import {
  PROGRESS_KEY,
  getPlan,
  getPlanDone,
  getPrefs,
  setMoveDone,
  setPlanChoice,
  setPlanChoices,
  setPrefs,
  setStepDone,
} from './lib/storage.ts'
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
      expect(
        screen
          .getAllByRole('link', { name: `Leaving ${suite.name}` })
          .some((link) => link.getAttribute('href') === `/suites/${suite.id}`),
      ).toBe(true)
    for (const guide of guides)
      expect(
        screen
          .getAllByRole('link', { name: guide.title })
          .some((link) => link.getAttribute('href') === `/guides/${guide.id}`),
      ).toBe(true)
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

  it('offers a way to ask when search finds nothing', async () => {
    const user = userEvent.setup()
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    try {
      renderAt('/')
      await user.type(screen.getByRole('combobox'), 'zzzzzz')
      expect(screen.getByRole('option')).toHaveTextContent('“zzzzzz” is not covered yet')
      await user.keyboard('{Enter}')
      expect(open).toHaveBeenCalledWith(
        'https://github.com/noobmaster69/ExitPath/issues/new?title=Please%20cover%3A%20zzzzzz',
        '_blank',
        'noopener,noreferrer',
      )
    } finally {
      open.mockRestore()
    }
  })

  it('does not pass off a description match as an answer', async () => {
    const user = userEvent.setup()
    renderAt('/')
    // mailcow runs in Docker; that does not make it an alternative to Docker.
    await user.type(screen.getByRole('combobox'), 'docker')
    expect(screen.getByRole('option')).toHaveTextContent('“docker” is not covered yet')
  })

  it('finds the company login by the names people use for it', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const box = screen.getByRole('combobox')
    for (const query of ['sso', 'azure ad', 'entra']) {
      await user.clear(box)
      await user.type(box, query)
      expect(screen.getAllByRole('option')[0]).toHaveTextContent('Microsoft Entra ID')
    }
  })

  it('changing your situation changes the scores and is remembered', async () => {
    const user = userEvent.setup()
    renderAt('/tools/onedrive')
    const nextcloud = () => screen.getByRole('article', { name: 'Nextcloud' })
    expect(within(nextcloud()).getByText(/to set up and secure the server/)).toBeDefined()
    expect(screen.getByText(/Graded for/)).toHaveTextContent('Graded for just me, self-hosting.')

    // The line under the heading opens the same options as the header button.
    await user.click(screen.getByRole('button', { name: 'Change' }))
    const options = screen.getByRole('dialog', { name: 'Options' })
    await user.click(within(options).getByRole('radio', { name: /Managed/ }))
    await user.click(within(options).getByRole('radio', { name: /Small team/ }))
    expect(within(nextcloud()).getByText(/hosting it for you/)).toBeDefined()
    expect(getPrefs()).toMatchObject({ hosting: 'managed', teamSize: 'small' })

    await user.click(within(options).getByRole('button', { name: 'Close options' }))
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.getByText(/Graded for/)).toHaveTextContent('Graded for small team, managed hosting.')
  })

  it('says who can host a project for you, and what that does to the grade', () => {
    renderAt('/tools/slack')
    const zulip = screen.getByRole('article', { name: 'Zulip' })
    expect(within(zulip).getByText(/You do not have to/)).toHaveTextContent(
      /running it yourself.*hosted by Zulip Cloud.*it grades \d+ \((easy|moderate)\)/,
    )
    expect(within(zulip).getByRole('link', { name: /Zulip Cloud/ })).toHaveAttribute(
      'href',
      'https://zulip.com/plans/',
    )
  })

  it('puts the main drawback and the licence catch on the path itself', () => {
    renderAt('/tools/slack')
    const mattermost = screen.getByRole('article', { name: 'Mattermost' })
    expect(within(mattermost).getByText('Main drawback').parentElement).toHaveTextContent(
      /Open core, and the line keeps moving/,
    )
    expect(within(mattermost).getByText(/^Licence: MIT, open core$/)).toBeDefined()
    expect(within(mattermost).getByText(/no longer includes GitLab SSO/)).toBeDefined()
  })

  it('fills more dots for better news, whichever way the scale runs', () => {
    renderAt('/tools/slack')
    const mattermost = screen.getByRole('article', { name: 'Mattermost' })
    const rating = (label: string) => within(mattermost).getByText(label).parentElement
    // A like-for-like fit and an easy import both fill the row; neither reads as "1 out of 5".
    expect(rating('Fit')).toHaveTextContent('Like for like(5 of 5, where 5 is best)')
    expect(rating('Getting data in')).toHaveTextContent('Easy(4 of 5, where 5 is best)')
    const element = screen.getByRole('article', { name: 'Element (Matrix)' })
    expect(within(element).getByText('Getting data in').parentElement).toHaveTextContent(
      'Hard(2 of 5, where 5 is best)',
    )
  })

  it('says when managed hosting was asked for but does not exist', () => {
    setPrefs({ hosting: 'managed' })
    renderAt('/tools/outlook-exchange')
    const stalwart = screen.getByRole('article', { name: 'Stalwart' })
    expect(within(stalwart).getByText(/No managed Stalwart hosting is listed/)).toBeDefined()
  })

  it('can leave out everything that is not fully open source', async () => {
    const user = userEvent.setup()
    const notion = getTool('notion')!
    renderAt('/tools/notion')
    expect(screen.getAllByRole('article')).toHaveLength(notion.paths.length)

    await user.click(screen.getByRole('button', { name: 'Options' }))
    await user.click(screen.getByRole('radio', { name: /Open source only/ }))
    expect(getPrefs().licences).toBe('open')
    const left = screen.getAllByRole('article')
    expect(left.length).toBeLessThan(notion.paths.length)
    for (const article of left) expect(within(article).getByText('Open source')).toBeDefined()
    expect(screen.getByText(/Graded for/)).toHaveTextContent(
      `open source only. ${notion.paths.length - left.length} paths are hidden by the licence setting.`,
    )
  })

  it('orders the ways out by fit or maturity, and keeps the choice in the address', async () => {
    const user = userEvent.setup()
    const router = renderAt('/tools/slack')
    const names = () =>
      screen
        .getAllByRole('article')
        .map((article) => within(article).getByRole('heading', { level: 3 }).textContent)
    expect(names()).toEqual(['Mattermost', 'Zulip', 'Element (Matrix)'])
    // Whatever the order, the easiest one stays marked.
    const easiest = () => screen.getByText('Easiest for you').closest('article')
    expect(easiest()).toBe(screen.getByRole('article', { name: 'Mattermost' }))

    await user.selectOptions(screen.getByRole('combobox', { name: 'Order' }), 'Most mature first')
    expect(names()[0]).toBe('Zulip')
    expect(router.state.location.search).toBe('?sort=maturity')
    expect(easiest()).toBe(screen.getByRole('article', { name: 'Mattermost' }))
  })

  it('applies the colours and text size chosen in the options', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Options' }))
    await user.click(screen.getByRole('radio', { name: 'Dark' }))
    await user.click(screen.getByRole('radio', { name: 'Large' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.text).toBe('large')

    await user.click(screen.getByRole('radio', { name: 'Match my device' }))
    await user.click(screen.getByRole('radio', { name: 'Normal' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(document.documentElement.dataset.text).toBeUndefined()
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
    await user.click(screen.getByRole('button', { name: 'open the options' }))
    const options = within(screen.getByRole('dialog', { name: 'Options' }))
    await user.click(options.getByRole('button', { name: 'Export my data' }))
    const exported = JSON.parse((options.getByLabelText('Your data as text') as HTMLTextAreaElement).value)
    expect(exported.format).toBe('exitpath-export')
    expect(exported.progress[guide.id].done).toEqual([stepIds(guide)[0]])

    await user.click(options.getByRole('button', { name: 'Erase everything' }))
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull()
    await user.keyboard('{Escape}')
    expect(options.getByRole('button', { name: 'Erase everything' })).toHaveFocus()

    await user.click(options.getByRole('button', { name: 'Erase everything' }))
    await user.click(options.getByRole('button', { name: 'Yes, erase' }))
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull()
    expect(options.getByRole('status')).toHaveTextContent(/has been erased/)
    expect(options.queryByLabelText('Your data as text')).toBeNull()
  })

  it('builds a plan from the tools you tick', async () => {
    const user = userEvent.setup()
    renderAt('/plan')
    expect(screen.getByText('Nothing in your plan yet')).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Slack' }))
    await user.click(screen.getByRole('button', { name: 'Visual Studio Code' }))
    expect(heading()).toHaveTextContent('Your plan')
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
      'microsoft-entra',
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
    const input = screen.getByPlaceholderText(/What do you want to leave/)
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
    expect(screen.queryByPlaceholderText(/What do you want to leave/)).toBeNull()
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

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'Team chat')
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 tools')

    await user.type(screen.getByRole('searchbox'), 'sla')
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 tool')
    expect(screen.getByRole('link', { name: /Slack/ })).toBeDefined()

    await user.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText('Nothing matches those filters')).toBeDefined()
  })

  it('browse narrows the alternatives by licence, server and hosting', async () => {
    const user = userEvent.setup()
    const router = renderAt('/browse?view=alternatives')
    const shown = () => Number(/Showing (\d+)/.exec(screen.getByRole('status').textContent)![1])
    expect(shown()).toBe(alternatives.length)

    await user.click(screen.getByRole('button', { name: 'Works without a server' }))
    const withoutServer = alternatives.filter(
      (alternative) => alternative.selfHosting === null || alternative.selfHosting.optional === true,
    )
    expect(shown()).toBe(withoutServer.length)
    expect(router.state.location.search).toContain('noserver=1')
    await user.click(screen.getByRole('button', { name: 'Works without a server' }))

    await user.click(screen.getByRole('button', { name: 'Has managed hosting' }))
    expect(shown()).toBe(alternatives.filter((alternative) => alternative.managedHosting.length > 0).length)
    await user.click(screen.getByRole('button', { name: 'Has managed hosting' }))

    // The licence filter is the same setting as in the options, so it follows you to other pages.
    await user.click(screen.getByRole('button', { name: 'Open source only' }))
    expect(shown()).toBe(alternatives.filter((alternative) => alternative.openness === 'open-source').length)
    expect(getPrefs().licences).toBe('open')
  })

  it('ticks off finished moves and works out how long the rest will take', async () => {
    const user = userEvent.setup()
    setPlanChoices({ vscode: 'vscodium', slack: 'zulip' })
    renderAt('/plan')
    const summary = () => screen.getByText(/hours a week/).closest('dl')!
    expect(summary()).toHaveTextContent('Hands-on work')
    expect(summary()).toHaveTextContent('At 5 hours a week')
    expect(summary()).toHaveTextContent('Hardest move left' + 'Slack')

    await user.click(screen.getByRole('checkbox', { name: 'Visual Studio Code to VSCodium: done' }))
    expect(getPlanDone()).toEqual(['vscode'])
    expect(summary()).toHaveTextContent('Work left')
    expect(summary()).toHaveTextContent('1 of 2 moves done.')
    expect(summary()).toHaveTextContent('Last move' + 'Slack')

    await user.click(screen.getByRole('checkbox', { name: 'Slack to Zulip: done' }))
    expect(summary()).toHaveTextContent('You are out')

    // The pace is one of the options, and the timeline follows it.
    await user.click(screen.getByRole('checkbox', { name: 'Slack to Zulip: done' }))
    const before = summary().textContent
    await user.click(screen.getByRole('button', { name: 'Change the pace' }))
    await user.click(screen.getByRole('radio', { name: '2 hours' }))
    expect(summary()).toHaveTextContent('At 2 hours a week')
    expect(summary().textContent).not.toBe(before)
  })

  it('folds the tool picker away once there is a plan, and brings it back when the plan is cleared', async () => {
    const user = userEvent.setup()
    setPlanChoices({ slack: null })
    renderAt('/plan')
    const picker = () => screen.getByText('What do you use?').closest('details')!
    expect(picker().open).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Clear my plan' }))
    await user.click(screen.getByRole('button', { name: 'Yes, clear' }))
    expect(getPlan()).toEqual({})
    expect(picker().open).toBe(true)
    expect(screen.getByText('Nothing in your plan yet')).toBeDefined()
  })

  it('copies the plan as Markdown and as a link', async () => {
    const user = userEvent.setup()
    setPlanChoices({ vscode: 'vscodium', slack: null })
    setMoveDone('vscode', true)
    renderAt('/plan')

    await user.click(screen.getByRole('button', { name: 'Copy as Markdown' }))
    const markdown = await navigator.clipboard.readText()
    expect(markdown).toContain('- [x] **Visual Studio Code → VSCodium**')
    expect(markdown).toContain('- [ ] **Slack → Mattermost**')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Copy a link to this plan' }))
    expect(await navigator.clipboard.readText()).toMatch(/#\/plan\?p=vscode\.vscodium~slack$/)
  })

  it('shows the text to copy when the clipboard is not available', async () => {
    const user = userEvent.setup()
    setPlanChoices({ slack: null })
    renderAt('/plan')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('blocked')) },
    })
    await user.click(screen.getByRole('button', { name: 'Copy as Markdown' }))
    const box = (await screen.findByLabelText('Select and copy')) as HTMLTextAreaElement
    expect(box.value).toContain('**Slack → Mattermost**')
  })

  it('previews a plan from a link and only saves it when asked', async () => {
    const user = userEvent.setup()
    const router = renderAt('/plan?p=slack.zulip~github~not-a-tool')
    const shared = screen.getByRole('region', { name: 'Someone shared a plan with you' })
    expect(shared).toHaveTextContent('Slack to Zulip')
    expect(shared).toHaveTextContent('GitHub to Forgejo')
    expect(getPlan()).toEqual({})

    await user.click(within(shared).getByRole('button', { name: 'Save as my plan' }))
    expect(getPlan()).toEqual({ slack: 'zulip', github: null })
    expect(router.state.location.search).toBe('')
    expect(screen.queryByRole('region', { name: 'Someone shared a plan with you' })).toBeNull()
    expect(screen.getByRole('heading', { name: '2 moves, easiest first' })).toBeDefined()
  })

  it('asks before a shared plan replaces your own, and can be dismissed', async () => {
    const user = userEvent.setup()
    setPlanChoices({ notion: 'logseq' })
    renderAt('/plan?p=slack.zulip')
    const shared = () => screen.getByRole('region', { name: 'Someone shared a plan with you' })

    await user.click(within(shared()).getByRole('button', { name: 'Save as my plan' }))
    expect(getPlan()).toEqual({ notion: 'logseq' })
    await user.click(within(shared()).getByRole('button', { name: 'Cancel' }))
    await user.click(within(shared()).getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('region', { name: 'Someone shared a plan with you' })).toBeNull()
    expect(getPlan()).toEqual({ notion: 'logseq' })
  })

  it('does not offer a shared plan that is the one you already have', () => {
    setPlanChoices({ slack: 'zulip' })
    renderAt('/plan?p=slack.zulip')
    expect(screen.queryByRole('region', { name: 'Someone shared a plan with you' })).toBeNull()
  })

  it('hides finished steps on a checklist when asked, and copies it as Markdown', async () => {
    const user = userEvent.setup()
    const guide = guides[0]!
    const total = stepIds(guide).length
    renderAt(`/guides/${guide.id}`)
    expect(screen.queryByRole('button', { name: 'Hide finished steps' })).toBeNull()

    await user.click(screen.getAllByRole('checkbox')[0]!)
    await user.click(screen.getByRole('button', { name: 'Hide finished steps' }))
    expect(screen.getAllByRole('checkbox')).toHaveLength(total - 1)
    // Still counted, only out of sight.
    expect(screen.getByRole('complementary', { name: 'Your progress' })).toHaveTextContent(
      `1 of ${total} steps`,
    )
    await user.click(screen.getByRole('button', { name: 'Hide finished steps' }))
    expect(screen.getAllByRole('checkbox')).toHaveLength(total)

    await user.click(screen.getByRole('button', { name: 'Copy as Markdown' }))
    const markdown = await navigator.clipboard.readText()
    expect(markdown.startsWith(`# ${guide.title}\n`)).toBe(true)
    expect(markdown.match(/^- \[x\] /gm)).toHaveLength(1)
  })
})
