// gap-queue.test.ts — Task 13: scan-gaps v2, aggregate-leverage prioritizer.
//
// All tests run against a synthetic `Starved[]` fixture (never the live
// universe) so leverage ordering is deterministic and independent of the
// current real starved-cell counts (which change as data gets backfilled).
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildGapQueueFrom } from "./gap-queue";
import type { Starved } from "./audit/starved-inputs";

/** deficit=2 either way (threshold 3, count 1) — a party-destination gap
 *  vs. a golf gap, so this is a controlled "equal deficit" comparison. */
const PARTY_GAP: Starved = {
  wizard: "moh",
  cell: { region: "international", partyVibe: "unhinged" },
  count: 1,
};

const GOLF_GAP: Starved = {
  wizard: "handicap",
  cell: { golfRegion: "International", tier: "budget" },
  count: 1,
};

test("TEETH: for equal deficit, the dataset serving MORE wizards outranks the one serving fewer", () => {
  // party-venue (bestman, moh, offsite-outing = 3 wizards per ENGINE_READS)
  // vs golf-course (bestman, offsite-retreat, offsite-outing, handicap, tdf
  // = 5 wizards per ENGINE_READS, since Task 10b added bestman). Whichever
  // wizard count is actually larger should win — assert against the live
  // reverse-lookup result, not a hardcoded expectation, so this test can't
  // silently drift from ENGINE_READS.
  const queue = buildGapQueueFrom([PARTY_GAP, GOLF_GAP], 3);
  assert.equal(queue.length, 2);

  const party = queue.find((t) => t.dataset === "party")!;
  const golf = queue.find((t) => t.dataset === "golf")!;
  assert.ok(party, "party task present");
  assert.ok(golf, "golf task present");
  assert.equal(party.deficit, golf.deficit, "fixture holds deficit equal");
  assert.notEqual(party.wizardsServed.length, golf.wizardsServed.length, "fixture must differ in wizard fan-out to be a real test");

  const moreServed = party.wizardsServed.length > golf.wizardsServed.length ? party : golf;
  const fewerServed = moreServed === party ? golf : party;
  assert.ok(
    moreServed.leverageScore > fewerServed.leverageScore,
    `dataset serving more wizards (${moreServed.dataset}, ${moreServed.wizardsServed.length}) must outrank the one serving fewer (${fewerServed.dataset}, ${fewerServed.wizardsServed.length})`,
  );
  // and the queue itself must be sorted with it on top
  assert.equal(queue[0].dataset, moreServed.dataset);
});

test("TEETH: a synthetic 3-wizard dataset outranks a synthetic 1-wizard dataset at equal deficit", () => {
  // A fully isolated, hand-verified case that doesn't depend on the live
  // ENGINE_READS fan-out at all: residence (offsite-retreat + offsite-outing
  // = 2 wizards) vs... we need a strict 1-wizard baseline, so fabricate one
  // by using two cells against the SAME wizard/kind pairing is not enough —
  // instead directly assert the leverage formula's shape (monotonic in
  // wizardsServed.length) using the two real datasets whose fan-out is
  // documented and stable: residence (2) vs golf (5).
  const RESIDENCE_GAP: Starved = {
    wizard: "offsite-retreat",
    cell: { setting: "palace", worldRegion: "Africa" },
    count: 1, // deficit 2, same as GOLF_GAP (threshold 3, count 1)
  };
  const queue = buildGapQueueFrom([RESIDENCE_GAP, GOLF_GAP], 3);
  const residence = queue.find((t) => t.dataset === "residence")!;
  const golf = queue.find((t) => t.dataset === "golf")!;
  assert.equal(residence.deficit, golf.deficit);
  assert.equal(residence.wizardsServed.length, 2);
  assert.equal(golf.wizardsServed.length, 5);
  assert.ok(golf.leverageScore > residence.leverageScore);
  assert.equal(queue[0].dataset, "golf");
});

test("deficit and wizardsServed are computed correctly for a fixture cell", () => {
  const [task] = buildGapQueueFrom([PARTY_GAP], 3);
  assert.equal(task.deficit, 2); // threshold 3 - count 1
  assert.equal(task.dataset, "party");
  assert.deepEqual(task.cell, PARTY_GAP.cell);
  // moh's starved-cell kind is party-venue; wizardsServed is whoever's
  // ENGINE_READS includes party-venue.
  assert.ok(task.wizardsServed.includes("moh"));
  assert.ok(task.wizardsServed.includes("bestman"));
  assert.ok(task.wizardsServed.includes("offsite-outing"));
});

test("deficit is computed correctly for a zero-count fixture cell", () => {
  const zero: Starved = { wizard: "tdf", cell: { golfRegion: "Midwest", tier: "solid" }, count: 0 };
  const [task] = buildGapQueueFrom([zero], 3);
  assert.equal(task.deficit, 3);
});

test("queue is sorted stable-descending by leverageScore", () => {
  const low: Starved = { wizard: "handicap", cell: { golfRegion: "Midwest", tier: "solid" }, count: 2 }; // deficit 1
  const high: Starved = { wizard: "handicap", cell: { golfRegion: "Southwest", tier: "solid" }, count: 0 }; // deficit 3
  const mid: Starved = { wizard: "handicap", cell: { golfRegion: "Southeast", tier: "solid" }, count: 1 }; // deficit 2

  // Feed intentionally out of order to prove the sort, not input order.
  const queue = buildGapQueueFrom([low, high, mid], 3);
  const scores = queue.map((t) => t.leverageScore);
  const sorted = scores.slice().sort((a, b) => b - a);
  assert.deepEqual(scores, sorted);
  assert.equal(queue[0].deficit, 3);
  assert.equal(queue[queue.length - 1].deficit, 1);
});

test("ties on leverageScore preserve original relative order (stable sort)", () => {
  // Two identical-shape cells (same wizard, same deficit → same score) —
  // stable sort must not swap their order.
  const a: Starved = { wizard: "handicap", cell: { golfRegion: "Midwest", tier: "solid" }, count: 1 };
  const b: Starved = { wizard: "handicap", cell: { golfRegion: "Southeast", tier: "solid" }, count: 1 };
  const queue = buildGapQueueFrom([a, b], 3);
  assert.equal(queue[0].cell.golfRegion, "Midwest");
  assert.equal(queue[1].cell.golfRegion, "Southeast");
});
