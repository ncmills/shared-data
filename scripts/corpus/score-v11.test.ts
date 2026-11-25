// score-v11.test.ts — CORPUS-M5-FIX1 (R1 FIX round 1): rubric v1.1 guards.
// Written red-first against the v1.0.1 scorer (839dd7c); each test names the R1 finding it answers.
//   F2 score the venue, not the copy: occasion words are neutralised in the scorer view, the
//      other-occasion pitch is a deterministic flag, and a reason that grades copy fails verify.
//   F3 controls: per site 5 known-bad rows with no occasion word + 5 known-good, with the
//      thresholds written in the rubric (low ≤ 0.30, good ≥ 0.60).
//   F5 every reason cites a real rubric id; shorthand like "c-voice" fails.
//   F7 provenance carries scoredAt, runId and the model the call reported.
// New helpers are read off the module object so a missing export fails its own assertion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifySuitability } from "./verify-suitability.ts";
import { factsRows } from "./facts.ts";
import * as S from "./score.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const X = S as any;
const suit = (site: string) => JSON.parse(readFileSync(resolve(ROOT, `suitability/${site}.json`), "utf8"));
const facts = new Map(factsRows().map((r) => [r.id, r]));
const meta = { model: "claude-sonnet-5", runId: "test-run", scoredAt: "2026-09-25T12:00:00Z" };
const firstUnreviewed = (site: string, pred: (id: string) => boolean = () => true) =>
  suit(site).rows.find((r: any) => r.eligible !== "no" && pred(r.id)).id as string;
const nonTransport = (site: string) =>
  firstUnreviewed(site, (id) => facts.get(id)!.kind !== "transport" && facts.get(id)!.kind !== "golf-course" && !S.isMohGolfText(facts.get(id)!));
/** a valid v1.1 llm score for a row (all judged criteria at `v`), then overridden */
function plant(site: string, id: string, reason: string, over: Record<string, unknown> = {}) {
  const { rubric } = S.loadRubric(site);
  const scores = Object.fromEntries(((rubric as any).criteria ?? []).map((c: any) => [c.id, 0.7]));
  const base = typeof X.buildLlmScore === "function"
    ? X.buildLlmScore(site, facts.get(id)!, scores, reason, meta)
    : { id, fit: 0.7, reason, provenance: { tagger: "llm", model: meta.model, promptOrRulesVersion: S.loadRubric(site).version } };
  return { ...base, ...over, provenance: { ...base.provenance, ...((over.provenance as object) ?? {}) } };
}
const verifyWith = (site: string, rows: unknown[]) =>
  verifySuitability({ scores: { [site]: { rubricVersion: S.loadRubric(site).version, rows: rows as any } }, skipDrift: true });

// ── F2 ───────────────────────────────────────────────────────────────────────

test("F2: the scorer view neutralises occasion words in the row's copy, and keeps the venue name", () => {
  const v = S.scorerView(facts.get("nashville-tn--nightlife--white-limozeen")!) as any; // highlight: "…peak bachelorette aesthetic…"
  const copy = JSON.stringify({ ...v, id: "", name: "" });
  assert.ok(!/bachelor|bride|bridal|groom/i.test(copy), `occasion word left in the copy: ${copy}`);
  assert.match(copy, /\[occasion\]/);
  assert.equal(v.name, "White Limozeen");
  const m = S.scorerView(facts.get("portland-me--nightlife--comedy-connection-portland")!) as any; // "…bachelor party packages"
  assert.ok(!/bachelor/i.test(JSON.stringify({ ...m, id: "", name: "" })), "the male occasion word is neutralised too");
});

test("F2: pitched-at-other-occasion is a deterministic flag, not a model judgement", () => {
  assert.equal(typeof X.pitchFlags, "function", "score.ts exports pitchFlags(site, row)");
  const row = (name: string, highlight: string, bestFor = "") => ({ id: "x", kind: "nightlife", text: { name, highlight }, raw: { name, highlight, bestFor } });
  assert.deepEqual(X.pitchFlags("moh", row("Anchor Down", "Shots, and bachelor packages")), ["moh-r-pitched-at-other-occasion"]);
  assert.deepEqual(X.pitchFlags("moh", row("Dusk", "Bottle service", "Bachelor and bachelorette parties")), [], "a row pitched at both is not pitched at the other");
  assert.deepEqual(X.pitchFlags("moh", row("Mt. Bachelor Lodge", "Ski-in lodge")), [], "a place name is not a pitch");
  assert.deepEqual(X.pitchFlags("bestman", row("White Limozeen", "Pink rooftop, peak bachelorette aesthetic")), ["bestman-r-pitched-at-other-occasion"]);
  assert.deepEqual(X.pitchFlags("bestman", row("Doc Crow's", "Whiskey Row bourbon")), []);
  // the flag is on the committed row id too, read from the real data
  assert.deepEqual(X.pitchFlags("moh", facts.get("oklahoma-city-ok--nightlife--anchor-down")!), ["moh-r-pitched-at-other-occasion"]);
});

