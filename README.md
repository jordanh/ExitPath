# ExitPath

Find your way out of big-platform lock-in.

ExitPath helps people and small teams find, compare and switch to open-source alternatives for the tools
they depend on: Microsoft 365, Google Workspace, Slack, Notion, GitHub and others. It is not another
software suite. It is a map of the projects that already exist, with the distances marked honestly: what
moves across, what does not, how hard the switch is, and the order to do it in.

![The Slack page, showing Mattermost as the easiest path with its difficulty score, effort estimate, and what does and does not transfer](docs/screenshot.png)

## What it does

- **Searchable catalog.** 15 proprietary tools, 30 alternatives and 42 migration paths between them. Each
  alternative carries its real licence, who funds it, a maturity rating with a written rationale, and a list
  of weaknesses as well as strengths. Open-core and source-available projects are labelled as such.
- **Side-by-side comparison.** For any tool, compare its alternatives on features, licence, maturity,
  import difficulty, self-hosting difficulty and server requirements.
- **Migration difficulty score and effort estimate.** A 0–100 score and an hours-to-weeks estimate for
  every path, adjusted for how many people are moving and whether you self-host. The arithmetic is simple
  and shown in full on the "How it works" page.
- **Guided checklists.** Step-by-step plans for leaving Microsoft 365, Google Workspace, Slack and Notion,
  with progress and notes saved as you go.
- **Links that matter.** Official docs, Docker Compose files, installers and one-click deploys for
  self-hosting, plus managed hosting options where they exist.

## Local-first

The whole catalog is bundled with the app. After the page loads it makes no network requests: no
analytics, no accounts, no web fonts, no API. Your situation and checklist progress live in your browser's
local storage and can be exported to a JSON file, imported on another device, or erased.

## Run it

Requires Node.js 22.18 or newer.

```sh
npm install
npm run dev        # http://localhost:5173
```

| Command               | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start the development server                           |
| `npm run build`       | Type-check and build the static site into `dist/`      |
| `npm run preview`     | Serve the built site locally                           |
| `npm run validate`    | Check every catalog file against the schema            |
| `npm test`            | Run the test suite                                     |
| `npm run lint`        | Lint the source                                        |
| `npm run format`      | Format code and catalog files                          |
| `npm run check`       | Validate, lint, test and build: what CI runs           |
| `npm run check-links` | Fetch every link in the catalog and list the dead ones |

### Hosting it yourself

`npm run build` produces a fully static site in `dist/`. It uses relative asset paths and hash-based
routing, so it works from any path on any static host with no rewrite rules: copy the folder to a web
server, GitHub Pages or Codeberg Pages, or open it inside a desktop shell.

## The catalog

Everything the app knows lives in [`catalog/`](catalog) as plain JSON, one file per entry:

```
catalog/
  categories.json     feature lists used for comparison
  tools/              proprietary tools, how to export from them, and the paths out
  alternatives/       open-source projects: licence, maturity, hosting, strengths, weaknesses
  suites/             bundles such as Microsoft 365, mapped to their component tools
  guides/             migration checklists
```

The shape of each file is defined once, in [`src/catalog/schema.ts`](src/catalog/schema.ts). The app's
types are inferred from it, `npm run validate` checks every file against it, and the validator also
enforces what a schema cannot: that ids match file names, references resolve, and every alternative has a
value for every feature in its category.

To fix a rating or add an entry, see [CONTRIBUTING.md](CONTRIBUTING.md) and
[catalog/README.md](catalog/README.md).

## How scores work

Every path gets a difficulty score from 0 to 100, built from five ratings on a 1–5 scale:

| Factor           | Weight | Comes from                                                  |
| ---------------- | ------ | ----------------------------------------------------------- |
| Getting data out | 20%    | The tool's export difficulty                                |
| Getting data in  | 25%    | The path's import difficulty                                |
| Running it       | 25%    | Self-hosting difficulty, or 1 if managed or nothing to host |
| Feature gap      | 20%    | Six minus the path's fit rating                             |
| People to move   | 10%    | Your answer to "Who is moving?"                             |

The score is 60% the weighted average of those factors and 40% the single hardest of the first four,
because a migration is as hard as its hardest step. Effort is the path's per-person hours scaled by team
size, plus server setup time. The whole model is one short
function in [`src/lib/scoring.ts`](src/lib/scoring.ts), and it is meant to be argued with.

Ratings are informed opinions written by people, not measurements. Every entry records the month it was
last reviewed. Projects change licences, pricing and features, sometimes abruptly: check the project's own
documentation before committing a team to anything.

## Project layout

```
catalog/            the data (JSON)
scripts/            catalog validation CLI
src/
  catalog/          schema, validator and loader
  lib/              scoring, search, local storage
  components/       shared UI
  pages/            one file per route
```

Built with React, TypeScript, Vite and Tailwind CSS. Runtime dependencies are React and React Router;
nothing else ships to the browser.

## Not built yet

Ideas that fit, roughly in the order they seem useful:

- Export and import helper scripts for the common paths (Takeout to Immich, OneDrive to Nextcloud, IMAP to IMAP)
- "My stack": pick everything you use and get one combined plan
- Community notes on what actually worked, moderated through pull requests
- A desktop build that can check which services you already run
- Translations, and JSON Schema files for editor autocompletion in the catalog

## Licence

[MIT](LICENSE), code and catalog alike.
