// backfill-queue.test.ts — the DISCOVERY half of the URL/provenance backfill.
//
// `gap-queue.ts` enumerates STARVED CELLS (dimensions short of rows) and drives
// the insert path. This is its sibling for the enrich path: it enumerates
// EXISTING rows missing a followable source and drives the patch path.
//
// Measured 2026-07-31: 6,225 party rows, 47 with a `url`, ZERO with a
// `sourceUrl`. Lodging (771) and transport (462) are at zero. That is the
// largest honesty gap in the portfolio and it is invisible to every existing
// audit, because a row with no source is still a perfectly valid row.
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildBackfillQueue, type BackfillTask } from "./backfill-queue";
import type { CanonicalDestination } from "../src/destinations-types";

function dest(id: string, over: Partial<CanonicalDestination> = {}): CanonicalDestination {
  return {
    id,
    city: "Queue City",
    state: "MN",
    region: "midwest",
    nearestAirport: { code: "QUE", name: "Queue Intl", driveMinutes: 20 },
    bestMonths: [6],
    vibes: ["balanced"],
    score: 7,
    nightlife: [],
    dining: [],
    activities: [],
    lodging: [],
    transport: [],
    presentation: { moh: { tagline: "t", description: "d" }, bestman: { tagline: "t", description: "d" } },
    ...over,
  } as CanonicalDestination;
}

const activity = (name: string, url?: string) =>
  ({
    name,
    type: "tour",
    duration: "2h",
    pricePerPerson: [10, 20],
    groupMin: 2,
    groupMax: 8,
    highlight: "h",
    bestFor: "b",
    brands: ["both"],
    wizards: ["moh", "bestman"],
    ...(url ? { url } : {}),
  }) as never;

test("emits a task for a destination+category with rows missing a URL", () => {
  const q = buildBackfillQueue([dest("a-mn", { activities: [activity("No Source Tour")] })]);

  assert.equal(q.tasks.length, 1);
  assert.equal(q.tasks[0].destinationId, "a-mn");
  assert.equal(q.tasks[0].category, "activity");
  assert.deepEqual(q.tasks[0].venues, ["No Source Tour"]);
});

test("excludes rows that already have a URL", () => {
  const q = buildBackfillQueue([
    dest("a-mn", {
      activities: [activity("Has Source", "https://real.example.org/"), activity("No Source")],
    }),
  ]);

  assert.equal(q.tasks.length, 1);
  assert.deepEqual(q.tasks[0].venues, ["No Source"], "only the unsourced venue is queued");
});

test("emits NO task for a category where every row is already sourced", () => {
  const q = buildBackfillQueue([
    dest("a-mn", { activities: [activity("Has Source", "https://real.example.org/")] }),
  ]);
  assert.equal(q.tasks.length, 0);
});

test("emits no task for an empty destination", () => {
  assert.equal(buildBackfillQueue([dest("empty-mn")]).tasks.length, 0);
});

test("splits categories into separate tasks", () => {
  const q = buildBackfillQueue([
    dest("a-mn", {
      activities: [activity("A1")],
      transport: [{ name: "T1", type: "shuttle", priceRange: "$$", highlight: "h" } as never],
    }),
  ]);

  assert.equal(q.tasks.length, 2);
  assert.deepEqual(
    q.tasks.map((t) => t.category).sort(),
    ["activity", "transport"],
  );
});

test("carries city and state so a researcher can actually find the venue", () => {
  // "Broadway" is meaningless without "Nashville, TN" — and the patch path
  // matches on destinationId, so the researcher never has to guess geography.
  const q = buildBackfillQueue([
    dest("a-mn", { city: "Nashville", state: "TN", activities: [activity("Broadway Crawl")] }),
  ]);

  assert.equal(q.tasks[0].city, "Nashville");
  assert.equal(q.tasks[0].state, "TN");
});

test("counts every unsourced row across the universe", () => {
  const q = buildBackfillQueue([
    dest("a-mn", { activities: [activity("A1"), activity("A2")] }),
    dest("b-mn", { activities: [activity("B1", "https://real.example.org/")] }),
  ]);

  assert.equal(q.totalUnsourced, 2);
  assert.equal(q.totalRows, 3);
});

