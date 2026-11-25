// score-prerun.test.ts — CORPUS-M5-PRERUN (R1 close-out conditions F1, F4, (a)), written red-first
// against the FIX3 scorer (ddacd78).
//   F4:  an anchor answered more than 0.05 off its reference fit fails ingest, so the batch is re-asked.
//   (a): the in-scope anchors are written from the FIRST batch's in-call answer as ordinary llm rows
//        flagged "anchor"; later batches never write them; checkScore passes on them.
//   F1:  every MOH batch carries 2-3 pilot-stable sentinel rows WITHOUT reference scores; a sentinel
//        more than 0.15 off its pilot fit fails ingest; a sentinel is never written as a score row.
//        The full-run plan double-scores one rubric-silent-kind-heavy batch and reports mean |Δfit|.
// New helpers are read off the module object so a missing export fails its own assertion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { factsRows } from "./facts.ts";
import * as S from "./score.ts";

const X = S as any;
const facts = new Map(factsRows().map((r) => [r.id, r]));
const rub = () => S.loadRubric("moh");
const anchors = (): any[] => (rub().rubric as any).anchors ?? [];
const sentinels = (): any[] => (typeof X.loadSentinels === "function" ? X.loadSentinels("moh") : []);
const meta = { model: "claude-sonnet-5", runId: "m5-run-moh-b01", scoredAt: "2026-09-25T00:00:00Z" };
const SPORTS_BAR = "kansas-city-mo--nightlife--no-other-pub";
const POKER_ROOM = "gulfport-ms--activity--beau-rivage-poker-room-night";
const BATCH = ["rehoboth-beach-de--activity--drag-brunch-at-aqua", "burlington-vt--activity--ethan-allen-firing-range"];
const MID = { "moh-c-venue": 0.5, "moh-c-audience": 0.5, "moh-c-named": 1, "moh-c-not-before-10": 1 };

/** Scores that land a row on `fit` under the rubric combine (venue = audience = v, named = 1). */
function scoresFor(id: string, fit: number): Record<string, number> {
  for (let v = 0; v <= 1.0001; v += 0.05) {
    const s = { "moh-c-venue": +v.toFixed(2), "moh-c-audience": +v.toFixed(2), "moh-c-named": 1, "moh-c-not-before-10": 1 };
    if (Math.abs(S.combineFit("moh", s, S.ruleScores("moh", facts.get(id)!)) - fit) < 0.026) return s;
  }
  throw new Error(`no scores give ${id} fit ${fit}`);
}
/** A well-behaved answer: anchors at their reference scores, sentinels at their pilot fit, batch rows mid. */
function answer(batch: string[], over: Record<string, Record<string, number>> = {}) {
  const row = (id: string, scores: Record<string, number>) => ({ id, scores: over[id] ?? scores, reason: "moh-c-venue: a test row." });
  return [
    ...anchors().map((a) => row(a.id, a.scores)),
    ...batch.map((id) => row(id, MID)),
    ...sentinels().filter((s) => !batch.includes(s.id)).map((s) => row(s.id, scoresFor(s.id, s.pilot))),
  ];
}
const ask = (ids: string[]) => ids.map((id) => facts.get(id)!);

// ── F4 ───────────────────────────────────────────────────────────────────────

test("F4: an answer with the sports-bar anchor at 0.5 fails ingest (re-ask), naming the anchor", () => {
  assert.ok(anchors().some((a) => a.id === SPORTS_BAR), "the sports bar is an anchor");
  assert.throws(() => S.ingestAnswer("moh", ask(BATCH), answer(BATCH, { [SPORTS_BAR]: scoresFor(SPORTS_BAR, 0.5) }), meta), (e: Error) => e.message.includes(SPORTS_BAR) && /anchor/.test(e.message) && /re-ask/.test(e.message));
});

test("F4: an anchor within 0.05 of its reference ingests; one just past 0.05 does not", () => {
  const ref = S.anchorRef("moh", anchors().find((a) => a.id === SPORTS_BAR));
  assert.doesNotThrow(() => S.ingestAnswer("moh", ask(BATCH), answer(BATCH, { [SPORTS_BAR]: scoresFor(SPORTS_BAR, ref + 0.05) }), meta));
  assert.throws(() => S.ingestAnswer("moh", ask(BATCH), answer(BATCH, { [SPORTS_BAR]: scoresFor(SPORTS_BAR, ref + 0.1) }), meta), /anchor/);
});

// ── (a) ──────────────────────────────────────────────────────────────────────

