import { Fragment, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ScoredPath } from '../lib/paths.ts'
import { OPENNESS_LABELS, SCALES } from '../lib/scales.ts'
import { formatEffort, scorePath, type HostingPreference } from '../lib/scoring.ts'
import { removeFromPlan, setPlanChoice, usePlan, useSituation } from '../lib/storage.ts'
import { IconCheck, IconPlus } from './icons.tsx'
import { Provenance, ProvenanceMark } from './Provenance.tsx'
import { ExternalLink, MarkedList, Rating, OpennessBadge, ScoreBadge } from './ui.tsx'

const HOSTING_WORD = {
  none: 'Nothing to host',
  local: 'No server needed',
  managed: 'Managed for you',
  'self-hosted': undefined, // falls back to the difficulty word
} as const

/** Who runs it, in a few words, for the table. The detail row says more. */
function hostingSummary({ alternative, result }: ScoredPath): string {
  const [first, ...others] = alternative.managedHosting
  const host = first ? `${first.label}${others.length > 0 ? ' or others' : ''}` : undefined
  switch (result.hosting.mode) {
    case 'none':
      return 'Nothing to host'
    case 'local':
      return host ? 'No server needed; hosted sync available' : 'No server needed'
    case 'managed':
      return `Hosted by ${host}`
    case 'self-hosted':
      return host ? `Self-host, or ${host}` : 'Self-host only'
  }
}

/**
 * Both ways of running it, each with its own grade. The table shows the grade
 * for the reader's choice; nobody should come away thinking a project has to
 * be self-hosted when its developers will host it, or the other way round.
 */
function HostingDetail({ scored }: { scored: ScoredPath }) {
  const { tool, path, alternative, result } = scored
  const situation = useSituation()
  const hosts = alternative.managedHosting
  const { mode, fellBack } = result.hosting

  if (mode === 'none') return <p>Runs on your own devices. There is no server to set up.</p>
  if (mode === 'local') {
    return (
      <p>
        Runs on your own device. A server is only needed to sync with other people
        {hosts.length > 0 && (
          <>
            , and <HostLinks hosts={hosts} /> can host that for you
          </>
        )}
        .
      </p>
    )
  }

  const gradeFor = (hosting: HostingPreference) => {
    const other = scorePath(tool, path, alternative, { ...situation, hosting })
    return `${other.band.label}, ${other.score} of 100`
  }
  const selfHosted = scorePath(tool, path, alternative, { ...situation, hosting: 'self' })
  return (
    <ul className="space-y-1">
      <li>
        <span className="font-bold">Running it yourself:</span> {gradeFor('self')}. Includes{' '}
        {formatEffort(selfHosted.hosting.setupHours).toLowerCase()} to set up and secure the server.
      </li>
      <li>
        {hosts.length > 0 ? (
          <>
            <span className="font-bold">
              Hosted by <HostLinks hosts={hosts} />:
            </span>{' '}
            {gradeFor('managed')}.
          </>
        ) : fellBack ? (
          `No managed ${alternative.name} hosting is listed, so the grade assumes you run it yourself.`
        ) : (
          'No hosted option is listed.'
        )}
      </li>
    </ul>
  )
}

function HostLinks({ hosts }: { hosts: ScoredPath['alternative']['managedHosting'] }) {
  return (
    <>
      {hosts.slice(0, 2).map((host, index) => (
        <Fragment key={host.url + host.label}>
          {index > 0 && ' or '}
          <ExternalLink href={host.url}>{host.label}</ExternalLink>
        </Fragment>
      ))}
    </>
  )
}

/** A label shown inside the cell on narrow screens, where the column headings are gone. */
const CellLabel = ({ children }: { children: ReactNode }) => (
  <span className="label mr-2 lg:hidden">{children}</span>
)

const cell = 'py-4 pr-5 align-top max-lg:block max-lg:py-0.5 max-lg:pr-0'

