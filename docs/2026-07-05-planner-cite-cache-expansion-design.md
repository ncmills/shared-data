# Planner Cite-Cache Expansion Engine — Design

**Date:** 2026-07-05
**Repo:** `~/shared-data` (v1.2.0)
**Scope:** Expand and correctly wire the shared cite cache that feeds all 5 planner wizards — OO-Retreat, OO-Outing, HHQ, BestMan HQ, Maid of Honor HQ — to maximize aggregate plan quality, SEO surface, coverage, and cross-wizard reach.

---

## 1. Goal

Nick's directive: expand the shared data cache for the planner "cites" (the venue/activity/course/residence records a wizard cites when it builds a plan) so the effect on **all sites in aggregate** is maximized. Optimize simultaneously for:

- **Aggregate plan quality** — richer, more-varied, fully-cited plans; fill thin activity categories; real URLs + price bands on every row.
- **SEO surface** — more cities/courses → more pSEO pages across the Planning cluster (OO/HHQ/BM/MOH).
- **Coverage / no dead-ends** — any reasonable wizard input returns a real, non-thin plan.
- **Cross-wizard breadth** — favor data that compounds across multiple wizards.

Plus two explicit sub-asks:
- **A tagging plan** — ensure every row is tagged for every wizard for which it is relevant.
- **An audit feature** — ensure every wizard/input is linked to all relevant data/outputs (no orphans, no starved inputs).

Budget is not a constraint; use parallel agents for efficiency. Data must be **real and verifiable** — never fabricated (per `feedback_no_fabricated_social_proof`, `feedback_research_before_drafting`).

---

## 2. Current state (grounded in the code, 2026-07-05)

### 2.1 The cache
`~/shared-data/src` is the shared cite cache. Datasets and sizes (from `scan-gaps.ts`):

| Dataset | Size | Cited by |
|---|---|---|
| Party destinations (`sharedDestinations`) | **212 cities** | BM + MOH + **OO-Outing** (3 wizards) |
| Golf courses (`SHARED_GOLF_COURSES`) | 994 courses / 234 dests | HHQ (successor to TDF) |
| Residences (`residences.ts`) | 328 buyout venues | OO-Retreat |
| Locals (`moh-locals` + `bestman-locals`) | 50 + 91 | MOH + BM |

Cite records reachable per wizard (`count-by-wizard.ts`): **OO-Outing 6,738 · BM 5,219 · MOH 4,896 · OO-Retreat 1,322 · HHQ ~1,228.**

### 2.2 The tagging architecture (already sophisticated)
- `tags.ts` — 4-axis vocabulary: `wizards[]` (routing key), `audiences[]`, `products[]`, `priceTier` (1–4). Five wizard tags: `bestman | moh | tdf | offsite-retreat | offsite-outing`.
- `tagging-rules.ts` — `deriveRouting()` is the single source of truth for which wizards may surface an item. Splits output into **`core`** (reachability engines already honor) vs **`expand`** (reachability that needs an engine change to take effect).
- `destinations-bake.ts` — bakes `wizards/audiences/products/priceTier` onto every item at module load; overlays become pure filters.
- `verify-universe.ts` + `check-brand-rules.ts` — `npm run verify` (brand-drift guards, e.g. golf never crosses to MOH).
- `scan-gaps.ts` — v1 report-only gap scanner; its footer already specifies the v2 loop: *"feed each gap to a pull → tagging-rules → verify → propose-PR loop."*

**Critical invariant, verbatim from `tagging-rules.ts`:** `TAG ≠ SURFACED`. Tagging an item for a wizard makes it *eligible*; it only appears if that wizard's **engine reads that entity kind**.

### 2.3 Consumption is uneven — forks found
- **MOH / BM** consume `sharedDestinations` via `src/data/index.ts` + `atlas-adapter.ts` + `enrich-plan-venues.ts`. Wired.
- **HHQ is forked.** Runs on its own `src/data/destinations-*.ts` + `src/data/golf-atlas.ts` (editorial "24 pilgrimages"). Does **not** consume `shared-data`'s `SHARED_GOLF_COURSES`.
- **HHQ is also un-tagged.** `SHARED_GOLF_COURSES` carries `sites: ("tdf"|"offsite")[]` — there is **no `handicap`/HHQ tag** in the union. The golf data predates the 2026-07-02 TDF→HHQ split and still routes to now-personal `tdf`, not to HHQ.
- **OO** imports `shared-data` but also maintains a large local atlas under `src/lib/atlas/` (`outings`, `experiences-air/water`, `gen/`). Sync direction to be determined.

This is the core problem: **raw expansion leaks.** New rows never reach a forked wizard; correctly-tagged rows never surface if the engine doesn't read that kind.

