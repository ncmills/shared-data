/**
 * destinations-expansion-midwest-proposal-0818.ts — researched party rows that
 * attach to THREE EXISTING Midwest destinations, added 2026-08-18.
 *
 * WHY A SEPARATE FILE AND WHY THIS SHAPE. These rows are not new cities, so
 * they cannot go in a `destinations-expansion-<region>.ts` file — those export
 * whole `CanonicalDestination` objects and a duplicate id would be a fork, not
 * an addition. They are ITEMS on existing destinations, which is exactly what
 * `PartyVenueExpansionRow` + `attachPartyVenues()` exist for (see
 * `party-venues-expansion.ts` for why machines never hand-edit the curated
 * nested files). Each row carries an EXPLICIT `destinationId` anchor, resolved
 * against the real universe at assembly time and fatal on a miss.
 *
 * It is its own file rather than an append to `party-venues-expansion.ts` so a
 * parallel Northeast batch cannot collide with it in the same diff.
 *
 * ─────────────────────────── WHAT THIS IS FOR ───────────────────────────────
 *
 * Proposalmoon (engagedmoon) receives rows ONLY from destinations that clear
 * its build-time viability gate (`~/engagedmoon/scripts/build-viable-destinations.ts`):
 * 6 couple-bookable activities of an allowed type, 3 dining of which 2 upscale,
 * 2 quiet bars of an allowed type, 1 boutique-hotel/resort stay, and 1
 * capstone-eligible proposal spot. On 2026-08-18 exactly ONE of the 33 Midwest
 * destinations cleared it (Chicago), which is why every `midwest|*` cell in
 * that planner's gap report read 0 — not because the Midwest catalog is empty,
 * but because no Midwest city was reachable.
 *
 * These rows are chosen to flip three near-miss cities:
 *
 *   traverse-city-mi   activities 3→8, dining 2→3
 *   door-county-wi     activities 4→7, dining 2→3, upscale 1→2, bars 1→3
 *   mackinac-island-mi activities 6→7, dining 2→3, upscale 1→2, bars 0→2
 *
 * and to fill the aspect cells the gap briefs named (`equestrian`, `cycling`,
 * `winter`, `field-sports`) with offerings the region GENUINELY has. Nothing
 * here is padding: the sleigh ride and the ski rows are real winter operators
 * in real snow country, and no winter row was invented for a city that does
 * not have one (Mackinac Island gets none, because MSHP's own guidelines say
 * its sites are "open from early-May through mid-October").
 *
 * ───────────────────────────── PROVENANCE ───────────────────────────────────
 *
 * Every row was found by search and CONFIRMED by fetching the operator's own
 * page: the operator is real, offers the thing, and the price band below comes
 * from the operator's published rates or is omitted. `sourceUrl` is the page
 * that was actually read — `attachPartyVenues` mirrors it onto `url`, so it
 * reaches the rendered row. Where an operator publishes no rates (Mission
 * Point Resort, Hotel Iroquois, The Dörr Hotel — all real, all checked) the
 * LODGING ROW WAS LEFT OUT rather than given an invented band.
 *
 * ───────────────────────── TAGGING, AT INGEST ───────────────────────────────
 *
 * `brands: ["both"]` on every event row, which the bake turns into
 * bestman + moh + offsite-outing + friendsmoon + engagedmoon (see
 * destinations-bake.ts). None of these types is in `ACTIVITY_AUDIENCE_TAGS`,
 * so none is audience-restricted, and that is correct — a trail ride, a bike
 * rental and a charter are legitimately all five trips. Handicap HQ is
 * deliberately NOT reachable: its engine reads only golf, so a tag would be an
 * orphan (engine-reads.ts).
 *
 * Copy is written to survive every sibling's brand sweep at once, which is a
 * real constraint and not a stylistic one: Proposalmoon's catalog-row check
 * drops any row whose name or highlight contains "group(s)", "crawl", "shot",
 * "bachelor(ette)", "offsite" or "nightclub", so a row written in the party
 * voice would be silently invisible to the planner it was added for.
 */
import type { PartyVenueExpansionRow } from "./party-venues-expansion";

