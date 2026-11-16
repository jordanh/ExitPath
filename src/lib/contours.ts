/**
 * Contour lines for the map drawings: nested, slightly irregular rings like
 * the ones that mark height on a topographic sheet.
 *
 * Everything is derived from a seed, so the same hill is drawn the same way
 * on every render and in every test.
 */

/** A small deterministic random-number generator (mulberry32). */
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (value: number) => Math.round(value * 10) / 10

/** A closed smooth curve through the points (Catmull-Rom, written as cubic Béziers). */
function closedPath(points: [number, number][]): string {
  const n = points.length
  const at = (i: number) => points[((i % n) + n) % n]!
  let d = `M${round(at(0)[0])} ${round(at(0)[1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`
  }
  return `${d}Z`
}

export interface Hill {
  cx: number
  cy: number
  /** Radius of the outermost ring. */
  radius: number
  /** How many rings to draw. */
  rings: number
  seed: number
  /** Horizontal stretch; above 1 gives a ridge rather than a round hill. */
  stretch?: number
}

/**
 * The rings of one hill, outermost first. All rings share one outline that
 * flattens towards the summit, so they nest without ever crossing, and the
 * summit sits a little off-centre, as real ones do.
 */
export function hillRings({ cx, cy, radius, rings, seed, stretch = 1 }: Hill): string[] {
  const random = seeded(seed)
  // The outline: a circle pushed in and out by a few slow waves.
  const waves = [1, 2, 3, 4].map((frequency) => ({
    frequency,
    amplitude: (0.05 + random() * 0.11) / Math.sqrt(frequency),
    phase: random() * Math.PI * 2,
  }))
  const outline = (angle: number) =>
    waves.reduce((sum, wave) => sum + wave.amplitude * Math.sin(wave.frequency * angle + wave.phase), 1)
  const summit: [number, number] = [(random() - 0.5) * radius * 0.5, (random() - 0.5) * radius * 0.4]
  const tilt = random() * Math.PI

  const paths: string[] = []
  const samples = 28
  for (let ring = 0; ring < rings; ring++) {
    const scale = 1 - ring / (rings + 0.6)
    const toSummit = 1 - scale
    const points: [number, number][] = []
    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * Math.PI * 2
      const r = radius * scale * (1 + (outline(angle) - 1) * (0.45 + 0.55 * scale))
      const x = Math.cos(angle) * r * stretch
      const y = Math.sin(angle) * r
      points.push([
        cx + summit[0] * toSummit + x * Math.cos(tilt) - y * Math.sin(tilt),
        cy + summit[1] * toSummit + x * Math.sin(tilt) + y * Math.cos(tilt),
      ])
    }
    paths.push(closedPath(points))
  }
  return paths
}
