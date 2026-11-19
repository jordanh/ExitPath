import { useId } from 'react'

/** A small set of mutually exclusive options, shown all at once as toggles. */
export function Choice<T extends string>({
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
