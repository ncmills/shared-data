/**
 * vocab-build.ts — builds `vocab/v1.json`, the controlled vocabulary (CORPUS-M4).
 *
 *   npx tsx scripts/corpus/vocab-build.ts           # write vocab/v1.json
 *   npx tsx scripts/corpus/vocab-build.ts --check   # exit 1 if the file is stale
 *
 * WHAT IT IS. The neutral facet values that exist in the corpus TODAY (every
 * term is read off the data or off a type union in this repo — nothing is
 * invented), plus a mapping of the two free-text tag fields (residence `tags`,
 * OO experience `tags`) into those facets. A rules or model tagger may only
 * emit terms that are in this file, and a term's meaning only changes with a
 * version bump (semver: add a term = minor, rename/remove/redefine = major).
 *
 * WHAT IT IS NOT. It is not read by any consumer, and nothing in `src/` imports
 * it. Per-site eligibility lives in `suitability/<site>.json`; the site rules
 * that produce it live in `profiles/<site>.yaml`.
 *
 * FREE-TEXT TAGS. Each tag is normalised (lower-case, spaces/underscores → "-")
 * and run through TAG_RULES below. A tag no rule claims goes into `unmapped[]`
 * with its count and a reason — it is NOT forced into a facet. Unmapped is a
 * finding, not a failure.
 *
 * Image subject/scene/mood terms are a stub, empty until M6 (the image layer,
 * after the 09-28 shared-image-cache lane).
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sharedDestinations } from "../../src/destinations-canonical.ts";
import { SHARED_GOLF_COURSES } from "../../src/golf.ts";
import { ALL_RESIDENCES } from "../../src/residences.ts";
import { ooExperiences } from "../../src/oo-atlas.ts";
import { CATEGORY_OF, type ActivityCategory } from "../../src/tags.ts";
import { MOH_ACTIVITY_TYPES, BESTMAN_ACTIVITY_TYPES } from "../../src/destinations-overlay.ts";
import { LEXICONS } from "./lexicons.ts";

export const VOCAB_VERSION = "1.0.0";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const VOCAB_PATH = resolve(ROOT, "vocab/v1.json");

// ── facet terms read off the corpus / type unions ───────────────────────────

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "golf", "culinary", "water", "field-sports", "motorsport", "wellness", "nightlife", "equestrian",
  "cycling", "winter", "give-back", "adventure", "cultural", "social", "gaming",
];
// CanonicalLodging["type"] / CanonicalTransport["type"] unions (src/destinations-types.ts).
const LODGING_TYPES = ["house", "hotel", "resort", "airbnb", "boutique-hotel", "hostel"];
const TRANSPORT_TYPES = ["party-bus", "limo", "shuttle", "rideshare", "charter"];
const PARTY_REGIONS = ["south", "west", "northeast", "midwest", "international"]; // CanonicalRegion
const PARTY_VIBES = ["chill", "balanced", "unhinged"]; // PartyVibe
const RESIDENCE_GOOD_FOR = ["leadership", "celebration", "team-building", "kickoff", "strategy"];

const sortU = (xs: Iterable<string>) => [...new Set(xs)].sort();

function observed() {
  const act: string[] = [], nl: string[] = [], lod: string[] = [], tr: string[] = [];
  for (const d of sharedDestinations) {
    for (const r of d.activities) act.push(r.type);
    for (const r of d.nightlife) nl.push(r.type);
    for (const r of d.lodging) lod.push(r.type);
    for (const r of d.transport) tr.push(r.type);
  }
  return {
    activityTypes: sortU([...act, ...Object.keys(CATEGORY_OF), ...MOH_ACTIVITY_TYPES, ...BESTMAN_ACTIVITY_TYPES]),
    destinationIds: sortU(sharedDestinations.map((d) => d.id)),
    nightlifeTypes: sortU(nl),
    lodgingSeen: sortU(lod),
    transportSeen: sortU(tr),
    golfTier: sortU(SHARED_GOLF_COURSES.map((c) => c.tier)),
    golfStyle: sortU(SHARED_GOLF_COURSES.map((c) => c.style)),
    golfRegion: sortU(SHARED_GOLF_COURSES.map((c) => c.region)),
    residenceSetting: sortU(ALL_RESIDENCES.map((r) => r.setting)),
    ooKind: sortU(ooExperiences.map((e) => String(e.kind))),
  };
}

// ── free-text tag → facet rules ─────────────────────────────────────────────
// [pattern over the normalised tag, emitted "facet:term" list]. All rules run;
// a tag gets the union. Patterns are anchored to whole tags or whole words so a
// rule never claims a tag by accident (e.g. "spa" must not claim "spanish").

type Rule = [RegExp, string[]];
const W = (alts: string) => new RegExp(`^(?:${alts})$`);

export const TAG_RULES: Rule[] = [
  // residence.setting — the 15 settings, where the tag names one outright
  [W("lake|lakefront|lakeside|alpine-lake|mountain-lake|private-lake|loch-side|lake-resort"), ["residence.setting:lake"]],
  [W("tropical|domestic-tropical"), ["residence.setting:tropical"]],
  [W("countryside|country-house|cottage-country|hill-country|english-estate|home-farm|farm-estate"), ["residence.setting:countryside"]],
  [W("coastal|coastal-trails|atlantic-coast|pacific-coast|coastal-california|oceanfront|ocean-cliff|clifftop|waterfront|beachfront|mile-long-beach|seven-beaches|twin-beaches"), ["residence.setting:coastal"]],
  [W("palace|royal-palace|palace-buyout|imperial-palace-views"), ["residence.setting:palace"]],
  [W("vineyard|vineyard-views|wine-country|winelands|wine-estate|wine-farm|winery|chianti-wine-estate|brunello-winery|tuscan-estate"), ["residence.setting:vineyard"]],
  [W("desert|high-desert|desert-edge|desert-ranch|sonoran-desert|sonoran|negev-desert|dunescape|empty-quarter|desert-architecture"), ["residence.setting:desert"]],
  [W("island|private-island|archipelago|atoll|private-atoll|private-cay|barrier-island"), ["residence.setting:island"]],
  [W("safari|big-five|game-drives|great-migration|migration|horseback-safari|tented-camp|tented-villas|multi-camp|two-camps|three-camps|kruger-frontage"), ["residence.setting:safari"]],
  [W("alpine|alpine-access|alpine-lodges|high-alpine-meadow|summer-alpine|dolomite-views|matterhorn-views"), ["residence.setting:alpine"]],
  [W("castle|real-castle|castle-energy|fortress|medieval"), ["residence.setting:castle"]],
  [W("links|ocean-links|championship-links|coastal-links|atlantic-links|open-links|links-style-golf|private-links"), ["residence.setting:links", "activity.category:golf"]],
  [W("ski-resort|ski-in-ski-out|ski-in|piste-side|lift-base|ski-hill|ski|powder|niseko-powder|heli-ski"), ["residence.setting:ski-resort", "activity.category:winter"]],
  [W("urban|city-centre|skyline-rooftop|museum-quarter|food-district|citywide"), ["residence.setting:urban"]],
  [W("ranch|working-ranch|estancia|gaucho|asado|chuckwagon|cattle|roping|wrangling"), ["residence.setting:ranch"]],

  // activity.category / activity.type
  [W("golf|golf-groups|golf-pilgrimage|home-of-golf|private-golf|golf-and-spa|lakefront-golf|floating-green|ryder-cup|ryder-cup-venue|u\\.s\\.-open|scramble|matchplay"), ["activity.category:golf"]],
  [W("spa|onsen-spa|wellness|forest-wellness|recovery|sauna|cold-plunge|breathwork|mindfulness|restorative|reset|sound-bath"), ["activity.category:wellness"]],
  [W("spa|onsen-spa"), ["activity.type:spa"]],
  [W("sound-bath"), ["activity.type:sound-bath"]],
  [W("onsen|hot-springs"), ["amenity:hot-springs", "activity.category:wellness"]],
  [W("dive|reef|reef-diving|great-barrier-reef|snorkel(?:ing)?"), ["activity.category:water"]],
  [W("surf|kitesurfing|watersports|sailing|regatta|catamaran|yacht|boats|boat-fleet|kayaking|rafting"), ["activity.category:water"]],
  [W("sailing|regatta"), ["activity.type:sailing"]],
  [W("kayaking"), ["activity.type:kayaking"]],
  [W("rafting"), ["activity.type:rafting", "activity.category:adventure"]],
  [W("yacht"), ["activity.type:yacht-charter"]],
  [W("billfish|fishing|fly-fishing|sport-fishing|fly-casting|clays|clay-shooting|sporting-clays|wingshooting|falconry|hog-hunt|archery|field-sports"), ["activity.category:field-sports"]],
  [W("billfish|fishing|fly-fishing|sport-fishing|fly-casting"), ["activity.type:fishing"]],
  [W("clays|clay-shooting|sporting-clays|wingshooting"), ["activity.type:shooting-range"]],
  [W("equestrian|horseback|horses|horsemanship|trail-ride|polo|horse-racing|carriage"), ["activity.category:equestrian"]],
  [W("horseback|trail-ride"), ["activity.type:horseback-riding"]],
  [W("cycling|gravel|e-bike"), ["activity.category:cycling", "activity.type:biking"]],
  [W("winter|nordic|lapland|northern-lights"), ["activity.category:winter"]],
  [W("driving|racing|motorsport|off-road|classic-cars|vintage-cars|concours|dune-driving"), ["activity.category:motorsport"]],
  [W("racing"), ["activity.type:racing"]],
  [W("off-road|dune-driving"), ["activity.type:atv"]],
  [W("adventure|outdoors|expedition|wilderness|bushcraft|camping|navigation|climbing|rock-climbing|via-ferrata|trek|trekking|summit|glacier|hiking|red-rock-adventure|outdoor-pursuits|gorilla-trekking|primate-tracking|hot-air-balloon|balloon|ballooning"), ["activity.category:adventure"]],
  [W("hiking|trek|trekking|coastal-trails"), ["activity.type:hiking"]],
  [W("culinary|culinary-campus|cooking|tasting|tasting-rooms|wine|wine-tasting|winemaker-dinner|cocktails|blending|brewing|distilling|distillery|gin|mezcal|tequila|whisky|beer|bbq|barbecue|feast|charcuterie|seafood|lobster-bakes|farm-to-table|chef-battle|long-table|picnic|michelin|michelin-dining|ducasse-dining|jean-georges|greenhouse-dining|wine-cellar|cider-farm"), ["activity.category:culinary"]],
  [W("cooking|chef-battle"), ["activity.type:cooking-class"]],
  [W("wine-tasting|winemaker-dinner"), ["activity.type:wine-tour"]],
  [W("distilling|distillery"), ["activity.type:distillery-tour"]],
  [W("brewing"), ["activity.type:brewery-tour"]],
  [W("give-back|service|charity|csr|conservation|conservation-story|sustainability|purpose|legacy|construction|community-owned"), ["activity.category:give-back"]],
  [W("art|arts-and-nature|cultural-immersion|cultural-forum|rock-art|theater|concert|concert-hall|stargazing"), ["activity.category:cultural"]],
  [W("nightlife|dj|live-music|comedy|award-winning-bar|open-bar"), ["activity.category:nightlife"]],
  [W("casino|integrated-resort"), ["activity.category:gaming"]],
  [W("casino"), ["activity.type:casino"]],
  [W("social|team|field-day|tug-of-war|relay|puzzle|amazing-race|highland-games|strongman|timbersports"), ["activity.category:social"]],

  // oo.kind — only where the tag IS one of the 17 experience kinds
  [W("highland-games"), ["oo.kind:highland-games"]],
  [W("amazing-race"), ["oo.kind:amazing-race"]],
  [W("wildlife|birding|marine-wildlife"), ["oo.kind:wildlife"]],
  [W("hospitality"), ["oo.kind:hospitality"]],
  [W("service"), ["oo.kind:service"]],
  [W("wrangling"), ["oo.kind:wrangling"]],

  // format (how an experience runs) — from the OO tags
  [W("competition|tournament|leaderboard|trophy|championship|matchplay|scramble|relay|tug-of-war|strongman"), ["format:competition"]],
  [W("team|field-day|build"), ["format:team"]],
  [W("hands-on|workshop|craft|creative|build|chef-battle|blending"), ["format:hands-on"]],
  [W("clinic|masterclass|learning|mentorship|guided|private-guide"), ["format:guided"]],
  [W("relaxed|relaxed-estate|unplugged"), ["format:relaxed"]],
  [W("overnight"), ["format:overnight"]],
  [W("night"), ["format:after-dark"]],
  [W("all-abilities|beginner-friendly"), ["format:all-abilities"]],
  [W("endurance"), ["format:endurance"]],

  // purpose — residence goodFor + the OO buyer registers
  [W("celebration|gala|island-gala|black-tie|reception"), ["purpose:celebration"]],
  [W("leadership"), ["purpose:leadership"]],
  [W("client-entertaining|vip|marquee"), ["purpose:client-entertaining"]],
  [W("incentive"), ["purpose:incentive"]],
  [W("mice|convention|conference|large-conference|conference-centre|conference-resort|convention-center|meeting-space|large-meeting-space|60000-sq-ft-meeting-space|forum-venue|large-all-hands"), ["purpose:conference", "amenity:meeting-space"]],

  // exclusivity / group scale
  [W("full-buyout|buyout|estate-buyout|whole-camp-buyout|whole-lodge-buyout|conservancy-buyout|concession-buyout|palace-buyout"), ["exclusivity:full-buyout"]],
  [W("exclusive-use|exclusive-use-only|exclusive-villa|exclusive-club|private-island|private-atoll|private-cay|private-hamlet|private-headland|private-cove|private-reserve|private-community|self-contained"), ["exclusivity:exclusive-use"]],
  [W("big-campus|large-capacity|large-events|large-event-capacity|large-events-venue|large-group|large-groups|big-group|big-capacity|large-scale|largest-scale|scale-500|1500-capacity|mega-resort|largest-ballroom-in-park-city|large-ballroom|grand-ballroom|two-ballrooms|ballroom|rooftop-ballroom|banqueting"), ["group.scale:large"]],
  [W("ballroom|large-ballroom|grand-ballroom|two-ballrooms|rooftop-ballroom|largest-ballroom-in-park-city|banqueting"), ["amenity:ballroom"]],
  [W("small-group|intimate|intimate-group"), ["group.scale:small"]],

  // amenity
  [W("private-beach|beach|beach-club|private-cove"), ["amenity:beach"]],
  [W("infinity-pool|rooftop-pool|floating-pool|pool-suites"), ["amenity:pool"]],
  [W("marina|jetty|boat-access|boat-arrival"), ["amenity:marina"]],
  [W("all-inclusive"), ["amenity:all-inclusive"]],
  [W("michelin|michelin-dining|ducasse-dining|jean-georges"), ["amenity:fine-dining"]],
  [W("private-chef-chalets"), ["amenity:private-chef"]],
  [W("screening-room"), ["amenity:screening-room"]],
  [W("waterpark"), ["amenity:waterpark"]],
  [W("rooftop|skyline-rooftop"), ["amenity:rooftop"]],
  [W("spa|onsen-spa|golf-and-spa"), ["amenity:spa"]],

  // character / quality band
  [W("historic|heritage|heritage-building|heritage-conversion|historic-banking-hall|historic-estate|historic-hospiz|historic-landmark|historic-manor|historic-monument|historic-resort|historic-tower|historic-villa|colonial-landmark|stately-home|regency-house|belle-epoque|beaux-arts|bauhaus-landmark|medieval|adaptive-reuse"), ["character:historic"]],
  [W("design-hotel|design-led|design-forward|matteo-thun-design"), ["character:design-led"]],
  [W("remote|remote-pacific|unplugged|car-free|car-free-village|outback"), ["character:remote"]],
  [W("eco-resort|eco-luxury|sustainability"), ["character:eco"]],
  [W("adults-only"), ["character:adults-only"]],
  [W("boutique|boutique-villa"), ["character:boutique"]],
  [W("luxury|ultra-luxe|ultra-premium|five-star|forbes-five-star|five-diamond|barefoot-luxury|eco-luxury"), ["quality.band:luxury"]],
  [W("premium|four-diamond"), ["quality.band:premium"]],
  [W("value"), ["quality.band:value"]],

  // access
  [W("near-airport|close-to-airport|dubai-gateway"), ["access:near-airport"]],
  [W("drive-to|drive-from-seattle"), ["access:drive-to"]],
  [W("seaplane|boat-arrival|boat-access|funicular-arrival|cable-car-access|expedition-arrival"), ["access:transfer-required"]],

  // residence.form (what the place physically is)
  [W("villas|exclusive-villa|boutique-villa|historic-villa|tented-villas"), ["residence.form:villa"]],
  [W("cottages|cabins|hillside-bungalows|spruce-chalets|forest-chalets|private-chef-chalets|log-lodge|lodge|all-suite-lodge|great-camp"), ["residence.form:cabin-or-lodge"]],
  [W("riad"), ["residence.form:riad"]],
  [W("ryokan"), ["residence.form:ryokan"]],
  [W("estate|estate-buyout|historic-estate|english-estate|irish-demesne|walled-gardens|national-trust-grounds|country-house|stately-home|historic-manor|regency-house|cortijo|hacienda-courtyard|parador"), ["residence.form:estate"]],
];

/** Tags left unmapped on purpose, by reason — so the reason is stated, not guessed at read time. */
const PLACE_NAMES = new Set(
  (
    "europe south-africa colorado hawaii india morocco japan new-zealand pacific-northwest thailand uae australia " +
    "florida mendoza iceland bahamas grace-bay hudson-valley los-cabos oregon patagonia punta-mita riviera-maya saudi-arabia " +
    "turks-caicos alula andalucia andes arabian aspen belize botswana bvi dubai great-lakes jaipur kenya mallorca okanagan " +
    "okavango oman provence queenstown st-lucia udaipur vietnam washington abaco adirondack adirondacks adriatic alentejo " +
    "andalusian andaman andermatt apac arizona arlberg atlas baja bavaria beaver-creek berkshires bordeaux california " +
    "cambodia canada cape-winelands caribbean carneros colorado-plateau columbia-gorge comporta douro four-valleys georgia goa " +
    "grand-canal grand-teton grand-cayman gstaad hunter-valley indian-ocean indonesia ireland italy kauai kimberley kitzbuhel " +
    "koh-samui kona kyoto lake-pichola lanai lapland malaysia maldives margaret-river marrakech mediterranean mid-atlantic midwest " +
    "montenegro mount-timpanogos mt-yotei mughal musandam nagano napa newport nile northeast okavango-delta okinawa orlando panama " +
    "phang-nga pitons porto puglian-village quebec red-centre rhode-island rioja riviera riviera-nayarit rocky-mountains rwanda " +
    "salzburg sandhills scottsdale sea-of-cortez sentosa serengeti singapore sonoma south-carolina tahoe tasmania telluride texas " +
    "tyrol uluru-views vail victoria-falls virgin-gorda virginia zambezi maine red-sea national-park national-park-" +
    ""
  )
    .split(/\s+/)
    .filter(Boolean),
);
const BRANDS = new Set(
  "aman belmond st-regis park-hyatt jw-marriott relais-&-chateaux relais-chateaux four-seasons white-lotus atlantis sister-property members'-club".split(" "),
);

