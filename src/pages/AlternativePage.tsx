import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAlternative, getCategory, guidesForAlternative } from '../catalog/index.ts'
import type { Alternative } from '../catalog/schema.ts'
import { Disclosure } from '../components/Disclosure.tsx'
import { EntryFooter } from '../components/EntryFooter.tsx'
import { IconArrowRight } from '../components/icons.tsx'
import { Provenance } from '../components/Provenance.tsx'
import { SituationBar } from '../components/Situation.tsx'
import {
  Callout,
  ExternalLink,
  IndexRow,
  MarkedList,
  Rating,
  OpennessBadge,
  Page,
  ScoreBadge,
  Section,
  SupportMark,
  Tag,
} from '../components/ui.tsx'
import { scoredPathsTo } from '../lib/paths.ts'
import { DEPLOY_LABELS, KIND_LABELS, OPENNESS_LABELS, PLATFORM_LABELS } from '../lib/scales.ts'
import { formatEffort } from '../lib/scoring.ts'
import { useSituation } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function AlternativePage() {
  const { id } = useParams()
  const alternative = id ? getAlternative(id) : undefined
  return alternative ? <AlternativeView alternative={alternative} /> : <NotFound what="alternative" />
}

function Fact({ label, children, short }: { label: string; children: ReactNode; short?: boolean }) {
  return (
    <div
      className={`grid gap-x-6 py-1.5 sm:grid-cols-[11rem_minmax(0,1fr)] ${
        // A short value sits beside its label even on a phone, where a long one goes below it.
        short ? 'max-sm:grid-cols-[7rem_minmax(0,1fr)] max-sm:py-1' : ''
      }`}
    >
      <dt className={`label sm:pt-0.5 ${short ? 'pt-0.5' : ''}`}>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function AlternativeView({ alternative }: { alternative: Alternative }) {
  useTitle(alternative.name)
  const situation = useSituation()
  const replaces = scoredPathsTo(alternative, situation)
  const guides = guidesForAlternative(alternative.id)
  const selfHosting = alternative.selfHosting
  const categoryList = alternative.categories.flatMap((id) => getCategory(id) ?? [])

  return (
    <Page>
      <nav aria-label="Breadcrumb" className="mb-3 text-muted">
        <Link to="/browse?view=alternatives" className="hover:text-ink">
          Alternatives
        </Link>
        {categoryList.map((category) => (
          <span key={category.id}>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <Link to={`/browse?view=alternatives&category=${category.id}`} className="hover:text-ink">
              {category.name}
            </Link>
          </span>
        ))}
      </nav>

      <header className="max-w-2xl">
        <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight sm:text-[2.5rem]">
          {alternative.name}
        </h1>
        <p className="mt-1 text-lg text-muted">{alternative.tagline}</p>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
          <OpennessBadge openness={alternative.openness} />
          <Tag title="Licence">{alternative.license}</Tag>
          <Tag>since {alternative.since}</Tag>
          <Tag>{KIND_LABELS[alternative.kind].toLowerCase()}</Tag>
        </p>
        <p className="mt-4 text-lg">{alternative.description}</p>
        <div className="mt-3">
          <Provenance entry={alternative} folder="alternatives" />
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          <li>
            <ExternalLink href={alternative.links.website}>Website</ExternalLink>
          </li>
          <li>
            <ExternalLink href={alternative.links.docs}>Documentation</ExternalLink>
          </li>
          <li>
            <ExternalLink href={alternative.links.source}>Source code</ExternalLink>
          </li>
        </ul>
      </header>

      <div className="mt-10 grid gap-x-14 gap-y-8 md:grid-cols-2">
        <section aria-labelledby="strengths">
          <h2 id="strengths" className="mb-3 text-[1.3rem] leading-tight font-extrabold">
            Strengths
          </h2>
          <MarkedList kind="good" items={alternative.strengths} />
        </section>
        <section aria-labelledby="weaknesses">
          <h2 id="weaknesses" className="mb-3 text-[1.3rem] leading-tight font-extrabold">
            Weaknesses
          </h2>
          <MarkedList kind="bad" items={alternative.weaknesses} />
        </section>
      </div>

      <Section title="The project">
        <div className="max-w-2xl">
          <Rating label="Maturity" scale="maturity" level={alternative.maturity.score} />
          <p className="mt-2">{alternative.maturity.rationale}</p>
          <dl className="mt-4">
            <Fact label="Who is behind it">{alternative.backing}</Fact>
            <Fact label="Licence">
              <span className="font-bold">{alternative.license}</span>.{' '}
              {OPENNESS_LABELS[alternative.openness].meaning}
            </Fact>
            <Fact label="Where you use it">
              {alternative.platforms.map((platform) => PLATFORM_LABELS[platform]).join(', ')}
            </Fact>
          </dl>
          {alternative.licenseNote && (
            <div className="mt-5">
              <Callout title="Licence note">{alternative.licenseNote}</Callout>
            </div>
          )}
        </div>
      </Section>

      <Section
        title={selfHosting ? 'Running it' : 'Nothing to host'}
        intro={
          selfHosting
            ? undefined
            : 'It runs on your own devices. There is no server to install, secure or keep online.'
        }
      >
        {selfHosting && (
          <div className="grid gap-x-14 gap-y-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div>
              <h3 className="text-[1.3rem] font-extrabold">
                Self-hosting{selfHosting.optional ? ' (optional)' : ''}
              </h3>
              <div className="mt-2">
                <Rating label="Running it" scale="difficulty" level={selfHosting.difficulty} />
              </div>
              <p className="mt-3">{selfHosting.summary}</p>
              <dl className="mt-3">
                <Fact label="Memory" short>
                  {selfHosting.requirements.ram}
                </Fact>
                {selfHosting.requirements.cpu && (
                  <Fact label="Processor" short>
                    {selfHosting.requirements.cpu}
                  </Fact>
                )}
                <Fact label="Setup time" short>
                  {formatEffort(selfHosting.setupHours)}
                </Fact>
              </dl>
              {selfHosting.requirements.notes && (
                <p className="mt-2 text-muted">{selfHosting.requirements.notes}</p>
              )}
              <h4 className="label mt-5 mb-1.5">Official ways to install</h4>
              <ul className="space-y-1">
                {selfHosting.deploy.map((link) => (
                  <li key={link.url + link.label}>
                    <ExternalLink href={link.url}>{link.label}</ExternalLink>
                    <span className="text-muted"> · {DEPLOY_LABELS[link.kind]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[1.3rem] font-extrabold">Managed hosting</h3>
              {alternative.managedHosting.length > 0 ? (
                <ul className="mt-2 space-y-3">
                  {alternative.managedHosting.map((host) => (
                    <li key={host.url + host.label}>
                      <ExternalLink href={host.url}>{host.label}</ExternalLink>
                      {host.note && <p className="mt-0.5 text-muted">{host.note}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted">
                  No hosted option is listed in the catalog. If you know a reputable one, add it.
                </p>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section title="Features">
        {categoryList.map((category) => (
          <Disclosure
            key={category.id}
            summary={category.name}
            hint={`${category.features.length} features`}
            defaultOpen={categoryList.length === 1}
          >
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {category.features.map((feature) => {
                const support = alternative.features[feature.id]
                const note = alternative.featureNotes?.[feature.id]
                // One line each: the feature, then whether it is there. A note, if any, goes below.
                return (
                  <div
                    key={feature.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 border-b border-line py-2"
                  >
                    <dt title={feature.hint}>{feature.name}</dt>
                    <dd>{support ? <SupportMark support={support} /> : '—'}</dd>
                    {note && <dd className="col-span-2 mt-0.5 text-sm leading-snug text-muted">{note}</dd>}
                  </div>
                )
              })}
            </dl>
          </Disclosure>
        ))}
      </Section>

      <Section title={`Replaces ${replaces.length} ${replaces.length === 1 ? 'tool' : 'tools'}`}>
        <SituationBar />
        <ul className="mt-2 max-w-2xl">
          {replaces.map(({ tool, path, result }) => (
            <li key={tool.id}>
              <IndexRow
                to={`/tools/${tool.id}`}
                title={tool.name}
                end={<ScoreBadge band={result.band} size="sm" />}
                detail={path.verdict}
                detailOnPhone={false}
              />
            </li>
          ))}
        </ul>
      </Section>

      {guides.length > 0 && (
        <Section title="Checklists that use it">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {guides.map((guide) => (
              <li key={guide.id}>
                <Link to={`/guides/${guide.id}`} className="link inline-flex items-center gap-1">
                  {guide.title} <IconArrowRight className="text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <EntryFooter
        folder="alternatives"
        id={alternative.id}
        name={alternative.name}
        reviewed={alternative.reviewed}
      />
    </Page>
  )
}
