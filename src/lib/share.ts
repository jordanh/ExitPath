/**
 * A plan as a short piece of text that fits in a link, so it can be shared
 * without a server: "slack.mattermost~notion~vscode.vscodium". A tool with
 * no destination after the dot follows "easiest for my situation".
 *
 * Ids only contain lowercase letters, digits and hyphens, so "." and "~" are
 * safe separators and nothing needs escaping in a URL.
 */
import { getTool } from '../catalog/index.ts'
import type { Plan } from './storage.ts'

export function encodePlan(plan: Plan): string {
  return Object.entries(plan)
    .map(([toolId, choice]) => (choice ? `${toolId}.${choice}` : toolId))
    .join('~')
}

/**
 * Reads a shared plan. Anything that is not in the catalog is dropped: a
 * link is untrusted input, and an old link may mention entries that have
 * since been renamed.
 */
export function decodePlan(text: string): Plan {
  const plan: Plan = {}
  for (const part of text.split('~').slice(0, 100)) {
    const [toolId, choice] = part.split('.', 2)
    const tool = toolId ? getTool(toolId) : undefined
    if (!tool) continue
    plan[tool.id] = choice && tool.paths.some((path) => path.to === choice) ? choice : null
  }
  return plan
}
