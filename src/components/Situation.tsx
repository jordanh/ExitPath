import { Link } from 'react-router-dom'
import { openOptions } from '../lib/options-dialog.ts'
import { HOSTING, TEAM_SIZES, type HostingPreference, type TeamSize } from '../lib/scoring.ts'
import { setPrefs, usePrefs } from '../lib/storage.ts'
import { Choice } from './Choice.tsx'

/**
 * The two answers that change every grade and estimate, as toggles on the
 * page itself rather than behind a menu. They are saved, and shared by every
 * page that shows grades.
 */
export function SituationBar({ hidden = 0, explain = true }: { hidden?: number; explain?: boolean }) {
  const { teamSize, hosting, licences } = usePrefs()
  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        <Choice<TeamSize>
          legend="Who is moving?"
          value={teamSize}
          onChange={(value) => setPrefs({ teamSize: value })}
          options={(Object.keys(TEAM_SIZES) as TeamSize[]).map((key) => ({ value: key, ...TEAM_SIZES[key] }))}
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
  )
}
