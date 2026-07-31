// golf-attach.test.ts — a researched course must reach a PAGE, not just a list.
//
// The flat golf catalog is not what renders. Handicap HQ generates its course
// pages (`/golf-trips/[slug]/courses/[course]`) from each destination's
// embedded `courses[]`, so a course that exists only in `SHARED_GOLF_COURSES`
// has no page — 38 of 999 were in exactly that state, including 4 of the 5
// sanctioned-ingest rows. `destinationId` + `tdfDestinations()` attaches them
// to a real trip so they inherit the surface that already exists.
//
// These tests guard the property the golf bug family keeps violating: the data
// reaching a consumer's IMPORT is not the same as the data reaching a USER.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  tdfDestinations,
  SHARED_TDF_DESTINATIONS,
  SHARED_GOLF_COURSES_HHQ_MERGE,
} from "./index";

const embeddedNames = (): Set<string> => {
  const out = new Set<string>();
  for (const dest of tdfDestinations()) {
    for (const c of ((dest.courses ?? []) as { name: string }[])) out.add(c.name.trim().toLowerCase());
  }
  return out;
};

test("every sanctioned-ingest course with a destinationId actually RENDERS on that destination", () => {
  const dests = new Map(tdfDestinations().map((d) => [d.id, d]));
  for (const course of SHARED_GOLF_COURSES_HHQ_MERGE) {
    if (!course.destinationId) continue;
    const dest = dests.get(course.destinationId);
    assert.ok(dest, `"${course.name}" names destinationId "${course.destinationId}", which does not exist`);
    const names = ((dest!.courses ?? []) as { name: string }[]).map((c) => c.name.trim().toLowerCase());
    assert.ok(
      names.includes(course.name.trim().toLowerCase()),
      `"${course.name}" is anchored to ${course.destinationId} but is not in that destination's courses[] — it would render nowhere`,
    );
  }
});

test("attaching never duplicates a course the destination already embedded", () => {
  for (const dest of tdfDestinations()) {
    const names = ((dest.courses ?? []) as { name: string }[]).map((c) => c.name.trim().toLowerCase());
    assert.equal(
      new Set(names).size,
      names.length,
      `${dest.id} has a duplicate course after attach: ${names.filter((n, i) => names.indexOf(n) !== i).join(", ")}`,
    );
  }
});

test("attach NEVER fabricates holes/par/yardage to fill the embedded shape", () => {
  // These are substantive published facts with no neutral default — the same
  // rule the ingest gate applies to greenFeeRange/style. A researched row that
  // lacks them must render WITHOUT them, not with an invented number.
  // Only rows the attach ACTUALLY ADDED. A researched course whose name was
  // already embedded (e.g. Ardglass, curated into Newcastle long ago) keeps the
  // original curated row — real stats and all — because dedup lets the existing
  // one win. Asserting on that row would be testing the curated data, not the
  // attach.
  const preEmbedded = new Set<string>();
  for (const dest of SHARED_TDF_DESTINATIONS) {
    for (const c of ((dest.courses ?? []) as { name: string }[])) preEmbedded.add(c.name.trim().toLowerCase());
  }
  const anchored = SHARED_GOLF_COURSES_HHQ_MERGE.filter(
    (c) => c.destinationId && !preEmbedded.has(c.name.trim().toLowerCase()),
  );
  assert.ok(anchored.length > 0, "expected at least one NEWLY attached researched course");
  const dests = new Map(tdfDestinations().map((d) => [d.id, d]));

  for (const course of anchored) {
    const dest = dests.get(course.destinationId!)!;
    const row = ((dest.courses ?? []) as Record<string, unknown>[]).find(
      (c) => String(c.name).trim().toLowerCase() === course.name.trim().toLowerCase(),
    )!;
    for (const stat of ["holes", "par", "yardage"] as const) {
      // The flat catalog shape carries none of these, so an attached row must
      // simply omit them. A number appearing here means something invented it.
      assert.equal(
        row[stat],
        undefined,
        `attached course "${course.name}" has a ${stat} value that the researched row never supplied — that is a fabricated stat`,
      );
    }
  }
});

test("a course with NO destinationId stays catalog-only rather than being guessed onto a trip", () => {
  // Anchoring is explicit. Guessing from city/state across international
  // geography is precisely the silent mis-association this avoids.
  const unanchored = SHARED_GOLF_COURSES_HHQ_MERGE.filter((c) => !c.destinationId);
  const embedded = embeddedNames();
  for (const course of unanchored) {
    assert.ok(
      !embedded.has(course.name.trim().toLowerCase()),
      `"${course.name}" has no destinationId but appears embedded — attach must never guess an anchor`,
    );
  }
});

test("tdfDestinations() is otherwise identical to the source (attach only ADDS courses)", () => {
  const before = SHARED_TDF_DESTINATIONS;
  const after = tdfDestinations();
  assert.equal(after.length, before.length, "attach must not add or drop destinations");
  for (let i = 0; i < before.length; i++) {
    assert.equal(after[i]!.id, before[i]!.id, "destination order must be stable");
    const beforeCourses = ((before[i]!.courses ?? []) as unknown[]).length;
    const afterCourses = ((after[i]!.courses ?? []) as unknown[]).length;
    assert.ok(afterCourses >= beforeCourses, `${before[i]!.id} lost courses during attach`);
  }
});
