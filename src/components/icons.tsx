import type { SVGProps } from 'react'
import { windingPath } from '../lib/contours.ts'

type IconProps = SVGProps<SVGSVGElement>

/*
 * Icons are drawn with a soft pen: every line has a slight bow to it, so
 * they sit with the hand-cut shapes and the type rather than with a UI kit.
 */
function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
    <path d="M2.2 8.5c3.3-.9 6.8-1 10.9-.4M9.5 4.3c1.2 1.6 2.4 2.8 3.8 3.8-1.4.9-2.6 2.2-3.6 3.8" />
  </Svg>
)

export const IconExternal = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 3.8c-.9 0-1.7 0-2.4.1-.1 2.8-.1 5.6 0 8.5 2.9.1 5.7.1 8.6 0 .1-.7.1-1.4.1-2.2M8.8 3.5c1.4.2 2.6.3 3.9.2-.1 1.3 0 2.6.2 3.9M12.4 3.9C10.5 5.7 8.9 7.3 7.3 9.1" />
  </Svg>
)

export const IconCheck = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 8.7c1.2 1 2.2 2 3.1 3.2 1.7-3 3.8-5.6 6.9-7.9" />
  </Svg>
)

export const IconX = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 4.2c2.6 2.3 5.2 4.9 7.9 7.7M12.1 4c-2.7 2.5-5.3 5.2-8 8.1" />
  </Svg>
)

export const IconPartial = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8.1 2.8c3.1-.1 5.3 2.2 5.2 5.3-.1 2.9-2.3 5.1-5.3 5.1-3-.1-5.2-2.3-5.2-5.3.1-2.8 2.3-5 5.3-5.1Z" />
    <path d="M8.1 2.8c3.1-.1 5.3 2.2 5.2 5.3-.1 2.9-2.3 5.1-5.3 5.1Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconPlus = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8 3.3c-.1 3.1 0 6.2.1 9.4M3.3 8.1c3.1-.2 6.2-.2 9.4 0" />
  </Svg>
)

export const IconSearch = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 2.7c2.5-.1 4.4 1.8 4.4 4.3S9.5 11.3 7 11.3 2.6 9.5 2.7 7c0-2.4 1.9-4.2 4.3-4.3ZM10.2 10.2c1.1 1 2.2 2.1 3.3 3.3" />
  </Svg>
)

export const IconSun = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="2.7" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
  </Svg>
)

export const IconMoon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M13.2 9.7A5.6 5.6 0 0 1 6.3 2.8a5.6 5.6 0 1 0 6.9 6.9Z" />
  </Svg>
)

export const IconSystem = (props: IconProps) => (
  <Svg {...props}>
    <path d="M2.3 3.3c3.8-.2 7.6-.2 11.4 0 .1 2.5.1 5 0 7.5-3.8.2-7.6.2-11.4 0-.1-2.5-.1-5 0-7.5ZM5.8 13.4c1.5-.1 2.9-.1 4.4 0" />
  </Svg>
)

/**
 * The ExitPath waymark: a dab of paint on a rock, with an arrow pointing the
 * way out. The dab is deliberately not a circle.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path
        d="M17.2 1.6c6.6.3 12.5 4.7 13.3 11.6.9 7.4-3.4 14.8-10.7 16.8-6.8 1.9-14.9-.7-17.7-7.5C-.8 15.4 2 7 8.5 3.4c2.7-1.4 5.7-2 8.7-1.8Z"
        fill="var(--accent)"
      />
      <path
        d="M7.8 17.3c4.5-1.6 9.4-2 14.6-1.3M17.6 10.3c1.6 2.3 3.3 4.1 5.5 5.6-2.2 1.4-4 3.3-5.3 5.8"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const GRADE_FILL = ['', 'fill-level-1', 'fill-level-2', 'fill-level-3', 'fill-level-4', 'fill-level-5']

/**
 * A trail grade: circle, square, triangle, diamond, double diamond. The
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
        <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="1.8" className={fill} />
      ) : level === 3 ? (
        <path
          d="M8 2.2c.5 0 .9.3 1.2.8l5 8.7c.5.9-.1 2-1.2 2H3c-1.1 0-1.7-1.1-1.2-2l5-8.7c.3-.5.7-.8 1.2-.8Z"
          className={fill}
        />
      ) : (
        <path d="M8 1.3 14.7 8 8 14.7 1.3 8Z" className={fill} strokeLinejoin="round" />
      )}
    </svg>
  )
}

/**
 * A stretch of trail drawn between a tool and where it leads. Purely
 * decorative: it winds more as the grade rises, and the grade is always
 * stated in words beside it.
 */
export function RouteLine({ grade, className }: { grade: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 16"
      width="4em"
      height="1em"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={windingPath(55, 8, grade)} strokeWidth="1.6" strokeDasharray="3.5 3" />
      <path d="M53.5 4.2c1.5 1.5 2.9 2.7 4.6 3.8-1.7 1-3.1 2.3-4.4 3.9" strokeWidth="1.7" />
    </svg>
  )
}
