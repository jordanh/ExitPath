import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, guidesForTool, suites, tools } from '../catalog/index.ts'
import { ConfirmButton } from '../components/ConfirmButton.tsx'
import { CopyText } from '../components/CopyText.tsx'
import { Disclosure } from '../components/Disclosure.tsx'
import { IconCheck, IconX } from '../components/icons.tsx'
import { SituationBar } from '../components/Situation.tsx'
import { EmptyState, OpennessBadge, Page, ScoreBadge, Section } from '../components/ui.tsx'
import { planToMarkdown } from '../lib/markdown.ts'
import { openOptions } from '../lib/options-dialog.ts'
import { planTotals, resolvePlan, type PlanItem } from '../lib/plan.ts'
import { formatEffort, formatWeeks, weeksAtPace } from '../lib/scoring.ts'
import { decodePlan, encodePlan } from '../lib/share.ts'
import {
  clearPlan,
  removeFromPlan,
  replacePlan,
  setMoveDone,
  setPlanChoice,
  setPlanChoices,
  usePlan,
  usePlanDone,
  usePrefs,
  useSituation,
  type Plan,
} from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'

const chip = 'chip'

function ToolPicker({ plan }: { plan: Plan }) {
  function addSuite(toolIds: string[]) {
    // Keep any path already chosen for a tool; only add the missing ones.
    setPlanChoices(
      Object.fromEntries(toolIds.filter((id) => !Object.hasOwn(plan, id)).map((id) => [id, null])),
    )
  }

  return (
    <div>
      {categories.map((category) => {
        const inCategory = tools.filter((tool) => tool.category === category.id)
        if (inCategory.length === 0) return null
        return (
          <div
            key={category.id}
            role="group"
            aria-label={category.name}
            className="grid gap-x-6 gap-y-1.5 py-2 sm:grid-cols-[11rem_minmax(0,1fr)]"
          >
            <p className="eyebrow sm:pt-1.5">{category.name}</p>
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
      <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        {suites.map((suite) => (
          <button
            key={suite.id}
            type="button"
            className="link cursor-pointer"
            onClick={() => addSuite(suite.components.map((component) => component.tool))}
          >
            Add all of {suite.name}
          </button>
        ))}
      </p>
    </div>
  )
}

function Move({ item, done }: { item: PlanItem; done: boolean }) {
  const { tool, chosen, auto, options } = item
  const selectId = useId()
  const doneId = useId()
  const guide = guidesForTool(tool.id)[0]
  const easiest = options[0]!

  return (
    <li className="relative pb-10 pl-9 last:pb-2 sm:pl-11">
      {/* The tick sits on the trail line as a waypoint, filled in once the move is behind you. */}
      <span className="absolute top-0.5 left-[-1.5px] flex size-7 -translate-x-1/2">
        <input
          id={doneId}
          type="checkbox"
          checked={done}
          onChange={(event) => setMoveDone(tool.id, event.target.checked)}
          aria-label={`${tool.name} to ${chosen.alternative.name}: done`}
          className="peer size-7 cursor-pointer appearance-none rounded-full border-2 border-ink bg-bg checked:border-accent checked:bg-accent hover:border-accent"
        />
        <IconCheck
          strokeWidth={2.4}
          className="pointer-events-none absolute inset-0 m-auto hidden text-[1.05rem] text-on-accent peer-checked:block print:text-ink"
        />
      </span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <span className="eyebrow">{tool.name} to</span>
          <h3
            className={`text-[1.6rem] leading-tight font-black ${done ? 'text-muted line-through decoration-faint decoration-1' : ''}`}
          >
            <Link
              to={`/alternatives/${chosen.alternative.id}`}
              className="decoration-accent decoration-2 underline-offset-4 hover:underline"
            >
              {chosen.alternative.name}
            </Link>
          </h3>
        </div>
        <ScoreBadge band={chosen.result.band} size="sm" />
      </div>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
        <OpennessBadge openness={chosen.alternative.openness} />
        <span className="text-muted">
          <span className="font-bold text-ink">{formatEffort(chosen.result.hours)}</span> of work
        </span>
      </p>
      {!done && <p className="mt-2 max-w-2xl text-muted">{chosen.path.verdict}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 print:hidden">
        <div className="w-full min-w-0 sm:w-auto">
          <label htmlFor={selectId} className="sr-only">
            Where {tool.name} goes
          </label>
          <select
            id={selectId}
            value={auto ? '' : chosen.alternative.id}
            onChange={(event) => setPlanChoice(tool.id, event.target.value || null)}
            className="field h-9 w-full max-w-full cursor-pointer px-2.5 font-medium text-ellipsis sm:w-auto"
          >
            <option value="">Easiest for me ({easiest.alternative.name})</option>
            {options.map(({ alternative, result }) => (
              <option key={alternative.id} value={alternative.id}>
                {alternative.name} · {result.band.label.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        {guide && (
          <Link to={`/guides/${guide.id}`} className="link whitespace-nowrap">
            Checklist
          </Link>
        )}
        <Link to={`/tools/${tool.id}`} className="link whitespace-nowrap">
          Details
        </Link>
        <button
          type="button"
          onClick={() => removeFromPlan(tool.id)}
          aria-label={`Remove ${tool.name} from the plan`}
          className="inline-flex cursor-pointer items-center gap-1 font-medium whitespace-nowrap text-muted hover:text-danger"
        >
          <IconX /> Remove
        </button>
      </div>
    </li>
  )
}

/** A plan that arrived in a link: shown for what it is, and only saved when asked. */
function SharedPlan({
  shared,
  hasOwnPlan,
  onDone,
}: {
  shared: Plan
  hasOwnPlan: boolean
  onDone: () => void
}) {
  const situation = useSituation()
  const items = resolvePlan(shared, situation)
  const save = () => {
    replacePlan(shared)
    onDone()
  }

  return (
    <section aria-labelledby="shared-plan" className="mt-8 border-l-2 border-accent pl-4 sm:pl-5">
      <h2 id="shared-plan" className="text-[1.3rem] leading-tight font-extrabold">
        A plan shared with you
      </h2>
      <ul className="mt-2">
        {items.map(({ tool, chosen }) => (
          <li key={tool.id} className="flex flex-wrap items-baseline gap-x-2 py-0.5">
            <span>
              {tool.name} to <span className="font-bold">{chosen.alternative.name}</span>
            </span>
            <span className="leader" aria-hidden="true" />
            <ScoreBadge band={chosen.result.band} size="sm" />
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {hasOwnPlan ? (
          <ConfirmButton
            className="btn btn-primary"
            label="Save as my plan"
            question="Replace the plan you already have?"
            confirmLabel="Yes, replace"
            onConfirm={save}
          />
        ) : (
          <button type="button" className="btn btn-primary" onClick={save}>
            Save as my plan
          </button>
        )}
        <button type="button" className="link cursor-pointer" onClick={onDone}>
          Dismiss
        </button>
      </p>
    </section>
  )
}

/** A link to this page that carries the plan in it. Nothing is uploaded: the plan is the link. */
function shareUrl(plan: Plan): string {
  const url = new URL(window.location.href)
  url.hash = `/plan?p=${encodePlan(plan)}`
  return url.toString()
}

export function PlanPage() {
  useTitle('Your plan')
  const situation = useSituation()
  const { hoursPerWeek } = usePrefs()
  const [params, setParams] = useSearchParams()
  const plan = usePlan()
  const finished = new Set(usePlanDone())
  const items = resolvePlan(plan, situation)
  const left = items.filter(({ tool }) => !finished.has(tool.id))
  const totals = planTotals(items)
  const remaining = planTotals(left)
  const doneCount = items.length - left.length

  // The picker folds away once there is a plan to look at, and comes back when the plan is emptied.
  const [pickerOpen, setPickerOpen] = useState(items.length === 0)

  const sharedText = params.get('p')
  const shared = sharedText ? decodePlan(sharedText) : {}
  const showShared = Object.keys(shared).length > 0 && encodePlan(shared) !== encodePlan(plan)
  const dismissShared = () => {
    const next = new URLSearchParams(params)
    next.delete('p')
    setParams(next, { replace: true })
  }

  return (
    <Page>
      <header className="max-w-2xl">
        <h1 className="text-[2rem] leading-[1.1] font-black tracking-tight sm:text-[2.5rem]">Your plan</h1>
        <p className="mt-3 text-xl text-muted">
          Select the tools you use. The plan lists a replacement for each, the work it adds up to and an order
          to do them in.
        </p>
      </header>

      {showShared && <SharedPlan shared={shared} hasOwnPlan={items.length > 0} onDone={dismissShared} />}

      <div className="mt-8">
        <Disclosure
          summary="What do you use?"
          hint={items.length > 0 ? `${items.length} chosen` : undefined}
          open={pickerOpen || items.length === 0}
          onToggle={setPickerOpen}
        >
          <ToolPicker plan={plan} />
        </Disclosure>
      </div>

      <Section
        title={
          items.length === 0
            ? 'Your moves will appear here'
            : `${items.length} ${items.length === 1 ? 'move' : 'moves'}, easiest first`
        }
      >
        {items.length === 0 ? (
          <EmptyState title="Nothing in your plan yet">
            Pick the tools you use above, or add a path from any tool page.
          </EmptyState>
        ) : (
          <>
            <SituationBar />

            <dl className="mt-7 grid gap-x-10 gap-y-5 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">{doneCount > 0 ? 'Work left' : 'Hands-on work'}</dt>
                <dd className="font-display text-[1.7rem] leading-tight font-black">
                  {left.length === 0 ? 'None' : formatEffort(remaining.hours)}
                </dd>
                <dd className="text-muted">
                  {doneCount > 0
                    ? `${doneCount} of ${items.length} moves done.`
                    : 'A shared destination is set up once.'}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">At {hoursPerWeek} hours a week</dt>
                <dd className="font-display text-[1.7rem] leading-tight font-black first-letter:uppercase">
                  {left.length === 0 ? 'Finished' : formatWeeks(weeksAtPace(remaining.hours, hoursPerWeek))}
                </dd>
                <dd className="print:hidden">
                  <button type="button" onClick={openOptions} className="link cursor-pointer">
                    Change the pace
                  </button>
                </dd>
              </div>
              {remaining.hardest && (
                <div>
                  <dt className="eyebrow">{left.length === 1 ? 'Last move' : 'Hardest move left'}</dt>
                  <dd className="font-display text-[1.7rem] leading-tight font-black">
                    {remaining.hardest.tool.name}
                  </dd>
                  <dd className="text-muted">
                    Graded {remaining.hardest.chosen.result.band.label.toLowerCase()}
                    {left.length > 1 ? '. Leave it until last.' : '.'}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 space-y-1">
              <p className="text-muted">
                You end up on {totals.destinations} {totals.destinations === 1 ? 'tool' : 'tools'}.{' '}
                {totals.servers === 0
                  ? 'None of them needs a server that you run.'
                  : `${totals.servers} of them ${totals.servers === 1 ? 'is a server' : 'are servers'} you run and keep updated.`}
              </p>
            </div>

            <ol className="mt-9 ml-3.5 border-l-[3px] border-dotted border-line-strong">
              {items.map((item) => (
                <Move key={item.tool.id} item={item} done={finished.has(item.tool.id)} />
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 print:hidden">
              <CopyText
                label="Copy as Markdown"
                getText={() => planToMarkdown(items, finished, totals.hours)}
              />
              <CopyText label="Copy a link to this plan" getText={() => shareUrl(plan)} />
              <button type="button" onClick={() => window.print()} className="link cursor-pointer">
                Print
              </button>
              <ConfirmButton
                className="cursor-pointer font-bold text-danger hover:underline"
                label="Clear my plan"
                question="Remove every move from your plan?"
                confirmLabel="Yes, clear"
                onConfirm={clearPlan}
              />
            </div>
            <p className="mt-2 text-muted print:hidden">
              Saved in this browser only. The link carries the plan itself; nothing is uploaded.
            </p>
          </>
        )}
      </Section>
    </Page>
  )
}
