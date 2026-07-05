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
 *   - bestman (plan-my-party)   → party-venue AND golf-course. Best Man HQ's
 *     plan engine reads golf courses LIVE: `src/data/query.ts`'s
 *     `GOLF_FITS_BESTMAN` flag (unconditionally true today) gates a real read
 *     of `SharedGolfCourse` via `coursesForCity(...)` — the SAME reader
 *     Offsite Outpost uses. Golf IS intended on Best Man HQ (Nick,
 *     2026-07-05), so `deriveRouting`'s `core` for `golf-course` now assigns
 *     `bestman` (live `core` reach, no longer a pending `expand` candidate),
 *     and this map matches: the engine genuinely consumes golf-course data,
 *     so `(golf-course, bestman)` is CORRECTLY tagged and NOT an orphan.
 *     Residences are still NOT read by the BM engine (a residence tagged
 *     bestman remains a genuine orphan).
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
  bestman: ["party-venue", "golf-course"],
  moh: ["party-venue"],
  "offsite-retreat": ["residence", "experience", "outing-template", "party-venue", "golf-course"],
  "offsite-outing": ["residence", "experience", "outing-template", "party-venue", "golf-course"],
  handicap: ["golf-course", "golf-destination"],
  tdf: ["golf-course", "golf-destination"],
};
