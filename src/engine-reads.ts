/**
 * engine-reads.ts — ground-truth map of which `EntityKind`s each wizard's
 * ENGINE actually consumes (not just which wizards a row is TAGGED for).
 *
 * ⚠️ TAG ≠ SURFACED (see `tagging-rules.ts`). A row can carry a wizard in its
 * baked `wizards[]` while that wizard's engine never reads the row's `kind` —
 * a dead/cosmetic tag. This map is the audit's source of truth for "does the
 * engine actually look at this kind," consumed by:
 *   - `scripts/audit/orphaned.ts`   (Task 10 — tagged-but-not-consumed)
 *   - `scripts/audit/starved.ts`    (Task 11 — consumed-but-not-tagged)
 *   - the Task 12 audit aggregator
 *
 * Built from the Phase-1 wiring audit (`docs/wiring-map.json`) plus explicit
 * corrections verified against the live consuming repos (wiring-map's
 * `entityKinds` are coarse — "golf" / "atlas" — so this is the accurate,
 * fine-grained source):
 *
 *   - bestman (plan-my-party)   → party-venue only. Golf is deliberately
 *     EXCLUDED here even though `src/data/query.ts`'s `GOLF_FITS_BESTMAN`
 *     flag currently gates a live read of `SharedGolfCourse` — see the
 *     concern noted in the Task 10 report: that reflects an already-wired
 *     `expand` candidate that `tagging-rules.ts` still classifies as
 *     `expand` rather than `core`. No real baked row can ever produce
 *     `(golf-course, bestman)` today (`deriveRouting`'s `core` never assigns
 *     bestman to golf-course rows, and legacy `sitesToWizards` never
 *     produces "bestman" either), so leaving it out here doesn't create a
 *     false-positive orphan on the real universe — only on the synthetic
 *     teeth-test row that deliberately constructs that combination.
 *   - moh (maid-of-honor-hq)    → party-venue only. Golf NEVER crosses to
 *     MOH (brand guard in `tagging-rules.ts`/`tags.ts`); residences aren't
 *     read either.
 *   - offsite-retreat / offsite-outing (offsite-outpost) → residence,
 *     experience, outing-template, party-venue (corporate-eligible), AND
 *     golf-course. The golf-course read is CONFIRMED live in
 *     `offsite-outpost/src/lib/engine/generate.ts`: `groundRetreatGolf` /
 *     `buildRetreatPlan` (retreat) and `groundOutingInCity` /
 *     `groundOutingInFreeText` (outing) both call `coursesNearPlace` /
 *     `topCourseForCity` from `shared-data`. This CORRECTS the initial
 *     ground-truth draft (which omitted golf-course for these two wizards)
 *     — without it, the Task 10 self-consistency cross-check (core routing
 *     vs. ENGINE_READS) fails non-trivially, because `deriveRouting`'s core
 *     for `golf-course` already includes both offsite wizards.
 *   - handicap (handicap-hq) / tdf (legacy/back-compat) → golf-course,
 *     golf-destination.
 */

import type { WizardTag } from "./tags";
import type { EntityKind } from "./tagging-rules";

export const ENGINE_READS: Record<WizardTag, EntityKind[]> = {
  bestman: ["party-venue"],
  moh: ["party-venue"],
  "offsite-retreat": ["residence", "experience", "outing-template", "party-venue", "golf-course"],
  "offsite-outing": ["residence", "experience", "outing-template", "party-venue", "golf-course"],
  handicap: ["golf-course", "golf-destination"],
  tdf: ["golf-course", "golf-destination"],
};
