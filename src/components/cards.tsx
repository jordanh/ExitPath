import { Link } from 'react-router-dom'
import { getCategory, getGuide, getTool } from '../catalog/index.ts'
import type { Alternative, Guide, Suite, Tool } from '../catalog/schema.ts'
import { guideStatus } from '../lib/guides.ts'
import { exitNames, nameList } from '../lib/names.ts'
import { KIND_LABELS } from '../lib/scales.ts'
import { useGuideProgress } from '../lib/storage.ts'
import { IconArrowRight } from './icons.tsx'
import { Meter, OpennessBadge, ProgressBar } from './ui.tsx'

const cardLink = 'card group flex h-full flex-col p-5 sm:p-6'
const cardTitle =
  'mt-1 text-[1.35rem] leading-snug font-extrabold decoration-accent decoration-[1.5px] underline-offset-4 group-hover:underline group-hover:decoration-wavy'

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link to={`/tools/${tool.id}`} className={cardLink}>
      <p className="eyebrow">{getCategory(tool.category)?.name}</p>
      <h3 className={cardTitle}>{tool.name}</h3>
      <p className="text-muted">{tool.vendor}</p>
      <div className="mt-4">
        <Meter label="Lock-in" scale="lockIn" level={tool.lockIn.level} />
      </div>
      <p className="mt-auto pt-4">
        <span className="text-muted">Leads to </span>
        {nameList(exitNames(tool))}
      </p>
    </Link>
  )
}

export function AlternativeCard({ alternative }: { alternative: Alternative }) {
  return (
    <Link to={`/alternatives/${alternative.id}`} className={cardLink}>
      <p className="eyebrow">{alternative.categories.map((id) => getCategory(id)?.name).join(' · ')}</p>
      <h3 className={cardTitle}>{alternative.name}</h3>
      <p className="text-muted">{alternative.tagline}</p>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <OpennessBadge openness={alternative.openness} />
        <span className="eyebrow">{KIND_LABELS[alternative.kind]}</span>
      </p>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
        <Meter label="Maturity" scale="maturity" level={alternative.maturity.score} />
        {alternative.selfHosting ? (
          <Meter label="Self-hosting" scale="difficulty" level={alternative.selfHosting.difficulty} />
        ) : (
          <div>
            <div className="eyebrow mb-0.5">Self-hosting</div>
            <p className="leading-tight font-medium text-muted">Nothing to host</p>
          </div>
        )}
      </div>
    </Link>
  )
}

export function GuideCard({ guide }: { guide: Guide }) {
  const { done, total } = guideStatus(guide, useGuideProgress(guide.id))
  const started = done > 0

  return (
    <Link to={`/guides/${guide.id}`} className={cardLink}>
      <p className="eyebrow">
        {guide.phases.length} phases · {total} steps
      </p>
      <h3 className={cardTitle}>{guide.title}</h3>
      <p className="mt-1 text-muted">{guide.summary}</p>
      <div className="mt-auto pt-5">
        <ProgressBar done={done} total={total} label={`Progress through ${guide.title}`} />
        <p className="mt-1.5">
          {started ? (
            <>
              <span className="font-display text-xl font-extrabold">
                {done} of {total}
              </span>{' '}
              <span className="text-muted">{done === total ? 'steps done. You are out.' : 'steps done'}</span>
            </>
          ) : (
            <span className="text-muted">Not started</span>
          )}
        </p>
      </div>
    </Link>
  )
}

export function SuiteCard({ suite }: { suite: Suite }) {
  const guide = suite.guide ? getGuide(suite.guide) : undefined
  return (
    <div className="flex h-full flex-col rounded-pebble bg-sunken p-6 sm:p-8">
      <p className="eyebrow">{suite.vendor}</p>
      <h3 className="mt-1 text-[1.7rem] leading-tight font-black sm:text-[2rem]">
        <Link
          to={`/suites/${suite.id}`}
          className="decoration-accent decoration-2 underline-offset-4 hover:underline hover:decoration-wavy"
        >
          Leaving {suite.name}
        </Link>
      </h3>
      <p className="mt-2 text-muted">{suite.summary}</p>
      <ul className="mt-5">
        {suite.components.map((component) => {
          const tool = getTool(component.tool)
          if (!tool) return null
          return (
            <li key={component.label}>
              <Link to={`/tools/${tool.id}`} className="group flex items-baseline gap-2 py-1">
                <span className="font-bold decoration-accent decoration-[1.5px] underline-offset-4 group-hover:underline">
                  {component.label}
                </span>
                <span className="leader" aria-hidden="true" />
                <span className="text-muted group-hover:text-ink">
                  {tool.paths.length} {tool.paths.length === 1 ? 'exit' : 'exits'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-6">
        <Link to={`/suites/${suite.id}`} className="link inline-flex items-center gap-1">
          See the whole exit plan <IconArrowRight className="text-accent" />
        </Link>
        {guide && (
          <Link to={`/guides/${guide.id}`} className="link inline-flex items-center gap-1">
            Open the checklist <IconArrowRight className="text-accent" />
          </Link>
        )}
      </div>
    </div>
  )
}
