/**
 * tags.ts — the single tag vocabulary for the shared universe.
 *
 * Every plan-driving item in the cache is tagged on four orthogonal axes so
 * that each wizard pulls only what it should, and so the universe can be
 * queried by-location OR by-event with price + audience filters either way:
 *
 *   WHO   wizards[]    — which wizard surfaces the item (the routing key)
 *         audiences[]  — which audiences it suits
 *   WHAT  activityTypes / activity categories (see CATEGORY_OF)
 *   PRICE priceTier (1–4) + a per-person band  (selection-neutral in phase A)
 *   WHERE city / state / region / country  (carried on the item, not here)
 *
 * The legacy `brands`, `sites`, and `products` tags stay on items for
 * back-compat and are DERIVED from / kept in sync with the axes above.
 */

/** The five consumer wizards. Offsite is one domain, two wizards. */
export type WizardTag =
  | "bestman"
  | "moh"
  | "tdf"
  | "offsite-retreat"
  | "offsite-outing"
  | "handicap";

/** Brand domains (derived from wizards; kept for back-compat with golf/residence `sites`). */
export type SiteTag = "moh" | "bestman" | "tdf" | "offsite" | "handicap";

export type ProductTag =
  | "bach-party"
  | "bachelorette"
  | "golf-trip"
  | "retreat"
  | "outing";

export type AudienceTag =
  | "bachelor"
  | "bachelorette"
  | "corporate"
  | "clients"
  | "internal";

/**
 * Back-compat alias. The pre-tags universe used `UniverseAudience` (no
 * `internal`); OO imports it. Keep it as a distinct, narrower type so existing
 * call sites compile unchanged.
 */
export type UniverseAudience = "corporate" | "clients" | "bachelor" | "bachelorette";

export type PriceTier = 1 | 2 | 3 | 4;

export const ALL_AUDIENCES: UniverseAudience[] = [
  "corporate",
  "clients",
  "bachelor",
  "bachelorette",
];

// ---------------------------------------------------------------------------
// WHO — audience taxonomy (moved here from destinations-overlay.ts so the
// vocabulary lives in one place; the overlay now imports from here).
// ---------------------------------------------------------------------------

/**
 * Per-activity-type audience tags. Unlisted types default to ALL audiences
 * (so a new corporate-appropriate type is included automatically); list a type
 * here to RESTRICT it — gambling, adult-entertainment, and party-only staples
 * are tagged bachelor/ette-only so they never surface for a corporate client.
 *
 * This is the editable denylist that drives BOTH the per-item bake and the
 * (pure) Offsite overlay. Edit here to (de)qualify a type for corporate.
 */
export const ACTIVITY_AUDIENCE_TAGS: Record<string, UniverseAudience[]> = {
  "poker-night": ["bachelor", "bachelorette"],
  casino: ["bachelor", "bachelorette"],
  "cigar-bar": ["bachelor"],
  boudoir: ["bachelorette"],
  "pole-class": ["bachelorette"],
  "burlesque-class": ["bachelorette"],
  "drag-brunch": ["bachelorette"],
  "pool-party": ["bachelor", "bachelorette"],
  "silent-disco": ["bachelor", "bachelorette"],
  "brunch-crawl": ["bachelor", "bachelorette"],
  // A hired private second line (brass band + NOPD escort) is a bachelor-party
  // centerpiece — kept off corporate (offsite-outing) per Nick 2026-07-22: the
  // EVENT stays Best Man HQ even though NOLA housing crosses to OO/HHQ/MOH.
  // (Widen to include "bachelorette" if MOH should ever surface it.)
  "second-line-parade": ["bachelor"],
};

export function activityAudiences(type: string): UniverseAudience[] {
  return ACTIVITY_AUDIENCE_TAGS[type] ?? ALL_AUDIENCES;
}

/** Nightlife is audience-tagged by vibe: an "unhinged" room isn't corporate. */
export function nightlifeAudiences(vibe: string): UniverseAudience[] {
  return vibe === "unhinged" ? ["bachelor", "bachelorette"] : ALL_AUDIENCES;
}

// ---------------------------------------------------------------------------
// WHO — wizard routing derived from the legacy `brands` party tag.
// ---------------------------------------------------------------------------

type Brand = "moh" | "bestman" | "both";

/** Party brands → bachelor/ette wizards. Offsite-outing is added separately,
 *  based on corporate audience-eligibility, NOT on brand. */
export function wizardsFromBrands(brands: Brand[]): WizardTag[] {
  const out: WizardTag[] = [];
  if (brands.includes("bestman") || brands.includes("both")) out.push("bestman");
  if (brands.includes("moh") || brands.includes("both")) out.push("moh");
  return out;
}

