import { describe, expect, it } from 'vitest'
import { getAlternative, getTool, tools } from '../catalog/index.ts'
import type { Alternative, Path, Tool } from '../catalog/schema.ts'
import {
  BANDS,
  DEFAULT_CONTEXT,
  MANAGED_SETUP_HOURS,
  WEIGHTS,
  bandFor,
  formatEffort,
  formatWeeks,
  hostingPlan,
  scorePath,
  weeksAtPace,
  type Context,
} from './scoring.ts'

/** Minimal stand-ins: scoring only reads a handful of fields. */
const tool = (exportDifficulty: number, lockIn = 1) =>
  ({ name: 'Tool', export: { difficulty: exportDifficulty }, lockIn: { level: lockIn } }) as Tool
const path = (fit: number, importDifficulty: number, effortHours: [number, number] = [2, 4]) =>
  ({ fit, effortHours, import: { difficulty: importDifficulty } }) as Path
const alternative = (
  selfHosting: null | { difficulty: number; setupHours: [number, number]; optional?: boolean },
  managed = 0,
) =>
  ({
    name: 'Alt',
    selfHosting,
    managedHosting: Array.from({ length: managed }, () => ({ label: 'Host', url: 'https://example.org' })),
  }) as Alternative

const solo: Context = { teamSize: 'solo', hosting: 'self' }

