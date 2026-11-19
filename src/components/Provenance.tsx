import { Fragment } from 'react'
import { isChecked, type Checkable } from '../catalog/index.ts'
import { editUrl, type CatalogFolder } from '../lib/site.ts'
import { IconCheck } from './icons.tsx'
import { ExternalLink } from './ui.tsx'

/**
 * Says where an entry came from: written or checked by a named person, or
 * drafted with an AI assistant and still waiting for someone who uses the
 * tool to check it.
 */
export function Provenance({ entry, folder }: { entry: Checkable & { id: string }; folder: CatalogFolder }) {
  if (isChecked(entry)) {
    return (
      <p>
        <IconCheck className="mr-1.5 inline-block align-[-0.12em] text-level-1" />
        Written or checked by{' '}
        {entry.checkedBy!.map((person, index) => (
          <Fragment key={person.name}>
            {index > 0 && ', '}
            {person.url ? <ExternalLink href={person.url}>{person.name}</ExternalLink> : person.name}
          </Fragment>
        ))}
        .
      </p>
    )
  }
  return (
    <p className="text-muted">
      AI draft: written with an AI assistant from public documentation, and not yet checked by anyone who uses
      it. <ExternalLink href={editUrl(folder, entry.id)}>Check or correct this entry</ExternalLink>
    </p>
  )
}

/** The same fact in two words, for lists and tables. */
export function ProvenanceMark({ entry }: { entry: Checkable }) {
  return isChecked(entry) ? (
    <span className="whitespace-nowrap" title="Written or checked by a person who uses it">
      <IconCheck className="mr-1 inline-block align-[-0.12em] text-level-1" />
      Checked
    </span>
  ) : (
    <span
      className="whitespace-nowrap text-muted"
      title="Written with an AI assistant, and not yet checked by anyone who uses it"
    >
      AI draft
    </span>
  )
}
