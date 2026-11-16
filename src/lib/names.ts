/** "Nextcloud, Seafile or Syncthing" */
export function nameList(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`
}
