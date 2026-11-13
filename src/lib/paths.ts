import { pathsFrom, pathsTo, type ResolvedPath } from '../catalog/index.ts'
import type { Alternative, Tool } from '../catalog/schema.ts'
import { scorePath, type Context, type PathScore } from './scoring.ts'

export interface ScoredPath extends ResolvedPath {
  result: PathScore
}

const score =
  (context: Context) =>
  (resolved: ResolvedPath): ScoredPath => ({
    ...resolved,
    result: scorePath(resolved.tool, resolved.path, resolved.alternative, context),
  })

/** Easiest first; ties go to the better fit. */
const byDifficulty = (a: ScoredPath, b: ScoredPath) =>
  a.result.score - b.result.score ||
  b.path.fit - a.path.fit ||
  a.alternative.name.localeCompare(b.alternative.name)

export function scoredPathsFrom(tool: Tool, context: Context): ScoredPath[] {
  return pathsFrom(tool).map(score(context)).sort(byDifficulty)
}

export function scoredPathsTo(alternative: Alternative, context: Context): ScoredPath[] {
  return pathsTo(alternative)
    .map(score(context))
    .sort((a, b) => b.path.fit - a.path.fit || a.tool.name.localeCompare(b.tool.name))
}
