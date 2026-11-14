import type { ReactNode } from 'react'
import type { Openness, Support } from '../catalog/schema.ts'
import { OPENNESS_LABELS, SCALES, SUPPORT_LABELS, toneFor, type ScaleId } from '../lib/scales.ts'
import type { BANDS } from '../lib/scoring.ts'
import { IconCheck, IconExternal, IconPartial, IconPlus, IconX } from './icons.tsx'

// Tailwind only generates classes it can see as whole strings, so the
// level-to-class lookups are spelled out rather than built by concatenation.
const TEXT = ['', 'text-level-1', 'text-level-2', 'text-level-3', 'text-level-4', 'text-level-5']
const FILL = ['', 'bg-level-1', 'bg-level-2', 'bg-level-3', 'bg-level-4', 'bg-level-5']
const SOFT = [
  '',
  'bg-level-1/10 border-level-1/30',
  'bg-level-2/10 border-level-2/30',
  'bg-level-3/10 border-level-3/30',
  'bg-level-4/10 border-level-4/30',
  'bg-level-5/10 border-level-5/30',
]

export function Page({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto w-full px-4 pt-8 pb-20 sm:px-6 sm:pt-12 ${narrow ? 'max-w-3xl' : 'max-w-6xl'}`}>
      {children}
    </div>
  )
}

export function Section({
  title,
  eyebrow,
  intro,
  children,
  aside,
}: {
  title: string
  eyebrow?: string
  intro?: ReactNode
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {intro && <p className="mt-1.5 text-muted">{intro}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** A 1–5 rating shown as five pips, a word and (for screen readers) the number. */
export function Meter({
  level,
  scale,
  label,
  word,
}: {
  level: number
  scale: ScaleId
  label?: string
  /** Overrides the scale's own word, e.g. "Managed for you". */
  word?: string
}) {
  const tone = toneFor(scale, level)
  return (
    <div>
      {label && <div className="eyebrow mb-1">{label}</div>}
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 gap-[3px]" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((pip) => (
            <span
              key={pip}
              className={`h-3 w-[5px] rounded-[1.5px] ${pip <= level ? FILL[tone] : 'bg-line-strong/60'}`}
            />
          ))}
        </span>
        <span className={`text-sm leading-tight font-semibold ${TEXT[tone]}`}>
          {word ?? SCALES[scale].labels[level - 1]}
        </span>
        <span className="sr-only">
          ({level} out of 5{label ? ` for ${label.toLowerCase()}` : ''})
        </span>
      </div>
    </div>
  )
}

export function ScoreBadge({
  score,
  band,
  size = 'md',
}: {
  score: number
  band: (typeof BANDS)[number]
  size?: 'sm' | 'md' | 'lg'
}) {
  const number = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-base'
  const pad = size === 'lg' ? 'px-4 py-2.5' : size === 'md' ? 'px-3 py-1.5' : 'px-2 py-0.5'
  return (
    <span
      className={`inline-flex items-baseline gap-2 rounded-lg border ${pad} ${SOFT[band.level]} ${TEXT[band.level]}`}
      title="Migration difficulty, from 0 (trivial) to 100"
    >
      <span className={`font-mono leading-none font-bold tabular-nums ${number}`}>{score}</span>
      <span
        className={`font-semibold tracking-wide uppercase ${size === 'sm' ? 'text-[0.625rem]' : 'text-xs'}`}
      >
        {band.label}
      </span>
      <span className="sr-only">migration difficulty out of 100</span>
    </span>
  )
}

export function OpennessBadge({ openness }: { openness: Openness }) {
  const { label, tone, meaning } = OPENNESS_LABELS[openness]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${SOFT[tone]} ${TEXT[tone]}`}
      title={meaning}
    >
      {label}
    </span>
  )
}

export function Tag({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-line bg-sunken px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted"
      title={title}
    >
      {children}
    </span>
  )
}

const SUPPORT_STYLE: Record<Support, { icon: ReactNode; className: string }> = {
  yes: { icon: <IconCheck />, className: 'text-level-1' },
  partial: { icon: <IconPartial />, className: 'text-level-3' },
  addon: { icon: <IconPlus />, className: 'text-level-2' },
  no: { icon: <IconX />, className: 'text-faint' },
}

export function SupportMark({ support, note }: { support: Support; note?: string }) {
  const { icon, className } = SUPPORT_STYLE[support]
  return (
    <div>
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${className}`}>
        <span className="text-base">{icon}</span>
        {SUPPORT_LABELS[support]}
      </span>
      {note && <p className="mt-0.5 text-xs leading-snug text-muted">{note}</p>}
    </div>
  )
}

export function ExternalLink({
  href,
  children,
  className = 'link',
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <IconExternal className="ml-1 inline-block align-[-0.1em] text-[0.9em] opacity-70" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/** A bulleted list with ✓ or ✕ markers, for "what transfers" and "what is lost". */
export function MarkedList({ items, kind }: { items: string[]; kind: 'good' | 'bad' | 'neutral' }) {
  const marker =
    kind === 'good' ? (
      <IconCheck className="text-level-1" />
    ) : kind === 'bad' ? (
      <IconX className="text-level-5" />
    ) : (
      <span className="mt-[0.45em] ml-1 block size-1.5 rounded-full bg-faint" />
    )
  return (
    <ul className="prose-list text-sm">
      {items.map((item) => (
        <li key={item}>
          <span className="absolute top-[0.2em] left-0 text-base" aria-hidden="true">
            {marker}
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export function Callout({
  title,
  children,
  tone = 3,
}: {
  title: string
  children: ReactNode
  tone?: number
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${SOFT[tone]}`}>
      <p className={`font-semibold ${TEXT[tone]}`}>{title}</p>
      <div className="mt-1 text-ink">{children}</div>
    </div>
  )
}

export function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} steps done`}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  )
}
