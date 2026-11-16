import { Link } from 'react-router-dom'
import { alternatives, getAlternative, getTool, lastReviewed, tools, totalPaths } from '../catalog/index.ts'
import { ContextBar } from '../components/ContextBar.tsx'
import { DataControls } from '../components/DataControls.tsx'
import { ExternalLink, Meter, OpennessBadge, Page, ScoreBadge, Section } from '../components/ui.tsx'
import { OPENNESS_LABELS, SCALES, type ScaleId } from '../lib/scales.ts'
import {
  BANDS,
  HARDEST_FACTOR_SHARE,
  MANAGED_SETUP_HOURS,
  TEAM_SIZES,
  WEIGHTS,
  formatEffort,
  scorePath,
  type TeamSize,
} from '../lib/scoring.ts'
import { REPO_URL } from '../lib/site.ts'
import { usePrefs } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import type { Openness } from '../catalog/schema.ts'

const percent = (value: number) => `${Math.round(value * 100)}%`

const FACTOR_SOURCES: Record<keyof typeof WEIGHTS, { name: string; source: string }> = {
  export: { name: 'Getting data out', source: 'The export difficulty of the tool you are leaving.' },
  import: { name: 'Getting data in', source: 'The import difficulty of this particular path.' },
  hosting: {
    name: 'Running it',
    source:
      'The alternative’s self-hosting difficulty, or 1 if a provider hosts it or nothing needs hosting.',
  },
  gap: {
    name: 'Feature gap',
    source: 'Six minus the fit rating: a like-for-like replacement leaves no gap.',
  },
  people: { name: 'People to move', source: 'Your answer to “Who is moving?”' },
}

