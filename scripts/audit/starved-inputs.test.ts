// starved-inputs.test.ts — audit check #3: starved-input enumeration.
//
// The TEETH tests build a tiny synthetic `StarvedUniverse` (no real data
// files touched) that is missing ALL `international`-region party
// destinations, and prove: (a) every moh/bestman × international × <vibe>
// cell reports starved, and (b) a well-populated cell (south × chill, with
// 3 eligible destinations) does NOT report. The CROSS-CHECK tests then run
// the checker against the REAL universe and confirm its output lands on the
// same thin spots `scripts/scan-gaps.ts` already ranks (International golf
// region + budget tier; palace/castle/links residence settings) — this is
// the "does your counting agree with the known gaps" sanity gate the task
// brief calls for.
import { test } from "node:test";
import assert from "node:assert/strict";

import { findStarved, findStarvedIn, type Starved, type StarvedUniverse } from "./starved-inputs";
import { WIZARD_INPUT_SPACE } from "../../src/wizard-input-space";
import type { BackfilledRow } from "../backfill-tags";
import type { CanonicalDestination, CanonicalRegion, PartyVibe } from "../../src/destinations-types";
import type { WizardTag, AudienceTag } from "../../src/tags";

function fakeDestination(o: { id: string; region: CanonicalRegion; vibes: PartyVibe[] }): CanonicalDestination {
  return {
    id: o.id,
    city: o.id,
    state: "XX",
    region: o.region,
    nearestAirport: { code: "XXX", name: "Test Airport", driveMinutes: 10 },
    bestMonths: [1],
    vibes: o.vibes,
    score: 5,
    nightlife: [],
    dining: [],
    activities: [],
    lodging: [],
    transport: [],
    presentation: {
      moh: { tagline: "t", description: "d" },
      bestman: { tagline: "t", description: "d" },
    },
  };
}

function fakePartyRow(destId: string, wizards: WizardTag[]): BackfilledRow {
  return {
    id: `${destId}|activities|Test Activity`,
    dataset: "party",
    kind: "party-venue",
    preWizards: wizards,
    coreWizards: wizards,
    postWizards: wizards,
    audiences: ["corporate", "clients"] as AudienceTag[],
    products: [],
    expand: [],
  };
}

/**
 * 4 destinations, all region "south" (3 tagged "chill" — a well-populated
 * cell at threshold 3) and ZERO destinations anywhere tagged "international"
 * — simulating "a universe missing all international party rows." Golf and
 * residences are left empty; every one of their cells will show up as
 * starved too, but nothing here asserts against them.
 */
function buildUniverse(): StarvedUniverse {
  const destinations: CanonicalDestination[] = [
    fakeDestination({ id: "south-1", region: "south", vibes: ["chill", "balanced"] }),
    fakeDestination({ id: "south-2", region: "south", vibes: ["chill"] }),
    fakeDestination({ id: "south-3", region: "south", vibes: ["chill", "unhinged"] }),
    fakeDestination({ id: "south-4", region: "south", vibes: ["balanced"] }),
  ];
  const rows: BackfilledRow[] = destinations.map((d) => fakePartyRow(d.id, ["bestman", "moh"]));

  return { rows, destinations, golfCourses: [], residences: [] };
}

test("TEETH: universe missing international party rows reports moh × international × * as starved", () => {
  const result = findStarvedIn(buildUniverse(), 3);

  const mohIntl = result.filter((r) => r.wizard === "moh" && r.cell.region === "international");
  assert.equal(mohIntl.length, 3, "expected one starved cell per partyVibe (chill/balanced/unhinged)");
  for (const r of mohIntl) assert.equal(r.count, 0);
});

test("TEETH: universe missing international party rows reports bestman × international × * as starved", () => {
  const result = findStarvedIn(buildUniverse(), 3);

  const bestmanIntl = result.filter((r) => r.wizard === "bestman" && r.cell.region === "international");
  assert.equal(bestmanIntl.length, 3);
  for (const r of bestmanIntl) assert.equal(r.count, 0);
});

