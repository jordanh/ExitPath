import { Link, useParams } from 'react-router-dom'
import { getAlternative, getGuide, getTool } from '../catalog/index.ts'
import type { Guide, GuideStep } from '../catalog/schema.ts'
import { ConfirmButton } from '../components/ConfirmButton.tsx'
import { EntryFooter } from '../components/EntryFooter.tsx'
import { IconArrowRight, IconCheck } from '../components/icons.tsx'
import { ExternalLink, Page, ProgressBar, Section } from '../components/ui.tsx'
import { guideStatus } from '../lib/guides.ts'
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
    <li className="relative break-inside-avoid pb-7 pl-9 last:pb-1 sm:pl-11">
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
          className={`cursor-pointer font-display text-[1.22rem] leading-snug font-bold ${done ? 'text-muted line-through decoration-faint decoration-1' : ''}`}
        >
          {step.title}
        </label>
        {step.optional && <span className="eyebrow ml-3">Optional</span>}
        <p id={`${inputId}-detail`} className={`mt-1 max-w-[42rem] ${done ? 'text-faint' : 'text-muted'}`}>
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
  const hasAnything = done > 0 || progress.notes.trim() !== ''

  // The first unticked step, so a returning visitor can pick up where they stopped.
  const next = guide.phases
    .flatMap((phase) => phase.steps.map((step) => ({ phase, step })))
    .find(({ step }) => !doneIds.has(step.id))

  return (
    <Page>
      <nav aria-label="Breadcrumb" className="mb-4 text-muted">
        <Link to="/guides" className="hover:text-ink">
          Guides
        </Link>
      </nav>

      {/* The progress card spans both rows so that it stays in view beside the checklist. */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <header className="min-w-0 lg:col-start-1">
          <p className="eyebrow">Guided migration</p>
          <h1 className="mt-1 text-[2.6rem] leading-[1.02] font-black tracking-tight sm:text-[4rem]">
            {guide.title}
          </h1>
          <p className="mt-4 text-xl text-muted">{guide.summary}</p>
          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="eyebrow">Written for</dt>
              <dd className="mt-1">{guide.audience}</dd>
            </div>
            <div>
              <dt className="eyebrow">How long it takes</dt>
              <dd className="mt-1">{guide.timeframe}</dd>
            </div>
          </dl>
          <ul className="mt-5 flex flex-wrap items-center gap-2">
            <li className="text-muted">Leaving:</li>
            {guide.tools.map((id) => {
              const tool = getTool(id)
              return (
                tool && (
                  <li key={id}>
                    <Link to={`/tools/${id}`} className="chip">
                      {tool.name}
                    </Link>
                  </li>
                )
              )
            })}
          </ul>
        </header>

        <aside
          className="card h-fit p-5 sm:p-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          aria-label="Your progress"
        >
          <p className="eyebrow">Your progress</p>
          <p className="mt-1 font-display text-[2.6rem] leading-none font-black">
            <span className="figures">{done}</span>
            <span className="font-sans text-lg font-medium text-muted"> of {total} steps</span>
          </p>
          <div className="mt-3">
            <ProgressBar done={done} total={total} label={`Progress through ${guide.title}`} />
          </div>
          <p className="mt-3" aria-live="polite">
            {finished ? (
              <span className="font-display text-lg font-bold text-accent italic">
                Every step done. You are out.
              </span>
            ) : next ? (
              <>
                <span className="text-muted">Next: </span>
                <span className="font-medium">{next.step.title}</span>
                <span className="text-muted"> ({next.phase.title})</span>
              </>
            ) : null}
          </p>
          <p className="mt-4 border-t border-dashed border-line-strong pt-3 text-sm text-muted print:hidden">
            Saved in this browser only. Export it from the{' '}
            <Link to="/guides" className="link">
              guides page
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="link mt-2 block cursor-pointer text-sm print:hidden"
          >
            Print this checklist
          </button>
          {hasAnything && (
            <div className="mt-2 print:hidden">
              <ConfirmButton
                className="cursor-pointer text-sm font-bold text-danger hover:underline"
                label="Clear my progress"
                question="Clear progress and notes for this guide?"
                confirmLabel="Yes, clear"
                onConfirm={() => resetGuide(guide.id)}
              />
            </div>
          )}
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <Section
            eyebrow="Where you are going"
            title="The stack this guide assumes"
            intro="A sensible default, not the only answer. Each link shows the alternatives and how they compare."
          >
            <div className="card divide-y divide-line">
              {guide.stack.map((entry) => {
                const alternative = getAlternative(entry.alternative)
                return (
                  alternative && (
                    <div
                      key={`${entry.role}-${entry.alternative}`}
                      className="grid gap-x-6 gap-y-1 px-5 py-3.5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:px-7"
                    >
                      <p className="eyebrow pt-0.5">{entry.role}</p>
                      <p>
                        <Link to={`/alternatives/${alternative.id}`} className="link">
                          {alternative.name}
                        </Link>
                        <span className="text-muted"> — {entry.why}</span>
                      </p>
                    </div>
                  )
                )
              })}
            </div>
          </Section>

          <Section eyebrow="The checklist" title={`${guide.phases.length} phases, in order`}>
            <ol className="space-y-12">
              {guide.phases.map((phase, index) => {
                const phaseDone = phase.steps.filter((step) => doneIds.has(step.id)).length
                const complete = phaseDone === phase.steps.length
                return (
                  <li key={phase.id}>
                    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="flex items-baseline gap-3 text-[1.7rem] leading-tight font-extrabold">
                        <span className="figures text-[2.5rem] leading-none font-black text-accent italic">
                          {index + 1}
                        </span>
                        {phase.title}
                      </h3>
                      <span className="leader" aria-hidden="true" />
                      <p className={`eyebrow ${complete ? 'text-accent' : ''}`}>
                        {complete ? 'Done' : `${phaseDone} of ${phase.steps.length}`}
                      </p>
                      {phase.intro && <p className="w-full text-lg text-muted">{phase.intro}</p>}
                    </div>
                    {/* The dotted line is the trail; each step is a waypoint on it. */}
                    <ul className="ml-3.5 border-l-[3px] border-dotted border-line-strong">
                      {phase.steps.map((step) => (
                        <Step key={step.id} guideId={guide.id} step={step} done={doneIds.has(step.id)} />
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ol>
          </Section>

          <Section
            eyebrow="Your notes"
            title="Things to remember"
            intro="Renewal dates, who owns what, decisions you made along the way. Saved with your progress, on this device."
          >
            <label className="block">
              <span className="sr-only">Notes for {guide.title}</span>
              <textarea
                value={progress.notes}
                onChange={(event) => setGuideNotes(guide.id, event.target.value)}
                rows={6}
                placeholder="Subscription renews on…"
                className="field block w-full p-4"
              />
            </label>
          </Section>

          <EntryFooter folder="guides" id={guide.id} name={guide.title} reviewed={guide.reviewed} />
          <p className="mt-4 print:hidden">
            <Link to="/guides" className="link inline-flex items-center gap-1">
              All guides <IconArrowRight className="text-accent" />
            </Link>
          </p>
        </div>
      </div>
    </Page>
  )
}
