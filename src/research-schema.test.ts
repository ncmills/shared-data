// research-schema.test.ts — Task 14: the honesty firewall.
//
// validateResearchedRow is the gate that keeps FABRICATED rows out of the
// dataset. Every researched row MUST carry a real primary sourceUrl and ≥1
// citation, plus the required canonical fields for its dataset. These tests
// pin the reject/accept boundary. No network — pure validation.
import { test } from "node:test";
import assert from "node:assert/strict";

import { validateResearchedRow } from "./research-schema";
import type { ResearchedRow } from "./research-schema";

/** A complete, real-shaped golf row (fields mirror SharedGolfCourse). */
const GOOD_GOLF: ResearchedRow = {
  dataset: "golf",
  name: "Cabot Cape Breton (Cabot Cliffs)",
  city: "Inverness",
  state: "NS",
  region: "International",
  tier: "budget",
  greenFeeRange: [100, 175],
  style: "links",
  walkable: true,
  driveMinutes: 30,
  highlight: "Coore & Crenshaw clifftop links over the Gulf of St. Lawrence.",
  sites: ["tdf", "handicap"],
  products: ["golf-trip"],
  sourceUrl: "https://www.cabotcapebreton.com/golf/cabot-cliffs/",
  citations: ["https://www.cabotcapebreton.com/golf/cabot-cliffs/"],
};

/** A complete, real-shaped residence row (fields mirror SharedResidence).
 *  Includes real (non-zero) `capacity`/`price` — display-critical fields
 *  Offsite Outpost renders straight into live page copy with no zero-guard,
 *  so they're hard-required alongside the identity fields. */
const GOOD_RESIDENCE: ResearchedRow = {
  dataset: "residence",
  id: "some-alpine-lodge",
  name: "Some Alpine Lodge",
  setting: "alpine",
  region: "Chamonix, France",
  country: "France",
  sites: ["offsite"],
  products: ["retreat"],
  capacity: { min: 20, max: 80, sleepsOnsite: 80 },
  price: { perPersonPerNight: { low: 400, high: 900 } },
  sourceUrl: "https://www.example-lodge.fr/",
  citations: ["https://www.example-lodge.fr/about"],
};

test("ACCEPTS a complete, real-shaped golf row", () => {
  const res = validateResearchedRow(GOOD_GOLF);
  assert.equal(res.ok, true);
  if (res.ok) assert.equal(res.row.name, GOOD_GOLF.name);
});

test("ACCEPTS a complete, real-shaped residence row", () => {
  const res = validateResearchedRow(GOOD_RESIDENCE);
  assert.equal(res.ok, true);
});

test("REJECTS a row with no sourceUrl", () => {
  const { sourceUrl, ...rest } = GOOD_GOLF;
  const res = validateResearchedRow(rest);
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /sourceUrl/i.test(r)));
});

test("REJECTS a row with an empty sourceUrl", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, sourceUrl: "   " });
  assert.equal(res.ok, false);
});

test("REJECTS a row with a non-http sourceUrl", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, sourceUrl: "ftp://foo.bar/x" });
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /http/i.test(r)));
});

test("REJECTS a row with empty citations", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, citations: [] });
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /citation/i.test(r)));
});

test("REJECTS a row whose only citation is blank", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, citations: ["  "] });
  assert.equal(res.ok, false);
});

test("REJECTS a golf row missing a required field (name)", () => {
  const { name, ...rest } = GOOD_GOLF;
  const res = validateResearchedRow(rest);
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /name/i.test(r)));
});

test("REJECTS a golf row with a blank required field (region)", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, region: "" });
  assert.equal(res.ok, false);
});

test("REJECTS a residence row missing a required field (setting)", () => {
  const { setting, ...rest } = GOOD_RESIDENCE;
  const res = validateResearchedRow(rest);
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /setting/i.test(r)));
});

test("REJECTS a residence row missing capacity entirely", () => {
  const { capacity, ...rest } = GOOD_RESIDENCE as unknown as Record<string, unknown>;
  const res = validateResearchedRow(rest);
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /capacity/i.test(r)));
});

test("REJECTS a residence row with a zeroed capacity (the old UI-default shape)", () => {
  const res = validateResearchedRow({
    ...GOOD_RESIDENCE,
    capacity: { min: 0, max: 0, sleepsOnsite: 0 },
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /capacity/i.test(r)));
});

test("REJECTS a residence row with only a partial capacity (min present, max missing)", () => {
  const res = validateResearchedRow({ ...GOOD_RESIDENCE, capacity: { min: 20 } });
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /capacity/i.test(r)));
});

test("REJECTS a residence row missing price entirely", () => {
  const { price, ...rest } = GOOD_RESIDENCE as unknown as Record<string, unknown>;
  const res = validateResearchedRow(rest);
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /price/i.test(r)));
});

test("REJECTS a residence row with a zeroed price (the old UI-default shape)", () => {
  const res = validateResearchedRow({
    ...GOOD_RESIDENCE,
    price: { perPersonPerNight: { low: 0, high: 0 } },
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /price/i.test(r)));
});

test("golf rows are UNAFFECTED by the residence-only capacity/price requirement", () => {
  // GOOD_GOLF carries neither field — must still pass.
  const res = validateResearchedRow(GOOD_GOLF);
  assert.equal(res.ok, true);
});

test("REJECTS a placeholder sourceUrl (example.com)", () => {
  const res = validateResearchedRow({
    ...GOOD_GOLF,
    sourceUrl: "https://example.com/course",
    citations: ["https://example.com/course"],
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /placeholder/i.test(r)));
});

test("REJECTS a placeholder name (TBD)", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, name: "TBD" });
  assert.equal(res.ok, false);
});

test("REJECTS a name equal to its region", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, name: "International" });
  assert.equal(res.ok, false);
});

test("REJECTS an unknown dataset", () => {
  const res = validateResearchedRow({ ...GOOD_GOLF, dataset: "spaceships" });
  assert.equal(res.ok, false);
});

test("REJECTS a non-object input", () => {
  assert.equal(validateResearchedRow(null).ok, false);
  assert.equal(validateResearchedRow("nope").ok, false);
  assert.equal(validateResearchedRow(42).ok, false);
});
