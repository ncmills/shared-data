# CORPUS-M4 — vocab v1 + rules-only suitability

Three folders, one controlled vocabulary, and a per-site rules pass over the CORPUS-M3a id set
(every party row + every golf course). Nothing in `src/` imports any of this yet, and no
consumer reads these files — M4 only builds the layer that M5 (scored suitability) and M6 (the
image layer) build on top of.

## The folders

- **`vocab/v1.json`** (`scripts/corpus/vocab-build.ts`) — the controlled vocabulary: neutral
  facet values that exist in the corpus *today*, read off the data or off this repo's own type
  unions (nothing invented). It also maps the two free-text tag fields — residence `tags` and OO
  experience `tags` — into those facets, with an explicit `unmapped[]` list (each entry with a
  count and a reason) for tags no rule claims. A tagger (rules or model) may only emit terms that
  are in this file; a term's meaning changes only with a version bump (semver: add a term =
  minor, rename/remove/redefine = major). The `image` block is a stub, left empty until M6.
  - Regenerate: `npx tsx scripts/corpus/vocab-build.ts`
  - Check for staleness only: `npx tsx scripts/corpus/vocab-build.ts --check` (exit 1 if stale)

- **`profiles/<site>.yaml`** (one per site: `moh`, `bestman`, `handicap`, `offsite`,
  `friendsmoon`, `engagedmoon`) — each site's voice/audience/geography/content rules, read from
  that site's own repo at a pinned `origin/main` sha. Every rule cites
  `<repo>/<file>:<line>@<sha>` with a verbatim quote; anything the site's repo does not state is
  recorded as ABSENT with the grep that found nothing. `hard_excludes` are only the
  unconditional, row-level, non-tag-keyed filters the site actually applies at runtime — every
  other candidate filter is listed under `not_rules` with the reason it was excluded (conditional,
  tag-keyed, or not a facts-row concern).

- **`suitability/<site>.json`** (`scripts/corpus/suitability.ts`) — one row per CORPUS-M3a facts
  id (6,398 party rows + 999 golf courses, as of the M4 commit). For each site, `hard_excludes` in
  that site's profile are evaluated against the row's facets:
  - matched by any rule → `eligible: "no"`, `reason` = the first matching rule id, `rules` =
    every matching rule id if more than one matched, `provenance.tagger = "rules@<git blob sha of
    the profile file>"`.
  - everything else → `eligible: "unreviewed"` — no reason, no provenance, nothing decided it.
  - Rules **never** write `"yes"`, and nothing here writes `fit` (that is M5, see
    `docs/corpus-m5-scored-suitability.md`).
  - Regenerate (all six site files): `npx tsx scripts/corpus/suitability.ts`
  - Check for staleness only: `npx tsx scripts/corpus/suitability.ts --check` (exit 1 if stale)

## Regenerating after a data or profile edit

Order matters: `vocab/v1.json` feeds `suitability/<site>.json` (facet terms must already exist in
vocab before a profile rule can match on them).

```bash
npx tsx scripts/corpus/vocab-build.ts        # 1. rebuild vocab if facets/tags changed
npx tsx scripts/corpus/suitability.ts        # 2. rebuild suitability from the (possibly new) vocab + profiles
npm run verify                               # 3. runs scripts/corpus/verify-suitability.ts, among others
```

## `npm run verify` fails on drift

`scripts/corpus/verify-suitability.ts` is wired into `npm run verify` (`package.json`'s
`verify` script) and exits 1 on:

- a `vocab/v1.json` that no longer equals what `vocab-build.ts` would produce now;
- a `profiles/<site>.yaml` that fails the strict YAML subset, or a hard-exclude rule missing a
  site-prefixed unique id, a cite, or a quote, or whose match uses a facet/term not in vocab v1
  (and `dead_terms` — terms the vocab no longer has — must be empty);
- a facts row whose facet value is not a vocab term;
- a `suitability/<site>.json` where an id is missing from facts, an id appears more than once,
  `eligible` is outside `{no, unreviewed}`, a row carries `fit` (M4 never writes it), a `"no"`
  cites a rule id that doesn't exist in that site's profile, the tagger sha doesn't match the
  profile's current git blob sha, or the file no longer equals what `suitability.ts` would
  produce now.

A red `verify` here means the committed file is stale relative to its generator or its inputs —
regenerate with the commands above before trusting the committed JSON/YAML.
