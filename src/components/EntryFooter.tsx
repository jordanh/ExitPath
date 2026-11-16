import { editUrl, issueUrl, type CatalogFolder } from '../lib/site.ts'
import { ExternalLink } from './ui.tsx'

/** Closes a catalog page: when it was last checked, and how to fix it. */
export function EntryFooter({
  folder,
  id,
  name,
  reviewed,
}: {
  folder: CatalogFolder
  id: string
  name: string
  reviewed: string
}) {
  return (
    <footer className="mt-14 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-line pt-5 text-muted print:hidden">
      <p>Last reviewed {reviewed}. Wrong or out of date?</p>
      <ExternalLink href={editUrl(folder, id)}>Edit this entry</ExternalLink>
      <ExternalLink href={issueUrl(`Catalog: ${name}`)}>Report a problem</ExternalLink>
    </footer>
  )
}
