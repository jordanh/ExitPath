import { describe, expect, it } from 'vitest'
import { planTotals, resolvePlan } from './plan.ts'
import type { Context, Situation } from './scoring.ts'

const solo: Context = { teamSize: 'solo', hosting: 'self' }
const managed: Context = { teamSize: 'solo', hosting: 'managed' }
const openOnly: Situation = { ...solo, openOnly: true }

describe('resolvePlan', () => {
  it('is empty for an empty plan', () => {
    expect(resolvePlan({}, solo)).toEqual([])
  })

  it('uses the easiest path when no destination was picked', () => {
    const [item] = resolvePlan({ slack: null }, solo)
    expect(item!.tool.id).toBe('slack')
    expect(item!.auto).toBe(true)
    expect(item!.chosen).toBe(item!.options[0])
    for (const option of item!.options) {
      expect(option.result.score).toBeGreaterThanOrEqual(item!.chosen.result.score)
    }
  })

  it('keeps an explicit pick even when it is not the easiest', () => {
    const [item] = resolvePlan({ slack: 'element' }, solo)
    expect(item!.auto).toBe(false)
    expect(item!.chosen.alternative.id).toBe('element')
    expect(item!.chosen.result.score).toBeGreaterThan(item!.options[0]!.result.score)
  })

  it('lets "easiest" follow the situation', () => {
    // Self-hosted, Jitsi and BigBlueButton both need a server; managed, Jitsi is nearly free.
    const selfHosted = resolvePlan({ zoom: null }, solo)[0]!
    const hosted = resolvePlan({ zoom: null }, managed)[0]!
    expect(hosted.chosen.result.score).toBeLessThan(selfHosted.chosen.result.score)
  })

  it('drops tools that are no longer in the catalog', () => {
    expect(
      resolvePlan({ 'a-tool-that-was-removed': null, slack: null }, solo).map((item) => item.tool.id),
    ).toEqual(['slack'])
  })

  it('falls back to the easiest path when the picked alternative is gone', () => {
    const [item] = resolvePlan({ slack: 'an-alternative-that-was-removed' }, solo)
    expect(item!.auto).toBe(true)
    expect(item!.chosen).toBe(item!.options[0])
  })

  it('offers each path once, including the one that was picked', () => {
    const [item] = resolvePlan({ slack: 'zulip' }, solo)
    const ids = item!.options.map((option) => option.alternative.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(item!.options).toContain(item!.chosen)
  })

  it('only suggests open-source destinations when asked to', () => {
    // Mattermost is open core, so the easiest open path out of Slack is another one.
    const [any] = resolvePlan({ slack: null }, solo)
    const [open] = resolvePlan({ slack: null }, openOnly)
    expect(any!.chosen.alternative.id).toBe('mattermost')
    expect(open!.chosen.alternative.openness).toBe('open-source')
    for (const option of open!.options) expect(option.alternative.openness).toBe('open-source')
  })

  it('keeps a destination picked by hand even when the licence filter would hide it', () => {
    const [item] = resolvePlan({ slack: 'mattermost' }, openOnly)
    expect(item!.auto).toBe(false)
    expect(item!.chosen.alternative.id).toBe('mattermost')
    expect(item!.options.filter((option) => option.alternative.id === 'mattermost')).toHaveLength(1)
  })

  it('puts the easiest move first', () => {
    const scores = resolvePlan(
      { 'microsoft-teams': null, vscode: null, gmail: 'mailcow', slack: null },
      solo,
    ).map((item) => item.chosen.result.score)
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
  })
})

describe('planTotals', () => {
  it('is zero for an empty plan', () => {
    expect(planTotals([])).toEqual({ hours: [0, 0], hardest: undefined, destinations: 0, servers: 0 })
  })

  it('matches the single move when there is only one', () => {
    const items = resolvePlan({ slack: 'mattermost' }, solo)
    const totals = planTotals(items)
    expect(totals.hours).toEqual(items[0]!.chosen.result.hours)
    expect(totals.hardest).toBe(items[0])
    expect(totals).toMatchObject({ destinations: 1, servers: 1 })
  })

  it('sets up a shared destination only once', () => {
    const items = resolvePlan({ onedrive: 'nextcloud', 'google-drive': 'nextcloud' }, solo)
    const [first, second] = items
    const totals = planTotals(items)
    const setup = first!.chosen.result.hosting.setupHours
    expect(setup[1]).toBeGreaterThan(0)
    // Two migrations, one server.
    expect(totals.hours).toEqual([
      first!.chosen.result.hours[0] + second!.chosen.result.hours[0] - setup[0],
      first!.chosen.result.hours[1] + second!.chosen.result.hours[1] - setup[1],
    ])
    expect(totals).toMatchObject({ destinations: 1, servers: 1 })
  })

  it('counts no servers for desktop apps and managed hosting', () => {
    expect(planTotals(resolvePlan({ vscode: 'vscodium', 'closed-terminals': 'ghostty' }, solo)).servers).toBe(
      0,
    )
    expect(planTotals(resolvePlan({ onedrive: 'nextcloud' }, managed)).servers).toBe(0)
  })

  it('names the hardest move', () => {
    const totals = planTotals(resolvePlan({ vscode: 'vscodium', gmail: 'mailcow' }, solo))
    expect(totals.hardest!.tool.id).toBe('gmail')
  })
})
