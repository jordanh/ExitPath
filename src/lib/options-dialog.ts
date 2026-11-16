/**
 * Whether the options dialog is open. A tiny shared store rather than React
 * state, because the dialog lives in the header while "Change" links that
 * open it are scattered across the pages.
 */
import { useSyncExternalStore } from 'react'

let isOpen = false
const listeners = new Set<() => void>()

function set(next: boolean) {
  if (isOpen === next) return
  isOpen = next
  for (const listener of listeners) listener()
}

export const openOptions = () => set(true)
export const closeOptions = () => set(false)

export function useOptionsOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => isOpen,
    () => false,
  )
}
