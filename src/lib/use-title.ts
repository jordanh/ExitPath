import { useEffect } from 'react'

const SITE_TITLE = 'ExitPath'

/** Sets the browser tab title for the current page. */
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} · ${SITE_TITLE}`
      : `${SITE_TITLE} — find your way out of big-platform lock-in`
  }, [title])
}
