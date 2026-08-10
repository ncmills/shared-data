// research-backfill.test.ts — the RESEARCH half of the URL/provenance backfill.
//
// `research-gap.ts` prompts for NEW venues to fill a starved cell. This prompts
// for the real primary source of venues that ALREADY EXIST, and returns
// `party-venue-patch` rows.
//
// The extra guard here that the gap path does not need: DRIFT. The researcher
// is an LLM given a list of venue names, and the patch key is the venue name —
// so a returned row for "Broadway Honky Tonk Crawl" when we asked about
// "Broadway Crawl" is not a near-miss, it is a patch that will never resolve.
// Worse, a drifted name plus a real URL is a plausible row that silently
// documents the wrong venue. Rows that were not asked for are rejected here,
// with the reason, rather than left for the ingest gate to puzzle over.
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildUrlBackfillPrompt, researchBackfill, budgetForVenues } from "./research-backfill";
import type { BackfillTask } from "./backfill-queue";

const TASK: BackfillTask = {
  id: "url-backfill:nashville-tn:activity",
  destinationId: "nashville-tn",
  city: "Nashville",
  state: "TN",
  category: "activity",
  venues: ["Broadway Crawl", "Ryman Auditorium Tour"],
  wizardsServed: ["bestman", "moh"],
  leverageScore: 4,
};

function candidate(over: Record<string, unknown> = {}) {
  return {
    dataset: "party-venue-patch",
    destinationId: "nashville-tn",
    category: "activity",
    name: "Broadway Crawl",
    url: "https://www.broadway-crawl-fixture.test/",
    sourceUrl: "https://www.broadway-crawl-fixture.test/",
    citations: ["https://www.broadway-crawl-fixture.test/about"],
    ...over,
  };
}

// ─── prompt ─────────────────────────────────────────────────────────────────

test("prompt names every venue it wants sourced", () => {
  const p = buildUrlBackfillPrompt(TASK);
  assert.match(p, /Broadway Crawl/);
  assert.match(p, /Ryman Auditorium Tour/);
});

test("prompt carries the geography so the venue is findable", () => {
  const p = buildUrlBackfillPrompt(TASK);
  assert.match(p, /Nashville/);
  assert.match(p, /TN/);
});

test("prompt requests the patch dataset and the anchor keys", () => {
  const p = buildUrlBackfillPrompt(TASK);
  assert.match(p, /party-venue-patch/);
  assert.match(p, /nashville-tn/);
  assert.match(p, /activity/);
});

test("prompt demands the name be copied EXACTLY, because it is the key", () => {
  const p = buildUrlBackfillPrompt(TASK);
  assert.match(p, /exact|verbatim|character-for-character/i);
});

test("prompt carries the no-fabrication rule and the drop-rather-than-guess rule", () => {
  const p = buildUrlBackfillPrompt(TASK);
  assert.match(p, /do not invent|no fabrication/i);
  assert.match(p, /drop/i);
});

test("prompt asks for url AND sourceUrl AND citations", () => {
  const p = buildUrlBackfillPrompt(TASK);
  assert.match(p, /"url"/);
  assert.match(p, /"sourceUrl"/);
  assert.match(p, /"citations"/);
});

test("prompt is pure — same task, same string", () => {
  assert.equal(buildUrlBackfillPrompt(TASK), buildUrlBackfillPrompt(TASK));
});

// ─── research + validation ──────────────────────────────────────────────────

test("accepts a well-formed patch candidate", async () => {
  const res = await researchBackfill(TASK, async () => [candidate()]);

  assert.equal(res.rows.length, 1, JSON.stringify(res.rejections));
  assert.equal(res.rejected, 0);
});

test("REJECTS a venue that was not asked about (researcher drift)", async () => {
  const res = await researchBackfill(TASK, async () => [candidate({ name: "Some Other Bar" })]);

  assert.equal(res.rows.length, 0);
  assert.equal(res.rejected, 1);
  assert.match(res.rejections[0].reasons.join(" "), /not (in|among)|was not asked|drift/i);
});

test("REJECTS a candidate that drifts to another destination", async () => {
  const res = await researchBackfill(TASK, async () => [candidate({ destinationId: "memphis-tn" })]);

  assert.equal(res.rows.length, 0);
  assert.match(res.rejections[0].reasons.join(" "), /memphis-tn|destination/i);
});

test("REJECTS a candidate that drifts to another category", async () => {
  const res = await researchBackfill(TASK, async () => [candidate({ category: "nightlife" })]);

  assert.equal(res.rows.length, 0);
  assert.match(res.rejections[0].reasons.join(" "), /categor/i);
});

