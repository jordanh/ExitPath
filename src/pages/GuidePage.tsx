import { Link, useParams } from 'react-router-dom'
import { getAlternative, getGuide, getTool } from '../catalog/index.ts'
import type { Guide, GuideStep } from '../catalog/schema.ts'
import { IconArrowRight, IconCheck } from '../components/icons.tsx'
import { ExternalLink, Page, ProgressBar, Section, Tag } from '../components/ui.tsx'
import { guideStatus } from '../lib/guides.ts'
import { resetGuide, setGuideNotes, setStepDone, useGuideProgress } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function GuidePage() {
  const { id } = useParams()
  const guide = id ? getGuide(id) : undefined
  return guide ? <GuideView key={guide.id} guide={guide} /> : <NotFound what="guide" />
}

function Step({ guideId, step, done }: { guideId: string; step: GuideStep; done: boolean }) {
  const inputId = `step-${step.id}`
  return (
    <li className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5">
      <span className="relative mt-0.5 flex size-6 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={done}
          onChange={(event) => setStepDone(guideId, step.id, event.target.checked)}
          aria-describedby={`${inputId}-detail`}
          className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-line-strong bg-surface checked:border-accent checked:bg-accent hover:border-accent"
        />
        <IconCheck
          strokeWidth={2.4}
          className="pointer-events-none absolute inset-0 m-auto hidden text-base text-on-accent peer-checked:block"
        />
      </span>
      <div className="min-w-0 flex-1">
        <label
          htmlFor={inputId}
          className={`cursor-pointer font-semibold ${done ? 'text-muted line-through decoration-line-strong' : ''}`}
        >
          {step.title}
        </label>
        {step.optional && (
          <span className="ml-2 align-middle">
            <Tag>Optional</Tag>
          </span>
        )}
        <p id={`${inputId}-detail`} className={`mt-1 text-sm ${done ? 'text-faint' : 'text-muted'}`}>
          {step.detail}
        </p>
        {step.links && !done && (
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
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

  function reset() {
    if (window.confirm(`Clear all progress and notes for “${guide.title}”?`)) resetGuide(guide.id)
  }

  return (
    <Page>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link to="/guides" className="hover:text-ink">
          Guides
        </Link>
      </nav>

      {/* The progress card spans both rows so that it stays in view beside the checklist. */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <header className="min-w-0 lg:col-start-1">
          <p className="eyebrow">Guided migration</p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{guide.summary}</p>
          <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="eyebrow">Written for</dt>
              <dd className="mt-1">{guide.audience}</dd>
            </div>
            <div>
              <dt className="eyebrow">How long it takes</dt>
              <dd className="mt-1">{guide.timeframe}</dd>
            </div>
          </dl>
          <ul className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <li className="text-muted">Leaving:</li>
            {guide.tools.map((id) => {
              const tool = getTool(id)
              return (
                tool && (
                  <li key={id}>
                    <Link
                      to={`/tools/${id}`}
                      className="inline-flex rounded-full border border-line bg-surface px-3 py-1 font-medium hover:border-accent hover:text-accent"
                    >
                      {tool.name}
                    </Link>
                  </li>
                )
              )
            })}
          </ul>
        </header>

        <aside
          className="card h-fit p-4 sm:p-5 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          aria-label="Your progress"
        >
          <p className="eyebrow">Your progress</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {done}
            <span className="text-lg font-semibold text-muted"> / {total} steps</span>
          </p>
          <div className="mt-3">
            <ProgressBar done={done} total={total} label={`Progress through ${guide.title}`} />
          </div>
          <p className="mt-3 text-sm" aria-live="polite">
            {finished ? (
              <span className="font-semibold text-accent">Every step done. You are out.</span>
            ) : next ? (
              <>
                <span className="text-muted">Next: </span>
                <span className="font-medium">{next.step.title}</span>
                <span className="text-muted"> ({next.phase.title})</span>
              </>
            ) : null}
          </p>
          <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
            Saved in this browser only. Export it from the{' '}
            <Link to="/guides" className="link">
              guides page
            </Link>
            .
          </p>
          {hasAnything && (
            <button
              type="button"
              onClick={reset}
              className="mt-2 text-xs font-semibold text-level-5 hover:underline"
            >
              Clear my progress
            </button>
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
                      className="grid gap-x-6 gap-y-1 px-4 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:px-5"
                    >
                      <p className="eyebrow pt-0.5">{entry.role}</p>
                      <p className="text-sm">
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
            <ol className="space-y-6">
              {guide.phases.map((phase, index) => {
                const phaseDone = phase.steps.filter((step) => doneIds.has(step.id)).length
                const complete = phaseDone === phase.steps.length
                return (
                  <li key={phase.id} className="card overflow-hidden">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line bg-sunken px-4 py-3 sm:px-5">
                      <h3 className="text-lg font-bold">
                        <span className="mr-2 font-mono text-sm text-muted">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {phase.title}
                      </h3>
                      <p
                        className={`font-mono text-xs font-semibold ${complete ? 'text-accent' : 'text-muted'}`}
                      >
                        {complete ? 'Done' : `${phaseDone} / ${phase.steps.length}`}
                      </p>
                      {phase.intro && <p className="w-full text-sm text-muted">{phase.intro}</p>}
                    </div>
                    <ul className="divide-y divide-line">
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
                className="block w-full rounded-xl border border-line-strong bg-surface p-4 text-sm placeholder:text-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
              />
            </label>
          </Section>

          <p className="mt-10 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>Guide last reviewed {guide.reviewed}.</span>
            <Link to="/guides" className="link inline-flex items-center gap-1">
              All guides <IconArrowRight />
            </Link>
          </p>
        </div>
      </div>
    </Page>
  )
}
