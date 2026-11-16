import { describe, expect, it, vi } from 'vitest'
import {
  EXPORT_FORMAT,
  PLAN_DONE_KEY,
  PLAN_KEY,
  PREFS_KEY,
  PROGRESS_KEY,
  clearEverything,
  clearPlan,
  exportData,
  getPlan,
  getPlanDone,
  getPrefs,
  getProgress,
  importData,
  removeFromPlan,
  replacePlan,
  resetGuide,
  sanitizePlan,
  sanitizePrefs,
  sanitizeProgress,
  setGuideNotes,
  setMoveDone,
  setPlanChoice,
  setPlanChoices,
  setPrefs,
  setStepDone,
} from './storage.ts'

const DEFAULTS = {
  teamSize: 'solo',
  hosting: 'self',
  theme: 'system',
  licences: 'any',
  hoursPerWeek: 5,
  textSize: 'normal',
}

describe('preferences', () => {
  it('start with sensible defaults', () => {
    expect(getPrefs()).toEqual(DEFAULTS)
  })

  it('merge partial updates and persist them', () => {
    setPrefs({ teamSize: 'small' })
    setPrefs({ theme: 'dark' })
    expect(getPrefs()).toEqual({ ...DEFAULTS, teamSize: 'small', theme: 'dark' })
    expect(JSON.parse(localStorage.getItem(PREFS_KEY)!)).toEqual(getPrefs())
  })

  it('survive corrupted storage', () => {
    localStorage.setItem(PREFS_KEY, '{not json')
    expect(getPrefs()).toEqual(DEFAULTS)
  })

  it('drop values that are not valid choices', () => {
    expect(sanitizePrefs({ teamSize: 'huge', hosting: 'managed', theme: 7 })).toEqual({
      ...DEFAULTS,
      hosting: 'managed',
    })
    expect(sanitizePrefs(null)).toEqual(DEFAULTS)
    // Inherited object keys are not choices.
    expect(sanitizePrefs({ teamSize: 'toString' }).teamSize).toBe('solo')
  })

  it('keep the licence filter, the weekly pace and the text size', () => {
    setPrefs({ licences: 'open', hoursPerWeek: 10, textSize: 'large' })
    expect(getPrefs()).toMatchObject({ licences: 'open', hoursPerWeek: 10, textSize: 'large' })
    // Only the paces that are offered are accepted.
    expect(sanitizePrefs({ licences: 'closed', hoursPerWeek: 7, textSize: 'huge' })).toEqual(DEFAULTS)
    expect(sanitizePrefs({ hoursPerWeek: '10' }).hoursPerWeek).toBe(5)
  })
})

describe('guide progress', () => {
  it('records and removes completed steps without duplicates', () => {
    setStepDone('g', 'a', true)
    setStepDone('g', 'b', true)
    setStepDone('g', 'a', true)
    expect(getProgress().g!.done).toEqual(['a', 'b'])
    setStepDone('g', 'a', false)
    expect(getProgress().g!.done).toEqual(['b'])
  })

  it('keeps guides separate', () => {
    setStepDone('one', 'a', true)
    setStepDone('two', 'b', true)
    expect(getProgress().one!.done).toEqual(['a'])
    expect(getProgress().two!.done).toEqual(['b'])
  })

  it('stores notes alongside steps and stamps the change', () => {
    setStepDone('g', 'a', true)
    setGuideNotes('g', 'Renews in March')
    const guide = getProgress().g!
    expect(guide).toMatchObject({ done: ['a'], notes: 'Renews in March' })
    expect(Number.isNaN(Date.parse(guide.updatedAt))).toBe(false)
  })

  it('resets one guide and leaves the others', () => {
    setStepDone('one', 'a', true)
    setStepDone('two', 'b', true)
    resetGuide('one')
    expect(Object.keys(getProgress())).toEqual(['two'])
  })

  it('ignores malformed entries', () => {
    expect(sanitizeProgress({ ok: { done: ['a', 3, 'a'], notes: 5 }, bad: 'nope' })).toEqual({
      ok: { done: ['a'], notes: '', updatedAt: '' },
    })
    expect(sanitizeProgress([1, 2])).toEqual({})
  })

  it('returns the same object until something changes', () => {
    // useSyncExternalStore re-renders forever if snapshots are not stable.
    setStepDone('g', 'a', true)
    expect(getProgress()).toBe(getProgress())
    expect(getPrefs()).toBe(getPrefs())
  })

  it('keeps working in memory when storage refuses writes', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    try {
      setStepDone('g', 'a', true)
      expect(getProgress().g!.done).toEqual(['a'])
    } finally {
      setItem.mockRestore()
      clearEverything()
    }
  })
})

