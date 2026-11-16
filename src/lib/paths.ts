import { pathsFrom, pathsTo, type ResolvedPath } from '../catalog/index.ts'
import type { Alternative, Tool } from '../catalog/schema.ts'
import { scorePath, type Context, type PathScore, type Situation } from './scoring.ts'

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

/** Every path out of a tool, scored and easiest first, whatever its licence. */
export function allPathsFrom(tool: Tool, context: Context): ScoredPath[] {
  return pathsFrom(tool).map(score(context)).sort(byDifficulty)
}

/**
 * The paths out of a tool that suit the reader's situation, easiest first.
 * With `openOnly`, open-core and source-available alternatives are left out;
 * if that would leave nothing, everything is shown rather than a dead end.
 */
export function scoredPathsFrom(tool: Tool, situation: Situation): ScoredPath[] {
  const all = allPathsFrom(tool, situation)
  if (!situation.openOnly) return all
  const open = all.filter(({ alternative }) => alternative.openness === 'open-source')
  return open.length > 0 ? open : all
}

export type PathOrder = 'easiest' | 'fit' | 'maturity'

export const PATH_ORDERS: Record<PathOrder, string> = {
  easiest: 'Easiest',
  fit: 'Best fit',
  maturity: 'Most mature',
}

/** Re-orders scored paths; difficulty breaks ties, so the order is always stable. */
export function orderPaths(paths: ScoredPath[], order: PathOrder): ScoredPath[] {
  if (order === 'easiest') return [...paths].sort(byDifficulty)
  const key =
    order === 'fit'
      ? (scored: ScoredPath) => scored.path.fit
      : (scored: ScoredPath) => scored.alternative.maturity.score
  return [...paths].sort((a, b) => key(b) - key(a) || byDifficulty(a, b))
}

export function scoredPathsTo(alternative: Alternative, context: Context): ScoredPath[] {
  return pathsTo(alternative)
    .map(score(context))
    .sort((a, b) => b.path.fit - a.path.fit || a.tool.name.localeCompare(b.tool.name))
}
