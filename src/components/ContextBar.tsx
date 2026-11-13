import { useId } from 'react'
import { HOSTING, TEAM_SIZES, type HostingPreference, type TeamSize } from '../lib/scoring.ts'
import { setPrefs, usePrefs } from '../lib/storage.ts'

function Segmented<T extends string>({
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
      <div className="inline-flex max-w-full rounded-lg border border-line bg-sunken p-0.5">
        {options.map((option) => (
          <label
            key={option.value}
            title={option.hint}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-ink has-checked:bg-surface has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
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
    <div className="card flex flex-wrap items-end gap-x-8 gap-y-4 px-4 py-3.5 sm:px-5">
      <Segmented<TeamSize>
        legend="Who is moving?"
        value={teamSize}
        onChange={(value) => setPrefs({ teamSize: value })}
        options={(Object.keys(TEAM_SIZES) as TeamSize[]).map((key) => ({ value: key, ...TEAM_SIZES[key] }))}
      />
      <Segmented<HostingPreference>
        legend="Who runs the servers?"
        value={hosting}
        onChange={(value) => setPrefs({ hosting: value })}
        options={(Object.keys(HOSTING) as HostingPreference[]).map((key) => ({
          value: key,
          ...HOSTING[key],
        }))}
      />
      <p className="min-w-[14rem] flex-1 text-sm text-muted">
        Scores and time estimates below follow these two answers. They are remembered on this device.
      </p>
    </div>
  )
}
