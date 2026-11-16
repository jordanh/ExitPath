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
    <footer className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-dashed border-line-strong pt-4 text-sm text-muted print:hidden">
      <p>Last reviewed {reviewed}. Wrong or out of date?</p>
      <ExternalLink href={editUrl(folder, id)}>Edit this entry</ExternalLink>
      <ExternalLink href={issueUrl(`Catalog: ${name}`)}>Report a problem</ExternalLink>
    </footer>
  )
}
