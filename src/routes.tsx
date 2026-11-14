import type { RouteObject } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { About } from './pages/About.tsx'
import { AlternativePage } from './pages/AlternativePage.tsx'
import { Browse } from './pages/Browse.tsx'
import { GuidePage } from './pages/GuidePage.tsx'
import { Guides } from './pages/Guides.tsx'
import { Home } from './pages/Home.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { PlanPage } from './pages/Plan.tsx'
import { SuitePage } from './pages/SuitePage.tsx'
import { ToolPage } from './pages/ToolPage.tsx'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/browse', element: <Browse /> },
      { path: '/tools/:id', element: <ToolPage /> },
      { path: '/alternatives/:id', element: <AlternativePage /> },
      { path: '/suites/:id', element: <SuitePage /> },
      { path: '/plan', element: <PlanPage /> },
      { path: '/guides', element: <Guides /> },
      { path: '/guides/:id', element: <GuidePage /> },
      { path: '/about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
