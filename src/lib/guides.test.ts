import { describe, expect, it } from 'vitest'
import { guides } from '../catalog/index.ts'
import { guideStatus, stepIds } from './guides.ts'

const guide = guides[0]!
const ids = stepIds(guide)

describe('guideStatus', () => {
  it('starts at zero', () => {
    expect(guideStatus(guide, { done: [], notes: '', updatedAt: '' })).toMatchObject({
      done: 0,
      total: ids.length,
    })
  })

  it('counts completed steps', () => {
    const status = guideStatus(guide, { done: ids.slice(0, 3), notes: '', updatedAt: '' })
    expect(status.done).toBe(3)
    expect(status.doneIds.has(ids[0]!)).toBe(true)
  })

  it('ignores steps that no longer exist in the guide', () => {
    const status = guideStatus(guide, {
      done: [ids[0]!, 'a-step-removed-last-year'],
      notes: '',
      updatedAt: '',
    })
    expect(status.done).toBe(1)
  })

  it('can reach exactly 100%', () => {
    const status = guideStatus(guide, { done: [...ids, 'stale'], notes: '', updatedAt: '' })
    expect(status.done).toBe(status.total)
  })
})
