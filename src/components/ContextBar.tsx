import { useId } from 'react'
import { HOSTING, TEAM_SIZES, type HostingPreference, type TeamSize } from '../lib/scoring.ts'
import { setPrefs, usePrefs } from '../lib/storage.ts'

function Choice<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string
  value: T
  options: { value: T; label: string; hint: string }[]
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
            <span className="sr-only"> ({option.hint})</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * "Your situation": the two answers that change every difficulty score and
 * effort estimate on the page. Stored locally and shared across pages.
 */
export function ContextBar() {
  const { teamSize, hosting } = usePrefs()
  return (
    <div className="flex flex-wrap items-end gap-x-10 gap-y-4 rounded-pebble bg-sunken px-5 py-4 sm:px-7">
      <Choice<TeamSize>
        legend="Who is moving?"
        value={teamSize}
        onChange={(value) => setPrefs({ teamSize: value })}
        options={(Object.keys(TEAM_SIZES) as TeamSize[]).map((key) => ({ value: key, ...TEAM_SIZES[key] }))}
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
      <p className="min-w-[14rem] flex-1 text-muted">
        Grades and time estimates follow these two answers. They are remembered on this device.
      </p>
    </div>
  )
}
