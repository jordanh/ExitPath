/**
 * Catalog validation: schema checks plus the cross-file rules a schema can't
 * express (ids match file names, references resolve, feature tables are
 * complete). Used by `npm run validate` and by the test suite.
 */
import { z } from 'zod'
import {
  AlternativeSchema,
  CategorySchema,
  GuideSchema,
  SuiteSchema,
  ToolSchema,
  type Alternative,
  type Category,
  type Guide,
  type RawCatalog,
  type Suite,
  type Tool,
} from './schema.ts'

export interface Issue {
  /** Path of the offending file, relative to /catalog. */
  file: string
  message: string
}

export interface ValidatedCatalog {
  categories: Category[]
  alternatives: Alternative[]
  tools: Tool[]
  suites: Suite[]
  guides: Guide[]
}

function parseAll<T extends { id: string }>(
  dir: string,
  schema: z.ZodType<T>,
  files: Record<string, unknown>,
  issues: Issue[],
): T[] {
  const out: T[] = []
  for (const [name, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const file = `${dir}/${name}.json`
    const result = schema.safeParse(raw)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const where = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
        issues.push({ file, message: `${where}${issue.message}` })
      }
      continue
    }
    if (result.data.id !== name) {
      issues.push({ file, message: `id "${result.data.id}" must match the file name "${name}"` })
    }
    out.push(result.data)
  }
  return out
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) dupes.add(value)
    seen.add(value)
  }
  return [...dupes]
}

export function validateCatalog(raw: RawCatalog): { catalog: ValidatedCatalog; issues: Issue[] } {
  const issues: Issue[] = []

  // --- categories -----------------------------------------------------------
  let categories: Category[] = []
  const parsedCategories = z.array(CategorySchema).safeParse(raw.categories)
  if (parsedCategories.success) {
    categories = parsedCategories.data
  } else {
    for (const issue of parsedCategories.error.issues) {
      issues.push({ file: 'categories.json', message: `${issue.path.join('.')}: ${issue.message}` })
    }
  }
  for (const id of duplicates(categories.map((c) => c.id))) {
    issues.push({ file: 'categories.json', message: `duplicate category id "${id}"` })
  }
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  for (const category of categories) {
    for (const id of duplicates(category.features.map((f) => f.id))) {
      issues.push({
        file: 'categories.json',
        message: `category "${category.id}" lists feature "${id}" twice`,
      })
    }
  }

  // --- alternatives ---------------------------------------------------------
  const alternatives = parseAll('alternatives', AlternativeSchema, raw.alternatives, issues)
  const alternativeById = new Map(alternatives.map((a) => [a.id, a]))

  for (const alt of alternatives) {
    const file = `alternatives/${alt.id}.json`
    const expected = new Set<string>()
    for (const categoryId of alt.categories) {
      const category = categoryById.get(categoryId)
      if (!category) {
        issues.push({ file, message: `unknown category "${categoryId}"` })
        continue
      }
      for (const feature of category.features) expected.add(feature.id)
    }
    for (const featureId of expected) {
      if (!(featureId in alt.features)) {
        issues.push({ file, message: `features is missing "${featureId}"` })
      }
    }
    for (const featureId of Object.keys(alt.features)) {
      if (!expected.has(featureId)) {
        issues.push({
          file,
          message: `features has "${featureId}", which is not a feature of ${alt.categories.join(' or ')}`,
        })
      }
    }
    for (const featureId of Object.keys(alt.featureNotes ?? {})) {
      if (!(featureId in alt.features)) {
        issues.push({ file, message: `featureNotes has "${featureId}" but features does not` })
      }
    }
    if (alt.kind === 'server' && alt.selfHosting === null) {
      issues.push({ file, message: 'kind is "server" but selfHosting is null' })
    }
  }

  // --- tools ----------------------------------------------------------------
  const tools = parseAll('tools', ToolSchema, raw.tools, issues)
  const toolById = new Map(tools.map((t) => [t.id, t]))
  const reachable = new Set<string>()

  for (const tool of tools) {
    const file = `tools/${tool.id}.json`
    if (!categoryById.has(tool.category)) {
      issues.push({ file, message: `unknown category "${tool.category}"` })
    }
    if (alternativeById.has(tool.id)) {
      issues.push({ file, message: `id "${tool.id}" is also used by an alternative` })
    }
    for (const to of duplicates(tool.paths.map((p) => p.to))) {
      issues.push({ file, message: `more than one path to "${to}"` })
    }
    for (const path of tool.paths) {
      const alt = alternativeById.get(path.to)
      if (!alt) {
        issues.push({ file, message: `path to unknown alternative "${path.to}"` })
        continue
      }
      reachable.add(alt.id)
      if (!alt.categories.includes(tool.category)) {
        issues.push({
          file,
          message: `path to "${path.to}", which is not in category "${tool.category}"`,
        })
      }
    }
  }

  for (const alt of alternatives) {
    if (!reachable.has(alt.id)) {
      issues.push({
        file: `alternatives/${alt.id}.json`,
        message: 'no tool has a path to this alternative',
      })
    }
  }

  // --- guides ---------------------------------------------------------------
  const guides = parseAll('guides', GuideSchema, raw.guides, issues)
  const guideById = new Map(guides.map((g) => [g.id, g]))

  for (const guide of guides) {
    const file = `guides/${guide.id}.json`
    for (const toolId of guide.tools) {
      if (!toolById.has(toolId)) issues.push({ file, message: `unknown tool "${toolId}"` })
    }
    for (const entry of guide.stack) {
      if (!alternativeById.has(entry.alternative)) {
        issues.push({ file, message: `stack references unknown alternative "${entry.alternative}"` })
      }
    }
    for (const id of duplicates(guide.phases.map((p) => p.id))) {
      issues.push({ file, message: `duplicate phase id "${id}"` })
    }
    for (const id of duplicates(guide.phases.flatMap((p) => p.steps.map((s) => s.id)))) {
      issues.push({ file, message: `duplicate step id "${id}" (step ids must be unique per guide)` })
    }
  }

  // --- suites ---------------------------------------------------------------
  const suites = parseAll('suites', SuiteSchema, raw.suites, issues)
  for (const suite of suites) {
    const file = `suites/${suite.id}.json`
    for (const component of suite.components) {
      if (!toolById.has(component.tool)) {
        issues.push({
          file,
          message: `component "${component.label}" references unknown tool "${component.tool}"`,
        })
      }
    }
    if (suite.guide && !guideById.has(suite.guide)) {
      issues.push({ file, message: `unknown guide "${suite.guide}"` })
    }
  }

  return { catalog: { categories, alternatives, tools, suites, guides }, issues }
}
