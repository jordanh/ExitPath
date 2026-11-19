import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/* Plain line icons on a 16-unit grid, sized by the surrounding text. */
function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconArrowRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Svg>
)

export const IconExternal = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5" />
  </Svg>
)

export const IconCheck = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </Svg>
)

export const IconX = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Svg>
)

export const IconPartial = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="5.25" />
    <path d="M8 2.75a5.25 5.25 0 0 1 0 10.5Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconPlus = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Svg>
)

export const IconUnknown = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="5.25" strokeDasharray="2 2.2" />
  </Svg>
)

export const IconSearch = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="M10.2 10.2 13.5 13.5" />
  </Svg>
)

/** Three sliders: the options. */
export const IconOptions = (props: IconProps) => (
  <Svg {...props}>
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    <circle cx="10.5" cy="4.5" r="1.5" fill="var(--bg)" />
    <circle cx="5.5" cy="8" r="1.5" fill="var(--bg)" />
    <circle cx="9" cy="11.5" r="1.5" fill="var(--bg)" />
  </Svg>
)

/** A small chevron; it turns when the section it belongs to is open. */
export const IconChevron = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </Svg>
)

/** The ExitPath mark: an arrow leaving a circle. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="var(--accent)" />
      <path
        d="M8.5 16h14M17 10.5l5.5 5.5-5.5 5.5"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const GRADE_FILL = ['', 'fill-level-1', 'fill-level-2', 'fill-level-3', 'fill-level-4', 'fill-level-5']

/**
 * A difficulty grade: circle, square, triangle, diamond, double diamond. The
 * shape carries the grade as much as the colour does, so it reads without
 * colour vision and in print.
 */
export function GradeMark({ level, className }: { level: number; className?: string }) {
  const fill = GRADE_FILL[level] ?? GRADE_FILL[3]
  if (level >= 5) {
    return (
      <svg
        viewBox="0 0 26 16"
        className={className}
        width="1.625em"
        height="1em"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M7.3 1.5 13.3 8 7.3 14.5 1.3 8ZM18.7 1.5 24.7 8 18.7 14.5 12.7 8Z" className={fill} />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >
      {level <= 1 ? (
        <circle cx="8" cy="8" r="6.3" className={fill} />
      ) : level === 2 ? (
        <rect x="2.2" y="2.2" width="11.6" height="11.6" className={fill} />
      ) : level === 3 ? (
        <path d="M8 2 14.5 13.5H1.5Z" className={fill} />
      ) : (
        <path d="M8 1.3 14.7 8 8 14.7 1.3 8Z" className={fill} />
      )}
    </svg>
  )
}
