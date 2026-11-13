import { describe, expect, it, vi } from 'vitest'
import {
  EXPORT_FORMAT,
  PREFS_KEY,
  PROGRESS_KEY,
  clearEverything,
  exportData,
  getPrefs,
  getProgress,
  importData,
  resetGuide,
  sanitizePrefs,
  sanitizeProgress,
  setGuideNotes,
  setPrefs,
  setStepDone,
} from './storage.ts'

describe('preferences', () => {
  it('start with sensible defaults', () => {
    expect(getPrefs()).toEqual({ teamSize: 'solo', hosting: 'self', theme: 'system' })
  })

  it('merge partial updates and persist them', () => {
    setPrefs({ teamSize: 'small' })
    setPrefs({ theme: 'dark' })
    expect(getPrefs()).toEqual({ teamSize: 'small', hosting: 'self', theme: 'dark' })
    expect(JSON.parse(localStorage.getItem(PREFS_KEY)!)).toEqual(getPrefs())
  })

  it('survive corrupted storage', () => {
    localStorage.setItem(PREFS_KEY, '{not json')
    expect(getPrefs()).toEqual({ teamSize: 'solo', hosting: 'self', theme: 'system' })
  })

  it('drop values that are not valid choices', () => {
    expect(sanitizePrefs({ teamSize: 'huge', hosting: 'managed', theme: 7 })).toEqual({
      teamSize: 'solo',
      hosting: 'managed',
      theme: 'system',
    })
    expect(sanitizePrefs(null)).toEqual({ teamSize: 'solo', hosting: 'self', theme: 'system' })
    // Inherited object keys are not choices.
    expect(sanitizePrefs({ teamSize: 'toString' }).teamSize).toBe('solo')
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

describe('export and import', () => {
  it('round-trips everything', () => {
    setPrefs({ teamSize: 'large', hosting: 'managed' })
    setStepDone('leaving-slack', 'export', true)
    setGuideNotes('leaving-slack', 'note')
    const file = JSON.stringify(exportData())

    clearEverything()
    expect(getProgress()).toEqual({})
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull()

    expect(importData(file)).toEqual({ guides: 1 })
    expect(getPrefs()).toMatchObject({ teamSize: 'large', hosting: 'managed' })
    expect(getProgress()['leaving-slack']).toMatchObject({ done: ['export'], notes: 'note' })
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
    expect(getPrefs()).toEqual({ teamSize: 'solo', hosting: 'self', theme: 'dark' })
    expect(getProgress()).toEqual({ g: { done: ['a'], notes: '', updatedAt: '' } })
  })
})
