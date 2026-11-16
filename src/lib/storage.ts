/**
 * Everything the app remembers lives in this browser's localStorage, under
 * a handful of keys. Nothing is sent anywhere. "Export my data" hands the same JSON to
 * the user as a file; "Import" reads it back.
 */
import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_CONTEXT, HOSTING, TEAM_SIZES, type Context, type Situation } from './scoring.ts'

export type Theme = 'system' | 'light' | 'dark'
/** "open" hides alternatives that are open core or source-available. */
export type Licences = 'any' | 'open'
export type TextSize = 'normal' | 'large'

/** How many hours a week someone can give to moving; used for the plan's timeline. */
export const HOURS_PER_WEEK = [2, 5, 10, 20] as const

export interface Prefs extends Context {
  theme: Theme
  licences: Licences
  hoursPerWeek: number
  textSize: TextSize
}

export interface GuideProgress {
  /** Ids of completed steps. */
  done: string[]
  notes: string
  /** ISO timestamp of the last change. */
  updatedAt: string
}

export type Progress = Record<string, GuideProgress>

/**
 * The tools someone wants to leave, and where to. The value is the chosen
 * alternative's id, or null for "whichever is easiest for my situation",
 * which follows the team-size and hosting answers as they change.
 */
export type Plan = Record<string, string | null>

export const PREFS_KEY = 'exitpath:prefs'
export const PROGRESS_KEY = 'exitpath:progress'
export const PLAN_KEY = 'exitpath:plan'
export const PLAN_DONE_KEY = 'exitpath:plan-done'
export const EXPORT_FORMAT = 'exitpath-export'
export const EXPORT_VERSION = 1

const DEFAULT_PREFS: Prefs = {
  ...DEFAULT_CONTEXT,
  theme: 'system',
  licences: 'any',
  hoursPerWeek: 5,
  textSize: 'normal',
}
const EMPTY_LIST: string[] = []
const EMPTY_PROGRESS: Progress = {}
const EMPTY_PLAN: Plan = {}
const EMPTY_GUIDE: GuideProgress = { done: [], notes: '', updatedAt: '' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Accepts anything and returns valid prefs, falling back field by field. */
export function sanitizePrefs(value: unknown): Prefs {
  if (!isRecord(value)) return DEFAULT_PREFS
  const { teamSize, hosting, theme, licences, hoursPerWeek, textSize } = value
  // Object.hasOwn, not `in`: "toString" is not a team size.
  return {
    teamSize:
      typeof teamSize === 'string' && Object.hasOwn(TEAM_SIZES, teamSize)
        ? (teamSize as Prefs['teamSize'])
        : DEFAULT_PREFS.teamSize,
    hosting:
      typeof hosting === 'string' && Object.hasOwn(HOSTING, hosting)
        ? (hosting as Prefs['hosting'])
        : DEFAULT_PREFS.hosting,
    theme: theme === 'light' || theme === 'dark' || theme === 'system' ? theme : DEFAULT_PREFS.theme,
    licences: licences === 'open' || licences === 'any' ? licences : DEFAULT_PREFS.licences,
    hoursPerWeek: (HOURS_PER_WEEK as readonly unknown[]).includes(hoursPerWeek)
      ? (hoursPerWeek as number)
      : DEFAULT_PREFS.hoursPerWeek,
    textSize: textSize === 'large' || textSize === 'normal' ? textSize : DEFAULT_PREFS.textSize,
  }
}

/** Accepts anything and returns valid progress, dropping what it cannot read. */
export function sanitizeProgress(value: unknown): Progress {
  if (!isRecord(value)) return EMPTY_PROGRESS
  const out: Progress = {}
  for (const [guideId, raw] of Object.entries(value)) {
    if (!isRecord(raw)) continue
    const done = Array.isArray(raw.done) ? raw.done.filter((id): id is string => typeof id === 'string') : []
    out[guideId] = {
      done: [...new Set(done)],
      notes: typeof raw.notes === 'string' ? raw.notes : '',
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    }
  }
  return out
}

/** Accepts anything and returns a valid plan, dropping what it cannot read. */
export function sanitizePlan(value: unknown): Plan {
  if (!isRecord(value)) return EMPTY_PLAN
  const out: Plan = {}
  for (const [toolId, choice] of Object.entries(value)) {
    if (typeof choice === 'string' || choice === null) out[toolId] = choice
  }
  return out
}

/** Accepts anything and returns a list of distinct strings. */
export function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return EMPTY_LIST
  return [...new Set(value.filter((id): id is string => typeof id === 'string'))]
}

// --- a tiny external store, so every component sees the same values ---------

const KEYS = [PREFS_KEY, PROGRESS_KEY, PLAN_KEY, PLAN_DONE_KEY]

const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()
/** Holds values for this session when localStorage refuses writes. */
const memory = new Map<string, string>()

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // storage blocked (private mode, sandboxed iframe): run in memory
  }
}

function read<T>(key: string, sanitize: (value: unknown) => T): T {
  const raw = memory.has(key) ? memory.get(key)! : readRaw(key)
  const cached = cache.get(key)
  if (cached && cached.raw === raw) return cached.value as T
  let parsed: unknown
  try {
    parsed = raw === null ? undefined : JSON.parse(raw)
  } catch {
    parsed = undefined
  }
  const value = sanitize(parsed)
  cache.set(key, { raw, value })
  return value
}

