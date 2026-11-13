/**
 * Migration difficulty and effort.
 *
 * Deliberately simple and fully explained on the About page: every input is a
 * 1–5 rating that a contributor wrote down in the catalog, and the arithmetic
 * here is the whole model. There is no hidden weighting.
 */
import type { Alternative, Path, Tool } from '../catalog/schema.ts'

export type TeamSize = 'solo' | 'small' | 'large'
export type HostingPreference = 'self' | 'managed'

export interface Context {
  teamSize: TeamSize
  hosting: HostingPreference
}

export const DEFAULT_CONTEXT: Context = { teamSize: 'solo', hosting: 'self' }

export const TEAM_SIZES: Record<
  TeamSize,
  { label: string; hint: string; level: number; multiplier: number }
> = {
  // `level` feeds the difficulty score; `multiplier` scales hands-on migration hours.
  solo: { label: 'Just me', hint: '1 person', level: 1, multiplier: 1 },
  small: { label: 'Small team', hint: '2–10 people', level: 3, multiplier: 3 },
  large: { label: 'Larger team', hint: '11–50 people', level: 5, multiplier: 8 },
}

export const HOSTING: Record<HostingPreference, { label: string; hint: string }> = {
  self: { label: 'Self-host', hint: 'I will run the servers' },
  managed: { label: 'Managed', hint: 'Someone hosts it for me' },
}

/** Share of the weighted average carried by each factor. Sums to 1. */
export const WEIGHTS = {
  export: 0.2,
  import: 0.25,
  hosting: 0.25,
  gap: 0.2,
  people: 0.1,
} as const

/** How much the single hardest factor pulls the score up. */
export const HARDEST_FACTOR_SHARE = 0.4

/** Hours to sign up for and configure a managed service. */
export const MANAGED_SETUP_HOURS: [number, number] = [0.5, 2]

export type HostingMode = 'none' | 'local' | 'managed' | 'self-hosted'

export interface HostingPlan {
  mode: HostingMode
  /** 1–5: how hard this hosting choice is. */
  level: number
  /** True when managed hosting was requested but none exists. */
  fellBack: boolean
  setupHours: [number, number]
}

export function hostingPlan(alternative: Alternative, context: Context): HostingPlan {
  const selfHosting = alternative.selfHosting
  if (selfHosting === null) {
    return { mode: 'none', level: 1, fellBack: false, setupHours: [0, 0] }
  }
  if (context.hosting === 'managed' && alternative.managedHosting.length > 0) {
    return { mode: 'managed', level: 1, fellBack: false, setupHours: MANAGED_SETUP_HOURS }
  }
  if (selfHosting.optional && context.teamSize === 'solo') {
    return { mode: 'local', level: 1, fellBack: false, setupHours: [0, 0] }
  }
  return {
    mode: 'self-hosted',
    level: selfHosting.difficulty,
    fellBack: context.hosting === 'managed',
    setupHours: selfHosting.setupHours,
  }
}

export type Band = 'easy' | 'moderate' | 'demanding' | 'hard' | 'very-hard'

export const BANDS: { id: Band; label: string; below: number; level: number }[] = [
  { id: 'easy', label: 'Easy', below: 20, level: 1 },
  { id: 'moderate', label: 'Moderate', below: 40, level: 2 },
  { id: 'demanding', label: 'Demanding', below: 60, level: 3 },
  { id: 'hard', label: 'Hard', below: 80, level: 4 },
  { id: 'very-hard', label: 'Very hard', below: 101, level: 5 },
]

export function bandFor(score: number) {
  return BANDS.find((band) => score < band.below) ?? BANDS[BANDS.length - 1]!
}

export interface Factor {
  key: keyof typeof WEIGHTS
  label: string
  /** 1 (easy) to 5 (hard). */
  level: number
  weight: number
  explanation: string
}

