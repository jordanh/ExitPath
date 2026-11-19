import { Link, useParams } from 'react-router-dom'
import { getGuide, getSuite, getTool } from '../catalog/index.ts'
import type { Suite } from '../catalog/schema.ts'
import { IconArrowRight } from '../components/icons.tsx'
import { SituationBar } from '../components/Situation.tsx'
import { OpennessBadge, Page, ScoreBadge, Section } from '../components/ui.tsx'
import { scoredPathsFrom } from '../lib/paths.ts'
import { planTotals } from '../lib/plan.ts'
import { formatEffort } from '../lib/scoring.ts'
import { setPlanChoices, usePlan, useSituation } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function SuitePage() {
  const { id } = useParams()
  const suite = id ? getSuite(id) : undefined
  return suite ? <SuiteView suite={suite} /> : <NotFound what="suite" />
}

function SuiteView({ suite }: { suite: Suite }) {
  useTitle(`Replacing ${suite.name}`)
  const situation = useSituation()
  const guide = suite.guide ? getGuide(suite.guide) : undefined

  const parts = suite.components.flatMap((component) => {
    const tool = getTool(component.tool)
    if (!tool) return []
    const [easiest, ...others] = scoredPathsFrom(tool, situation)
    return easiest ? [{ component, tool, easiest, others }] : []
  })

  // Counted the way a plan is: a destination shared by two parts is set up once.
  const total = planTotals(
    parts.map(({ tool, easiest, others }) => ({
      tool,
      chosen: easiest,
      auto: true,
      options: [easiest, ...others],
    })),
  ).hours
  const plan = usePlan()
  const missing = parts.filter(({ tool }) => !Object.hasOwn(plan, tool.id))
  const hardest = parts.reduce(
    (worst, part) => (part.easiest.result.score > worst.easiest.result.score ? part : worst),
    parts[0]!,
  )

  return (
    <Page narrow>
      <header>
        <h1 className="text-[2rem] leading-[1.1] font-black tracking-tight sm:text-[2.5rem]">
          Replacing {suite.name}
        </h1>
        <p className="mt-1 text-muted">{suite.vendor}</p>
        <p className="mt-4 text-xl">{suite.summary}</p>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          {guide && (
            <Link to={`/guides/${guide.id}`} className="link inline-flex items-center gap-1">
              Open the checklist <IconArrowRight className="text-accent" />
            </Link>
          )}
          {missing.length > 0 ? (
            <button
              type="button"
              onClick={() => setPlanChoices(Object.fromEntries(missing.map(({ tool }) => [tool.id, null])))}
              className="link cursor-pointer"
            >
              Add{' '}
              {missing.length === parts.length
                ? `all ${parts.length} parts`
                : `the remaining ${missing.length}`}{' '}
              to my plan
            </button>
          ) : (
            <Link to="/plan" className="link inline-flex items-center gap-1">
              Every part is in your plan <IconArrowRight className="text-accent" />
            </Link>
          )}
        </p>
      </header>

      <Section title={`${parts.length} parts to replace`}>
        <p>
          Taking the easiest path for each part comes to{' '}
          <span className="font-bold">{formatEffort(total).toLowerCase()}</span> of hands-on work. The hardest
          part is <span className="font-bold">{hardest.component.label}</span>, graded{' '}
          {hardest.easiest.result.band.label.toLowerCase()}: plan around it, and consider leaving it until
          last.
        </p>
        <div className="mt-5">
          <SituationBar />
        </div>

        <ol className="mt-5">
          {parts.map(({ component, tool, easiest, others }) => (
            <li key={component.label} className="border-t border-line py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
                  <span className="eyebrow">{component.label} to</span>
                  <h3 className="text-[1.45rem] leading-tight font-black">
                    <Link
                      to={`/alternatives/${easiest.alternative.id}`}
                      className="decoration-accent decoration-2 underline-offset-4 hover:underline"
                    >
                      {easiest.alternative.name}
                    </Link>
                  </h3>
                </div>
                <ScoreBadge band={easiest.result.band} size="sm" />
              </div>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
                <OpennessBadge openness={easiest.alternative.openness} />
                <span className="text-muted">
                  <span className="font-bold text-ink">{formatEffort(easiest.result.hours)}</span> of work
                </span>
              </p>
              <p className="mt-2 text-muted">{easiest.path.verdict}</p>
              <p className="mt-2">
                {others.length > 0 && (
                  <span className="text-muted">
                    Also {others.map(({ alternative }) => alternative.name).join(', ')}.{' '}
                  </span>
                )}
                <Link to={`/tools/${tool.id}`} className="link whitespace-nowrap">
                  {others.length > 0 ? 'Compare them' : 'Details'}
                </Link>
              </p>
            </li>
          ))}
        </ol>
      </Section>
    </Page>
  )
}