function PathRow({ scored, easiest }: { scored: ScoredPath; easiest: boolean }) {
  const { tool, path, alternative, result } = scored
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const plan = usePlan()
  const planned = plan[tool.id] === alternative.id
  const toolInPlan = Object.hasOwn(plan, tool.id)
  const [mainDrawback, ...otherDrawbacks] = alternative.weaknesses

  return (
    <>
      <tr
        className={`max-lg:block max-lg:pt-5 max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-4 ${open ? '' : 'border-b border-line max-lg:pb-5'}`}
      >
        <th scope="row" className={`${cell} font-normal lg:w-[13rem]`}>
          <Link
            to={`/alternatives/${alternative.id}`}
            className="text-[1.2rem] leading-tight font-extrabold text-accent hover:underline"
          >
            {alternative.name}
          </Link>
          <span className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <OpennessBadge openness={alternative.openness} />
            <span className="text-muted max-sm:hidden">{alternative.license}</span>
            <span className="text-sm sm:basis-full">
              <ProvenanceMark entry={alternative} />
            </span>
          </span>
        </th>
        <td className={`${cell} max-sm:text-right lg:w-[7.5rem]`}>
          <span className="max-sm:hidden">
            <CellLabel>Difficulty</CellLabel>
          </span>
          <ScoreBadge band={result.band} size="sm" />
          <span className="text-muted max-lg:ml-2 max-sm:ml-0 max-sm:block lg:block">
            {formatEffort(result.hours)}
          </span>
          {easiest && (
            <span className="text-sm font-bold text-accent max-lg:ml-2 max-sm:ml-0 max-sm:block lg:block">
              Easiest for you
            </span>
          )}
        </td>
        <td className={`${cell} max-sm:hidden lg:w-[6.5rem]`}>
          <CellLabel>Fit</CellLabel>
          {SCALES.fit.labels[path.fit - 1]}
        </td>
        <td className={`${cell} max-sm:hidden lg:w-[10rem]`}>
          <CellLabel>Hosting</CellLabel>
          {hostingSummary(scored)}
        </td>
        <td className={`${cell} max-lg:mt-1.5 max-sm:col-span-2`}>
          <span className="block">{path.verdict}</span>
          {mainDrawback && (
            <span className="mt-1.5 block text-muted max-sm:hidden">
              <span className="font-bold">Main drawback:</span> {mainDrawback}
            </span>
          )}
        </td>
        <td
          aria-label="Actions"
          className={`${cell} pr-0 max-lg:mt-2 max-sm:col-span-2 lg:w-[9.5rem] print:hidden`}
        >
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-col lg:items-end">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={detailId}
              onClick={() => setOpen(!open)}
              className="link cursor-pointer whitespace-nowrap"
            >
              {open ? 'Hide details' : 'Details'} <span className="sr-only">for {alternative.name}</span>
            </button>
            <button
              type="button"
              aria-pressed={planned}
              onClick={() => (planned ? removeFromPlan(tool.id) : setPlanChoice(tool.id, alternative.id))}
              className="chip text-sm"
            >
              {planned ? <IconCheck /> : <IconPlus />}
              {planned ? 'In your plan' : toolInPlan ? 'Use this in my plan' : 'Add to my plan'}
            </button>
          </span>
        </td>
      </tr>
      {open && (
        <tr id={detailId} className="border-b border-line max-lg:block">
          <td colSpan={6} className="pt-1 pb-7 max-lg:block lg:pl-[13rem]">
            <div className="grid max-w-3xl gap-x-10 gap-y-5 md:grid-cols-2">
              {/* On a phone the row itself is cut down to the name, grade and verdict; the rest starts here. */}
              <div className="sm:hidden">
                <p>
                  <span className="label mr-2">Fit</span>
                  {SCALES.fit.labels[path.fit - 1]}
                </p>
                <p>
                  <span className="label mr-2">Hosting</span>
                  {hostingSummary(scored)}
                </p>
                {mainDrawback && (
                  <p className="mt-1.5 text-muted">
                    <span className="font-bold">Main drawback:</span> {mainDrawback}
                  </p>
                )}
              </div>
              <div>
                <h4 className="label mb-2">Transfers</h4>
                <MarkedList kind="good" items={path.transfers} />
              </div>
              <div>
                <h4 className="label mb-2">Does not transfer</h4>
                <MarkedList kind="bad" items={path.lost} />
              </div>
              <div className="md:col-span-2">
                <h4 className="label mb-1.5">Import</h4>
                <p>{path.import.summary}</p>
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
              <div className="md:col-span-2">
                <h4 className="label mb-1.5">Running it</h4>
                <HostingDetail scored={scored} />
              </div>
              <div className="md:col-span-2">
                <h4 className="label mb-1.5">How the grade is worked out</h4>
                <p>
                  {result.band.label}: a score of {result.score} out of 100, from six ratings where 1 is
                  easiest and 5 hardest.
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-0.5 text-muted">
                  {result.factors.map((factor) => (
                    <li key={factor.key} title={factor.explanation}>
                      {factor.label} <span className="figures font-bold text-ink">{factor.level}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2.5 flex flex-wrap gap-x-8 gap-y-1.5">
                  <Rating label="Getting data in" scale="difficulty" level={path.import.difficulty} />
                  <Rating
                    label="Running it"
                    scale="difficulty"
                    level={result.hosting.level}
                    word={HOSTING_WORD[result.hosting.mode]}
                  />
                  <Rating label="Maturity" scale="maturity" level={alternative.maturity.score} />
                </div>
              </div>
              {otherDrawbacks.length > 0 && (
                <div className="md:col-span-2">
                  <h4 className="label mb-2">Other drawbacks of {alternative.name}</h4>
                  <MarkedList kind="neutral" items={otherDrawbacks} />
                </div>
              )}
              {alternative.licenseNote && (
                <div className="md:col-span-2">
                  <h4 className="label mb-1.5">
                    Licence: {alternative.license},{' '}
                    {OPENNESS_LABELS[alternative.openness].label.toLowerCase()}
                  </h4>
                  <p>{alternative.licenseNote}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <Provenance entry={alternative} folder="alternatives" />
                <p className="mt-2">
                  <Link to={`/alternatives/${alternative.id}`} className="link">
                    Everything about {alternative.name}
                  </Link>
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/**
 * The alternatives to one tool as a table: one row each, comparable at a
 * glance, with the detail a click away. Below the large breakpoint each row
 * becomes a block and the column headings move into the cells.
 */
export function PathsTable({ paths, easiestId }: { paths: ScoredPath[]; easiestId?: string }) {
  const heading = 'label py-2 pr-5 text-left font-normal'
  return (
    <table className="w-full border-collapse text-left max-lg:block">
      <caption className="sr-only">Alternatives compared</caption>
      <thead className="max-lg:hidden">
        <tr className="border-b border-line-strong">
          <th scope="col" className={heading}>
            Alternative
          </th>
          <th scope="col" className={heading}>
            Difficulty
          </th>
          <th scope="col" className={heading}>
            Fit
          </th>
          <th scope="col" className={heading}>
            Hosting
          </th>
          <th scope="col" className={heading}>
            In short
          </th>
          <th scope="col" className={`${heading} pr-0 print:hidden`}>
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="max-lg:block">
        {paths.map((scored) => (
          <PathRow
            key={scored.alternative.id}
            scored={scored}
            easiest={scored.alternative.id === easiestId && paths.length > 1}
          />
        ))}
      </tbody>
    </table>
  )
}
