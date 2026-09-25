// score.test.ts — CORPUS-M5: the three brief-mandated guards on scores (each red
// for the right reason on a planted fault), the golf cap, and the scorer's view.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifySuitability } from "./verify-suitability.ts";
import { factsRows } from "./facts.ts";
import { loadRubric, capFor, isMohGolfText, bannedInReason, scorerView, type ScoreRow } from "./score.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const suit = (site: string) => JSON.parse(readFileSync(resolve(ROOT, `suitability/${site}.json`), "utf8"));
const facts = new Map(factsRows().map((r) => [r.id, r]));
const llm = (site: string, id: string, fit: number, reason: string): ScoreRow => ({
  id, fit, reason, provenance: { tagger: "llm", model: "claude-sonnet-5", promptOrRulesVersion: loadRubric(site).version },
});
const firstUnreviewed = (site: string, pred: (id: string) => boolean = () => true) =>
  suit(site).rows.find((r: any) => r.eligible === "unreviewed" && pred(r.id)).id as string;

test("a clean planted score passes verify (control for the red tests below)", () => {
  const id = firstUnreviewed("bestman");
  const problems = verifySuitability({ scores: { bestman: { rubricVersion: loadRubric("bestman").version, rows: [llm("bestman", id, 0.7, "bestman-c-named: a named steakhouse that takes a group.")] } }, skipDrift: true });
  assert.deepEqual(problems, []);
});

test("red: a score on a row a hard exclude marks no", () => {
  const noId = suit("moh").rows.find((r: any) => r.eligible === "no" && r.reason === "moh-intl").id;
  const problems = verifySuitability({ scores: { moh: { rubricVersion: loadRubric("moh").version, rows: [llm("moh", noId, 0.4, "moh-c-voice: fine.")] } }, skipDrift: true });
  assert.ok(problems.some((x) => x.includes(`${noId} is scored but a hard exclude marks it "no"`)), problems.join("\n"));
});

test("red: a MOH golf-coded row with fit above 0 — even when the rubric cap is gone", () => {
  const golfId = firstUnreviewed("moh", (id) => isMohGolfText(facts.get(id)!));
  assert.ok(golfId, "the data must hold an unreviewed golf-coded MOH row (resorts with golf, Topgolf, golf carts)");
  const problems = verifySuitability({ scores: { moh: { rubricVersion: loadRubric("moh").version, rows: [llm("moh", golfId, 0.05, "moh-c-voice: a lake resort.")] } }, skipDrift: true });
  assert.ok(problems.some((x) => x.includes(`${golfId}: a golf-capped row has fit 0.05`)), problems.join("\n"));
});

test("red: a reason that uses a banned word of that site's BRAND.md", () => {
  const m = firstUnreviewed("moh", (id) => !isMohGolfText(facts.get(id)!));
  const b = firstUnreviewed("bestman");
  const problems = verifySuitability({
    scores: {
      moh: { rubricVersion: loadRubric("moh").version, rows: [llm("moh", m, 0.8, "moh-c-group: fits the whole squad.")] },
      bestman: { rubricVersion: loadRubric("bestman").version, rows: [llm("bestman", b, 0.9, "bestman-c-voice: a legend of a steakhouse.")] },
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
  const id = firstUnreviewed("bestman");
  const stale: ScoreRow = { ...llm("bestman", id, 1.2, "bestman-c-voice: named river guide."), provenance: { tagger: "llm", model: "claude-sonnet-5", promptOrRulesVersion: "rubric-bestman@0.9.0+000000000000" } };
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
  assert.ok(planted.some((x) => /rubrics\/moh\.yaml moh-c-voice: quote not found on profiles\/moh\.yaml:12/.test(x)), planted.join("\n"));
});
