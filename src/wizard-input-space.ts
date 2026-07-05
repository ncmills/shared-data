/**
 * wizard-input-space.ts — the bounded per-wizard cartesian INPUT space
 * consumed by the Task 11 starved-input audit (`scripts/audit/starved-inputs.ts`).
 *
 * A "cell" is a combination of axis values a real user could plausibly select
 * in a wizard (region, vibe/tier/setting, audience) that the wizard's engine
 * would then filter the universe by. `WIZARD_INPUT_SPACE` enumerates those
 * axes PER WIZARD — deliberately small and tied to real data enums so the
 * cross product stays bounded (no invented categories, no per-city/per-
 * country grain that would blow the cell count up into the thousands).
 *
 * Axis choices, one per wizard (see starved-inputs.ts for how each cell is
 * counted against the real universe):
 *
 *   - bestman / moh        — region × partyVibe over `sharedDestinations`
 *     (the shared party-city universe both brands read). Region is the
 *     `CanonicalRegion` enum already on every destination (destinations-types.ts);
 *     vibe is the destination-level `PartyVibe` enum. Both wizards' ENGINE_READS
 *     also include `golf-course` (bestman reads courses live via
 *     `coursesForCity`), but golf is a brand-agnostic pool with no bestman-only
 *     subset — the handicap/tdf golf cells below already surface golf-region
 *     thinness, so it isn't duplicated here as a bestman-specific axis.
 *   - handicap / tdf       — golfRegion × tier over `SHARED_GOLF_COURSES`
 *     (+ the HHQ merge overlay). `tdf` mirrors `handicap`'s ENGINE_READS
 *     exactly (see engine-reads.ts: "tdf... kept here for back-compat /
 *     superset only"), so it gets the same axes rather than an invented one.
 *   - offsite-retreat      — setting × worldRegion over `SHARED_RESIDENCES`.
 *     `setting` is the real enum already on every residence. Residences carry
 *     no bounded region enum (the raw `region` field is free-text — city/
 *     province names, ~250 distinct strings for 328 rows) so a direct cross
 *     would blow the cell count up and every cell would look "starved" by
 *     construction. `worldRegionForCountry` coarsens the real `country` field
 *     (also on every residence) into a small, bounded set of world regions —
 *     tied to real data, just grouped up a level, the same way US state →
 *     `UsRegion` already works for the party universe (`src/regions.ts`).
 *   - offsite-outing       — region × audience over corporate-eligible
 *     `party-venue` rows. Region again comes from `sharedDestinations`
 *     (the only region-keyed entity kind OO's engine reads); audience is
 *     scoped to the three non-party audience tags (`corporate` / `clients` /
 *     `internal`) since `bachelor` / `bachelorette` aren't relevant to a
 *     corporate offsite. OO experiences/outing-templates are also
 *     `ENGINE_READS` for this wizard but carry no structured region field in
 *     the shared schema (only a free-text `regionsHint`), so they aren't
 *     region-crossed here — a real data-shape limit, not an oversight.
 */

import type { WizardTag } from "./tags";

export interface InputAxis {
  name: string;
  values: readonly string[];
}

// ── bestman / moh — party destinations ──────────────────────────────────────
export const PARTY_REGIONS = ["south", "west", "northeast", "midwest", "international"] as const;
export const PARTY_VIBES = ["chill", "balanced", "unhinged"] as const;

// ── handicap / tdf — golf courses ───────────────────────────────────────────
// Real `region` values present in SHARED_GOLF_COURSES (+ the HHQ merge).
export const GOLF_REGIONS = [
  "California",
  "International",
  "Midwest",
  "Mountain West",
  "Northeast",
  "Pacific NW",
  "South Central",
  "Southeast",
  "Southwest",
] as const;
// Real `tier` values present in SHARED_GOLF_COURSES.
export const GOLF_TIERS = ["bucket-list", "premium", "solid", "budget"] as const;

// ── offsite-retreat — residences ────────────────────────────────────────────
// Real `setting` values present in SHARED_RESIDENCES.
export const RESIDENCE_SETTINGS = [
  "alpine",
  "castle",
  "coastal",
  "countryside",
  "desert",
  "island",
  "lake",
  "links",
  "palace",
  "ranch",
  "safari",
  "ski-resort",
  "tropical",
  "urban",
  "vineyard",
] as const;

export const RESIDENCE_WORLD_REGIONS = [
  "North America",
  "Latin America & Caribbean",
  "Europe",
  "Middle East",
  "Africa",
  "Asia-Pacific",
  "Other",
] as const;

/**
 * Real `country` string (as it appears on SharedResidence) → coarse world
 * region. Built by enumerating every distinct `country` value in
 * SHARED_RESIDENCES (328 rows, 61 distinct strings) and bucketing each one —
 * no invented countries, just a coarser grouping of the exact strings in the
 * data. Anything not covered falls back to "Other" (defensive against future
 * additions, not expected to fire on the current universe).
 */
