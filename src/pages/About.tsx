import { Link } from 'react-router-dom'
import { alternatives, getAlternative, getTool, lastReviewed, tools, totalPaths } from '../catalog/index.ts'
import { SituationBar } from '../components/Situation.tsx'
import { ExternalLink, OpennessBadge, Page, ScoreBadge, Section } from '../components/ui.tsx'
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
import { openOptions } from '../lib/options-dialog.ts'
import { CONTRIBUTORS_URL, REPO_URL } from '../lib/site.ts'
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
  lockIn: {
    name: 'Lock-in',
    source:
      'The lock-in rating of the tool you are leaving: other people’s files and habits, integrations, shared channels.',
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
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-strong pb-2">
        <p className="font-bold">
          Worked example: {tool.name} to {alternative.name}
        </p>
        <ScoreBadge band={result.band} size="sm" />
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="label py-2 pr-4">
                Factor
              </th>
              <th scope="col" className="label px-4 py-2">
                Difficulty
              </th>
              <th scope="col" className="label px-4 py-2 text-right">
                As 0–1
              </th>
              <th scope="col" className="label px-4 py-2 text-right">
                Weight
              </th>
              <th scope="col" className="label py-2 pl-4 text-right">
                Adds
              </th>
            </tr>
          </thead>
          <tbody className="figures">
            {result.factors.map((factor) => (
              <tr key={factor.key} className="border-b border-line">
                <th scope="row" className="py-2 pr-4 font-sans font-medium">
                  {factor.label}
                  <span className="block text-xs font-normal text-muted">{factor.explanation}</span>
                </th>
                <td className="px-4 py-2">{factor.level} / 5</td>
                <td className="px-4 py-2 text-right">{normalised(factor.level).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{percent(factor.weight)}</td>
                <td className="py-2 pl-4 text-right">
                  {(factor.weight * normalised(factor.level)).toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="figures py-3 text-sm">
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
  useTitle('About')
  return (
    <Page narrow>
      <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight sm:text-[2.5rem]">
        About ExitPath
      </h1>
      <p className="mt-4 text-lg">
        ExitPath is a catalog of open-source alternatives to common proprietary tools. For each alternative it
        records how well it replaces the original, what data transfers, and how hard the move is. It also has
        step-by-step checklists for four common migrations.
      </p>
      <p className="mt-3 text-muted">
        The catalog covers {tools.length} proprietary tools, {alternatives.length} alternatives and{' '}
        {totalPaths} migration paths between them{lastReviewed ? `, last reviewed in ${lastReviewed}` : ''}.
      </p>

      <Section title="How migration difficulty is calculated">
        <div className="space-y-4">
          <p>
            Every path gets a score from 0 to 100. It is built from six ratings on a 1–5 scale, each recorded
            in the catalog where anyone can read it and dispute it. Five describe the migration and one
            describes you.
          </p>
          <dl className="divide-y divide-line border-y border-line">
            {(Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((key) => (
              <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-3">
                <dt className="font-semibold">{FACTOR_SOURCES[key].name}</dt>
                <dd className="figures row-span-2 self-center text-lg font-bold">{percent(WEIGHTS[key])}</dd>
                <dd className="text-sm text-muted">{FACTOR_SOURCES[key].source}</dd>
              </div>
            ))}
          </dl>
          <p>
            The score is {percent(1 - HARDEST_FACTOR_SHARE)} the weighted average of those factors and{' '}
            {percent(HARDEST_FACTOR_SHARE)} the single hardest of the first five. That second part matters: a
            migration is as hard as its hardest part. An easy import does not make up for a mail server you
            have to keep alive, and files that open anywhere do not make up for everyone you work with still
            sending the old format. Team size is left out of the “hardest” part so that head-count alone never
            dominates.
          </p>
          <p>
            The pages show the grade as a word (easy, moderate, demanding, hard, very hard) and keep the
            number for the breakdown, because it is a judgement and not a measurement. A low score only says
            the move is easy. Whether the alternative is any good is a separate question, answered by its fit
            rating, verdict and main drawback.
          </p>
          <SituationBar explain={false} />
          <WorkedExample />
          <ul className="flex flex-wrap gap-2">
            {BANDS.map((band, index) => (
              <li key={band.id} className="flex items-center gap-2">
                <ScoreBadge band={band} size="sm" />
                <span className="text-sm text-muted">
                  {index === 0 ? 0 : BANDS[index - 1]!.below}
                  {index === BANDS.length - 1 ? ' and above' : ` to ${band.below - 1}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="How effort is estimated">
        <div className="space-y-4">
          <p>
            Each path records how many hours one person needs to move their data and settle in. That figure is
            multiplied by team size, and server setup time is added once.
          </p>
          <dl className="divide-y divide-line border-y border-line">
            {(Object.keys(TEAM_SIZES) as TeamSize[]).map((key) => (
              <div key={key} className="flex items-baseline justify-between gap-4 py-3">
                <dt>
                  <span className="font-semibold">{TEAM_SIZES[key].label}</span>{' '}
                  <span className="text-sm text-muted">({TEAM_SIZES[key].hint})</span>
                </dt>
                <dd className="figures font-bold">× {TEAM_SIZES[key].multiplier}</dd>
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

      <Section
        title="If you would rather not run servers"
        intro="Most of these projects can be used in three ways."
      >
        <ul className="prose-list list-disc space-y-2 pl-5 marker:text-accent [&>li]:pl-1">
          <li>
            <span className="font-bold">Hosted for you.</span> Many projects are run as a service by their own
            developers or by independent providers. Every path says so and shows the grade both ways, and
            choosing “Managed” in the options grades everything for the hosted route where one exists.
          </li>
          <li>
            <span className="font-bold">On a self-hosting platform.</span> YunoHost, Cloudron and Coolify
            install apps on a server you rent or own and handle much of the updating. A middle route, with
            less to learn than doing it by hand.
          </li>
          <li>
            <span className="font-bold">By hand.</span> Usually with Docker Compose. This is what the “Running
            it” ratings and setup times assume, and they cover getting there, not the upkeep afterwards.
          </li>
        </ul>
      </Section>

      <Section
        title="What the 1–5 scales mean"
        intro="Each rating is a number from 1 to 5. The pages show the word for it."
      >
        <dl className="space-y-4">
          {(Object.keys(SCALES) as ScaleId[]).map((id) => (
            <div key={id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
              <dt className="text-[1.25rem] leading-tight font-extrabold">{SCALES[id].title}</dt>
              <dd>
                <p className="mt-1 text-sm text-muted">{SCALES[id].meaning}</p>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <li key={level}>
                      <span className="figures font-bold">{level}</span> {SCALES[id].labels[level - 1]}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        title="Open source, open core, source-available"
        intro="These three labels mean different things."
      >
        <dl className="divide-y divide-line border-y border-line">
          {(Object.keys(OPENNESS_LABELS) as Openness[]).map((id) => (
            <div key={id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              <dt className="w-36 shrink-0">
                <OpennessBadge openness={id} />
              </dt>
              <dd className="min-w-0 flex-1 basis-64 text-sm">{OPENNESS_LABELS[id].meaning}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Limits">
        <ul className="prose-list list-disc space-y-2 pl-5 marker:text-accent [&>li]:pl-1">
          <li>
            Ratings are opinions. Most were drafted by an AI assistant and have not been checked by someone
            who uses the tool; each entry says which, and shows the month it was last reviewed.
          </li>
          <li>
            Projects change their licences, pricing and features, sometimes abruptly. Check the project’s own
            documentation before you commit a team to it.
          </li>
          <li>
            The catalog is small on purpose. It lists the alternatives most people would consider and leaves
            out the long tail.
          </li>
          <li>
            Running your own services means running your own backups, updates and security. The time estimates
            cover the migration and the initial setup only.
          </li>
        </ul>
      </Section>

      <Section
        title="Contributing"
        intro="The whole catalog is plain JSON in the repository, validated against a schema. No build tooling knowledge is needed to edit it."
      >
        <p>
          Every tool, alternative and checklist is one file under <code>catalog/</code>. Change a file, run{' '}
          <code>npm run validate</code> and open a pull request. Entries need honest weaknesses and a source
          for anything surprising.
        </p>
        <p className="mt-3">
          If you use one of these tools, checking its entry is the most useful contribution: each page has an
          “Edit this entry” link.
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          <li>
            <ExternalLink href={REPO_URL}>Source code and catalog</ExternalLink>
          </li>
          <li>
            <ExternalLink href={CONTRIBUTORS_URL}>Everyone who has contributed</ExternalLink>
          </li>
        </ul>
      </Section>

      <Section
        title="Your data"
        intro="Your options, your plan and your checklist progress and notes are saved in this browser’s local storage. There is no server to send them to."
      >
        <p>
          You can export everything to a file, bring it back in on another device, or erase it.{' '}
          <button type="button" onClick={openOptions} className="link cursor-pointer">
            Open the options
          </button>
        </p>
        <p className="mt-3 text-muted">
          A link to a plan carries the plan itself in the address, so sharing one uploads nothing either.{' '}
          <Link to="/guides" className="link">
            Guided migrations
          </Link>
        </p>
      </Section>
    </Page>
  )
}
