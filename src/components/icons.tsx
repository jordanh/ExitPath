import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

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
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </Svg>
)

export const IconExternal = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7 9" />
  </Svg>
)

export const IconCheck = (props: IconProps) => (
  <Svg {...props}>
    <path d="m3 8.5 3.2 3.2L13 4.8" />
  </Svg>
)

export const IconX = (props: IconProps) => (
  <Svg {...props}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Svg>
)

export const IconPartial = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="5.2" />
    <path d="M8 2.8a5.2 5.2 0 0 1 0 10.4Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconPlus = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="5.2" />
    <path d="M8 5.6v4.8M5.6 8h4.8" />
  </Svg>
)

export const IconSearch = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="7" cy="7" r="4.2" />
    <path d="m10.2 10.2 3.3 3.3" />
  </Svg>
)

export const IconSun = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="8" cy="8" r="2.6" />
    <path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" />
  </Svg>
)

export const IconMoon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />
  </Svg>
)

export const IconSystem = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2" y="3" width="12" height="8" rx="1.2" />
    <path d="M6 13.5h4" />
  </Svg>
)

/** The ExitPath mark: a doorway with an arrow leaving it. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      <path
        d="M13 8H9.5A1.5 1.5 0 0 0 8 9.5v13A1.5 1.5 0 0 0 9.5 24H13"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M14 16h10m-4.2-4.6L24.4 16l-4.6 4.6"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
