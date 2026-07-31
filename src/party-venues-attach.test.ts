// party-venues-attach.test.ts — the ATTACH half of the party-venue write path.
//
// Party rows are machine-appended to a FLAT sanctioned file
// (src/party-venues-expansion.ts) and attached onto the destination they
// anchor at assembly time, exactly as golf does it: the curated nested files
// (destinations-expansion-*.ts, destinations-data.ts) are hand-authored TS with
// inline comments and are NEVER machine-edited. See the `destinationId` doc on
// SharedGolfCourse for the precedent this follows.
//
// The load-bearing test here is the ORPHAN one: a row whose anchor resolves to
// nothing must THROW, not be dropped. A silently-dropped row passes every gate
// and reaches no user — the exact failure this repo keeps re-hitting (38 of 999
// researched golf courses reached no page while the audit was green).
import { test } from "node:test";
import assert from "node:assert/strict";

import { attachPartyVenues } from "./party-venues-attach";
import type { PartyVenueExpansionRow } from "./party-venues-expansion";
import type { CanonicalDestination } from "./destinations-types";

function fixtureDestination(id: string): CanonicalDestination {
  return {
    id,
    city: "Fixture City",
    state: "MN",
    region: "midwest",
    nearestAirport: { code: "FIX", name: "Fixture Intl", driveMinutes: 20 },
    bestMonths: [6, 7],
    vibes: ["balanced"],
    score: 7,
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

const ACTIVITY_ROW: PartyVenueExpansionRow = {
  destinationId: "fixture-city-mn",
  category: "activity",
  name: "Fixture Kayak Tour",
  type: "outdoor",
  duration: "3 hours",
  pricePerPerson: [60, 90],
  groupMin: 4,
  groupMax: 12,
  highlight: "A fixture paddle used only by party-venues-attach.test.ts.",
  bestFor: "Crews who want water time",
  brands: ["both"],
  sourceUrl: "https://www.fixture-kayak-tour.test/",
  citations: ["https://www.fixture-kayak-tour.test/trips"],
};

test("attaches a row to the destination named by its destinationId anchor", () => {
  const out = attachPartyVenues([fixtureDestination("fixture-city-mn")], [ACTIVITY_ROW]);

  assert.equal(out.length, 1);
  assert.equal(out[0].activities.length, 1);
  assert.equal(out[0].activities[0].name, "Fixture Kayak Tour");
});

test("routes each category to its own array", () => {
  const rows: PartyVenueExpansionRow[] = [
    ACTIVITY_ROW,
    {
      destinationId: "fixture-city-mn",
      category: "dining",
      name: "Fixture Supper Club",
      cuisine: "Supper Club",
      priceRange: "$$",
      highlight: "Fixture dining row.",
      bestFor: "dinner",
      groupFriendly: true,
      brands: ["both"],
      sourceUrl: "https://www.fixture-supper-club.test/",
      citations: ["https://www.fixture-supper-club.test/menu"],
    },
    {
      destinationId: "fixture-city-mn",
      category: "nightlife",
      name: "Fixture Rooftop",
      type: "rooftop",
      vibe: "balanced",
      priceRange: "$$",
      highlight: "Fixture nightlife row.",
      reservationNeeded: false,
      groupFriendly: true,
      lateNight: true,
      brands: ["both"],
      sourceUrl: "https://www.fixture-rooftop.test/",
      citations: ["https://www.fixture-rooftop.test/hours"],
    },
    {
      destinationId: "fixture-city-mn",
      category: "lodging",
      name: "Fixture Lodge",
      type: "hotel",
      pricePerNight: [180, 260],
      perRoom: true,
      maxGuests: 4,
      highlight: "Fixture lodging row.",
      sourceUrl: "https://www.fixture-lodge.test/",
      citations: ["https://www.fixture-lodge.test/rooms"],
    },
    {
      destinationId: "fixture-city-mn",
      category: "transport",
      name: "Fixture Shuttle",
      type: "shuttle",
      priceRange: "$$",
      highlight: "Fixture transport row.",
      sourceUrl: "https://www.fixture-shuttle.test/",
      citations: ["https://www.fixture-shuttle.test/booking"],
    },
  ];

  const [d] = attachPartyVenues([fixtureDestination("fixture-city-mn")], rows);

  assert.equal(d.activities.length, 1, "activity");
  assert.equal(d.dining.length, 1, "dining");
  assert.equal(d.nightlife.length, 1, "nightlife");
  assert.equal(d.lodging.length, 1, "lodging");
  assert.equal(d.transport.length, 1, "transport");
});

test("THROWS on an unresolvable destinationId instead of dropping the row", () => {
  const orphan: PartyVenueExpansionRow = { ...ACTIVITY_ROW, destinationId: "fixture-city-typo" };

  assert.throws(
    () => attachPartyVenues([fixtureDestination("fixture-city-mn")], [orphan]),
    /fixture-city-typo/,
    "an unresolved anchor must fail loudly and name the bad id",
  );
});

test("never infers a destination from city/state when the anchor misses", () => {
  // Same city+state as the fixture destination, but a non-matching id. A
  // loose city match is exactly the silent mis-association the golf anchor doc
  // forbids — international town names collide.
  const orphan: PartyVenueExpansionRow = {
    ...ACTIVITY_ROW,
    destinationId: "some-other-id",
    city: "Fixture City",
    state: "MN",
  };

  assert.throws(() => attachPartyVenues([fixtureDestination("fixture-city-mn")], [orphan]), /some-other-id/);
});

test("an existing curated row of the same name wins; the appended row is dropped", () => {
  const dest = fixtureDestination("fixture-city-mn");
  dest.activities.push({
    name: "Fixture Kayak Tour",
    type: "outdoor",
    duration: "2 hours",
    pricePerPerson: [50, 50],
    groupMin: 2,
    groupMax: 8,
    highlight: "The CURATED row — must survive.",
    bestFor: "curated",
    brands: ["both"],
  });

  const [d] = attachPartyVenues([dest], [ACTIVITY_ROW]);

  assert.equal(d.activities.length, 1, "no duplicate appended");
  assert.equal(d.activities[0].highlight, "The CURATED row — must survive.");
});

test("dedup is case- and whitespace-insensitive on name, scoped per category", () => {
  const dest = fixtureDestination("fixture-city-mn");
  dest.activities.push({
    name: "  fixture KAYAK tour ",
    type: "outdoor",
    duration: "2 hours",
    pricePerPerson: [50, 50],
    groupMin: 2,
    groupMax: 8,
    highlight: "curated",
    bestFor: "curated",
    brands: ["both"],
  });
  // Same NAME, different CATEGORY — a restaurant and an activity can share a
  // name, so this one must still attach.
  const diningTwin: PartyVenueExpansionRow = {
    destinationId: "fixture-city-mn",
    category: "dining",
    name: "Fixture Kayak Tour",
    cuisine: "Dockside",
    priceRange: "$$",
    highlight: "Different category, same name — must attach.",
    bestFor: "lunch",
    groupFriendly: true,
    brands: ["both"],
    sourceUrl: "https://www.fixture-kayak-tour.test/cafe",
    citations: ["https://www.fixture-kayak-tour.test/cafe-menu"],
  };

  const [d] = attachPartyVenues([dest], [ACTIVITY_ROW, diningTwin]);

  assert.equal(d.activities.length, 1, "case/whitespace variant deduped");
  assert.equal(d.dining.length, 1, "same name in a different category still attaches");
});

test("persists sourceUrl and citations onto the attached row", () => {
  // e57103a fixed exactly this strip for residences: the schema gate and the
  // live URL check both ran, then their evidence was discarded. Party rows
  // render into live copy, so an unfollowable claim is the unverifiable
  // specific the honesty rules exist to stop.
  const [d] = attachPartyVenues([fixtureDestination("fixture-city-mn")], [ACTIVITY_ROW]);
  const row = d.activities[0] as unknown as Record<string, unknown>;

  assert.equal(row.sourceUrl, "https://www.fixture-kayak-tour.test/");
  assert.deepEqual(row.citations, ["https://www.fixture-kayak-tour.test/trips"]);
  assert.equal(row.url, "https://www.fixture-kayak-tour.test/", "url mirrors sourceUrl, as golf does");
});

test("does not carry the routing keys onto the canonical row", () => {
  // `destinationId` / `category` are ATTACH instructions, not venue fields.
  const [d] = attachPartyVenues([fixtureDestination("fixture-city-mn")], [ACTIVITY_ROW]);
  const row = d.activities[0] as unknown as Record<string, unknown>;

  assert.equal(row.destinationId, undefined);
  assert.equal(row.category, undefined);
});

test("leaves destinations with no appended rows structurally untouched", () => {
  const untouched = fixtureDestination("other-city-mn");
  const [, out] = attachPartyVenues(
    [fixtureDestination("fixture-city-mn"), untouched],
    [ACTIVITY_ROW],
  );

  assert.equal(out.activities.length, 0);
  assert.deepEqual(out, untouched);
});

test("does not mutate the caller's destination objects", () => {
  const dest = fixtureDestination("fixture-city-mn");
  attachPartyVenues([dest], [ACTIVITY_ROW]);

  assert.equal(dest.activities.length, 0, "input must be copied, not mutated");
});
