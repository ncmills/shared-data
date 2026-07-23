/**
 * destinations-bake.ts — bake the universe tags onto every canonical item.
 *
 * Runs once at module load (index.ts) over `sharedDestinations`, so every item
 * carries `wizards / audiences / products / priceTier` as real per-item fields
 * (not overlay-computed per request). The overlays (destinations-overlay.ts)
 * then become pure filters over these baked tags.
 *
 * Behaviour-preserving by construction:
 *  - `wizards` for bestman/moh reproduces the old `filterByBrand` exactly
 *    (moh iff brands⊇moh|both; bestman iff brands⊇bestman|both).
 *  - `offsite-outing` is added iff the item is corporate-eligible, which equals
 *    the old Offsite overlay's keep-condition (audiences includes "corporate").
 *  - `audiences` reproduces the old overlay's per-item audience computation
 *    (activityAudiences(type) / nightlifeAudiences(vibe) / ALL for dining).
 *  Lodging/transport carry no `brands` and reach every wizard whose engine
 *  reads party-venue data — party brands + offsite-outing + offsite-retreat
 *  (NOT handicap; see HOUSING_WIZARDS). Housing is trip-type-agnostic.
 */

import type {
  CanonicalDestination,
  CanonicalActivity,
  CanonicalNightlife,
  CanonicalDining,
  CanonicalLodging,
  CanonicalTransport,
} from "./destinations-types";
import {
  type WizardTag,
  type AudienceTag,
  type ProductTag,
  activityAudiences,
  nightlifeAudiences,
  wizardsFromBrands,
  audiencesFromBrands,
  productsFromBrands,
  tierFromDollarSigns,
  tierFromPerPerson,
  tierFromPerNight,
} from "./tags";

type Brand = "moh" | "bestman" | "both";

/**
 * Hand-tuning overrides, keyed `${destId}|${category}|${itemName}`. A partial
 * tag object here is shallow-merged over the derived tags for that one item —
 * the "overrideable" half of "per-item and overrideable". Empty today.
 */
export const TAG_OVERRIDES: Record<
  string,
  Partial<{ wizards: WizardTag[]; audiences: AudienceTag[]; products: ProductTag[] }>
> = {};

const uniq = <T>(xs: T[]): T[] => Array.from(new Set(xs));

/** corporate-eligible (would survive the Offsite overlay) → gets offsite-outing. */
const outingWizards = (audiences: AudienceTag[]): WizardTag[] =>
  audiences.includes("corporate") ? ["offsite-outing"] : [];
const outingProducts = (audiences: AudienceTag[]): ProductTag[] =>
  audiences.includes("corporate") ? ["outing"] : [];

function applyOverride<T extends object>(key: string, base: T): T {
  const o = TAG_OVERRIDES[key];
  return o ? { ...base, ...o } : base;
}

function bakeActivity(destId: string, a: CanonicalActivity): CanonicalActivity {
  const audiences = activityAudiences(a.type) as AudienceTag[];
  const wizards = uniq([...wizardsFromBrands(a.brands as Brand[]), ...outingWizards(audiences)]);
  const products = uniq([...productsFromBrands(a.brands as Brand[]), ...outingProducts(audiences)]);
  return applyOverride(`${destId}|activity|${a.name}`, {
    ...a,
    wizards,
    audiences,
    products,
    priceTier: tierFromPerPerson(a.pricePerPerson),
  });
}

function bakeNightlife(destId: string, n: CanonicalNightlife): CanonicalNightlife {
  const audiences = nightlifeAudiences(n.vibe) as AudienceTag[];
  const wizards = uniq([...wizardsFromBrands(n.brands as Brand[]), ...outingWizards(audiences)]);
  const products = uniq([...productsFromBrands(n.brands as Brand[]), ...outingProducts(audiences)]);
  return applyOverride(`${destId}|nightlife|${n.name}`, {
    ...n,
    wizards,
    audiences,
    products,
    priceTier: tierFromDollarSigns(n.priceRange),
  });
}

function bakeDining(destId: string, d: CanonicalDining): CanonicalDining {
  // Dining is all-audience (corporate-eligible) by default.
  const audiences = ["corporate", "clients", "bachelor", "bachelorette"] as AudienceTag[];
  const wizards = uniq([...wizardsFromBrands(d.brands as Brand[]), "offsite-outing" as WizardTag]);
  const products = uniq([...productsFromBrands(d.brands as Brand[]), "outing" as ProductTag]);
  return applyOverride(`${destId}|dining|${d.name}`, {
    ...d,
    wizards,
    audiences,
    products,
    priceTier: tierFromDollarSigns(d.priceRange),
  });
}

// Lodging/transport are trip-type-agnostic: a group hotel/house or a shuttle is
// valid housing / getting-around for ANY plan. Unlike events, they reach every
// wizard whose ENGINE actually READS party-venue data (src/engine-reads.ts):
// the two party brands, offsite-outing, AND offsite-retreat. Nick 2026-07-22:
// "the NOLA housing can be used in OO / HHQ / MOH even if the events cannot."
// NOTE handicap (HHQ) is intentionally NOT here: per ENGINE_READS it reads only
// golf-course/golf-destination, so tagging party-lodging for it would be an
// ORPHAN (tag with no reader — the coverage audit rejects it). Giving HHQ this
// housing needs either wiring handicap to read party-venue or sourcing its
// lodging from residences — a decision flagged to Nick, not silently tagged.
// Never brand- or audience-filtered by any overlay (no `brands`).
const HOUSING_WIZARDS: WizardTag[] = ["bestman", "moh", "offsite-outing", "offsite-retreat"];
const ALL_AUD: AudienceTag[] = ["corporate", "clients", "bachelor", "bachelorette"];
const HOUSING_PRODUCTS: ProductTag[] = ["bach-party", "bachelorette", "outing", "retreat"];

function bakeLodging(destId: string, l: CanonicalLodging): CanonicalLodging {
  return applyOverride(`${destId}|lodging|${l.name}`, {
    ...l,
    wizards: HOUSING_WIZARDS,
    audiences: ALL_AUD,
    products: HOUSING_PRODUCTS,
    priceTier: tierFromPerNight(l.pricePerNight),
  });
}

function bakeTransport(destId: string, t: CanonicalTransport): CanonicalTransport {
  return applyOverride(`${destId}|transport|${t.name}`, {
    ...t,
    wizards: HOUSING_WIZARDS,
    audiences: ALL_AUD,
    products: HOUSING_PRODUCTS,
  });
}

/** Bake one destination: tag every item, then roll item tags up to the city. */
export function bakeDestination(c: CanonicalDestination): CanonicalDestination {
  const nightlife = c.nightlife.map((n) => bakeNightlife(c.id, n));
  const dining = c.dining.map((d) => bakeDining(c.id, d));
  const activities = c.activities.map((a) => bakeActivity(c.id, a));
  const lodging = c.lodging.map((l) => bakeLodging(c.id, l));
  const transport = c.transport.map((t) => bakeTransport(c.id, t));

  const items = [...nightlife, ...dining, ...activities, ...lodging, ...transport];
  const wizards = uniq(items.flatMap((i) => i.wizards ?? []));
  const audiences = uniq(items.flatMap((i) => i.audiences ?? []));
  const products = uniq(items.flatMap((i) => i.products ?? []));

  return { ...c, nightlife, dining, activities, lodging, transport, wizards, audiences, products };
}
