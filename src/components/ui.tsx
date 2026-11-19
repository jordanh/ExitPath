import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Openness, Support } from '../catalog/schema.ts'
import { OPENNESS_LABELS, SCALES, SUPPORT_LABELS, type ScaleId } from '../lib/scales.ts'
import type { BANDS } from '../lib/scoring.ts'
import { GradeMark, IconCheck, IconExternal, IconPartial, IconPlus, IconUnknown, IconX } from './icons.tsx'

// Tailwind only generates classes it can see as whole strings, so the
// level-to-class lookups are spelled out rather than built by concatenation.
const TEXT = ['', 'text-level-1', 'text-level-2', 'text-level-3', 'text-level-4', 'text-danger']

export function Page({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div
      className={`mx-auto w-full px-4 pt-10 pb-24 sm:px-6 sm:pt-14 ${narrow ? 'max-w-3xl' : 'max-w-[68rem]'}`}
    >
      {children}
    </div>
  )
}

/** A part of a page: a hairline, a heading, and whatever follows. */
export function Section({
  title,
  intro,
  children,
  aside,
}: {
  title: string
  intro?: ReactNode
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="mt-14 border-t border-line pt-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="max-w-2xl">
          <h2 className="text-[1.55rem] leading-tight font-extrabold">{title}</h2>
          {intro && <p className="mt-1 text-muted">{intro}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

/**
 * A line in an index, as in a guidebook: the name, a row of dots, and what
 * you will find there. The whole line is the link's target, but only the
 * name is its accessible name.
 */
export function IndexRow({
  to,
  title,
  detail,
  end,
  detailOnPhone = true,
}: {
  to: string
  title: ReactNode
  detail?: ReactNode
  end?: ReactNode
  /** Off for long lists: on a phone the name and what is at the end are enough, and the page for it has the rest. */
  detailOnPhone?: boolean
}) {
  return (
    <div className="group relative py-2 max-sm:py-2.5">
      {/* A long name wraps inside its own space, so what is at the end stays on the first line. */}
      <div className="flex items-baseline gap-x-2">
        <Link
          to={to}
          className="min-w-0 text-[1.15rem] leading-tight font-bold text-accent group-hover:underline after:absolute after:inset-0"
        >
          {title}
        </Link>
        {/* On a phone the dots give way entirely before a name has to wrap. */}
        <span className="leader max-sm:min-w-0 max-sm:basis-0" aria-hidden="true" />
        {end && <span className="shrink-0">{end}</span>}
      </div>
      {detail && <div className={`text-muted ${detailOnPhone ? '' : 'max-sm:hidden'}`}>{detail}</div>}
    </div>
  )
}

/**
 * A 1–5 rating, shown as the word it stands for ("Maturity: Mature"). The
 * tooltip lists the whole scale, so the word can be placed on it.
 */
export function Rating({
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
  return (
    <span title={`Scale: ${SCALES[scale].labels.join(', ')}`}>
      {label && <span className="label mr-1.5">{label}</span>}
      {word ?? SCALES[scale].labels[level - 1]}
    </span>
  )
}

/**
 * Migration difficulty as a trail grade: a shape and a word. The 0–100 score
 * behind it is deliberately not shown here; it only appears where its
 * breakdown is shown too, so nobody mistakes it for a measurement.
 */
export function ScoreBadge({ band, size = 'md' }: { band: (typeof BANDS)[number]; size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <GradeMark
        level={band.level}
        className={`shrink-0 ${size === 'md' ? 'text-[0.95rem]' : 'text-[0.8rem]'}`}
      />
      <span className={`font-bold ${size === 'md' ? 'text-lg' : ''}`}>{band.label}</span>
      <span className="sr-only">to move</span>
    </span>
  )
}

/** How open a project really is: a filled, half-filled or hollow mark, and the words. */
export function OpennessBadge({ openness }: { openness: Openness }) {
  const { label, tone, meaning } = OPENNESS_LABELS[openness]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title={meaning}>
      <svg viewBox="0 0 12 12" className={`size-[0.7rem] shrink-0 ${TEXT[tone]}`} aria-hidden="true">
        <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        {openness === 'open-source' && <circle cx="6" cy="6" r="4.6" fill="currentColor" />}
        {openness === 'open-core' && <path d="M6 1.4a4.6 4.6 0 0 1 0 9.2Z" fill="currentColor" />}
      </svg>
      {label}
    </span>
  )
}

/** A small fact set beside a name, such as a licence. */
export function Tag({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span className="text-muted" title={title}>
      {children}
    </span>
  )
}

const SUPPORT_STYLE: Record<Support, { icon: ReactNode; className: string }> = {
  yes: { icon: <IconCheck />, className: 'text-level-1' },
  partial: { icon: <IconPartial />, className: 'text-level-3' },
  addon: { icon: <IconPlus />, className: 'text-level-2' },
  no: { icon: <IconX />, className: 'text-faint' },
  unknown: { icon: <IconUnknown />, className: 'text-faint' },
}

export function SupportMark({ support, note }: { support: Support; note?: string }) {
  const { icon, className } = SUPPORT_STYLE[support]
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1.5 font-medium ${support === 'no' || support === 'unknown' ? 'text-muted' : ''}`}
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
      <span className="mt-[0.5em] ml-1 block size-[0.4rem] rounded-full bg-faint" />
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

/** Something to read before going further, marked with a line in the route colour. */
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-l-2 border-line-strong pl-4">
      <p className="font-bold">{title}</p>
      <div className="mt-0.5 text-muted">{children}</div>
    </div>
  )
}

/** How far through a checklist someone is: the browser's own progress bar. */
export function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <progress
      className="block h-2 w-full"
      value={done}
      max={Math.max(total, 1)}
      aria-label={label}
      aria-valuetext={`${done} of ${total} steps done`}
    />
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-4">
      <p className="text-xl font-bold">{title}</p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  )
}