test("(a): anchorsInScope names exactly the 2 in-scope anchors", () => {
  assert.equal(typeof X.anchorsInScope, "function", "score.ts exports anchorsInScope(site, scopeIds)");
  const scope = [SPORTS_BAR, POKER_ROOM, ...BATCH];
  assert.deepEqual([...X.anchorsInScope("moh", scope)].sort(), [SPORTS_BAR, POKER_ROOM].sort());
});

test("(a): the first batch writes the in-scope anchors once, as llm rows flagged anchor, and checkScore passes", () => {
  const rows = S.ingestAnswer("moh", ask(BATCH), answer(BATCH), meta, undefined, { writeAnchors: [SPORTS_BAR, POKER_ROOM] } as any);
  for (const id of [SPORTS_BAR, POKER_ROOM]) {
    const got = rows.filter((r) => r.id === id);
    assert.equal(got.length, 1, `${id} written once`);
    const r = got[0];
    assert.equal(r.provenance.tagger, "llm");
    assert.equal(r.provenance.runId, meta.runId, "the first batch's runId");
    assert.ok((r.flags ?? []).includes("anchor"), `${id} carries the anchor flag`);
    assert.deepEqual(S.checkScore("moh", r, rub(), facts.get(id)!), [], `${id} passes checkScore`);
  }
  for (const id of BATCH) assert.ok(!(rows.find((r) => r.id === id)!.flags ?? []).includes("anchor"), `${id} is not flagged anchor`);
});

test("(a): a later batch (no writeAnchors) never writes an anchor; writeAnchors refuses a non-anchor", () => {
  const rows = S.ingestAnswer("moh", ask(BATCH), answer(BATCH), meta);
  assert.deepEqual(rows.map((r) => r.id).sort(), [...BATCH].sort());
  assert.throws(() => S.ingestAnswer("moh", ask(BATCH), answer(BATCH), meta, undefined, { writeAnchors: [BATCH[0]] } as any), /not a calibration anchor/);
});

test("(a): checkScore holds the anchor flag to anchor rows only (positive control)", () => {
  const [r] = S.ingestAnswer("moh", ask(BATCH), answer(BATCH), meta).filter((x) => x.id === BATCH[0]);
  assert.ok(S.checkScore("moh", { ...r, flags: ["anchor"] }, rub(), facts.get(BATCH[0])!).some((p) => /flags/.test(p)), "a non-anchor flagged anchor fails");
  const a = S.ingestAnswer("moh", ask(BATCH), answer(BATCH), meta, undefined, { writeAnchors: [SPORTS_BAR] } as any).find((x) => x.id === SPORTS_BAR)!;
  const { flags, ...bare } = a;
  assert.ok(S.checkScore("moh", bare as any, rub(), facts.get(SPORTS_BAR)!).some((p) => /flags/.test(p)), "an anchor row without the flag fails");
});

// ── F1 sentinels ─────────────────────────────────────────────────────────────

test("F1: MOH has 2-3 valid sentinels (pilot-stable, llm-decided, not anchors, not controls); BMHQ has none", () => {
  assert.equal(typeof X.loadSentinels, "function", "score.ts exports loadSentinels(site)");
  const s = sentinels();
  assert.ok(s.length >= 2 && s.length <= 3, `2-3 sentinels, got ${s.length}`);
  for (const x of s) assert.ok(typeof x.pilot === "number", `${x.id} has a pilot fit`);
  assert.deepEqual(X.sentinelProblems("moh"), []);
  assert.deepEqual(X.loadSentinels("bestman"), []);
  assert.ok(X.sentinelProblems("moh", [{ id: SPORTS_BAR, pilot: 0.15 }]).some((p: string) => /anchor/.test(p)), "an anchor as a sentinel is caught");
  assert.ok(X.sentinelProblems("moh", [{ id: BATCH[1], pilot: 0.15 }]).some((p: string) => /control/.test(p)), "a control as a sentinel is caught");
});

test("F1: the MOH prompt carries the sentinels as ordinary rows, after the batch, with NO reference scores", () => {
  const p = S.renderScoringPrompt("moh", ask(BATCH));
  const s = sentinels();
  assert.ok(s.length >= 2);
  const last = Math.max(...BATCH.map((id) => p.indexOf(`"id":"${id}"`)));
  for (const x of s) {
    const at = p.indexOf(`"id":"${x.id}"`);
    assert.ok(at > last, `${x.id} is a row after the batch rows`);
    assert.equal(p.split(x.id).length - 1, 1, `${x.id} appears once (as a row, not in the calibration block)`);
  }
  assert.ok(!/sentinel/i.test(p), "the prompt never says which rows are sentinels");
  // a sentinel that is also a batch row is asked once, as a batch row
  const withS = [...BATCH, s[0].id];
  assert.equal(S.renderScoringPrompt("moh", ask(withS)).split(`"id":"${s[0].id}"`).length - 1, 1);
});

