import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCategory, getTool, guidesForTool, suitesForTool } from '../catalog/index.ts'
import type { Tool } from '../catalog/schema.ts'
import { CompareTable } from '../components/CompareTable.tsx'
import { ContextBar } from '../components/ContextBar.tsx'
import { EntryFooter } from '../components/EntryFooter.tsx'
import { IconArrowRight } from '../components/icons.tsx'
import { PathCard } from '../components/PathCard.tsx'
import { ExternalLink, MarkedList, Meter, Page, Section, Tag } from '../components/ui.tsx'
import { scoredPathsFrom } from '../lib/paths.ts'
import { usePrefs } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function ToolPage() {
  const { id } = useParams()
  const tool = id ? getTool(id) : undefined
  // Keyed so that per-page state (hidden comparison columns) resets between tools.
  return tool ? <ToolView key={tool.id} tool={tool} /> : <NotFound what="tool" />
}

function ToolView({ tool }: { tool: Tool }) {
  useTitle(`Leaving ${tool.name}`)
  const { teamSize, hosting } = usePrefs()
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())

  const category = getCategory(tool.category)
  const paths = scoredPathsFrom(tool, { teamSize, hosting })
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
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
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

      <header className="max-w-3xl">
        <p className="eyebrow">Leaving · {tool.vendor}</p>
        <h1 className="mt-1 text-[2.6rem] leading-[1.02] font-black tracking-tight sm:text-[4rem]">
          {tool.name}
        </h1>
        {tool.alsoCovers && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-muted">
            Also covers
            {tool.alsoCovers.map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
          </p>
        )}
        <p className="mt-4 text-xl text-muted">{tool.summary}</p>
      </header>

      {(guides.length > 0 || suites.length > 0) && (
        <ul className="mt-5 flex flex-wrap gap-2 text-sm">
          {guides.map((guide) => (
            <li key={guide.id}>
              <Link to={`/guides/${guide.id}`} className="chip">
                Checklist: {guide.title} <IconArrowRight />
              </Link>
            </li>
          ))}
          {suites.map((suite) => (
            <li key={suite.id}>
              <Link to={`/suites/${suite.id}`} className="chip">
                Part of {suite.name} <IconArrowRight />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 grid gap-5 lg:grid-cols-5">
        <section className="rounded-pebble bg-sunken p-5 sm:p-7 lg:col-span-2" aria-labelledby="lock-in">
          <h2 id="lock-in" className="text-[1.4rem] leading-tight font-extrabold">
            What keeps you here
          </h2>
          <div className="mt-2">
            <Meter label="Lock-in" scale="lockIn" level={tool.lockIn.level} />
          </div>
          <div className="mt-4">
            <MarkedList kind="neutral" items={tool.lockIn.factors} />
          </div>
        </section>

        <section className="card p-5 sm:p-7 lg:col-span-3" aria-labelledby="export">
          <h2 id="export" className="text-[1.4rem] leading-tight font-extrabold">
            Getting your data out
          </h2>
          <div className="mt-2">
            <Meter label="Export difficulty" scale="difficulty" level={tool.export.difficulty} />
          </div>
          <p className="mt-3 text-sm">{tool.export.summary}</p>
          <dl className="mt-4 space-y-3 text-sm">
            {tool.export.methods.map((method) => (
              <div key={method.name}>
                <dt className="font-semibold">
                  {method.url ? <ExternalLink href={method.url}>{method.name}</ExternalLink> : method.name}
                </dt>
                <dd className="mt-0.5 text-muted">{method.detail}</dd>
              </div>
            ))}
          </dl>
          {tool.export.caveats.length > 0 && (
            <div className="mt-5 border-t border-dashed border-line-strong pt-4">
              <h3 className="eyebrow mb-2">Watch out for</h3>
              <MarkedList kind="neutral" items={tool.export.caveats} />
            </div>
          )}
        </section>
      </div>

      <Section
        eyebrow="Paths out"
        title={`${paths.length} ${paths.length === 1 ? 'way' : 'ways'} forward, easiest first`}
        intro="Difficulty runs from 0 to 100 and combines export, import, hosting, the feature gap and how many people have to move."
      >
        <ContextBar />
        <div className="mt-5 space-y-6">
          {paths.map((scored, index) => (
            <PathCard key={scored.alternative.id} scored={scored} easiest={index === 0 && paths.length > 1} />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          <Link to="/about" className="link">
            How these scores are calculated
          </Link>
        </p>
      </Section>

      {paths.length > 1 && (
        <Section
          eyebrow="Side by side"
          title="Compare the alternatives"
          aside={
            paths.length > 2 && (
              <div
                className="flex flex-wrap gap-2"
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
            )
          }
        >
          <CompareTable paths={compared} category={category} />
        </Section>
      )}

      <EntryFooter folder="tools" id={tool.id} name={tool.name} reviewed={tool.reviewed} />
    </Page>
  )
}
