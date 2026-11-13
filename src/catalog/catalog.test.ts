import { describe, expect, it } from 'vitest'
import categories from '../../catalog/categories.json'
import type { RawCatalog } from './schema.ts'
import { validateCatalog } from './validate.ts'

const byFileName = (modules: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(modules).map(([path, value]) => [
      path
        .split('/')
        .pop()!
        .replace(/\.json$/, ''),
      value,
    ]),
  )

const raw: RawCatalog = {
  categories,
  alternatives: byFileName(
    import.meta.glob('../../catalog/alternatives/*.json', { eager: true, import: 'default' }),
  ),
  tools: byFileName(import.meta.glob('../../catalog/tools/*.json', { eager: true, import: 'default' })),
  suites: byFileName(import.meta.glob('../../catalog/suites/*.json', { eager: true, import: 'default' })),
  guides: byFileName(import.meta.glob('../../catalog/guides/*.json', { eager: true, import: 'default' })),
}

/** A deep copy that tests can break without affecting each other. */
const copy = (): RawCatalog => structuredClone(raw)
const messages = (catalog: RawCatalog) =>
  validateCatalog(catalog).issues.map((issue) => `${issue.file}: ${issue.message}`)

describe('the shipped catalog', () => {
  it('passes validation', () => {
    expect(messages(raw)).toEqual([])
  })

  it('is not empty', () => {
    const { catalog } = validateCatalog(raw)
    expect(catalog.tools.length).toBeGreaterThanOrEqual(15)
    expect(catalog.alternatives.length).toBeGreaterThanOrEqual(25)
    expect(catalog.guides.length).toBeGreaterThanOrEqual(3)
  })

  it('gives every tool at least two ways out', () => {
    const { catalog } = validateCatalog(raw)
    const thin = catalog.tools.filter((tool) => tool.paths.length < 2).map((tool) => tool.id)
    expect(thin).toEqual([])
  })

  it('flags anything that is not plainly open source with a licence note', () => {
    const { catalog } = validateCatalog(raw)
    const unexplained = catalog.alternatives
      .filter((alternative) => alternative.openness !== 'open-source' && !alternative.licenseNote)
      .map((alternative) => alternative.id)
    expect(unexplained).toEqual([])
  })
})

describe('validateCatalog', () => {
  it('rejects an id that does not match its file name', () => {
    const broken = copy()
    broken.tools['slack-renamed'] = broken.tools.slack
    delete broken.tools.slack
    expect(messages(broken)).toContain(
      'tools/slack-renamed.json: id "slack" must match the file name "slack-renamed"',
    )
  })

  it('rejects a path to an alternative that does not exist', () => {
    const broken = copy()
    ;(broken.tools.slack as { paths: { to: string }[] }).paths[0]!.to = 'no-such-thing'
    expect(messages(broken)).toContain('tools/slack.json: path to unknown alternative "no-such-thing"')
  })

  it('rejects a path to an alternative from another category', () => {
    const broken = copy()
    ;(broken.tools.slack as { paths: { to: string }[] }).paths[0]!.to = 'immich'
    expect(messages(broken)).toContain('tools/slack.json: path to "immich", which is not in category "chat"')
  })

  it('requires a value for every feature of the category', () => {
    const broken = copy()
    delete (broken.alternatives.zulip as { features: Record<string, string> }).features.threads
    expect(messages(broken)).toContain('alternatives/zulip.json: features is missing "threads"')
  })

  it('rejects features that the category does not define', () => {
    const broken = copy()
    ;(broken.alternatives.zulip as { features: Record<string, string> }).features['made-up'] = 'yes'
    expect(messages(broken).join('\n')).toMatch(/zulip\.json: features has "made-up"/)
  })

  it('rejects unknown keys, so typos do not pass silently', () => {
    const broken = copy()
    ;(broken.alternatives.zulip as Record<string, unknown>).licence = 'Apache-2.0'
    expect(messages(broken).join('\n')).toMatch(/alternatives\/zulip\.json: .*licence/i)
  })

  it('rejects non-https links', () => {
    const broken = copy()
    ;(broken.alternatives.zulip as { links: { website: string } }).links.website = 'http://zulip.com'
    expect(messages(broken).join('\n')).toMatch(
      /alternatives\/zulip\.json: links\.website: must be an https:\/\/ URL/,
    )
  })

  it('rejects duplicate step ids inside a guide', () => {
    const broken = copy()
    const guide = broken.guides['leaving-slack'] as { phases: { steps: { id: string }[] }[] }
    guide.phases[1]!.steps[0]!.id = guide.phases[0]!.steps[0]!.id
    expect(messages(broken).join('\n')).toMatch(/leaving-slack\.json: duplicate step id/)
  })

  it('rejects an alternative that nothing leads to', () => {
    const broken = copy()
    broken.alternatives.orphan = { ...(broken.alternatives.zulip as object), id: 'orphan' }
    expect(messages(broken)).toContain('alternatives/orphan.json: no tool has a path to this alternative')
  })

  it('rejects a suite that points at a missing tool or guide', () => {
    const broken = copy()
    const suite = broken.suites['microsoft-365'] as { guide: string; components: { tool: string }[] }
    suite.guide = 'nope'
    suite.components[0]!.tool = 'nope'
    const found = messages(broken).join('\n')
    expect(found).toMatch(/microsoft-365\.json: unknown guide "nope"/)
    expect(found).toMatch(/microsoft-365\.json: component .* references unknown tool "nope"/)
  })
})