test("TEETH: a well-populated cell (south × chill for moh) is NOT reported as starved", () => {
  const result = findStarvedIn(buildUniverse(), 3);

  const hit = result.find((r) => r.wizard === "moh" && r.cell.region === "south" && r.cell.partyVibe === "chill");
  assert.equal(hit, undefined, "south×chill has 3 eligible destinations (south-1/2/3) — should clear threshold 3");
});

test("SYNTHETIC: a moh cell's keys match its WIZARD_INPUT_SPACE axis names", () => {
  const result = findStarvedIn(buildUniverse(), 3);
  const moh = result.find((r) => r.wizard === "moh");
  assert.ok(moh, "expected at least one starved moh cell (international)");
  assert.deepEqual(Object.keys(moh!.cell).sort(), ["partyVibe", "region"]);
});

test("WIZARD_INPUT_SPACE is keyed by every WizardTag", () => {
  const wizards = Object.keys(WIZARD_INPUT_SPACE).sort();
  assert.deepEqual(wizards, ["bestman", "handicap", "moh", "offsite-outing", "offsite-retreat", "tdf"]);
  for (const wizard of wizards as WizardTag[]) {
    assert.equal(WIZARD_INPUT_SPACE[wizard].length, 2, `${wizard} should have exactly 2 axes`);
  }
});

test("FULL RUN: the canonical real universe reports the starved-input count", () => {
  const starved: Starved[] = findStarved(3);
  assert.ok(Array.isArray(starved));
  for (const s of starved) {
    assert.ok(s.wizard);
    assert.ok(s.cell);
    assert.ok(s.count < 3);
  }
});

test("CROSS-CHECK: real universe surfaces the known-thin golf cell (International × budget) for handicap + tdf", () => {
  // scan-gaps.ts ranks International as the thinnest tdf/golf region and
  // budget as the rarest tier globally (50/994 courses). The real
  // SHARED_GOLF_COURSES has ZERO International×budget courses — this must
  // surface as starved for both handicap and tdf (identical ENGINE_READS,
  // see src/engine-reads.ts).
  const starved = findStarved(3);
  const handicapHit = starved.find(
    (s) => s.wizard === "handicap" && s.cell.golfRegion === "International" && s.cell.tier === "budget",
  );
  const tdfHit = starved.find(
    (s) => s.wizard === "tdf" && s.cell.golfRegion === "International" && s.cell.tier === "budget",
  );
  assert.ok(handicapHit, "expected International×budget to be starved for handicap");
  assert.ok(tdfHit, "expected International×budget to be starved for tdf");
  assert.equal(handicapHit!.count, 0);
});

test("CROSS-CHECK: real universe surfaces palace/castle/links residence settings as starved somewhere", () => {
  // scan-gaps.ts flags palace(14)/castle(15)/links(15) as the thinnest
  // residence settings — each total is smaller than the 7-bucket worldRegion
  // axis, so at least one setting×worldRegion cell per setting must be
  // starved.
  const starved = findStarved(3);
  for (const setting of ["palace", "castle", "links"]) {
    const hit = starved.find((s) => s.wizard === "offsite-retreat" && s.cell.setting === setting);
    assert.ok(hit, `expected at least one starved offsite-retreat cell for setting=${setting}`);
  }
});

test("CROSS-CHECK: bestman/moh party region×vibe cells are NOT starved at threshold 3 (destination-count granularity)", () => {
  // scan-gaps.ts's OWN thin-region flag (threshold 6) never fires for party
  // regions either (thinnest is international at 21-22 cities) — at the
  // destination-count granularity this check uses for bestman/moh (per the
  // task design: "Count = destinations ... tagged for the wizard whose
  // vibes include that vibe"), even the thinnest region×vibe combo clears
  // threshold 3 comfortably. Zero starved party cells is the CORRECT,
  // expected result here, not a sign the checker under-counts — the finer-
  // grained golf/residence checks above are where real starvation shows up.
  const starved = findStarved(3);
  const partyHits = starved.filter((s) => s.wizard === "bestman" || s.wizard === "moh");
  assert.deepEqual(partyHits, []);
});
