import { describe, expect, it } from 'vitest'
import { search, tokenize, withinOneEdit } from './search.ts'

const titles = (query: string) => search(query).map((result) => `${result.kind}:${result.id}`)

describe('tokenize', () => {
  it('lowercases, strips accents and splits on punctuation', () => {
    expect(tokenize('  OneDrive & SharePoint—Baïkal 365! ')).toEqual([
      'onedrive',
      'sharepoint',
      'baikal',
      '365',
    ])
  })

  it('returns nothing for blank input', () => {
    expect(tokenize('  \t ')).toEqual([])
  })
})

describe('withinOneEdit', () => {
  it.each([
    ['nextcloud', 'nextcloud', true],
    ['nextclod', 'nextcloud', true], // one letter missing
    ['nextcloudd', 'nextcloud', true], // one letter extra
    ['nextclaud', 'nextcloud', true], // one letter wrong
    ['nxtclod', 'nextcloud', false], // two missing
    ['slack', 'zulip', false],
  ])('%s vs %s is %s', (a, b, expected) => {
    expect(withinOneEdit(a, b)).toBe(expected)
  })
})

describe('search', () => {
  it('returns nothing for an empty query', () => {
    expect(search('')).toEqual([])
    expect(search('   ')).toEqual([])
  })

  it('puts the tool itself first, then what helps you leave it', () => {
    const found = titles('slack')
    expect(found[0]).toBe('tool:slack')
    expect(found).toContain('guide:leaving-slack')
    expect(found).toContain('alternative:mattermost')
    expect(found).toContain('alternative:zulip')
  })

  it('finds tools by the other products they cover', () => {
    expect(titles('lastpass')[0]).toBe('tool:1password')
    expect(titles('google meet')[0]).toBe('tool:zoom')
    expect(titles('sharepoint')[0]).toBe('tool:onedrive')
    expect(titles('excel')[0]).toBe('tool:microsoft-office')
  })

  it('finds suites by name', () => {
    expect(titles('microsoft 365')[0]).toBe('suite:microsoft-365')
    expect(titles('workspace')).toContain('suite:google-workspace')
  })

  it('finds alternatives by name and by prefix', () => {
    expect(titles('nextcloud')[0]).toBe('alternative:nextcloud')
    expect(titles('next')[0]).toBe('alternative:nextcloud')
    expect(titles('immi')[0]).toBe('alternative:immich')
  })

  it('finds things by category', () => {
    const found = titles('photos')
    expect(found).toContain('tool:google-photos')
    expect(found).toContain('alternative:immich')
  })

  it('forgives a single typo', () => {
    expect(titles('nextclod')[0]).toBe('alternative:nextcloud')
    expect(titles('mattermst')[0]).toBe('alternative:mattermost')
  })

  it('requires every word to match something', () => {
    expect(search('slack banana')).toEqual([])
  })

  it('returns nothing rather than noise for gibberish', () => {
    expect(search('qzxwv')).toEqual([])
  })

  it('respects the limit', () => {
    expect(search('google', 3)).toHaveLength(3)
  })

  it('gives every result a route', () => {
    for (const result of search('microsoft'))
      expect(result.href).toMatch(/^\/(tools|suites|alternatives|guides)\//)
  })
})
