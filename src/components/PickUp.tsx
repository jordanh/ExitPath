import { guides } from '../catalog/index.ts'
import { guideStatus } from '../lib/guides.ts'
import { planTotals, resolvePlan } from '../lib/plan.ts'
import { formatEffort } from '../lib/scoring.ts'
import { useAllProgress, usePlan, usePlanDone, useSituation } from '../lib/storage.ts'
import { IndexRow } from './ui.tsx'

/**
 * Shown on the home page to someone who has been here before: their plan
 * and the checklists they are part-way through. Renders nothing for a
 * newcomer.
 */
export function PickUp() {
  const progress = useAllProgress()
  const plan = usePlan()
  const finished = new Set(usePlanDone())
  const situation = useSituation()

  const underway = guides.flatMap((guide) => {
    const saved = progress[guide.id]
    if (!saved) return []
    const status = guideStatus(guide, saved)
    if (status.done === 0 || status.done === status.total) return []
    const next = guide.phases.flatMap((phase) => phase.steps).find((step) => !status.doneIds.has(step.id))
    return [{ guide, status, next }]
  })
  const moves = resolvePlan(plan, situation)
  if (underway.length === 0 && moves.length === 0) return null

  const left = moves.filter(({ tool }) => !finished.has(tool.id))

  return (
    <section aria-labelledby="pick-up" className="mb-12">
      <h2 id="pick-up" className="label mb-1">
        Pick up where you left off
      </h2>
      {moves.length > 0 && (
        <IndexRow
          to="/plan"
          title={`Your plan: ${moves.length} ${moves.length === 1 ? 'move' : 'moves'}`}
          end={
            <span className="text-muted">
              {left.length === 0 ? 'all done' : `${formatEffort(planTotals(left).hours).toLowerCase()} to go`}
            </span>
          }
          detail={
            <>
              {moves
                .slice(0, 3)
                .map(({ tool, chosen }) => `${tool.name} to ${chosen.alternative.name}`)
                .join(' · ')}
              {moves.length > 3 ? ` · and ${moves.length - 3} more` : ''}
            </>
          }
          detailOnPhone={false}
        />
      )}
      {underway.map(({ guide, status, next }) => (
        <IndexRow
          key={guide.id}
          to={`/guides/${guide.id}`}
          title={guide.title}
          end={
            <span className="text-muted">
              {status.done} of {status.total} steps
            </span>
          }
          detail={next && <>Next: {next.title}</>}
        />
      ))}
    </section>
  )
}
