import { Link } from 'react-router-dom'
import { openOptions } from '../lib/options-dialog.ts'
import { TEAM_SIZES } from '../lib/scoring.ts'
import { usePrefs } from '../lib/storage.ts'

/**
 * One quiet line saying whose situation the grades are for, with a way to
 * change it and a way to see how they are worked out. The choices themselves
 * live in the options dialog.
 */
export function SituationLine({ hidden = 0, explain = true }: { hidden?: number; explain?: boolean }) {
  const { teamSize, hosting, licences } = usePrefs()
  return (
    <p className="text-muted print:hidden">
      Graded for <span className="text-ink">{TEAM_SIZES[teamSize].label.toLowerCase()}</span>,{' '}
      <span className="text-ink">{hosting === 'self' ? 'self-hosting' : 'managed hosting'}</span>
      {licences === 'open' && (
        <>
          , <span className="text-ink">open source only</span>
        </>
      )}
      .{' '}
      {hidden > 0 && (
        <>
          {hidden} {hidden === 1 ? 'path is' : 'paths are'} hidden by the licence setting.{' '}
        </>
      )}
      <button type="button" onClick={openOptions} className="link cursor-pointer">
        Change
      </button>
      {explain && (
        <>
          {' · '}
          <Link to="/about" className="link">
            How grades work
          </Link>
        </>
      )}
    </p>
  )
}