export const normTag = (t: string) => t.trim().toLowerCase().replace(/[\s_]+/g, "-");

export function mapTag(tag: string): string[] {
  const n = normTag(tag);
  const out = new Set<string>();
  for (const [re, emits] of TAG_RULES) if (re.test(n)) emits.forEach((e) => out.add(e));
  return [...out].sort();
}

function unmappedReason(tag: string): string {
  const n = normTag(tag);
  if (PLACE_NAMES.has(n)) return "place-name: belongs in the row's place fields (country/region), not a facet";
  if (BRANDS.has(n)) return "brand-or-affiliation: a proper noun, not a neutral facet";
  return "no-confident-facet";
}

function countTags(rows: readonly object[]): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) for (const t of ((r as { tags?: readonly string[] }).tags ?? [])) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function buildVocab() {
  const o = observed();
  const facets: Record<string, { source: string; terms: string[] }> = {
    kind: { source: "suitability row kinds: the five party categories (src/destinations-types.ts) + golf course (src/golf.ts)", terms: ["activity", "dining", "golf-course", "lodging", "nightlife", "transport"] },
    "activity.type": {
      source: "observed on sharedDestinations activities ∪ keys of CATEGORY_OF (src/tags.ts) ∪ MOH_/BESTMAN_ACTIVITY_TYPES (src/destinations-overlay.ts)",
      terms: o.activityTypes,
    },
    "activity.category": { source: "ActivityCategory union (src/tags.ts)", terms: ACTIVITY_CATEGORIES },
    "nightlife.type": { source: "observed on sharedDestinations nightlife", terms: o.nightlifeTypes },
    "nightlife.vibe": { source: "PartyVibe union (src/destinations-types.ts)", terms: PARTY_VIBES },
    "destination.id": { source: "sharedDestinations ids (party destinations)", terms: o.destinationIds },
    "lodging.type": { source: "CanonicalLodging.type union (src/destinations-types.ts)", terms: LODGING_TYPES },
    "transport.type": { source: "CanonicalTransport.type union (src/destinations-types.ts)", terms: TRANSPORT_TYPES },
    "party.region": { source: "CanonicalRegion union (src/destinations-types.ts)", terms: PARTY_REGIONS },
    "golf.region": { source: "observed on SHARED_GOLF_COURSES", terms: o.golfRegion },
    "golf.tier": { source: "observed on SHARED_GOLF_COURSES", terms: o.golfTier },
    "golf.style": { source: "observed on SHARED_GOLF_COURSES", terms: o.golfStyle },
    "place.scope": {
      source: "derived: party row → its destination's region === \"international\" ⇒ non-us; golf course → region === \"International\" ⇒ non-us; else us",
      terms: ["non-us", "us"],
    },
    "residence.setting": { source: "observed on ALL_RESIDENCES", terms: o.residenceSetting },
    "residence.goodFor": { source: "observed on ALL_RESIDENCES", terms: RESIDENCE_GOOD_FOR },
    "oo.kind": { source: "observed on ooExperiences", terms: o.ooKind },
  };
  // Facets that exist only as free-text-tag targets: their terms are exactly the
  // ones TAG_RULES emits (so no term is declared that nothing produces).
  const emitted = new Map<string, Set<string>>();
  for (const [, emits] of TAG_RULES)
    for (const e of emits) {
      const [f, t] = e.split(/:(.*)/s);
      if (!emitted.has(f)) emitted.set(f, new Set());
      emitted.get(f)!.add(t);
    }
  for (const [f, terms] of emitted) {
    if (facets[f]) {
      const missing = [...terms].filter((t) => !facets[f].terms.includes(t));
      if (missing.length) throw new Error(`TAG_RULES emit ${f} terms not in the facet: ${missing.join(", ")}`);
    } else facets[f] = { source: "free-text tag mapping (TAG_RULES in scripts/corpus/vocab-build.ts)", terms: [...terms].sort() };
  }
  for (const [name, lx] of Object.entries(LEXICONS)) facets[name] = { source: lx.source, terms: [...lx.terms] };

  const tagSources = { "residence.tags": countTags(ALL_RESIDENCES), "oo.tags": countTags(ooExperiences) };
  const tagMap: Record<string, Record<string, string[]>> = {};
  const unmapped: { source: string; tag: string; count: number; reason: string }[] = [];
  const stats: Record<string, { distinct: number; uses: number; mappedDistinct: number; mappedUses: number }> = {};
  for (const [src, tags] of Object.entries(tagSources)) {
    tagMap[src] = {};
    const s = { distinct: tags.length, uses: 0, mappedDistinct: 0, mappedUses: 0 };
    for (const [tag, n] of tags) {
      s.uses += n;
      const m = mapTag(tag);
      if (m.length) {
        tagMap[src][tag] = m;
        s.mappedDistinct++;
        s.mappedUses += n;
      } else unmapped.push({ source: src, tag, count: n, reason: unmappedReason(tag) });
    }
    stats[src] = s;
  }
  return {
    $schema: "shared-data vocab — see scripts/corpus/vocab-build.ts",
    version: VOCAB_VERSION,
    note: "Controlled vocabulary (CORPUS-M4). Generated — edit scripts/corpus/vocab-build.ts or scripts/corpus/lexicons.ts and re-run; never hand-edit. No consumer reads this file yet.",
    facets,
    categoryOf: Object.fromEntries(Object.entries(CATEGORY_OF).sort(([a], [b]) => a.localeCompare(b))),
    tagMap,
    tagStats: stats,
    unmapped,
    image: { status: "empty-until-M6", subject: [] as string[], scene: [] as string[], mood: [] as string[] },
  };
}

export function renderVocab(): string {
  return JSON.stringify(buildVocab(), null, 2) + "\n";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = renderVocab();
  if (process.argv.includes("--check")) {
    const cur = existsSync(VOCAB_PATH) ? readFileSync(VOCAB_PATH, "utf8") : "";
    if (cur !== out) {
      console.error("✗ vocab/v1.json is stale — run: npx tsx scripts/corpus/vocab-build.ts");
      process.exit(1);
    }
    console.log("✓ vocab/v1.json is current");
  } else {
    mkdirSync(dirname(VOCAB_PATH), { recursive: true });
    writeFileSync(VOCAB_PATH, out);
    const v = JSON.parse(out);
    console.log(`wrote vocab/v1.json ${v.version}: ${Object.keys(v.facets).length} facets`, JSON.stringify(v.tagStats), `unmapped ${v.unmapped.length}`);
  }
}
