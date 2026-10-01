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
  that site's profile are evaluated against the row's facets, and the same script merges in a
  CORPUS-M5 rubric score wherever one exists (`scripts/corpus/suitability.ts:148`,
  `buildSuitability`) — a score is only ever merged onto a row the rules left unreviewed, never
  onto a `"no"`. This produces three `eligible` states:
  - matched by any hard-exclude rule → `eligible: "no"`, `reason` = the first matching rule id,
    `rules` = every matching rule id if more than one matched, `provenance.tagger =
    "rules@<git blob sha of the profile file>"`.
  - not matched by a rule, and the site is scored (`SCORED_SITES = ["moh", "bestman"]`,
    `scripts/corpus/score.ts:34`) with a score on record for that row → `eligible: "scored"`,
    carrying `class` (`"fit"` or `"utility"`), `fit` (0–1, present only when `class: "fit"`),
    `flags` (if any), `reason`, and `provenance` — all copied from the matching row in
    `scores/<site>.json`. See `docs/corpus-m5-scored-suitability.md` for how those scores are
    produced.
  - everything else (not matched by a rule, and either not a scored site or no score for that
    row) → `eligible: "unreviewed"` — no reason, no provenance, nothing decided it.
  - Hard-exclude rules themselves **never** write `"yes"` or `"scored"` — only the M5 merge in
    this same script writes `"scored"` and `fit`.
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
  `eligible` is outside `{no, unreviewed, scored}` (and `scored` is only accepted for
  `SCORED_SITES = ["moh", "bestman"]` — any other site's `scored` row still fails), a row carries
  `fit` while `eligible` is not `"scored"`, a `"scored"` row that lacks a valid `class`/`fit`
  (`class: "fit"` rows need `fit` in `[0,1]`; `class: "utility"` rows must have none)/`reason`/
  `provenance.promptOrRulesVersion`, an `"unreviewed"` row that carries a `reason` or
  `provenance`, a `"no"` row that cites a rule id that doesn't exist in that site's profile, the
  tagger sha doesn't match the profile's current git blob sha, or the file no longer equals what
  `suitability.ts` would produce now (`scripts/corpus/verify-suitability.ts:178-185`).

A red `verify` here means the committed file is stale relative to its generator or its inputs —
regenerate with the commands above before trusting the committed JSON/YAML.
