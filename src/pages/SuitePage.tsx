import { Link, useParams } from 'react-router-dom'
import { getGuide, getSuite, getTool } from '../catalog/index.ts'
import type { Suite } from '../catalog/schema.ts'
import { ContextBar } from '../components/ContextBar.tsx'
import { IconArrowRight } from '../components/icons.tsx'
import { Meter, OpennessBadge, Page, ScoreBadge, Section } from '../components/ui.tsx'
import { scoredPathsFrom } from '../lib/paths.ts'
import { formatEffort } from '../lib/scoring.ts'
import { usePrefs } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function SuitePage() {
  const { id } = useParams()
  const suite = id ? getSuite(id) : undefined
  return suite ? <SuiteView suite={suite} /> : <NotFound what="suite" />
}

function SuiteView({ suite }: { suite: Suite }) {
  useTitle(`Leaving ${suite.name}`)
  const { teamSize, hosting } = usePrefs()
  const guide = suite.guide ? getGuide(suite.guide) : undefined

  const parts = suite.components.flatMap((component) => {
    const tool = getTool(component.tool)
    if (!tool) return []
    const paths = scoredPathsFrom(tool, { teamSize, hosting })
    const [easiest, ...others] = paths
    return easiest ? [{ component, tool, easiest, others }] : []
  })

  const total = parts.reduce<[number, number]>(
    (sum, { easiest }) => [sum[0] + easiest.result.hours[0], sum[1] + easiest.result.hours[1]],
    [0, 0],
  )
  const hardest = parts.reduce(
    (worst, part) => (part.easiest.result.score > worst.easiest.result.score ? part : worst),
    parts[0]!,
  )

  return (
    <Page>
      <header className="max-w-3xl">
        <p className="eyebrow">Leaving a suite · {suite.vendor}</p>
        <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          {suite.name}
        </h1>
        <p className="mt-4 text-lg text-muted">{suite.summary}</p>
        {guide && (
          <Link
            to={`/guides/${guide.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-on-accent hover:bg-accent-strong"
          >
            Open the step-by-step checklist <IconArrowRight />
          </Link>
        )}
      </header>

      <Section
        eyebrow="The exit plan"
        title={`${parts.length} parts to replace`}
        intro="For each part, this shows the easiest path for your situation. Open a part to see the other options and the details."
      >
        <ContextBar />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="card p-4 sm:p-5">
            <p className="eyebrow">Taking the easiest path for every part</p>
            <p className="mt-1 text-2xl font-bold">{formatEffort(total)}</p>
            <p className="mt-1 text-sm text-muted">
              of hands-on work in total. The calendar time is longer: exports, DNS changes and people all take
              their time.
            </p>
          </div>
          <div className="card p-4 sm:p-5">
            <p className="eyebrow">The hardest part will be</p>
            <p className="mt-1 text-2xl font-bold">{hardest.component.label}</p>
            <p className="mt-1 text-sm text-muted">
              Even its easiest path scores {hardest.easiest.result.score} out of 100. Plan the schedule around
              it, and consider leaving it until last.
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-4">
          {parts.map(({ component, tool, easiest, others }) => (
            <li key={component.label} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="eyebrow flex items-center gap-1.5">
                    {component.label} <IconArrowRight className="text-sm text-accent" />
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-xl font-bold">
                      <Link to={`/alternatives/${easiest.alternative.id}`} className="hover:text-accent">
                        {easiest.alternative.name}
                      </Link>
                    </h3>
                    <OpennessBadge openness={easiest.alternative.openness} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{easiest.path.verdict}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                  <ScoreBadge score={easiest.result.score} band={easiest.result.band} />
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-ink">{formatEffort(easiest.result.hours)}</span> of
                    work
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-t border-line pt-4">
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <Meter label="Fit" scale="fit" level={easiest.path.fit} />
                  <Meter label="Export" scale="difficulty" level={tool.export.difficulty} />
                  <Meter label="Lock-in" scale="lockIn" level={tool.lockIn.level} />
                </div>
                <p className="text-sm">
                  {others.length > 0 && (
                    <span className="text-muted">
                      Also: {others.map(({ alternative }) => alternative.name).join(', ')} ·{' '}
                    </span>
                  )}
                  <Link
                    to={`/tools/${tool.id}`}
                    className="link inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    Compare all options <IconArrowRight />
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </Page>
  )
}
