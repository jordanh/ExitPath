import type { ReactNode } from 'react'
import type { Openness, Support } from '../catalog/schema.ts'
import { OPENNESS_LABELS, SCALES, SUPPORT_LABELS, toneFor, type ScaleId } from '../lib/scales.ts'
import type { BANDS } from '../lib/scoring.ts'
import { GradeMark, IconCheck, IconExternal, IconPartial, IconPlus, IconX } from './icons.tsx'

// Tailwind only generates classes it can see as whole strings, so the
// level-to-class lookups are spelled out rather than built by concatenation.
const TEXT = ['', 'text-level-1', 'text-level-2', 'text-level-3', 'text-level-4', 'text-danger']
const FILL = ['', 'bg-level-1', 'bg-level-2', 'bg-level-3', 'bg-level-4', 'bg-danger']

export function Page({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto w-full px-4 pt-8 pb-24 sm:px-6 sm:pt-12 ${narrow ? 'max-w-3xl' : 'max-w-6xl'}`}>
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
    <section className="mt-16 first:mt-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h2 className="text-[1.7rem] leading-[1.15] font-extrabold sm:text-[2.1rem]">{title}</h2>
          {intro && <p className="mt-2 text-lg text-muted">{intro}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

/**
 * A 1–5 rating, drawn like a map legend: five dots, the filled ones in the
 * grade's colour, and the word beside them in ink. The colour never carries
 * the rating alone: the count and the word say the same thing.
 */
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
      {label && <div className="eyebrow mb-0.5">{label}</div>}
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 gap-[3px]" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((dot) => (
            <span
              key={dot}
              className={`size-[0.56rem] rounded-leaf ${dot <= level ? FILL[tone] : 'border-[1.5px] border-line-strong'}`}
            />
          ))}
        </span>
        <span className="leading-tight font-medium">{word ?? SCALES[scale].labels[level - 1]}</span>
        <span className="sr-only">
          ({level} out of 5{label ? ` for ${label.toLowerCase()}` : ''})
        </span>
      </div>
    </div>
  )
}

/**
 * Migration difficulty as a trail grade: the shape and its colour give the
 * band, the number gives the score, and the band is named in words.
 */
export function ScoreBadge({
  score,
  band,
  size = 'md',
}: {
  score: number
  band: (typeof BANDS)[number]
  size?: 'sm' | 'md' | 'lg'
}) {
  const number = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-[2rem]' : 'text-xl'
  const mark = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-[0.8rem]'
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap"
      title="Migration difficulty, from 0 (trivial) to 100"
    >
      <GradeMark level={band.level} className={`shrink-0 ${mark}`} />
      <span className={`figures font-display leading-none font-black ${number}`}>{score}</span>
      <span className={`eyebrow text-ink ${size === 'sm' ? 'text-[0.8rem]' : ''}`}>{band.label}</span>
      <span className="sr-only">migration difficulty out of 100</span>
    </span>
  )
}

/** How open a project really is: a filled, half-filled or hollow mark, and the words. */
export function OpennessBadge({ openness }: { openness: Openness }) {
  const { label, tone, meaning } = OPENNESS_LABELS[openness]
  return (
    <span className="eyebrow inline-flex items-center gap-1.5 whitespace-nowrap text-ink" title={meaning}>
      <svg viewBox="0 0 12 12" className={`size-[0.7rem] shrink-0 ${TEXT[tone]}`} aria-hidden="true">
        <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        {openness === 'open-source' && <circle cx="6" cy="6" r="4.6" fill="currentColor" />}
        {openness === 'open-core' && <path d="M6 1.4a4.6 4.6 0 0 1 0 9.2Z" fill="currentColor" />}
      </svg>
      {label}
    </span>
  )
}

/** A small paper label, for facts such as a licence name. */
export function Tag({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-stone bg-sunken px-2 py-px text-[0.85rem] font-medium whitespace-nowrap text-muted"
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
      <span
        className={`inline-flex items-center gap-1.5 font-medium ${support === 'no' ? 'text-muted' : ''}`}
      >
        <span className={`text-[1.05rem] ${className}`}>{icon}</span>
        {SUPPORT_LABELS[support]}
      </span>
      {note && <p className="mt-0.5 text-sm leading-snug text-muted">{note}</p>}
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
      <IconExternal className="ml-1 inline-block align-[-0.1em] text-[0.85em] text-accent print:hidden" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/** A list marked with ticks, crosses or plain dots: what transfers, what is lost, what to watch. */
export function MarkedList({ items, kind }: { items: string[]; kind: 'good' | 'bad' | 'neutral' }) {
  const marker =
    kind === 'good' ? (
      <IconCheck className="text-level-1" />
    ) : kind === 'bad' ? (
      <IconX className="text-danger" />
    ) : (
      <span className="mt-[0.5em] ml-1 block size-[0.4rem] rounded-leaf bg-contour" />
    )
  return (
    <ul className="prose-list">
      {items.map((item) => (
        <li key={item}>
          <span className="absolute top-[0.2em] left-0 text-[1.05rem]" aria-hidden="true">
            {marker}
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

/** A note pinned to the page: something to read before going further. */
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
    <div className="flex gap-3 rounded-stone border-[1.5px] border-dashed border-line-strong bg-bg px-4 py-3">
      <GradeMark level={tone} className="mt-1 shrink-0 text-[0.95rem]" />
      <div>
        <p className="font-display text-xl font-extrabold">{title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  )
}

/**
 * Progress as a walked trail: the part behind you is a solid line, the part
 * ahead is dashed, and a marker shows where you are.
 */
export function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    // Drawn as SVG so the position is an attribute, not an inline style: the
    // site's content security policy allows no inline styles at all.
    <div className="px-[0.4rem]">
      <svg
        className="block h-3.5 w-full overflow-visible"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} steps done`}
      >
        <line
          x1="0"
          x2="100%"
          y1="50%"
          y2="50%"
          className="stroke-line-strong"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 6"
        />
        <line
          x1="0"
          x2={`${percent}%`}
          y1="50%"
          y2="50%"
          className="stroke-accent"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={`${percent}%`} cy="50%" r="5" className="fill-accent stroke-surface" strokeWidth="2" />
      </svg>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-pebble border-[1.5px] border-dashed border-line-strong px-6 py-12 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  )
}
