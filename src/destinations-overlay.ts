/**
 * Brand overlays — convert canonical (now tag-baked) destinations to per-repo
 * typed shapes. Each overlay is a PURE FILTER over the baked `wizards` /
 * `audiences` tags (see destinations-bake.ts), plus the repo's own activity-
 * type allow-list, then strips the universe tags so the output shape is exactly
 * what each consumer's `PartyDestination` expects (unchanged from pre-bake).
 *
 * Differences the overlay handles (unchanged):
 *  - score field name (`bacheloretteScore` vs `bachelorScore`)
 *  - per-venue brand-friendly flags (`bacheloretteFriendly` vs `bachelorFriendly`)
 *  - activity-type unions differ; entries with unknown types are filtered out
 *  - presentation block (tagline + description) is brand-specific
 */

import type {
  CanonicalDestination,
  CanonicalActivity,
  CanonicalNightlife,
  CanonicalDining,
} from "./destinations-types";

// Audience vocabulary now lives in tags.ts; re-export for back-compat with
// consumers that import these from the package root (e.g. Offsite Outpost).
export {
  type UniverseAudience,
  ALL_AUDIENCES,
  activityAudiences,
  nightlifeAudiences,
} from "./tags";

/** Activity-type unions known to each repo. Filter out anything unknown.
 *
 * 2026-04-20 audit: types like `sleigh-ride`, `yacht-charter`, `painting-class`
 * were silently dropped from the MOH overlay even though the MOH engine's
 * vibeTag scoring (party-planner-prompt.ts) explicitly checks for them. The
 * supersets below match everything the prompts reference. These are real
 * behavioural filters and are preserved verbatim through the tag migration. */
const MOH_ACTIVITY_TYPES = new Set([
  "spa","wine-tour","brewery-tour","distillery-tour","cooking-class","cocktail-class",
  "boat-cruise","karaoke","escape-room","axe-throwing","go-karts","paintball","casino",
  "pool-party","beach","hiking","brunch-crawl","food-tour","skiing","biking","kayaking",
  "rafting","snorkeling","canyoneering","zip-lining","horseback-riding","dog-sledding",
  "adventure-park","atv","skydiving","racing","mural-tour","sunset-cruise","rooftop-bar",
  "tour","walking-tour","scenic-overlook","farm-tour","golf","shooting-range","fishing",
  "poker-night","cigar-bar","sports-event","boudoir","pottery-class","candle-making",
  "perfume-making","flower-crown","drag-brunch","sound-bath","cacao-ceremony","tarot-reading",
  "pole-class","burlesque-class","silent-disco","luxe-picnic","matcha-ceremony","pickleball",
  "photoshoot","dance-class","shopping-tour","stargazing","yoga-retreat","tea-ceremony",
  "sleigh-ride","yacht-charter","painting-class","tennis-clinic","ghost-tour",
  "vortex-hike","mid-century-tour","art-class","spa-day","beach-hangout",
]);

const BESTMAN_ACTIVITY_TYPES = new Set([
  "spa","wine-tour","brewery-tour","distillery-tour","cooking-class","cocktail-class",
  "boat-cruise","karaoke","escape-room","axe-throwing","go-karts","paintball","casino",
  "pool-party","beach","hiking","brunch-crawl","food-tour","golf","shooting-range","fishing",
  "atv","skydiving","racing","poker-night","cigar-bar","sports-event","mural-tour",
  "sunset-cruise","rooftop-bar","skiing","biking","kayaking","rafting","snorkeling",
  "canyoneering","zip-lining","horseback-riding","dog-sledding","adventure-park",
  "tour","walking-tour","scenic-overlook","farm-tour","beach-hangout",
]);

/** Strip the universe tag fields (+ brands) so output matches the pre-bake shape. */
const TAG_FIELDS = ["brands", "wizards", "audiences", "products", "priceTier"];
function omitTags<T extends object>(item: T, keep: string[] = []): Record<string, unknown> {
  const drop = TAG_FIELDS.filter((k) => !keep.includes(k));
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(item)) if (!drop.includes(k)) out[k] = (item as Record<string, unknown>)[k];
  return out;
}

