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

/**
 * The seven consumer wizards. Offsite is one domain, two wizards.
 *
 * THIS ARRAY IS THE SOURCE OF TRUTH — `WizardTag` is derived from it, not the
 * other way round. Every guard that needs to enumerate wizards at RUNTIME
 * (verify-universe's vocabulary set, the audit's per-wizard counters, the
 * "is every map keyed by every wizard" tests) reads this array, so adding a
 * wizard updates all of them at once instead of leaving a hand-copied literal
 * behind. A hardcoded list of these names anywhere else is a bug.
 *
 * RETIRED — `tdf` (2026-07-31). The golf-trip wizard moved to Handicap HQ in
 * the 2026-07-02 split; tourdefore.com became a personal golf site + pro shop
 * and imports nothing from this package. The tag lingered as "legacy/back-compat"
 * and cost real accuracy: 999 golf-course + 234 golf-destination rows were
 * routed to a consumer that does not exist, and the coverage audit enumerated a
 * 36-cell input space for a product nobody ships. ALL golf now routes to
 * `handicap`, and the `tdf` SITE label was migrated onto `handicap` in the data
 * too (see SiteTag below) — no trace of the retired brand remains in routing.
 *
 * WHY FRIENDSMOON IS ONE TAG, NOT TWO. Friendsmoon (friendsmoon.com) ships a
 * SPLIT wizard — a "crew" path (a just-married couple + 4–16 friends) and a
 * "couples" path (3–6 couples). Offsite is split into two TAGS because its two
 * paths read different `EntityKind`s (retreat → residence, outing →
 * party-venue). Friendsmoon's two paths read the SAME party-venue data and
 * differ only by group size and room pairing — query-time filters, not
 * routing. Splitting the tag would triple the starved-cell surface and
 * manufacture ~30 cells that measure the same universe twice. The split lives
 * in the site's wizard UI, not here.
 *
 * ⚠️ TAGGED AHEAD OF THEIR CONSUMERS — ON PURPOSE. Nick's call, 2026-07-31.
 *
 * `friendsmoon` and `engagedmoon` are tags for sites that DO NOT EXIST YET.
 * This was deliberately held out of `main` for exactly that reason — it is the
 * shape of the `tdf` mistake the retirement above cleaned up — and was then
 * merged as a considered decision, not an oversight. The intent: tag the data
 * NOW so that when either wizard is built it reads a universe that is already
 * routed, instead of needing a tagging pass at build time.
 *
 * WHAT THIS COSTS, so nobody rediscovers it as a bug:
 *   - the coverage matrix counts ~5,705 party rows per wizard against
 *     consumers that render nothing;
 *   - the starved-input audit enumerates ~30 cells for products nobody ships.
 * Those numbers are REAL but currently MEANINGLESS. Do not tune data to close
 * them, and do not read a "starved" friendsmoon/engagedmoon cell as work to do
 * until the site exists. Tags are inert without a consumer — nothing renders
 * from these, and no runtime behaviour depends on them.
 *
 * DO NOT "clean these up" on the grounds that they have no reader. That is the
 * tdf argument, and it was heard and overruled here. If either site is KILLED
 * at its gate (see the plan's Phase 3 / Phase 5 gates), remove that brand's tag
 * then — and note that a clean revert of the original commit is no longer
 * possible, because later commits build on this file.
 */
export const ALL_WIZARD_TAGS = [
  "bestman",
  "moh",
  "offsite-retreat",
  "offsite-outing",
  "handicap",
  "friendsmoon",
  "engagedmoon",
] as const;

export type WizardTag = (typeof ALL_WIZARD_TAGS)[number];

/**
 * Brand domains (the `sites` axis carried on golf + residence rows).
 *
 * `"tdf"` was REMOVED 2026-07-31 along with the wizard. It had lingered here as
 * a data-level label on 994 generated golf rows after tourdefore.com stopped
 * consuming this package, which meant golf data was still named for a brand
 * that no longer reads it — and `sitesToWizards` had to special-case it onto
 * `handicap` to compensate. The rows were migrated (`sites:["tdf","offsite"]`
 * -> `["handicap","offsite"]`, 994 golf + 5 ingest + 234 destinations) so the
 * label now names the site that actually renders them.
 *
 * `friendsmoon` / `engagedmoon` are listed because the wizards exist in the
 * vocabulary, but NO ROW carries either as a `sites` value yet — the axis is
 * only on golf + residence rows, and neither wizard reads those kinds (see
 * ENGINE_READS). Add rows here only alongside a real reader, per the tdf lesson
 * directly above.
 */
