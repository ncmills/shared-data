// score.test.ts — CORPUS-M5: the three brief-mandated guards on scores (each red
// for the right reason on a planted fault), the golf cap, and the scorer's view.
// Rubric v1.1 (FIX round 1): utility class, deterministic rules, the combine rule,
// conditionals off, and the scoped row set. The F2/F3/F5/F7 guards are in score-v11.test.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifySuitability } from "./verify-suitability.ts";
import { factsRows } from "./facts.ts";
import {
  loadRubric, capFor, isMohGolfText, bannedInReason, scorerView, buildLlmScore, ruleScore, ruleScores, combineFit, renderScoringPrompt, decide,
  type ScoreRow,
} from "./score.ts";
import { scopeIds } from "./scope.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const suit = (site: string) => JSON.parse(readFileSync(resolve(ROOT, `suitability/${site}.json`), "utf8"));
const facts = new Map(factsRows().map((r) => [r.id, r]));
const meta = { model: "claude-sonnet-5", runId: "test-run", scoredAt: "2026-09-25T12:00:00Z" };
const allAt = (site: string, v: number) => Object.fromEntries(loadRubric(site).rubric.criteria.map((c) => [c.id, v]));
/** a v1.1 llm score (every judged criterion at 0.7), then fit/fields overridden */
const llm = (site: string, id: string, fit: number, reason: string): ScoreRow => ({ ...buildLlmScore(site, facts.get(id)!, allAt(site, 0.7), reason, meta), fit });
const firstUnreviewed = (site: string, pred: (id: string) => boolean = () => true) =>
  suit(site).rows.find((r: any) => r.eligible !== "no" && pred(r.id)).id as string;
const graded = (id: string) => { const f = facts.get(id)!; return f.kind !== "transport" && f.kind !== "golf-course" && !isMohGolfText(f); };

test("a clean planted score passes verify (control for the red tests below)", () => {
  const id = firstUnreviewed("bestman", graded);
  const row = buildLlmScore("bestman", facts.get(id)!, allAt("bestman", 0.7), "bestman-c-named: a named steakhouse that takes a group.", meta);
  const problems = verifySuitability({ scores: { bestman: { rubricVersion: loadRubric("bestman").version, rows: [row] } }, skipDrift: true });
  assert.deepEqual(problems, []);
});

test("red: a score on a row a hard exclude marks no", () => {
  const noId = suit("moh").rows.find((r: any) => r.eligible === "no" && r.reason === "moh-intl").id;
  const problems = verifySuitability({ scores: { moh: { rubricVersion: loadRubric("moh").version, rows: [{ ...llm("moh", firstUnreviewed("moh", graded), 0.4, "moh-c-venue: fine."), id: noId }] } }, skipDrift: true });
  assert.ok(problems.some((x) => x.includes(`${noId} is scored but a hard exclude marks it "no"`)), problems.join("\n"));
});

test("red: a MOH golf-coded row with fit above 0 — even when the rubric cap is gone", () => {
  const golfId = firstUnreviewed("moh", (id) => isMohGolfText(facts.get(id)!));
  assert.ok(golfId, "the data must hold an unreviewed golf-coded MOH row (resorts with golf, Topgolf, golf carts)");
  const problems = verifySuitability({ scores: { moh: { rubricVersion: loadRubric("moh").version, rows: [{ ...llm("moh", firstUnreviewed("moh", graded), 0.05, "moh-c-venue: a lake resort."), id: golfId }] } }, skipDrift: true });
  assert.ok(problems.some((x) => x.includes(`${golfId}: a golf-capped row has fit 0.05`)), problems.join("\n"));
});

test("red: a reason that uses a banned word of that site's BRAND.md", () => {
  const m = firstUnreviewed("moh", graded);
  const b = firstUnreviewed("bestman", graded);
  const problems = verifySuitability({
    scores: {
      moh: { rubricVersion: loadRubric("moh").version, rows: [llm("moh", m, 0.8, "moh-c-audience: fits the whole squad.")] },
      bestman: { rubricVersion: loadRubric("bestman").version, rows: [llm("bestman", b, 0.9, "bestman-c-venue: a legend of a steakhouse.")] },
    },
    skipDrift: true,
  });
  assert.ok(problems.some((x) => x.includes(`${m}: reason uses a banned word (\\bsquads?\\b)`)), problems.join("\n"));
  assert.ok(problems.some((x) => x.includes(`${b}: reason uses a banned word (\\blegends?\\b)`)), problems.join("\n"));
  assert.ok(bannedInReason("moh", "pitched at bachelor crews").length, "plural crews is the same ban");
  // brands never cross: MOH's words are not BMHQ's bans and vice versa
  assert.deepEqual(bannedInReason("bestman", "a crew of groomsmen"), []);
  assert.deepEqual(bannedInReason("moh", "her bridal party"), []);
});