describe('plan', () => {
  it('starts empty', () => {
    expect(getPlan()).toEqual({})
  })

  it('adds tools with a chosen destination, or with "easiest"', () => {
    setPlanChoice('slack', 'mattermost')
    setPlanChoice('notion', null)
    expect(getPlan()).toEqual({ slack: 'mattermost', notion: null })
    expect(JSON.parse(localStorage.getItem(PLAN_KEY)!)).toEqual(getPlan())
  })

  it('changes a destination without touching the rest', () => {
    setPlanChoices({ slack: null, notion: null })
    setPlanChoice('slack', 'zulip')
    expect(getPlan()).toEqual({ slack: 'zulip', notion: null })
  })

  it('removes one tool, and clears all of them', () => {
    setPlanChoices({ slack: null, notion: 'outline' })
    removeFromPlan('slack')
    expect(getPlan()).toEqual({ notion: 'outline' })
    clearPlan()
    expect(getPlan()).toEqual({})
  })

  it('remembers which moves are done', () => {
    setPlanChoices({ slack: null, notion: null })
    setMoveDone('slack', true)
    setMoveDone('slack', true)
    setMoveDone('notion', true)
    expect(getPlanDone()).toEqual(['slack', 'notion'])
    expect(JSON.parse(localStorage.getItem(PLAN_DONE_KEY)!)).toEqual(['slack', 'notion'])
    setMoveDone('slack', false)
    expect(getPlanDone()).toEqual(['notion'])
  })

  it('forgets a move was done once it leaves the plan', () => {
    setPlanChoices({ slack: null, notion: null })
    setMoveDone('slack', true)
    removeFromPlan('slack')
    expect(getPlanDone()).toEqual([])

    setMoveDone('notion', true)
    clearPlan()
    expect(getPlanDone()).toEqual([])
  })

  it('replaces the whole plan and starts it from the beginning', () => {
    setPlanChoices({ slack: null })
    setMoveDone('slack', true)
    replacePlan({ slack: 'zulip', github: null })
    expect(getPlan()).toEqual({ slack: 'zulip', github: null })
    expect(getPlanDone()).toEqual([])
  })

  it('ignores malformed entries', () => {
    expect(sanitizePlan({ slack: 'zulip', notion: null, github: 7, vscode: { to: 'zed' } })).toEqual({
      slack: 'zulip',
      notion: null,
    })
    expect(sanitizePlan('nope')).toEqual({})
    expect(sanitizePlan(['slack'])).toEqual({})
  })
})

describe('export and import', () => {
  it('round-trips everything', () => {
    setPrefs({ teamSize: 'large', hosting: 'managed' })
    setStepDone('leaving-slack', 'export', true)
    setGuideNotes('leaving-slack', 'note')
    setPlanChoices({ slack: 'mattermost', notion: null })
    const file = JSON.stringify(exportData())

    clearEverything()
    expect(getProgress()).toEqual({})
    expect(getPlan()).toEqual({})
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem(PLAN_KEY)).toBeNull()

    expect(importData(file)).toEqual({ guides: 1, planned: 2 })
    expect(getPrefs()).toMatchObject({ teamSize: 'large', hosting: 'managed' })
    expect(getProgress()['leaving-slack']).toMatchObject({ done: ['export'], notes: 'note' })
    expect(getPlan()).toEqual({ slack: 'mattermost', notion: null })
  })

  it('carries finished moves across, but only for tools still in the plan', () => {
    setPlanChoices({ slack: null, notion: null })
    setMoveDone('slack', true)
    const file = exportData()
    expect(file.planDone).toEqual(['slack'])

    clearEverything()
    importData(JSON.stringify({ ...file, planDone: ['slack', 'not-in-the-plan', 7] }))
    expect(getPlanDone()).toEqual(['slack'])
  })

  it('reads exports made before plans existed', () => {
    setPlanChoice('slack', null)
    const old = { format: EXPORT_FORMAT, version: 1, prefs: {}, progress: { g: { done: ['a'] } } }
    expect(importData(JSON.stringify(old))).toEqual({ guides: 1, planned: 0 })
    expect(getPlan()).toEqual({})
  })

  it('labels its files', () => {
    expect(exportData()).toMatchObject({ format: EXPORT_FORMAT, version: 1 })
  })

  it('refuses files that are not ExitPath exports, and leaves data alone', () => {
    setStepDone('g', 'a', true)
    expect(() => importData('not json at all')).toThrow(/not valid JSON/)
    expect(() => importData('{"hello": 1}')).toThrow(/does not look like an ExitPath export/)
    expect(() => importData('[]')).toThrow(/does not look like an ExitPath export/)
    expect(() => importData(JSON.stringify({ format: EXPORT_FORMAT, version: 99 }))).toThrow(/newer version/)
    expect(getProgress().g!.done).toEqual(['a'])
  })

  it('sanitises what it imports', () => {
    importData(
      JSON.stringify({
        format: EXPORT_FORMAT,
        version: 1,
        prefs: { teamSize: 'enormous', theme: 'dark' },
        progress: { g: { done: ['a', 42] }, junk: null },
      }),
    )
    expect(getPrefs()).toEqual({ ...DEFAULTS, theme: 'dark' })
    expect(getProgress()).toEqual({ g: { done: ['a'], notes: '', updatedAt: '' } })
  })
})
