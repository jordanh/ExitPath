import { describe, expect, it } from 'vitest'
import { decodePlan, encodePlan } from './share.ts'

describe('a plan in a link', () => {
  it('round-trips destinations and "easiest for me"', () => {
    const plan = { slack: 'mattermost', notion: null, vscode: 'vscodium' }
    const text = encodePlan(plan)
    expect(text).toBe('slack.mattermost~notion~vscode.vscodium')
    expect(decodePlan(text)).toEqual(plan)
  })

  it('needs no escaping in a URL', () => {
    const text = encodePlan({ 'google-photos': 'ente-photos', 'outlook-exchange': null })
    expect(encodeURIComponent(text)).toBe(text)
  })

  it('drops what is not in the catalog', () => {
    expect(decodePlan('slack.mattermost~not-a-tool~notion.not-an-alternative')).toEqual({
      slack: 'mattermost',
      notion: null,
    })
    // A destination has to be one this tool actually has a path to.
    expect(decodePlan('slack.nextcloud')).toEqual({ slack: null })
  })

  it('makes nothing of nonsense', () => {
    expect(decodePlan('')).toEqual({})
    expect(decodePlan('~~~')).toEqual({})
    expect(decodePlan('<script>alert(1)</script>')).toEqual({})
    expect(decodePlan('__proto__.x~constructor~toString')).toEqual({})
  })
})
