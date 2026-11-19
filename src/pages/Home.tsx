import { Link } from 'react-router-dom'
import {
  alternatives,
  categories,
  checkedCounts,
  getTool,
  guides,
  suites,
  tools,
  totalPaths,
} from '../catalog/index.ts'
import { PickUp } from '../components/PickUp.tsx'
import { SearchBox } from '../components/SearchBox.tsx'
import { SituationBar } from '../components/Situation.tsx'
import { IndexRow, Page, ScoreBadge, Section } from '../components/ui.tsx'
import { guideStatus } from '../lib/guides.ts'
import { nameList } from '../lib/names.ts'
import { scoredPathsFrom } from '../lib/paths.ts'
import { useAllProgress, useSituation } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'

/**
 * The catalog as an index: each tool, a line of dots, and the grade of its
 * easiest alternative for the reader's situation.
 */
function ToolIndex() {
  const situation = useSituation()
  return (
    <div className="gap-x-14 md:columns-2">
      {categories.map((category) => {
        const inCategory = tools.filter((tool) => tool.category === category.id)
        if (inCategory.length === 0) return null
        return (
          <div key={category.id} className="mb-6 break-inside-avoid">
            <h3 className="label">{category.name}</h3>
            <ul>
              {inCategory.map((tool) => {
                const paths = scoredPathsFrom(tool, situation)
                const easiest = paths[0]
                return (
                  <li key={tool.id}>
                    <IndexRow
                      to={`/tools/${tool.id}`}
                      title={tool.name}
                      end={easiest && <ScoreBadge band={easiest.result.band} size="sm" />}
                      detail={nameList(paths.map(({ alternative }) => alternative.name))}
                      detailOnPhone={false}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function Home() {
  useTitle()
  const progress = useAllProgress()

  return (
    <Page>
      <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight sm:text-[2.5rem]">
        Open-source alternatives to {tools.length} tools
      </h1>
      <p className="mt-3 max-w-2xl text-muted sm:text-lg">
        For each tool: the replacements worth considering, what transfers and what does not, and how much work
        the move is.
      </p>
      <div className="mt-6 max-w-xl">
        <SearchBox />
      </div>

      <div className="mt-12">
        <PickUp />
      </div>

      <section aria-labelledby="index">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="index" className="text-[1.55rem] leading-tight font-extrabold">
            Tools
          </h2>
          <Link to="/plan" className="link max-sm:hidden">
            Plan several moves at once
          </Link>
        </div>
        <SituationBar />
        <div className="mt-6">
          <ToolIndex />
        </div>
        {/* Left out on a phone: the footer of every page says the same about AI drafts, in a line. */}
        <p className="text-muted max-sm:hidden">
          Each tool is followed by its alternatives and the grade of the easiest one. {tools.length} tools,{' '}
          {alternatives.length} alternatives and {totalPaths} migration paths in all. {checkedCounts.checked}{' '}
          of the {checkedCounts.total} entries have been written or checked by someone who uses the tool; the
          rest are AI drafts.{' '}
          <Link to="/about" className="link">
            About the catalog
          </Link>
        </p>
      </section>

      <div className="grid gap-x-14 md:grid-cols-2">
        <Section title="Suites">
          <ul>
            {suites.map((suite) => (
              <li key={suite.id}>
                <IndexRow
                  to={`/suites/${suite.id}`}
                  title={suite.name}
                  end={<span className="text-muted">{suite.components.length} parts</span>}
                  detail={nameList(
                    suite.components.flatMap((component) => getTool(component.tool)?.name ?? []),
                  ).replace(' or ', ' and ')}
                  detailOnPhone={false}
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Checklists">
          <ul>
            {guides.map((guide) => {
              const { done, total } = guideStatus(
                guide,
                progress[guide.id] ?? { done: [], notes: '', updatedAt: '' },
              )
              return (
                <li key={guide.id}>
                  <IndexRow
                    to={`/guides/${guide.id}`}
                    title={guide.title}
                    end={
                      <span className="text-muted">
                        {done > 0 ? `${done} of ${total} done` : `${total} steps`}
                      </span>
                    }
                  />
                </li>
              )
            })}
          </ul>
        </Section>
      </div>
    </Page>
  )
}
