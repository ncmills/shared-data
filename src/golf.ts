/**
 * golf.ts — THE public golf surface. Every consumer reads golf through here
 * (via `src/index.ts`); nothing outside this file should import
 * `./golf-courses` or `./golf-courses-hhq-merge` directly.
 *
 * WHY THIS FILE EXISTS (bug fixed 2026-07-31)
 * -------------------------------------------
 * Golf has two source files:
 *   - `golf-courses.ts`            — the regenerated 994-row base (DO NOT HAND-EDIT)
 *   - `golf-courses-hhq-merge.ts`  — the SANCTIONED INGEST DESTINATION. Every
 *                                    row a research agent adds through
 *                                    `scripts/ingest-researched.ts` lands here.
 *
 * The base file exports the name `SHARED_GOLF_COURSES` and its own
 * `coursesForCity()` built over a city index of the base rows ONLY. Both were
 * re-exported straight out of `index.ts`, so the two names every consumer
 * actually reads —
 *
 *     import { SHARED_GOLF_COURSES, coursesForCity } from "shared-data";
 *
 * — silently excluded every researched row. Handicap HQ reads
 * `SHARED_GOLF_COURSES`; Best Man HQ calls `coursesForCity()` live. The merged
 * set was reachable only through `ALL_GOLF_COURSES`, which no consumer used.
 * Result: researched courses closed audit gaps inside this repo and reached no
 * site. The 5 International budget/solid links courses that took
 * `International × budget` from 0 → 3 in the audit were invisible on every
 * site that was supposed to cite them.
 *
 * The fix is structural rather than a call-site correction: the PUBLIC names
 * are now the COMPLETE set, so a consumer gets researched rows by reading the
 * obvious thing, and there is no partial-set export left to reach by accident.
 * `ALL_GOLF_COURSES` stays as a back-compat alias.
 *
 * NOTE: `golf-courses.ts` still defines its own base-only `coursesForCity` —
 * it is generated, so it can't be edited without being overwritten on the next
 * regen. It is dead to the outside world (not re-exported from `index.ts`).
 * Import golf from here or from `shared-data`, never from `./golf-courses`.
 * The one legitimate exception is `scripts/ingest-researched.ts`, which needs
 * the BASE specifically for duplicate detection.
 */

import { SHARED_GOLF_COURSES as SHARED_GOLF_COURSES_BASE, type SharedGolfCourse } from "./golf-courses";
import { SHARED_GOLF_COURSES_HHQ_MERGE } from "./golf-courses-hhq-merge";

export type { SharedGolfCourse };
export { SHARED_GOLF_COURSES_HHQ_MERGE };

/** The regenerated base set WITHOUT the sanctioned expansion. Exported for the
 *  ingest gate's duplicate check and for provenance reporting — NOT a reader
 *  surface. If you are answering "what golf exists?", you want
 *  `SHARED_GOLF_COURSES` below. */
export { SHARED_GOLF_COURSES_BASE };

/**
 * Every golf course in the universe: the regenerated base plus the sanctioned
 * HHQ/ingest expansion. THIS is the golf set — TDF, Offsite, Handicap HQ and
 * Best Man HQ all read it.
 */
export const SHARED_GOLF_COURSES: SharedGolfCourse[] = [
  ...SHARED_GOLF_COURSES_BASE,
  ...SHARED_GOLF_COURSES_HHQ_MERGE,
];

/** Back-compat alias for the combined set. Identical to
 *  `SHARED_GOLF_COURSES` — kept so existing `ALL_GOLF_COURSES` imports (e.g.
 *  `scripts/verify-universe.ts`) keep working. Prefer `SHARED_GOLF_COURSES`. */
export const ALL_GOLF_COURSES: SharedGolfCourse[] = SHARED_GOLF_COURSES;

const TIER_RANK: Record<string, number> = { "bucket-list": 0, premium: 1, solid: 2, budget: 3 };

// City index over the COMBINED set (the base file's equivalent index covers
// base rows only — that omission is the bug this file fixes).
const _byCity = new Map<string, SharedGolfCourse[]>();
for (const c of SHARED_GOLF_COURSES) {
  const k = (c.city + "|" + c.state).toLowerCase();
  const bucket = _byCity.get(k);
  if (bucket) bucket.push(c);
  else _byCity.set(k, [c]);
}

/**
 * Top courses in a city (best tier first), matched loosely by city name.
 * Same matching behavior as the base file's version — exact city+state, then
 * exact city, then loose substring — but over the COMBINED set, so a
 * researched course in a city actually surfaces to Best Man HQ's live reader.
 */
export function coursesForCity(city: string, state?: string): SharedGolfCourse[] {
  const c = city.trim().toLowerCase();
  let hits: SharedGolfCourse[] = [];
  if (state) hits = _byCity.get(c + "|" + state.trim().toLowerCase()) ?? [];
  if (!hits.length) hits = SHARED_GOLF_COURSES.filter((x) => x.city.toLowerCase() === c);
  if (!hits.length)
    hits = SHARED_GOLF_COURSES.filter(
      (x) => c.includes(x.city.toLowerCase()) || x.city.toLowerCase().includes(c),
    );
  return [...hits].sort((a, b) => (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9));
}
