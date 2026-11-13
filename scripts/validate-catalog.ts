/**
 * Validates every file in /catalog. Run with `npm run validate`.
 * Exits non-zero and prints one line per problem when something is wrong.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RawCatalog } from '../src/catalog/schema.ts'
import { validateCatalog, type Issue } from '../src/catalog/validate.ts'

const root = fileURLToPath(new URL('../catalog/', import.meta.url))
const parseErrors: Issue[] = []

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(join(root, file), 'utf8'))
  } catch (error) {
    parseErrors.push({ file, message: `not valid JSON: ${(error as Error).message}` })
    return undefined
  }
}

function readDir(dir: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const name of readdirSync(join(root, dir)).sort()) {
    if (!name.endsWith('.json')) continue
    const value = readJson(`${dir}/${name}`)
    if (value !== undefined) out[basename(name, '.json')] = value
  }
  return out
}

const raw: RawCatalog = {
  categories: readJson('categories.json'),
  alternatives: readDir('alternatives'),
  tools: readDir('tools'),
  suites: readDir('suites'),
  guides: readDir('guides'),
}

const { catalog, issues } = validateCatalog(raw)
const all = [...parseErrors, ...issues]

if (all.length > 0) {
  console.error(`Catalog has ${all.length} problem${all.length === 1 ? '' : 's'}:\n`)
  for (const issue of all) console.error(`  catalog/${issue.file}\n    ${issue.message}`)
  process.exit(1)
}

const paths = catalog.tools.reduce((sum, tool) => sum + tool.paths.length, 0)
console.log(
  `Catalog OK: ${catalog.tools.length} tools, ${catalog.alternatives.length} alternatives, ` +
    `${paths} paths, ${catalog.suites.length} suites, ${catalog.guides.length} guides.`,
)
