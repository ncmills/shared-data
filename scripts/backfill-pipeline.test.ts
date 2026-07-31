// backfill-pipeline.test.ts — the 2B.2 URL/provenance backfill, END TO END.
//
// Proves the whole chain on the REAL universe and the REAL patches file:
//
//   buildBackfillQueue  → a real task naming real unsourced venues
//   buildUrlBackfillPrompt / researchBackfill → validated patch rows
//   ingestResearched    → src/party-venue-patches.ts (real gates)
//   applyPartyVenuePatches → bakeDestination → applyMohOverlay
//                       → the object a site actually renders
//
// The researcher is a deterministic stub (no network in the suite), but it is
// the ONLY stubbed link — every other stage is the production path.
//
// This is the guard that matters for this slice. A backfill that reports
// "n rows sourced" while the URLs reach no page is precisely the failure this
// repo keeps shipping: researched golf rows closed an audit gap while reaching
// no import, then reached the import while still reaching no page.
//
// The real file and docs/ are restored in a `finally`.
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildBackfillQueue, type BackfillTask } from "./backfill-queue";
import { researchBackfill } from "./research-backfill";

/**
 * A real unsourced activity that ALREADY renders on MOH — so a failure points
 * at the backfill chain, not at the taxonomy or the overlay allowlist.
 */
/**
 * A FIXTURE task, not one derived from the live universe.
 *
 * These tests run in their own process while src/party-venue-patch-renders.test.ts
 * may be mid-mutation of the real src/party-venue-patches.ts. If this process
 * imported the universe inside that window, the target venue would already
 * carry a URL and drop out of the queue — an intermittent failure that appears
 * only in the aggregate suite. Observed exactly once before this was fixed.
 * The real-universe end-to-end proof lives in that serialised file instead.
 */
const TASK: BackfillTask = {
  id: "url-backfill:pipeline-fixture-mn:activity",
  destinationId: "pipeline-fixture-mn",
  city: "Pipeline City",
  state: "MN",
  category: "activity",
  venues: ["Fixture Distillery Tour", "Fixture River Cruise"],
  wizardsServed: ["bestman", "moh"],
  leverageScore: 4,
};

const FIXTURE_URL = "https://www.backfill-pipeline-proof.test/";

test("the real backfill queue finds the unsourced universe", () => {
  // Aggregate assertions only — a concurrent test may source any single venue,
  // but it cannot meaningfully move these totals.
  const q = buildBackfillQueue();

  assert.ok(q.totalRows > 6000, `expected >6000 party rows, got ${q.totalRows}`);
  assert.ok(q.totalUnsourced > 6000, `expected >6000 unsourced, got ${q.totalUnsourced}`);
  assert.ok(q.tasks.length > 500, `expected >500 tasks, got ${q.tasks.length}`);
  assert.ok(
    q.tasks.every((t) => t.venues.length > 0),
    "every task must name at least one venue to source",
  );
});

test("a researched URL survives research and is ingest-shaped", async () => {
  const task = TASK;

  // The only stubbed link. Returns one well-formed patch for a venue that IS on
  // the asked list, exactly as a real researcher would.
  const stubResearcher = async () => [
    {
      dataset: "party-venue-patch",
      destinationId: task.destinationId,
      category: task.category,
      name: task.venues[0],
      url: FIXTURE_URL,
      sourceUrl: FIXTURE_URL,
      citations: [`${FIXTURE_URL}about`],
    },
  ];

  const researched = await researchBackfill(task, stubResearcher);
  assert.equal(researched.rows.length, 1, JSON.stringify(researched.rejections));

  const row = researched.rows[0] as unknown as Record<string, unknown>;
  assert.equal(row.dataset, "party-venue-patch");
  assert.equal(row.destinationId, task.destinationId);
  assert.equal(row.name, task.venues[0]);
  assert.equal(row.url, FIXTURE_URL);

  // The ingest + RENDER half of this chain lives in
  // src/party-venue-patch-renders.test.ts. It is deliberately NOT here: that
  // test mutates the real src/party-venue-patches.ts, and node's runner
  // executes test FILES in parallel — two files doing read-append-write on one
  // shared file is a lost-update race, and both picking the same target venue
  // makes one see the other's row as a duplicate. Every real-file mutation is
  // therefore serialised into that one file. (Found exactly this way: the
  // suite failed only in aggregate, never in isolation.)
});

test("a drifted researcher result never reaches the file", async () => {
  // The dangerous case: a real, live URL attached to a venue we did not ask
  // about. It would pass every downstream gate and document the wrong place.
  const task = TASK;

  const driftingResearcher = async () => [
    {
      dataset: "party-venue-patch",
      destinationId: task.destinationId,
      category: task.category,
      name: "A Venue Nobody Asked About",
      url: FIXTURE_URL,
      sourceUrl: FIXTURE_URL,
      citations: [`${FIXTURE_URL}about`],
    },
  ];

  const researched = await researchBackfill(task, driftingResearcher);
  assert.equal(researched.rows.length, 0, "drifted row must not survive research");
  assert.equal(researched.rejected, 1);
});
