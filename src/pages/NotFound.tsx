import { Link } from 'react-router-dom'
import { Page } from '../components/ui.tsx'
import { useTitle } from '../lib/use-title.ts'

export function NotFound({ what = 'page' }: { what?: string }) {
  useTitle('Not found')
  return (
    <Page narrow>
      <h1 className="text-[2rem] leading-[1.1] font-black tracking-tight sm:text-[2.5rem]">
        This {what} is not in the catalog.
      </h1>
      <p className="mt-3 text-muted">
        The link may be out of date, or the entry may have been renamed. Everything that exists is listed on
        the browse page.
      </p>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <Link to="/browse" className="link">
          Browse the catalog
        </Link>
        <Link to="/" className="link">
          Back to the start
        </Link>
      </p>
    </Page>
  )
}
