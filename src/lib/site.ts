/** Where the source and the catalog live. Change these if you fork the project. */
export const REPO_URL = 'https://github.com/noobmaster69/ExitPath'
export const DEFAULT_BRANCH = 'main'

export type CatalogFolder = 'tools' | 'alternatives' | 'guides' | 'suites'

/** GitHub's in-browser editor for one catalog entry; it offers to open a pull request. */
export const editUrl = (folder: CatalogFolder, id: string) =>
  `${REPO_URL}/edit/${DEFAULT_BRANCH}/catalog/${folder}/${id}.json`

/** A new issue with the title filled in. */
export const issueUrl = (title: string) => `${REPO_URL}/issues/new?title=${encodeURIComponent(title)}`
