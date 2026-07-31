// golf.test.ts — the public golf surface reaches the sanctioned ingest file.
//
// REGRESSION GUARD (bug fixed 2026-07-31). Golf rows added by the sanctioned
// ingest (`scripts/ingest-researched.ts`) land in `golf-courses-hhq-merge.ts`.
// That file was merged only into `ALL_GOLF_COURSES`, which no consumer read —
// every consumer reads `SHARED_GOLF_COURSES` (Handicap HQ) or `coursesForCity`
// (Best Man HQ, live per-city), and BOTH resolved to the base-only versions
// re-exported from `golf-courses.ts`. Researched courses closed audit gaps
// inside this repo and reached no site.
//
// These tests assert the property that was violated: whatever the ingest
// writes is visible through the PUBLIC reader surface — not merely through
// some export that happens to be correct.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SHARED_GOLF_COURSES,
  SHARED_GOLF_COURSES_BASE,
  SHARED_GOLF_COURSES_HHQ_MERGE,
  ALL_GOLF_COURSES,
  coursesForCity,
} from "./index";

const identity = (c: { name: string; city: string; state: string }) => `${c.name}|${c.city},${c.state}`;

test("every sanctioned-ingest golf row is visible through the public SHARED_GOLF_COURSES export", () => {
  const publicIds = new Set(SHARED_GOLF_COURSES.map(identity));
  for (const row of SHARED_GOLF_COURSES_HHQ_MERGE) {
    assert.ok(
      publicIds.has(identity(row)),
      `"${row.name}" is in the sanctioned ingest file but NOT in SHARED_GOLF_COURSES — ` +
        `the export consumers actually read. Researched rows must not be reachable only via ALL_GOLF_COURSES.`,
    );
  }
});

test("every sanctioned-ingest golf row is reachable through coursesForCity (Best Man HQ's live reader)", () => {
  for (const row of SHARED_GOLF_COURSES_HHQ_MERGE) {
    const hits = coursesForCity(row.city, row.state).map(identity);
    assert.ok(
      hits.includes(identity(row)),
      `coursesForCity("${row.city}", "${row.state}") does not return "${row.name}" — ` +
        `the city index must be built over the MERGED set, not the base-only one.`,
    );
  }
});

test("the public set is exactly base + sanctioned ingest, with nothing double-counted", () => {
  assert.equal(
    SHARED_GOLF_COURSES.length,
    SHARED_GOLF_COURSES_BASE.length + SHARED_GOLF_COURSES_HHQ_MERGE.length,
    "public golf set must be base + merge exactly — a mismatch means a spread was dropped or duplicated",
  );
  const ids = SHARED_GOLF_COURSES.map(identity);
  assert.equal(new Set(ids).size, ids.length, "no course identity (name|city,state) may appear twice");
});

test("ALL_GOLF_COURSES remains a back-compat alias for the same complete set", () => {
  assert.deepEqual(ALL_GOLF_COURSES.map(identity), SHARED_GOLF_COURSES.map(identity));
});

test("the base export is strictly smaller than the public one whenever the ingest file is non-empty", () => {
  // Guards the inverted-wiring failure mode: if someone re-points the public
  // name back at the base, this fails while the merge file has rows in it.
  if (SHARED_GOLF_COURSES_HHQ_MERGE.length === 0) return;
  assert.ok(
    SHARED_GOLF_COURSES.length > SHARED_GOLF_COURSES_BASE.length,
    "SHARED_GOLF_COURSES must include the sanctioned ingest rows on top of the base",
  );
});
