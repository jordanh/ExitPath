/**
 * Loads the JSON catalog into the app bundle and builds lookup tables.
 *
 * Everything is bundled at build time: the app makes no network requests for
 * data. The JSON is trusted here because `npm run validate` and the test
 * suite check it against the schema before anything ships.
 */
import categoriesJson from '../../catalog/categories.json'
import type { Alternative, Category, Guide, Path, Suite, Tool } from './schema.ts'

function load<T extends { name?: string; title?: string }>(modules: Record<string, unknown>): T[] {
  const label = (item: T) => item.name ?? item.title ?? ''
  return (Object.values(modules) as T[]).sort((a, b) => label(a).localeCompare(label(b)))
}

export const categories = categoriesJson as unknown as Category[]

export const alternatives = load<Alternative>(
  import.meta.glob('../../catalog/alternatives/*.json', { eager: true, import: 'default' }),
)
export const tools = load<Tool>(
  import.meta.glob('../../catalog/tools/*.json', { eager: true, import: 'default' }),
)
export const suites = load<Suite>(
  import.meta.glob('../../catalog/suites/*.json', { eager: true, import: 'default' }),
)
export const guides = load<Guide>(
  import.meta.glob('../../catalog/guides/*.json', { eager: true, import: 'default' }),
)

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]))

const categoryIndex = byId(categories)
const alternativeIndex = byId(alternatives)
const toolIndex = byId(tools)
const suiteIndex = byId(suites)
const guideIndex = byId(guides)

export const getCategory = (id: string) => categoryIndex.get(id)
export const getAlternative = (id: string) => alternativeIndex.get(id)
export const getTool = (id: string) => toolIndex.get(id)
export const getSuite = (id: string) => suiteIndex.get(id)
export const getGuide = (id: string) => guideIndex.get(id)

export interface ResolvedPath {
  tool: Tool
  path: Path
  alternative: Alternative
}

/** A tool's paths with their alternatives attached, in catalog order. */
export function pathsFrom(tool: Tool): ResolvedPath[] {
  return tool.paths.flatMap((path) => {
    const alternative = alternativeIndex.get(path.to)
    return alternative ? [{ tool, path, alternative }] : []
  })
}

/** Every path that leads to an alternative: "what does this replace?" */
export function pathsTo(alternative: Alternative): ResolvedPath[] {
  return tools.flatMap((tool) =>
    tool.paths.filter((path) => path.to === alternative.id).map((path) => ({ tool, path, alternative })),
  )
}

export const guidesForTool = (toolId: string) => guides.filter((guide) => guide.tools.includes(toolId))

export const guidesForAlternative = (alternativeId: string) =>
  guides.filter((guide) => guide.stack.some((entry) => entry.alternative === alternativeId))

export const suitesForTool = (toolId: string) =>
  suites.filter((suite) => suite.components.some((component) => component.tool === toolId))

export const totalPaths = tools.reduce((sum, tool) => sum + tool.paths.length, 0)

/** Most recent "reviewed" month across the catalog, e.g. "2026-11". */
export const lastReviewed = [...tools, ...alternatives, ...guides]
  .map((entry) => entry.reviewed)
  .sort()
  .at(-1)