export interface PathScore {
  /** 0 (trivial) to 100 (brutal). */
  score: number
  band: (typeof BANDS)[number]
  factors: Factor[]
  hosting: HostingPlan
  /** Total effort, [low, high], in hours. */
  hours: [number, number]
  migrationHours: [number, number]
}

const normalise = (level: number) => (level - 1) / 4

const HOSTING_EXPLANATION: Record<HostingMode, string> = {
  none: 'Nothing to host: it runs on your own devices',
  local: 'No server needed when you use it on your own',
  managed: 'A provider runs it for you',
  'self-hosted': 'You run and maintain the server',
}

export function scorePath(tool: Tool, path: Path, alternative: Alternative, context: Context): PathScore {
  const hosting = hostingPlan(alternative, context)
  const team = TEAM_SIZES[context.teamSize]

  const factors: Factor[] = [
    {
      key: 'export',
      label: 'Getting data out',
      level: tool.export.difficulty,
      weight: WEIGHTS.export,
      explanation: `Export from ${tool.name}`,
    },
    {
      key: 'import',
      label: 'Getting data in',
      level: path.import.difficulty,
      weight: WEIGHTS.import,
      explanation: `Import into ${alternative.name}`,
    },
    {
      key: 'hosting',
      label: 'Running it',
      level: hosting.level,
      weight: WEIGHTS.hosting,
      explanation: hosting.fellBack
        ? 'No managed option exists, so this assumes you self-host'
        : HOSTING_EXPLANATION[hosting.mode],
    },
    {
      key: 'gap',
      label: 'Feature gap',
      // fit 5 (like for like) is no gap; fit 1 is a different product.
      level: 6 - path.fit,
      weight: WEIGHTS.gap,
      explanation: 'What you give up or have to relearn',
    },
    {
      key: 'people',
      label: 'People to move',
      level: team.level,
      weight: WEIGHTS.people,
      explanation: team.hint,
    },
  ]

  const average = factors.reduce((sum, factor) => sum + factor.weight * normalise(factor.level), 0)
  // A migration is as hard as its hardest part. Team size is left out of the
  // maximum so that head-count alone never dominates.
  const hardest = Math.max(
    ...factors.filter((factor) => factor.key !== 'people').map((factor) => normalise(factor.level)),
  )
  const score = Math.round(100 * ((1 - HARDEST_FACTOR_SHARE) * average + HARDEST_FACTOR_SHARE * hardest))

  const migrationHours: [number, number] = [
    path.effortHours[0] * team.multiplier,
    path.effortHours[1] * team.multiplier,
  ]
  const hours: [number, number] = [
    migrationHours[0] + hosting.setupHours[0],
    migrationHours[1] + hosting.setupHours[1],
  ]

  return { score, band: bandFor(score), factors, hosting, hours, migrationHours }
}

const HOURS_PER_DAY = 6
const DAYS_PER_WEEK = 5

function range(low: number, high: number, unit: string) {
  const plural = high === 1 ? unit : `${unit}s`
  return low === high ? `${low} ${plural}` : `${low}–${high} ${plural}`
}

/** "2–6 hours", "1–3 days", "2–4 weeks". Assumes six focused hours a day. */
export function formatEffort([low, high]: [number, number]): string {
  if (high <= 1) return 'Under an hour'
  if (high <= 12) return range(Math.max(1, Math.round(low)), Math.round(high), 'hour')
  const lowDays = Math.max(1, Math.round(low / HOURS_PER_DAY))
  const highDays = Math.max(lowDays, Math.ceil(high / HOURS_PER_DAY))
  if (highDays <= 9) return range(lowDays, highDays, 'day')
  const lowWeeks = Math.max(1, Math.round(lowDays / DAYS_PER_WEEK))
  const highWeeks = Math.max(lowWeeks, Math.ceil(highDays / DAYS_PER_WEEK))
  return range(lowWeeks, highWeeks, 'week')
}
