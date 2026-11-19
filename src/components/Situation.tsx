import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { openOptions } from '../lib/options-dialog.ts'
import { HOSTING, TEAM_SIZES, type HostingPreference, type TeamSize } from '../lib/scoring.ts'
import { setPrefs, usePrefs } from '../lib/storage.ts'
import { Choice } from './Choice.tsx'

/**
 * The two answers that change every grade and estimate, as toggles on the
 * page itself rather than behind a menu. They are saved, and shared by every
 * page that shows grades.
 *
 * On a phone they fold into one line that states the current answers, so the
 * list they govern starts higher up the screen; "Change" unfolds them.
 */
export function SituationBar({ hidden = 0, explain = true }: { hidden?: number; explain?: boolean }) {
  const { teamSize, hosting, licences } = usePrefs()
  const [unfolded, setUnfolded] = useState(false)
  const controlsId = useId()
  return (
    <div className="print:hidden">
      <p className="sm:hidden">
        <span className="text-muted">Graded for</span>{' '}
        <span className="font-bold whitespace-nowrap">{TEAM_SIZES[teamSize].label}</span>
        <span className="text-muted"> · </span>
        <span className="font-bold whitespace-nowrap">{HOSTING[hosting].label}</span>
        {licences === 'open' && (
          <>
            <span className="text-muted"> · </span>
            <span className="font-bold whitespace-nowrap">Open source only</span>
          </>
        )}
        <button
          type="button"
          aria-expanded={unfolded}
          aria-controls={controlsId}
          onClick={() => setUnfolded(!unfolded)}
          className="link ml-3 cursor-pointer"
        >
          {unfolded ? 'Done' : 'Change'}
        </button>
      </p>
      <div id={controlsId} className={unfolded ? 'max-sm:mt-3' : 'max-sm:hidden'}>
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <Choice<TeamSize>
            legend="Who is moving?"
            value={teamSize}
            onChange={(value) => setPrefs({ teamSize: value })}
            options={(Object.keys(TEAM_SIZES) as TeamSize[]).map((key) => ({
              value: key,
              ...TEAM_SIZES[key],
            }))}
          />
          <Choice<HostingPreference>
            legend="Who runs the servers?"
            value={hosting}
            onChange={(value) => setPrefs({ hosting: value })}
            options={(Object.keys(HOSTING) as HostingPreference[]).map((key) => ({
              value: key,
              ...HOSTING[key],
            }))}
          />
        </div>
        <p className="mt-2 text-muted">
          Grades and hours follow these two answers.{' '}
          {licences === 'open' && (
            <>
              Showing open-source projects only
              {hidden > 0 && (
                <>
                  , which hides {hidden} {hidden === 1 ? 'alternative' : 'alternatives'}
                </>
              )}
              .{' '}
            </>
          )}
          <button type="button" onClick={openOptions} className="link cursor-pointer">
            More options
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
      </div>
    </div>
  )
}
