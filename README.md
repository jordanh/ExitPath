# ExitPath

Open-source alternatives to common proprietary tools, and what it takes to switch.

ExitPath is a catalog of open-source alternatives to Microsoft 365, Google Workspace, Slack, Notion,
GitHub, Jira and other tools. For each alternative it records how well it replaces the original, what data
transfers, and how hard the move is. It also has step-by-step checklists for four common migrations.

![The ExitPath home page: a search field and an index of tools, each with its alternatives and the grade of the easiest one](docs/screenshot.png)

![The Slack page: its three alternatives in a table, with difficulty, fit, hosting and a one-line verdict for each](docs/screenshot-paths.png)

## What it does

- **Catalog with search.** 19 proprietary tools, 41 alternatives and 60 migration paths between them.
  Each alternative lists its licence, who funds it, a maturity rating with a written rationale, and its
  weaknesses as well as its strengths. Open-core and source-available projects are labelled as such.
- **A comparison table per tool.** One row per alternative: difficulty, fit, hosting, a one-line verdict
  and its main drawback. A row unfolds to show what transfers, how the import works, both hosting routes
  and how the grade was worked out. A second table compares features.
- **Difficulty in words, effort in hours.** Each migration is graded easy, moderate, demanding, hard or
  very hard, with an hours-to-weeks estimate, for the team size and hosting you choose with toggles on the
  page. The 0–100 score behind the grade is shown only next to its breakdown.
- **Who checked each entry.** Most of the catalog was drafted with an AI assistant. Every entry says
  whether a person who uses the tool has written or checked it, and names them, or is still an AI draft.
- **Your plan.** Select everything you use and get one plan: a replacement for each tool, the total
  hands-on work (counting a shared destination only once) and an order to do it in, easiest first. Tick
  moves off as you finish them, and see how many weeks the rest takes at the hours you can give.
- **Take it with you.** Copy a plan or a checklist as a Markdown task list for an issue tracker or a wiki,
  print either, or share a plan as a link. The link carries the plan in its address; nothing is uploaded.
- **Checklists.** Step-by-step plans for leaving Microsoft 365, Google Workspace, Slack and Notion, with
  progress and notes saved as you go, and a print layout for paper.
- **Options.** Open source only, hours per week, colours and text size, and export, import or erase of
  what the site has stored.
- **Search from anywhere.** Press `/` or Ctrl+K on any page; it forgives a typo.
- **Links.** Official docs, Docker Compose files, installers and one-click deploys for self-hosting, plus
  managed hosting options where they exist.

## Local-first

The whole catalog is bundled with the app. After the page loads it makes no network requests: no
analytics, no accounts, no web fonts, no API. Your options, plan and checklist progress live in your
browser's local storage and can be exported to a JSON file, imported on another device, or erased, all
from the options dialog.

On Vercel that promise is enforced rather than merely kept: [`vercel.json`](vercel.json) sends a content
security policy with `connect-src 'none'`, fonts from its own origin only, and no inline scripts or styles, so the page could not phone home
even if a dependency tried to. If you host it elsewhere, send the same headers.

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

The link check also runs on GitHub every Monday, and on demand from the Actions tab ("Check catalog
links"). It fails when a link is dead, so broken links surface without anyone having to remember.

### Hosting it yourself

`npm run build` produces a fully static site in `dist/`. It uses relative asset paths and hash-based
routing, so it works from any path on any static host with no rewrite rules: copy the folder to a web
server, GitHub Pages or Codeberg Pages, or open it inside a desktop shell.

Link previews (the card shown when the site is shared) need absolute URLs. Set `SITE_URL` when building,
for example `SITE_URL=https://exit.example.org npm run build`; on Vercel the production domain is picked
up automatically. Without either, those tags are left out and everything else works.

Every catalog page ends with "Edit this entry" and "Report a problem" links. If you fork the project,
point them at your repository in [`src/lib/site.ts`](src/lib/site.ts).

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

Every path gets a difficulty score from 0 to 100, built from six ratings on a 1–5 scale:

| Factor           | Weight | Comes from                                                  |
| ---------------- | ------ | ----------------------------------------------------------- |
| Getting data out | 15%    | The tool's export difficulty                                |
| Getting data in  | 20%    | The path's import difficulty                                |
| Running it       | 25%    | Self-hosting difficulty, or 1 if managed or nothing to host |
| Feature gap      | 15%    | Six minus the path's fit rating                             |
| Lock-in          | 15%    | The tool's lock-in rating: other people, formats, habits    |
| People to move   | 10%    | Your answer to "Who is moving?"                             |

The score is 60% the weighted average of those factors and 40% the single hardest of the first five,
because a migration is as hard as its hardest part: files that open anywhere do not help much while
everyone you work with still sends the old format. Effort is the path's per-person hours scaled by team
size, plus server setup time. The whole model is one short function in
[`src/lib/scoring.ts`](src/lib/scoring.ts), and it is meant to be argued with.

The site shows the grade as a word and keeps the number for the breakdown, because it is a judgement
and not a measurement. A low score only says the move is easy; each alternative also shows its fit, a
verdict, its main drawback, and the grade both self-hosted and hosted where a provider exists.

Ratings are opinions, not measurements. The first version of the catalog was compiled with an AI assistant
from each project's public documentation. Not every entry has been checked by someone who runs the
software. Outside links are fetched every week by the "Check catalog links" workflow, which reports the
dead ones. Every entry records the month it was last reviewed, and corrections from people with first-hand
experience are the most useful contribution. Projects change licences, pricing and features, sometimes abruptly: check the project's own
documentation before committing a team to anything.

## Project layout

```
catalog/            the data (JSON)
scripts/            catalog validation CLI
src/
  catalog/          schema, validator and loader
  lib/              scoring, search, plans, sharing, local storage
  components/       shared UI
  pages/            one file per route
```

Built with React, TypeScript, Vite and Tailwind CSS. Runtime dependencies are React and React Router;
nothing else ships to the browser.

## The look

Deliberately plain: a white page, dark text, blue links and tables. The site opens with the search field
and the index, tool pages are tables, and detail stays folded until asked for. There is no landing page.

- **One typeface.** Alegreya Sans throughout, under the SIL Open Font License and bundled from npm at
  build time, so no font service is contacted.
- **Standard controls.** The browser's own checkboxes, progress bar and select menus; buttons and fields
  with ordinary corners.
- **Grades have shapes.** Easy is a green circle, moderate a blue square, demanding a gold triangle, hard
  a red diamond and very hard a black double diamond. The shape and the word carry the grade, so nothing
  depends on telling colours apart.
- **Ratings are words.** A 1–5 rating is shown as the word for it ("Mature", "Easy"), not as a meter.
- **Less on a phone.** Below 640 pixels a list shows one line per item, a name and its grade. The two
  toggles fold into a line that states the current answers, and an alternative's fit, hosting and main
  drawback move into its details. Nothing is removed: it is one tap further away.

Colours are CSS variables in [`src/index.css`](src/index.css) with light, dark and print values.

## Not built yet

Ideas that fit, roughly in the order they seem useful:

- Export and import helper scripts for the common paths (Takeout to Immich, OneDrive to Nextcloud, IMAP to IMAP)
- Community notes on what actually worked, moderated through pull requests
- Offline use after the first visit, and a desktop build that can check which services you already run
- Translations, and JSON Schema files for editor autocompletion in the catalog

## Licence

[MIT](LICENSE), code and catalog alike.
