import { Link } from 'react-router-dom'
import { getAlternative, getCategory, getGuide, getTool } from '../catalog/index.ts'
import type { Alternative, Guide, Suite, Tool } from '../catalog/schema.ts'
import { guideStatus } from '../lib/guides.ts'
import { KIND_LABELS } from '../lib/scales.ts'
import { useGuideProgress } from '../lib/storage.ts'
import { IconArrowRight } from './icons.tsx'
import { Meter, OpennessBadge, ProgressBar, Tag } from './ui.tsx'

const cardLink =
  'card group flex h-full flex-col p-4 transition-[border-color,box-shadow] hover:border-accent hover:shadow-md sm:p-5'

export function ToolCard({ tool }: { tool: Tool }) {
  const names = tool.paths.map((path) => getAlternative(path.to)?.name).filter(Boolean)
  return (
    <Link to={`/tools/${tool.id}`} className={cardLink}>
      <p className="eyebrow">{getCategory(tool.category)?.name}</p>
      <h3 className="mt-1 flex items-start justify-between gap-2 text-lg leading-snug font-bold">
        {tool.name}
        <IconArrowRight className="mt-1 shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </h3>
      <p className="text-sm text-muted">{tool.vendor}</p>
      <div className="mt-3">
        <Meter label="Lock-in" scale="lockIn" level={tool.lockIn.level} />
      </div>
      <p className="mt-auto pt-4 text-sm">
        <span className="text-muted">Exits to </span>
        <span className="font-medium">{names.join(', ')}</span>
      </p>
    </Link>
  )
}

export function AlternativeCard({ alternative }: { alternative: Alternative }) {
  return (
    <Link to={`/alternatives/${alternative.id}`} className={cardLink}>
      <p className="eyebrow">{alternative.categories.map((id) => getCategory(id)?.name).join(' · ')}</p>
      <h3 className="mt-1 flex items-start justify-between gap-2 text-lg leading-snug font-bold">
        {alternative.name}
        <IconArrowRight className="mt-1 shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </h3>
      <p className="text-sm text-muted">{alternative.tagline}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <OpennessBadge openness={alternative.openness} />
        <Tag>{KIND_LABELS[alternative.kind]}</Tag>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
        <Meter label="Maturity" scale="maturity" level={alternative.maturity.score} />
        {alternative.selfHosting ? (
          <Meter label="Self-hosting" scale="difficulty" level={alternative.selfHosting.difficulty} />
        ) : (
          <div>
            <div className="eyebrow mb-1">Self-hosting</div>
            <p className="text-sm font-semibold text-muted">Nothing to host</p>
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
      <h3 className="mt-1 flex items-start justify-between gap-2 text-lg leading-snug font-bold">
        {guide.title}
        <IconArrowRight className="mt-1 shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </h3>
      <p className="mt-1 text-sm text-muted">{guide.summary}</p>
      <div className="mt-auto pt-4">
        <ProgressBar done={done} total={total} label={`Progress through ${guide.title}`} />
        <p className="mt-1.5 text-sm">
          {started ? (
            <>
              <span className="font-semibold">
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
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <p className="eyebrow">{suite.vendor}</p>
      <h3 className="mt-1 text-xl font-bold sm:text-2xl">
        <Link to={`/suites/${suite.id}`} className="hover:text-accent">
          Leaving {suite.name}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-muted">{suite.summary}</p>
      <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
        {suite.components.map((component) => {
          const tool = getTool(component.tool)
          if (!tool) return null
          return (
            <li key={component.label}>
              <Link
                to={`/tools/${tool.id}`}
                className="group flex items-center justify-between gap-3 py-2 hover:text-accent"
              >
                <span className="font-medium">{component.label}</span>
                <span className="flex items-center gap-1.5 text-muted group-hover:text-accent">
                  {tool.paths.length} {tool.paths.length === 1 ? 'exit' : 'exits'}
                  <IconArrowRight />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-4 text-sm">
        <Link to={`/suites/${suite.id}`} className="link inline-flex items-center gap-1">
          See the whole exit plan <IconArrowRight />
        </Link>
        {guide && (
          <Link to={`/guides/${guide.id}`} className="link inline-flex items-center gap-1">
            Open the checklist <IconArrowRight />
          </Link>
        )}
      </div>
    </div>
  )
}
