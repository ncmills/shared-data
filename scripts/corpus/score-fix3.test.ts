// score-fix3.test.ts — CORPUS-M5-FIX3 (R1 FIX round 3): MOH calibration anchors.
// Written red-first against the v1.2 scorer (9f09b93).
//   Ruling 1: the code allowlist decides whether a row may be SHOWN; the rubric's low list decides
//             its FIT. The rubric header says so.
//   Ruling 2: every MOH scoring batch carries the same 6 fixed anchor rows (2 low, 2 mid, 2 high),
//             picked from the rubric's own examples, never controls, scored in the same call;
//             their per-run scores are reported. No offsets, no averaging.
// New helpers are read off the module object so a missing export fails its own assertion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { factsRows } from "./facts.ts";
import * as S from "./score.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const X = S as any;
const facts = new Map(factsRows().map((r) => [r.id, r]));
const rub = () => S.loadRubric("moh");
const anchors = (): any[] => ((rub().rubric as any).anchors ?? []);
const BATCH = ["rehoboth-beach-de--activity--drag-brunch-at-aqua", "burlington-vt--activity--ethan-allen-firing-range"];
const answerFor = (ids: string[]) => ids.map((id) => ({ id, scores: { "moh-c-venue": 0.5, "moh-c-audience": 0.5, "moh-c-named": 1, "moh-c-not-before-10": 1 }, reason: "moh-c-venue: a test row." }));
const meta = { model: "claude-sonnet-5", runId: "t", scoredAt: "2026-09-25T00:00:00Z" };

test("ruling 1: the MOH rubric header says the allowlist decides SHOWN and the low list decides FIT", () => {
  const head = rub().text.split("\n").filter((l) => l.startsWith("#")).join(" ");
  assert.match(head, /allowlist[^.]*(shown|SHOWN)/, "the header names the code allowlist as the shown/eligibility gate");
  assert.match(head, /low list[^.]*(fit|FIT)/, "the header names the rubric's low list as the fit decider");
  assert.match(head, /allowed and still score low/, "the header says a row can be allowed and still score low");
});

test("ruling 2: the MOH rubric carries 6 fixed anchors — 2 low, 2 mid, 2 high — valid and not controls", () => {
  const a = anchors();
  assert.equal(a.length, 6, "six anchors");
  const bands = a.map((x) => x.band).sort();
  assert.deepEqual(bands, ["high", "high", "low", "low", "mid", "mid"]);
  assert.equal(typeof X.anchorProblems, "function", "score.ts exports anchorProblems(site)");
  assert.deepEqual(X.anchorProblems("moh"), [], "every anchor is a facts row, decided llm, not a control, its reference fit is in its band, and its example is the rubric's own text");
  const ctl = JSON.parse(readFileSync(resolve(ROOT, "rubrics/controls.json"), "utf8"));
  for (const x of a) assert.ok(![...ctl.moh.bad, ...ctl.moh.good].includes(x.id), `${x.id} is not a control`);
});

test("ruling 2: anchorProblems catches a broken anchor (positive control)", () => {
  const a = anchors();
  const bad = { ...a[0], band: "high" };
  const probs = X.anchorProblems("moh", [bad, ...a.slice(1)]);
  assert.ok(probs.some((p: string) => p.includes(a[0].id) && /band/.test(p)), `a low anchor labelled high is caught: ${probs.join(" | ")}`);
  const ctlAnchor = { ...a[0], id: "burlington-vt--activity--ethan-allen-firing-range" };
  assert.ok(X.anchorProblems("moh", [ctlAnchor, ...a.slice(1)]).some((p: string) => /control/.test(p)), "a control used as an anchor is caught");
  assert.ok(X.anchorProblems("moh", [{ ...a[0], example: "not in the rubric at all" }, ...a.slice(1)]).some((p: string) => /example/.test(p)), "an example that is not rubric text is caught");
});

