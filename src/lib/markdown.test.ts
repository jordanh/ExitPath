import { describe, expect, it } from 'vitest'
import { guides } from '../catalog/index.ts'
import { stepIds } from './guides.ts'
import { guideToMarkdown, planToMarkdown } from './markdown.ts'
import { planTotals, resolvePlan } from './plan.ts'

describe('planToMarkdown', () => {
  const items = resolvePlan({ vscode: 'vscodium', slack: 'zulip' }, { teamSize: 'solo', hosting: 'self' })
  const text = planToMarkdown(items, new Set(['vscode']), planTotals(items).hours)

  it('is a task list with one line per move, easiest first', () => {
    const tasks = text.split('\n').filter((line) => line.startsWith('- ['))
    expect(tasks).toHaveLength(2)
    expect(tasks[0]).toMatch(/^- \[x\] \*\*Visual Studio Code → VSCodium\*\*/)
    expect(tasks[1]).toMatch(/^- \[ \] \*\*Slack → Zulip\*\* \(moderate, [^)]*hours\)$/)
  })

  it('says how much work it adds up to', () => {
    expect(text).toMatch(/^# My exit plan\n\n2 moves, easiest first\. About .+ of hands-on work in total\.\n/)
  })
})

describe('guideToMarkdown', () => {
  it.each(guides.map((guide) => [guide.id, guide] as const))('covers every step: %s', (_id, guide) => {
    const ids = stepIds(guide)
    const text = guideToMarkdown(guide, new Set([ids[0]!]))
    expect(text.startsWith(`# ${guide.title}\n`)).toBe(true)
    expect(text.match(/^- \[[ x]\] /gm)).toHaveLength(ids.length)
    expect(text.match(/^- \[x\] /gm)).toHaveLength(1)
    expect(text.match(/^## \d+\. /gm)).toHaveLength(guide.phases.length)
    expect(text.endsWith('\n')).toBe(true)
  })
})