### 2.4 Named gaps (from `scan-gaps.ts`)
- **Party dests** — thinnest regions: international 21, midwest 33, northeast 43. Rarest categories: equestrian 14, nightlife 32, cycling 34, winter 43, motorsport 72, field-sports 94.
- **Golf (HHQ)** — thinnest regions: International 11, California 20, South Central 22, Pacific NW 23, Southwest 25. Tiers: bucket-list 157, premium 395, solid 392, budget 50.
- **Residences (OO-Retreat)** — thinnest settings: palace 14, castle 15, links 15, ranch 16, ski-resort 16; 223 regions, many with a single venue.

---

## 3. Design decisions (locked with Nick, 2026-07-05)

1. **Optimization target:** all four (quality + SEO + coverage + cross-wizard breadth) simultaneously.
2. **Shape:** build the **recurring engine** (operationalize scan-gaps v2), not a one-shot pass.
3. **Forked data:** **reconcile all to `shared-data`** as single source of truth — migrate HHQ golf + OO atlas onto it, even though it touches those 2 engines.
4. **`expand` cross-tags (engine changes):** **data + audit now, engine wiring later** — ship all data/tagging/audit work; produce a ranked `expand` engine-change list with effort estimates for per-wizard greenlight. Engine wiring itself is out of scope for this plan.

---

## 4. Architecture — four pillars, sequenced by ROI

The sequence is the aggregate-effect strategy: **fix reachability first (a free multiplier on data we already have), then grow.** Correctly cross-tagging existing rows and wiring forked wizards unlocks latent reach across all 5 surfaces before a single new row is researched.

### Pillar 1 — Reconcile & wire (pre-requisite)
Make `shared-data` the single cite source for all 5 wizards.

- **1.1 Consumption audit.** For each wizard, trace: does its plan engine read from `shared-data`, a local fork, or both? Produce a wiring map.
- **1.2 HHQ golf reconciliation.** Decide canonical direction between `shared-data/SHARED_GOLF_COURSES` (994) and `handicap-hq/src/data/*` (forked). Recommended: promote the superset to `shared-data`, add a `handicap` wizard/site tag, wire HHQ to consume it via prebuild fetch. Preserve HHQ's editorial `golf-atlas.ts` (the 24 pilgrimages) as a curated overlay on top.
- **1.3 OO atlas reconciliation.** Determine sync direction for OO's local `src/lib/atlas/`; fold unique local rows back into `shared-data`, wire OO to consume the merged set.
- **1.4 Prebuild fetch.** Ensure each consumer has a `prebuild` step pulling the latest `shared-data` src (jsDelivr `@main` or copy), so future expansions propagate automatically.

**Interface:** each wizard's engine reads cite records only through its overlay/adapter over `shared-data`; no wizard carries a private cite dataset that isn't a curated *overlay* (editorial/curation layer) on the shared core.

### Pillar 2 — Tag completeness (the tagging plan)
Every row tagged for every wizard for which it is relevant.

- **2.1 Add the `handicap` wizard tag** (or map HHQ onto the existing golf routing) across `tags.ts`, `tagging-rules.ts`, `destinations-bake.ts`.
- **2.2 Extend `deriveRouting()`** to cover every `EntityKind` (party-venue, golf-course, residence, experience, outing-template, golf-destination) with correct `core` vs `expand` splits.
- **2.3 Cross-tag backfill.** Run the rules over the entire universe; re-bake. Superset invariant holds — rules only ever ADD reachability, never remove it; brand-protection guards (golf↛MOH) stay.
- **2.4 Emit the `expand` set** — the ranked list of "tagged-but-needs-engine-change" reachability, with per-wizard effort estimates. Feeds Nick's greenlight (decision 4).

**Output:** a re-baked universe where `core` tags are live everywhere the engines already read, and every relevant-but-unconsumed pairing is captured in the `expand` list.

### Pillar 3 — Coverage auditor (the audit feature)
`npm run audit` — extends `verify-universe.ts`. Three checks + a per-wizard coverage matrix; gates CI.

- **3.1 Under-tagged** — row is relevant to a wizard (per `deriveRouting`) but not tagged for it. → auto-fixable by re-bake; flags rule gaps.
- **3.2 Orphaned** — row is tagged for a wizard whose engine never reads that entity kind (dead cites). → feeds the `expand` list or a de-tag.
- **3.3 Starved inputs** — enumerate each wizard's **input space** (region × vibe/setting × audience × priceTier × party-size band) and assert every reachable cell returns ≥ N real cite records. Flags thin/empty cells → feeds Pillar 4's expansion queue.

**Interface:** deterministic report (JSON + markdown). Exit non-zero on regressions (new orphans / new starved cells below threshold) so it can gate commits and CI. This is the IO-trace guarantee that "all wizards/inputs are linked to all relevant data/outputs" — kin to `sn io-trace`.

