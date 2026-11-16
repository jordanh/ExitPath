import { getAlternative } from '../catalog/index.ts'
import type { Tool } from '../catalog/schema.ts'

/** "Nextcloud, Seafile or Syncthing" */
export function nameList(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`
}

/** The names of the alternatives a tool has paths to, in catalog order. */
export const exitNames = (tool: Tool) => tool.paths.flatMap((path) => getAlternative(path.to)?.name ?? [])
