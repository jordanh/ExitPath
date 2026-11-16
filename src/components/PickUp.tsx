import { Link } from 'react-router-dom'
import { guides } from '../catalog/index.ts'
import { guideStatus } from '../lib/guides.ts'
import { planTotals, resolvePlan } from '../lib/plan.ts'
import { formatEffort } from '../lib/scoring.ts'
import { useAllProgress, usePlan, usePrefs } from '../lib/storage.ts'
import { IconArrowRight } from './icons.tsx'
import { ProgressBar } from './ui.tsx'

const card = 'card group flex h-full flex-col p-5 sm:p-6'

/**
 * Shown on the home page to someone who has been here before: the checklists
 * they are part-way through, and their plan. Renders nothing for a newcomer.
 */
export function PickUp() {
  const progress = useAllProgress()
  const plan = usePlan()
  const { teamSize, hosting } = usePrefs()

  const underway = guides.flatMap((guide) => {
    const saved = progress[guide.id]
    if (!saved) return []
    const status = guideStatus(guide, saved)
    if (status.done === 0 || status.done === status.total) return []
    const next = guide.phases.flatMap((phase) => phase.steps).find((step) => !status.doneIds.has(step.id))
    return [{ guide, status, next }]
  })
  const moves = resolvePlan(plan, { teamSize, hosting })
  if (underway.length === 0 && moves.length === 0) return null

  const totals = planTotals(moves)

  return (
    <section aria-labelledby="pick-up" className="mb-14">
      <p id="pick-up" className="eyebrow mb-3">
        Pick up where you left off
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {moves.length > 0 && (
          <Link to="/plan" className={card}>
            <p className="eyebrow">Your plan</p>
            <h2 className="mt-1 flex items-start justify-between gap-2 text-lg leading-snug font-bold">
              {moves.length} {moves.length === 1 ? 'move' : 'moves'}, about{' '}
              {formatEffort(totals.hours).toLowerCase()}
              <IconArrowRight className="mt-1 shrink-0 text-accent" />
            </h2>
            <p className="mt-1 text-sm text-muted">
              {moves
                .slice(0, 3)
                .map(({ tool, chosen }) => `${tool.name} to ${chosen.alternative.name}`)
                .join(' · ')}
              {moves.length > 3 ? ` · and ${moves.length - 3} more` : ''}
            </p>
          </Link>
        )}
        {underway.map(({ guide, status, next }) => (
          <Link key={guide.id} to={`/guides/${guide.id}`} className={card}>
            <p className="eyebrow">
              Checklist · {status.done} of {status.total} steps
            </p>
            <h2 className="mt-1 flex items-start justify-between gap-2 text-lg leading-snug font-bold">
              {guide.title}
              <IconArrowRight className="mt-1 shrink-0 text-accent" />
            </h2>
            {next && (
              <p className="mt-1 text-sm text-muted">
                Next: <span className="text-ink">{next.title}</span>
              </p>
            )}
            <div className="mt-auto pt-3">
              <ProgressBar
                done={status.done}
                total={status.total}
                label={`Progress through ${guide.title}`}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
