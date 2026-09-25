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
  isGeneralAudience,
  wizardsFromBrands,
  wizardsForActivity,
  audiencesFromBrands,
  productsFromBrands,
  tierFromDollarSigns,
  tierFromPerPerson,
  tierFromPerNight,
} from "./tags";
import { assignIds, legacyKeyToId, partyRowIdBase, type RowCategory } from "./row-ids";

type Brand = "moh" | "bestman" | "both";

/**
 * Hand-tuning overrides. A partial tag object here is shallow-merged over the
 * derived tags for that one item — the "overrideable" half of "per-item and
 * overrideable".
 *
 * Keys are resolved to a ROW ID (src/row-ids.ts) since CORPUS-M3a, and matched
 * against the row's `id` first, then its `aliases`. A key may be written either
 * way:
 *   - the legacy `${destId}|${category}|${itemName}` (every key below), which is
 *     turned into an id by `legacyKeyToId` — so it no longer depends on the
 *     exact punctuation of the name, only on its normalised slug;
 *   - or the id itself: `bend-or--lodging--tetherow-lodge`.
 * After a venue is renamed, the override keeps applying as long as the renamed
 * row carries its old id in `aliases`. `scripts/verify-universe.ts` fails on a
 * key that resolves to no row, except the known-dead ones it lists.
 */
export const TAG_OVERRIDES: Record<
  string,
  Partial<{ wizards: WizardTag[]; audiences: AudienceTag[]; products: ProductTag[] }>
