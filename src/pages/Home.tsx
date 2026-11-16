import { Link } from 'react-router-dom'
import { alternatives, categories, guides, suites, tools, totalPaths } from '../catalog/index.ts'
import { GuideCard, SuiteCard } from '../components/cards.tsx'
import { IconArrowRight } from '../components/icons.tsx'
import { PickUp } from '../components/PickUp.tsx'
import { SearchBox } from '../components/SearchBox.tsx'
import { TrailMap } from '../components/TrailMap.tsx'
import { Page, ScoreBadge, Section } from '../components/ui.tsx'
import { exitNames, nameList } from '../lib/names.ts'
import { scoredPathsFrom } from '../lib/paths.ts'
import { usePrefs } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'

const POPULAR = ['slack', 'notion', 'google-photos', 'onedrive', 'github', '1password']

const PRINCIPLES = [
  {
    title: 'Honest ratings',
    body: 'Every alternative lists real weaknesses, its actual licence and who pays for it. Open core and source-available projects are labelled as such, not waved through.',
  },
  {
    title: 'Local-first',
    body: 'The whole catalog ships with the page. Your situation, your plan and your checklist progress stay in this browser, and you can export them as a file at any time.',
  },
  {
    title: 'A catalog you can fork',
    body: 'Every tool, alternative and checklist is a plain JSON file in the repository, checked against a schema. Disagree with a rating? Open a pull request.',
  },
]

/**
 * The catalog as the index of a guidebook: each tool, a line of dots, and
 * the grade of its easiest way out for the reader's situation.
 */
function ToolIndex() {
  const { teamSize, hosting } = usePrefs()
  return (
    <div className="gap-x-14 md:columns-2">
      {categories.map((category) => {
        const inCategory = tools.filter((tool) => tool.category === category.id)
        if (inCategory.length === 0) return null
        return (
          <div key={category.id} className="mb-7 break-inside-avoid">
            <h3 className="eyebrow mb-1 border-b border-line pb-1">{category.name}</h3>
            <ul>
              {inCategory.map((tool) => {
                const easiest = scoredPathsFrom(tool, { teamSize, hosting })[0]
                return (
                  <li key={tool.id}>
                    <Link to={`/tools/${tool.id}`} className="group block py-1.5">
                      <span className="flex items-baseline gap-2">
                        <span className="font-display text-[1.3rem] leading-tight font-bold decoration-accent decoration-[1.5px] underline-offset-4 group-hover:underline group-hover:decoration-wavy">
                          {tool.name}
                        </span>
                        <span className="leader" aria-hidden="true" />
                        {easiest && (
                          <ScoreBadge score={easiest.result.score} band={easiest.result.band} size="sm" />
                        )}
                      </span>
                      <span className="block text-muted">to {nameList(exitNames(tool))}</span>
                    </Link>
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
  const popular = POPULAR.flatMap((id) => tools.find((tool) => tool.id === id) ?? [])

  return (
    <>
      <div className="relative overflow-hidden">
        <TrailMap className="pointer-events-none absolute -top-16 -right-52 w-[32rem] max-w-none max-lg:[mask-image:linear-gradient(to_right,transparent,black_30%)] opacity-45 sm:-right-24 sm:opacity-60 lg:top-4 lg:right-[max(1.5rem,calc(50%-35rem))] lg:w-[35rem] lg:opacity-100" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-24 sm:pb-20">
          <div className="max-w-[35rem]">
            <p className="eyebrow">Open-source exits from big-platform lock-in</p>
            <h1 className="mt-3 text-[3.4rem] leading-[0.95] font-black tracking-tight sm:text-[5.2rem]">
              Find your way <em className="text-accent">out.</em>
            </h1>
            <p className="mt-5 text-xl text-muted">
              Pick a tool you depend on. See which open-source alternatives hold up, what moves across, what
              does not, and how much work the switch really is.
            </p>
            <div className="mt-8">
              <SearchBox />
            </div>
            <p className="mt-4 leading-relaxed">
              <span className="text-muted">Common exits: </span>
              {popular.map((tool, index) => (
                <span key={tool.id}>
                  {index > 0 && <span className="text-faint"> · </span>}
                  <Link to={`/tools/${tool.id}`} className="link">
                    {tool.name}
                  </Link>
                </span>
              ))}
            </p>
            <p className="mt-6">
              <Link to="/plan" className="btn">
                Leaving several things? Build one plan <IconArrowRight />
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Page>
        <PickUp />

        <Section
          eyebrow="The index"
          title="Start from what you use"
          intro="Each entry covers how locked in you are, how to get your data out, and the realistic ways forward. The mark beside it grades the easiest way out."
          aside={
            <Link to="/browse" className="link inline-flex items-center gap-1">
              Browse everything <IconArrowRight className="text-accent" />
            </Link>
          }
        >
          <ToolIndex />
          <p className="mt-2 text-muted">
            {tools.length} tools, {alternatives.length} alternatives and {totalPaths} routes between them.{' '}
            <Link to="/about" className="link">
              How the grades work
            </Link>
          </p>
        </Section>

        <Section
          eyebrow="Whole suites"
          title="Leaving everything at once?"
          intro="Suites are several tools behind one login. Each part can be replaced separately, in whatever order hurts least."
        >
          <div className="grid gap-5 md:grid-cols-2">
            {suites.map((suite) => (
              <SuiteCard key={suite.id} suite={suite} />
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Guided migrations"
          title="Checklists that remember where you were"
          intro="Step-by-step plans for the common moves. Tick things off as you go; progress is saved on this device."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </Section>

        <Section eyebrow="Why this exists" title="A map, not another suite">
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <div key={principle.title}>
                <h3 className="text-xl font-extrabold">{principle.title}</h3>
                <p className="mt-1.5 text-muted">{principle.body}</p>
              </div>
            ))}
          </div>
        </Section>
      </Page>
    </>
  )
}
