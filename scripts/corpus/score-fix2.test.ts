// score-fix2.test.ts — CORPUS-M5-FIX2 (R1 FIX round 2): the before-10 rule and the MOH control swap.
// Written red-first against the v1.1 scorer (ff29cf9).
//   Ruling 1: the cigar bar is allowlisted by MOH's code, so it is no known-bad control; its
//             replacement is a row the rubric's existing low list already names.
//   Ruling 2: "nothing before 10 AM" is decided by rule where the row's fields say so
//             (dawn/sunrise/an early clock time, or a morning slot too long to start at 10),
//             and never fires on an evening row or on a row that also names a later time.
// New helpers are read off the module object so a missing export fails its own assertion.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifySuitability } from "./verify-suitability.ts";
import { factsRows } from "./facts.ts";
import * as S from "./score.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const X = S as any;
const facts = new Map(factsRows().map((r) => [r.id, r]));
const CHARTER = "nantucket-ma--activity--striped-bass-charter-out-of-madaket";
const CIGAR = "galena-il--activity--galena-cigars-whiskey-lounge";
const act = (over: Record<string, unknown>) => ({ name: "X", type: "tour", duration: "2 hr", highlight: "", ...over });

test("ruling 2: beforeTen fires where the fields say the thing only happens before 10 AM", () => {
  assert.equal(typeof X.beforeTen, "function", "score.ts exports beforeTen(raw)");
  assert.equal(X.beforeTen(act({ highlight: "Paddle out at dawn to the sandbar" })), true, "dawn");
  assert.equal(X.beforeTen(act({ highlight: "Sunrise hot-air balloon over the valley" })), true, "sunrise");
  assert.equal(X.beforeTen(act({ highlight: "Boats leave the dock at 5:30 am" })), true, "an early clock time");
  assert.equal(X.beforeTen(act({ highlight: "Departs 7am sharp" })), true, "7am, no space");
  assert.equal(X.beforeTen(act({ bestFor: "morning", duration: "5 hr", highlight: "Captain-run, back by lunch" })), true, "a 5 hr morning slot starts before 10");
  assert.equal(X.beforeTen(act({ duration: "4 hr", highlight: "Out on the flats and back by lunch" })), true, "back by lunch after 4 hr");
  assert.equal(X.beforeTen(raw(CHARTER)), true, "the striped-bass charter, from its real fields");
});

test("ruling 2: control — beforeTen does not fire on an evening row, a later time, or a short morning", () => {
  assert.equal(X.beforeTen(act({ bestFor: "evening", duration: "3 hr", highlight: "Sunset sail with champagne, back by 9" })), false, "evening sail");
  assert.equal(X.beforeTen(act({ highlight: "Doors at 7 pm, DJ till 2" })), false, "7 pm is not 7 am");
  assert.equal(X.beforeTen(act({ highlight: "Sunrise or sunset rides, your pick" })), false, "offered at a later time too");
  assert.equal(X.beforeTen(act({ bestFor: "morning", duration: "90 min", highlight: "Flow class on the deck" })), false, "a short morning class can start at 10");
  assert.equal(X.beforeTen(act({ bestFor: "afternoon", duration: "5 hr", highlight: "Captain-run charter" })), false, "afternoon charter");
  assert.equal(X.beforeTen({ name: "Sunrise Diner", highlight: "Pancakes all day", type: "diner" }), false, "a name is identity, not a time");
  // false positives seen in the first reach listing (fix2/rule-reach.txt), written red before the fix
  assert.equal(X.beforeTen(act({ highlight: "Speakeasy gem open until 4am" })), false, "a closing time is not a start");
  assert.equal(X.beforeTen(act({ bestFor: "Any group — do it at sunrise or after dark", duration: "3-4 hours" })), false, "sunrise is one option of two");
  assert.equal(X.beforeTen(act({ highlight: "Private sunrise or morning yoga on the beach", duration: "1.5 hours" })), false, "sunrise or morning");
  assert.equal(X.beforeTen(act({ bestFor: "Morning-after recovery", duration: "4-6 hours" })), false, "the morning after is not a morning slot");
  assert.equal(X.beforeTen(act({ bestFor: "morning", duration: "3 hr", highlight: "Guided brunch crawl" })), false, "a 3 hr morning slot can run 10 to 1");
  assert.equal(X.beforeTen(act({ highlight: "Early-morning balloon flight over the vineyards" })), true, "early morning");
  for (const id of ["new-york-ny--nightlife--employees-only", "nashville-tn--dining--biscuit-love-gulch", "sedona-az--lodging--red-rock-view-home-with-pool"])
    assert.equal(S.decide("moh", facts.get(id)!).by, "llm", `${id}: the rule is for activities, which are what the plan schedules`);
  // real evening rows in the catalog never fire
  const evening = factsRows().filter((r) => r.kind === "activity" && /^(evening|first night|winter evening|Classy evening activity)$/i.test(String(raw(r.id).bestFor ?? "")));
  assert.ok(evening.length >= 20, `found ${evening.length} evening rows`);
  const fired = evening.filter((r) => X.beforeTen(raw(r.id)));
  assert.deepEqual(fired.map((r) => r.id), [], "no evening row is before 10");
});

