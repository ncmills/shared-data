/**
 * Pins the six-point "fully baked" scorer without touching any consumer repo.
 *
 * Positive control: a synthetic trip that satisfies every checkable point must
 * score BAKED. Negatives: removing exactly one point must drop it. If the
 * positive control ever stops passing, the scorer is broken, not the data.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  buildPoolIndex,
  scoreTrip,
  summarise,
  type NormTrip,
  type PoolInput,
} from "./atlas-baked-score";
import type { CanonicalDestination } from "../src/destinations-types";
import type { ComposedTripInput } from "../src/trips/schema";

const pool: PoolInput = {
  destinations: [
    {
      id: "asheville-nc",
      city: "Asheville",
      lodging: [{ name: "Blue Ridge House", url: "https://example.com/house" }],
      dining: [
        { name: "Cúrate", url: "https://example.com/curate" },
        { name: "No Url Diner" },
      ],
      activities: [{ name: "Biltmore Tour", url: "https://example.com/biltmore" }],
      nightlife: [],
    },
  ],
  golfCourses: [{ name: "Bandon Dunes", destinationId: "bandon-or", url: "https://example.com/bd" }],
};
const idx = buildPoolIndex(pool);

const NARR =
  "The house sleeps fourteen and the hot tub takes whoever is still up after Cúrate. " +
  "Asheville in October means the Biltmore Tour is golden by three, and nobody is rushed. " +
  "Book the house before the flights, because the Blue Ridge House fills first, and the dinner table seats the whole group in one go. Sunday brunch is a slow walk down Lexington Avenue before the drive home.";

function good(): NormTrip {
  return {
    slug: "t",
    destinationId: "asheville-nc",
    city: "Asheville",
    narrative: NARR,
    faqs: [
      { q: "a", a: "b" },
      { q: "c", a: "d" },
      { q: "e", a: "f" },
    ],
    estPerPerson: [450, 900],
    lodging: ["Blue Ridge House"],
    dining: ["Cúrate"],
    activities: ["Biltmore Tour"],
    courses: [],
    costLines: [
      { label: "stay", lo: 200, hi: 400 },
      { label: "dinner", lo: 100, hi: 200 },
      { label: "tour", lo: 150, hi: 300 },
    ],
    verifiedPhotos: {
      hero: "https://img/hero.jpg",
      stops: {
        "Blue Ridge House": "https://img/a.jpg",
        "Cúrate": "https://img/b.jpg",
        "Biltmore Tour": "https://img/c.jpg",
      },
    },
  };
}
const opts = { minNarrativeChars: 300 };

test("POSITIVE CONTROL: a trip meeting every checkable point is baked", () => {
  const r = scoreTrip(good(), idx, opts);
  assert.deepEqual(r.failed, []);
  assert.equal(r.passed, 5);
  assert.equal(r.tier, "baked");
  assert.equal(r.point3, "NOT CHECKED");
});

test("NEGATIVE p1: an unresolved venue is not baked", () => {
  const t = good();
  t.dining = ["Cúrate", "Invented Bistro"];
  const r = scoreTrip(t, idx, opts);
  assert.ok(r.failed.includes(1));
  assert.notEqual(r.tier, "baked");
});

test("NEGATIVE p1: no stay slot is not baked", () => {
  const t = good();
  t.lodging = [];
  const r = scoreTrip(t, idx, opts);
  assert.ok(r.failed.includes(1));
  assert.ok(r.missing.some((m) => /no stay/.test(m)));
});

test("NEGATIVE p2: a resolved venue with no url is not baked", () => {
  const t = good();
  t.dining = ["No Url Diner"];
  t.verifiedPhotos!.stops["No Url Diner"] = "https://img/d.jpg";
  const r = scoreTrip(t, idx, opts);
  assert.deepEqual(r.failed, [2]);
  assert.notEqual(r.tier, "baked");
});

test("NEGATIVE p4: missing verified photo for a stop is not baked", () => {
  const t = good();
  delete t.verifiedPhotos!.stops["Cúrate"];
  assert.deepEqual(scoreTrip(t, idx, opts).failed, [4]);
  const t2 = good();
  delete t2.verifiedPhotos;
  assert.deepEqual(scoreTrip(t2, idx, opts).failed, [4]);
});

test("NEGATIVE p5: cost lines that do not sum to the headline are not baked", () => {
  const t = good();
  t.costLines![0].lo = 999;
  assert.deepEqual(scoreTrip(t, idx, opts).failed, [5]);
  const t2 = good();
  delete t2.costLines;
  assert.deepEqual(scoreTrip(t2, idx, opts).failed, [5]);
});

test("p5 passes when the composed-trip derivation reproduces the headline", () => {
  const catalog = [
    {
      id: "x",
      lodging: [{ name: "L", pricePerNight: [200, 400], perRoom: true }],
      activities: [{ name: "A", pricePerPerson: [100, 200] }],
      dining: [{ name: "D", priceRange: "$$" }],
      nightlife: [],
    },
  ] as unknown as CanonicalDestination[];
  const t = good();
  delete t.costLines;
  t.composed = {
    input: {
      lodgingId: "x|lodging|L",
      nights: 2,
      activityIds: ["x|activity|A"],
      diningIds: ["x|dining|D"],
    } as unknown as ComposedTripInput,
    catalog,
  };
  // lodging 200/2*2=200..400/2*2=400; +100..200; +dining $$ 40..70 => 340..670 => 350..675
  t.estPerPerson = [350, 675];
  assert.equal(scoreTrip(t, idx, opts).failed.includes(5), false);
  t.estPerPerson = [100, 200];
  assert.equal(scoreTrip(t, idx, opts).failed.includes(5), true);
});

test("NEGATIVE p6: filler, short, or FAQ-light copy is not baked", () => {
  const t = good();
  t.narrative = NARR + " It is perfect for everyone, an unforgettable weekend.";
  assert.deepEqual(scoreTrip(t, idx, opts).failed, [6]);
  const t2 = good();
  t2.narrative = "Short copy about Asheville.";
  assert.deepEqual(scoreTrip(t2, idx, opts).failed, [6]);
  const t3 = good();
  t3.faqs = t3.faqs.slice(0, 2);
  assert.deepEqual(scoreTrip(t3, idx, opts).failed, [6]);
});

test("golf course slots resolve through the course pool, but a courses-only trip has no stay", () => {
  const t = good();
  t.destinationId = "bandon-or";
  t.lodging = [];
  t.dining = [];
  t.activities = [];
  t.courses = ["Bandon Dunes"];
  const r = scoreTrip(t, idx, opts);
  assert.ok(r.missing.some((m) => /no stay/.test(m)));
  assert.ok(r.missing.some((m) => /no meal/.test(m)));
  assert.equal(r.missing.some((m) => /not in pool/.test(m)), false);
});

test("tiers: thin 0-2, partial 3-4, baked 5 of 5 checkable", () => {
  const t = good();
  t.verifiedPhotos = undefined;
  assert.equal(scoreTrip(t, idx, opts).tier, "partial");
  t.costLines = undefined;
  t.dining = ["No Url Diner"];
  t.narrative = "x";
  assert.equal(scoreTrip(t, idx, opts).tier, "thin");
});

test("summarise counts tiers and ranks missing details", () => {
  const a = scoreTrip(good(), idx, opts);
  const b = good();
  b.verifiedPhotos = undefined;
  const s = summarise("synthetic", [a, scoreTrip(b, idx, opts)]);
  assert.equal(s.total, 2);
  assert.equal(s.baked, 1);
  assert.equal(s.partial, 1);
  assert.equal(s.thin, 0);
  assert.equal(s.topMissing[0].detail, "info: no schedule with times (not a gate point)");
  assert.equal(s.topMissing[0].count, 2);
  assert.equal(s.topMissing.find((m) => m.detail.startsWith("p4"))?.count, 1);
  assert.equal(s.point3, "NOT CHECKED");
});
