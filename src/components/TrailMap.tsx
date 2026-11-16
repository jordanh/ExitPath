import { hillRings, type Hill } from '../lib/contours.ts'

const HILLS: Hill[] = [
  { cx: 430, cy: 255, radius: 215, rings: 9, seed: 7, stretch: 1.12 },
  { cx: 150, cy: 430, radius: 150, rings: 6, seed: 21 },
  { cx: 575, cy: 520, radius: 120, rings: 5, seed: 4, stretch: 1.25 },
  { cx: 70, cy: 110, radius: 105, rings: 4, seed: 33 },
]

// Computed once: the drawing never changes.
const RINGS = HILLS.map(hillRings)

/** The way out: from "you are here", round the first hill and over the shoulder of the big one. */
const ROUTE = 'M64 512C112 474 168 498 206 452S246 368 300 348 332 252 392 236 470 196 508 132 574 82 606 50'

/**
 * The drawing beside the headline: a sheet of contour lines with one route
 * marked across it. Decorative, and hidden from assistive technology.
 */
export function TrailMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 580"
      className={`overflow-visible ${className ?? ''}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="stroke-contour" strokeLinejoin="round">
        {RINGS.map((rings, hill) =>
          rings.map((d, ring) => (
            // Every fourth line is an index contour, drawn heavier, as on a real sheet.
            <path
              key={`${hill}-${ring}`}
              d={d}
              strokeWidth={ring % 4 === 0 ? 1.7 : 0.9}
              opacity={ring % 4 === 0 ? 0.75 : 0.55}
            />
          )),
        )}
      </g>

      <path
        d={ROUTE}
        className="stroke-accent"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="1 9"
      />
      <path
        d="M594 41c5 1.9 9.5 2.7 14.5 2.8-1 4.9-1.2 9.6-.5 14.5"
        className="stroke-accent"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* You are here. Only on wide screens: on a phone the map is a backdrop behind the text. */}
      <g className="max-lg:hidden">
        <circle cx="64" cy="512" r="13" className="fill-bg stroke-ink" strokeWidth="2.2" />
        <circle cx="64" cy="512" r="5.5" className="fill-accent" />
      </g>

      {/* Waypoints along the route. */}
      {[
        [206, 452],
        [300, 348],
        [392, 236],
        [508, 132],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="5"
          className="fill-bg stroke-accent"
          strokeWidth="2.2"
        />
      ))}

      <g className="fill-muted font-label max-lg:hidden" fontSize="15" letterSpacing="0.07em">
        <text x="86" y="537">
          you are here
        </text>
        <text x="548" y="30">
          the way out
        </text>
      </g>
    </svg>
  )
}
