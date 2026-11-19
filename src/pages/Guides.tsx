import { guides } from '../catalog/index.ts'
import { IndexRow, Page } from '../components/ui.tsx'
import { guideStatus } from '../lib/guides.ts'
import { openOptions } from '../lib/options-dialog.ts'
import { useAllProgress } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'

const NOT_STARTED = { done: [], notes: '', updatedAt: '' }

export function Guides() {
  useTitle('Guides')
  const progress = useAllProgress()
  return (
    <Page narrow>
      <h1 className="text-[2rem] leading-[1.1] font-black tracking-tight sm:text-[2.5rem]">Guides</h1>
      <p className="mt-3 text-xl text-muted">
        Step-by-step checklists for four common migrations. Tick steps off as you go; progress is saved in
        this browser.
      </p>

      <ul className="mt-8">
        {guides.map((guide) => {
          const { done, total } = guideStatus(guide, progress[guide.id] ?? NOT_STARTED)
          return (
            <li key={guide.id} className="border-t border-line py-2 first:border-t-0">
              <IndexRow
                to={`/guides/${guide.id}`}
                title={guide.title}
                end={
                  <span className={done === total ? 'font-bold text-accent' : 'text-muted'}>
                    {done === total ? 'Done' : done > 0 ? `${done} of ${total}` : `${total} steps`}
                  </span>
                }
                detail={guide.summary}
              />
            </li>
          )
        })}
      </ul>

      <p className="mt-8 text-muted">
        To back up your progress or move it to another device,{' '}
        <button type="button" onClick={openOptions} className="link cursor-pointer">
          open the options
        </button>
        .
      </p>
    </Page>
  )
}