function write(key: string, value: unknown) {
  const raw = JSON.stringify(value)
  try {
    localStorage.setItem(key, raw)
    memory.delete(key)
  } catch {
    memory.set(key, raw)
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed something: re-read.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || KEYS.includes(event.key)) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export const getPrefs = () => read(PREFS_KEY, sanitizePrefs)
export const getProgress = () => read(PROGRESS_KEY, sanitizeProgress)
export const getPlan = () => read(PLAN_KEY, sanitizePlan)
/** Tool ids of the moves in the plan that have been finished. */
export const getPlanDone = () => read(PLAN_DONE_KEY, sanitizeIds)

export function setPrefs(patch: Partial<Prefs>) {
  write(PREFS_KEY, { ...getPrefs(), ...patch })
}

function updateGuide(guideId: string, change: (current: GuideProgress) => Partial<GuideProgress>) {
  const all = getProgress()
  const current = all[guideId] ?? EMPTY_GUIDE
  write(PROGRESS_KEY, {
    ...all,
    [guideId]: { ...current, ...change(current), updatedAt: new Date().toISOString() },
  })
}

export function setStepDone(guideId: string, stepId: string, done: boolean) {
  updateGuide(guideId, (current) => ({
    done: done ? [...new Set([...current.done, stepId])] : current.done.filter((id) => id !== stepId),
  }))
}

export function setGuideNotes(guideId: string, notes: string) {
  updateGuide(guideId, () => ({ notes }))
}

export function resetGuide(guideId: string) {
  const { [guideId]: _removed, ...rest } = getProgress()
  write(PROGRESS_KEY, rest)
}

/** Adds a tool to the plan, or changes where it is headed. */
export function setPlanChoice(toolId: string, alternativeId: string | null) {
  write(PLAN_KEY, { ...getPlan(), [toolId]: alternativeId })
}

export function setPlanChoices(choices: Plan) {
  write(PLAN_KEY, { ...getPlan(), ...choices })
}

export function removeFromPlan(toolId: string) {
  const { [toolId]: _removed, ...rest } = getPlan()
  write(PLAN_KEY, rest)
  if (getPlanDone().includes(toolId)) setMoveDone(toolId, false)
}

export function clearPlan() {
  write(PLAN_KEY, {})
  write(PLAN_DONE_KEY, [])
}

/** Replaces the whole plan, for example with one opened from a shared link. */
export function replacePlan(plan: Plan) {
  write(PLAN_KEY, plan)
  write(PLAN_DONE_KEY, [])
}

export function setMoveDone(toolId: string, done: boolean) {
  const current = getPlanDone()
  write(PLAN_DONE_KEY, done ? [...new Set([...current, toolId])] : current.filter((id) => id !== toolId))
}

export function clearEverything() {
  for (const key of KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // nothing stored there anyway
    }
    memory.delete(key)
  }
  for (const listener of listeners) listener()
}

// --- export / import ---------------------------------------------------------

export interface ExportFile {
  format: typeof EXPORT_FORMAT
  version: number
  exportedAt: string
  prefs: Prefs
  progress: Progress
  plan: Plan
  planDone: string[]
}

export function exportData(): ExportFile {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    prefs: getPrefs(),
    progress: getProgress(),
    plan: getPlan(),
    planDone: getPlanDone(),
  }
}

/**
 * Replaces stored data with the contents of an export file.
 * Throws with a readable message when the file is not one of ours.
 */
export function importData(text: string): { guides: number; planned: number } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!isRecord(parsed) || parsed.format !== EXPORT_FORMAT) {
    throw new Error('That file does not look like an ExitPath export.')
  }
  if (typeof parsed.version !== 'number' || parsed.version > EXPORT_VERSION) {
    throw new Error('That export was made by a newer version of ExitPath.')
  }
  const progress = sanitizeProgress(parsed.progress)
  // Exports made before plans existed have no `plan`; that imports as an empty one.
  const plan = sanitizePlan(parsed.plan)
  write(PREFS_KEY, sanitizePrefs(parsed.prefs))
  write(PROGRESS_KEY, progress)
  write(PLAN_KEY, plan)
  write(
    PLAN_DONE_KEY,
    sanitizeIds(parsed.planDone).filter((id) => Object.hasOwn(plan, id)),
  )
  return { guides: Object.keys(progress).length, planned: Object.keys(plan).length }
}

// --- hooks -------------------------------------------------------------------

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getPrefs, () => DEFAULT_PREFS)
}

export function useAllProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, () => EMPTY_PROGRESS)
}

export function usePlan(): Plan {
  return useSyncExternalStore(subscribe, getPlan, () => EMPTY_PLAN)
}

export function usePlanDone(): string[] {
  return useSyncExternalStore(subscribe, getPlanDone, () => EMPTY_LIST)
}

/** The reader's situation, as the scoring and filtering code wants it. */
export function useSituation(): Situation {
  const { teamSize, hosting, licences } = usePrefs()
  return { teamSize, hosting, openOnly: licences === 'open' }
}

export function useGuideProgress(guideId: string): GuideProgress {
  const snapshot = useCallback(() => getProgress()[guideId] ?? EMPTY_GUIDE, [guideId])
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_GUIDE)
}
