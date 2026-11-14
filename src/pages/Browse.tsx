import { useSearchParams } from 'react-router-dom'
import { alternatives, categories, tools } from '../catalog/index.ts'
import type { Openness } from '../catalog/schema.ts'
import { AlternativeCard, ToolCard } from '../components/cards.tsx'
import { EmptyState, Page } from '../components/ui.tsx'
import { OPENNESS_LABELS } from '../lib/scales.ts'
import { tokenize } from '../lib/search.ts'
import { useTitle } from '../lib/use-title.ts'

type View = 'tools' | 'alternatives'

const chip =
  'cursor-pointer rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors border-line bg-surface text-muted hover:border-line-strong hover:text-ink aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent'

/** Every word of the filter must appear at the start of some word in the text. */
function matches(filter: string[], ...texts: (string | undefined)[]) {
  if (filter.length === 0) return true
  const words = tokenize(texts.filter(Boolean).join(' '))
  return filter.every((token) => words.some((word) => word.startsWith(token)))
}

export function Browse() {
  useTitle('Browse')
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'alternatives' ? 'alternatives' : 'tools'
  const category = params.get('category') ?? ''
  const openness = params.get('openness') ?? ''
  const query = params.get('q') ?? ''
  const filter = tokenize(query)

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  const shownTools = tools.filter(
    (tool) =>
      (!category || tool.category === category) &&
      matches(filter, tool.name, tool.vendor, ...(tool.alsoCovers ?? [])),
  )
  const shownAlternatives = alternatives.filter(
    (alternative) =>
      (!category || alternative.categories.includes(category)) &&
      (!openness || alternative.openness === openness) &&
      matches(filter, alternative.name, alternative.tagline),
  )
  const count = view === 'tools' ? shownTools.length : shownAlternatives.length

  return (
    <Page>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Browse the catalog</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Start from the proprietary tool you want to leave, or look through the open-source projects directly.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Two views of one list, not tabs with separate panels: plain toggle buttons. */}
        <div
          role="group"
          aria-label="What to browse"
          className="inline-flex rounded-lg border border-line bg-sunken p-0.5"
        >
          {(
            [
              ['tools', `What you use (${tools.length})`],
              ['alternatives', `Alternatives (${alternatives.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => update({ view: id === 'tools' ? '' : id, openness: '' })}
              className="cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-semibold text-muted hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
        <label className="min-w-48 flex-1 sm:max-w-xs">
          <span className="sr-only">Filter by name</span>
          <input
            type="search"
            value={query}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Filter by name…"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={chip}
          aria-pressed={category === ''}
          onClick={() => update({ category: '' })}
        >
          All categories
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={chip}
            aria-pressed={category === item.id}
            onClick={() => update({ category: category === item.id ? '' : item.id })}
          >
            {item.name}
          </button>
        ))}
      </div>

      {view === 'alternatives' && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter by licence type"
        >
          {(Object.keys(OPENNESS_LABELS) as Openness[]).map((id) => (
            <button
              key={id}
              type="button"
              className={chip}
              aria-pressed={openness === id}
              title={OPENNESS_LABELS[id].meaning}
              onClick={() => update({ openness: openness === id ? '' : id })}
            >
              {OPENNESS_LABELS[id].label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 mb-3 text-sm text-muted" role="status">
        Showing {count}{' '}
        {view === 'tools' ? (count === 1 ? 'tool' : 'tools') : count === 1 ? 'alternative' : 'alternatives'}
      </p>

      {count === 0 ? (
        <EmptyState title="Nothing matches those filters">
          Clear a filter, or add what is missing: the catalog is a folder of JSON files.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {view === 'tools'
            ? shownTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)
            : shownAlternatives.map((alternative) => (
                <AlternativeCard key={alternative.id} alternative={alternative} />
              ))}
        </div>
      )}
    </Page>
  )
}
