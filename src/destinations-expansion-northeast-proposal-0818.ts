/**
 * destinations-expansion-northeast-proposal-0818.ts — rows that make three
 * Northeast cities carry a proposal trip.
 *
 * WHY THIS FILE IS A FLAT ARRAY AND NOT A `destinations-expansion-*` FILE.
 * The five region files each hold NEW destinations. Nothing here is a new
 * city: Newport, Stowe and Lake Placid have all been in the catalog since the
 * 2026-06-24 northeast expansion. These are ADDITIONAL rows on existing
 * destinations, which is exactly what `party-venues-attach.ts` was built for —
 * an explicit `destinationId` anchor, fatal on a miss, merged before
 * `bakeDestination` so an added row is tagged by the identical code path as a
 * curated one. Hand-editing the nested curated files is the thing this repo
 * decided machines never do; this follows the same rule for the same reason.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS IS FOR, MEASURED RATHER THAN ASSERTED
 *
 * Proposalmoon (engagedmoon) only offers cities that clear a build-time
 * viability gate (`engagedmoon/scripts/build-viable-destinations.ts`): six
 * couple-bookable activities of allowed types, three dining rows of which two
 * are upscale, two quiet bars, one boutique-hotel-or-resort stay, and one
 * capstone-eligible proposal spot. 37 of 212 destinations pass, and BEFORE this
 * batch the northeast contributed exactly one of them. That is why every
 * northeast cell in the 2026-08-18 catalog POV reads 0 — not because the region
 * is thin in the catalog, but because almost no northeast city was ever handed
 * to that planner at all.
 *
 * Measured against the real predicate at HEAD, the three cities failed like
 * this and nothing else:
 *
 *   newport-ri       acts 3/6                                     stays 1/1
 *   stowe-vt         acts 6/6  dining 2/3  QUIET BARS 0/2         stays 1/1
 *   lake-placid-ny   acts 6/6  dining 3/3  QUIET BARS 0/2  capstones 0/1
 *
 * So the rows below are aimed at those specific holes, and at the aspect cells
 * the same report flagged (`northeast|equestrian`, `|cycling`, `|winter`,
 * `nightlife|1`, `dining|4`, `lodging|3`, `lodging|4`). Nothing was added to
 * pad a count: a row is here because a real operator in that city offers the
 * thing, with a source that names them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS DELIBERATELY NOT HERE
 *
 * `northeast|motorsport`. Lime Rock, Watkins Glen and New Hampshire Motor
 * Speedway are real and do sell driving experiences — and `racing` /
 * `go-karts` are both on Proposalmoon's REJECTED list (`ACTIVITY_ALLOW` in
 * engagedmoon `src/lib/trip.ts`), so a row for one closes nothing for the
 * planner this batch is for. The only motorsport type that planner reads is
 * `atv`, and none of these three towns has a couple-appropriate ATV operator
 * that publishes anything. An honest 0 beats a row aimed at a cell.
 *
 * A third `equestrian` row. Two are here with published rates. The Lake Placid
 * candidates (Emerald Springs Adirondack Ranch, Adirondack Equine Center) are
 * real, reachable and year-round, and neither publishes a price anywhere —
 * so the cell moves 0 -> 2 rather than being closed with an invented band.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SOURCING
 *
 * Every row carries `sourceUrl` (the operator's own page wherever one exists)
 * and `citations`, and both ride through onto the canonical row via
 * `toCanonicalRow`. Each was fetched on 2026-08-18 and read for the OFFERING,
 * not for a 200 — a live URL that does not sell the thing is the failure mode
 * that put a construction company under a Santa Fe dinner row.
 *
 * Prices are the operator's published figures where they publish one. They are
 * NOT repeated in `highlight` prose: a dollar figure in a highlight renders
 * next to a planner's own reconciled money card and is a contradiction waiting
 * to happen, and the structured fields already carry it. Clock times are left
 * out of `highlight` for the same reason (Proposalmoon cut its timing layer);
 * seasons stay, because a season is what actually decides whether a couple can
 * do the thing in the month they are going.
 */

import type { PartyVenueExpansionRow } from "./party-venues-expansion";

