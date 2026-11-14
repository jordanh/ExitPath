import { createHashRouter, RouterProvider } from 'react-router-dom'
import { routes } from './routes.tsx'

// Hash routing keeps the build fully static: it works from any sub-path, from
// GitHub Pages, and from a file opened inside a desktop shell, with no server
// rewrite rules.
const router = createHashRouter(routes)

export function App() {
  return <RouterProvider router={router} />
}
