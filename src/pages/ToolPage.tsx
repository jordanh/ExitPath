import { useId, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCategory, getTool, guidesForTool, suitesForTool } from '../catalog/index.ts'
import type { Tool } from '../catalog/schema.ts'
import { CompareTable } from '../components/CompareTable.tsx'
import { Disclosure } from '../components/Disclosure.tsx'
import { EntryFooter } from '../components/EntryFooter.tsx'
import { IconArrowRight } from '../components/icons.tsx'
import { PathCard } from '../components/PathCard.tsx'
import { SituationLine } from '../components/Situation.tsx'
import { ExternalLink, MarkedList, Meter, Page, Section } from '../components/ui.tsx'
import { PATH_ORDERS, allPathsFrom, orderPaths, scoredPathsFrom, type PathOrder } from '../lib/paths.ts'
import { SCALES } from '../lib/scales.ts'
import { useSituation } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function ToolPage() {
  const { id } = useParams()
  const tool = id ? getTool(id) : undefined
  // Keyed so that per-page state (hidden comparison columns) resets between tools.
  return tool ? <ToolView key={tool.id} tool={tool} /> : <NotFound what="tool" />
}

const isOrder = (value: string | null): value is PathOrder =>
  value !== null && Object.hasOwn(PATH_ORDERS, value)

function ToolView({ tool }: { tool: Tool }) {
  useTitle(`Leaving ${tool.name}`)
  const situation = useSituation()
  const [params, setParams] = useSearchParams()
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())
  const sortId = useId()

  const category = getCategory(tool.category)
  const sort = params.get('sort')
  const order: PathOrder = isOrder(sort) ? sort : 'easiest'
  const suitable = scoredPathsFrom(tool, situation)
  const filteredOut = allPathsFrom(tool, situation).length - suitable.length
  const easiestId = suitable[0]?.alternative.id
  const paths = orderPaths(suitable, order)
  const compared = paths.filter(({ alternative }) => !hidden.has(alternative.id))
  const guides = guidesForTool(tool.id)
  const suites = suitesForTool(tool.id)

  function toggle(alternativeId: string) {
    const next = new Set(hidden)
    if (next.has(alternativeId)) next.delete(alternativeId)
    // Always keep at least two columns: a comparison of one is not a comparison.
    else if (paths.length - next.size > 2) next.add(alternativeId)
    setHidden(next)
  }

  return (
    <Page>
      <nav aria-label="Breadcrumb" className="mb-3 text-muted">
        <Link to="/browse" className="hover:text-ink">
          Browse
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link to={`/browse?category=${tool.category}`} className="hover:text-ink">
          {category?.name}
        </Link>
      </nav>

      <header className="max-w-2xl">
        <h1 className="text-[2.3rem] leading-[1.05] font-black tracking-tight sm:text-[3rem]">
          <span className="font-extrabold text-muted italic">Leaving </span>
          {tool.name}
        </h1>
        <p className="mt-1 text-muted">
          {tool.vendor}
          {tool.alsoCovers && <> · also covers {tool.alsoCovers.join(', ')}</>}
        </p>
        <p className="mt-4 text-xl">{tool.summary}</p>
      </header>

      {(guides.length > 0 || suites.length > 0) && (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          {guides.map((guide) => (
            <li key={guide.id}>
              <Link to={`/guides/${guide.id}`} className="link inline-flex items-center gap-1">
                Checklist: {guide.title} <IconArrowRight className="text-accent" />
              </Link>
            </li>
          ))}
          {suites.map((suite) => (
            <li key={suite.id}>
              <Link to={`/suites/${suite.id}`} className="link inline-flex items-center gap-1">
                Part of {suite.name} <IconArrowRight className="text-accent" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Section
        title={`${paths.length} ${paths.length === 1 ? 'way' : 'ways'} out`}
        aside={
          paths.length > 1 && (
            <div className="flex items-baseline gap-2 print:hidden">
              <label htmlFor={sortId} className="eyebrow">
                Order
              </label>
              <select
                id={sortId}
                value={order}
                onChange={(event) => {
                  const next = new URLSearchParams(params)
                  if (event.target.value === 'easiest') next.delete('sort')
                  else next.set('sort', event.target.value)
                  setParams(next, { replace: true })
                }}
                className="field h-9 cursor-pointer px-2.5 font-medium"
              >
                {(Object.keys(PATH_ORDERS) as PathOrder[]).map((id) => (
                  <option key={id} value={id}>
                    {PATH_ORDERS[id]} first
                  </option>
                ))}
              </select>
            </div>
          )
        }
      >
        <SituationLine hidden={filteredOut} />
        <div className="mt-2">
          {paths.map((scored) => (
            <PathCard
              key={scored.alternative.id}
              scored={scored}
              easiest={scored.alternative.id === easiestId && paths.length > 1}
            />
          ))}
        </div>
      </Section>

      <Section title="Before you go">
        <Disclosure
          summary="What keeps you here"
          hint={`Lock-in: ${SCALES.lockIn.labels[tool.lockIn.level - 1]}`}
        >
          <Meter label="Lock-in" scale="lockIn" level={tool.lockIn.level} />
          <div className="mt-3 max-w-2xl">
            <MarkedList kind="neutral" items={tool.lockIn.factors} />
          </div>
        </Disclosure>

        <Disclosure
          summary="Getting your data out"
          hint={`Export: ${SCALES.difficulty.labels[tool.export.difficulty - 1]}`}
        >
          <div className="max-w-2xl">
            <Meter label="Export difficulty" scale="difficulty" level={tool.export.difficulty} />
            <p className="mt-3">{tool.export.summary}</p>
            <dl className="mt-4 space-y-3">
              {tool.export.methods.map((method) => (
                <div key={method.name}>
                  <dt className="font-bold">
                    {method.url ? <ExternalLink href={method.url}>{method.name}</ExternalLink> : method.name}
                  </dt>
                  <dd className="mt-0.5 text-muted">{method.detail}</dd>
                </div>
              ))}
            </dl>
            {tool.export.caveats.length > 0 && (
              <>
                <h3 className="eyebrow mt-5 mb-2">Watch out for</h3>
                <MarkedList kind="neutral" items={tool.export.caveats} />
              </>
            )}
          </div>
        </Disclosure>

        {paths.length > 1 && (
          <Disclosure
            summary="Compare side by side"
            hint={`${compared.length} alternatives, feature by feature`}
          >
            {paths.length > 2 && (
              <div
                className="mb-3 flex flex-wrap gap-2 print:hidden"
                role="group"
                aria-label="Choose which alternatives to compare"
              >
                {paths.map(({ alternative }) => (
                  <button
                    key={alternative.id}
                    type="button"
                    aria-pressed={!hidden.has(alternative.id)}
                    onClick={() => toggle(alternative.id)}
                    className="chip"
                  >
                    {alternative.name}
                  </button>
                ))}
              </div>
            )}
            <CompareTable paths={compared} category={category} />
          </Disclosure>
        )}
      </Section>

      <EntryFooter folder="tools" id={tool.id} name={tool.name} reviewed={tool.reviewed} />
    </Page>
  )
}
