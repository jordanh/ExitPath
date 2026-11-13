import { Link } from 'react-router-dom'
import { alternatives, categories, guides, suites, tools, totalPaths } from '../catalog/index.ts'
import { GuideCard, SuiteCard, ToolCard } from '../components/cards.tsx'
import { IconArrowRight } from '../components/icons.tsx'
import { SearchBox } from '../components/SearchBox.tsx'
import { Page, Section } from '../components/ui.tsx'
import { useTitle } from '../lib/use-title.ts'

const POPULAR = ['slack', 'notion', 'google-photos', 'onedrive', 'github', '1password']

const PRINCIPLES = [
  {
    title: 'Honest ratings',
    body: 'Every alternative lists real weaknesses, its actual licence and who pays for it. Open core and source-available projects are labelled as such, not waved through.',
  },
  {
    title: 'Local-first',
    body: 'The whole catalog ships with the page. Your situation and your checklist progress stay in this browser, and you can export them as a file at any time.',
  },
  {
    title: 'A catalog you can fork',
    body: 'Every tool, alternative and checklist is a plain JSON file in the repository, checked against a schema. Disagree with a rating? Open a pull request.',
  },
]

export function Home() {
  useTitle()
  const orderedTools = categories.flatMap((category) => tools.filter((tool) => tool.category === category.id))
  const popular = POPULAR.flatMap((id) => tools.find((tool) => tool.id === id) ?? [])

  return (
    <>
      <div className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-20 sm:pb-14">
          <p className="eyebrow">Open-source exits from big-platform lock-in</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            Find your way <span className="text-accent">out.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Pick a tool you depend on. See which open-source alternatives hold up, what moves across, what
            does not, and how much work the switch really is.
          </p>
          <div className="mt-7 max-w-2xl">
            <SearchBox />
          </div>
          <ul className="mt-4 flex max-w-2xl flex-wrap items-center gap-2 text-sm">
            <li className="text-muted">Common exits:</li>
            {popular.map((tool) => (
              <li key={tool.id}>
                <Link
                  to={`/tools/${tool.id}`}
                  className="inline-flex rounded-full border border-line bg-surface px-3 py-1 font-medium hover:border-accent hover:text-accent"
                >
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 font-mono text-xs text-muted">
            {tools.length} tools · {alternatives.length} alternatives · {totalPaths} migration paths ·{' '}
            {guides.length} checklists
          </p>
        </div>
      </div>

      <Page>
        <Section
          eyebrow="Whole suites"
          title="Leaving everything at once?"
          intro="Suites are several tools behind one login. Each part can be replaced separately, in whatever order hurts least."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {suites.map((suite) => (
              <SuiteCard key={suite.id} suite={suite} />
            ))}
          </div>
        </Section>

        <Section
          eyebrow="One tool at a time"
          title="Start from what you use"
          intro="Each entry covers how locked in you are, how to get your data out, and the realistic ways forward."
          aside={
            <Link to="/browse" className="link inline-flex items-center gap-1 text-sm">
              Browse everything <IconArrowRight />
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orderedTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Guided migrations"
          title="Checklists that remember where you were"
          intro="Step-by-step plans for the common moves. Tick things off as you go; progress is saved on this device."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </Section>

        <Section eyebrow="Why this exists" title="A map, not another suite">
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <div key={principle.title} className="border-t-2 border-accent pt-3">
                <h3 className="font-bold">{principle.title}</h3>
                <p className="mt-1 text-sm text-muted">{principle.body}</p>
              </div>
            ))}
          </div>
        </Section>
      </Page>
    </>
  )
}