test("ruling 2: the rule has an id in the MOH rubric and decides the row by rule; BMHQ is unchanged", () => {
  const { rubric } = S.loadRubric("moh");
  assert.equal((rubric as any).window?.id, "moh-r-before-10");
  assert.ok(S.citableIds(rubric).has("moh-r-before-10"));
  const d = S.decide("moh", facts.get(CHARTER)!) as any;
  assert.equal(d.by, "cap");
  assert.equal(d.cap.id, "moh-r-before-10");
  const s = S.ruleScore("moh", facts.get(CHARTER)!, { runId: "t", scoredAt: "2026-09-25T12:00:00Z" });
  assert.ok(s.fit! <= (rubric as any).thresholds.low, `fit ${s.fit}`);
  assert.match(s.reason, /^moh-r-before-10: /);
  assert.equal((S.loadRubric("bestman").rubric as any).window, undefined, "BMHQ scoring is not changed (DRV)");
  assert.equal(S.decide("bestman", facts.get(CHARTER)!).by, "llm");
});

test("ruling 2: red — an llm score on a row the before-10 rule decides fails verify", () => {
  const { rubric, version } = S.loadRubric("moh");
  const scores = Object.fromEntries(rubric.criteria.map((c) => [c.id, 0.7]));
  const s = S.buildLlmScore("moh", facts.get(CHARTER)!, scores, "moh-c-venue: a boat day.", { model: "claude-sonnet-5", runId: "t", scoredAt: "2026-09-25T12:00:00Z" });
  const problems = verifySuitability({ scores: { moh: { rubricVersion: version, rows: [s] } }, skipDrift: true });
  assert.ok(problems.some((p) => p.includes(`${CHARTER}: cap moh-r-before-10 decides this row`)), problems.join("\n"));
});

test("ruling 1: the cigar bar is no MOH known-bad control, is scored as normal, and its replacement is on the rubric's low list", () => {
  const ctl = JSON.parse(readFileSync(resolve(ROOT, "rubrics/controls.json"), "utf8"));
  assert.ok(!ctl.moh.bad.includes(CIGAR) && !ctl.moh.heldOut.includes(CIGAR), "the cigar lounge is out of the controls");
  assert.equal(S.decide("moh", facts.get(CIGAR)!).by, "llm", "the cigar row is not capped");
  const added = ctl.moh.bad.filter((id: string) => !["burlington-vt--activity--ethan-allen-firing-range", "black-hills-sd--activity--deadwood-mountain-grand-poker-night", "cody-wy--activity--cody-firearms-experience-live-fire", CHARTER].includes(id));
  assert.equal(added.length, 1);
  assert.ok(ctl.moh.why?.[added[0]], "the replacement's reason is written down");
  const venue = S.loadRubric("moh").rubric.criteria.find((c) => c.id === "moh-c-venue")!.text;
  assert.match(venue, /sports bars score low/i);
  assert.equal(raw(added[0]).type, "sports-bar", "the replacement is a kind the existing low list names");
});

function raw(id: string): Record<string, any> {
  const v = S.scorerView(facts.get(id)!) as any;
  return v;
}
