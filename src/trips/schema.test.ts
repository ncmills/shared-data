// schema.test.ts — unit tests for the composed-trip schema + derivation.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CanonicalDestination } from "../destinations-types";
import {
  rowKey,
  deriveEstPerPerson,
  composeTrips,
  type ComposedTripInput,
} from "./schema";

// ── tiny synthetic catalog ──────────────────────────────────────────────────
const DEST: CanonicalDestination = {
  id: "test-city-ts",
  city: "Test City",
  state: "TS",
  region: "midwest",
  nearestAirport: { code: "TST", name: "Test Intl", driveMinutes: 20 },
  bestMonths: [5, 6, 9],
  vibes: ["balanced"],
  score: 7,
  nightlife: [
    {
      name: "Neon Bar",
      type: "bar",
      vibe: "balanced",
      priceRange: "$",
      highlight: "neon",
      reservationNeeded: false,
      groupFriendly: true,
      lateNight: true,
      brands: ["both"],
    },
  ],
  dining: [
    {
      name: "Trattoria Prova",
      cuisine: "italian",
      priceRange: "$$",
      highlight: "pasta",
      bestFor: "group dinner",
      groupFriendly: true,
      brands: ["both"],
    },
  ],
  activities: [
    {
      name: "Boat Day",
      type: "boat",
      duration: "4 hours",
      pricePerPerson: [50, 100],
      groupMin: 2,
      groupMax: 12,
      highlight: "on the water",
      bestFor: "afternoon",
      brands: ["both"],
    },
  ],
  lodging: [
    {
      name: "Test Lodge",
      type: "hotel",
      pricePerNight: [200, 400],
      perRoom: true,
      maxGuests: 8,
      highlight: "central",
    },
  ],
  transport: [],
  presentation: {
    moh: { tagline: "t", description: "d" },
    bestman: { tagline: "t", description: "d" },
  },
};
const CATALOG = [DEST];

const TRIP: ComposedTripInput = {
  id: "em-test-city-weekend",
  slug: "test-city-weekend",
  planner: "engagedmoon",
  destinationId: "test-city-ts",
  title: "A Test City Weekend",
  category: "long-weekend",
  season: [5, 6, 9],
  nights: 3,
  groupRange: [2, 2],
  lodgingId: rowKey("test-city-ts", "lodging", "Test Lodge"),
  activityIds: [rowKey("test-city-ts", "activity", "Boat Day")],
  diningIds: [rowKey("test-city-ts", "dining", "Trattoria Prova")],
  nightlifeIds: [rowKey("test-city-ts", "nightlife", "Neon Bar")],
  narrative: "Three easy nights in Test City.",
  capstoneSpotId: null,
  faqs: [
    { q: "When?", a: "May, June or September." },
    { q: "How long?", a: "Three nights." },
  ],
  heroImageKey: "test-city-hero",
};

// ── rowKey formation ────────────────────────────────────────────────────────
test("rowKey mirrors the TAG_OVERRIDES composite formation (singular category)", () => {
  assert.equal(
    rowKey("amelia-island-fl", "lodging", "Omni Amelia Island Resort"),
    "amelia-island-fl|lodging|Omni Amelia Island Resort",
  );
  assert.equal(rowKey("test-city-ts", "activity", "Boat Day"), "test-city-ts|activity|Boat Day");
});

// ── deriveEstPerPerson arithmetic ───────────────────────────────────────────
test("deriveEstPerPerson: perRoom lodging /2 × nights + activity sum + dining/nightlife bands, rounded to 25", () => {
  // lodging [200,400]/2 × 3 = [300,600]
  // activity [50,100] → [350,700]
  // dining $$ [40,70] → [390,770]
  // nightlife $ [10,20] → [400,790]
  // round to nearest 25 → [400, 800]
  assert.deepEqual(deriveEstPerPerson(TRIP, CATALOG), [400, 800]);
});

test("deriveEstPerPerson: perRoom false (whole unit) also divides by 2 — the couple takes the unit", () => {
  const catalog: CanonicalDestination[] = [
    {
      ...DEST,
      lodging: [{ ...DEST.lodging[0]!, perRoom: false }],
    },
  ];
  assert.deepEqual(deriveEstPerPerson(TRIP, catalog), [400, 800]);
});

test("composeTrips maps inputs to ComposedTrip with derived estPerPerson", () => {
  const [composed] = composeTrips([TRIP], CATALOG);
  assert.ok(composed);
  assert.equal(composed.id, TRIP.id);
  assert.deepEqual(composed.estPerPerson, [400, 800]);
});

// ── fail closed on dangling references ──────────────────────────────────────
test("deriveEstPerPerson throws naming the exact dangling key", () => {
  const badKey = rowKey("test-city-ts", "activity", "Not A Real Row");
  const bad: ComposedTripInput = { ...TRIP, activityIds: [badKey] };
  assert.throws(() => deriveEstPerPerson(bad, CATALOG), (e: unknown) => {
    assert.ok(e instanceof Error);
    assert.ok(e.message.includes(`"${badKey}"`), `error should name the key: ${e.message}`);
    return true;
  });
});

// ── estPerPerson is derived, never authored ─────────────────────────────────
test("ComposedTripInput cannot carry estPerPerson (type-level)", () => {
  const attempted: ComposedTripInput = {
    ...TRIP,
    // @ts-expect-error — estPerPerson is DERIVED from the composed rows'
    // published ranges (see schema.ts); an authored value would be a second
    // copy of the money that could drift from the catalog.
    estPerPerson: [100, 200],
  };
  assert.ok(attempted);
});
