# Planner Cite-Cache Expansion Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all 5 planner wizards to a single shared cite cache, tag every row for every wizard it's relevant to, audit coverage end-to-end, then grow the cache with real verified venues via a recurring gap→PR engine — maximizing aggregate plan quality, SEO surface, coverage, and cross-wizard reach.

**Architecture:** Sequenced cheap-multiplier-first. Phase 1 reconciles forked wizards (HHQ golf, OO atlas) onto `~/shared-data` and adds the missing `handicap` routing (free reach, no research). Phase 2 completes cross-wizard tagging via `deriveRouting()`. Phase 3 adds a `npm run audit` coverage guarantee (under-tagged / orphaned / starved-input). Phase 4 operationalizes `scan-gaps` v2 as a recurring research→tag→verify→propose-PR loop, prioritized by aggregate leverage.

**Tech Stack:** TypeScript, `tsx` scripts, `~/shared-data` as CDN-fetched single source (jsDelivr `@main` / SHA pin), Next.js consumer repos, launchd monthly agent, `parallel-research-fanout` for real-venue research.

## Global Constraints

- **Real venues only** — every new/enriched cite record is a verifiable real place with a real URL; no fabricated venues/reviews/ratings/counts (`feedback_no_fabricated_social_proof`).
- **Research before drafting** — facts from primary-source research fan-out, not model memory (`feedback_research_before_drafting`).
- **Superset invariant** — tagging rules only ever ADD reachability, never remove it.
- **Brand guards inviolable** — golf never crosses to MOH; casino/poker/adult categories never surface for corporate/OO. `npm run verify` (`check-brand-rules.ts`) must stay green after every task.
- **Single source of truth** — no wizard keeps a private *cite* dataset; curated *editorial overlays* (e.g. HHQ's 24 pilgrimages) are allowed only as a layer over the shared core.
- **Branch:** all work on `spec/planner-cite-cache-expansion` (in `~/shared-data`) and matching feature branches in each consumer repo. Commit per task. Never commit to `main` without Nick's ask.
- **Vercel scope** for any consumer deploy: `ncmillsionaire` (all 5 wizards are solo).

---

## Phase 1 — Reconcile & wire

### Task 1: Consumption audit script (wiring map)

**Files:**
- Create: `~/shared-data/scripts/wiring-map.ts`
- Test: `~/shared-data/scripts/wiring-map.test.ts`

**Interfaces:**
- Produces: `wiringMap(): WiringRow[]` where `WiringRow = { wizard: WizardTag; repo: string; readsShared: boolean; localForks: string[]; entityKinds: string[] }`. Consumed by human review + Task 3/4 to confirm reconciliation targets.

- [ ] **Step 1: Write the failing test**
```ts
// wiring-map.test.ts
import { classifyRepo } from "./wiring-map";
test("classifies a repo that imports sharedDestinations as wired", () => {
  const row = classifyRepo("bestman", "/Users/bignick/plan-my-party", [
    "src/data/index.ts: import { sharedDestinations } from '@/lib/shared-data'",
  ]);
  expect(row.readsShared).toBe(true);
});
test("classifies HHQ golf-atlas as a local fork", () => {
  const row = classifyRepo("handicap", "/Users/bignick/handicap-hq", [
    "src/data/golf-atlas.ts: export const GOLF_ATLAS",
  ]);
  expect(row.localForks).toContain("src/data/golf-atlas.ts");
});
```
- [ ] **Step 2: Run test, verify it fails** — `cd ~/shared-data && npx tsx --test scripts/wiring-map.test.ts` → FAIL "classifyRepo is not a function".
- [ ] **Step 3: Implement** `classifyRepo(wizard, repoPath, grepHits)` — pure function: `readsShared = grepHits.some(h => /sharedDestinations|shared-data|jsdelivr.*shared-data/.test(h))`; `localForks = grepHits.filter(h => /(golf-atlas|destinations-.*\.ts|lib\/atlas)/.test(h.split(":")[0]))`. Then `wiringMap()` runs the greps (via `child_process.execSync('grep -rn ...')`) for the 4 repos + writes `docs/wiring-map.json`.
- [ ] **Step 4: Run test, verify PASS.**
- [ ] **Step 5: Run `npx tsx scripts/wiring-map.ts`** — inspect `docs/wiring-map.json`; confirm it flags HHQ golf fork + OO local atlas.
- [ ] **Step 6: Commit** — `git add scripts/wiring-map.* docs/wiring-map.json && git commit -m "feat: wiring-map — audit which wizards read shared-data vs local forks"`

### Task 2: Add the `handicap` routing (tag + rules + bake)

**Files:**
- Modify: `~/shared-data/src/tags.ts` (WizardTag, SiteTag unions)
- Modify: `~/shared-data/src/tagging-rules.ts` (golf-course + golf-destination routing)
- Modify: `~/shared-data/src/destinations-bake.ts` (golf tag bake, if golf is baked there) or `~/shared-data/src/golf-courses.ts` (SITE union + inline tags)
- Test: `~/shared-data/src/tagging-rules.test.ts`

**Interfaces:**
- Consumes: existing `deriveRouting(input: RoutingInput): Routing` and `WizardTag`.
- Produces: `WizardTag` now includes `"handicap"`; `deriveRouting({kind:"golf-course"})` returns `core.wizards` ⊇ `["handicap"]`.

- [ ] **Step 1: Write the failing test**
```ts
// tagging-rules.test.ts
import { deriveRouting } from "./tagging-rules";
test("a golf course routes to handicap (HHQ) in core", () => {
  const r = deriveRouting({ kind: "golf-course", activityType: "golf" });
  expect(r.core.wizards).toContain("handicap");
});
test("golf still never crosses to moh (brand guard)", () => {
  const r = deriveRouting({ kind: "golf-course", activityType: "golf" });
  expect(r.core.wizards).not.toContain("moh");
  expect(r.expand.flatMap(e => e.wizards)).not.toContain("moh");
});
```
- [ ] **Step 2: Run test, verify FAIL** — `npx tsx --test src/tagging-rules.test.ts` → FAIL (handicap not present).
- [ ] **Step 3: Implement**
  - `tags.ts`: `WizardTag = ... | "handicap"`; `SiteTag = "moh"|"bestman"|"tdf"|"offsite"|"handicap"`.
  - `tagging-rules.ts`: in the `golf-course` and `golf-destination` branches of `deriveRouting`, add `"handicap"` to `core.wizards`. Keep `"tdf"` for back-compat (superset — only adds). `offsite-retreat`/`offsite-outing` stay in `expand` for golf (needs engine change; corporate-golf outing already partly consumed — keep in `core` only if the OO engine already reads golf, else `expand`).
  - `golf-courses.ts`: widen `SharedGolfCourse.sites` union to include `"handicap"`; leave existing rows (they get `handicap` via the rules/bake, not hand-edit — DO NOT hand-edit per file header).
- [ ] **Step 4: Run test, verify PASS.**
- [ ] **Step 5: Run `npm run verify`** — expect PASS (brand guards green).
- [ ] **Step 6: Commit** — `git commit -am "feat(tags): route golf to handicap (HHQ); widen SiteTag"`

### Task 3: Reconcile HHQ golf onto shared-data + wire HHQ

**Files:**
- Create: `~/shared-data/scripts/reconcile-hhq-golf.ts` (one-time superset merge report)
- Modify: `~/shared-data/src/golf-courses.ts` (absorb any HHQ-only courses — via generated diff, reviewed)
- Create: `~/handicap-hq/src/lib/shared-golf.ts` (adapter: fetch/consume `SHARED_GOLF_COURSES`)
- Modify: `~/handicap-hq/package.json` (prebuild fetch), `~/handicap-hq/src/data/index.ts` (source golf from shared adapter)
- Modify: `~/handicap-hq/src/data/golf-atlas.ts` (becomes a curated overlay — keep the 24 pilgrimages; assert every `destinationId`/course resolves against the shared set)
- Test: `~/handicap-hq/src/lib/shared-golf.test.ts`

**Interfaces:**
- Consumes: `SHARED_GOLF_COURSES: SharedGolfCourse[]` from shared-data.
- Produces: `hhqCourses(): HhqCourse[]` (adapter output HHQ's engine reads); `golf-atlas` pilgrimages validated against it.

- [ ] **Step 1: Schema diff** — `npx tsx ~/shared-data/scripts/reconcile-hhq-golf.ts` prints (a) HHQ courses absent from `SHARED_GOLF_COURSES` (by name+city), (b) field mismatches (HHQ schema vs `SharedGolfCourse`). Review output; this is the merge spec.
- [ ] **Step 2: Write the failing test**
```ts
// shared-golf.test.ts (HHQ repo)
import { hhqCourses } from "./shared-golf";
import { GOLF_ATLAS } from "../data/golf-atlas";
test("every pilgrimage marquee course exists in the shared golf set", () => {
  const names = new Set(hhqCourses().map(c => c.name));
  for (const p of GOLF_ATLAS) for (const c of p.marqueeCourses) {
    expect(names.has(c)).toBe(true);
  }
});
```
- [ ] **Step 3: Run test, verify FAIL** — adapter missing.
- [ ] **Step 4: Implement** — absorb HHQ-only courses into `shared-data/src/golf-courses.ts` (regenerate per file header convention, not hand-edit; if no regen script exists, add the reviewed rows to a `golf-courses-hhq-merge.ts` and export-merge in `index.ts`). Write `shared-golf.ts` adapter mapping `SharedGolfCourse → HhqCourse`. Add `prebuild` to HHQ `package.json`: `"prebuild": "node scripts/fetch-shared-data.mjs"` pulling `golf-courses.ts` from jsDelivr (pin a SHA; see Task 5).
- [ ] **Step 5: Run test, verify PASS.**
- [ ] **Step 6: Build HHQ** — `cd ~/handicap-hq && npm run build` → succeeds; smoke `POST /api/generate-plan` for a golf trip returns courses sourced from the shared set.
- [ ] **Step 7: Commit** both repos on their feature branches.

### Task 4: Reconcile OO atlas onto shared-data + wire OO

**Files:**
- Create: `~/shared-data/scripts/reconcile-oo-atlas.ts`
- Modify: `~/shared-data/src/oo-atlas.ts` (+ `residences.ts` if OO retreat venues live there) to absorb OO-only rows (reviewed diff)
- Modify: `~/offsite-outpost/src/lib/atlas/*` to source from shared-data; keep OO-specific presentation as overlay
- Test: `~/offsite-outpost/src/lib/atlas/shared-source.test.ts`

**Interfaces:**
- Produces: OO's `outings`/`experiences` read cite rows from shared-data; OO-only rows folded back so shared-data is the superset.

- [ ] **Step 1: Diff** — `npx tsx ~/shared-data/scripts/reconcile-oo-atlas.ts` lists OO-local rows absent from shared-data (residences, outing templates, experiences).
- [ ] **Step 2: Write failing test** — assert `sharedOutings().length >= localOutings().length` and every local outing id resolves in the shared set.
- [ ] **Step 3: Run, verify FAIL.**
- [ ] **Step 4: Implement** — absorb OO-only rows into shared-data (reviewed); repoint OO atlas modules to the shared source via adapter; add OO `prebuild` fetch.
- [ ] **Step 5: Run test PASS; `cd ~/offsite-outpost && npm run build`** succeeds; smoke both wizards (Retreat + Outing) — plans still render, now citing the shared set.
- [ ] **Step 6: Commit** both repos.

### Task 5: Prebuild fetch harness (all consumers)

**Files:**
- Create: `scripts/fetch-shared-data.mjs` in each consumer (`plan-my-party`, `maid-of-honor-hq`, `handicap-hq`, `offsite-outpost`)
- Modify: each consumer `package.json` (`prebuild` script; pin `SHARED_DATA_SHA` env or a committed constant)

**Interfaces:**
- Produces: on every build, each consumer refreshes its local mirror of the needed `shared-data/src/*.ts` from jsDelivr at a pinned SHA.

- [ ] **Step 1: Write the fetch script** — `fetch-shared-data.mjs` downloads the listed files from `https://cdn.jsdelivr.net/gh/ncmills/shared-data@${SHA}/src/<file>.ts` into `src/lib/shared-data/`, fails the build on non-200.
- [ ] **Step 2: Test** — run `node scripts/fetch-shared-data.mjs` in one repo; assert files land and match remote (byte length > 0, contains a known export).
- [ ] **Step 3: Wire `prebuild`** in all 4 `package.json`.
- [ ] **Step 4: Build all 4 repos** — each `npm run build` triggers prebuild + succeeds.
- [ ] **Step 5: Commit** each repo.

---

## Phase 2 — Tag completeness

### Task 6: Extend `deriveRouting` to every EntityKind (core/expand split)

**Files:**
- Modify: `~/shared-data/src/tagging-rules.ts`
- Test: `~/shared-data/src/tagging-rules.test.ts`

**Interfaces:**
- Produces: `deriveRouting` returns a complete `{core, expand}` for all `EntityKind`s: `party-venue`, `golf-course`, `residence`, `experience`, `outing-template`, `golf-destination`.

- [ ] **Step 1: Write failing tests** — one per kind asserting expected `core.wizards` and that cross-wizard-but-unconsumed reach lands in `expand` (e.g. `residence` → `core: ["offsite-retreat"]`, `expand` includes `{wizards:["bestman","moh"], reason:"party engines don't read residences yet"}`).
```ts
test("a residence is core offsite-retreat, expand to party wizards", () => {
  const r = deriveRouting({ kind: "residence", setting: "ranch" });
  expect(r.core.wizards).toEqual(["offsite-retreat"]);
  expect(r.expand.some(e => e.wizards.includes("bestman"))).toBe(true);
});
```
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** each branch. `core` = reachability the target engine already honors (confirm against Task 1 wiring-map / Task 3-4 adapters). `expand` = relevant-but-unconsumed with a `reason`. Keep brand guards.
- [ ] **Step 4: Run tests + `npm run verify` PASS.**
- [ ] **Step 5: Commit.**

### Task 7: Cross-tag backfill runner + re-bake

**Files:**
- Create: `~/shared-data/scripts/backfill-tags.ts`
- Test: `~/shared-data/scripts/backfill-tags.test.ts`

**Interfaces:**
- Produces: re-bakes `wizards/audiences/products/priceTier` onto every universe item via `deriveRouting`; writes nothing that removes prior reachability.

- [ ] **Step 1: Write failing test (superset invariant)** — snapshot each item's pre-backfill `wizards` set; assert post-backfill `wizards ⊇ pre`. Assert ≥1 item gains `offsite-outing` (proves cross-tag fires).
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — iterate `sharedDestinations` + golf + residences + locals; for each, `deriveRouting` → merge `core` tags into baked fields (union, never subtract); leave `expand` out of baked tags but record to `docs/expand-set.json`.
- [ ] **Step 4: Run `npx tsx scripts/backfill-tags.ts`; run tests + `npm run verify` PASS.**
- [ ] **Step 5: Run `count-by-wizard.ts`** — record the new per-wizard counts (expect increases, esp. offsite-outing / handicap). Save to `docs/coverage-before-after.md`.
- [ ] **Step 6: Commit.**

### Task 8: Emit the ranked `expand` set (engine-change candidates)

**Files:**
- Create: `~/shared-data/scripts/rank-expand-set.ts`
- Output: `~/shared-data/docs/expand-set-ranked.md`

**Interfaces:**
- Consumes: `docs/expand-set.json` (Task 7).
- Produces: ranked markdown table — each candidate = (entity kind → wizard) with row-count unlocked, wizards affected, and a rough effort estimate (S/M/L based on adapter surface). This is Nick's greenlight list; engine wiring itself is out of scope.

- [ ] **Step 1: Implement** — aggregate `expand-set.json` by `(kind, wizard)`; count rows; join effort heuristic (party-venue→outing = S if adapter exists; golf→party = L). Sort by `rows × wizardsAffected`.
- [ ] **Step 2: Run** — inspect `docs/expand-set-ranked.md`; sanity-check top entries.
- [ ] **Step 3: Commit.**

---

## Phase 3 — Coverage auditor

### Task 9: `audit` — under-tagged check

**Files:**
- Create: `~/shared-data/scripts/audit/under-tagged.ts`
- Test: `~/shared-data/scripts/audit/under-tagged.test.ts`

**Interfaces:**
- Produces: `findUnderTagged(): UnderTagged[]` where each = `{ itemId; kind; missingWizards: WizardTag[] }` — an item whose `deriveRouting().core.wizards` includes a wizard NOT in its baked `wizards`.

- [ ] **Step 1: Write failing test** — construct an item with a deliberately stripped `wizards` tag; assert `findUnderTagged` reports its missing wizard.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — for each baked item, compare baked `wizards` vs `deriveRouting(...).core.wizards`; report the set difference.
- [ ] **Step 4: Run tests PASS.** (Post-Task-7 backfill, a full run should report ZERO — the auditor proves the backfill worked.)
- [ ] **Step 5: Commit.**

### Task 10: `audit` — orphaned-cite check

**Files:**
- Create: `~/shared-data/scripts/audit/orphaned.ts`, `~/shared-data/src/engine-reads.ts` (declares which `EntityKind`s each wizard engine actually consumes — sourced from Task 1 wiring-map + adapters)
- Test: `~/shared-data/scripts/audit/orphaned.test.ts`

**Interfaces:**
- Consumes: `ENGINE_READS: Record<WizardTag, EntityKind[]>`.
- Produces: `findOrphaned(): Orphaned[]` — item tagged for a wizard whose `ENGINE_READS[wizard]` excludes its kind (dead cite).

- [ ] **Step 1: Write failing test** — a golf course baked `bestman` while `ENGINE_READS.bestman` excludes `golf-course` → reported as orphaned.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** `ENGINE_READS` (accurate as of Task 3-4 wiring) + `findOrphaned`. Orphans should map 1:1 to the `expand` set (tagged-but-not-consumed) — cross-check.
- [ ] **Step 4: Run tests PASS.**
- [ ] **Step 5: Commit.**

### Task 11: `audit` — starved-input enumeration

**Files:**
- Create: `~/shared-data/scripts/audit/starved-inputs.ts`, `~/shared-data/src/wizard-input-space.ts`
- Test: `~/shared-data/scripts/audit/starved-inputs.test.ts`

**Interfaces:**
- Consumes: `WIZARD_INPUT_SPACE: Record<WizardTag, InputAxis[]>` (region × vibe/setting × audience × priceTier × party-size band per wizard).
- Produces: `findStarved(threshold: number): Starved[]` — each reachable input cell returning `< threshold` real cite records.

- [ ] **Step 1: Write failing test** — with `threshold=3`, a fabricated universe missing `international` party rows reports the `moh × international × …` cells as starved.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — enumerate the cartesian input space per wizard (bounded — regions × a small vibe/audience/price set), count matching baked+consumed rows per cell, report cells under threshold. Default `threshold=3`.
- [ ] **Step 4: Run `npx tsx scripts/audit/starved-inputs.ts`** — expect it to surface exactly the `scan-gaps` thin regions/categories (international, midwest, palace/castle residences, budget golf). Cross-check against §2.4 of the spec.
- [ ] **Step 5: Commit.**

### Task 12: `npm run audit` aggregator + coverage matrix + CI gate

**Files:**
- Create: `~/shared-data/scripts/audit/index.ts` (runs 9+10+11, writes `docs/coverage-matrix.md` + `docs/audit-report.json`)
- Modify: `~/shared-data/package.json` (`"audit": "tsx scripts/audit/index.ts"`; fold into `"verify"`)
- Create: `~/shared-data/.github/workflows/audit.yml` (or extend existing CI) — non-zero exit on new orphans / new starved cells below threshold
- Test: `~/shared-data/scripts/audit/index.test.ts`

**Interfaces:**
- Produces: `npm run audit` → coverage matrix (wizard × dataset × input-region, cell = record count) + pass/fail. Exit code gates commits/CI.

- [ ] **Step 1: Write failing test** — `runAudit()` returns `{ underTagged, orphaned, starved, exitCode }`; assert `exitCode !== 0` when a seeded starved cell exists below threshold.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** aggregator + markdown matrix writer + `process.exit` logic (regression-based: compare against a committed `docs/audit-baseline.json`; fail only on NEW regressions so pre-existing known gaps don't block).
- [ ] **Step 4: Run `npm run audit`** — inspect `docs/coverage-matrix.md`; commit the baseline.
- [ ] **Step 5: Wire CI; push branch; confirm the Action runs.**
- [ ] **Step 6: Commit.**

---

## Phase 4 — Expansion engine (recurring)

### Task 13: `scan-gaps` v2 — machine-readable queue + aggregate-leverage prioritizer

**Files:**
- Create: `~/shared-data/scripts/gap-queue.ts`
- Test: `~/shared-data/scripts/gap-queue.test.ts`

**Interfaces:**
- Consumes: `findStarved` (Task 11) + dataset→wizard fan-out.
- Produces: `buildGapQueue(): GapTask[]` where `GapTask = { id; dataset; region; category?; deficit: number; wizardsServed: WizardTag[]; leverageScore: number }`, sorted by `leverageScore = deficit × wizardsServed.length × seoWeight`.

- [ ] **Step 1: Write failing test** — assert a party-destination gap (3 wizards) outranks a golf gap (1 wizard) of equal deficit.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — map each starved cell to its dataset + wizards-served; compute `leverageScore`; `seoWeight` from a small table (Planning-cluster surfaces = 1.0). Write `docs/gap-queue.json`.
- [ ] **Step 4: Run; inspect top of queue** — expect party-destination international/midwest + rare categories on top.
- [ ] **Step 5: Commit.**

### Task 14: Real-venue research harness (agent fan-out)

**Files:**
- Create: `~/shared-data/scripts/research-gap.ts` (orchestrator), `~/shared-data/src/research-schema.ts` (the row schema each agent must return + a `citations[]` requirement)
- Test: `~/shared-data/scripts/research-schema.test.ts`

**Interfaces:**
- Consumes: one `GapTask`.
- Produces: `ResearchedRow[]` conforming to the canonical schema for that dataset, each with `sourceUrl` + `citations[]`; a row is REJECTED if it lacks a resolvable URL or citation.

- [ ] **Step 1: Write failing test** — `validateResearchedRow(row)` rejects a row with no `sourceUrl`; accepts a complete one.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — `research-schema.ts` (zod/TS validator, real-URL + citation gate). `research-gap.ts` dispatches parallel research agents (one per city/region in the GapTask) using the `parallel-research-fanout` discipline; each returns candidate rows; the validator filters. **No fabrication** — agents must cite primary sources.
- [ ] **Step 4: Dry-run one low-risk GapTask** (e.g. a single thin golf region) — inspect returned rows for real names/URLs; spot-verify 3 by opening the URL.
- [ ] **Step 5: Commit** (harness only; researched data lands via Task 15/16).

### Task 15: Tagger + verify/audit gate

**Files:**
- Create: `~/shared-data/scripts/ingest-researched.ts`
- Test: `~/shared-data/scripts/ingest-researched.test.ts`

**Interfaces:**
- Consumes: `ResearchedRow[]`.
- Produces: rows appended to the correct dataset file, tagged via `deriveRouting` (correct-by-construction), only if `npm run verify && npm run audit` stay green and coverage strictly improves.

- [ ] **Step 1: Write failing test** — ingesting a valid golf row increments that dataset's count and the row carries `handicap` in `wizards`; ingesting a row that breaks a brand guard is rejected.
- [ ] **Step 2: Run, verify FAIL.**
- [ ] **Step 3: Implement** — append to dataset source (respecting "DO NOT hand-edit / regenerate" headers → write to the sanctioned expansion file per dataset), run `deriveRouting`, then shell `npm run verify && npm run audit`; abort + rollback on non-zero or on any new orphan.
- [ ] **Step 4: Run tests PASS.**
- [ ] **Step 5: Commit.**

### Task 16: Propose-PR + coverage-matrix diff

**Files:**
- Create: `~/shared-data/scripts/propose-pr.ts`
- Test: manual (uses `gh`)

**Interfaces:**
- Consumes: an ingested batch (Task 15) on a throwaway branch.
- Produces: a PR against `shared-data` with the new rows + a `coverage-matrix` before/after diff in the body.

- [ ] **Step 1: Implement** — create branch `expand/<date>-<dataset>-<region>`, commit ingested rows, `gh pr create` with a body that embeds the `docs/coverage-matrix.md` diff + the GapTasks addressed + citation list.
- [ ] **Step 2: Run once end-to-end** on the Task-14 dry-run batch → a real PR opens; Nick reviews/merges.
- [ ] **Step 3: Confirm** merge → consumer prebuild fetch picks up new rows on next build (bump pinned SHA per Task 5).
- [ ] **Step 4: Commit** the script.

### Task 17: Schedule the recurring engine + first supervised run

**Files:**
- Create: `~/shared-data/scripts/run-expansion.ts` (chains 13→14→15→16 for the top-K GapTasks)
- Create: `~/Library/LaunchAgents/com.secondnick.cite-cache-expansion.plist` (monthly, matches existing Phase-E agent cadence)
- Modify: `~/PROJECTS.md` (register the daemon) + memory pointer

**Interfaces:**
- Produces: monthly autonomous run that opens 1+ expansion PR against `shared-data`, prioritized by `leverageScore`, respecting a per-run row cap (log any cap hit — no silent truncation).

- [ ] **Step 1: Implement** `run-expansion.ts` — pull `gap-queue`, take top-K, research → ingest → propose-PR; `log()` the cap and any dropped GapTasks.
- [ ] **Step 2: Supervised first run** — `npx tsx scripts/run-expansion.ts --dry-run` then a real run of K=1 (the single highest-leverage gap, a party-destination thin region). Verify the PR, spot-check 3 venue URLs render.
- [ ] **Step 3: Install launchd plist** — monthly (day 6, after the day-5 SEO fleet so coverage feeds SEO); `launchctl load`.
- [ ] **Step 4: Register** in `~/PROJECTS.md` daemon table + write a memory pointer (`project_planner_cite_cache_expansion_0705`).
- [ ] **Step 5: Commit.**

---

## Self-Review

**Spec coverage** — Pillar 1 → Tasks 1–5; Pillar 2 (tagging plan) → Tasks 2,6,7,8; Pillar 3 (audit feature) → Tasks 9–12; Pillar 4 (recurring engine) → Tasks 13–17. HHQ-untagged finding → Task 2. Forked-data reconciliation → Tasks 3,4. `expand` deferral (decision 4) → Tasks 8,10. Aggregate-leverage prioritization → Task 13. Real-venue/no-fabrication constraint → Task 14 gate. All spec sections map to tasks.

**Placeholder scan** — no TBD/TODO; each code step shows code or an exact command. Agent-research tasks (14,17) are inherently non-deterministic, so their *testable* surface (schema validator, citation gate, prioritizer, ingest gate) carries the TDD; the research call itself is bounded by those gates.

**Type consistency** — `deriveRouting`/`RoutingInput`/`Routing{core,expand}` used consistently; `WizardTag` gains `"handicap"` in Task 2 and is used that way in 6,9,11,13; `SharedGolfCourse.sites` widened in Task 2 and consumed in 3; `ENGINE_READS`/`WIZARD_INPUT_SPACE` defined in 10/11 before use in 12.

---

## Execution Handoff

Two execution options:
1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks. Well-suited here: many tasks are independent within a phase, and Phase 4 is agent-heavy.
2. **Inline Execution** — batch with checkpoints in this session.
