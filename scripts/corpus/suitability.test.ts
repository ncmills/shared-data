// suitability.test.ts — CORPUS-M4: the rules evaluator, the verify gate (clean
// AND red for the right reason), and G-moh-golf as a standing assertion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { matches, gitBlobSha, stripQuotedSpans, buildSuitability, SITES } from "./suitability.ts";
import { verifySuitability } from "./verify-suitability.ts";
import { factsRows, type FactsRow } from "./facts.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const row = (facets: Record<string, string[]>, name = "", highlight = ""): FactsRow => ({
  id: "x",
  kind: (facets.kind?.[0] ?? "activity") as FactsRow["kind"],
  facets,
  text: { name, highlight },
  legacy: {},
});

test("matches: in / not_in / any / all", () => {
  const golf = row({ kind: ["activity"], "activity.type": ["golf"] });
  assert.equal(matches({ facet: "activity.type", in: ["golf"] }, golf), true);
  assert.equal(matches({ facet: "activity.type", not_in: ["golf", "spa"] }, golf), false);
  assert.equal(matches({ facet: "activity.type", not_in: ["spa"] }, golf), true);
  // an allowlist cannot fail a row that lacks the facet (a dining row has no activity.type)
  assert.equal(matches({ facet: "activity.type", not_in: ["spa"] }, row({ kind: ["dining"] })), false);
  assert.equal(matches({ any: [{ facet: "kind", in: ["golf-course"] }, { facet: "activity.type", in: ["golf"] }] }, golf), true);
  assert.equal(matches({ all: [{ facet: "kind", in: ["dining"] }, { facet: "activity.type", in: ["golf"] }] }, golf), false);
});

test("matches: lexicon on name vs name+highlight, and quoted spans are not the row's voice", () => {
  const r = row({ kind: ["nightlife"] }, "The Lounge", 'Rangers say "no groups over 12" at the overlook');
  const onName = { lexicon: "lexicon.em-row-register", field: "name" as const, terms: [String.raw`\bgroups?\b(?!\s+(area|campground|site|shelter|use\s+area))`] };
  assert.equal(matches(onName, r), false);
  assert.equal(matches({ ...onName, field: "name+highlight" }, r), true);
  assert.equal(matches({ ...onName, field: "name+highlight", strip_quoted: true }, r), false);
  assert.equal(stripQuotedSpans('a "b c" d'), "a   d");
});

test("gitBlobSha equals git hash-object", () => {
  assert.equal(gitBlobSha("hello\n"), "ce013625030ba8dba906f756967f9e9ca394464a");
});

test("verify is clean on the committed vocab, profiles and suitability files", () => {
  assert.deepEqual(verifySuitability(), []);
});

test("sabotage: a rule matching on a term that is not in vocab v1 goes red, naming the term", () => {
  const text = readFileSync(resolve(ROOT, "profiles/moh.yaml"), "utf8");
  const planted = text.replace('{facet: "activity.type", in: ["golf"]}', '{facet: "activity.type", in: ["golf", "golff"]}');
  assert.notEqual(planted, text, "the plant must land");
  const problems = verifySuitability({ profileText: { moh: planted }, skipDrift: true });
  assert.ok(problems.some((x) => /term "golff" is not in vocab v1 facet activity\.type/.test(x)), problems.join("\n"));
});

test("sabotage: a suitability row with an unknown id goes red, naming the id", () => {
  const text = readFileSync(resolve(ROOT, "suitability/handicap.json"), "utf8");
  const planted = text.replace('  "rows": [\n', '  "rows": [\n    {"id":"nowhere-xx--dining--ghost","eligible":"unreviewed"},\n');
  assert.notEqual(planted, text);
  const problems = verifySuitability({ suitabilityText: { handicap: planted }, skipDrift: true });
  assert.deepEqual(problems, ['suitability/handicap.json: unknown id "nowhere-xx--dining--ghost" (not a facts id)']);
});

test("red: a row that says yes, cites a rule that does not exist, or drops a facts id", () => {
  const s = JSON.parse(readFileSync(resolve(ROOT, "suitability/moh.json"), "utf8"));
  s.rows[0] = { ...s.rows[0], eligible: "yes" };
  const i = s.rows.findIndex((r: any) => r.eligible === "no");
  s.rows[i] = { ...s.rows[i], reason: "moh-made-up" };
  s.rows.pop();
  const problems = verifySuitability({ suitabilityText: { moh: JSON.stringify(s) }, skipDrift: true });
  assert.ok(problems.some((x) => /eligible="yes"/.test(x)));
  assert.ok(problems.some((x) => /reason "moh-made-up" is not a rule id/.test(x)));
  assert.ok(problems.some((x) => /1 facts ids have no row/.test(x)));
});

test("G-moh-golf: every golf row is ineligible for Maid of Honor HQ", () => {
  const s = buildSuitability("moh");
  const byId = new Map(s.rows.map((r) => [r.id, r]));
  const golf = factsRows().filter((r) => r.kind === "golf-course" || r.facets["activity.type"]?.includes("golf"));
  assert.ok(golf.length > 1000, "the control set must be non-trivial");
  assert.deepEqual(golf.filter((r) => byId.get(r.id)?.eligible !== "no").map((r) => r.id), []);
});

test("nothing writes yes; a fit appears only on a scored row, and only on a site with a rubric", () => {
  for (const site of SITES) {
    const s = buildSuitability(site);
    assert.equal(s.rows.length, factsRows().length);
    const scoredSite = site === "moh" || site === "bestman";
    assert.ok(s.rows.every((r) => r.eligible === "no" || r.eligible === "unreviewed" || (scoredSite && r.eligible === "scored")));
    assert.ok(s.rows.every((r) => ("fit" in r) === (r.eligible === "scored")));
  }
});
