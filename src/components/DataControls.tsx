import { useRef, useState } from 'react'
import { clearEverything, exportData, importData } from '../lib/storage.ts'

const button =
  'inline-flex items-center justify-center rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50'

/** Export, import and erase what the app has stored in this browser. */
export function DataControls() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  function download() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exitpath-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: 'Saved a copy of your progress and settings.' })
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
    if (!window.confirm('Erase all checklist progress, notes and settings stored in this browser?')) return
    clearEverything()
    setMessage({ tone: 'ok', text: 'Everything stored by ExitPath in this browser has been erased.' })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} onClick={download}>
          Export my data
        </button>
        <button type="button" className={button} onClick={() => fileInput.current?.click()}>
          Import from a file
        </button>
        <button type="button" className={button} onClick={erase}>
          Erase everything
        </button>
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
        className={`mt-2 min-h-5 text-sm ${message?.tone === 'error' ? 'text-level-5' : 'text-muted'}`}
      >
        {message?.text}
      </p>
    </div>
  )
}
