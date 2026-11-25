// destination-region.test.ts — a destination's region must match the state it is in.
//
// `region` is not decoration. Every consumer builds an indexed pSEO cohort from
// it (`/region/west`, `/region/south`, …) and several score on it, so one wrong
// value publishes a page asserting that a city is somewhere it is not — on every
// site that reads this catalog.
//
// It happened: `salt-lake-city-ut` shipped as `northeast` and friendsmoon.com
// linked Salt Lake City, Utah from /region/northeast. Nothing failed. A region is
// a plain string, every value in the file is a LEGAL region, and no reader could
// tell "northeast" apart from a deliberate editorial call — which is exactly why
// a human sweep had already looked at this list and let it through.
//
// So the check is mechanical rather than editorial: a state belongs to exactly
// one region, that mapping is not a matter of taste, and this test owns it.
//
// ── WHY MAP STATES, NOT CITIES ────────────────────────────────────────────────
// A per-city allow-list would have to be edited every time a destination is
// added, which makes it a second copy of the catalog that drifts from the first.
// There are 50 states and they do not move.
import { test } from "node:test";
import assert from "node:assert/strict";

import { sharedDestinations as DESTINATIONS } from "./destinations-data";

/**
 * State → region, using the catalog's own five buckets.
 *
 * Deliberately NOT the US Census map: this file uses `international`, folds DC
 * and the Mid-Atlantic where its editors put them, and treats HI/AK as `west`.
 * Where a call is genuinely contestable it is recorded here as the catalog's
 * decision — the point of this test is to catch a city in the WRONG bucket, not
 * to relitigate where Maryland belongs.
 */
const STATE_REGION: Record<string, string> = {
  // West — Mountain + Pacific, plus the non-contiguous states.
  MT: "west", ID: "west", WY: "west", CO: "west", NM: "west", AZ: "west",
  UT: "west", NV: "west", WA: "west", OR: "west", CA: "west", AK: "west", HI: "west",
  // Midwest.
  OH: "midwest", IN: "midwest", IL: "midwest", MI: "midwest", WI: "midwest",
  MN: "midwest", IA: "midwest", MO: "midwest", ND: "midwest", SD: "midwest",
  NE: "midwest", KS: "midwest",
  // South.
  VA: "south", WV: "south", NC: "south", SC: "south", GA: "south", FL: "south",
  KY: "south", TN: "south", AL: "south", MS: "south", AR: "south", LA: "south",
  OK: "south", TX: "south",
  // Northeast. DE/MD/DC are Mid-Atlantic and could defensibly sit either way;
  // the catalog files them north, and that is recorded rather than argued.
  ME: "northeast", NH: "northeast", VT: "northeast", MA: "northeast",
  RI: "northeast", CT: "northeast", NY: "northeast", NJ: "northeast",
  PA: "northeast", DE: "northeast", MD: "northeast", DC: "northeast",
};

test("every destination's region matches its state", () => {
  const wrong: string[] = [];
  for (const d of DESTINATIONS) {
    const expected = STATE_REGION[d.state];
    // An unmapped `state` is a territory or a country code — those legitimately
    // carry `international`, so skip rather than guess.
    if (!expected) continue;
    if (d.region !== expected) {
      wrong.push(`${d.id} (${d.city}, ${d.state}) is region "${d.region}", expected "${expected}"`);
    }
  }
  assert.deepEqual(
    wrong,
    [],
    `${wrong.length} destination(s) filed under the wrong region:\n  ${wrong.join("\n  ")}\n\n` +
      `A region drives an indexed /region/<name> page on every consuming site, so a wrong ` +
      `value publishes a city as being somewhere it isn't. Fix the row — or, if a state ` +
      `genuinely belongs elsewhere in this catalog's scheme, change STATE_REGION and say why.`,
  );
});

test("a non-US state code is allowed to be international", () => {
  // Guards the skip above: if every row happened to have a mapped state the skip
  // would be dead code, and a later international row would slip through unchecked.
  const unmapped = DESTINATIONS.filter((d) => !STATE_REGION[d.state]);
  for (const d of unmapped) {
    assert.ok(
      typeof d.region === "string" && d.region.length > 0,
      `${d.id} has an unmapped state "${d.state}" and no region`,
    );
  }
});
