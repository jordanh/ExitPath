/**
 * The shape of everything in /catalog.
 *
 * These schemas are the single source of truth: the TypeScript types the app
 * uses are inferred from them, `npm run validate` checks every JSON file
 * against them, and the test suite does the same. The app itself only imports
 * the *types*, so zod never ends up in the browser bundle.
 */
import { z } from 'zod'

/** Lowercase, hyphenated identifier. Must match the JSON file name. */
const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use lowercase letters, digits and single hyphens')

/** 1–5 scale. What 1 and 5 mean depends on the field; see catalog/README.md. */
const Level = z.int().min(1).max(5)

const HttpsUrl = z.url({ protocol: /^https$/, error: 'must be an https:// URL' })

/** Month an entry was last checked against reality, e.g. "2026-11". */
const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'use YYYY-MM')

/** [low, high] estimate in hours. */
const HoursRange = z
  .tuple([z.number().min(0), z.number().min(0)])
  .refine(([low, high]) => low <= high, 'low estimate must not exceed high estimate')

const Text = z.string().trim().min(1)

export const LinkSchema = z.strictObject({
  label: Text,
  url: HttpsUrl,
})

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CategorySchema = z.strictObject({
  id: Id,
  name: Text,
  /** One line shown under the category name. */
  description: Text,
  /** Rows of the side-by-side comparison for this category. */
  features: z
    .array(
      z.strictObject({
        id: Id,
        name: Text,
        /** Optional clarification shown as a tooltip. */
        hint: Text.optional(),
      }),
    )
    .min(3),
})

// ---------------------------------------------------------------------------
// Alternatives (the open-source side)
// ---------------------------------------------------------------------------

export const OPENNESS = ['open-source', 'open-core', 'source-available'] as const
export const SUPPORT = ['yes', 'partial', 'addon', 'no'] as const
export const PLATFORMS = ['web', 'windows', 'macos', 'linux', 'bsd', 'android', 'ios'] as const
export const DEPLOY_KINDS = ['docker-compose', 'one-click', 'helm', 'installer', 'guide'] as const
export const KINDS = ['server', 'desktop', 'peer-to-peer'] as const

export const DeployLinkSchema = LinkSchema.extend({
  kind: z.enum(DEPLOY_KINDS),
})

export const SelfHostingSchema = z.strictObject({
  /** 1 = an afternoon with Docker, 5 = you are now an on-call sysadmin. */
  difficulty: Level,
  summary: Text,
  /** Hours to get a production-worthy instance up (TLS, backups, updates). */
  setupHours: HoursRange,
  requirements: z.strictObject({
    ram: Text,
    cpu: Text.optional(),
    notes: Text.optional(),
  }),
  /** Official install paths: Compose files, one-click deploys, install guides. */
  deploy: z.array(DeployLinkSchema).min(1),
  /**
   * True when the app is fully usable on one device without the server
   * (the server only adds sync or collaboration).
   */
  optional: z.boolean().optional(),
})

export const AlternativeSchema = z.strictObject({
  id: Id,
  name: Text,
  /** Under ten words. No marketing. */
  tagline: Text,
  description: Text,
  categories: z.array(Id).min(1),
  kind: z.enum(KINDS),

  openness: z.enum(OPENNESS),
  /** SPDX identifier where one exists. */
  license: Text,
  /** Anything a careful reader should know about the licence or paid tiers. */
  licenseNote: Text.optional(),
  /** Who maintains it and how it is funded. */
  backing: Text,
  /** Year of first public release. */
  since: z.int().min(1980).max(2100),

  maturity: z.strictObject({
    /** 1 = experimental, 5 = boring in the best way. */
    score: Level,
    rationale: Text,
  }),

  platforms: z.array(z.enum(PLATFORMS)).min(1),
  links: z.strictObject({
    website: HttpsUrl,
    source: HttpsUrl,
    docs: HttpsUrl,
  }),

  /** null when there is nothing to host (desktop apps, peer-to-peer tools). */
  selfHosting: SelfHostingSchema.nullable(),
  /** Hosted offerings, official first. Empty when none exist. */
  managedHosting: z.array(LinkSchema.extend({ note: Text.optional() })),

  strengths: z.array(Text).min(2),
  /** Be honest. An entry without real weaknesses will be sent back. */
  weaknesses: z.array(Text).min(2),

  /** One value per feature of each category this alternative belongs to. */
  features: z.record(Id, z.enum(SUPPORT)),
  /** Optional short qualifiers, keyed by feature id. */
  featureNotes: z.record(Id, Text).optional(),

  reviewed: Month,
})