> = {
  // moh removed — violates moh.json cross_pollination.must_not_have (golf or bachelor-coded content)
  "amelia-island-fl|lodging|Omni Amelia Island Resort":                    { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "atlantic-city-nj|lodging|Borgata Hotel Casino & Spa":                   { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "bend-or|lodging|Tetherow Lodge":                                         { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "birmingham-al|activity|Topgolf Birmingham":                              { wizards: ["bestman", "offsite-outing", "friendsmoon", "engagedmoon"] },
  "coeur-dalene-id|lodging|Coeur d'Alene Resort":                          { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "destin-fl|lodging|Sandestin Golf and Beach Resort":                      { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "fredericksburg-tx|nightlife|Garrison Brothers Distillery tasting room":  { wizards: ["offsite-outing", "friendsmoon", "engagedmoon"] },
  "galena-il|lodging|Eagle Ridge Resort":                                   { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "hilton-head-sc|lodging|Palmetto Dunes Airbnb Villas":                   { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "hilton-head-sc|lodging|Sea Pines Vacation Home Rentals":                { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "hilton-head-sc|lodging|The Inn & Club at Harbour Town":                 { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "kennebunkport-me|transport|Intown Trolley + private van":               { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "kiawah-island-sc|lodging|Kiawah Island Golf Resort Villas":             { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "kiawah-island-sc|lodging|The Sanctuary at Kiawah Island Golf Resort":   { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "lake-geneva-wi|lodging|Grand Geneva Resort & Spa":                      { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "lake-havasu-city-az|nightlife|Barley Brothers Brewery":                 { wizards: ["bestman", "offsite-outing", "friendsmoon", "engagedmoon"] },
  "lake-of-the-ozarks-mo|lodging|Lodge of Four Seasons":                   { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "myrtle-beach-sc|lodging|Airbnb Condos at Barefoot Resort":              { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "myrtle-beach-sc|transport|Myrtle Beach Party Bus":                      { wizards: ["bestman", "offsite-outing", "offsite-retreat", "friendsmoon", "engagedmoon"] },
  "new-orleans-la|nightlife|Harrah's New Orleans Casino":                  { wizards: ["bestman", "offsite-outing", "friendsmoon", "engagedmoon"] },
};

/** TAG_OVERRIDES re-keyed by row id. Two keys that name the same row throw. */
export const OVERRIDES_BY_ID: ReadonlyMap<string, (typeof TAG_OVERRIDES)[string]> = (() => {
  const m = new Map<string, (typeof TAG_OVERRIDES)[string]>();
  for (const [key, o] of Object.entries(TAG_OVERRIDES)) {
    const id = legacyKeyToId(key);
    if (m.has(id)) throw new Error(`TAG_OVERRIDES: two keys resolve to the same row id "${id}"`);
    m.set(id, o);
  }
  return m;
})();

const uniq = <T>(xs: T[]): T[] => Array.from(new Set(xs));

/** corporate-eligible (would survive the Offsite overlay) → gets offsite-outing. */
const outingWizards = (audiences: AudienceTag[]): WizardTag[] =>
  audiences.includes("corporate") ? ["offsite-outing"] : [];
const outingProducts = (audiences: AudienceTag[]): ProductTag[] =>
  audiences.includes("corporate") ? ["outing"] : [];

/**
 * Friendsmoon + Engagedmoon reach every row the per-type taxonomy did NOT lock
 * to a bachelor/bachelorette staple — see `isGeneralAudience` in tags.ts for
 * why that predicate is the right one and why it is not spelled
 * `includes("corporate")` here.
 *
 * This is a per-ITEM gate, so a Nashville honky-tonk crawl can reach Friendsmoon
 * while the same city's boudoir shoot does not. The ~203 party-locked rows
 * (poker-night 67, brunch-crawl 29, cigar-bar 26, drag-brunch 20, casino 19,
 * pool-party 19, boudoir 16, …) are excluded automatically and permanently by
 * the taxonomy, with no denylist to maintain here.
 *
 * Engagedmoon is tagged on the same signal even though most rows carry
 * `groupMin: 4` and a proposal trip is a party of two. That is correct: TAG ≠
 * SURFACED (see engine-reads.ts). Group size is an engine-side filter on
 * `groupMin`/`groupMax`, not a routing decision — encoding it here would bake a
 * query into the cache and make the row invisible to any future two-person use.
 */
const moonWizards = (audiences: AudienceTag[]): WizardTag[] =>
  isGeneralAudience(audiences) ? ["friendsmoon", "engagedmoon"] : [];
const moonProducts = (audiences: AudienceTag[]): ProductTag[] =>
  isGeneralAudience(audiences) ? ["friends-trip", "proposal-trip"] : [];

/** By id, then by alias. The row already carries its id (see `withIds`). */
function applyOverride<T extends { id?: string; aliases?: string[] }>(base: T): T {
  let o = base.id ? OVERRIDES_BY_ID.get(base.id) : undefined;
  for (const a of base.aliases ?? []) o ??= OVERRIDES_BY_ID.get(a);
  return o ? { ...base, ...o } : base;
}

/**
 * Put the row id FIRST on every row of one category, disambiguating collisions
 * in source order (row-ids.ts). An authored id is kept as-is.
 */
function withIds<T extends { name: string; id?: string }>(destId: string, category: RowCategory, rows: T[]): T[] {
  const ids = assignIds(rows, (r) => partyRowIdBase(destId, category, r.name));
  return rows.map((r, i) => ({ id: ids[i], ...r }));
}

function bakeActivity(destId: string, a: CanonicalActivity): CanonicalActivity {
  const audiences = activityAudiences(a.type) as AudienceTag[];
  // Single derivation, shared with the brand-rule path — see wizardsForActivity
  // in tags.ts for why the bake must not compute this itself (golf was reaching
  // moh here while tagging-rules.ts forbade it).
  const wizards = wizardsForActivity(a.type, a.brands as Brand[]);
  const products = uniq([
    ...productsFromBrands(a.brands as Brand[]),
    ...outingProducts(audiences),
    ...moonProducts(audiences),
  ]);
  return applyOverride({
    ...a,
    wizards,
    audiences,
    products,
    priceTier: tierFromPerPerson(a.pricePerPerson),
  });
}

function bakeNightlife(destId: string, n: CanonicalNightlife): CanonicalNightlife {
  const audiences = nightlifeAudiences(n.vibe) as AudienceTag[];
  const wizards = uniq([
    ...wizardsFromBrands(n.brands as Brand[]),
    ...outingWizards(audiences),
    ...moonWizards(audiences),
  ]);
  const products = uniq([
    ...productsFromBrands(n.brands as Brand[]),
    ...outingProducts(audiences),
    ...moonProducts(audiences),
  ]);
  return applyOverride({
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
  const wizards = uniq([
    ...wizardsFromBrands(d.brands as Brand[]),
    "offsite-outing" as WizardTag,
    ...moonWizards(audiences),
  ]);
  const products = uniq([
    ...productsFromBrands(d.brands as Brand[]),
    "outing" as ProductTag,
    ...moonProducts(audiences),
  ]);
  return applyOverride({
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
// Never brand- or audience-filtered by any overlay (no `brands`); the overlays DO
// honor the baked `wizards` tag (a pure tag filter), so a TAG_OVERRIDES removal on
// a lodging/transport row actually lands — see wizard-reach.test.ts PRECISION.
// friendsmoon/engagedmoon join for the same reason the four above are here: a
// group house, a boutique hotel room or an airport shuttle is valid housing and
// getting-around for ANY trip type, and both wizards' ENGINE_READS include
// party-venue. This is the single cheapest reach in the repo — 771 lodging +
// 462 transport rows become available to both new sites with zero new data and
// zero research.
const HOUSING_WIZARDS: WizardTag[] = [
  "bestman",
  "moh",
  "offsite-outing",
  "offsite-retreat",
  "friendsmoon",
  "engagedmoon",
];
const ALL_AUD: AudienceTag[] = ["corporate", "clients", "bachelor", "bachelorette"];
const HOUSING_PRODUCTS: ProductTag[] = [
  "bach-party",
  "bachelorette",
  "outing",
  "retreat",
  "friends-trip",
  "proposal-trip",
];

function bakeLodging(destId: string, l: CanonicalLodging): CanonicalLodging {
  return applyOverride({
    ...l,
    wizards: HOUSING_WIZARDS,
    audiences: ALL_AUD,
    products: HOUSING_PRODUCTS,
    priceTier: tierFromPerNight(l.pricePerNight),
  });
}

function bakeTransport(destId: string, t: CanonicalTransport): CanonicalTransport {
  return applyOverride({
    ...t,
    wizards: HOUSING_WIZARDS,
    audiences: ALL_AUD,
    products: HOUSING_PRODUCTS,
  });
}

/** Bake one destination: tag every item, then roll item tags up to the city. */
export function bakeDestination(c: CanonicalDestination): CanonicalDestination {
  const nightlife = withIds(c.id, "nightlife", c.nightlife).map((n) => bakeNightlife(c.id, n));
  const dining = withIds(c.id, "dining", c.dining).map((d) => bakeDining(c.id, d));
  const activities = withIds(c.id, "activity", c.activities).map((a) => bakeActivity(c.id, a));
  const lodging = withIds(c.id, "lodging", c.lodging).map((l) => bakeLodging(c.id, l));
  const transport = withIds(c.id, "transport", c.transport).map((t) => bakeTransport(c.id, t));

  const items = [...nightlife, ...dining, ...activities, ...lodging, ...transport];
  const wizards = uniq(items.flatMap((i) => i.wizards ?? []));
  const audiences = uniq(items.flatMap((i) => i.audiences ?? []));
  const products = uniq(items.flatMap((i) => i.products ?? []));

  return { ...c, nightlife, dining, activities, lodging, transport, wizards, audiences, products };
}
