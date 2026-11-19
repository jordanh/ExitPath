import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAlternative, getGuide, getTool } from '../catalog/index.ts'
import type { Guide, GuideStep } from '../catalog/schema.ts'
import { ConfirmButton } from '../components/ConfirmButton.tsx'
import { CopyText } from '../components/CopyText.tsx'
import { EntryFooter } from '../components/EntryFooter.tsx'
import { IconCheck } from '../components/icons.tsx'
import { ExternalLink, Page, ProgressBar, Section } from '../components/ui.tsx'
import { guideStatus } from '../lib/guides.ts'
import { guideToMarkdown } from '../lib/markdown.ts'
import { resetGuide, setGuideNotes, setStepDone, useGuideProgress } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function GuidePage() {
  const { id } = useParams()
  const guide = id ? getGuide(id) : undefined
  return guide ? <GuideView key={guide.id} guide={guide} /> : <NotFound what="guide" />
}

/**
 * One step, as a waypoint on the trail: the checkbox sits on the dotted line
 * that runs down the phase, and fills in once you have passed it.
 */
function Step({ guideId, step, done }: { guideId: string; step: GuideStep; done: boolean }) {
  const inputId = `step-${step.id}`
  return (
    <li className="relative break-inside-avoid pb-6 pl-9 last:pb-1 sm:pl-11">
      <span className="absolute top-0 left-[-1.5px] flex size-7 -translate-x-1/2">
        <input
          id={inputId}
          type="checkbox"
          checked={done}
          onChange={(event) => setStepDone(guideId, step.id, event.target.checked)}
          aria-describedby={`${inputId}-detail`}
          className="peer size-7 cursor-pointer appearance-none rounded-full border-2 border-ink bg-bg checked:border-accent checked:bg-accent hover:border-accent"
        />
        <IconCheck
          strokeWidth={2.4}
          className="pointer-events-none absolute inset-0 m-auto hidden text-[1.05rem] text-on-accent peer-checked:block print:text-ink"
        />
      </span>
      <div className="min-w-0">
        <label
          htmlFor={inputId}
          className={`cursor-pointer font-display text-[1.2rem] leading-snug font-bold ${done ? 'text-muted line-through decoration-faint decoration-1' : ''}`}
        >
          {step.title}
        </label>
        {step.optional && <span className="eyebrow ml-3">Optional</span>}
        <p id={`${inputId}-detail`} className={`mt-1 ${done ? 'text-faint' : 'text-muted'}`}>
          {step.detail}
        </p>
        {step.links && !done && (
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {step.links.map((link) => (
              <li key={link.url}>
                <ExternalLink href={link.url}>{link.label}</ExternalLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function GuideView({ guide }: { guide: Guide }) {
  useTitle(guide.title)
  const progress = useGuideProgress(guide.id)
  const { done, total, doneIds } = guideStatus(guide, progress)
  const finished = done === total
  const [wantsDoneHidden, setHideDone] = useState(false)
  // With every step done there would be nothing left to show, so the setting only applies part-way.
  const hideDone = wantsDoneHidden && !finished && done > 0
  const hasAnything = done > 0 || progress.notes.trim() !== ''

  // The first unticked step, so a returning visitor can pick up where they stopped.
  const next = guide.phases.flatMap((phase) => phase.steps).find((step) => !doneIds.has(step.id))

  return (
    <Page narrow>
      <nav aria-label="Breadcrumb" className="mb-3 text-muted print:hidden">
        <Link to="/guides" className="hover:text-ink">
          Guides
        </Link>
      </nav>

      <header>
        <h1 className="text-[2rem] leading-[1.1] font-black tracking-tight sm:text-[2.5rem]">
          {guide.title}
        </h1>
        <p className="mt-3 text-xl text-muted">{guide.summary}</p>
        <dl className="mt-5">
          <div className="grid gap-x-4 py-1 sm:grid-cols-[5rem_minmax(0,1fr)]">
            <dt className="eyebrow sm:pt-0.5">For</dt>
            <dd>{guide.audience}</dd>
          </div>
          <div className="grid gap-x-4 py-1 sm:grid-cols-[5rem_minmax(0,1fr)]">
            <dt className="eyebrow sm:pt-0.5">Takes</dt>
            <dd>{guide.timeframe}</dd>
          </div>
          <div className="grid gap-x-4 py-1 sm:grid-cols-[5rem_minmax(0,1fr)]">
            <dt className="eyebrow sm:pt-0.5">Replaces</dt>
            <dd>
              {guide.tools.flatMap((id, index) => {
                const tool = getTool(id)
                if (!tool) return []
                return [
                  <span key={id}>
                    {index > 0 && ', '}
                    <Link to={`/tools/${id}`} className="link">
                      {tool.name}
                    </Link>
                  </span>,
                ]
              })}
            </dd>
          </div>
        </dl>
      </header>

      {/* Stays in view while the checklist scrolls underneath. */}
      <aside
        aria-label="Your progress"
        className="sticky top-[var(--header-height,3.5rem)] z-20 -mx-4 mt-8 border-y border-line bg-bg px-4 py-2.5 sm:-mx-6 sm:px-6 print:static"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
          <p>
            <span className="figures font-display text-xl leading-none font-black">{done}</span>
            <span className="text-muted"> of {total} steps</span>
          </p>
          <p className="min-w-0 truncate text-muted" aria-live="polite">
            {finished ? (
              <span className="font-bold text-ink">All steps done.</span>
            ) : next ? (
              <>
                Next: <span className="text-ink">{next.title}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="mt-1.5">
          <ProgressBar done={done} total={total} label={`Progress through ${guide.title}`} />
        </div>
      </aside>

      <section className="mt-8" aria-labelledby="stack">
        <h2 id="stack" className="text-[1.55rem] leading-tight font-extrabold">
          Tools this checklist uses
        </h2>
        <p className="mt-1 text-muted">Other options are listed on each tool’s page.</p>
        <dl className="mt-3">
          {guide.stack.map((entry) => {
            const alternative = getAlternative(entry.alternative)
            return (
              alternative && (
                <div
                  key={`${entry.role}-${entry.alternative}`}
                  className="grid gap-x-6 py-1.5 sm:grid-cols-[11rem_minmax(0,1fr)]"
                >
                  <dt className="eyebrow sm:pt-0.5">{entry.role}</dt>
                  <dd>
                    <Link to={`/alternatives/${alternative.id}`} className="link">
                      {alternative.name}
                    </Link>
                    <span className="text-muted"> — {entry.why}</span>
                  </dd>
                </div>
              )
            )
          })}
        </dl>
      </section>

      <Section
        title="The checklist"
        aside={
          done > 0 &&
          !finished && (
            <button
              type="button"
              aria-pressed={hideDone}
              onClick={() => setHideDone(!hideDone)}
              className="chip print:hidden"
            >
              Hide finished steps
            </button>
          )
        }
      >
        <ol className="space-y-10">
          {guide.phases.map((phase, index) => {
            const phaseDone = phase.steps.filter((step) => doneIds.has(step.id)).length
            const complete = phaseDone === phase.steps.length
            const steps = hideDone ? phase.steps.filter((step) => !doneIds.has(step.id)) : phase.steps
            return (
              <li key={phase.id}>
                <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[1.35rem] leading-tight font-extrabold">
                    <span className="figures mr-2 text-accent">{index + 1}</span>
                    {phase.title}
                  </h3>
                  <span className="leader" aria-hidden="true" />
                  <p className={`eyebrow ${complete ? 'text-accent' : ''}`}>
                    {complete ? 'Done' : `${phaseDone} of ${phase.steps.length}`}
                  </p>
                  {phase.intro && <p className="w-full text-muted">{phase.intro}</p>}
                </div>
                {/* The dotted line is the trail; each step is a waypoint on it. */}
                {steps.length > 0 && (
                  <ul className="ml-3.5 border-l-[3px] border-dotted border-line-strong">
                    {steps.map((step) => (
                      <Step key={step.id} guideId={guide.id} step={step} done={doneIds.has(step.id)} />
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ol>
      </Section>

      <Section title="Your notes" intro="Renewal dates, who owns what, decisions made along the way.">
        <label className="block">
          <span className="sr-only">Notes for {guide.title}</span>
          <textarea
            value={progress.notes}
            onChange={(event) => setGuideNotes(guide.id, event.target.value)}
            rows={5}
            placeholder="Subscription renews on…"
            className="field block w-full p-4"
          />
        </label>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 print:hidden">
          <CopyText label="Copy as Markdown" getText={() => guideToMarkdown(guide, doneIds)} />
          <button type="button" onClick={() => window.print()} className="link cursor-pointer">
            Print
          </button>
          {hasAnything && (
            <ConfirmButton
              className="cursor-pointer font-bold text-danger hover:underline"
              label="Clear my progress"
              question="Clear progress and notes for this guide?"
              confirmLabel="Yes, clear"
              onConfirm={() => resetGuide(guide.id)}
            />
          )}
        </div>
        <p className="mt-2 text-muted print:hidden">Progress and notes are saved in this browser only.</p>
      </Section>

      <EntryFooter folder="guides" id={guide.id} name={guide.title} reviewed={guide.reviewed} />
    </Page>
  )
}