test("F2: red — a reason that grades the row's copy (generic|filler|hype|blurb|copy)", () => {
  const { rubric } = S.loadRubric("moh");
  const cid = (rubric as any).criteria[0].id;
  for (const word of ["generic", "filler", "hype", "blurb", "copy"]) {
    const id = nonTransport("moh");
    const problems = verifyWith("moh", [plant("moh", id, `${cid}: the highlight is ${word} but the venue is fine.`)]);
    assert.ok(problems.some((x) => x.includes(`${id}: reason grades the row's copy`)), `${word}: ${problems.join("\n")}`);
  }
});

// ── F5 ───────────────────────────────────────────────────────────────────────

test("F5: red — a reason with no real rubric id, or with shorthand like c-voice", () => {
  const id = nonTransport("bestman");
  const none = verifyWith("bestman", [plant("bestman", id, "A named steakhouse that takes the group (c-voice, c-named).")]);
  assert.ok(none.some((x) => x.includes(`${id}: reason cites no rubric id`)), none.join("\n"));
  const { rubric } = S.loadRubric("bestman");
  const real = (rubric as any).criteria[0].id;
  const mixed = verifyWith("bestman", [plant("bestman", id, `${real}: a named steakhouse (c-named).`)]);
  assert.ok(mixed.some((x) => x.includes(`${id}: reason cites "c-named", which is not a rubric id`)), mixed.join("\n"));
});

// ── F7 ───────────────────────────────────────────────────────────────────────

test("F7: red — provenance without scoredAt or runId", () => {
  const id = nonTransport("moh");
  const { rubric } = S.loadRubric("moh");
  const cid = (rubric as any).criteria[0].id;
  const bare = plant("moh", id, `${cid}: a named brunch room.`);
  delete (bare as any).provenance.scoredAt;
  delete (bare as any).provenance.runId;
  const problems = verifyWith("moh", [bare]);
  assert.ok(problems.some((x) => x.includes(`${id}: provenance has no scoredAt`)), problems.join("\n"));
  assert.ok(problems.some((x) => x.includes(`${id}: provenance has no runId`)), problems.join("\n"));
});

test("F7: the model comes from the call's transcript, not from the orchestrator", () => {
  assert.equal(typeof X.modelFromTranscript, "function", "score.ts exports modelFromTranscript(jsonlText)");
  const jsonl = [
    JSON.stringify({ type: "user", message: { role: "user", content: "x" } }),
    JSON.stringify({ type: "assistant", message: { model: "claude-sonnet-5", usage: { input_tokens: 3, output_tokens: 5 } } }),
  ].join("\n");
  assert.equal(X.modelFromTranscript(jsonl), "claude-sonnet-5");
  assert.throws(() => X.modelFromTranscript(JSON.stringify({ type: "user" })), /no assistant model/);
  const two = jsonl + "\n" + JSON.stringify({ type: "assistant", message: { model: "claude-opus-5-5" } });
  assert.throws(() => X.modelFromTranscript(two), /more than one model/);
});

// ── F3 ───────────────────────────────────────────────────────────────────────

test("F3: controls — 5 known-bad rows with no occasion word + 5 known-good per site, and the thresholds in the rubric", () => {
  const p = resolve(ROOT, "rubrics/controls.json");
  assert.ok(existsSync(p), "rubrics/controls.json exists");
  const ctl = JSON.parse(readFileSync(p, "utf8"));
  for (const site of S.SCORED_SITES) {
    const { rubric } = S.loadRubric(site);
    assert.deepEqual((rubric as any).thresholds && { low: (rubric as any).thresholds.low, good: (rubric as any).thresholds.good }, { low: 0.3, good: 0.6 });
    const c = ctl[site];
    assert.equal(c.bad.length, 5);
    assert.equal(c.good.length, 5);
    const eligible = new Set(suit(site).rows.filter((r: any) => r.eligible !== "no").map((r: any) => r.id));
    for (const id of [...c.bad, ...c.good]) {
      assert.ok(eligible.has(id), `${site} control ${id} must be a row the rules leave for scoring`);
      assert.notEqual(facts.get(id)!.kind, "transport", `${site} control ${id} must be graded on fit`);
    }
    for (const id of c.bad) {
      const text = JSON.stringify({ ...(S.scorerView(facts.get(id)!) as any), id: "" });
      assert.ok(!/bachelor|bride|bridal|groom|stag|golf|\[occasion\]/i.test(text), `${site} bad control ${id} carries an occasion word — a grep would find it`);
    }
  }
});

test("F3: once scored, every control lands on its side of the threshold", () => {
  const ctl = JSON.parse(readFileSync(resolve(ROOT, "rubrics/controls.json"), "utf8"));
  for (const site of S.SCORED_SITES) {
    const sc = S.loadScores(site);
    assert.ok(sc, `scores/${site}.json exists`);
    const by = new Map(sc!.rows.map((r) => [r.id, r]));
    const { rubric } = S.loadRubric(site);
    const t = (rubric as any).thresholds;
    for (const id of ctl[site].bad) assert.ok((by.get(id)?.fit ?? 1) <= t.low, `${site} bad ${id} fit ${by.get(id)?.fit} > ${t.low}`);
    for (const id of ctl[site].good) assert.ok((by.get(id)?.fit ?? 0) >= t.good, `${site} good ${id} fit ${by.get(id)?.fit} < ${t.good}`);
  }
});
