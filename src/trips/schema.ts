/**
 * trips/schema.ts — composed-trip schema for the shared destination catalog.
 *
 * A composed trip is NOT new content: it is a curated bundle of REAL catalog
 * rows (one lodging + 3-5 activities + 2-3 dining + optional nightlife)
 * referenced by key, wrapped in authored prose (title, narrative, FAQs). The
 * catalog rows carry the facts (names, prices, highlights); the trip carries
 * only the editorial frame around them.
 *
 * Row identity: catalog rows have NO id fields (measured 2026-08-20: 6,398
 * rows, 0 with ids — the optional Tier-A `id` slots in destinations-types.ts
 * are unpopulated). The only stable row key is the same composite that
 * `TAG_OVERRIDES` in destinations-bake.ts keys on:
 *
 *     `${destinationId}|${category}|${name}`
 *
 * with SINGULAR category words (activity|dining|nightlife|lodging|transport),
 * exactly as those override keys are formed. `rowKey` below is the one place
 * that formation is spelled; author trips through it or copy it exactly.
 */

import type {
  CanonicalDestination,
  CanonicalActivity,
  CanonicalDining,
  CanonicalNightlife,
  CanonicalLodging,
} from "../destinations-types";

/** The wizard/site a composed trip is authored FOR (its native shape + voice). */
export type TripPlanner = "bestman" | "moh" | "hhq" | "oo" | "friendsmoon" | "engagedmoon";

/**
 * `${destinationId}|${category}|${name}` — singular category word, same
 * composite `TAG_OVERRIDES` (destinations-bake.ts) keys on. See `rowKey`.
 */
export type CatalogRowKey = string;

export type RowCategory = "activity" | "dining" | "nightlife" | "lodging" | "transport";

/** Form the composite row key. Mirrors TAG_OVERRIDES key formation exactly. */
export function rowKey(destinationId: string, category: RowCategory, name: string): CatalogRowKey {
  return `${destinationId}|${category}|${name}`;
}

/** Map the singular key category → the plural array field on CanonicalDestination. */
const CATEGORY_FIELD: Record<RowCategory, keyof CanonicalDestination> = {
  activity: "activities",
  dining: "dining",
  nightlife: "nightlife",
  lodging: "lodging",
  transport: "transport",
};

/**
 * The AUTHORED shape of a composed trip.
 *
 * DELIBERATELY NO `estPerPerson` FIELD. The per-person estimate is DERIVED
 * (`deriveEstPerPerson`) from the published price ranges of the catalog rows
 * the trip composes — never typed by an author. That is the whole point of
 * composing real rows by reference: the money on a trip page can never drift
 * from the catalog, because there is no second copy of it to drift. Reprice a
 * lodging row and every trip that references it reprices on the next build.
 * If you find yourself wanting to type a number here, fix the referenced
 * row's price instead.
 */
export interface ComposedTripInput {
  /** Stable trip id, unique across all composed trips (any planner). */
  id: string;
  /** URL slug, unique across all composed trips. */
  slug: string;
  /** Which planner/site this trip is authored for. */
  planner: TripPlanner;
  /** Must resolve to a CanonicalDestination.id in sharedDestinations. */
  destinationId: string;
  title: string;
  /** Planner-native shape label (free string, e.g. "long-weekend", "capstone"). */
  category: string;
  /** Months (1-12) this trip is composed for. */
  season: number[];
  nights: number;
  /** [min, max] group size the composition suits. */
  groupRange: [number, number];
  /** Exactly one lodging row. */
  lodgingId: CatalogRowKey;
  /** 3-5 activity rows. */
  activityIds: CatalogRowKey[];
  /** 2-3 dining rows. */
  diningIds: CatalogRowKey[];
  /** Optional nightlife rows. */
  nightlifeIds?: CatalogRowKey[];
  /** Authored prose — the editorial frame around the referenced rows. */
  narrative: string;
  /** Optional capstone shape label (e.g. "sunset proposal", "final round"). */
  capstoneShape?: string;
  /**
   * null, or a ProposalSpot.id in PROPOSAL_SPOTS_DATA whose destinationId
   * matches this trip's and whose capstoneEligible !== false.
   */
  capstoneSpotId: string | null;
  faqs: { q: string; a: string }[];
  /** Key into the shared image cache for the trip's hero. */
  heroImageKey: string;
}

/** A composed trip after derivation: input + the catalog-derived estimate. */
export interface ComposedTrip extends ComposedTripInput {
  /** [lo, hi] per-person estimate DERIVED from the referenced rows' published ranges. */
  estPerPerson: [number, number];
}

