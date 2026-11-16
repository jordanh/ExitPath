import { Link } from 'react-router-dom'
import type { ScoredPath } from '../lib/paths.ts'
import { formatEffort } from '../lib/scoring.ts'
import { removeFromPlan, setPlanChoice, usePlan } from '../lib/storage.ts'
import { Disclosure } from './Disclosure.tsx'
import { IconArrowRight, IconCheck, IconPlus } from './icons.tsx'
import { ExternalLink, MarkedList, Meter, OpennessBadge, ScoreBadge, Tag } from './ui.tsx'

const HOSTING_WORD = {
  none: 'Nothing to host',
  local: 'No server needed',
  managed: 'Managed for you',
  'self-hosted': undefined, // falls back to the difficulty word
} as const

/**
 * One way out of a tool: where to, how hard, and the verdict. What moves
 * and what does not is folded away until asked for.
 */
export function PathCard({ scored, easiest }: { scored: ScoredPath; easiest: boolean }) {
  const { tool, path, alternative, result } = scored
  const headingId = `path-${alternative.id}`
  const plan = usePlan()
  const planned = plan[tool.id] === alternative.id
  const toolInPlan = Object.hasOwn(plan, tool.id)

  return (
    <article className="border-t border-line py-8 first:border-t-0 first:pt-3" aria-labelledby={headingId}>
      {/* The grade sits beside the heading, not in it, so the entry is announced by name alone. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
        <h3 id={headingId} className="text-[1.75rem] leading-tight font-black">
          <Link
            to={`/alternatives/${alternative.id}`}
            className="decoration-accent decoration-2 underline-offset-4 hover:underline"
          >
            {alternative.name}
          </Link>
        </h3>
        <ScoreBadge score={result.score} band={result.band} />
      </div>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
        <OpennessBadge openness={alternative.openness} />
        <Tag title="Licence">{alternative.license}</Tag>
        <span className="text-muted">
          <span className="font-bold text-ink">{formatEffort(result.hours)}</span> of work
        </span>
        {easiest && <span className="eyebrow text-accent">Easiest for you</span>}
      </p>

      <p className="mt-3 max-w-2xl font-display text-[1.2rem] leading-snug italic">{path.verdict}</p>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1.5">
        <Meter inline label="Fit" scale="fit" level={path.fit} />
        <Meter inline label="Getting data in" scale="difficulty" level={path.import.difficulty} />
        <Meter
          inline
          label="Running it"
          scale="difficulty"
          level={result.hosting.level}
          word={HOSTING_WORD[result.hosting.mode]}
        />
        <Meter inline label="Maturity" scale="maturity" level={alternative.maturity.score} />
      </div>

      <div className="mt-3">
        <Disclosure summary="What moves, and what stays behind">
          <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
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
              <p className="max-w-2xl">{path.import.summary}</p>
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
        </Disclosure>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="button"
          aria-pressed={planned}
          onClick={() => (planned ? removeFromPlan(tool.id) : setPlanChoice(tool.id, alternative.id))}
          className="chip print:hidden"
        >
          {planned ? <IconCheck /> : <IconPlus />}
          {planned ? 'In your plan' : toolInPlan ? 'Use this path in my plan' : 'Add to my plan'}
        </button>
        <Link
          to={`/alternatives/${alternative.id}`}
          className="link inline-flex items-center gap-1 whitespace-nowrap"
        >
          About {alternative.name}
          <IconArrowRight className="text-accent" />
        </Link>
      </div>
      <p className="mt-3 text-muted">
        {result.hosting.fellBack
          ? `No managed ${alternative.name} hosting is listed, so this assumes you run it yourself.`
          : result.hosting.mode === 'managed'
            ? `Assumes a hosted ${alternative.name}.`
            : result.hosting.mode === 'self-hosted'
              ? `Includes ${formatEffort(result.hosting.setupHours).toLowerCase()} to set up and secure the server.`
              : result.hosting.mode === 'local'
                ? 'Runs on your own device; a server is only needed for syncing with others.'
                : 'Runs on your own devices; there is no server to set up.'}
      </p>
    </article>
  )
}
