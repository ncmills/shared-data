/**
 * Brand overlays — convert canonical destinations to per-repo typed shapes.
 *
 * Each repo's `PartyDestination` type has the same shape as
 * `CanonicalDestination` EXCEPT:
 *  - score field name (`bacheloretteScore` vs `bachelorScore`)
 *  - per-venue brand-friendly flags (`bacheloretteFriendly` vs `bachelorFriendly`)
 *  - activity types differ between unions; entries with unknown types
 *    are filtered to avoid TS asserts on consumer side
 *  - presentation block (tagline + description) is brand-specific
 *
 * The overlay returns `unknown` and lets each repo cast to its local
 * `PartyDestination` (which it already does for its own data files).
 */

import type {
  CanonicalDestination,
  CanonicalActivity,
  CanonicalNightlife,
  CanonicalDining,
} from "./destinations-types";

/** Activity-type unions known to each repo. Filter out anything unknown. */
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
]);

const BESTMAN_ACTIVITY_TYPES = new Set([
  "spa","wine-tour","brewery-tour","distillery-tour","cooking-class","cocktail-class",
  "boat-cruise","karaoke","escape-room","axe-throwing","go-karts","paintball","casino",
  "pool-party","beach","hiking","brunch-crawl","food-tour","golf","shooting-range","fishing",
  "atv","skydiving","racing","poker-night","cigar-bar","sports-event","mural-tour",
  "sunset-cruise","rooftop-bar","skiing","biking","kayaking","rafting","snorkeling",
  "canyoneering","zip-lining","horseback-riding","dog-sledding","adventure-park",
  "tour","walking-tour","scenic-overlook","farm-tour",
]);

const filterByBrand = <T extends { brands: ("moh" | "bestman" | "both")[] }>(
  items: T[],
  brand: "moh" | "bestman"
): T[] => items.filter((i) => i.brands.includes(brand) || i.brands.includes("both"));

export function applyMohOverlay(c: CanonicalDestination): unknown {
  const nightlife = filterByBrand(c.nightlife, "moh").map((n: CanonicalNightlife) => {
    const { brands: _b, ...rest } = n;
    return { ...rest, bacheloretteFriendly: true };
  });
  const dining = filterByBrand(c.dining, "moh").map((d: CanonicalDining) => {
    const { brands: _b, ...rest } = d;
    return rest;
  });
  const activities = filterByBrand(c.activities, "moh")
    .filter((a) => MOH_ACTIVITY_TYPES.has(a.type))
    .map((a: CanonicalActivity) => {
      const { brands: _b, ...rest } = a;
      return rest;
    });
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
    lodging: c.lodging,
    transport: c.transport,
    bacheloretteScore: c.score,
  };
}

export function applyBestmanOverlay(c: CanonicalDestination): unknown {
  const nightlife = filterByBrand(c.nightlife, "bestman").map((n: CanonicalNightlife) => {
    const { brands: _b, ...rest } = n;
    return { ...rest, bachelorFriendly: true };
  });
  const dining = filterByBrand(c.dining, "bestman").map((d: CanonicalDining) => {
    const { brands: _b, ...rest } = d;
    return rest;
  });
  const activities = filterByBrand(c.activities, "bestman")
    .filter((a) => BESTMAN_ACTIVITY_TYPES.has(a.type))
    .map((a: CanonicalActivity) => {
      const { brands: _b, ...rest } = a;
      return rest;
    });
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
    lodging: c.lodging,
    transport: c.transport,
    bachelorScore: c.score,
  };
}
