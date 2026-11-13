import type { Guide } from '../catalog/schema.ts'
import type { GuideProgress } from './storage.ts'

export const stepIds = (guide: Guide) => guide.phases.flatMap((phase) => phase.steps.map((step) => step.id))

export interface GuideStatus {
  done: number
  total: number
  /** Completed step ids that still exist in the guide. */
  doneIds: Set<string>
}

/**
 * Progress through a guide. Ids that no longer exist (a step was removed
 * from the catalog after it was ticked) are ignored rather than counted.
 */
export function guideStatus(guide: Guide, progress: GuideProgress): GuideStatus {
  const ids = stepIds(guide)
  const valid = new Set(ids)
  const doneIds = new Set(progress.done.filter((id) => valid.has(id)))
  return { done: doneIds.size, total: ids.length, doneIds }
}
