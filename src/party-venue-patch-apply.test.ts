// party-venue-patch-apply.test.ts — the ENRICHMENT half of the party write path.
//
// `attachPartyVenues` ADDS venues and deliberately lets the curated row win on a
// name collision, so it can never enrich an existing row. Every item in the
// Phase 2 backfill lane is enrichment of curated rows — coordinates, the
// 4,200-row URL/provenance backfill, the `groupMin` re-grade, bedroom counts,
// reservation data — so none of it can go through the append path. This is that
// second mechanism.
//
// The asymmetry is deliberate and is the thing to keep straight:
//   append → curated row WINS   (never overwrite reviewed copy with a new venue)
//   patch  → curated value LOSES (the whole point is correcting an editorial
//                                 default like groupMin: 4, or filling a blank)
// Because a patch CAN overwrite a rendered claim, every patch must carry
// `sourceUrl` + `citations` — the same bar `research-schema.ts` sets for a new
// row. A patch that changes what a user reads without a followable source is
// exactly the unverifiable specific the honesty rules exist to stop.
import { test } from "node:test";
import assert from "node:assert/strict";

import { applyPartyVenuePatches } from "./party-venue-patch-apply";
import type { PartyVenuePatch } from "./party-venue-patches";
import { attachPartyVenues } from "./party-venues-attach";
import type { PartyVenueExpansionRow } from "./party-venues-expansion";
import { bakeDestination } from "./destinations-bake";
import type { CanonicalDestination } from "./destinations-types";

function fixtureDestination(): CanonicalDestination {
  return {
    id: "patch-city-mn",
    city: "Patch City",
    state: "MN",
    region: "midwest",
    nearestAirport: { code: "PCH", name: "Patch Intl", driveMinutes: 20 },
    bestMonths: [6, 7],
    vibes: ["balanced"],
    score: 7,
    nightlife: [],
    dining: [],
    activities: [
      {
        name: "Patch Sunset Sail",
        type: "sunset-cruise",
        duration: "2 hours",
        pricePerPerson: [80, 120],
        groupMin: 4,
        groupMax: 12,
        highlight: "The curated row.",
        bestFor: "curated",
        brands: ["both"],
      },
    ],
    lodging: [],
    transport: [],
    presentation: {
      moh: { tagline: "t", description: "d" },
      bestman: { tagline: "t", description: "d" },
    },
  };
}

const COORD_PATCH: PartyVenuePatch = {
  destinationId: "patch-city-mn",
  category: "activity",
  name: "Patch Sunset Sail",
  lat: 44.9778,
  lng: -93.265,
  sourceUrl: "https://www.patch-sunset-sail.test/",
  citations: ["https://www.patch-sunset-sail.test/location"],
};

test("merges a patched field onto the matching curated row", () => {
  const [d] = applyPartyVenuePatches([fixtureDestination()], [COORD_PATCH]);
  const row = d.activities[0] as unknown as Record<string, unknown>;

  assert.equal(row.lat, 44.9778);
  assert.equal(row.lng, -93.265);
});

test("leaves unpatched fields of that row intact", () => {
  const [d] = applyPartyVenuePatches([fixtureDestination()], [COORD_PATCH]);
  const row = d.activities[0];

  assert.equal(row.highlight, "The curated row.");
  assert.equal(row.groupMax, 12);
  assert.equal(row.duration, "2 hours");
});

test("OVERWRITES a curated value — the point of the groupMin re-grade", () => {
  // Appends must never overwrite reviewed copy; patches must, or 1,107 rows
  // stuck at the editorial default of 4 can never be corrected.
  const regrade: PartyVenuePatch = {
    destinationId: "patch-city-mn",
    category: "activity",
    name: "Patch Sunset Sail",
    groupMin: 2,
    sourceUrl: "https://www.patch-sunset-sail.test/",
    citations: ["https://www.patch-sunset-sail.test/booking"],
  };

  const [d] = applyPartyVenuePatches([fixtureDestination()], [regrade]);
  assert.equal(d.activities[0].groupMin, 2);
});

test("THROWS when a patch matches no row, naming the target", () => {
  const orphan: PartyVenuePatch = { ...COORD_PATCH, name: "No Such Venue" };

  assert.throws(
    () => applyPartyVenuePatches([fixtureDestination()], [orphan]),
    /No Such Venue/,
    "a patch that silently no-ops is a backfill that reports success and changes nothing",
  );
});

test("THROWS when the destination anchor itself is wrong", () => {
  const orphan: PartyVenuePatch = { ...COORD_PATCH, destinationId: "patch-city-typo" };
  assert.throws(() => applyPartyVenuePatches([fixtureDestination()], [orphan]), /patch-city-typo/);
});

test("THROWS when the category is wrong, rather than searching other arrays", () => {
  const orphan: PartyVenuePatch = { ...COORD_PATCH, category: "dining" };
  assert.throws(() => applyPartyVenuePatches([fixtureDestination()], [orphan]), /Patch Sunset Sail/);
});

test("never creates a row", () => {
  const [d] = applyPartyVenuePatches([fixtureDestination()], [COORD_PATCH]);
  assert.equal(d.activities.length, 1);
  assert.equal(d.dining.length, 0);
});

