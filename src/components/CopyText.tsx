import { useId, useRef, useState } from 'react'

/**
 * Copies some text to the clipboard. Where the clipboard is not available
 * (some embedded views refuse it), the text is shown instead, selected and
 * ready to copy by hand, so the button is never a dead end.
 */
export function CopyText({ label, getText }: { label: string; getText: () => string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const [text, setText] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)
  const boxId = useId()

  async function copy() {
    const value = getText()
    try {
      await navigator.clipboard.writeText(value)
      setState('copied')
      window.setTimeout(() => setState((current) => (current === 'copied' ? 'idle' : current)), 2500)
    } catch {
      setText(value)
      setState('manual')
      window.setTimeout(() => box.current?.select(), 0)
    }
  }

  return (
    <>
      <button type="button" onClick={() => void copy()} className="link cursor-pointer">
        {state === 'copied' ? 'Copied' : label}
      </button>
      <span role="status" className="sr-only">
        {state === 'copied' ? 'Copied to the clipboard.' : ''}
      </span>
      {state === 'manual' && (
        <span className="mt-2 block w-full">
          <label htmlFor={boxId} className="eyebrow">
            Select and copy
          </label>
          <textarea
            ref={box}
            id={boxId}
            readOnly
            value={text}
            rows={6}
            className="field mt-1 block w-full p-3 font-mono text-xs"
          />
        </span>
      )}
    </>
  )
}
