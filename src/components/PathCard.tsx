import { Link } from 'react-router-dom'
import type { ScoredPath } from '../lib/paths.ts'
import { formatEffort } from '../lib/scoring.ts'
import { removeFromPlan, setPlanChoice, usePlan } from '../lib/storage.ts'
import { IconArrowRight, IconCheck, IconPlus } from './icons.tsx'
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
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="min-w-0 flex-1 basis-72">
          <p className="eyebrow flex items-center gap-1.5">
            {tool.name}
            <IconArrowRight className="text-sm text-accent" />
            {easiest && (
              <span className="rounded-sm bg-accent px-1.5 py-px text-on-accent">Easiest for you</span>
            )}
          </p>
          {/* The badges sit beside the heading, not in it, so the card is announced by name alone. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 id={headingId} className="text-xl font-bold sm:text-2xl">
              <Link to={`/alternatives/${alternative.id}`} className="hover:text-accent">
                {alternative.name}
              </Link>
            </h3>
            <span className="flex flex-wrap items-center gap-1.5">
              <OpennessBadge openness={alternative.openness} />
              <Tag title="Licence">{alternative.license}</Tag>
            </span>
          </div>
          <p className="mt-1 text-muted">{alternative.tagline}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
          <ScoreBadge score={result.score} band={result.band} />
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{formatEffort(result.hours)}</span> of work
          </p>
        </div>
      </div>

      <p className="mx-4 mt-4 border-l-2 border-accent pl-3 text-[0.95rem] sm:mx-6">{path.verdict}</p>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line bg-bg/60 px-4 py-4 sm:px-6 lg:grid-cols-4">
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

      <div className="grid gap-x-8 gap-y-5 px-4 py-5 sm:px-6 md:grid-cols-2">
        <div>
          <h4 className="eyebrow mb-2">Comes with you</h4>
          <MarkedList kind="good" items={path.transfers} />
        </div>
        <div>
          <h4 className="eyebrow mb-2">Stays behind</h4>
          <MarkedList kind="bad" items={path.lost} />
        </div>
        <div className="md:col-span-2">
          <h4 className="eyebrow mb-2">How the import works</h4>
          <p className="text-sm">{path.import.summary}</p>
          {path.import.links && (
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {path.import.links.map((link) => (
                <li key={link.url}>
                  <ExternalLink href={link.url}>{link.label}</ExternalLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm sm:px-6">
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            aria-pressed={planned}
            onClick={() => (planned ? removeFromPlan(tool.id) : setPlanChoice(tool.id, alternative.id))}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5 font-semibold whitespace-nowrap hover:border-accent hover:text-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
          >
            {planned ? <IconCheck /> : <IconPlus />}
            {planned ? 'In your plan' : toolInPlan ? 'Use this path in my plan' : 'Add to my plan'}
          </button>
          <Link
            to={`/alternatives/${alternative.id}`}
            className="link inline-flex items-center gap-1 whitespace-nowrap"
          >
            Full profile of {alternative.name}
            <IconArrowRight />
          </Link>
        </div>
      </div>
    </article>
  )
}
