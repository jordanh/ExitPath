/**
 * Fetches every URL in /catalog and reports the ones that no longer work.
 * Run with `npm run check-links`. Needs network access, so it is not part of
 * `npm run check` or CI: a flaky third-party site should not fail a build.
 *
 * Exit code 1 when at least one link is definitely broken (404, 410, DNS
 * failure). Sites that refuse automated requests are listed separately and do
 * not fail the run; check those by hand.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../catalog/', import.meta.url))
const CONCURRENCY = 6
const TIMEOUT_MS = 20_000
const DNS_FAILURE = 'domain does not resolve'

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return jsonFiles(path)
    return name.endsWith('.json') ? [path] : []
  })
}

/** url -> catalog files that mention it */
const sources = new Map<string, Set<string>>()
function collect(value: unknown, file: string) {
  if (typeof value === 'string') {
    if (value.startsWith('https://')) {
      if (!sources.has(value)) sources.set(value, new Set())
      sources.get(value)!.add(file)
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collect(item, file)
  } else if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value)) collect(item, file)
  }
}
for (const file of jsonFiles(root)) {
  collect(JSON.parse(readFileSync(file, 'utf8')), relative(root, file))
}

type Outcome = { kind: 'ok' } | { kind: 'broken'; reason: string } | { kind: 'unverified'; reason: string }

async function check(url: string): Promise<Outcome> {
  try {
    const response = await fetch(url, {
      // GET, not HEAD: plenty of documentation hosts answer HEAD with 405.
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'exitpath-link-check', accept: 'text/html,*/*' },
    })
    await response.body?.cancel()
    if (response.ok) return { kind: 'ok' }
    if (response.status === 404 || response.status === 410) {
      return { kind: 'broken', reason: `HTTP ${response.status}` }
    }
    // 401, 403, 429 and 5xx usually mean "not for robots" or "not right now".
    return { kind: 'unverified', reason: `HTTP ${response.status}` }
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause?.code
    if (cause === 'ENOTFOUND') return { kind: 'broken', reason: DNS_FAILURE }
    const reason =
      (error as Error).name === 'TimeoutError' ? 'timed out' : (cause ?? (error as Error).message)
    return { kind: 'unverified', reason }
  }
}

const urls = [...sources.keys()].sort()
const results = new Map<string, Outcome>()
let next = 0
async function worker() {
  while (next < urls.length) {
    const url = urls[next++]!
    results.set(url, await check(url))
    process.stdout.write('.')
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
process.stdout.write('\n\n')

// One domain that stops resolving is a dead link. Dozens at once is this
// machine's network (offline, a proxy, filtered DNS), not the catalog.
const dnsFailures = urls.filter((url) => {
  const outcome = results.get(url)!
  return outcome.kind === 'broken' && outcome.reason === DNS_FAILURE
})
if (dnsFailures.length > Math.max(5, urls.length / 10)) {
  for (const url of dnsFailures) {
    results.set(url, { kind: 'unverified', reason: `${DNS_FAILURE} from this network` })
  }
}

function report(kind: Outcome['kind'], title: string) {
  const matching = urls.filter((url) => results.get(url)!.kind === kind)
  if (matching.length === 0) return 0
  console.log(`${title} (${matching.length}):`)
  for (const url of matching) {
    const outcome = results.get(url) as { reason: string }
    console.log(`  ${url}\n    ${outcome.reason} · in ${[...sources.get(url)!].join(', ')}`)
  }
  console.log()
  return matching.length
}

const broken = report('broken', 'Broken')
const unverified = report('unverified', 'Could not verify, check by hand')
console.log(
  `${urls.length} links checked: ${urls.length - broken - unverified} fine, ${broken} broken, ${unverified} unverified.`,
)
if (unverified > urls.length / 2) {
  console.log('Most links could not be reached. Is this machine offline, behind a proxy or on filtered DNS?')
}
process.exit(broken > 0 ? 1 : 0)
