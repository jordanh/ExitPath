# Contributing

The most useful contributions are to the catalog: fixing a rating that is wrong, updating an entry after a
project changes, or adding an alternative that someone has really run. You do not need to know React to do
any of that. Every entry is a JSON file.

The first version of the catalog was compiled with an AI assistant from each project's public
documentation, so some entries have not yet been checked by anyone who runs the software. If you do run
one of them, confirming or correcting its entry is the single most valuable thing you can do here.

## Before you start

```sh
npm install
npm run validate   # checks the catalog
npm run check      # everything CI runs: validate, lint, test, build
```

`npm run dev` shows your changes in the browser as you save. `npm run check-links` fetches every URL in
the catalog and lists the ones that no longer work; run it when you add or review links.

## Changing the catalog

The catalog layout and every field are described in [catalog/README.md](catalog/README.md). The schema in
[`src/catalog/schema.ts`](src/catalog/schema.ts) is the final word.

### What makes a good entry

**Be honest about weaknesses.** Every alternative needs at least two real ones. "Smaller community" is
acceptable; "none, really" is not. If the entry reads like the project's own home page, it will be sent back.

**Get the licence right.** `openness` has three values and the difference matters:

- `open-source`: everything you need is under an OSI-approved licence.
- `open-core`: an open-source core, with features, limits or components that need a paid or proprietary
  licence. Say which in `licenseNote`.
- `source-available`: readable and self-hostable, but under a licence that is not open source (BSL, SSPL,
  "fair-code" and similar). Say what is restricted in `licenseNote`.

Anything other than `open-source` must have a `licenseNote`. The tests enforce this.

**Rate from experience, and write the reason down.** `maturity.rationale`, `verdict` and the `summary`
fields exist so that a reader can disagree with you. A number without a reason is not much use.

**Ratings are relative to the rest of the catalog.** Before you write a 5 for self-hosting difficulty,
look at what else has a 5 (mail servers). Before you write a 5 for fit, ask whether a colleague would
notice the switch.

**Say what is lost.** Each path lists what transfers and what does not. The second list is the one people
come here for.

**Source anything surprising.** If you are changing a rating because a project changed its licence or
dropped a feature, link to the announcement in your pull request. Links in the catalog itself should point
at official documentation, and must be `https://`.

**Update `reviewed`.** Set it to the current month (`YYYY-MM`) whenever you check an entry against reality,
even if nothing needed changing.

### What does not belong

- Projects that are abandoned, or that exist mainly as a landing page
- Alternatives nobody involved has actually run
- Proprietary services, even good privacy-respecting ones, as alternatives. They can be mentioned in a
  `verdict` or a guide step where they are the sensible choice (hosted email, for example)
- Affiliate links, or hosting providers listed in exchange for anything

### Adding things

- **An alternative to an existing tool:** add `catalog/alternatives/<id>.json`, then add a path to it in
  the tool's `paths` array. An alternative that nothing points to fails validation.
- **A new tool:** add `catalog/tools/<id>.json` with at least two paths. If it needs a new category, add the
  category and its comparison features to `catalog/categories.json` first.
- **A guide:** add `catalog/guides/<id>.json`. Write steps in the order they have to happen, start each
  with a verb, and keep `detail` to what someone needs to know to do it. Never rename a step `id` once
  published: people's saved progress is keyed by it.

### Writing style

Plain and specific. British spelling, to match the existing entries. Sentences, not marketing. No
exclamation marks. Describe trade-offs in terms of what the reader will have to do.

## Changing the app

- `npm run check` must pass.
- New logic in `src/lib` or `src/catalog` should come with tests.
- The app makes no network requests after loading and ships no third-party scripts, fonts or analytics.
  Changes that break that will not be merged.
- Keep runtime dependencies to a minimum; today they are React and React Router.
- Colours come from the CSS variables in `src/index.css`, which handle dark mode. A rating is never shown
  by colour alone.

## Changing the scoring model

The weights and the formula live in `src/lib/scoring.ts`, and the "How it works" page renders from the same
constants. If you propose a change, show how it moves a handful of real paths (the test file has a few
"common sense" assertions that are a good place to start) and explain why the new ordering is more true.
