# The catalog

Plain JSON, one file per entry. The file name (without `.json`) must equal the entry's `id`.

```
categories.json     categories and the features compared within each
tools/              proprietary tools and the paths out of them
alternatives/       open-source (and near-open) projects
suites/             bundles of tools, such as Microsoft 365
guides/             migration checklists
```

Run `npm run validate` after any change. It prints one line per problem, with the file and field.

The authoritative definition of every field is [`src/catalog/schema.ts`](../src/catalog/schema.ts). This
page explains the parts that need judgement.

## The 1–5 scales

| Field                                | 1 means                           | 5 means                                      |
| ------------------------------------ | --------------------------------- | -------------------------------------------- |
| `tool.lockIn.level`                  | Walk away any time                | Data, identity and habits are all tied to it |
| `tool.export.difficulty`             | One click, open formats           | No real export exists                        |
| `path.import.difficulty`             | Built-in importer that just works | Manual, lossy, or write your own converter   |
| `path.fit`                           | A different product               | Like for like; colleagues barely notice      |
| `alternative.maturity.score`         | Experimental                      | Boring in the best way                       |
| `alternative.selfHosting.difficulty` | An afternoon with Docker          | You are now an on-call sysadmin              |

Higher is worse for the difficulty and lock-in scales, and better for fit and maturity. The site shows each
rating as the word for it, so you only supply the number.

`tool.lockIn.level` also feeds the difficulty score, so rate it for what ties people to the tool beyond
their own data: other people's files and habits, integrations, shared channels.

`maturity` is about track record: age, release discipline, who maintains the project and how it is funded.
It is not a feature count and it is not GitHub stars.

`fit` belongs to a path, not to an alternative. Syncthing is an excellent piece of software and still a 2
as a replacement for OneDrive, because it is not a cloud drive.

## Tools

A tool is something proprietary that people want to leave. Besides the basics it records:

- `lockIn.factors`: what actually keeps people there, in their terms
- `export`: how to get data out, as a list of `methods`, plus `caveats`
- `paths`: one per alternative. Each has a `fit`, a one-sentence `verdict`, how the `import` works, an
  `effortHours` range, and two lists: `transfers` and `lost`

`effortHours` is `[low, high]` hours for **one person** to move their data and settle in. It excludes
server setup, which comes from the alternative's `selfHosting.setupHours`. The app scales it by team size.

`alsoCovers` lists other products the entry applies to (the Zoom entry covers Google Meet and Teams
meetings). They are searchable. Only use it when the export story really is the same.

A path may only point to an alternative in the tool's own category.

## Alternatives

- `kind`: `server`, `desktop` or `peer-to-peer`
- `openness` and `license`: see CONTRIBUTING.md. Use the SPDX identifier for `license` where there is one
- `backing`: who maintains it and how it is paid for, in a sentence
- `selfHosting`: `null` when there is nothing to host. Otherwise a difficulty, a summary, `setupHours` to a
  production-worthy instance (TLS, backups, updates), requirements, and official `deploy` links.
  Set `optional: true` when the app works fully on one device and the server only adds sync
- `managedHosting`: hosted offerings, official first. An empty list is fine
- `features`: one value for every feature of each category the alternative belongs to:
  `yes`, `partial`, `addon` (needs an extra component or third-party piece) or `no`.
  Use `featureNotes` for a short qualifier, keyed by feature id

## Categories

Each category defines the rows of the feature comparison. Features should be things people actually
choose on, phrased so that "yes" is the answer a user hopes for. Adding a feature to a category means
adding a value for it to every alternative in that category; the validator will list them for you.

## Suites and guides

A suite maps a bundle's parts to tool entries, with a label for what the suite calls each part.

A guide is a checklist in phases. Step ids must be unique within the guide and must never be renamed
after publication, because saved progress is keyed by them. Adding and removing steps is safe.

## `reviewed`

The month (`YYYY-MM`) someone last checked the entry against the project's current state. Update it when
you verify an entry, whether or not anything changed.

## `checkedBy`

Optional, on tools and alternatives: the people who wrote the entry or checked it against their own
experience of the tool.

```json
"checkedBy": [{ "name": "Your name or handle", "url": "https://example.org/you" }]
```

`url` is optional. An entry without `checkedBy` is shown on the site as an AI draft; adding your name is
what marks it as checked. Only add yourself to entries for tools you use or have run.

## Feature values

Each feature of an alternative is `yes`, `partial`, `addon`, `no` or `unknown`. Use `unknown` when you do
not know: the site shows it as "Not known", which is more useful than a guess. A short `featureNotes`
entry can say what would need checking.

Lists such as `strengths` and `weaknesses` have a minimum length, not a fixed one. Write down what is
worth knowing about the project and stop; do not pad a list to match another entry.
