/**
 * golf-courses-hhq-merge.ts — Handicap HQ golf reconciliation overlay (Task 3).
 *
 * shared-data is the single golf-cite source. HHQ's former local golf fork was
 * already migrated onto the shared universe (HHQ renders `tdfDestinations()`),
 * so `scripts/reconcile-hhq-golf.ts` finds ZERO HHQ-only courses:
 *   - 994 shared golf courses ↔ 994 HHQ destination courses (1:1)
 *   - all 76 Golf Atlas marquee names resolve in SHARED_GOLF_COURSES
 *   - 0 field mismatches
 *
 * This file is the sanctioned place for any FUTURE HHQ-only course that has no
 * home in the regenerated `golf-courses.ts` (which must not be hand-edited).
 * Rows here carry `sites` including "handicap" and are real, deduped by
 * name+city against SHARED_GOLF_COURSES. It is empty today by design.
 *
 * Consumers read the combined `ALL_GOLF_COURSES` export from src/index.ts.
 */
import type { SharedGolfCourse } from "./golf-courses";

export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = [];