/* ── derivation constants (documented, deterministic) ──────────────────────
 * Dining rows publish only a dollar-sign band, so the derivation maps bands to
 * a per-person DINNER estimate; nightlife bands map to a per-person night-out
 * estimate. These are the single source for that mapping — change them here
 * and every composed trip reprices together.
 */
export const DINING_DINNER_BAND: Record<"$" | "$$" | "$$$" | "$$$$", [number, number]> = {
  $: [20, 35],
  $$: [40, 70],
  $$$: [75, 130],
  $$$$: [130, 220],
};

export const NIGHTLIFE_BAND: Record<"$" | "$$" | "$$$" | "$$$$", [number, number]> = {
  $: [10, 20],
  $$: [20, 40],
  $$$: [35, 70],
  $$$$: [60, 110],
};

/** Round to the nearest $25 — estimates should read as estimates. */
const roundTo25 = (n: number): number => Math.round(n / 25) * 25;

/** Parse a composite key. Name may itself contain "|" (none do today, but the
 * split must not silently truncate one if it ever does). */
function parseKey(key: CatalogRowKey): { destinationId: string; category: string; name: string } {
  const [destinationId, category, ...rest] = key.split("|");
  return { destinationId: destinationId ?? "", category: category ?? "", name: rest.join("|") };
}

/** Resolve one key against the catalog, or throw naming the EXACT missing key.
 * Fail closed: a dangling reference must never publish as a $0 line item.
 * (verify-trips.ts reports dangling keys more readably — with nearest-name
 * suggestions — before this backstop is ever the first thing to fire in CI.) */
function resolveRow(key: CatalogRowKey, catalog: CanonicalDestination[]): unknown {
  const { destinationId, category, name } = parseKey(key);
  const dest = catalog.find((d) => d.id === destinationId);
  if (!dest) throw new Error(`composed-trip row key does not resolve (unknown destination): "${key}"`);
  const field = CATEGORY_FIELD[category as RowCategory];
  if (!field) throw new Error(`composed-trip row key does not resolve (bad category "${category}"): "${key}"`);
  const row = (dest[field] as { name: string }[]).find((r) => r.name === name);
  if (!row) throw new Error(`composed-trip row key does not resolve (no such ${category} row): "${key}"`);
  return row;
}

/**
 * Derive the [lo, hi] per-person estimate from the composed rows' published
 * ranges. Deterministic; every constant is documented at its definition:
 *
 *  - lodging: `pricePerNight [lo,hi]` ÷ 2 × nights. The ÷2 holds for BOTH
 *    perRoom values: perRoom true → a couple shares the room (2 heads per
 *    room-night); perRoom false → the price is for the whole unit and the
 *    couple takes the unit (2 heads per unit-night). Trips composed for
 *    larger groups still read as a per-couple-occupancy floor — the honest
 *    published range, not a fabricated per-head split of unknown occupancy.
 *  - each activity: its published `pricePerPerson [lo,hi]`, summed.
 *  - each dining row: DINING_DINNER_BAND[priceRange], summed.
 *  - each nightlife row: NIGHTLIFE_BAND[priceRange], summed.
 *  - both ends rounded to the nearest 25.
 *
 * Throws (with the exact key) on any unresolvable reference — fail closed.
 */
export function deriveEstPerPerson(
  trip: ComposedTripInput,
  catalog: CanonicalDestination[],
): [number, number] {
  const lodging = resolveRow(trip.lodgingId, catalog) as CanonicalLodging;
  let lo = (lodging.pricePerNight[0] / 2) * trip.nights;
  let hi = (lodging.pricePerNight[1] / 2) * trip.nights;

  for (const key of trip.activityIds) {
    const a = resolveRow(key, catalog) as CanonicalActivity;
    lo += a.pricePerPerson[0];
    hi += a.pricePerPerson[1];
  }
  for (const key of trip.diningIds) {
    const d = resolveRow(key, catalog) as CanonicalDining;
    const [blo, bhi] = DINING_DINNER_BAND[d.priceRange];
    lo += blo;
    hi += bhi;
  }
  for (const key of trip.nightlifeIds ?? []) {
    const n = resolveRow(key, catalog) as CanonicalNightlife;
    const [blo, bhi] = NIGHTLIFE_BAND[n.priceRange];
    lo += blo;
    hi += bhi;
  }
  return [roundTo25(lo), roundTo25(hi)];
}

/** Compose authored inputs into full trips by deriving each estimate. */
export function composeTrips(
  inputs: ComposedTripInput[],
  catalog: CanonicalDestination[],
): ComposedTrip[] {
  return inputs.map((input) => ({
    ...input,
    estPerPerson: deriveEstPerPerson(input, catalog),
  }));
}