describe('weights', () => {
  it('sum to one', () => {
    const total = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('scorePath', () => {
  it('is 0 when every factor is as easy as it gets', () => {
    const result = scorePath(tool(1), path(5, 1), alternative(null), solo)
    expect(result.score).toBe(0)
    expect(result.band.id).toBe('easy')
  })

  it('is 100 when every factor is as hard as it gets', () => {
    const hardest = alternative({ difficulty: 5, setupHours: [10, 20] })
    const result = scorePath(tool(5, 5), path(1, 5), hardest, { teamSize: 'large', hosting: 'self' })
    expect(result.score).toBe(100)
    expect(result.band.id).toBe('very-hard')
  })

  it('lets one very hard factor pull the score up', () => {
    const easyServer = alternative({ difficulty: 1, setupHours: [1, 2] })
    const hardServer = alternative({ difficulty: 5, setupHours: [1, 2] })
    const easy = scorePath(tool(1), path(5, 1), easyServer, solo).score
    const hard = scorePath(tool(1), path(5, 1), hardServer, solo).score
    // hosting alone: 60% x (25% x 1) + 40% x 1 = 0.55
    expect(easy).toBe(0)
    expect(hard).toBe(55)
  })

  it('never lets team size alone be the hardest factor', () => {
    const result = scorePath(tool(1), path(5, 1), alternative(null), { teamSize: 'large', hosting: 'self' })
    // people: 60% x (10% x 1) = 0.06, and nothing from the "hardest factor" share
    expect(result.score).toBe(6)
  })

  it('counts how entangled you are, however easy the mechanics', () => {
    // Nothing to export, import or host, and a like-for-like replacement:
    // the only thing in the way is everyone else still using the old tool.
    const free = scorePath(tool(1, 1), path(5, 1), alternative(null), solo).score
    const tied = scorePath(tool(1, 4), path(5, 1), alternative(null), solo).score
    // lock-in alone at 4 of 5: 60% x (15% x 0.75) + 40% x 0.75 = 0.3675
    expect(free).toBe(0)
    expect(tied).toBe(37)
  })

  it('treats a worse fit as a bigger gap', () => {
    const close = scorePath(tool(2), path(5, 2), alternative(null), solo).score
    const distant = scorePath(tool(2), path(2, 2), alternative(null), solo).score
    expect(distant).toBeGreaterThan(close)
  })

  it('scales migration hours with team size and adds setup once', () => {
    const server = alternative({ difficulty: 3, setupHours: [3, 8] })
    const one = scorePath(tool(2), path(4, 2, [2, 4]), server, solo)
    const many = scorePath(tool(2), path(4, 2, [2, 4]), server, { teamSize: 'large', hosting: 'self' })
    expect(one.migrationHours).toEqual([2, 4])
    expect(one.hours).toEqual([5, 12])
    expect(many.migrationHours).toEqual([16, 32])
    expect(many.hours).toEqual([19, 40])
  })

  it('explains every factor', () => {
    const result = scorePath(tool(3), path(3, 3), alternative({ difficulty: 3, setupHours: [1, 2] }), solo)
    expect(result.factors.map((factor) => factor.key)).toEqual([
      'export',
      'import',
      'hosting',
      'gap',
      'lockIn',
      'people',
    ])
    for (const factor of result.factors) expect(factor.explanation).not.toBe('')
  })
})

describe('hostingPlan', () => {
  const server = { difficulty: 4, setupHours: [5, 14] as [number, number] }

  it('has nothing to host for desktop and peer-to-peer tools', () => {
    expect(hostingPlan(alternative(null), solo)).toMatchObject({ mode: 'none', level: 1, setupHours: [0, 0] })
  })

  it('uses the self-hosting difficulty when you run it yourself', () => {
    expect(hostingPlan(alternative(server, 1), solo)).toMatchObject({
      mode: 'self-hosted',
      level: 4,
      fellBack: false,
    })
  })

  it('uses managed hosting when asked and available', () => {
    const plan = hostingPlan(alternative(server, 1), { teamSize: 'small', hosting: 'managed' })
    expect(plan).toMatchObject({ mode: 'managed', level: 1, setupHours: MANAGED_SETUP_HOURS })
  })

  it('falls back to self-hosting, and says so, when no managed option exists', () => {
    const plan = hostingPlan(alternative(server, 0), { teamSize: 'small', hosting: 'managed' })
    expect(plan).toMatchObject({ mode: 'self-hosted', level: 4, fellBack: true })
  })

  it('skips an optional server for one person, but not for a team', () => {
    const optional = alternative({ ...server, optional: true })
    expect(hostingPlan(optional, solo).mode).toBe('local')
    expect(hostingPlan(optional, { teamSize: 'small', hosting: 'self' }).mode).toBe('self-hosted')
  })
})

describe('bandFor', () => {
  it('covers 0 to 100 without gaps', () => {
    for (let score = 0; score <= 100; score++) expect(bandFor(score)).toBeDefined()
    expect(bandFor(0).id).toBe('easy')
    expect(bandFor(19).id).toBe('easy')
    expect(bandFor(20).id).toBe('moderate')
    expect(bandFor(59).id).toBe('demanding')
    expect(bandFor(60).id).toBe('hard')
    expect(bandFor(80).id).toBe('very-hard')
    expect(bandFor(100).id).toBe('very-hard')
  })

  it('lists bands from easiest to hardest', () => {
    expect(BANDS.map((band) => band.level)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('formatEffort', () => {
  it.each<[[number, number], string]>([
    [[0, 0], 'Under an hour'],
    [[0.5, 1], 'Under an hour'],
    [[0.5, 2], '1–2 hours'],
    [[2, 6], '2–6 hours'],
    [[3, 3], '3 hours'],
    [[5, 12], '5–12 hours'],
    [[8, 20], '1–4 days'],
    [[6, 6.5], '6–7 hours'],
    [[12.5, 13], '2–3 days'],
    [[19, 40], '3–7 days'],
    [[40, 100], '1–4 weeks'],
    [[120, 120], '4 weeks'],
  ])('formats %j as %s', (hours, expected) => {
    expect(formatEffort(hours)).toBe(expected)
  })
})

describe('weeksAtPace', () => {
  it('spreads the hours over whole weeks', () => {
    expect(weeksAtPace([10, 30], 5)).toEqual([2, 6])
    expect(weeksAtPace([1, 4], 5)).toEqual([1, 1])
    expect(weeksAtPace([11, 21], 10)).toEqual([2, 3])
    expect(weeksAtPace([0, 0], 5)).toEqual([0, 0])
  })

  it('never divides by nothing', () => {
    expect(weeksAtPace([4, 8], 0)).toEqual([4, 8])
  })
})

describe('formatWeeks', () => {
  it.each<[[number, number], string]>([
    [[0, 0], 'within a week'],
    [[1, 1], 'within a week'],
    [[0, 3], '1–3 weeks'],
    [[2, 2], 'about 2 weeks'],
    [[3, 8], '3–8 weeks'],
  ])('formats %j as %s', (weeks, expected) => {
    expect(formatWeeks(weeks)).toBe(expected)
  })
})

describe('with the real catalog', () => {
  it('scores every path between 0 and 100 in every situation', () => {
    for (const teamSize of ['solo', 'small', 'large'] as const) {
      for (const hosting of ['self', 'managed'] as const) {
        for (const realTool of tools) {
          for (const realPath of realTool.paths) {
            const { score, hours } = scorePath(realTool, realPath, getAlternative(realPath.to)!, {
              teamSize,
              hosting,
            })
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(100)
            expect(hours[0]).toBeLessThanOrEqual(hours[1])
          }
        }
      }
    }
  })

  it('agrees with common sense on a few well-known moves', () => {
    const score = (toolId: string, to: string, context = DEFAULT_CONTEXT) => {
      const realTool = getTool(toolId)!
      return scorePath(
        realTool,
        realTool.paths.find((p) => p.to === to)!,
        getAlternative(to)!,
        context,
      ).score
    }
    // Swapping VS Code for its own open build is about as easy as a move gets.
    expect(score('vscode', 'vscodium')).toBeLessThan(20)
    // Office files open anywhere, but everyone else still sends them: not an easy exit.
    expect(score('microsoft-office', 'libreoffice')).toBeGreaterThanOrEqual(40)
    // The nearest thing to Notion ranks ahead of a wiki with no databases, in any situation.
    for (const teamSize of ['solo', 'small', 'large'] as const) {
      for (const hosting of ['self', 'managed'] as const) {
        expect(score('notion', 'appflowy', { teamSize, hosting })).toBeLessThan(
          score('notion', 'outline', { teamSize, hosting }),
        )
      }
    }
    // Running your own mail server is harder than changing mail client.
    expect(score('gmail', 'mailcow')).toBeGreaterThan(score('gmail', 'thunderbird') + 20)
    // Leaving Teams is harder than leaving Slack for the same destination.
    expect(score('microsoft-teams', 'mattermost')).toBeGreaterThan(score('slack', 'mattermost'))
    // Paying someone to host makes a self-hostable service easier to adopt.
    expect(score('onedrive', 'nextcloud', { teamSize: 'solo', hosting: 'managed' })).toBeLessThan(
      score('onedrive', 'nextcloud'),
    )
  })
})