test("red: a score under an older rubric version, and a fit outside [0,1]", () => {
  const id = firstUnreviewed("bestman", graded);
  const base = llm("bestman", id, 1.2, "bestman-c-venue: named river guide.");
  const stale: ScoreRow = { ...base, provenance: { ...base.provenance, promptOrRulesVersion: "rubric-bestman@0.9.0+000000000000" } };
  const problems = verifySuitability({ scores: { bestman: { rubricVersion: "x", rows: [stale] } }, skipDrift: true });
  assert.ok(problems.some((x) => /fit 1\.2 is not in \[0,1\]/.test(x)));
  assert.ok(problems.some((x) => /stale — rescore/.test(x)));
});

test("the MOH golf cap catches golf in the name or highlight, and not 'gulf'", () => {
  const { rubric } = loadRubric("moh");
  const r = (name: string, highlight = "") => ({ text: { name, highlight } });
  assert.equal(capFor(rubric, r("Topgolf Birmingham"))?.id, "moh-cap-golf");
  assert.equal(capFor(rubric, r("Lodge", "Lake views + golf + spa onsite"))?.id, "moh-cap-golf");
  assert.equal(capFor(rubric, r("Urban Putt", "Indoor mini golf in the Mission"))?.id, "moh-cap-golf");
  assert.equal(capFor(rubric, r("Gulf Shores Beach House", "Gulf-front pool")), undefined);
  assert.equal(capFor(loadRubric("bestman").rubric, r("TPC Scottsdale")), undefined, "BMHQ has no golf cap");
  assert.equal(capFor(loadRubric("bestman").rubric, r("Bling", "Strip clubs zone on Calle Uruguay"))?.id, "bestman-cap-strip-club");
  assert.equal(capFor(loadRubric("bestman").rubric, r("Strip House", "Steakhouse on the Strip")), undefined, "a steakhouse on the Strip is not a strip club");
});

test("the scorer never sees the legacy routing tags", () => {
  for (const id of ["nashville-tn--nightlife--white-limozeen", factsRows().find((r) => r.kind === "golf-course")!.id]) {
    const v = scorerView(facts.get(id)!);
    for (const k of ["brands", "wizards", "audiences", "products", "sites", "url", "citations"]) assert.ok(!(k in v), `${id} shows ${k}`);
    assert.ok(v.name && v.place);
  }
});

test("every rubric citation's quote is on the cited profile line", () => {
  // verify reports a bad cite as 'quote not found'; the committed rubrics must be clean
  assert.deepEqual(verifySuitability().filter((x) => x.startsWith("rubrics/")), []);
  const planted = verifySuitability({ skipDrift: true, profileText: { moh: readFileSync(resolve(ROOT, "profiles/moh.yaml"), "utf8").replace("never sparkly filler", "never filler") } });
  assert.ok(planted.some((x) => /rubrics\/moh\.yaml moh-c-venue: quote not found on profiles\/moh\.yaml:12/.test(x)), planted.join("\n"));
});

// ── rubric v1.1: utility, rules, combine, conditionals, scope ───────────────

test("utility: a transport row is class utility by rule with no fit; a fit on it is red", () => {
  const id = firstUnreviewed("moh", (x) => facts.get(x)!.kind === "transport" && !isMohGolfText(facts.get(x)!));
  const u = ruleScore("moh", facts.get(id)!, meta);
  assert.equal(u.class, "utility");
  assert.ok(!("fit" in u));
  assert.deepEqual(verifySuitability({ scores: { moh: { rubricVersion: loadRubric("moh").version, rows: [u] } }, skipDrift: true }), []);
  const graded = { ...u, fit: 0.2 } as ScoreRow;
  const p = verifySuitability({ scores: { moh: { rubricVersion: loadRubric("moh").version, rows: [graded] } }, skipDrift: true });
  assert.ok(p.some((x) => x.includes(`${id}: a utility row carries a fit`)), p.join("\n"));
  // a golf-cart rental is transport AND golf-coded: the golf cap wins, fit 0
  const cart = firstUnreviewed("moh", (x) => facts.get(x)!.kind === "transport" && isMohGolfText(facts.get(x)!));
  assert.equal(decide("moh", facts.get(cart)!).by, "cap");
});

