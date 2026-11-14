import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

const choice = 'cursor-pointer rounded-md border px-2.5 py-1 text-sm font-semibold'

/**
 * A destructive action that asks "are you sure?" inside the page.
 *
 * window.confirm() is not available everywhere this app can run: sandboxed
 * frames and desktop webviews return false without showing anything, which
 * would leave the button silently dead.
 */
export function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
  className,
}: {
  label: string
  question: string
  confirmLabel: string
  onConfirm: () => void
  className?: string
}) {
  const [asking, setAsking] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const wasAsking = useRef(false)

  // Keep keyboard focus with the control as it swaps: on the safe answer
  // while asking, back on the button afterwards.
  useEffect(() => {
    if (asking) cancel.current?.focus()
    else if (wasAsking.current) trigger.current?.focus()
    wasAsking.current = asking
  }, [asking])

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setAsking(false)
  }

  if (!asking) {
    return (
      <button ref={trigger} type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    )
  }

  return (
    <span
      role="group"
      aria-label={question}
      className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-level-5/30 bg-level-5/10 px-3 py-1.5 text-sm"
    >
      <span className="font-medium">{question}</span>
      <button
        type="button"
        className={`${choice} border-level-5 bg-level-5 text-surface hover:opacity-90`}
        onKeyDown={closeOnEscape}
        onClick={() => {
          setAsking(false)
          onConfirm()
        }}
      >
        {confirmLabel}
      </button>
      <button
        ref={cancel}
        type="button"
        className={`${choice} border-line-strong bg-surface hover:border-accent hover:text-accent`}
        onKeyDown={closeOnEscape}
        onClick={() => setAsking(false)}
      >
        Cancel
      </button>
    </span>
  )
}