export const expansionMidwestProposal0818: PartyVenueExpansionRow[] = [
  // ───────────────────────── Traverse City, MI ──────────────────────────────
  {
    destinationId: "traverse-city-mi", category: "activity",
    name: "Einstein Cycles TART Trail bike rental",
    type: "biking", duration: "Half or full day", pricePerPerson: [45, 55],
    groupMin: 2, groupMax: 8,
    highlight:
      "The shop's back door opens onto the TART Trail, which runs paved through downtown and on to the Leelanau Trail's orchards and farmland. Published rates are $45 for up to four hours and $55 for a full day.",
    bestFor: "an easy first morning on two wheels",
    brands: ["both"],
    sourceUrl: "https://www.einsteincycles.com/rentals",
    citations: ["https://www.einsteincycles.com/rentals"],
  },
  {
    destinationId: "traverse-city-mi", category: "activity",
    name: "Ranch Rudolf guided trail ride, Boardman River Valley",
    type: "horseback-riding", duration: "1.5-2.5 hr", pricePerPerson: [68, 110],
    groupMin: 2, groupMax: 10,
    highlight:
      "A 195-acre ranch in the Boardman River Valley running walk-paced guided rides May through October — the 90-minute Wrangler at $68 a rider and the 2.5-hour Bronco at $110. Reservations by phone only.",
    bestFor: "a slow afternoon out of town",
    brands: ["both"],
    sourceUrl: "https://ranchrudolf.com/outdoor-recreation/",
    citations: ["https://ranchrudolf.com/outdoor-recreation/"],
  },
  {
    destinationId: "traverse-city-mi", category: "activity",
    name: "Ranch Rudolf horse-drawn sleigh ride",
    type: "sleigh-ride", duration: "40 min", pricePerPerson: [18, 90],
    groupMin: 2, groupMax: 20,
    highlight:
      "Roughly 40 minutes behind a team through the Boardman Valley, published at a flat $180 for two to ten people and $18 a head above that. Runs Labor Day through early March.",
    bestFor: "a winter evening",
    // `["moh"]`, not `["both"]`, and NOT because a sleigh ride is gendered.
    // `sleigh-ride` is in `MOH_ACTIVITY_TYPES` and absent from
    // `BESTMAN_ACTIVITY_TYPES` (destinations-overlay.ts), so a bestman tag here
    // would be an ORPHAN — tagged and structurally unrenderable, which
    // `overlay-type-allowlist.test.ts` catches and this repo has paid for
    // before. The catalog's only other sleigh-ride row (Aspen's Ashcroft
    // dinner ride) is branded the same way for the same reason. Widening Best
    // Man HQ's type union is that site's product call, not this batch's.
    // Proposalmoon is unaffected: `sleigh-ride` is in its ACTIVITY_ALLOW, and
    // the bake still routes this to moh + offsite-outing + friendsmoon +
    // engagedmoon.
    brands: ["moh"],
    sourceUrl: "https://ranchrudolf.com/outdoor-recreation/",
    citations: ["https://ranchrudolf.com/outdoor-recreation/"],
  },
  {
    destinationId: "traverse-city-mi", category: "activity",
    name: "Vasa Pathway cross-country skiing",
    type: "skiing", duration: "2-4 hr", pricePerPerson: [0, 0],
    groupMin: 2, groupMax: 20,
    highlight:
      "3K, 5K, 10K and 25K loops through the Pere Marquette State Forest, groomed by TART Trails under an agreement with the Michigan DNR and Grand Traverse County. No fee; TART asks trail users for donations toward the grooming.",
    bestFor: "a quiet winter morning",
    brands: ["both"],
    sourceUrl: "https://traversetrails.org/trail/vasa-pathway/",
    citations: ["https://traversetrails.org/trail/vasa-pathway/"],
  },
  {
    destinationId: "traverse-city-mi", category: "activity",
    name: "Fish With Jim Outfitters Grand Traverse Bay charter",
    type: "fishing", duration: "4 hr", pricePerPerson: [140, 255],
    groupMin: 2, groupMax: 6,
    highlight:
      "Lake trout, salmon and steelhead off a 24-foot Angler Qwest on Grand Traverse Bay. Published at $510 for up to three anglers for four hours, $110 for each additional angler to a maximum of six.",
    bestFor: "an early start on the water",
    brands: ["both"],
    sourceUrl: "https://www.fishwithjimoutfitters.com/grand-traverse-bay-fishing-trips",
    citations: ["https://www.fishwithjimoutfitters.com/grand-traverse-bay-fishing-trips"],
  },
  {
    destinationId: "traverse-city-mi", category: "activity",
    name: "Current Works fly-fishing float, Boardman or Manistee",
    type: "fishing", duration: "4-8 hr", pricePerPerson: [200, 275],
    groupMin: 2, groupMax: 2,
    highlight:
      "Ted Kraimer floats the Manistee, Betsie and Boardman for trout and steelhead, one or two anglers to a boat. Published at $400 for a four-hour float and $550 for the eight-hour day, tackle included.",
    bestFor: "a day on a trout river for two",
    brands: ["both"],
    sourceUrl: "https://www.current-works.com/northern-michigan-fly-fishing-guide-trips/",
    citations: ["https://www.current-works.com/northern-michigan-fly-fishing-guide-trips/"],
  },
  {
    destinationId: "traverse-city-mi", category: "dining",
    name: "The Cooks' House",
    cuisine: "Farm-to-fork",
    priceRange: "$$$",
    highlight:
      "A chef-owned 26-seat room on Wellington Street, white linens, menu rewritten around what the farms and foragers bring in. Reservations required through Tock; the stated dress code is “clothes.”",
    bestFor: "the dinner the trip is built around",
    groupFriendly: false,
    brands: ["both"],
    sourceUrl: "https://www.cookshousetc.com/",
    citations: ["https://www.cookshousetc.com/"],
  },
  {
    destinationId: "traverse-city-mi", category: "lodging",
    name: "Ranch Rudolf ranch room",
    type: "hotel", pricePerNight: [134, 194], perRoom: true, maxGuests: 4,
    highlight:
      "Rooms at the Boardman Valley ranch, sleeping two to four. Published from $134 a night in winter, $144 in spring and fall, and $174-$194 June through Labor Day; closed November and April.",
    sourceUrl: "https://ranchrudolf.com/lodging/",
    citations: ["https://ranchrudolf.com/lodging/"],
  },
  {
    destinationId: "traverse-city-mi", category: "lodging",
    name: "Ranch Rudolf Bunk House",
    type: "house", pricePerNight: [465, 568], perRoom: false, maxGuests: 12,
    highlight:
      "The ranch's bunk house, published at $465 a night for up to nine plus a $55 resort fee, and $16 a head for each additional guest to a maximum of twelve.",
    sourceUrl: "https://ranchrudolf.com/lodging/",
    citations: ["https://ranchrudolf.com/lodging/"],
  },

  // ─────────────────────────── Door County, WI ──────────────────────────────
  {
    destinationId: "door-county-wi", category: "activity",
    name: "Kurtz Corral guided wooded trail ride",
    type: "horseback-riding", duration: "30 min - 1 hr", pricePerPerson: [40, 75],
    groupMin: 2, groupMax: 10,
    highlight:
      "A family-run stable on Howard Lane in Sturgeon Bay, riding out through old Door County orchard and forest. Published at $75 a rider for the hour-long Wooded Walk and $40 for the 30-minute arena ride; open year-round on reduced winter hours.",
    bestFor: "a morning inland",
    brands: ["both"],
    sourceUrl: "https://kurtzcorral.com/rates/",
    citations: ["https://kurtzcorral.com/rates/"],
  },
  {
    destinationId: "door-county-wi", category: "activity",
    name: "Nor Door ski and snowshoe rental, Peninsula State Park",
    type: "skiing", duration: "Half or full day", pricePerPerson: [20, 50],
    groupMin: 2, groupMax: 12,
    highlight:
      "The Fish Creek shop sits directly across the road from Peninsula State Park, which it describes as 16 miles of groomed, mostly double-tracked ski trail plus six miles of designated snowshoe trail. Cross-country skis are published at $25 adult, snowshoes at $20 for the day.",
    bestFor: "a snow day on the peninsula",
    brands: ["both"],
    sourceUrl: "https://www.nordoorsports.com/about/skis-snowshoes-sledding-tubes-pg83.htm",
    citations: [
      "https://www.nordoorsports.com/about/skis-snowshoes-sledding-tubes-pg83.htm",
      "https://dnr.wisconsin.gov/topic/parks/peninsula/recreation",
    ],
  },
  {
    destinationId: "door-county-wi", category: "activity",
    name: "Lakeshore Adventures charter out of Baileys Harbor",
    type: "fishing", duration: "3-5 hr", pricePerPerson: [125, 375],
    groupMin: 2, groupMax: 6,
    highlight:
      "Chinook salmon, lake trout, brown trout and steelhead off the 37-foot Fat Kat, captain and mate and all tackle included. Published at $750 for the three-hour trip and $950 for five hours, up to six aboard.",
    bestFor: "a morning on Lake Michigan",
    brands: ["both"],
    sourceUrl: "https://lakeshore-adventures.com/charter-fishing-door-county/",
    citations: [
      "https://lakeshore-adventures.com/charter-fishing-door-county/",
      "https://www.fishingdoorcounty.com/fishing-charter-trip-pricing/",
    ],
  },
  {
    destinationId: "door-county-wi", category: "dining",
    name: "Chives Door County",
    cuisine: "Farm-to-table French-inspired",
    priceRange: "$$$",
    highlight:
      "Farm-to-table cooking on Highway 57 in Baileys Harbor, much of it grown on the property. Published entrees run $20 to $58; dinner Thursday through Monday from 4pm, Sunday brunch from 9am.",
    bestFor: "the long dinner",
    groupFriendly: true,
    brands: ["both"],
    sourceUrl: "https://www.chivesdoorcounty.com/dinner",
    citations: ["https://www.chivesdoorcounty.com/dinner"],
  },
  {
    destinationId: "door-county-wi", category: "nightlife",
    name: "Mezzanine",
    type: "rooftop-bar", vibe: "chill", priceRange: "$$$",
    highlight:
      "A rooftop bar on Horseshoe Bay Road in Egg Harbor pouring a house cocktail list — lavender gin fizz, supper-club old fashioned, cherry mule — plus wine and beer. Closed Tuesday and Wednesday.",
    reservationNeeded: false, groupFriendly: true, lateNight: false,
    brands: ["both"],
    sourceUrl: "https://www.mezzaninerooftop.com/cocktails",
    citations: ["https://www.mezzaninerooftop.com/cocktails"],
  },
  {
    destinationId: "door-county-wi", category: "nightlife",
    name: "Hatch Distilling Co. tasting room",
    type: "tasting-room", vibe: "chill", priceRange: "$$",
    highlight:
      "A working distillery on Highway 42 in downtown Egg Harbor with a tasting room open daily from noon, pouring its own spirits straight and in seasonal cocktails.",
    reservationNeeded: false, groupFriendly: true, lateNight: false,
    brands: ["both"],
    sourceUrl: "https://www.hatchdistilling.com/",
    citations: ["https://www.hatchdistilling.com/"],
  },

  // ───────────────────────── Mackinac Island, MI ────────────────────────────
  {
    destinationId: "mackinac-island-mi", category: "activity",
    name: "Jack's Livery Stable guided saddle horse ride",
    type: "horseback-riding", duration: "1-2 hr", pricePerPerson: [75, 150],
    groupMin: 2, groupMax: 8,
    highlight:
      "Saddle horses out of the Mahoney Avenue barn onto the island's interior trails, published at $75 a rider for the hour, $112.50 for 90 minutes and $150 for two hours. Offered May through Labor Day; saddle-horse reservations are same-day and in person only.",
    bestFor: "the island as it was meant to be crossed",
    brands: ["both"],
    sourceUrl: "https://www.jacksliverystable.com/general-info",
    citations: ["https://www.jacksliverystable.com/general-info"],
  },
  {
    destinationId: "mackinac-island-mi", category: "dining",
    name: "Woods Restaurant",
    cuisine: "Fine dining / wild game",
    priceRange: "$$$$",
    highlight:
      "A Tudor hunting lodge on Cudahy Circle, inland from the harbor, cooking Midwest heritage ingredients and wild game. Published entrees run $42 to $78; dinner nightly mid-May through late October.",
    bestFor: "the dinner worth the ride out",
    groupFriendly: true,
    brands: ["both"],
    sourceUrl: "https://www.grandhotel.com/dining/woods-restaurant/",
    citations: ["https://www.grandhotel.com/dining/woods-restaurant/"],
  },
  {
    destinationId: "mackinac-island-mi", category: "nightlife",
    name: "Cupola Bar",
    type: "rooftop-bar", vibe: "chill", priceRange: "$$$",
    highlight:
      "The bar at the top of Grand Hotel, 180 degrees of the Straits of Mackinac and the bridge from the fifth and sixth floors. Published hours run noon to 1am daily, May 1 through October 25.",
    reservationNeeded: false, groupFriendly: true, lateNight: true,
    brands: ["both"],
    sourceUrl: "https://www.grandhotel.com/dining/cupola-bar/",
    citations: ["https://www.grandhotel.com/dining/cupola-bar/"],
  },
  {
    destinationId: "mackinac-island-mi", category: "nightlife",
    name: "Baroque",
    type: "cocktail-bar", vibe: "chill", priceRange: "$$$$",
    highlight:
      "A small bar beside Grand Hotel's Parlor built around brown spirits — whiskies and cognacs — with an elevated wine list and small plates. Published hours run 11am to midnight daily, May 2 through October 25.",
    reservationNeeded: false, groupFriendly: false, lateNight: true,
    brands: ["both"],
    sourceUrl: "https://www.grandhotel.com/dining/baroque/",
    citations: ["https://www.grandhotel.com/dining/baroque/"],
  },
];
