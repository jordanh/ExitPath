import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '../catalog/schema.ts'
import type { ScoredPath } from '../lib/paths.ts'
import { PLATFORM_LABELS } from '../lib/scales.ts'
import { formatEffort } from '../lib/scoring.ts'
import { Meter, OpennessBadge, ScoreBadge, SupportMark } from './ui.tsx'

interface Row {
  label: string
  hint?: string
  cell: (scored: ScoredPath) => ReactNode
}

interface Group {
  title: string
  rows: Row[]
}

function groupsFor(category: Category | undefined): Group[] {
  const groups: Group[] = [
    {
      title: 'The switch',
      rows: [
        {
          label: 'Migration difficulty',
          cell: ({ result }) => <ScoreBadge band={result.band} size="sm" />,
        },
        {
          label: 'Estimated effort',
          cell: ({ result }) => <span className="font-semibold">{formatEffort(result.hours)}</span>,
        },
        {
          label: 'Fit',
          hint: 'How completely it replaces the tool',
          cell: ({ path }) => <Meter scale="fit" level={path.fit} />,
        },
        {
          label: 'Getting data in',
          cell: ({ path }) => <Meter scale="difficulty" level={path.import.difficulty} />,
        },
      ],
    },
    {
      title: 'The project',
      rows: [
        {
          label: 'Licence',
          cell: ({ alternative }) => (
            <div className="flex flex-col items-start gap-1">
              <OpennessBadge openness={alternative.openness} />
              <span className="text-sm text-muted">{alternative.license}</span>
            </div>
          ),
        },
        {
          label: 'Maturity',
          cell: ({ alternative }) => <Meter scale="maturity" level={alternative.maturity.score} />,
        },
        {
          label: 'Who is behind it',
          cell: ({ alternative }) => <span className="text-sm">{alternative.backing}</span>,
        },
        {
          label: 'First released',
          cell: ({ alternative }) => <span className="text-sm figures">{alternative.since}</span>,
        },
        {
          label: 'Where you use it',
          cell: ({ alternative }) => (
            <span className="text-sm">
              {alternative.platforms.map((platform) => PLATFORM_LABELS[platform]).join(', ')}
            </span>
          ),
        },
      ],
    },
    {
      title: 'Running it',
      rows: [
        {
          label: 'Self-hosting',
          cell: ({ alternative }) =>
            alternative.selfHosting ? (
              <Meter scale="difficulty" level={alternative.selfHosting.difficulty} />
            ) : (
              <span className="text-sm text-muted">Nothing to host</span>
            ),
        },
        {
          label: 'Server memory',
          hint: 'A sensible minimum',
          cell: ({ alternative }) => (
            <span className="text-sm figures">{alternative.selfHosting?.requirements.ram ?? '—'}</span>
          ),
        },
        {
          label: 'Setup time',
          hint: 'To a production-worthy server',
          cell: ({ alternative }) => (
            <span className="text-sm">
              {alternative.selfHosting ? formatEffort(alternative.selfHosting.setupHours) : '—'}
            </span>
          ),
        },
        {
          label: 'Managed hosting',
          cell: ({ alternative }) =>
            alternative.managedHosting.length > 0 ? (
              <span className="text-sm">
                {alternative.managedHosting.map((host) => host.label).join(', ')}
              </span>
            ) : (
              <span className="text-sm text-muted">
                {alternative.selfHosting ? 'None listed' : 'Not needed'}
              </span>
            ),
        },
      ],
    },
  ]

  if (category) {
    groups.push({
      title: `${category.name}: features`,
      rows: category.features.map((feature) => ({
        label: feature.name,
        hint: feature.hint,
        cell: ({ alternative }) => {
          const support = alternative.features[feature.id]
          return support ? (
            <SupportMark support={support} note={alternative.featureNotes?.[feature.id]} />
          ) : (
            '—'
          )
        },
      })),
    })
  }

  return groups
}

/** Alternatives as columns, everything worth comparing as rows. Scrolls sideways on small screens. */
export function CompareTable({ paths, category }: { paths: ScoredPath[]; category: Category | undefined }) {
  const groups = groupsFor(category)
  return (
    <div
      // `relative` makes this the containing block for the visually-hidden labels inside,
      // so they clip with the table instead of widening the page.
      className="relative overflow-x-auto"
      role="region"
      aria-label="Side-by-side comparison"
      // Focusable so that keyboard users can scroll the table sideways.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      <table className="w-full min-w-max border-collapse text-left">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 w-36 min-w-36 bg-bg py-3 pr-4 align-bottom sm:w-48 sm:min-w-48"
            >
              <span className="sr-only">What is compared</span>
            </th>
            {paths.map(({ alternative }) => (
              <th key={alternative.id} scope="col" className="w-56 min-w-52 px-4 py-3 align-bottom">
                <Link
                  to={`/alternatives/${alternative.id}`}
                  className="font-display text-[1.25rem] leading-tight font-extrabold decoration-accent decoration-[1.5px] underline-offset-4 hover:underline"
                >
                  {alternative.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.title}>
            <tr>
              <th
                scope="colgroup"
                colSpan={paths.length + 1}
                className="eyebrow border-b border-line-strong pt-6 pb-1.5 text-left"
              >
                <span className="sticky left-0">{group.title}</span>
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-bg py-3 pr-4 align-top text-sm font-medium">
                  {row.label}
                  {row.hint && (
                    <span className="mt-0.5 block text-xs font-normal text-muted">{row.hint}</span>
                  )}
                </th>
                {paths.map((scored) => (
                  <td key={scored.alternative.id} className="px-4 py-3 align-top">
                    {row.cell(scored)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}
