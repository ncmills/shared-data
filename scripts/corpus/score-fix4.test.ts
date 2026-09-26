// score-fix4.test.ts — CORPUS-M5-FIX4 (DRV ruling 2), written red-first against 499fbc0.
//   A batch whose only failures are COPY_GRADING hits on some rows (anchors and sentinels all pass)
//   ingests its passing rows and re-asks only the failing rows, with the same anchors and sentinels
//   and the same checks. A batch with an anchor or sentinel miss (or any other row fault) is still
//   re-asked whole. At most one re-ask per row: a row that fails its re-ask ends unscored.
// New helpers are read off the module object so a missing export fails its own assertion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { factsRows } from "./facts.ts";
import { scopeIds } from "./scope.ts";
import * as S from "./score.ts";

const X = S as any;
const facts = new Map(factsRows().map((r) => [r.id, r]));
const anchors = (): any[] => (S.loadRubric("moh").rubric as any).anchors ?? [];
const sentinels = () => S.loadSentinels("moh");
const meta = { model: "claude-sonnet-5", runId: "m5-fullrun-moh-b05", scoredAt: "2026-09-25T00:00:00Z" };
const MID = { "moh-c-venue": 0.5, "moh-c-audience": 0.5, "moh-c-named": 1, "moh-c-not-before-10": 1 };
const SPORTS_BAR = "kansas-city-mo--nightlife--no-other-pub";
const plan = S.planRun("moh", scopeIds("moh"));
// The plan's largest batch that is not the first (so it writes no anchors). Not pinned to a
// literal row count: the scope shrinks whenever an upstream catalog change (e.g. #60) moves rows
// out of it, and every batch shrinks with it.
const nonFirstBatches = plan.batches.filter((_, i) => i > 0);
const BATCH = nonFirstBatches.reduce((a, b) => (b.length > a.length ? b : a));
// mirrors the original fixture's picks in a 50-row batch (an early row, index 3; a late-but-not-last
// row, index 40) so the two indices stay proportionally placed as the batch size moves.
const IDX_A = 3;
const IDX_B = BATCH.length - 9;
const ask = (ids: string[]) => ids.map((id) => facts.get(id)!);

function scoresFor(id: string, fit: number): Record<string, number> {
  for (let v = 0; v <= 1.0001; v += 0.05) {
    const s = { "moh-c-venue": +v.toFixed(2), "moh-c-audience": +v.toFixed(2), "moh-c-named": 1, "moh-c-not-before-10": 1 };
    if (Math.abs(S.combineFit("moh", s, S.ruleScores("moh", facts.get(id)!)) - fit) < 0.026) return s;
  }
  throw new Error(`no scores give ${id} fit ${fit}`);
}
/** An answer: anchors at reference, sentinels at pilot, batch rows mid; `reasons` / `over` override per id. */
function answer(batch: string[], reasons: Record<string, string> = {}, over: Record<string, Record<string, number>> = {}) {
  const row = (id: string, scores: Record<string, number>) => ({ id, scores: over[id] ?? scores, reason: reasons[id] ?? "moh-c-venue: a test row." });
  return [
    ...anchors().map((a) => row(a.id, a.scores)),
    ...batch.map((id) => row(id, MID)),
    ...sentinels().filter((s) => !batch.includes(s.id)).map((s) => row(s.id, scoresFor(s.id, s.pilot))),
  ];
}
const COPY = "moh-c-venue: a generic tour with no named operator.";
const ingestBatch = (...a: any[]) => X.ingestBatch(...a);
const ingestRowReask = (...a: any[]) => X.ingestRowReask(...a);

test("FIX4: the fixture batch is a real full-run batch, sized off the plan (not a pinned literal)", () => {
  assert.ok(BATCH && BATCH.length > 0);
  assert.ok(BATCH.length <= 50, "planRun caps every batch at 50 rows");
  assert.ok(nonFirstBatches.every((b) => b.length <= BATCH.length), "BATCH is the plan's largest non-first batch");
  assert.ok(BATCH.length > IDX_B, "the fixture's late-row index must still land inside the batch");
  assert.equal(typeof X.ingestBatch, "function", "ingestBatch is exported");
  assert.equal(typeof X.ingestRowReask, "function", "ingestRowReask is exported");
});