// ---------------------------------------------------------------------------
// Tools (the proprietary side) and the paths out of them
// ---------------------------------------------------------------------------

export const PathSchema = z.strictObject({
  /** Alternative id. */
  to: Id,
  /** How completely it replaces the tool. 1 = different product, 5 = like for like. */
  fit: Level,
  /** One honest sentence: who should pick this path, or what the catch is. */
  verdict: Text,
  import: z.strictObject({
    /** 1 = built-in importer that just works, 5 = manual or lossy. */
    difficulty: Level,
    summary: Text,
    links: z.array(LinkSchema).optional(),
  }),
  /**
   * Hours for ONE person to move their data and settle in, excluding any
   * server setup (that comes from the alternative's selfHosting.setupHours).
   */
  effortHours: HoursRange,
  transfers: z.array(Text).min(1),
  lost: z.array(Text).min(1),
})

export const ToolSchema = z.strictObject({
  id: Id,
  name: Text,
  vendor: Text,
  category: Id,
  /** Other products this entry applies to; searchable. */
  alsoCovers: z.array(Text).optional(),
  summary: Text,
  lockIn: z.strictObject({
    /** 1 = walk away any time, 5 = deeply entangled. */
    level: Level,
    factors: z.array(Text).min(1),
  }),
  export: z.strictObject({
    /** 1 = one click to open formats, 5 = no real export exists. */
    difficulty: Level,
    summary: Text,
    methods: z
      .array(
        z.strictObject({
          name: Text,
          detail: Text,
          url: HttpsUrl.optional(),
        }),
      )
      .min(1),
    caveats: z.array(Text),
  }),
  paths: z.array(PathSchema).min(1),
  reviewed: Month,
})

// ---------------------------------------------------------------------------
// Suites (bundles such as Microsoft 365)
// ---------------------------------------------------------------------------

export const SuiteSchema = z.strictObject({
  id: Id,
  name: Text,
  vendor: Text,
  summary: Text,
  components: z
    .array(
      z.strictObject({
        /** What the suite calls this part, e.g. "Teams meetings". */
        label: Text,
        /** Tool id that covers it. */
        tool: Id,
      }),
    )
    .min(2),
  /** Guide id, when a guided migration exists. */
  guide: Id.optional(),
})

// ---------------------------------------------------------------------------
// Guides (migration checklists)
// ---------------------------------------------------------------------------

export const GuideStepSchema = z.strictObject({
  /** Unique within the guide. Never rename: saved progress is keyed by it. */
  id: Id,
  title: Text,
  detail: Text,
  links: z.array(LinkSchema).optional(),
  optional: z.boolean().optional(),
})

export const GuideSchema = z.strictObject({
  id: Id,
  title: Text,
  summary: Text,
  /** Who the guide is written for. */
  audience: Text,
  /** Realistic calendar time, as prose. */
  timeframe: Text,
  /** Tool ids this guide helps you leave. */
  tools: z.array(Id).min(1),
  /** The destination stack the guide assumes. */
  stack: z
    .array(
      z.strictObject({
        role: Text,
        alternative: Id,
        why: Text,
      }),
    )
    .min(1),
  phases: z
    .array(
      z.strictObject({
        id: Id,
        title: Text,
        intro: Text.optional(),
        steps: z.array(GuideStepSchema).min(1),
      }),
    )
    .min(2),
  reviewed: Month,
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Link = z.infer<typeof LinkSchema>
export type Category = z.infer<typeof CategorySchema>
export type Openness = (typeof OPENNESS)[number]
export type Support = (typeof SUPPORT)[number]
export type Platform = (typeof PLATFORMS)[number]
export type DeployKind = (typeof DEPLOY_KINDS)[number]
export type DeployLink = z.infer<typeof DeployLinkSchema>
export type SelfHosting = z.infer<typeof SelfHostingSchema>
export type Alternative = z.infer<typeof AlternativeSchema>
export type Path = z.infer<typeof PathSchema>
export type Tool = z.infer<typeof ToolSchema>
export type Suite = z.infer<typeof SuiteSchema>
export type GuideStep = z.infer<typeof GuideStepSchema>
export type Guide = z.infer<typeof GuideSchema>

/** Raw, unvalidated catalog contents keyed by file name (without extension). */
export interface RawCatalog {
  categories: unknown
  alternatives: Record<string, unknown>
  tools: Record<string, unknown>
  suites: Record<string, unknown>
  guides: Record<string, unknown>
}