test("REJECTS a candidate with no citations, via the honesty firewall", async () => {
  const res = await researchBackfill(TASK, async () => [candidate({ citations: [] })]);

  assert.equal(res.rows.length, 0);
  assert.match(res.rejections[0].reasons.join(" "), /citation/i);
});

test("REJECTS a placeholder source URL", async () => {
  const res = await researchBackfill(TASK, async () => [
    candidate({ url: "https://example.com/", sourceUrl: "https://example.com/" }),
  ]);

  assert.equal(res.rows.length, 0);
});

test("matches the asked-for name case- and whitespace-insensitively", async () => {
  // The researcher echoing "  broadway crawl " is a formatting wobble, not
  // drift — the patch layer matches names the same forgiving way.
  const res = await researchBackfill(TASK, async () => [candidate({ name: "  broadway crawl " })]);

  assert.equal(res.rows.length, 1, JSON.stringify(res.rejections));
});

test("keeps the good rows and reports the bad ones in one batch", async () => {
  const res = await researchBackfill(TASK, async () => [
    candidate(),
    candidate({ name: "Not Asked About" }),
    candidate({ name: "Ryman Auditorium Tour", url: "https://www.ryman-fixture.test/", sourceUrl: "https://www.ryman-fixture.test/", citations: ["https://www.ryman-fixture.test/tours"] }),
  ]);

  assert.equal(res.rows.length, 2);
  assert.equal(res.rejected, 1);
});

test("a researcher that returns nothing is not a crash", async () => {
  const res = await researchBackfill(TASK, async () => []);
  assert.deepEqual(res.rows, []);
  assert.equal(res.rejected, 0);
});

test("live URL checking is opt-in and rejects a dead source", async () => {
  const res = await researchBackfill(TASK, async () => [candidate()], {
    liveUrlCheck: true,
    verifyUrl: async () => ({ ok: false, status: 404, url: "x", reason: "dead" }) as never,
  });

  assert.equal(res.rows.length, 0);
  assert.equal(res.rejected, 1);
});

// ─── the budget must track the work (2026-08-10) ────────────────────────────
//
// Measured, 8 real calls at concurrency 1 against a 600s budget:
//
//   1 venue   31.2s, 44.8s          3 venues  65.7s
//   2 venues  35.3s                 8 venues  85.6s / 130.3s / 232.9s / 438.1s
//
// The 8-venue MEDIAN is ~181s against a 180s production budget — the timeout
// was set at the median of the distribution it is meant to bound, so ~half of
// those calls were truncated. They are slow-but-productive, not hung:
// `atlanta-ga:nightlife` timed out in production on 08-06 and, given 438s,
// returns 3 rows.
//
// This matters because `leverageScore = venues x wizards` sorts biggest-first,
// so TOP_K selects ONLY max-size tasks (all 40 in the 08-06 run were 8-venue).
// Production attempts exclusively the class the fixed budget cannot cover.
//
// A generous budget is close to free: it is a ceiling, not a sleep. Only a call
// that actually runs long spends it.

test("the budget scales with the venues actually asked about", () => {
  assert.ok(budgetForVenues(8) > budgetForVenues(3),
    "8 venues is more work than 3 and must get more time");
  assert.ok(budgetForVenues(3) > budgetForVenues(2));
});

test("the budget covers the slowest call actually measured", () => {
  // 438.1s was the real max for an 8-venue task.
  assert.ok(budgetForVenues(8) >= 438_100,
    `8-venue budget ${budgetForVenues(8)}ms must cover the measured 438.1s`);
});

test("no task gets LESS than the 180s it gets today", () => {
  // Small tasks measured 31-66s, so the floor is never the binding constraint —
  // but lowering any budget would be a regression in tolerance, not a fix.
  for (const n of [0, 1, 2, 3]) {
    assert.ok(budgetForVenues(n) >= 180_000, `${n} venues must not drop below 180s`);
  }
});

test("the budget is capped, so a genuinely hung call cannot run away", () => {
  // Fail-safe returns [] on timeout, so an uncapped budget just burns wall
  // clock on a hang — at TOP_K=40 that is the whole run.
  assert.ok(budgetForVenues(999) <= 600_000, "must stay bounded for absurd input");
});

test("researchBackfill asks for a budget matching the task it is running", async () => {
  let seen: unknown;
  const task = {
    id: "url-backfill:x:dining", destinationId: "x", category: "dining",
    city: "X", state: "XX", venues: ["A", "B", "C"], wizardsServed: ["moh"], leverageScore: 3,
  } as any;

  await researchBackfill(task, async (_p: string, o?: { timeoutMs?: number }) => {
    seen = o?.timeoutMs;
    return [];
  });

  assert.equal(seen, budgetForVenues(3),
    "the per-call budget must be derived from THIS task's venue count");
});
