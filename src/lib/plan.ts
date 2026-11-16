/**
 * Turns the stored plan (tool id -> chosen alternative, or "easiest") into
 * scored moves for the current situation.
 */
import { getTool } from '../catalog/index.ts'
import type { Tool } from '../catalog/schema.ts'
import { allPathsFrom, scoredPathsFrom, type ScoredPath } from './paths.ts'
import type { Situation } from './scoring.ts'
import type { Plan } from './storage.ts'

export interface PlanItem {
  tool: Tool
  /** The path the plan currently uses for this tool. */
  chosen: ScoredPath
  /** True when the plan follows "whichever is easiest" rather than a fixed pick. */
  auto: boolean
  /** Every path out of the tool, easiest first. */
  options: ScoredPath[]
}

/**
 * Resolves a plan against the catalog. Tools that no longer exist are
 * dropped, and a pick that no longer exists falls back to the easiest path,
 * so an old saved plan never breaks the page. Easiest move first.
 */
export function resolvePlan(plan: Plan, situation: Situation): PlanItem[] {
  const items: PlanItem[] = []
  for (const [toolId, choice] of Object.entries(plan)) {
    const tool = getTool(toolId)
    if (!tool) continue
    const suitable = scoredPathsFrom(tool, situation)
    const easiest = suitable[0]
    if (!easiest) continue
    // A destination someone picked by hand is kept even when the licence
    // filter would not have offered it: it was their decision.
    const offered = choice === null ? undefined : suitable.find((option) => option.alternative.id === choice)
    const picked =
      offered ??
      (choice === null
        ? undefined
        : allPathsFrom(tool, situation).find((option) => option.alternative.id === choice))
    const options = picked && !offered ? [...suitable, picked] : suitable
    items.push({ tool, chosen: picked ?? easiest, auto: picked === undefined, options })
  }
  return items.sort(
    (a, b) => a.chosen.result.score - b.chosen.result.score || a.tool.name.localeCompare(b.tool.name),
  )
}

export interface PlanTotals {
  /** Hands-on hours across every move, [low, high]. */
  hours: [number, number]
  hardest: PlanItem | undefined
  /** Distinct alternatives the plan ends up on. */
  destinations: number
  /** Distinct servers to run, counting each self-hosted alternative once. */
  servers: number
}

/**
 * Adds the plan up. An alternative used for several tools (Nextcloud for
 * both OneDrive and Google Drive, say) is only set up once, so its setup
 * hours are counted once.
 */
export function planTotals(items: PlanItem[]): PlanTotals {
  const hours: [number, number] = [0, 0]
  const setupCounted = new Set<string>()
  let servers = 0
  for (const { chosen } of items) {
    const { migrationHours, hosting } = chosen.result
    hours[0] += migrationHours[0]
    hours[1] += migrationHours[1]
    if (!setupCounted.has(chosen.alternative.id)) {
      setupCounted.add(chosen.alternative.id)
      hours[0] += hosting.setupHours[0]
      hours[1] += hosting.setupHours[1]
      if (hosting.mode === 'self-hosted') servers += 1
    }
  }
  const hardest = items.reduce<PlanItem | undefined>(
    (worst, item) => (!worst || item.chosen.result.score > worst.chosen.result.score ? item : worst),
    undefined,
  )
  return { hours, hardest, destinations: setupCounted.size, servers }
}