const COUNTRY_TO_WORLD_REGION: Record<string, (typeof RESIDENCE_WORLD_REGIONS)[number]> = {
  // North America
  USA: "North America",
  "United States": "North America",
  "United States (Hawaii)": "North America",
  Canada: "North America",
  // Latin America & Caribbean
  Mexico: "Latin America & Caribbean",
  Argentina: "Latin America & Caribbean",
  Chile: "Latin America & Caribbean",
  "Costa Rica": "Latin America & Caribbean",
  Panama: "Latin America & Caribbean",
  Belize: "Latin America & Caribbean",
  Bahamas: "Latin America & Caribbean",
  "Turks & Caicos": "Latin America & Caribbean",
  "Turks and Caicos Islands": "Latin America & Caribbean",
  "British Virgin Islands": "Latin America & Caribbean",
  "Cayman Islands": "Latin America & Caribbean",
  "St. Lucia": "Latin America & Caribbean",
  "Dominican Republic": "Latin America & Caribbean",
  "Saint Vincent and the Grenadines": "Latin America & Caribbean",
  // Europe
  Italy: "Europe",
  "United Kingdom": "Europe",
  UK: "Europe",
  France: "Europe",
  Ireland: "Europe",
  Switzerland: "Europe",
  Portugal: "Europe",
  Spain: "Europe",
  Germany: "Europe",
  Austria: "Europe",
  Iceland: "Europe",
  Greece: "Europe",
  Montenegro: "Europe",
  Finland: "Europe",
  Norway: "Europe",
  Netherlands: "Europe",
  Denmark: "Europe",
  Slovenia: "Europe",
  // Middle East
  "United Arab Emirates": "Middle East",
  Oman: "Middle East",
  "Saudi Arabia": "Middle East",
  Israel: "Middle East",
  // Africa
  "South Africa": "Africa",
  Morocco: "Africa",
  Kenya: "Africa",
  Tanzania: "Africa",
  Rwanda: "Africa",
  Zambia: "Africa",
  Botswana: "Africa",
  Egypt: "Africa",
  Seychelles: "Africa",
  // Asia-Pacific
  Australia: "Asia-Pacific",
  Japan: "Asia-Pacific",
  Thailand: "Asia-Pacific",
  "New Zealand": "Asia-Pacific",
  India: "Asia-Pacific",
  Indonesia: "Asia-Pacific",
  Singapore: "Asia-Pacific",
  Vietnam: "Asia-Pacific",
  Fiji: "Asia-Pacific",
  Maldives: "Asia-Pacific",
  Cambodia: "Asia-Pacific",
  Malaysia: "Asia-Pacific",
  "Sri Lanka": "Asia-Pacific",
  "French Polynesia": "Asia-Pacific",
};

export function worldRegionForCountry(country: string): (typeof RESIDENCE_WORLD_REGIONS)[number] {
  return COUNTRY_TO_WORLD_REGION[country] ?? "Other";
}

// ── offsite-outing — corporate-eligible party items ─────────────────────────
// `internal` is a real `AudienceTag` (used by OO's own residences/experiences),
// but the party-venue `deriveRouting` case (tagging-rules.ts) can NEVER
// produce it — its audience set is always `ALL_AUD` (corporate/clients/
// bachelor/bachelorette) or a per-type restriction drawn from the same set;
// `internal` isn't in either vocabulary for party items. Crossing it here
// would manufacture a guaranteed-always-zero cell in every region — a
// tagging-rule/taxonomy mismatch, not a content gap Task 13 could ever fix by
// pulling more data. Scoped to the two audience values that can actually
// appear on a corporate-eligible party-venue row.
export const OUTING_AUDIENCES = ["corporate", "clients"] as const;

/**
 * Per-wizard bounded input space. Every wizard gets exactly two axes so the
 * cross product stays small: bestman/moh 5×3=15, handicap/tdf 9×4=36,
 * offsite-retreat 15×7=105, offsite-outing 5×2=10. ~200 cells total across
 * six wizards — enumerable in milliseconds, no combinatorial blow-up.
 */
export const WIZARD_INPUT_SPACE: Record<WizardTag, InputAxis[]> = {
  bestman: [
    { name: "region", values: PARTY_REGIONS },
    { name: "partyVibe", values: PARTY_VIBES },
  ],
  moh: [
    { name: "region", values: PARTY_REGIONS },
    { name: "partyVibe", values: PARTY_VIBES },
  ],
  handicap: [
    { name: "golfRegion", values: GOLF_REGIONS },
    { name: "tier", values: GOLF_TIERS },
  ],
  tdf: [
    { name: "golfRegion", values: GOLF_REGIONS },
    { name: "tier", values: GOLF_TIERS },
  ],
  "offsite-retreat": [
    { name: "setting", values: RESIDENCE_SETTINGS },
    { name: "worldRegion", values: RESIDENCE_WORLD_REGIONS },
  ],
  "offsite-outing": [
    { name: "region", values: PARTY_REGIONS },
    { name: "audience", values: OUTING_AUDIENCES },
  ],
};