test("ruling 2: every MOH batch prompt carries the same anchors first, in fixed order, with their reference scores", () => {
  const ids = anchors().map((x) => x.id);
  assert.equal(ids.length, 6, "six anchors to check (an empty list would pass every check below)");
  assert.match(S.renderScoringPrompt("moh", [facts.get(BATCH[0])!]), /CALIBRATION/, "the MOH prompt has a calibration block");
  const p1 =S.renderScoringPrompt("moh", BATCH.map((id) => facts.get(id)!));
  const p2 = S.renderScoringPrompt("moh", [...BATCH].reverse().map((id) => facts.get(id)!));
  for (const p of [p1, p2]) {
    const pos = ids.map((id) => p.indexOf(`"id":"${id}"`));
    assert.ok(pos.every((x) => x >= 0), "every anchor row is in the prompt");
    assert.deepEqual([...pos].sort((a, b) => a - b), pos, "anchors in the rubric's fixed order");
    const firstBatch = Math.min(...BATCH.map((id) => p.indexOf(`"id":"${id}"`)));
    assert.ok(Math.max(...pos) < firstBatch, "anchors come before the batch rows");
    for (const x of anchors()) assert.ok(p.includes(`${x.id}`) && p.includes(JSON.stringify(x.scores)), `${x.id} reference scores are shown`);
  }
  const head = (p: string) => p.slice(0, p.indexOf(`"id":"${BATCH[0]}"`) < p.indexOf(`"id":"${BATCH[1]}"`) ? p.indexOf(`"id":"${BATCH[0]}"`) : p.indexOf(`"id":"${BATCH[1]}"`));
  assert.equal(head(p1), head(p2), "the calibration part of the prompt is byte-identical whatever the batch order");
});

test("ruling 2: a batch may not contain an anchor row", () => {
  const a = anchors()[0].id;
  assert.throws(() => S.renderScoringPrompt("moh", [facts.get(a)!]), /anchor/);
});

test("ruling 2: ingest requires the anchors in the answer, keeps them out of the scores, and reports them", () => {
  const ids = anchors().map((x) => x.id);
  const rows = BATCH.map((id) => facts.get(id)!);
  // CORPUS-M5-PRERUN: anchors must now be answered near their reference (F4) and the drift sentinels must be
  // answered near their pilot fit (F1), so the fixture answers both that way; the batch rows stay at 0.5.
  const onFit = (id: string, fit: number) => {
    for (let v = 0; v <= 1.0001; v += 0.05) {
      const sc = { "moh-c-venue": +v.toFixed(2), "moh-c-audience": +v.toFixed(2), "moh-c-named": 1, "moh-c-not-before-10": 1 };
      if (Math.abs(S.combineFit("moh", sc, S.ruleScores("moh", facts.get(id)!)) - fit) < 0.026) return { id, scores: sc, reason: "moh-c-venue: a test row." };
    }
    throw new Error(`no scores give ${id} fit ${fit}`);
  };
  const tail = X.loadSentinels("moh").map((x: any) => onFit(x.id, x.pilot));
  const good = [...anchors().map((a) => ({ id: a.id, scores: a.scores, reason: "moh-c-venue: a test row." })), ...answerFor(BATCH), ...tail];
  assert.throws(() => S.ingestAnswer("moh", rows, [...answerFor(BATCH), ...tail], meta), /anchor/, "an answer without the anchors fails");
  const got = S.ingestAnswer("moh", rows, good, meta);
  assert.deepEqual(got.map((r) => r.id).sort(), [...BATCH].sort(), "anchors are not score rows");
  assert.equal(typeof X.anchorFits, "function", "score.ts exports anchorFits(site, answer)");
  const af = X.anchorFits("moh", answerFor([...ids, ...BATCH]));
  assert.deepEqual(af.map((x: any) => x.id), ids, "one fit per anchor, in rubric order");
  for (const x of af) assert.ok(typeof x.fit === "number" && typeof x.ref === "number" && x.band, `${x.id} carries fit, ref and band`);
});

test("BMHQ is unchanged: no anchors, no calibration block", () => {
  assert.equal((S.loadRubric("bestman").rubric as any).anchors, undefined);
  const p = S.renderScoringPrompt("bestman", [facts.get("tucson-az--activity--tucson-clay-pigeon-shooting-park")!]);
  assert.ok(!/CALIBRATION/.test(p));
});
