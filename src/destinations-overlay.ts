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

// The Friendsmoon activity allowlist is derived from the routing gate rather
// than restated here — see FRIENDSMOON_ACTIVITY_TYPES below.
import { isFriendsmoonType } from "./tags";

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
export const MOH_ACTIVITY_TYPES = new Set([
  "spa","wine-tour","brewery-tour","distillery-tour","cooking-class","cocktail-class",
  "boat-cruise","karaoke","escape-room","axe-throwing","go-karts","paintball","casino",
  "pool-party","beach","hiking","brunch-crawl","food-tour","skiing","biking","kayaking",
  "rafting","snorkeling","canyoneering","zip-lining","horseback-riding","dog-sledding",
  "adventure-park","atv","skydiving","racing","mural-tour","sunset-cruise","rooftop-bar",
  "tour","walking-tour","scenic-overlook","farm-tour","shooting-range","fishing",
  "poker-night","cigar-bar","sports-event","boudoir","pottery-class","candle-making",
  "perfume-making","flower-crown","drag-brunch","sound-bath","cacao-ceremony","tarot-reading",
  "pole-class","burlesque-class","silent-disco","luxe-picnic","matcha-ceremony","pickleball",
  "photoshoot","dance-class","shopping-tour","stargazing","yoga-retreat","tea-ceremony",
  "sleigh-ride","yacht-charter","painting-class","tennis-clinic","ghost-tour",
  "vortex-hike","mid-century-tour","art-class","spa-day","beach-hangout",
]);

export const BESTMAN_ACTIVITY_TYPES = new Set([
  "spa","wine-tour","brewery-tour","distillery-tour","cooking-class","cocktail-class",
  "boat-cruise","karaoke","escape-room","axe-throwing","go-karts","paintball","casino",
  "pool-party","beach","hiking","brunch-crawl","food-tour","golf","shooting-range","fishing",
  "atv","skydiving","racing","poker-night","cigar-bar","sports-event","mural-tour",
  "sunset-cruise","rooftop-bar","skiing","biking","kayaking","rafting","snorkeling",
  "canyoneering","zip-lining","horseback-riding","dog-sledding","adventure-park",
  "tour","walking-tour","scenic-overlook","farm-tour","beach-hangout",
  // Added 2026-07-31. The New Orleans private second line (brass band + NOPD
  // escort) was authored 2026-07-22 as a deliberate Best Man HQ centerpiece —
  // tags.ts records "the EVENT stays Best Man HQ" — and correctly tagged
  // ["bestman"]. But the type was never added here, so applyBestmanOverlay
  // dropped it and it had NEVER rendered. Found by scripts/new-data-report.ts.
  "second-line-parade",
]);

/**
 * Friendsmoon's activity allowlist is DERIVED, not hand-written.
 *
 * MOH_ACTIVITY_TYPES and BESTMAN_ACTIVITY_TYPES are hand-maintained sets, and
 * both have now shipped the same bug: a row correctly tagged for the wizard,
 * whose type nobody remembered to add here, is dropped SILENTLY and renders
 * nowhere. It cost the NOLA second line (authored 2026-07-22, never rendered
 * until 2026-07-31) and then `luxe-picnic` + `photoshoot` on top of it.
 *
 * The routing gate in tags.ts already answers "may Friendsmoon show this type?"
 * — PARTY_LOCKED_ACTIVITY_TYPES is the single source of truth. Restating that
 * answer as a second hand-kept list would just re-arm the same trap. So this
 * set is computed from the taxonomy: every known activity type that is not
 * party-locked. A new type added to the universe joins Friendsmoon the moment
 * it is tagged, with no second edit to forget.
 */
export const FRIENDSMOON_ACTIVITY_TYPES: ReadonlySet<string> = new Set(
  [...MOH_ACTIVITY_TYPES, ...BESTMAN_ACTIVITY_TYPES].filter(isFriendsmoonType),
);

/**
 * The Friendsmoon lens: a couples-and-friends long weekend.
 *
 * Filters on the wizard tag alone for nightlife and dining — the tag is already
 * the decision — and on the tag plus the derived type set for activities, which
 * keeps it structurally parallel to the MOH/BESTMAN overlays without inheriting
 * their maintenance hazard.
 *
 * No `tagline`/`description`: `presentation` is typed as a closed
 * `{ moh, bestman }` record, so no Friendsmoon copy can be authored yet.
 * applyOutpostOverlay has shipped without one since OO launched, so this is a
 * copy gap to fill when the site gets its own city prose, not a blocker.
 */
export function applyFriendsmoonOverlay(c: CanonicalDestination): unknown {
  const nightlife = c.nightlife
    .filter((n) => forWizard(n, "friendsmoon"))
    .map((n: CanonicalNightlife) => omitTags(n));
  const dining = c.dining.filter((d) => forWizard(d, "friendsmoon")).map((d) => omitTags(d));
  const activities = c.activities
    .filter((a) => forWizard(a, "friendsmoon"))
    .filter((a) => FRIENDSMOON_ACTIVITY_TYPES.has(a.type))
    .map((a: CanonicalActivity) => omitTags(a));
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
    score: c.score,
  };
}

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
  // Filtered like activities/nightlife. It previously passed EVERY dining item
  // through unfiltered and happened to be correct only because all 1319 dining
  // items are corporate-tagged today — i.e. the overlay's corporate guarantee
  // rested on the data, with `verify-universe`'s leak check as the only net.
  // Behavior-identical as of 2026-07-31 (0 non-corporate dining items).
  const dining = c.dining.filter(keepAud).map((d) => omitTags(d, ["audiences"]));
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
