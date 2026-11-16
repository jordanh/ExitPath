import { Link } from 'react-router-dom'
import type { ScoredPath } from '../lib/paths.ts'
import { formatEffort } from '../lib/scoring.ts'
import { removeFromPlan, setPlanChoice, usePlan } from '../lib/storage.ts'
import { IconArrowRight, IconCheck, IconPlus, RouteLine } from './icons.tsx'
import { ExternalLink, MarkedList, Meter, OpennessBadge, ScoreBadge, Tag } from './ui.tsx'

const HOSTING_WORD = {
  none: 'Nothing to host',
  local: 'No server needed',
  managed: 'Managed for you',
  'self-hosted': undefined, // falls back to the difficulty word
} as const

/** One way out of a tool: where to, how hard, what moves and what does not. */
export function PathCard({ scored, easiest }: { scored: ScoredPath; easiest: boolean }) {
  const { tool, path, alternative, result } = scored
  const headingId = `path-${alternative.id}`
  const plan = usePlan()
  const planned = plan[tool.id] === alternative.id
  const toolInPlan = Object.hasOwn(plan, tool.id)

  return (
    <article className="card overflow-hidden" aria-labelledby={headingId}>
      <div className="px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0 flex-1 basis-72">
            <p className="eyebrow flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {tool.name}
              {/* The route winds more the harder the grade. */}
              <RouteLine grade={result.band.level} className="text-accent" />
              {easiest && <span className="rounded-leaf bg-ink px-2.5 py-px text-bg">Easiest for you</span>}
            </p>
            {/* The badges sit beside the heading, not in it, so the card is announced by name alone. */}
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 id={headingId} className="text-[1.9rem] leading-tight font-black sm:text-[2.2rem]">
                <Link
                  to={`/alternatives/${alternative.id}`}
                  className="decoration-accent decoration-2 underline-offset-4 hover:underline hover:decoration-wavy"
                >
                  {alternative.name}
                </Link>
              </h3>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <OpennessBadge openness={alternative.openness} />
                <Tag title="Licence">{alternative.license}</Tag>
              </span>
            </div>
            <p className="mt-1 text-lg text-muted">{alternative.tagline}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            <ScoreBadge score={result.score} band={result.band} />
            <p className="text-muted">
              <span className="font-bold text-ink">{formatEffort(result.hours)}</span> of work
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-3xl font-display text-[1.25rem] leading-snug italic">{path.verdict}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-dashed border-line-strong px-5 py-4 sm:px-8 lg:grid-cols-4">
        <Meter label="Fit" scale="fit" level={path.fit} />
        <Meter label="Getting data in" scale="difficulty" level={path.import.difficulty} />
        <Meter
          label="Running it"
          scale="difficulty"
          level={result.hosting.level}
          word={HOSTING_WORD[result.hosting.mode]}
        />
        <Meter label="Maturity" scale="maturity" level={alternative.maturity.score} />
      </div>

      <div className="grid gap-x-10 gap-y-6 px-5 py-6 sm:px-8 md:grid-cols-2">
        <div>
          <h4 className="eyebrow mb-2">Comes with you</h4>
          <MarkedList kind="good" items={path.transfers} />
        </div>
        <div>
          <h4 className="eyebrow mb-2">Stays behind</h4>
          <MarkedList kind="bad" items={path.lost} />
        </div>
        <div className="md:col-span-2">
          <h4 className="eyebrow mb-1.5">How the import works</h4>
          <p className="max-w-3xl">{path.import.summary}</p>
          {path.import.links && (
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
              {path.import.links.map((link) => (
                <li key={link.url}>
                  <ExternalLink href={link.url}>{link.label}</ExternalLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-dashed border-line-strong px-5 py-4 sm:px-8">
        <p className="text-muted">
          {result.hosting.fellBack
            ? `No managed ${alternative.name} hosting is listed, so this assumes you run it yourself.`
            : result.hosting.mode === 'managed'
              ? `Assumes a hosted ${alternative.name}. Switch to “Self-host” above to see that route.`
              : result.hosting.mode === 'self-hosted'
                ? `Includes ${formatEffort(result.hosting.setupHours).toLowerCase()} to set up and secure the server.`
                : result.hosting.mode === 'local'
                  ? 'Runs on your own device; a server is only needed for syncing with others.'
                  : 'Runs on your own devices; there is no server to set up.'}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            type="button"
            aria-pressed={planned}
            onClick={() => (planned ? removeFromPlan(tool.id) : setPlanChoice(tool.id, alternative.id))}
            className="chip"
          >
            {planned ? <IconCheck /> : <IconPlus />}
            {planned ? 'In your plan' : toolInPlan ? 'Use this path in my plan' : 'Add to my plan'}
          </button>
          <Link
            to={`/alternatives/${alternative.id}`}
            className="link inline-flex items-center gap-1 whitespace-nowrap"
          >
            Full profile of {alternative.name}
            <IconArrowRight className="text-accent" />
          </Link>
        </div>
      </div>
    </article>
  )
}
