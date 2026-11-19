import { Link } from 'react-router-dom'
import { alternatives, categories, getTool, guides, suites, tools, totalPaths } from '../catalog/index.ts'
import { PickUp } from '../components/PickUp.tsx'
import { SearchBox } from '../components/SearchBox.tsx'
import { SituationLine } from '../components/Situation.tsx'
import { TrailMap } from '../components/TrailMap.tsx'
import { IndexRow, Page, ScoreBadge, Section } from '../components/ui.tsx'
import { guideStatus } from '../lib/guides.ts'
import { scoredPathsFrom } from '../lib/paths.ts'
import { nameList } from '../lib/names.ts'
import { useAllProgress, useSituation } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'

/**
 * The catalog as the index of a guidebook: each tool, a line of dots, and
 * the grade of its easiest way out for the reader's situation.
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
            <h3 className="eyebrow">{category.name}</h3>
            <ul>
              {inCategory.map((tool) => {
                const paths = scoredPathsFrom(tool, situation)
                const easiest = paths[0]
                return (
                  <li key={tool.id}>
                    <IndexRow
                      to={`/tools/${tool.id}`}
                      title={tool.name}
                      end={
                        easiest && (
                          <ScoreBadge score={easiest.result.score} band={easiest.result.band} size="sm" />
                        )
                      }
                      detail={<>to {nameList(paths.map(({ alternative }) => alternative.name))}</>}
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
    <>
      <div className="relative">
        {/* The drawing is clipped to the hero; the search results below must not be. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden max-lg:hidden">
          <TrailMap className="absolute top-2 right-[max(1.5rem,calc(50%-31rem))] w-[26rem]" />
        </div>
        <div className="relative mx-auto max-w-[60rem] px-4 pt-14 pb-10 sm:px-6 sm:pt-24 sm:pb-16">
          <div className="max-w-[33rem]">
            <h1 className="text-[3.2rem] leading-[0.95] font-black tracking-tight sm:text-[4.6rem]">
              Find your way <em className="text-accent">out.</em>
            </h1>
            <p className="mt-5 text-xl text-muted">
              A guide to open-source replacements for the tools you depend on: which ones hold up, what moves
              across, what does not, and how much work the switch really is.
            </p>
            <div className="mt-7">
              <SearchBox />
            </div>
          </div>
        </div>
      </div>

      <Page>
        <PickUp />

        <section aria-labelledby="index">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="index" className="text-[1.55rem] leading-tight font-extrabold">
              Start from what you use
            </h2>
            <Link to="/plan" className="link">
              Leaving several? Build a plan
            </Link>
          </div>
          <ToolIndex />
          <div className="mt-1 space-y-1">
            <SituationLine />
            <p className="text-muted">
              {tools.length} tools, {alternatives.length} alternatives, {totalPaths} routes between them. The
              mark grades the easiest way out, hosted or self-hosted as you choose.
            </p>
          </div>
        </section>

        <div className="grid gap-x-14 md:grid-cols-2">
          <Section title="Whole suites">
            <ul>
              {suites.map((suite) => (
                <li key={suite.id}>
                  <IndexRow
                    to={`/suites/${suite.id}`}
                    title={`Leaving ${suite.name}`}
                    end={<span className="text-muted">{suite.components.length} parts</span>}
                    detail={nameList(
                      suite.components.flatMap((component) => getTool(component.tool)?.name ?? []),
                    ).replace(' or ', ' and ')}
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
    </>
  )
}