test("orders tasks by leverage, highest first, deterministically", () => {
  const q = buildBackfillQueue([
    dest("small-mn", { activities: [activity("S1")] }),
    dest("big-mn", { activities: [activity("B1"), activity("B2"), activity("B3")] }),
  ]);

  assert.equal(q.tasks[0].destinationId, "big-mn", "more unsourced rows = more leverage");
  // Deterministic: same input, same order, every time.
  const again = buildBackfillQueue([
    dest("small-mn", { activities: [activity("S1")] }),
    dest("big-mn", { activities: [activity("B1"), activity("B2"), activity("B3")] }),
  ]);
  assert.deepEqual(
    again.tasks.map((t: BackfillTask) => t.id),
    q.tasks.map((t: BackfillTask) => t.id),
  );
});

test("a limit REPORTS what it dropped rather than silently truncating", () => {
  // A queue that quietly returns the top N reads as "that's all there is".
  const dests = [
    dest("a-mn", { activities: [activity("A1"), activity("A2")] }),
    dest("b-mn", { activities: [activity("B1")] }),
    dest("c-mn", { activities: [activity("C1")] }),
  ];
  const q = buildBackfillQueue(dests, { limit: 1 });

  assert.equal(q.tasks.length, 1);
  assert.equal(q.droppedTasks, 2, "must say how many tasks it withheld");
  assert.equal(q.totalUnsourced, 4, "the TOTAL must still describe the whole universe");
});

test("task ids are unique and name the destination + category", () => {
  const q = buildBackfillQueue([
    dest("a-mn", {
      activities: [activity("A1")],
      transport: [{ name: "T1", type: "shuttle", priceRange: "$$", highlight: "h" } as never],
    }),
  ]);

  const ids = q.tasks.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.includes("a-mn")));
});

test("reports the wizards that benefit, for prioritisation", () => {
  const q = buildBackfillQueue([dest("a-mn", { activities: [activity("A1")] })]);
  assert.deepEqual(q.tasks[0].wizardsServed.sort(), ["bestman", "moh"]);
});

// ─── chunking ───────────────────────────────────────────────────────────────
//
// A task is one research call. Observed 2026-07-31: a 25-venue New York task
// timed out `claude -p` at 180s and the fail-safe returned [], which the run
// then reported as "0 researched, 0 rejected" — indistinguishable from finding
// nothing. Bounding the work unit is the fix; a longer timeout alone just moves
// the cliff.

test("splits a category with more venues than the chunk size", () => {
  const many = Array.from({ length: 25 }, (_, i) => activity(`Venue ${i + 1}`));
  const q = buildBackfillQueue([dest("a-mn", { activities: many })], { maxVenuesPerTask: 10 });

  assert.equal(q.tasks.length, 3, "25 venues at 10 per task = 3 tasks");
  assert.deepEqual(
    q.tasks.map((t) => t.venues.length).sort((x, y) => y - x),
    [10, 10, 5],
  );
});

test("chunking loses no venue and keeps ids unique", () => {
  const many = Array.from({ length: 25 }, (_, i) => activity(`Venue ${i + 1}`));
  const q = buildBackfillQueue([dest("a-mn", { activities: many })], { maxVenuesPerTask: 10 });

  const seen = q.tasks.flatMap((t) => t.venues);
  assert.equal(seen.length, 25, "no venue may be dropped by chunking");
  assert.equal(new Set(seen).size, 25, "and none duplicated across chunks");
  assert.equal(new Set(q.tasks.map((t) => t.id)).size, q.tasks.length, "ids stay unique");
});

test("chunking does not distort the totals", () => {
  const many = Array.from({ length: 25 }, (_, i) => activity(`Venue ${i + 1}`));
  const q = buildBackfillQueue([dest("a-mn", { activities: many })], { maxVenuesPerTask: 10 });

  assert.equal(q.totalUnsourced, 25);
  assert.equal(q.totalRows, 25);
});

test("no chunk size means one task per category, as before", () => {
  const many = Array.from({ length: 25 }, (_, i) => activity(`Venue ${i + 1}`));
  const q = buildBackfillQueue([dest("a-mn", { activities: many })]);
  assert.equal(q.tasks.length, 1);
});
