import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

const choice = 'cursor-pointer rounded-leaf border-[1.5px] px-3 py-0.5 font-bold'

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

  // Escape answers "no". Stopped here so that, inside a dialog, it does not
  // also close the dialog the question was asked in.
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    setAsking(false)
  }

  if (!asking) {
    return (
      <button ref={trigger} type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    )
  }

  return (
    <span role="group" aria-label={question} className="inline-flex flex-wrap items-center gap-2">
      <span className="font-medium">{question}</span>
      <button
        type="button"
        className={`${choice} border-danger bg-danger text-surface hover:opacity-90`}
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
        className={`${choice} border-ink hover:bg-ink hover:text-bg`}
        onKeyDown={closeOnEscape}
        onClick={() => setAsking(false)}
      >
        Cancel
      </button>
    </span>
  )
}
