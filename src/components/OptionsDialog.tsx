import { useEffect, useId, useRef } from 'react'
import { closeOptions, openOptions, useOptionsOpen } from '../lib/options-dialog.ts'
import { HOSTING, TEAM_SIZES, type HostingPreference, type TeamSize } from '../lib/scoring.ts'
import {
  HOURS_PER_WEEK,
  setPrefs,
  usePrefs,
  type Licences,
  type TextSize,
  type Theme,
} from '../lib/storage.ts'
import { DataControls } from './DataControls.tsx'
import { Disclosure } from './Disclosure.tsx'
import { IconOptions, IconX } from './icons.tsx'

function Choice<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset className="min-w-0">
      <legend className="eyebrow mb-1.5">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <label key={option.value} title={option.hint} className="chip">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
            {option.hint && <span className="sr-only"> ({option.hint})</span>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Match my device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
]

const LICENCES: { value: Licences; label: string; hint: string }[] = [
  { value: 'any', label: 'Any licence', hint: 'Show open-core and source-available projects too' },
  { value: 'open', label: 'Open source only', hint: 'Leave out open-core and source-available projects' },
]

/**
 * The header's options button and the dialog it opens: the reader's
 * situation (which changes every grade and estimate), how the page looks,
 * and what is stored on this device. Also applies the look to the page.
 */
export function OptionsDialog() {
  const open = useOptionsOpen()
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { teamSize, hosting, licences, hoursPerWeek, theme, textSize } = usePrefs()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    if (textSize === 'large') root.dataset.text = 'large'
    else delete root.dataset.text
  }, [theme, textSize])

  // The native dialog brings the focus trap, Escape to close and the backdrop.
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const isOpen = element.hasAttribute('open')
    if (open && !isOpen) {
      if (typeof element.showModal === 'function') element.showModal()
      else element.setAttribute('open', '')
    } else if (!open && isOpen) {
      if (typeof element.close === 'function') element.close()
      else element.removeAttribute('open')
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={openOptions}
        aria-label="Options"
        title="Options"
        className="icon-button"
      >
        <IconOptions />
      </button>

      {/* A click on the dialog element itself is a click on the backdrop: the panel inside covers the rest. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- Escape already closes it */}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={closeOptions}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeOptions()
        }}
        className="panel mt-[8vh] max-h-[84vh] w-[min(34rem,calc(100vw-2rem))]"
      >
        {/* Mounted only while open, so a closed dialog adds nothing to the page. */}
        {open && (
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-[1.6rem] leading-tight font-extrabold">
                  Options
                </h2>
                <p className="text-muted">Remembered on this device, and nowhere else.</p>
              </div>
              <button
                type="button"
                onClick={closeOptions}
                aria-label="Close options"
                className="icon-button -mt-1 -mr-2"
              >
                <IconX />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Choice<TeamSize>
                legend="Who is moving?"
                value={teamSize}
                onChange={(value) => setPrefs({ teamSize: value })}
                options={(Object.keys(TEAM_SIZES) as TeamSize[]).map((key) => ({
                  value: key,
                  ...TEAM_SIZES[key],
                }))}
              />
              <Choice<HostingPreference>
                legend="Who runs the servers?"
                value={hosting}
                onChange={(value) => setPrefs({ hosting: value })}
                options={(Object.keys(HOSTING) as HostingPreference[]).map((key) => ({
                  value: key,
                  ...HOSTING[key],
                }))}
              />
              <Choice<Licences>
                legend="Which licences?"
                value={licences}
                onChange={(value) => setPrefs({ licences: value })}
                options={LICENCES}
              />
              <Choice
                legend="Time you can give each week"
                value={String(hoursPerWeek)}
                onChange={(value) => setPrefs({ hoursPerWeek: Number(value) })}
                options={HOURS_PER_WEEK.map((hours) => ({ value: String(hours), label: `${hours} hours` }))}
              />
            </div>

            <div className="mt-6 space-y-4 border-t border-line pt-5">
              <Choice<Theme>
                legend="Colours"
                value={theme}
                onChange={(value) => setPrefs({ theme: value })}
                options={THEMES}
              />
              <Choice<TextSize>
                legend="Text size"
                value={textSize}
                onChange={(value) => setPrefs({ textSize: value })}
                options={TEXT_SIZES}
              />
            </div>

            <div className="mt-6 border-t border-line pt-4">
              <Disclosure summary="Your data" hint="Export, import or erase it">
                <DataControls />
              </Disclosure>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