export const northeastProposal0818: PartyVenueExpansionRow[] = [
  // ───────────────────────────── Newport, RI ─────────────────────────────
  // Fails viability on activities alone (3 of 6). Its two existing proposal
  // spots (Forty Steps on the Cliff Walk, Brenton Point) already qualify.
  {
    destinationId: "newport-ri",
    category: "activity",
    name: "Newport Equestrian Academy beach + wildlife-refuge trail ride",
    type: "horseback-riding",
    duration: "2 hr",
    pricePerPerson: [200, 200],
    groupMin: 1,
    groupMax: 8,
    highlight:
      "Two hours on horseback out of the Third Beach Road barn in Middletown, past two beaches and into a wildlife preserve with St. George's tower on the hill above. No riding experience needed; instruction and helmets before you leave the yard.",
    bestFor: "a slow half-day outdoors",
    brands: ["both"],
    reservationNeeded: true,
    walkUpAccess: false,
    url: "https://www.newportequestrian.com/trail-rides",
    sourceUrl: "https://www.newportequestrian.com/trail-rides",
    citations: [
      "https://www.newportequestrian.com/trail-rides",
      "https://www.newportequestrian.com/about",
      "https://www.discovernewport.org/listing/newport-equestrian-academy/1024/",
    ],
  },
  {
    destinationId: "newport-ri",
    category: "activity",
    name: "Ocean Drive + Bellevue Avenue bike loop (Ten Speed Spokes)",
    type: "biking",
    duration: "3 hr",
    pricePerPerson: [30, 60],
    groupMin: 1,
    groupMax: 10,
    highlight:
      "Hybrids and e-bikes from the Elm Street shop beside the waterfront, then the Ocean Drive and Bellevue Avenue loop past Brenton Point and the mansion gates. Helmet and lock included; rentals are first come, first served.",
    bestFor: "a clear morning",
    brands: ["both"],
    walkUpAccess: true,
    url: "https://www.tenspeedspokes.com/about/rentals-pg64.htm",
    sourceUrl: "https://www.tenspeedspokes.com/about/rentals-pg64.htm",
    citations: [
      "https://www.tenspeedspokes.com/about/rentals-pg64.htm",
      "https://www.tenspeedspokes.com/",
    ],
  },
  {
    destinationId: "newport-ri",
    category: "activity",
    name: "Sachuest Point National Wildlife Refuge shoreline loop",
    type: "hiking",
    duration: "2 hr",
    pricePerPerson: [0, 0],
    groupMin: 1,
    groupMax: 12,
    highlight:
      "A free federal refuge on the point past Second Beach — flat trails around the headland over open rock and beach rose, with migratory birds year-round and harbour seals offshore through the winter. Surf on the shoreline can be dangerous; stay above it.",
    bestFor: "a quiet afternoon walk",
    brands: ["both"],
    walkUpAccess: true,
    url: "https://www.fws.gov/refuge/sachuest-point",
    sourceUrl: "https://www.fws.gov/refuge/sachuest-point",
    citations: ["https://www.fws.gov/refuge/sachuest-point"],
  },
  {
    destinationId: "newport-ri",
    category: "dining",
    name: "Aurelia at Castle Hill",
    cuisine: "Coastal New England tasting menu",
    priceRange: "$$$$",
    highlight:
      "Chef Quentin Diez's six-course tasting menu in the 1875 mansion at the end of Ocean Drive, with Narragansett Bay filling the windows. Formerly The Dining Room at Castle Hill; a card is taken at booking.",
    bestFor: "dinner",
    groupFriendly: false,
    reservationNeeded: true,
    brands: ["both"],
    url: "https://www.castlehillinn.com/dine/",
    sourceUrl: "https://www.castlehillinn.com/dine/",
    citations: [
      "https://www.castlehillinn.com/dine/",
      "https://www.relaischateaux.com/us/hotel/castle-hill-inn/",
    ],
  },
  {
    destinationId: "newport-ri",
    category: "lodging",
    name: "Castle Hill Inn",
    type: "boutique-hotel",
    pricePerNight: [595, 2300],
    perRoom: true,
    maxGuests: 2,
    highlight:
      "Relais & Châteaux inn on its own point at the end of Ocean Drive — 33 rooms, suites and shingled beach houses, a lighthouse on the rocks below, and the only private beach attached to a Newport hotel.",
    url: "https://www.castlehillinn.com/",
    sourceUrl: "https://www.relaischateaux.com/us/hotel/castle-hill-inn/",
    citations: [
      "https://www.castlehillinn.com/",
      "https://www.relaischateaux.com/us/hotel/castle-hill-inn/",
    ],
  },

  // ────────────────────────────── Stowe, VT ──────────────────────────────
  // Passes activities; failed on dining (2 of 3) and on QUIET BARS (0 of 2) —
  // the catalog carried only a bar and a beer garden, neither of which is in
  // Proposalmoon's `NIGHTLIFE_ALLOW`. Its Sterling Pond spot already qualifies.
  {
    destinationId: "stowe-vt",
    category: "activity",
    name: "Mount Mansfield Equestrian Center trail ride",
    type: "horseback-riding",
    duration: "1 hr",
    pricePerPerson: [80, 80],
    groupMin: 1,
    groupMax: 8,
    highlight:
      "An hour in the saddle from the Mountain Road barn — over a covered bridge, across the brook and out into a meadow under Mount Mansfield. Rides run May through November, by reservation, and fill a week ahead.",
    bestFor: "a summer or foliage morning",
    brands: ["both"],
    reservationNeeded: true,
    reservationLeadDays: 7,
    walkUpAccess: false,
    url: "https://www.mountmansfieldequestriancenter.com/program",
    sourceUrl: "https://www.mountmansfieldequestriancenter.com/program",
    citations: [
      "https://www.mountmansfieldequestriancenter.com/program",
      "https://www.mountmansfieldequestriancenter.com/",
      "https://www.sprucepeak.com/play/activities-horseback",
    ],
  },
  {
    destinationId: "stowe-vt",
    category: "activity",
    name: "Trapp Family Lodge horse-drawn sleigh ride",
    type: "sleigh-ride",
    duration: "1 hr",
    pricePerPerson: [25, 50],
    groupMin: 1,
    groupMax: 10,
    highlight:
      "Belgian horses pull custom-built sleighs through the meadows above Stowe from the Outdoor Center, with smaller sleds kept back for two. Winter only — the same team runs carriages once the snow goes. Reservations required, cash only.",
    bestFor: "a winter evening",
    brands: ["both"],
    reservationNeeded: true,
    walkUpAccess: false,
    url: "https://www.vontrappresort.com/sleigh-carriage-rides.htm",
    sourceUrl: "https://www.vontrappresort.com/sleigh-carriage-rides.htm",
    citations: [
      "https://www.vontrappresort.com/sleigh-carriage-rides.htm",
      "https://www.vontrappresort.com/winter.htm",
    ],
  },
  {
    destinationId: "stowe-vt",
    category: "activity",
    name: "Trapp Family Lodge Outdoor Center cross-country ski day",
    type: "skiing",
    duration: "4 hr",
    pricePerPerson: [17, 37],
    groupMin: 1,
    groupMax: 12,
    highlight:
      "Over 60 km of groomed Nordic trails across 2,500 acres of Green Mountain hillside, plus backcountry terrain above them — the first cross-country ski centre in the United States. Passes, rentals and lessons at the Outdoor Center; winter season only.",
    bestFor: "a winter day",
    brands: ["both"],
    walkUpAccess: true,
    url: "https://www.vontrappresort.com/skiing-snowshoeing.htm",
    sourceUrl: "https://www.vontrappresort.com/skiing-snowshoeing.htm",
    citations: [
      "https://www.vontrappresort.com/skiing-snowshoeing.htm",
      "https://skivermont.com/von-trapp-family-lodge-xc-ski-center",
    ],
  },
  {
    destinationId: "stowe-vt",
    category: "activity",
    name: "Stowe Recreation Path ride (Ranch Camp rental)",
    type: "biking",
    duration: "3 hr",
    pricePerPerson: [65, 89],
    groupMin: 1,
    groupMax: 10,
    highlight:
      "Gravel and trail bikes out of the Mountain Road shop, then the paved Recreation Path along the West Branch back into the village — flat, car-free and about five miles each way. Rentals by the two hours, half day or full day.",
    bestFor: "an easy afternoon",
    brands: ["both"],
    walkUpAccess: true,
    url: "https://www.ranchcampvt.com/articles/rentals-demos-pg191.htm",
    sourceUrl: "https://www.ranchcampvt.com/articles/rentals-demos-pg191.htm",
    citations: ["https://www.ranchcampvt.com/articles/rentals-demos-pg191.htm"],
  },
  {
    destinationId: "stowe-vt",
    category: "dining",
    name: "Alpine Hall at Spruce Peak",
    cuisine: "Vermont farm-to-table",
    priceRange: "$$$",
    highlight:
      "Chef Sean Blomgren's room at the Spruce Peak base, built on the region's growers, farmers and makers — a short, worked-over menu rather than a long one. Dinner nightly by reservation; breakfast is buffet.",
    bestFor: "dinner",
    groupFriendly: true,
    reservationNeeded: true,
    brands: ["both"],
    url: "https://www.sprucepeak.com/dine/alpine-hall",
    sourceUrl: "https://www.sprucepeak.com/dine/alpine-hall",
    citations: [
      "https://www.sprucepeak.com/dine/alpine-hall",
      "https://www.sprucepeak.com/dine/",
    ],
  },
  {
    destinationId: "stowe-vt",
    category: "nightlife",
    name: "Cork Restaurant & Natural Wine Shop",
    type: "wine-bar",
    vibe: "chill",
    priceRange: "$$$",
    highlight:
      "A small mid-century room on School Street pouring natural, organic and biodynamic wine by the glass, with a kitchen menu that changes almost daily. The bar keeps going after the kitchen closes; shut Tuesday and Wednesday.",
    reservationNeeded: true,
    groupFriendly: false,
    lateNight: true,
    brands: ["both"],
    url: "https://www.corkvt.com/",
    sourceUrl: "https://www.corkvt.com/",
    citations: [
      "https://www.corkvt.com/",
      "https://gostowe.com/listing/cork-wine-bar-market-of-stowe",
    ],
  },
  {
    destinationId: "stowe-vt",
    category: "nightlife",
    name: "Tipsy Trout at Spruce Peak",
    type: "cocktail-bar",
    vibe: "chill",
    priceRange: "$$$",
    highlight:
      "Raw bar and artisan cocktails at the Spruce Peak base, on a wine list that has taken the Wine Spectator Award of Excellence two years running. There is an oyster hour before dinner and a late bar after it; closed Monday and Tuesday.",
    reservationNeeded: true,
    groupFriendly: true,
    lateNight: true,
    brands: ["both"],
    url: "https://www.sprucepeak.com/dine/tipsy-trout",
    sourceUrl: "https://www.sprucepeak.com/dine/tipsy-trout",
    citations: [
      "https://www.sprucepeak.com/dine/tipsy-trout",
      "https://www.sprucepeak.com/dine/",
    ],
  },
  {
    destinationId: "stowe-vt",
    category: "nightlife",
    name: "Smugglers' Notch Distillery Tasting Room, Stowe",
    type: "tasting-room",
    vibe: "chill",
    priceRange: "$",
    highlight:
      "The Jeffersonville distillery's Main Street room in Stowe village — bourbon, rye, rum and gin poured by staff who make them, plus the maple syrup finished in their own bourbon barrels. Open daily, year-round.",
    reservationNeeded: false,
    groupFriendly: true,
    lateNight: false,
    brands: ["both"],
    url: "https://smugglersnotchdistillery.com/pages/tasting-rooms",
    sourceUrl: "https://smugglersnotchdistillery.com/pages/tasting-rooms",
    citations: [
      "https://smugglersnotchdistillery.com/pages/tasting-rooms",
      "https://smugglersnotchdistillery.com/",
    ],
  },

  // ─────────────────────────── Lake Placid, NY ───────────────────────────
  // Passed activities, dining and stays; failed on QUIET BARS (0 of 2, the
  // catalog held two beer gardens and a pub) and on CAPSTONES (0 — no
  // researched proposal spot existed for the town at all). The three spots are
  // in `data/proposal-spot-research/spots-adirondacks-0818.json`.
  {
    destinationId: "lake-placid-ny",
    category: "nightlife",
    name: "Maggie's Pub at Lake Placid Lodge",
    type: "lounge",
    vibe: "chill",
    priceRange: "$$$",
    highlight:
      "A wood-panelled room one floor below the lobby of the Relais & Châteaux lodge: a small bar of local beer, wine and rare spirits, a stacked-stone fireplace, billiards and a terrace over the water. Open daily.",
    reservationNeeded: false,
    groupFriendly: true,
    lateNight: false,
    brands: ["both"],
    url: "https://www.opalcollection.com/lake-placid-lodge/eat-and-drink/",
    sourceUrl: "https://www.opalcollection.com/lake-placid-lodge/eat-and-drink/",
    citations: [
      "https://www.opalcollection.com/lake-placid-lodge/eat-and-drink/",
      "https://www.relaischateaux.com/us/hotel/lake-placid-lodge/",
    ],
  },
  {
    destinationId: "lake-placid-ny",
    category: "nightlife",
    name: "Peak 47 at The Whiteface Lodge",
    type: "lounge",
    vibe: "chill",
    priceRange: "$$$",
    highlight:
      "The lodge's fireside room off Saranac Avenue — handcrafted cocktails, a deep wine list, wood-fired pizza and live music some nights. No reservations; it is first come, first served.",
    reservationNeeded: false,
    groupFriendly: true,
    lateNight: true,
    brands: ["both"],
    url: "https://www.thewhitefacelodge.com/dining/peak-47",
    sourceUrl: "https://www.thewhitefacelodge.com/dining/peak-47",
    citations: [
      "https://www.thewhitefacelodge.com/dining/peak-47",
      "https://www.thewhitefacelodge.com/dining",
    ],
  },
  {
    destinationId: "lake-placid-ny",
    category: "activity",
    name: "Thunder Mountain Dog Sled Tours on Mirror Lake",
    type: "dog-sledding",
    duration: "30 min",
    pricePerPerson: [20, 20],
    groupMin: 1,
    groupMax: 6,
    highlight:
      "Alaskan husky teams run sleds out across frozen Mirror Lake from the Main Street shore, opposite the High Peaks Resort. Deep winter only, and only when the ice is solid where the dogs run — no reservations taken, first come first served.",
    bestFor: "a winter afternoon",
    brands: ["both"],
    reservationNeeded: false,
    walkUpAccess: true,
    url: "https://www.highpeaksresort.com/attractions/thunder-mountain-dog-sled-rides",
    sourceUrl: "https://www.highpeaksresort.com/attractions/thunder-mountain-dog-sled-rides",
    citations: [
      "https://www.highpeaksresort.com/attractions/thunder-mountain-dog-sled-rides",
      "https://www.lakeplacid.com/dog-sled-rides/thunder-mountain-dog-sled-tours",
      "https://www.iloveny.com/listing/thunder-mountain-dog-sled-tours/6856/",
    ],
  },
  {
    destinationId: "lake-placid-ny",
    category: "activity",
    name: "Adirondack Rail Trail ride (High Peaks Cyclery)",
    type: "biking",
    duration: "4 hr",
    pricePerPerson: [75, 100],
    groupMin: 1,
    groupMax: 10,
    highlight:
      "Gravel, road, fat and full-suspension bikes from the Main Street shop, with a shuttle onto the Adirondack Rail Trail so the ride back toward Saranac Lake runs one way and flat.",
    bestFor: "a full day out",
    brands: ["both"],
    walkUpAccess: true,
    url: "https://highpeakscyclery.com/collections/rentals",
    sourceUrl: "https://highpeakscyclery.com/collections/rentals",
    citations: [
      "https://highpeakscyclery.com/collections/rentals",
      "https://highpeakscyclery.com/pages/rail-trail-bike-rentals",
    ],
  },
  {
    destinationId: "lake-placid-ny",
    category: "dining",
    name: "Artisans at Lake Placid Lodge",
    cuisine: "Adirondack farm-to-table",
    priceRange: "$$$$",
    highlight:
      "The Relais & Châteaux lodge's lakeside dining room, looking straight across the water at Whiteface — seasonal Adirondack cooking, and a wine cellar downstairs you can be seated in.",
    bestFor: "dinner",
    groupFriendly: false,
    reservationNeeded: true,
    brands: ["both"],
    url: "https://www.opalcollection.com/lake-placid-lodge/eat-and-drink/",
    sourceUrl: "https://www.opalcollection.com/lake-placid-lodge/eat-and-drink/",
    citations: [
      "https://www.opalcollection.com/lake-placid-lodge/eat-and-drink/",
      "https://www.relaischateaux.com/us/hotel/lake-placid-lodge/",
    ],
  },
  {
    // The one row here whose price band does NOT come from the property's own
    // site. The Point publishes no rates anywhere; the band is the range two
    // independent published reviews agree on for two people, all-inclusive, and
    // it is flagged in the PR body rather than presented as a quoted rate.
    destinationId: "lake-placid-ny",
    category: "lodging",
    name: "The Point, Upper Saranac Lake",
    type: "resort",
    pricePerNight: [2250, 4650],
    perRoom: true,
    maxGuests: 2,
    highlight:
      "William Avery Rockefeller II's Great Camp on Upper Saranac Lake, about 35 minutes west of Lake Placid — eleven rooms, Relais & Châteaux and Forbes Five Star, and the only Gilded-Age Adirondack Great Camp open to the public. The rate is all-inclusive: meals, the bar, and the boats.",
    url: "https://thepointresort.com/",
    sourceUrl: "https://thepointresort.com/",
    citations: [
      "https://thepointresort.com/",
      "https://www.relaischateaux.com/us/hotel/the-point/",
      "https://www.hotelsabovepar.com/articles/guides/the-point-resort",
    ],
  },
];
