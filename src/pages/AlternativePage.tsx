import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAlternative, getCategory, guidesForAlternative } from '../catalog/index.ts'
import type { Alternative } from '../catalog/schema.ts'
import { IconArrowRight } from '../components/icons.tsx'
import {
  Callout,
  ExternalLink,
  MarkedList,
  Meter,
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
import { usePrefs } from '../lib/storage.ts'
import { useTitle } from '../lib/use-title.ts'
import { NotFound } from './NotFound.tsx'

export function AlternativePage() {
  const { id } = useParams()
  const alternative = id ? getAlternative(id) : undefined
  return alternative ? <AlternativeView alternative={alternative} /> : <NotFound what="alternative" />
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  )
}

function AlternativeView({ alternative }: { alternative: Alternative }) {
  useTitle(alternative.name)
  const { teamSize, hosting } = usePrefs()
  const replaces = scoredPathsTo(alternative, { teamSize, hosting })
  const guides = guidesForAlternative(alternative.id)
  const selfHosting = alternative.selfHosting
  const categoryList = alternative.categories.flatMap((id) => getCategory(id) ?? [])

  return (
    <Page>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
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

      <header className="max-w-3xl">
        <p className="eyebrow">Alternative · {KIND_LABELS[alternative.kind]}</p>
        <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          {alternative.name}
        </h1>
        <p className="mt-2 text-xl text-muted">{alternative.tagline}</p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <OpennessBadge openness={alternative.openness} />
          <Tag title="Licence">{alternative.license}</Tag>
          <Tag>Since {alternative.since}</Tag>
        </div>
        <p className="mt-5 text-lg">{alternative.description}</p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
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

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5" aria-labelledby="strengths">
          <h2 id="strengths" className="mb-3 text-lg font-bold">
            Where it is strong
          </h2>
          <MarkedList kind="good" items={alternative.strengths} />
        </section>
        <section className="card p-4 sm:p-5" aria-labelledby="weaknesses">
          <h2 id="weaknesses" className="mb-3 text-lg font-bold">
            Where it falls short
          </h2>
          <MarkedList kind="bad" items={alternative.weaknesses} />
        </section>
      </div>

      <Section eyebrow="Can you rely on it?" title="The project">
        <div className="card p-4 sm:p-5">
          <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <div>
              <dt className="sr-only">Maturity</dt>
              <dd>
                <Meter label="Maturity" scale="maturity" level={alternative.maturity.score} />
                <p className="mt-2 text-sm">{alternative.maturity.rationale}</p>
              </dd>
            </div>
            <Fact label="Who is behind it">{alternative.backing}</Fact>
            <Fact label="Licence">
              <span className="font-semibold">{alternative.license}</span> ·{' '}
              {OPENNESS_LABELS[alternative.openness].meaning}
            </Fact>
            <Fact label="Where you use it">
              {alternative.platforms.map((platform) => PLATFORM_LABELS[platform]).join(', ')}
            </Fact>
          </dl>
          {alternative.licenseNote && (
            <div className="mt-5">
              <Callout
                title="Read this before you commit"
                tone={alternative.openness === 'open-source' ? 2 : 3}
              >
                {alternative.licenseNote}
              </Callout>
            </div>
          )}
        </div>
      </Section>

      <Section
        eyebrow="Running it"
        title={selfHosting ? 'Hosting it yourself, or not' : 'Nothing to host'}
        intro={
          selfHosting
            ? undefined
            : 'It runs on your own devices. There is no server to install, secure or keep online.'
        }
      >
        {selfHosting && (
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="card p-4 sm:p-5 lg:col-span-3">
              <h3 className="font-bold">Self-hosting{selfHosting.optional ? ' (optional)' : ''}</h3>
              <div className="mt-2">
                <Meter label="Difficulty" scale="difficulty" level={selfHosting.difficulty} />
              </div>
              <p className="mt-3 text-sm">{selfHosting.summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
                <Fact label="Memory">{selfHosting.requirements.ram}</Fact>
                {selfHosting.requirements.cpu && (
                  <Fact label="Processor">{selfHosting.requirements.cpu}</Fact>
                )}
                <Fact label="Setup time">{formatEffort(selfHosting.setupHours)}</Fact>
              </dl>
              {selfHosting.requirements.notes && (
                <p className="mt-3 text-sm text-muted">{selfHosting.requirements.notes}</p>
              )}
              <h4 className="eyebrow mt-5 mb-2">Official ways to install</h4>
              <ul className="space-y-2 text-sm">
                {selfHosting.deploy.map((link) => (
                  <li key={link.url + link.label} className="flex flex-wrap items-center gap-2">
                    <Tag>{DEPLOY_LABELS[link.kind]}</Tag>
                    <ExternalLink href={link.url}>{link.label}</ExternalLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4 sm:p-5 lg:col-span-2">
              <h3 className="font-bold">Managed hosting</h3>
              {alternative.managedHosting.length > 0 ? (
                <ul className="mt-3 space-y-3 text-sm">
                  {alternative.managedHosting.map((host) => (
                    <li key={host.url + host.label}>
                      <ExternalLink href={host.url}>{host.label}</ExternalLink>
                      {host.note && <p className="mt-0.5 text-muted">{host.note}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  No hosted option is listed in the catalog. If you know a reputable one, add it.
                </p>
              )}
            </div>
          </div>
        )}
      </Section>

      {categoryList.map((category) => (
        <Section key={category.id} eyebrow="Features" title={category.name}>
          <div className="card">
            <dl className="grid sm:grid-cols-2 lg:grid-cols-3">
              {category.features.map((feature) => {
                const support = alternative.features[feature.id]
                return (
                  <div key={feature.id} className="border-b border-line px-4 py-3 sm:px-5">
                    <dt className="text-sm font-medium" title={feature.hint}>
                      {feature.name}
                    </dt>
                    <dd className="mt-1">
                      {support ? (
                        <SupportMark support={support} note={alternative.featureNotes?.[feature.id]} />
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </Section>
      ))}

      <Section
        eyebrow="What it replaces"
        title={`${replaces.length} ${replaces.length === 1 ? 'path leads' : 'paths lead'} here`}
        intro="Fit is specific to what you are leaving. Scores follow the situation you set on any tool page."
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {replaces.map(({ tool, path, result }) => (
            <li key={tool.id}>
              <Link
                to={`/tools/${tool.id}`}
                className="card group flex h-full flex-col p-4 transition-[border-color,box-shadow] hover:border-accent hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    {tool.name}
                    <IconArrowRight className="text-accent" />
                  </h3>
                  <ScoreBadge score={result.score} band={result.band} size="sm" />
                </div>
                <p className="mt-2 text-sm text-muted">{path.verdict}</p>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                  <Meter label="Fit" scale="fit" level={path.fit} />
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-ink">{formatEffort(result.hours)}</span> of work
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {guides.length > 0 && (
        <Section eyebrow="Guided migrations" title="Checklists that use it">
          <ul className="flex flex-wrap gap-2 text-sm">
            {guides.map((guide) => (
              <li key={guide.id}>
                <Link
                  to={`/guides/${guide.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-semibold text-accent hover:border-accent"
                >
                  {guide.title} <IconArrowRight />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="mt-10 text-sm text-muted">Entry last reviewed {alternative.reviewed}.</p>
    </Page>
  )
}