function WorkedExample() {
  const { teamSize, hosting } = usePrefs()
  const tool = getTool('slack')
  const path = tool?.paths.find((candidate) => candidate.to === 'mattermost')
  const alternative = getAlternative('mattermost')
  if (!tool || !path || !alternative) return null

  const result = scorePath(tool, path, alternative, { teamSize, hosting })
  const normalised = (level: number) => (level - 1) / 4
  const average = result.factors.reduce((sum, factor) => sum + factor.weight * normalised(factor.level), 0)
  const hardest = Math.max(
    ...result.factors.filter((factor) => factor.key !== 'people').map((factor) => normalised(factor.level)),
  )

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sunken px-5 py-3.5 sm:px-7">
        <p className="font-semibold">
          Worked example: {tool.name} to {alternative.name}
        </p>
        <ScoreBadge score={result.score} band={result.band} size="sm" />
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="eyebrow px-4 py-2 sm:px-5">
                Factor
              </th>
              <th scope="col" className="eyebrow px-4 py-2">
                Rating
              </th>
              <th scope="col" className="eyebrow px-4 py-2 text-right">
                As 0–1
              </th>
              <th scope="col" className="eyebrow px-4 py-2 text-right">
                Weight
              </th>
              <th scope="col" className="eyebrow px-4 py-2 text-right sm:px-5">
                Adds
              </th>
            </tr>
          </thead>
          <tbody className="figures ">
            {result.factors.map((factor) => (
              <tr key={factor.key} className="border-b border-line">
                <th scope="row" className="px-4 py-2 font-sans font-medium sm:px-5">
                  {factor.label}
                  <span className="block text-xs font-normal text-muted">{factor.explanation}</span>
                </th>
                <td className="px-4 py-2">{factor.level} / 5</td>
                <td className="px-4 py-2 text-right">{normalised(factor.level).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{percent(factor.weight)}</td>
                <td className="px-4 py-2 text-right sm:px-5">
                  {(factor.weight * normalised(factor.level)).toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 figures text-sm sm:px-5">
        100 × ({percent(1 - HARDEST_FACTOR_SHARE)} × {average.toFixed(3)} + {percent(HARDEST_FACTOR_SHARE)} ×{' '}
        {hardest.toFixed(2)}) = <strong>{result.score}</strong>
        <span className="font-sans text-muted">
          {' '}
          · about {formatEffort(result.hours).toLowerCase()} of work
        </span>
      </p>
    </div>
  )
}

export function About() {
  useTitle('How it works')
  return (
    <Page narrow>
      <p className="eyebrow">How it works</p>
      <h1 className="mt-1 text-[2.4rem] leading-[1.05] font-black tracking-tight sm:text-[3.4rem]">
        A map of the exits, with the distances marked honestly
      </h1>
      <p className="mt-4 text-xl text-muted">
        ExitPath is not another software suite. It is a guide to the open-source projects that already exist:
        which of them can really replace the tool you depend on, what the move costs, and the order in which
        to do it.
      </p>
      <p className="mt-3 text-muted">
        The catalog currently covers {tools.length} proprietary tools, {alternatives.length} alternatives and{' '}
        {totalPaths} migration paths between them{lastReviewed ? `, last reviewed in ${lastReviewed}` : ''}.
      </p>

      <Section eyebrow="The score" title="How migration difficulty is calculated">
        <div className="space-y-4">
          <p>
            Every path gets a score from 0 to 100. It is built from five ratings on a 1–5 scale, each written
            down by a person in the catalog. Four describe the migration itself and one describes you.
          </p>
          <dl className="card divide-y divide-line">
            {(Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((key) => (
              <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-5 py-3.5 sm:px-7">
                <dt className="font-semibold">{FACTOR_SOURCES[key].name}</dt>
                <dd className="row-span-2 self-center figures text-lg font-bold ">{percent(WEIGHTS[key])}</dd>
                <dd className="text-sm text-muted">{FACTOR_SOURCES[key].source}</dd>
              </div>
            ))}
          </dl>
          <p>
            The score is {percent(1 - HARDEST_FACTOR_SHARE)} the weighted average of those factors and{' '}
            {percent(HARDEST_FACTOR_SHARE)} the single hardest of the first four. That second part matters: a
            migration is as hard as its hardest step, and an easy import does not make up for a mail server
            you have to keep alive. Team size is left out of the “hardest” part so that head-count alone never
            dominates.
          </p>
          <ContextBar />
          <WorkedExample />
          <ul className="flex flex-wrap gap-2">
            {BANDS.map((band, index) => (
              <li key={band.id} className="flex items-center gap-2">
                <ScoreBadge score={index === 0 ? 0 : BANDS[index - 1]!.below} band={band} size="sm" />
                <span className="text-sm text-muted">
                  {index === BANDS.length - 1 ? 'and above' : `to ${band.below - 1}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section eyebrow="The estimate" title="How effort is estimated">
        <div className="space-y-4">
          <p>
            Each path records how many hours one person needs to move their data and settle in. That figure is
            multiplied by team size, and server setup time is added once.
          </p>
          <dl className="card divide-y divide-line">
            {(Object.keys(TEAM_SIZES) as TeamSize[]).map((key) => (
              <div key={key} className="flex items-baseline justify-between gap-4 px-5 py-3.5 sm:px-7">
                <dt>
                  <span className="font-semibold">{TEAM_SIZES[key].label}</span>{' '}
                  <span className="text-sm text-muted">({TEAM_SIZES[key].hint})</span>
                </dt>
                <dd className="figures font-bold ">× {TEAM_SIZES[key].multiplier}</dd>
              </div>
            ))}
          </dl>
          <p className="text-muted">
            The multiplier grows more slowly than the head-count because one person does most of the bulk
            work. Self-hosting adds the alternative’s own setup time; a managed service adds{' '}
            {formatEffort(MANAGED_SETUP_HOURS).toLowerCase()}. Estimates are hands-on hours, shown as days of
            six focused hours once they get large. They are a planning aid, not a quote.
          </p>
        </div>
      </Section>

      <Section eyebrow="The ratings" title="What the 1–5 scales mean">
        <dl className="space-y-4">
          {(Object.keys(SCALES) as ScaleId[]).map((id) => (
            <div key={id} className="card p-5 sm:p-7">
              <dt className="text-[1.4rem] leading-tight font-extrabold">{SCALES[id].title}</dt>
              <dd>
                <p className="mt-1 text-sm text-muted">{SCALES[id].meaning}</p>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <li key={level}>
                      <Meter scale={id} level={level} />
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        eyebrow="The labels"
        title="Open source, open core, source-available"
        intro="These are not the same thing, and the difference tends to matter a few years in."
      >
        <dl className="card divide-y divide-line">
          {(Object.keys(OPENNESS_LABELS) as Openness[]).map((id) => (
            <div key={id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3.5 sm:px-7">
              <dt className="w-36 shrink-0">
                <OpennessBadge openness={id} />
              </dt>
              <dd className="min-w-0 flex-1 basis-64 text-sm">{OPENNESS_LABELS[id].meaning}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section eyebrow="The limits" title="What to keep in mind">
        <ul className="prose-list list-disc space-y-2 pl-5 marker:text-accent [&>li]:pl-1">
          <li>
            Ratings are informed opinions, not measurements. They are written by people, reviewed in public
            and dated. Each entry shows the month it was last checked.
          </li>
          <li>
            Projects change their licences, pricing and features, sometimes abruptly. Check the project’s own
            documentation before you commit a team to it.
          </li>
          <li>
            The catalog is deliberately small. An alternative is listed when it is a realistic replacement
            that someone has actually run, not because it exists.
          </li>
          <li>
            Running your own services means running your own backups, updates and security. The time estimates
            cover getting there, not staying there.
          </li>
        </ul>
      </Section>

      <Section
        eyebrow="Contributing"
        title="Fix a rating, add an alternative"
        intro="The whole catalog is plain JSON in the repository, validated against a schema. No build tooling knowledge is needed to edit it."
      >
        <p>
          Every tool, alternative and checklist is one file under <code>catalog/</code>. Change a file, run{' '}
          <code>npm run validate</code> and open a pull request. Entries need honest weaknesses and a source
          for anything surprising.
        </p>
        <p className="mt-3">
          <ExternalLink href={REPO_URL}>Source code and catalog</ExternalLink>
        </p>
      </Section>

      <Section
        eyebrow="Your data"
        title="Stored here, and only here"
        intro="Three things are saved in this browser’s local storage: your answers to “Who is moving?” and “Who runs the servers?”, your plan, and your checklist progress and notes. There is no server to send them to."
      >
        <DataControls />
        <p className="mt-4 text-sm text-muted">
          Looking for the checklists?{' '}
          <Link to="/guides" className="link">
            Guided migrations
          </Link>
        </p>
      </Section>
    </Page>
  )
}
