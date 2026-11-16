import { useId, useRef, useState } from 'react'
import { clearEverything, exportData, importData } from '../lib/storage.ts'
import { ConfirmButton } from './ConfirmButton.tsx'

const button = 'btn'

/** Export, import and erase what the app has stored in this browser. */
export function DataControls() {
  const fileInput = useRef<HTMLInputElement>(null)
  const exportBox = useRef<HTMLTextAreaElement>(null)
  const exportId = useId()
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  // The export as text, shown after exporting. A download cannot be confirmed
  // from script and is blocked outright in sandboxed frames and some webviews,
  // so the text is always offered as a second way to take the data away.
  const [exported, setExported] = useState<string | null>(null)

  function download() {
    const text = JSON.stringify(exportData(), null, 2)
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `exitpath-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      // No download here; the text below is the export.
    }
    setExported(text)
    setMessage({
      tone: 'ok',
      text: 'A download should have started. If no file was saved, copy the text below and keep it in a .json file.',
    })
  }

  async function copy() {
    if (exported === null) return
    try {
      await navigator.clipboard.writeText(exported)
      setMessage({ tone: 'ok', text: 'Copied to the clipboard.' })
    } catch {
      exportBox.current?.select()
      setMessage({ tone: 'ok', text: 'The text is selected. Copy it with Ctrl+C, or ⌘C on a Mac.' })
    }
  }

  async function upload(file: File) {
    try {
      const { guides } = importData(await file.text())
      setMessage({
        tone: 'ok',
        text: `Imported progress for ${guides} ${guides === 1 ? 'guide' : 'guides'}, replacing what was here.`,
      })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'That file could not be read.',
      })
    }
  }

  function erase() {
    clearEverything()
    setExported(null)
    setMessage({ tone: 'ok', text: 'Everything stored by ExitPath in this browser has been erased.' })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={button} onClick={download}>
          Export my data
        </button>
        <button type="button" className={button} onClick={() => fileInput.current?.click()}>
          Import from a file
        </button>
        <ConfirmButton
          className={button}
          label="Erase everything"
          question="Erase all progress, notes and settings?"
          confirmLabel="Yes, erase"
          onConfirm={erase}
        />
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose an ExitPath export file to import"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = '' // allow choosing the same file again
          }}
        />
      </div>
      <p
        role="status"
        className={`mt-2 min-h-5 text-sm ${message?.tone === 'error' ? 'text-danger' : 'text-muted'}`}
      >
        {message?.text}
      </p>
      {exported !== null && (
        <div className="mt-3">
          <label htmlFor={exportId} className="eyebrow">
            Your data as text
          </label>
          <textarea
            ref={exportBox}
            id={exportId}
            readOnly
            value={exported}
            rows={6}
            spellCheck={false}
            onFocus={(event) => event.target.select()}
            className="field mt-1.5 block w-full p-3 font-mono text-xs"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => void copy()}>
              Copy the text
            </button>
            <button type="button" className={button} onClick={() => setExported(null)}>
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
