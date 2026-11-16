/**
 * Plans and checklists as Markdown task lists, for pasting into an issue
 * tracker, a wiki or a notes app.
 */
import type { Guide } from '../catalog/schema.ts'
import type { PlanItem } from './plan.ts'
import { formatEffort } from './scoring.ts'

const box = (done: boolean) => (done ? '- [x]' : '- [ ]')

export function planToMarkdown(
  items: PlanItem[],
  done: ReadonlySet<string>,
  totalHours: [number, number],
): string {
  const lines = [
    '# My exit plan',
    '',
    `${items.length} ${items.length === 1 ? 'move' : 'moves'}, easiest first. About ${formatEffort(totalHours).toLowerCase()} of hands-on work in total.`,
    '',
  ]
  for (const { tool, chosen } of items) {
    const { score, band, hours } = chosen.result
    lines.push(
      `${box(done.has(tool.id))} **${tool.name} → ${chosen.alternative.name}** (${band.label.toLowerCase()}, ${score}/100, ${formatEffort(hours).toLowerCase()})`,
      `  ${chosen.path.verdict}`,
    )
  }
  return `${lines.join('\n')}\n`
}

export function guideToMarkdown(guide: Guide, done: ReadonlySet<string>): string {
  const lines = [`# ${guide.title}`, '', guide.summary, '']
  guide.phases.forEach((phase, index) => {
    lines.push(`## ${index + 1}. ${phase.title}`, '')
    if (phase.intro) lines.push(phase.intro, '')
    for (const step of phase.steps) {
      lines.push(
        `${box(done.has(step.id))} **${step.title}**${step.optional ? ' (optional)' : ''}`,
        `  ${step.detail}`,
      )
      for (const link of step.links ?? []) lines.push(`  - [${link.label}](${link.url})`)
    }
    lines.push('')
  })
  return `${lines.join('\n').trimEnd()}\n`
}