export function audiencesFromBrands(brands: Brand[]): AudienceTag[] {
  const out: AudienceTag[] = [];
  if (brands.includes("bestman") || brands.includes("both")) out.push("bachelor");
  if (brands.includes("moh") || brands.includes("both")) out.push("bachelorette");
  return out;
}

export function productsFromBrands(brands: Brand[]): ProductTag[] {
  const out: ProductTag[] = [];
  if (brands.includes("bestman") || brands.includes("both")) out.push("bach-party");
  if (brands.includes("moh") || brands.includes("both")) out.push("bachelorette");
  return out;
}

// ---------------------------------------------------------------------------
// PRICE — normalized tier. Selection-NEUTRAL in phase A (nothing filters on it
// yet); baked now so phase B can price one wizard's items for another and roll
// up a unified budget. Thresholds are deliberately coarse.
// ---------------------------------------------------------------------------

export function tierFromDollarSigns(pr: "$" | "$$" | "$$$" | "$$$$"): PriceTier {
  return pr.length as PriceTier;
}

/** Per-person USD band → tier. Tuned to the party schema's typical per-head spend. */
export function tierFromPerPerson(band: [number, number]): PriceTier {
  const mid = (band[0] + band[1]) / 2;
  if (mid < 75) return 1;
  if (mid < 200) return 2;
  if (mid < 500) return 3;
  return 4;
}

/** Per-night lodging band → tier (whole-unit nightly, not per-head). */
export function tierFromPerNight(band: [number, number]): PriceTier {
  const mid = (band[0] + band[1]) / 2;
  if (mid < 300) return 1;
  if (mid < 800) return 2;
  if (mid < 2000) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// WHAT — coarse activity categories (the buckets the Offsite OUTING wizard
// queries by). Fine activity `type` strings map up to one or more categories.
//
// FORWARD INFRASTRUCTURE: this enables byEvent() queries at a coarse grain. It
// is NOT yet consumed (OO keeps its own cityActivitiesForFocus until the OO
// migration step). RECONCILE this map verbatim against OO's focus→type mapping
// in src/lib/locations.ts at that step before anything depends on it.
// ---------------------------------------------------------------------------

export type ActivityCategory =
  | "golf"
  | "culinary"
  | "water"
  | "field-sports"
  | "motorsport"
  | "wellness"
  | "nightlife"
  | "equestrian"
  | "cycling"
  | "winter"
  | "give-back"
  | "adventure"
  | "cultural"
  | "social"
  | "gaming";

export const CATEGORY_OF: Record<string, ActivityCategory[]> = {
  golf: ["golf"],
  "wine-tour": ["culinary"],
  "cooking-class": ["culinary"],
  "food-tour": ["culinary"],
  "cocktail-class": ["culinary"],
  "brewery-tour": ["culinary"],
  "distillery-tour": ["culinary"],
  brunch: ["culinary", "social"],
  "boat-cruise": ["water"],
  "sunset-cruise": ["water"],
  "yacht-charter": ["water"],
  kayaking: ["water"],
  rafting: ["water", "adventure"],
  sailing: ["water"],
  snorkeling: ["water"],
  "shooting-range": ["field-sports"],
  fishing: ["field-sports"],
  "go-karts": ["motorsport"],
  racing: ["motorsport"],
  atv: ["motorsport", "adventure"],
  spa: ["wellness"],
  "spa-day": ["wellness"],
  "yoga-retreat": ["wellness"],
  "sound-bath": ["wellness"],
  "horseback-riding": ["equestrian"],
  biking: ["cycling"],
  skiing: ["winter"],
  "dog-sledding": ["winter", "adventure"],
  "sleigh-ride": ["winter"],
  hiking: ["adventure"],
  "zip-lining": ["adventure"],
  canyoneering: ["adventure"],
  skydiving: ["adventure"],
  "adventure-park": ["adventure"],
  "escape-room": ["social", "gaming"],
  "axe-throwing": ["social"],
  paintball: ["social", "field-sports"],
  karaoke: ["social", "nightlife"],
  pickleball: ["social"],
  casino: ["gaming"],
  "poker-night": ["gaming"],
  tour: ["cultural"],
  "walking-tour": ["cultural"],
  "mural-tour": ["cultural"],
  "ghost-tour": ["cultural"],
  "farm-tour": ["cultural"],
  "rooftop-bar": ["nightlife"],
  "cigar-bar": ["nightlife"],
};

/** Coarse category → the fine `type` strings under it (inverse of CATEGORY_OF). */
export function typesForCategory(cat: ActivityCategory): string[] {
  return Object.keys(CATEGORY_OF).filter((t) => CATEGORY_OF[t].includes(cat));
}
