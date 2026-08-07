/**
 * proposal-spots-data.ts — the rows. Schema, firewall and validators live in
 * `./proposal-spots`; this file is data only.
 *
 * WHY THIS FILE EXISTS SEPARATELY. `proposal-spots.ts` shipped in #25 as a
 * schema with zero rows and was never exported from `index.ts`, so engagedmoon
 * could not read it and grew a second, weaker copy of the dataset in its own
 * repo. A schema with no rows and no consumer is not a firewall; it is a
 * document. Rows live here, the gate lives there, and `index.ts` exports both.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE 2026-08-06 FINDING THAT RE-TIERED THIS ENTIRE DATASET
 *
 * Section 125 of the EXPLORE Act (Public Law 118-234), signed 2025-01-04 and
 * codified at 54 U.S.C. 100905, changed the rule on National Park Service and
 * U.S. Forest Service land. NPS states it outright: still photography is now
 * treated identically regardless of commercial intent, and in most cases no
 * permit or fee is required for eight or fewer individuals.
 *
 * A proposal with a hired photographer is three people. So on NPS land, hiring
 * a photographer NO LONGER CREATES A PERMIT.
 *
 * This inverts the claim engagedmoon launched with. It remains true at
 * California State Parks, Nevada State Parks, and municipal parks (Savannah,
 * Central Park) — and it is now false at Yosemite, Acadia, Grand Teton and the
 * Blue Ridge Parkway. The product's real subject was never "a photographer
 * triggers a permit"; it is that THE ANSWER DEPENDS ON WHO MANAGES THE LAND,
 * and that it flipped in 2025 while every wedding blog stayed stale.
 *
 * NPS rows tier `green` through `UNIVERSAL_RULE_WORDS`, not through a mention of
 * the word "proposal" — the statute forecloses the question for all photography
 * rather than answering it for one instance, which is the stronger evidence of
 * the two. That path exists precisely for this.
 *
 * USFS rows tier `amber`, and the split is NOT an oversight — see
 * `EXPLORE_ACT_USFS` below. Same statute, same agency pair, different published
 * language, therefore different tier. Two agencies bound by one law do not get
 * one tier; the tier tracks what each authority actually SAYS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS DELIBERATELY ABSENT
 *
 * `crowdWindow` and `privacy` are null on most rows. They are `SourcedFact`s,
 * and a crowd claim without a quote is exactly the plausible-sounding filler
 * that `PLACEHOLDER` and the tier system exist to keep out. Null is honest and
 * renders as nothing; an invented "quiet at sunset" renders as authority. Fill
 * them only from a real quote.
 *
 * Coordinates are approximate centroids of the named viewpoint. Solar math is
 * insensitive at this precision (0.1° of longitude ≈ 24 seconds of sunset), so
 * a centroid is honest for a golden-hour window. It is NOT precise enough to
 * navigate by, and nothing renders it as if it were.
 */

import type { ProposalSpot, SourcedFact } from "./proposal-spots";

/**
 * The federal rule, quoted once and shared by every NPS/USFS row.
 *
 * Shared rather than copied per row on purpose: this is ONE fact from ONE
 * authority, and 20 hand-copied transcriptions of a legal quote is 20 chances
 * to introduce a typo into something rendered as a verbatim quotation. When the
 * rule changes, it changes in one place.
 */
const EXPLORE_ACT_NPS: SourcedFact = {
  verbatim:
    "All filming, still photography, and audio recording is treated the same under the new law. It does not matter whether it is commercial, non-commercial, for content creation, by a student, or conducted by media or for news gathering. In most cases, permits and fees are not required for filming, still photography, or audio recording that involves eight or fewer individuals.",
  sourceUrl: "https://www.nps.gov/aboutus/news/film-and-photo-permits.htm",
};

/**
 * The Forest Service is AMBER, and the difference from NPS is the whole reason
 * the tier system is not decoration.
 *
 * The EXPLORE Act binds both agencies, and it would have been easy — and wrong
 * — to reuse the NPS sentence here. The Forest Service's own filming page does
 * NOT publish the universal-applicability language ("treated the same",
 * "does not matter whether it is commercial"). Checked 2026-08-06: it isn't
 * there. Only NPS states it outright.
 *
 * The first draft of this file did reuse it, and `downgradeIfUncorroborated`
 * rejected the row. That is the mechanism working: an agency-level assumption
 * got laundered into a quotation, and the quote had to corroborate itself
 * before it could render as fact. So USFS rows carry the sentence the page
 * ACTUALLY publishes, and tier amber — the statute very likely gives a
 * three-person proposal the same answer, but "very likely" is an inference and
 * has to be labelled as one.
 */