/** Does this baked item surface for the given wizard? (pure tag filter) */
const forWizard = (i: { wizards?: string[] }, w: string): boolean => !!i.wizards?.includes(w);

export function applyMohOverlay(c: CanonicalDestination): unknown {
  const nightlife = c.nightlife
    .filter((n) => forWizard(n, "moh"))
    .map((n: CanonicalNightlife) => ({ ...omitTags(n), bacheloretteFriendly: true }));
  const dining = c.dining.filter((d) => forWizard(d, "moh")).map((d) => omitTags(d));
  const activities = c.activities
    .filter((a) => forWizard(a, "moh"))
    .filter((a) => MOH_ACTIVITY_TYPES.has(a.type))
    .map((a: CanonicalActivity) => omitTags(a));
  return {
    id: c.id,
    city: c.city,
    state: c.state,
    region: c.region === "midwest" ? "south" : c.region, // MOH region union doesn't include midwest yet
    tagline: c.presentation.moh.tagline,
    description: c.presentation.moh.description,
    nearestAirport: c.nearestAirport,
    bestMonths: c.bestMonths,
    vibes: c.vibes,
    nightlife,
    dining,
    activities,
    lodging: c.lodging.map((l) => omitTags(l)),
    transport: c.transport.map((t) => omitTags(t)),
    bacheloretteScore: c.score,
  };
}

export function applyBestmanOverlay(c: CanonicalDestination): unknown {
  const nightlife = c.nightlife
    .filter((n) => forWizard(n, "bestman"))
    .map((n: CanonicalNightlife) => ({ ...omitTags(n), bachelorFriendly: true }));
  const dining = c.dining.filter((d) => forWizard(d, "bestman")).map((d) => omitTags(d));
  const activities = c.activities
    .filter((a) => forWizard(a, "bestman"))
    .filter((a) => BESTMAN_ACTIVITY_TYPES.has(a.type))
    .map((a: CanonicalActivity) => omitTags(a));
  return {
    id: c.id,
    city: c.city,
    state: c.state,
    region: c.region === "midwest" ? "south" : c.region, // BESTMAN region union doesn't include midwest
    tagline: c.presentation.bestman.tagline,
    description: c.presentation.bestman.description,
    nearestAirport: c.nearestAirport,
    bestMonths: c.bestMonths,
    vibes: c.vibes,
    nightlife,
    dining,
    activities,
    lodging: c.lodging.map((l) => omitTags(l)),
    transport: c.transport.map((t) => omitTags(t)),
    bachelorScore: c.score,
  };
}

/**
 * Corporate overlay — the Offsite Outpost (outing) lens on the shared universe.
 * Keeps items tagged for the `corporate` audience and re-attaches the baked
 * `audiences` tag to every returned item (output shape unchanged from pre-bake,
 * which already exposed `audiences`). Outings pull real activities/dining/
 * lodging per city through this filter.
 */
export function applyOutpostOverlay(c: CanonicalDestination): unknown {
  const keepAud = (i: { audiences?: string[] }) => !!i.audiences?.includes("corporate");
  const activities = c.activities
    .filter(keepAud)
    .map((a) => omitTags(a, ["audiences"]));
  const nightlife = c.nightlife
    .filter(keepAud)
    .map((n) => omitTags(n, ["audiences"]));
  const dining = c.dining.map((d) => omitTags(d, ["audiences"]));
  return {
    id: c.id,
    city: c.city,
    state: c.state,
    region: c.region,
    nearestAirport: c.nearestAirport,
    bestMonths: c.bestMonths,
    vibes: c.vibes,
    nightlife,
    dining,
    activities,
    lodging: c.lodging.map((l) => omitTags(l)),
    transport: c.transport.map((t) => omitTags(t)),
    /** generic neutral score; OO does its own corporate scoring downstream */
    score: c.score,
  };
}