test("rules: group size and rental house are read off the fields", () => {
  const find = (site: string, pred: (r: any) => boolean) => [...facts.values()].find(pred)!;
  const house = find("moh", (r) => r.kind === "lodging" && r.facets["lodging.type"][0] === "house");
  const hotel = find("moh", (r) => r.kind === "lodging" && r.facets["lodging.type"][0] === "hotel" && !["las-vegas-nv", "miami-fl"].includes(r.destId));
  const vegas = find("moh", (r) => r.kind === "lodging" && r.destId === "las-vegas-nv" && r.facets["lodging.type"][0] !== "house" && r.facets["lodging.type"][0] !== "airbnb");
  assert.equal(ruleScores("moh", house)["moh-r-rental-house"], 1);
  assert.equal(ruleScores("moh", hotel)["moh-r-rental-house"], 0.4);
  assert.equal(ruleScores("moh", vegas)["moh-r-rental-house"], 0.9, "the Vegas exception");
  assert.ok(!("bestman-r-rental-house" in ruleScores("bestman", house)), "BMHQ has no rental-house rule");
  const bar = find("moh", (r) => r.kind === "nightlife");
  assert.ok("moh-r-group" in ruleScores("moh", bar));
  assert.ok(!("moh-r-rental-house" in ruleScores("moh", bar)), "rental-house applies to lodging only");
});

test("combine: a wrong-kind venue stays low however practical it is; a right one is lifted by practice", () => {
  const { rubric } = loadRubric("moh");
  const s = (kind: number, practical: number) => Object.fromEntries(rubric.criteria.map((c) => [c.id, c.part === "kind" ? kind : practical]));
  assert.ok(combineFit("moh", s(0.1, 1), { "moh-r-group": 1 }) <= 0.1);
  assert.equal(combineFit("moh", s(1, 1), { "moh-r-group": 1 }), 1);
  assert.equal(combineFit("moh", s(1, 0), { "moh-r-group": 0 }), 0.5, "practice can halve a score, never more");
  // verify recomputes fit from the scores: a hand-edited fit is red
  const id = firstUnreviewed("moh", graded);
  const row = { ...buildLlmScore("moh", facts.get(id)!, allAt("moh", 0.9), "moh-c-venue: a named brunch room.", meta) };
  const p = verifySuitability({ scores: { moh: { rubricVersion: loadRubric("moh").version, rows: [{ ...row, fit: 0.1 }] } }, skipDrift: true });
  assert.ok(p.some((x) => x.includes(`${id}: fit 0.1 ≠`)), p.join("\n"));
});

test("conditionals are off: never in the prompt, never citable", () => {
  const prompt = renderScoringPrompt("bestman", [facts.get(firstUnreviewed("bestman", graded))!]);
  for (const k of loadRubric("bestman").rubric.conditional) assert.ok(!prompt.includes(k.id), `${k.id} is in the prompt`);
  assert.ok(!/tilt to steakhouses|cigar lounges score up/i.test(prompt));
  const id = firstUnreviewed("bestman", graded);
  const p = verifySuitability({ scores: { bestman: { rubricVersion: loadRubric("bestman").version, rows: [llm("bestman", id, 0.7, "bestman-c-venue: a steakhouse (bestman-k-mixed-gen).")] } }, skipDrift: true });
  assert.ok(p.some((x) => x.includes(`${id}: reason cites "bestman-k-mixed-gen", which is not a rubric id`)), p.join("\n"));
});

test("scope: rows the rules leave for scoring that the site's tag hides today; never courses, never 'no'", () => {
  for (const site of ["moh", "bestman"]) {
    const ids = scopeIds(site);
    const s = new Map(suit(site).rows.map((r: any) => [r.id, r]));
    assert.ok(ids.length > 500, `${site} scope ${ids.length}`);
    for (const id of ids) {
      const f = facts.get(id)!;
      assert.notEqual((s.get(id) as any).eligible, "no");
      assert.notEqual(f.kind, "golf-course");
      assert.ok(!(f.legacy.wizards ?? []).includes(site), `${id} is shown today`);
    }
  }
  // control: a row the site shows today is out of scope
  const shown = suit("moh").rows.find((r: any) => r.eligible !== "no" && facts.get(r.id)!.legacy.wizards?.includes("moh")).id;
  assert.ok(!scopeIds("moh").includes(shown));
});