test("cannot rewrite the identity fields it is keyed on", () => {
  const sneaky = {
    ...COORD_PATCH,
    // These are the KEY, not payload — a patch must not be able to rename a
    // venue or move it to another destination/category.
    destinationId: "patch-city-mn",
    category: "activity",
    name: "Patch Sunset Sail",
  } as PartyVenuePatch;

  const [d] = applyPartyVenuePatches([fixtureDestination()], [sneaky]);
  const row = d.activities[0] as unknown as Record<string, unknown>;

  assert.equal(row.name, "Patch Sunset Sail");
  assert.equal(row.destinationId, undefined, "key fields must not land as payload");
  assert.equal(row.category, undefined);
});

test("persists sourceUrl and citations onto the patched row", () => {
  const [d] = applyPartyVenuePatches([fixtureDestination()], [COORD_PATCH]);
  const row = d.activities[0] as unknown as Record<string, unknown>;

  assert.equal(row.sourceUrl, "https://www.patch-sunset-sail.test/");
  assert.deepEqual(row.citations, ["https://www.patch-sunset-sail.test/location"]);
});

test("REJECTS a patch with no provenance", () => {
  const unsourced = {
    destinationId: "patch-city-mn",
    category: "activity",
    name: "Patch Sunset Sail",
    groupMin: 2,
  } as unknown as PartyVenuePatch;

  assert.throws(
    () => applyPartyVenuePatches([fixtureDestination()], [unsourced]),
    /provenance|sourceUrl|citation/i,
    "a patch can change a rendered claim, so it must be followable",
  );
});

test("THROWS on two patches targeting the same row", () => {
  const a: PartyVenuePatch = { ...COORD_PATCH, lat: 1 };
  const b: PartyVenuePatch = { ...COORD_PATCH, lat: 2 };

  assert.throws(
    () => applyPartyVenuePatches([fixtureDestination()], [a, b]),
    /Patch Sunset Sail/,
    "ambiguous intent — last-write-wins would make the result order-dependent",
  );
});

test("matches name case- and whitespace-insensitively", () => {
  const loose: PartyVenuePatch = { ...COORD_PATCH, name: "  patch SUNSET sail " };
  const [d] = applyPartyVenuePatches([fixtureDestination()], [loose]);

  assert.equal((d.activities[0] as unknown as Record<string, unknown>).lat, 44.9778);
});

test("does not mutate the caller's destinations", () => {
  const dest = fixtureDestination();
  applyPartyVenuePatches([dest], [COORD_PATCH]);

  assert.equal((dest.activities[0] as unknown as Record<string, unknown>).lat, undefined);
});

test("leaves untargeted destinations untouched", () => {
  const other = { ...fixtureDestination(), id: "other-city-mn" };
  const [, out] = applyPartyVenuePatches([fixtureDestination(), other], [COORD_PATCH]);

  assert.equal((out.activities[0] as unknown as Record<string, unknown>).lat, undefined);
});

test("patches apply BEFORE the bake, so derived tags reflect the patched value", () => {
  // priceTier is DERIVED from pricePerPerson by bakeDestination. If patches ran
  // after the bake, a repriced row would keep a tier computed from the stale
  // price and the overlays would filter on a number nobody can see.
  const reprice: PartyVenuePatch = {
    destinationId: "patch-city-mn",
    category: "activity",
    name: "Patch Sunset Sail",
    pricePerPerson: [10, 15],
    sourceUrl: "https://www.patch-sunset-sail.test/",
    citations: ["https://www.patch-sunset-sail.test/rates"],
  };

  const baseline = bakeDestination(fixtureDestination()).activities[0].priceTier;
  const [patched] = applyPartyVenuePatches([fixtureDestination()], [reprice]);
  const afterTier = bakeDestination(patched).activities[0].priceTier;

  assert.notEqual(afterTier, baseline, "an $80-120 row and a $10-15 row must not share a tier");
});

test("can patch a row that arrived through the expansion file", () => {
  // Ordering contract: attach, then patch. A researched venue added this month
  // must be enrichable next month without hand-editing anything.
  const appended: PartyVenueExpansionRow = {
    destinationId: "patch-city-mn",
    category: "dining",
    name: "Patch Supper Club",
    cuisine: "Supper Club",
    priceRange: "$$",
    highlight: "Appended this run.",
    bestFor: "dinner",
    groupFriendly: true,
    brands: ["both"],
    sourceUrl: "https://www.patch-supper-club.test/",
    citations: ["https://www.patch-supper-club.test/menu"],
  };
  const patch: PartyVenuePatch = {
    destinationId: "patch-city-mn",
    category: "dining",
    name: "Patch Supper Club",
    lat: 44.9,
    lng: -93.2,
    sourceUrl: "https://www.patch-supper-club.test/",
    citations: ["https://www.patch-supper-club.test/contact"],
  };

  const attached = attachPartyVenues([fixtureDestination()], [appended]);
  const [d] = applyPartyVenuePatches(attached, [patch]);

  assert.equal((d.dining[0] as unknown as Record<string, unknown>).lat, 44.9);
});

test("is a no-op with no patches, returning the input untouched", () => {
  const dests = [fixtureDestination()];
  assert.equal(applyPartyVenuePatches(dests, []), dests);
});