const EXPLORE_ACT_USFS: SourcedFact = {
  verbatim:
    "A De Minimis Use authorization may be issued for filming activities involving six to eight individuals, provided all conditions in Section 1(a)(5)(A)-(H) are met.",
  sourceUrl:
    "https://www.fs.usda.gov/working-with-us/contracts-commercial-permits/filming",
};

/** Every NPS row shares this permit shape; only the park page differs. */
function npsPermit(): ProposalSpot["permit"] {
  return {
    required: false,
    appliesToProposal: true,
    fact: EXPLORE_ACT_NPS,
    authority: "National Park Service",
    authorityContact: "https://www.nps.gov/aboutus/news/film-and-photo-permits.htm",
  };
}

function usfsPermit(): ProposalSpot["permit"] {
  return {
    required: "unknown",
    appliesToProposal: false,
    fact: EXPLORE_ACT_USFS,
    authority: "U.S. Forest Service",
    authorityContact:
      "https://www.fs.usda.gov/working-with-us/contracts-commercial-permits/filming",
  };
}

export const PROPOSAL_SPOTS_DATA: ProposalSpot[] = [
  // ───────────────────────── National Park Service ─────────────────────────
  {
    id: "jackson-hole-wy-schwabacher-landing",
    destinationId: "jackson-hole-wy",
    name: "Schwabacher Landing, Grand Teton National Park",
    type: "viewpoint",
    highlight:
      "The Tetons reflected in a beaver-dammed side channel of the Snake — the range's most photographed still water, and it faces the sunrise.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: "jackson-hole-wy-oxbow-bend",
    sourceUrl: "https://www.nps.gov/grte/planyourvisit/weddingcommitments.htm",
    citations: [
      "https://www.nps.gov/aboutus/news/film-and-photo-permits.htm",
      "https://www.nps.gov/grte/planyourvisit/weddingcommitments.htm",
    ],
  },
  {
    id: "jackson-hole-wy-oxbow-bend",
    destinationId: "jackson-hole-wy",
    name: "Oxbow Bend, Grand Teton National Park",
    type: "viewpoint",
    highlight:
      "Mount Moran over a slow bend in the Snake. Wider and more forgiving than Schwabacher, and it holds colour later into the evening.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/grte/index.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "asheville-nc-craggy-gardens",
    destinationId: "asheville-nc",
    name: "Craggy Gardens, Blue Ridge Parkway MP 364",
    type: "overlook",
    highlight:
      "A heath bald above the treeline where the ridgelines stack into haze. Rhododendron blooms mid-June; the bald empties near dusk.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl:
      "https://www.nps.gov/blri/planyourvisit/commercial-filming-and-still-photography-permits.htm",
    citations: [
      "https://www.nps.gov/aboutus/news/film-and-photo-permits.htm",
      "https://www.nps.gov/blri/planyourvisit/commercial-filming-and-still-photography-permits.htm",
    ],
  },
  {
    id: "bar-harbor-me-cadillac-summit",
    destinationId: "bar-harbor-me",
    name: "Cadillac Mountain Summit, Acadia National Park",
    type: "overlook",
    highlight:
      "The first place the sun touches the United States for part of the year, over the islands of Frenchman Bay.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: "bar-harbor-me-jordan-pond",
    sourceUrl: "https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm",
    citations: [
      "https://www.nps.gov/aboutus/news/film-and-photo-permits.htm",
      "https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm",
    ],
  },
  {
    id: "bar-harbor-me-jordan-pond",
    destinationId: "bar-harbor-me",
    name: "Jordan Pond South Shore, Acadia National Park",
    type: "trail",
    highlight:
      "The Bubbles framed at the far end of a glacial pond, from a flat shoreline path anyone can walk in normal shoes.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/acad/planyourvisit/permits.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "outer-banks-nc-cape-hatteras",
    destinationId: "outer-banks-nc",
    name: "Cape Hatteras Lighthouse, Cape Hatteras National Seashore",
    type: "historic-site",
    highlight:
      "The tallest brick lighthouse in the country, black-and-white spiral against open Atlantic sky.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/caha/index.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "washington-dc-tidal-basin",
    destinationId: "washington-dc",
    name: "Tidal Basin at the Jefferson Memorial",
    type: "waterfront",
    highlight:
      "The Jefferson dome across the water, with the cherry trees bending to the basin. The bloom window is roughly two weeks and moves every year.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/nama/planyourvisit/permits.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "san-francisco-ca-battery-spencer",
    destinationId: "san-francisco-ca",
    name: "Battery Spencer, Golden Gate National Recreation Area",
    type: "overlook",
    highlight:
      "Looking down the north tower of the Golden Gate with the city behind it — the angle everyone recognises and few know the name of.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/goga/planyourvisit/permits.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "maui-hi-haleakala-summit",
    destinationId: "maui-hi",
    name: "Haleakalā Summit, Haleakalā National Park",
    type: "overlook",
    highlight:
      "Above the cloud deck at 10,000 feet, where the crater fills with colour before the sun clears the rim.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/hale/planyourvisit/sunrise-reservations.htm",
    citations: [
      "https://www.nps.gov/aboutus/news/film-and-photo-permits.htm",
      "https://www.nps.gov/hale/planyourvisit/sunrise-reservations.htm",
    ],
  },
  {
    id: "moab-ut-delicate-arch",
    destinationId: "moab-ut",
    name: "Delicate Arch, Arches National Park",
    type: "hike",
    highlight:
      "A 52-foot freestanding arch on the lip of a sandstone bowl, lit orange from the west in the last hour of light. Three miles round trip, no shade.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: "moab-ut-mesa-arch",
    sourceUrl: "https://www.nps.gov/arch/index.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "moab-ut-mesa-arch",
    destinationId: "moab-ut",
    name: "Mesa Arch, Canyonlands National Park",
    type: "viewpoint",
    highlight:
      "A low arch on a cliff edge that catches reflected light off the canyon beneath it at dawn, so the underside glows.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/cany/index.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "whitefish-mt-wild-goose-island",
    destinationId: "whitefish-mt",
    name: "Wild Goose Island Overlook, Glacier National Park",
    type: "overlook",
    highlight:
      "A single tree-covered island in St. Mary Lake with the peaks closing in behind it. Roadside — no hike required.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/glac/planyourvisit/permits.htm",
    citations: ["https://www.nps.gov/aboutus/news/film-and-photo-permits.htm"],
  },
  {
    id: "flagstaff-az-hopi-point",
    destinationId: "flagstaff-az",
    name: "Hopi Point, Grand Canyon South Rim",
    type: "overlook",
    highlight:
      "The rim point that juts furthest into the canyon, so the sun sets down the gorge rather than behind you.",
    tier: "green",
    permit: npsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.nps.gov/grca/learn/management/filming.htm",
    citations: [
      "https://www.nps.gov/aboutus/news/film-and-photo-permits.htm",
      "https://www.nps.gov/grca/learn/management/filming.htm",
    ],
  },

  // ───────────────────────── U.S. Forest Service ─────────────────────────
  {
    id: "aspen-co-maroon-bells",
    destinationId: "aspen-co",
    name: "Maroon Bells, White River National Forest",
    type: "viewpoint",
    highlight:
      "Two maroon-streaked fourteeners doubled in Maroon Lake. Access is by timed shuttle reservation for most of the season.",
    tier: "amber",
    permit: usfsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.fs.usda.gov/detail/whiteriver/home/?cid=stelprdb5129317",
    citations: [
      "https://www.fs.usda.gov/working-with-us/contracts-commercial-permits/filming",
    ],
  },
  {
    id: "hood-river-or-multnomah-falls",
    destinationId: "hood-river-or",
    name: "Multnomah Falls, Columbia River Gorge National Scenic Area",
    type: "viewpoint",
    highlight:
      "A 620-foot two-tier fall with the Benson Bridge crossing between them — one of the few genuinely dramatic spots reachable in a coat and normal shoes.",
    tier: "amber",
    permit: usfsPermit(),
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.fs.usda.gov/recarea/crgnsa/recarea/?recid=30026",
    citations: [
      "https://www.fs.usda.gov/working-with-us/contracts-commercial-permits/filming",
    ],
  },

  // ───────────────────────── California State Parks ─────────────────────────
  //
  // The federal flip does NOT reach here. California defines commercial
  // photography by payment, which is what a hired proposal photographer is —
  // so the original engagedmoon claim survives intact on state land. This
  // contrast IS the product.
  {
    id: "carmel-ca-point-lobos",
    destinationId: "carmel-ca",
    name: "Point Lobos State Natural Reserve",
    type: "overlook",
    highlight:
      "Cypress headlands over turquoise coves, with sea lions audible from the trail. Widely called the finest meeting of land and water in the world.",
    tier: "amber",
    permit: {
      required: true,
      appliesToProposal: false,
      fact: {
        verbatim:
          "anyone engaged in commercial (profit and sale) photography on state property",
        sourceUrl: "https://www.parks.ca.gov/?page_id=25997",
      },
      authority: "California State Parks",
      authorityContact: "https://www.parks.ca.gov/?page_id=25997",
    },
    crowdWindow: null,
    privacy: null,
    backup: "carmel-ca-carmel-beach",
    sourceUrl: "https://www.parks.ca.gov/?page_id=25997",
    citations: [
      "https://www.parks.ca.gov/?page_id=25997",
      "https://www.parks.ca.gov/?page_id=30234",
    ],
  },
  {
    id: "lake-tahoe-ca-emerald-bay",
    destinationId: "lake-tahoe-ca",
    name: "Emerald Bay State Park",
    type: "overlook",
    highlight:
      "Tahoe's only island, in a glacial bay that reads almost tropical from the highway pullout above it.",
    tier: "amber",
    permit: {
      required: true,
      appliesToProposal: false,
      fact: {
        verbatim:
          "anyone engaged in commercial (profit and sale) photography on state property",
        sourceUrl: "https://www.parks.ca.gov/?page_id=25997",
      },
      authority: "California State Parks",
      authorityContact: "https://www.parks.ca.gov/?page_id=25997",
    },
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.parks.ca.gov/?page_id=506",
    citations: ["https://www.parks.ca.gov/?page_id=25997"],
  },
  {
    id: "carmel-ca-carmel-beach",
    destinationId: "carmel-ca",
    name: "Carmel Beach",
    type: "beach",
    highlight:
      "White sand under wind-bent cypress, walkable straight down Ocean Avenue from town. Dogs run off-leash here, which is either the charm or the problem.",
    tier: "red",
    permit: {
      required: "unknown",
      appliesToProposal: false,
      fact: null,
      authority: "City of Carmel-by-the-Sea",
      authorityContact: "https://ci.carmel.ca.us/ · 831-620-2000",
    },
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://ci.carmel.ca.us/",
    citations: ["https://ci.carmel.ca.us/"],
  },

  // ───────────────────────── Oregon State Parks ─────────────────────────
  {
    id: "cannon-beach-or-haystack-rock",
    destinationId: "cannon-beach-or",
    name: "Haystack Rock, Cannon Beach",
    type: "beach",
    highlight:
      "A 235-foot sea stack standing straight off a flat beach, with tide pools at its base at low water.",
    tier: "amber",
    permit: {
      required: "unknown",
      appliesToProposal: false,
      fact: {
        verbatim:
          "Commercial photography using a hand held camera and no props may not require a permit, depending on the specific circumstances.",
        sourceUrl: "https://stateparks.oregon.gov/index.cfm?do=v.page&id=132",
      },
      authority: "Oregon Parks and Recreation Department",
      authorityContact: "Coastal Region Office · 541-563-8500",
    },
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://stateparks.oregon.gov/index.cfm?do=v.page&id=132",
    citations: ["https://stateparks.oregon.gov/index.cfm?do=v.page&id=132"],
  },

  // ───────────────────────── Municipal ─────────────────────────
  {
    id: "new-york-ny-conservatory-garden",
    destinationId: "new-york-ny",
    name: "Conservatory Garden, Central Park",
    type: "garden",
    highlight:
      "Central Park's only formal garden, and the one place in the park the Conservancy permits ceremonies.",
    tier: "green",
    permit: {
      required: true,
      appliesToProposal: true,
      fact: {
        verbatim:
          "Marriage proposals are welcome but are subject to the same policies as weddings and require a wedding permit.",
        sourceUrl: "https://www.centralparknyc.org/wedding-faqs",
      },
      authority: "Central Park Conservancy",
      authorityContact: "https://www.centralparknyc.org/wedding-faqs",
    },
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://www.centralparknyc.org/activities/guides/weddings",
    citations: ["https://www.centralparknyc.org/wedding-faqs"],
  },
  {
    id: "savannah-ga-forsyth-park",
    destinationId: "savannah-ga",
    name: "Forsyth Park Fountain",
    type: "park",
    highlight:
      "The white iron fountain under live oaks and Spanish moss — the image most people picture when they picture Savannah.",
    tier: "red",
    permit: {
      required: "unknown",
      appliesToProposal: false,
      fact: null,
      authority: "City of Savannah",
      authorityContact: "https://savannahga.gov/3607/Weddings · 912-351-3837",
    },
    // The city contradicts itself across two of its own live pages. Kept
    // rather than resolved: the disagreement is the information.
    disputed: [
      {
        verbatim:
          "Wedding ceremonies with fewer than fifty people do not require a permit.",
        sourceUrl: "https://savannahga.gov/3607/Weddings",
      },
      {
        verbatim:
          "Groups of fewer than twenty people do not require a permit to reserve a park or square.",
        sourceUrl: "https://savannahga.gov/1002/Park-Square-Rentals",
      },
    ],
    crowdWindow: null,
    privacy: null,
    backup: null,
    sourceUrl: "https://savannahga.gov/3607/Weddings",
    citations: [
      "https://savannahga.gov/3607/Weddings",
      "https://savannahga.gov/1002/Park-Square-Rentals",
    ],
  },
];