export type SiteTag =
  | "moh"
  | "bestman"
  | "offsite"
  | "handicap"
  | "friendsmoon"
  | "engagedmoon";

export type ProductTag =
  | "bach-party"
  | "bachelorette"
  | "golf-trip"
  | "retreat"
  | "outing"
  // Named for the TRIP, not the brand, matching every sibling above
  // (`bach-party`, not `bestman`). `friends-trip` covers both Friendsmoon
  // paths; `proposal-trip` is Engagedmoon's.
  | "friends-trip"
  | "proposal-trip";

/** Source of truth for the audience vocabulary — same rule as
 *  `ALL_WIZARD_TAGS`: runtime guards derive their set from here. */
export const ALL_AUDIENCE_TAGS = [
  "bachelor",
  "bachelorette",
  "corporate",
  "clients",
  "internal",
] as const;

export type AudienceTag = (typeof ALL_AUDIENCE_TAGS)[number];

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

/**
 * GENERAL-AUDIENCE PREDICATE — "the per-type taxonomy did not restrict this to
 * bachelor/bachelorette staples."
 *
 * `ACTIVITY_AUDIENCE_TAGS` above is a RESTRICT-list: an unlisted type defaults
 * to every audience, and the ~11 listed types (poker-night, boudoir, casino,
 * pole-class, drag-brunch, …) are the party-locked ones. So "carries corporate"
 * is, mechanically, the same signal as "is not party-locked" — 1,958 of 2,161
 * activity rows.
 *
 * Friendsmoon and Engagedmoon need exactly that signal, and reading
 * `audiences.includes("corporate")` at their call sites would read as though a
 * honeymoon were a corporate offsite. This names the predicate for what it
 * actually tests so those call sites stay honest.
 *
 * It deliberately does NOT widen `UniverseAudience` with `friends`/`couple`
 * audiences: that type is the narrower back-compat union Offsite Outpost
 * imports, and widening it would change OO's types for no routing gain. These
 * two wizards need no audience of their own — they need the absence of a
 * party lock.
 */
export function isGeneralAudience(audiences: readonly AudienceTag[]): boolean {
  // Typed on the WIDER union so both `activityAudiences()` output
  // (UniverseAudience[], no `internal`) and baked `audiences` (AudienceTag[])
  // pass without a cast. UniverseAudience is a strict subset of AudienceTag.
  return audiences.includes("corporate");
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

/** Golf, by the coarse category map — not by string-matching the type name. */
function isGolfType(type: string): boolean {
  return (CATEGORY_OF[type] ?? []).includes("golf");
}

/**
 * THE single derivation of an activity's wizards. Both the per-item bake
 * (destinations-bake.ts, which writes the tags every consumer reads) and the
 * brand-rule check now go through here, so they cannot drift apart.
 *
 * They HAD drifted: `deriveRouting` applied `partyFitWizards` — which hard-blocks
 * golf from Maid of Honor HQ — while `bakeActivity` derived wizards from the
 * row's `brands` alone and never consulted it. Four rows typed `golf` and
 * branded `["both"]` were baked with `moh`, contradicting a rule this repo
 * asserts in `tagging-rules.ts` and enforces again in MOH's own `check-no-golf`
 * prebuild. Nothing leaked, because `MOH_ACTIVITY_TYPES` omits `golf` and the
 * overlay dropped them a layer later — but a tag that survives only because
 * something downstream filters it is a latent bug, not a safe one.
 */
export function wizardsForActivity(type: string, brands: Brand[]): WizardTag[] {
  const audiences = activityAudiences(type) as AudienceTag[];
  // Golf is a bachelor + corporate thing and NEVER a bachelorette one.
  const party = wizardsFromBrands(brands).filter((w) => !(w === "moh" && isGolfType(type)));
  const outing: WizardTag[] = audiences.includes("corporate") ? ["offsite-outing"] : [];
  const moon: WizardTag[] = isGeneralAudience(audiences) ? ["friendsmoon", "engagedmoon"] : [];
  return Array.from(new Set([...party, ...outing, ...moon]));
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
