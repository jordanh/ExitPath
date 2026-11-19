/**
 * The words that go with each 1–5 rating, and whether a high number is good
 * news. Kept in one place so the UI and the About page cannot disagree.
 */
import type { DeployKind, Openness, Platform, Support } from '../catalog/schema.ts'

export type ScaleId = 'difficulty' | 'lockIn' | 'maturity' | 'fit'

export const SCALES: Record<
  ScaleId,
  {
    title: string
    labels: [string, string, string, string, string]
    higherIsBetter: boolean
    meaning: string
  }
> = {
  difficulty: {
    title: 'Difficulty',
    labels: ['Trivial', 'Easy', 'Moderate', 'Hard', 'Very hard'],
    higherIsBetter: false,
    meaning:
      'Used for exporting, importing and self-hosting. 1 is a built-in button that just works or an afternoon with Docker; 5 means no real export exists, or you are now an on-call sysadmin.',
  },
  lockIn: {
    title: 'Lock-in',
    labels: ['Minimal', 'Low', 'Moderate', 'High', 'Severe'],
    higherIsBetter: false,
    meaning:
      'How entangled you become with the proprietary tool. 1 means you can walk away any time; 5 means your data, identity and working habits are all tied to it.',
  },
  maturity: {
    title: 'Maturity',
    labels: ['Experimental', 'Young', 'Maturing', 'Mature', 'Rock solid'],
    higherIsBetter: true,
    meaning:
      'Real-world track record: age, release discipline, who maintains it and how it is funded. Not a measure of how many features it has or how many stars.',
  },
  fit: {
    title: 'Fit',
    labels: ['Different product', 'Partial', 'Workable', 'Close', 'Like for like'],
    higherIsBetter: true,
    meaning:
      'How completely an alternative replaces one specific tool. The same project can be a 5 for one tool and a 2 for another.',
  },
}

/** Colour tone 1 (good) to 5 (bad) for a rating on the given scale. */
export function toneFor(scale: ScaleId, level: number): number {
  return SCALES[scale].higherIsBetter ? 6 - level : level
}

export const OPENNESS_LABELS: Record<Openness, { label: string; tone: number; meaning: string }> = {
  'open-source': {
    label: 'Open source',
    tone: 1,
    meaning: 'Everything you need is under an OSI-approved licence.',
  },
  'open-core': {
    label: 'Open core',
    tone: 3,
    meaning:
      'An open-source core with features, limits or components that need a paid or proprietary licence.',
  },
  'source-available': {
    label: 'Source-available',
    tone: 4,
    meaning:
      'You can read and self-host the code, but the licence is not open source and restricts some uses.',
  },
}

export const SUPPORT_LABELS: Record<Support, string> = {
  yes: 'Yes',
  partial: 'Partly',
  addon: 'Add-on',
  no: 'No',
  unknown: 'Not known',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  web: 'Web',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  bsd: 'BSD',
  android: 'Android',
  ios: 'iOS',
}

export const DEPLOY_LABELS: Record<DeployKind, string> = {
  'docker-compose': 'Docker Compose',
  'one-click': 'One-click',
  helm: 'Helm chart',
  installer: 'Installer',
  guide: 'Guide',
}

export const KIND_LABELS = {
  server: 'Server with apps',
  desktop: 'Runs on your device',
  'peer-to-peer': 'Peer-to-peer, no server',
} as const