test("FIX4: a batch with 2 copy-grading rows ingests N-2 rows and re-asks the 2", () => {
  const bad = [BATCH[IDX_A], BATCH[IDX_B]].filter((id) => !sentinels().some((s) => s.id === id));
  assert.equal(bad.length, 2);
  const r = ingestBatch("moh", ask(BATCH), answer(BATCH, { [bad[0]]: COPY, [bad[1]]: COPY }), meta);
  assert.equal(r.rows.length, BATCH.length - 2);
  assert.deepEqual([...r.reask].sort(), [...bad].sort());
  for (const id of bad) assert.ok(!r.rows.some((x: S.ScoreRow) => x.id === id), `${id} is not ingested`);
  const rub = S.loadRubric("moh");
  for (const row of r.rows) assert.deepEqual(S.checkScore("moh", row, rub, facts.get(row.id)!), [], `${row.id} passes checkScore`);
});

test("FIX4: a clean batch ingests every row and re-asks none", () => {
  const r = ingestBatch("moh", ask(BATCH), answer(BATCH), meta);
  assert.equal(r.rows.length, BATCH.length);
  assert.deepEqual(r.reask, []);
});

test("FIX4: a sentinel miss still re-asks the whole batch, even with copy-grading rows in it", () => {
  const x = sentinels()[0];
  const far = x.pilot >= 0.5 ? x.pilot - 0.2 : x.pilot + 0.2;
  assert.throws(() => ingestBatch("moh", ask(BATCH), answer(BATCH, { [BATCH[IDX_A]]: COPY }, { [x.id]: scoresFor(x.id, far) }), meta), (e: Error) => /re-ask this batch/.test(e.message) && /sentinel/.test(e.message));
});

test("FIX4: an anchor miss still re-asks the whole batch, even with copy-grading rows in it", () => {
  assert.throws(() => ingestBatch("moh", ask(BATCH), answer(BATCH, { [BATCH[IDX_A]]: COPY }, { [SPORTS_BAR]: scoresFor(SPORTS_BAR, 0.5) }), meta), (e: Error) => /re-ask this batch/.test(e.message) && /anchor/.test(e.message));
});

test("FIX4: any other row fault (not copy grading) re-asks the whole batch", () => {
  assert.throws(() => ingestBatch("moh", ask(BATCH), answer(BATCH, { [BATCH[IDX_A]]: COPY, [BATCH[5]]: "a good bar for the group." }), meta), (e: Error) => /re-ask this batch/.test(e.message) && /cites no rubric id/.test(e.message));
  // a row whose reason both grades copy AND breaks another check is not a copy-grading-only row
  assert.throws(() => ingestBatch("moh", ask(BATCH), answer(BATCH, { [BATCH[IDX_A]]: "a generic tour." }), meta), /re-ask this batch/);
});

test("FIX4: the row re-ask prompt carries the same anchors and sentinels, and only the failing rows", () => {
  const p = S.renderScoringPrompt("moh", ask([BATCH[IDX_A], BATCH[IDX_B]]));
  for (const a of anchors()) assert.ok(p.includes(`"id":"${a.id}"`), `anchor ${a.id}`);
  for (const s of sentinels()) assert.ok(p.includes(`"id":"${s.id}"`), `sentinel ${s.id}`);
  for (const id of BATCH.filter((id) => id !== BATCH[IDX_A] && id !== BATCH[IDX_B] && !sentinels().some((s) => s.id === id))) assert.ok(!p.includes(`"id":"${id}"`));
});

test("FIX4: a re-asked row that passes is scored; one that fails again ends unscored", () => {
  const bad = [BATCH[IDX_A], BATCH[IDX_B]];
  const r = ingestRowReask("moh", ask(bad), answer(bad, { [bad[1]]: COPY }), meta);
  assert.deepEqual(r.rows.map((x: S.ScoreRow) => x.id), [bad[0]]);
  assert.deepEqual(r.unscored.map((u: { id: string }) => u.id), [bad[1]]);
  assert.match(r.unscored[0].why, /copy/);
});

test("FIX4: the re-ask gets the same checks: a sentinel or anchor miss leaves every re-asked row unscored", () => {
  const bad = [BATCH[IDX_A], BATCH[IDX_B]];
  const x = sentinels()[0];
  const far = x.pilot >= 0.5 ? x.pilot - 0.2 : x.pilot + 0.2;
  const r = ingestRowReask("moh", ask(bad), answer(bad, {}, { [x.id]: scoresFor(x.id, far) }), meta);
  assert.deepEqual(r.rows, []);
  assert.deepEqual(r.unscored.map((u: { id: string }) => u.id).sort(), [...bad].sort());
  assert.match(r.unscored[0].why, /sentinel/);
  const r2 = ingestRowReask("moh", ask(bad), answer(bad, {}, { [SPORTS_BAR]: scoresFor(SPORTS_BAR, 0.5) }), meta);
  assert.deepEqual(r2.rows, []);
  assert.equal(r2.unscored.length, 2);
});
