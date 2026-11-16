import { describe, expect, it } from 'vitest'
import { getTool, tools } from '../catalog/index.ts'
import { allPathsFrom, orderPaths, scoredPathsFrom } from './paths.ts'
import type { Context } from './scoring.ts'

const solo: Context = { teamSize: 'solo', hosting: 'self' }
const slack = getTool('slack')!
const notion = getTool('notion')!

describe('scoredPathsFrom', () => {
  it('lists every path, easiest first', () => {
    const paths = scoredPathsFrom(slack, solo)
    expect(paths).toHaveLength(slack.paths.length)
    const scores = paths.map((path) => path.result.score)
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
  })

  it('leaves out open-core and source-available projects when asked to', () => {
    const open = scoredPathsFrom(notion, { ...solo, openOnly: true })
    expect(open.length).toBeGreaterThan(0)
    expect(open.length).toBeLessThan(allPathsFrom(notion, solo).length)
    for (const { alternative } of open) expect(alternative.openness).toBe('open-source')
  })

  it('never leaves a tool with no way out', () => {
    for (const tool of tools) {
      expect(scoredPathsFrom(tool, { ...solo, openOnly: true }).length).toBeGreaterThan(0)
    }
  })
})

describe('orderPaths', () => {
  const paths = scoredPathsFrom(slack, solo)

  it('can put the best fit or the most mature project first', () => {
    const fits = orderPaths(paths, 'fit').map((path) => path.path.fit)
    expect(fits).toEqual([...fits].sort((a, b) => b - a))
    const maturity = orderPaths(paths, 'maturity').map((path) => path.alternative.maturity.score)
    expect(maturity).toEqual([...maturity].sort((a, b) => b - a))
  })

  it('keeps the same paths and does not reorder the list it was given', () => {
    const before = [...paths]
    const byFit = orderPaths(paths, 'fit')
    expect(paths).toEqual(before)
    expect(new Set(byFit)).toEqual(new Set(paths))
    expect(orderPaths(byFit, 'easiest')).toEqual(paths)
  })
})
