import { useId } from 'react'
import { Link } from 'react-router-dom'
import { categories, guidesForTool, suites, tools } from '../catalog/index.ts'
import { ConfirmButton } from '../components/ConfirmButton.tsx'
import { ContextBar } from '../components/ContextBar.tsx'
import { IconArrowRight, IconCheck, IconX, RouteLine } from '../components/icons.tsx'
import { EmptyState, OpennessBadge, Page, ScoreBadge, Section } from '../components/ui.tsx'
import { planTotals, resolvePlan, type PlanItem } from '../lib/plan.ts'
import { formatEffort } from '../lib/scoring.ts'
import {
  clearPlan,
  removeFromPlan,
  setPlanChoice,
  setPlanChoices,
  usePlan,
  usePrefs,
  type Plan,
} from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'

const chip = 'chip'

function ToolPicker({ plan }: { plan: Plan }) {
  return (
    <div className="card divide-y divide-line">
      {categories.map((category) => {
        const inCategory = tools.filter((tool) => tool.category === category.id)
        if (inCategory.length === 0) return null
        return (
          <div
            key={category.id}
            role="group"
            aria-label={category.name}
            className="grid gap-x-6 gap-y-2 px-5 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:px-7"
          >
            <p className="eyebrow pt-1.5">{category.name}</p>
            <div className="flex flex-wrap gap-2">
              {inCategory.map((tool) => {
                const selected = Object.hasOwn(plan, tool.id)
                return (
                  <button
                    key={tool.id}
                    type="button"
                    className={chip}
                    aria-pressed={selected}
                    onClick={() => (selected ? removeFromPlan(tool.id) : setPlanChoice(tool.id, null))}
                  >
                    {selected && <IconCheck />}
                    {tool.name}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Move({ item, position }: { item: PlanItem; position: number }) {
  const { tool, chosen, auto, options } = item
  const selectId = useId()
  const guide = guidesForTool(tool.id)[0]
  const easiest = options[0]!

  return (
    <li className="relative pb-12 pl-10 last:pb-2 sm:pl-12">
      {/* The move's number sits on the trail line as a waypoint. */}
      <span
        aria-hidden="true"
        className="figures absolute top-0 left-[-1.5px] flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-ink bg-bg font-display text-lg leading-none font-black"
      >
        {position}
      </span>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <p className="eyebrow flex flex-wrap items-center gap-x-2.5">
            {tool.name}
            <RouteLine grade={chosen.result.band.level} className="text-accent" />
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-[1.8rem] leading-tight font-black">
              <Link
                to={`/alternatives/${chosen.alternative.id}`}
                className="decoration-accent decoration-2 underline-offset-4 hover:underline hover:decoration-wavy"
              >
                {chosen.alternative.name}
              </Link>
            </h3>
            <OpennessBadge openness={chosen.alternative.openness} />
          </div>
          <p className="mt-1 max-w-2xl text-muted">{chosen.path.verdict}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <ScoreBadge score={chosen.result.score} band={chosen.result.band} />
          <p className="text-muted">
            <span className="font-bold text-ink">{formatEffort(chosen.result.hours)}</span> of work
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="w-full min-w-0 sm:w-auto">
          <label htmlFor={selectId} className="eyebrow mb-1 block">
            Where to
          </label>
          <select
            id={selectId}
            value={auto ? '' : chosen.alternative.id}
            onChange={(event) => setPlanChoice(tool.id, event.target.value || null)}
            className="field h-10 w-full max-w-full cursor-pointer px-3 font-medium text-ellipsis sm:w-auto"
          >
            <option value="">Easiest for my situation ({easiest.alternative.name})</option>
            {options.map(({ alternative, result }) => (
              <option key={alternative.id} value={alternative.id}>
                {alternative.name} · {result.score} {result.band.label.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {guide && (
            <Link
              to={`/guides/${guide.id}`}
              className="link inline-flex items-center gap-1 whitespace-nowrap"
            >
              Checklist <IconArrowRight className="text-accent" />
            </Link>
          )}
          <Link to={`/tools/${tool.id}`} className="link inline-flex items-center gap-1 whitespace-nowrap">
            Details and comparison <IconArrowRight className="text-accent" />
          </Link>
          <button
            type="button"
            onClick={() => removeFromPlan(tool.id)}
            aria-label={`Remove ${tool.name} from the plan`}
            className="inline-flex cursor-pointer items-center gap-1 font-medium whitespace-nowrap text-muted hover:text-danger"
          >
            <IconX /> Remove
          </button>
        </p>
      </div>
    </li>
  )
}

export function PlanPage() {
  useTitle('Your plan')
  const { teamSize, hosting } = usePrefs()
  const plan = usePlan()
  const items = resolvePlan(plan, { teamSize, hosting })
  const totals = planTotals(items)

  function addSuite(toolIds: string[]) {
    // Keep any path already chosen for a tool; only add the missing ones.
    setPlanChoices(
      Object.fromEntries(toolIds.filter((id) => !Object.hasOwn(plan, id)).map((id) => [id, null])),
    )
  }

  return (
    <Page>
      <header className="max-w-3xl">
        <p className="eyebrow">Your plan</p>
        <h1 className="mt-1 text-[2.6rem] leading-[1.02] font-black tracking-tight sm:text-[4rem]">
          Everything you want to leave, in one plan
        </h1>
        <p className="mt-4 text-xl text-muted">
          Tick what you use today. You get a path for each one, the total work involved, and an order to do it
          in. It is saved on this device and nowhere else.
        </p>
      </header>

      <Section
        eyebrow="Step one"
        title="What do you use?"
        aside={
          <div className="flex flex-wrap gap-2">
            {suites.map((suite) => (
              <button
                key={suite.id}
                type="button"
                className={chip}
                onClick={() => addSuite(suite.components.map((component) => component.tool))}
              >
                Add all of {suite.name}
              </button>
            ))}
          </div>
        }
      >
        <ToolPicker plan={plan} />
      </Section>

      <Section
        eyebrow="Step two"
        title={
          items.length === 0
            ? 'Your moves will appear here'
            : `${items.length} ${items.length === 1 ? 'move' : 'moves'}, easiest first`
        }
        intro={
          items.length === 0
            ? undefined
            : 'Start with the easy wins: they build confidence and free up attention for the hard ones. Change any destination below.'
        }
      >
        {items.length === 0 ? (
          <EmptyState title="Nothing in your plan yet">
            Pick the tools you use above, or add a path from any tool page.
          </EmptyState>
        ) : (
          <>
            <ContextBar />

            <dl className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">Total hands-on work</dt>
                <dd className="mt-0.5 font-display text-[2.1rem] leading-tight font-black">
                  {formatEffort(totals.hours)}
                </dd>
                <dd className="mt-1 text-muted">
                  Spread over weeks, not done in one go. Shared destinations are only set up once.
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Where you end up</dt>
                <dd className="mt-0.5 font-display text-[2.1rem] leading-tight font-black">
                  {totals.destinations} {totals.destinations === 1 ? 'tool' : 'tools'}
                </dd>
                <dd className="mt-1 text-muted">
                  {totals.servers === 0
                    ? 'None of them needs a server that you run.'
                    : `${totals.servers} of them ${totals.servers === 1 ? 'is a server' : 'are servers'} you run and keep updated.`}
                </dd>
              </div>
              {totals.hardest && (
                <div>
                  <dt className="eyebrow">The hardest move</dt>
                  <dd className="mt-0.5 font-display text-[2.1rem] leading-tight font-black">
                    {totals.hardest.tool.name}
                  </dd>
                  <dd className="mt-1 text-muted">
                    {totals.hardest.chosen.result.score} out of 100 on its way to{' '}
                    {totals.hardest.chosen.alternative.name}. Leave it until last.
                  </dd>
                </div>
              )}
            </dl>

            <ol className="mt-10 ml-[1.1rem] border-l-[3px] border-dotted border-line-strong">
              {items.map((item, index) => (
                <Move key={item.tool.id} item={item} position={index + 1} />
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-muted">
              <p>
                Saved in this browser only.{' '}
                <Link to="/guides" className="link">
                  Export or import your data
                </Link>
              </p>
              <ConfirmButton
                className="cursor-pointer font-bold text-danger hover:underline"
                label="Clear my plan"
                question="Remove every move from your plan?"
                confirmLabel="Yes, clear"
                onConfirm={clearPlan}
              />
            </div>
          </>
        )}
      </Section>
    </Page>
  )
}