test("F1: a sentinel more than 0.15 off its pilot fails ingest (re-ask); within 0.15 ingests", () => {
  const x = sentinels()[0];
  const far = x.pilot >= 0.5 ? x.pilot - 0.2 : x.pilot + 0.2;
  assert.throws(() => S.ingestAnswer("moh", ask(BATCH), answer(BATCH, { [x.id]: scoresFor(x.id, far) }), meta), (e: Error) => e.message.includes(x.id) && /sentinel/.test(e.message) && /re-ask/.test(e.message));
  const near = x.pilot >= 0.5 ? x.pilot - 0.15 : x.pilot + 0.15;
  assert.doesNotThrow(() => S.ingestAnswer("moh", ask(BATCH), answer(BATCH, { [x.id]: scoresFor(x.id, near) }), meta));
});

test("F1: sentinels are required in the answer and never written as score rows (unless asked as a batch row)", () => {
  const s = sentinels();
  const noSent = answer(BATCH).filter((a) => !s.some((x) => x.id === a.id));
  assert.throws(() => S.ingestAnswer("moh", ask(BATCH), noSent, meta), /sentinel/);
  const rows = S.ingestAnswer("moh", ask(BATCH), answer(BATCH), meta);
  for (const x of s) assert.ok(!rows.some((r) => r.id === x.id), `${x.id} is not a score row`);
  const withS = [...BATCH, s[0].id];
  const rows2 = S.ingestAnswer("moh", ask(withS), answer(withS, { [s[0].id]: scoresFor(s[0].id, s[0].pilot) }), meta);
  assert.equal(rows2.filter((r) => r.id === s[0].id).length, 1, "a sentinel asked as a batch row is written once, as that batch's row");
});

// ── F1 double-score (plan only; nothing is run) ──────────────────────────────

test("F1: the full-run plan batches the scope without anchors, writes anchors from batch 1 only, and names one silent-kind-heavy batch to double-score", () => {
  assert.equal(typeof X.planRun, "function", "score.ts exports planRun(site, scopeIds)");
  const anchorIds = anchors().map((x) => x.id);
  const scope = [...facts.keys()].filter((id) => !anchorIds.includes(id) && S.decide("moh", facts.get(id)!).by === "llm").slice(0, 180);
  const plan = X.planRun("moh", [...scope, SPORTS_BAR, POKER_ROOM], 50);
  const all = plan.batches.flat();
  assert.equal(new Set(all).size, all.length, "no row in two batches");
  assert.ok(!all.includes(SPORTS_BAR) && !all.includes(POKER_ROOM), "anchors are never batch rows");
  assert.equal(all.length, scope.length, "every non-anchor scope row is in exactly one batch");
  assert.ok(plan.batches.every((b: string[]) => b.length <= 50));
  assert.deepEqual([...plan.writeAnchors[0]].sort(), [SPORTS_BAR, POKER_ROOM].sort(), "batch 1 writes the in-scope anchors");
  assert.ok(plan.writeAnchors.slice(1).every((w: string[]) => w.length === 0), "later batches write none");
  const n = plan.batches.map((b: string[]) => b.filter((id) => X.isSilentKind("moh", facts.get(id)!)).length);
  assert.equal(n[plan.doubleScore], Math.max(...n), "the double-scored batch is the most silent-kind-heavy");
  assert.deepEqual(plan.batches, X.planRun("moh", [...scope, SPORTS_BAR, POKER_ROOM], 50).batches, "the plan is deterministic");
  const bm = [...facts.keys()].filter((id) => S.decide("bestman", facts.get(id)!).by === "llm").slice(0, 60);
  const bplan = X.planRun("bestman", bm, 50);
  assert.equal(bplan.doubleScore, null, "BMHQ has no silent-kind list, so no double-score step");
  assert.ok(bplan.writeAnchors.every((w: string[]) => w.length === 0), "BMHQ writes no anchors");
});

test("F1: meanAbsDeltaFit compares two scorings of one batch row by row", () => {
  const r = (id: string, fit: number) => ({ id, class: "fit", fit }) as any;
  assert.equal(X.meanAbsDeltaFit([r("a", 0.5), r("b", 0.8)], [r("b", 0.6), r("a", 0.6)]), 0.15);
  assert.throws(() => X.meanAbsDeltaFit([r("a", 0.5)], [r("b", 0.5)]), /same rows/);
});
