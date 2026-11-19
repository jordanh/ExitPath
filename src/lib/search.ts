/**
 * A small in-memory search over the catalog. No dependencies, no network:
 * the whole index is a few hundred strings.
 */
import { alternatives, getCategory, getTool, guides, pathsTo, suites, tools } from '../catalog/index.ts'

export type ResultKind = 'tool' | 'suite' | 'alternative' | 'guide'

export interface SearchResult {
  kind: ResultKind
  id: string
  title: string
  subtitle: string
  href: string
  score: number
}

interface Field {
  words: string[]
  weight: number
}

interface Entry extends Omit<SearchResult, 'score'> {
  fields: Field[]
}

/** Lowercase, strip accents, split on anything that is not a letter or digit. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

const field = (text: string | string[] | undefined, weight: number): Field => ({
  words: tokenize(Array.isArray(text) ? text.join(' ') : (text ?? '')),
  weight,
})

function buildIndex(): Entry[] {
  const entries: Entry[] = []

  for (const tool of tools) {
    const category = getCategory(tool.category)
    entries.push({
      kind: 'tool',
      id: tool.id,
      title: tool.name,
      subtitle: `${tool.vendor} · ${tool.paths.length} ${tool.paths.length === 1 ? 'alternative' : 'alternatives'}`,
      href: `/tools/${tool.id}`,
      fields: [
        field(tool.name, 10),
        field(tool.alsoCovers, 8),
        field(tool.vendor, 4),
        field(category?.name, 3),
        field(category?.description, 2),
      ],
    })
  }

  for (const suite of suites) {
    entries.push({
      kind: 'suite',
      id: suite.id,
      title: suite.name,
      subtitle: `${suite.vendor} · ${suite.components.length} parts to replace`,
      href: `/suites/${suite.id}`,
      fields: [
        field(suite.name, 11),
        field(suite.vendor, 4),
        field(
          suite.components.map((component) => component.label),
          3,
        ),
      ],
    })
  }

  for (const alternative of alternatives) {
    const replaces = pathsTo(alternative).map(({ tool }) => tool)
    entries.push({
      kind: 'alternative',
      id: alternative.id,
      title: alternative.name,
      subtitle: alternative.tagline,
      href: `/alternatives/${alternative.id}`,
      fields: [
        // Names and categories only. Matching on the tagline made "docker"
        // return a mail server that merely runs in Docker.
        field(alternative.name, 10),
        field(
          alternative.categories.map((id) => getCategory(id)?.name ?? ''),
          3,
        ),
        // Searching for "slack" should also surface what replaces Slack.
        field(
          replaces.flatMap((tool) => [tool.name, ...(tool.alsoCovers ?? [])]),
          3,
        ),
      ],
    })
  }

  for (const guide of guides) {
    entries.push({
      kind: 'guide',
      id: guide.id,
      title: guide.title,
      subtitle: 'Step-by-step checklist',
      href: `/guides/${guide.id}`,
      fields: [
        field(guide.title, 8),
        field(
          guide.tools.flatMap((id) => {
            const tool = getTool(id)
            return tool ? [tool.name, ...(tool.alsoCovers ?? [])] : []
          }),
          4,
        ),
      ],
    })
  }

  return entries
}

let index: Entry[] | undefined

/** True when the strings differ by at most one insertion, deletion or substitution. */
export function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else {
      i++
      j++
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

/** How well one query token matches one indexed word: 0 (no match) to 1 (exact). */
function matchQuality(token: string, word: string): number {
  if (word === token) return 1
  if (word.startsWith(token)) return 0.8
  if (token.length >= 3 && word.includes(token)) return 0.5
  // Forgive a single typo in longer words ("nextclod", "mattermst").
  if (token.length >= 5 && withinOneEdit(token, word)) return 0.4
  return 0
}

const KIND_ORDER: Record<ResultKind, number> = { tool: 0, suite: 1, alternative: 2, guide: 3 }

export function search(query: string, limit = 12): SearchResult[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []
  index ??= buildIndex()

  const results: SearchResult[] = []
  for (const entry of index) {
    let total = 0
    let matchedAll = true
    for (const token of tokens) {
      let best = 0
      for (const { words, weight } of entry.fields) {
        for (const word of words) {
          const quality = matchQuality(token, word) * weight
          if (quality > best) best = quality
        }
      }
      if (best === 0) {
        matchedAll = false
        break
      }
      total += best
    }
    if (!matchedAll) continue
    const { fields: _fields, ...result } = entry
    results.push({ ...result, score: total })
  }

  return results
    .sort(
      (a, b) =>
        b.score - a.score || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title),
    )
    .slice(0, limit)
}
