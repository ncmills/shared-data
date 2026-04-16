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

export type CanonicalRegion = "south" | "west" | "northeast" | "midwest" | "international";
export type PartyVibe = "chill" | "balanced" | "unhinged";

export interface CanonicalAirport {
  code: string;
  name: string;
  driveMinutes: number;
}

export interface CanonicalNightlife {
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

export interface CanonicalActivity {
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
}

export interface CanonicalDining {
  name: string;
  cuisine: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  highlight: string;
  bestFor: string;
  groupFriendly: boolean;
  brands: ("moh" | "bestman" | "both")[];
  url?: string;
}

export interface CanonicalLodging {
  name: string;
  type: "house" | "hotel" | "resort" | "airbnb" | "boutique-hotel" | "hostel";
  pricePerNight: [number, number];
  perRoom: boolean;
  maxGuests: number;
  highlight: string;
  url?: string;
}

export interface CanonicalTransport {
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

export interface CanonicalDestination {
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
