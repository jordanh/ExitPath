import { useState, type ReactNode } from 'react'
import { IconChevron } from './icons.tsx'

/**
 * A section that stays folded until asked for. Built on <details>, so it
 * works without script, opens with the keyboard and prints open or closed
 * as the reader left it.
 */
export function Disclosure({
  summary,
  hint,
  children,
  defaultOpen = false,
  open,
  onToggle,
}: {
  summary: string
  /** A few muted words after the summary, such as a rating. */
  hint?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  /** Set together with onToggle when the page needs to open or close it itself. */
  open?: boolean
  onToggle?: (open: boolean) => void
}) {
  // Without `open`, only the first value is used: after that the reader is in charge of it.
  const [initiallyOpen] = useState(defaultOpen)
  return (
    <details
      className="group"
      open={open ?? initiallyOpen}
      onToggle={onToggle && ((event) => onToggle(event.currentTarget.open))}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-2 py-1.5 [&::-webkit-details-marker]:hidden">
        <IconChevron className="shrink-0 translate-y-[0.12em] text-[0.9em] text-accent transition-transform group-open:rotate-90" />
        <span className="font-bold decoration-accent decoration-[1.5px] underline-offset-4 group-hover:underline">
          {summary}
        </span>
        {hint && <span className="text-muted">{hint}</span>}
      </summary>
      <div className="pt-3 pb-4 sm:pl-6">{children}</div>
    </details>
  )
}