### Pillar 4 — Expansion engine (the recurring loop)
Operationalize `scan-gaps` v2: **gap-scan → research real venues → tag via rules → verify/audit → propose-PR.** Scheduled monthly (matches the existing "Phase-E growth agents" pattern referenced in `tagging-rules.ts`).

- **4.1 Prioritizer.** Rank gaps by **aggregate leverage** = (# wizards the dataset serves) × (gap severity from Pillar 3) × (SEO/coverage weight). Party-destinations (3-wizard) rank above single-wizard silos.
- **4.2 Researcher (agent fan-out).** For each queued gap, dispatch parallel research agents to find **real** venues/courses/residences with verifiable name, location, URL, price band, and a real highlight. Citation-gated; **no fabrication**. Reuse `parallel-research-fanout` discipline.
- **4.3 Tagger.** Route each new row through `deriveRouting()` — new rows are tagged correctly by construction, same rules as the backfill.
- **4.4 Gate.** Run `npm run verify && npm run audit`; only rows that pass brand guards + improve coverage without new orphans proceed.
- **4.5 Propose-PR.** Open a PR against `shared-data` with the new rows + an updated coverage matrix diff. Nick reviews/merges; merge propagates to all wired wizards via prebuild fetch.

**Prioritized target order (first passes):**
1. Party destinations — thin regions (international/midwest/northeast) + rare categories (equestrian, nightlife, motorsport, winter, cycling). *(3-wizard compounding.)*
2. Golf — thin regions (International, California, Pacific NW, South Central, Southwest); grow budget tier (only 50). *(HHQ.)*
3. Residences — thin settings (palace, castle, links, ranch, ski-resort) + single-venue regions. *(OO-Retreat.)*
4. Enrichment pass — real URLs + price bands on existing rows missing them, across all datasets. *(Quality + cite verifiability, all wizards.)*

---

## 5. Aggregate-leverage rationale

Effect-per-row is not uniform. A party-destination row serves 3 wizards; a golf/residence row serves 1. So the ordering — **wire + tag + audit before expand, then breadth-shared before silo** — is precisely what maximizes aggregate effect:

- Wiring HHQ to the shared golf set + adding the `handicap` tag surfaces ~994 already-built courses to HHQ at ~zero research cost.
- Cross-tag backfill can surface existing corporate-eligible party rows to OO-Outing that aren't yet tagged, adding cites with zero new data.
- Only then do we spend research budget, and we spend it first where each row compounds across the most wizards.

---

## 6. Data fidelity constraints (hard)

- **Real venues only.** Every new/enriched cite record must be a verifiable real place with a real URL. No fabricated venues, reviews, ratings, or counts (`feedback_no_fabricated_social_proof`).
- **Research before drafting.** Facts come from primary-source research fan-out, not model memory (`feedback_research_before_drafting`).
- **Brand guards inviolable.** Golf never crosses to MOH; party-only staples (casino, poker-night, adult categories) never surface for corporate/OO. Superset invariant: tagging only ADDS reachability.
- **Image subjects verified** if any row carries imagery, per `feedback_verify_image_subject_matches_label`.

---

## 7. Success criteria

- All 5 wizards read cite data through an overlay over `shared-data`; no wizard runs on a private cite fork (curated *overlays* are allowed).
- `npm run audit` passes with zero orphaned cites in `core`, and a documented `expand` list for the rest.
- Zero "starved" input cells below threshold for any wizard, OR each remaining starved cell is queued in the expansion engine.
- Party-destination thin regions and rare categories measurably grown; golf + residence thin cells grown; enrichment coverage (rows with real URL + price band) up across all datasets.
- The expansion engine runs on schedule and opens PRs autonomously; each merge propagates to all wired wizards.

## 8. Out of scope (deferred)

- **Engine wiring for the `expand` set** — actually making a wizard's engine read a new entity kind (e.g. surfacing residences inside BM). Deferred to a ranked, effort-estimated list for per-wizard greenlight (decision 4).
- Net-new wizards or new datasets beyond the four existing kinds.
- SEO page-template changes (this plan grows the data that feeds pSEO; it does not rebuild the templates).

## 9. Open questions / risks

- **HHQ/OO reconciliation depth** — folding a rich local fork back into `shared-data` may surface schema mismatches (HHQ golf schema vs `SHARED_GOLF_COURSES` schema). Task 1.2/1.3 must reconcile schemas, not just rows.
- **`tdf` tag semantics** — TDF is now a personal site (no wizard); the golf routing tagged `tdf` should be re-pointed to `handicap`. Confirm TDF's personal site doesn't still read the shared golf set before re-tagging.
- **CDN vs copy propagation** — decide per-wizard whether prebuild fetches jsDelivr `@main` (auto-latest, cache-invalidation risk) or pins a SHA (stable, manual bump).

---

*Next: `is-this-worth-it.md` (Phase 0 cost/value check per writing-plans augmentation), then the implementation plan.*
