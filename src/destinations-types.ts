/**
 * Canonical destination schema shared across the wedding-planning sites
 * (Maid of Honor HQ, BESTMAN HQ). Each repo applies a thin brand overlay
 * (see destinations-overlay.ts) to convert these canonical entries to its
 * own typed shape.
 *
 * Why canonical instead of duplicated: previously each repo carried its
 * own destinations-*.ts files, drift was inevitable, and adding a city
 * meant writing it twice with two voices. With a canonical core + per-
 * brand `presentation` blocks, a new city is written once and serves
 * both engines.
 *
 * The big differences the overlay handles:
 *  - score → `bacheloretteScore` (MOH) | `bachelorScore` (BESTMAN)
 *  - nightlife `{moh,bestman}Friendly` flags
 *  - activity-type enums diverge between repos; overlay filters out
 *    entries whose type isn't in the destination repo's union
 *  - presentation block (tagline + description + highlights) per brand
 */

import type { WizardTag, AudienceTag, ProductTag, PriceTier } from "./tags";

export type CanonicalRegion = "south" | "west" | "northeast" | "midwest" | "international";
export type PartyVibe = "chill" | "balanced" | "unhinged";

/**
 * Baked universe tags. Optional so the (un-baked) source data files still
 * typecheck; `bakeDestination` (destinations-bake.ts) fills them at module load
 * before `sharedDestinations` is exported. See tags.ts for the vocabulary.
 */
export interface UniverseTags {
  wizards?: WizardTag[];
  audiences?: AudienceTag[];
  products?: ProductTag[];
  priceTier?: PriceTier;
}

export interface CanonicalAirport {
  code: string;
  name: string;
  driveMinutes: number;
}

export interface CanonicalNightlife extends UniverseTags {
  name: string;
  type: string; // "club" | "bar" | "rooftop" | "honky-tonk" | ... — unioned per-brand
  vibe: PartyVibe;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  highlight: string;
  reservationNeeded: boolean;
  groupFriendly: boolean;
  lateNight: boolean;
  brands: ("moh" | "bestman" | "both")[]; // which sites should surface this venue
  url?: string;
  dressCode?: string;
}

export interface CanonicalActivity extends UniverseTags {
  name: string;
  type: string; // string for forward compat; overlays narrow per brand
  duration: string;
  pricePerPerson: [number, number];
  groupMin: number;
  groupMax: number;
  highlight: string;
  bestFor: string;
  brands: ("moh" | "bestman" | "both")[];
  url?: string;

  // ── Tier A additions (2026-07-31) — all OPTIONAL, so no existing row breaks.
  // Every one is a gap the CURRENT wizards have, not a Friendsmoon/Engagedmoon
  // special case. Populated by research, never by an LLM at generation time.

  /**
   * Stable row identity. Rows have had NO id, so nothing can reference
   * anything: stored plans' `removedItems[]` keys off brittle `item_path`
   * strings, and `TAG_OVERRIDES` keys off `${destId}|${category}|${name}`,
   * which breaks the moment a name is edited. Required before any feature that
   * pairs one row to another.
   */
  id?: string;

  /**
   * Real coordinates. NOTHING in the universe has them, which is why no honest
   * sunset/golden-hour time can be computed for any row — a stated clock time
   * without these is fabricated. Also unlocks drive-time and geographic
   * clustering of an itinerary for every wizard.
   */
  lat?: number;
  lng?: number;

  /**
   * Does this need booking ahead, and how far? `reservationNeeded` already
   * existed on CanonicalNightlife and nowhere else, so the shape is copied
   * rather than invented. Absent means UNKNOWN — never render it as "no
   * reservation needed", which is a claim we cannot source.
   */
  reservationNeeded?: boolean;
  reservationLeadDays?: number;

  /** Can a guest walk up unassisted? Mirrors golf's `walkable: boolean`. */
  walkUpAccess?: boolean;

}

export interface CanonicalDining extends UniverseTags {
  name: string;
  cuisine: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  highlight: string;
  bestFor: string;
  groupFriendly: boolean;
  brands: ("moh" | "bestman" | "both")[];
  url?: string;

  // ── Tier A additions (2026-07-31), all OPTIONAL. See CanonicalActivity.
  id?: string;
  lat?: number;
  lng?: number;

  /**
   * Reservation reality. `groupFriendly` is true on 1,290 of 1,319 rows, so it
   * carries almost no signal; these do. Absent = UNKNOWN, never "walk in".
   */
  reservationNeeded?: boolean;
  reservationLeadDays?: number;

  /**
   * Seats in a private room / at a chef's table. Only 11 of 1,319 rows mention
   * private dining anywhere, and only in prose — so "a private room for 14"
   * cannot be answered from data today. A real BestMan HQ need, not just a
   * Friendsmoon one.
   */
  privateDiningSeats?: number;

}

export interface CanonicalLodging extends UniverseTags {
  name: string;
  type: "house" | "hotel" | "resort" | "airbnb" | "boutique-hotel" | "hostel";
  pricePerNight: [number, number];
  perRoom: boolean;
  maxGuests: number;
  highlight: string;
  url?: string;

  // ── Tier A additions (2026-07-31), all OPTIONAL. See CanonicalActivity.
  id?: string;
  lat?: number;
  lng?: number;

  /**
   * Room inventory. NO occupancy data exists anywhere in the universe today —
   * not here and not on SharedResidence — so "who sleeps where" cannot be
   * answered for any wizard. Only 54 of 771 rows carry a bedroom count at all,
   * and only as prose inside `name`/`highlight` ("Lake-view 5BR"). Wanted by
   * BestMan HQ and MOH (sleeping arrangements), Offsite retreats (room
   * assignment) and Friendsmoon's couples path alike.
   */
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;

}

export interface CanonicalTransport extends UniverseTags {
  name: string;
  type: "party-bus" | "limo" | "shuttle" | "rideshare" | "charter";
  priceRange: string;
  highlight: string;
  url?: string;
}

export interface BrandPresentation {
  tagline: string;
  description: string;
  highlights?: string[];
}

export interface CanonicalDestination extends UniverseTags {
  id: string;
  city: string;
  state: string;
  region: CanonicalRegion;
  nearestAirport: CanonicalAirport;
  bestMonths: number[];
  vibes: PartyVibe[];
  score: number; // 1-10, maps to bacheloretteScore / bachelorScore via overlay
  nightlife: CanonicalNightlife[];
  dining: CanonicalDining[];
  activities: CanonicalActivity[];
  lodging: CanonicalLodging[];
  transport: CanonicalTransport[];
  presentation: {
    moh: BrandPresentation;
    bestman: BrandPresentation;
  };
}
