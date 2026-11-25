/**
 * trips/em-trips.ts — Engagedmoon (Proposalmoon) composed-trip INPUTS.
 *
 * This file exports ONLY the authored inputs. The composed export
 * (`EM_COMPOSED_TRIPS`) lives in src/index.ts, computed AFTER
 * `sharedDestinations` is defined there.
 *
 * Why not compose here: composing needs the baked catalog, which is assembled
 * in index.ts — and index.ts re-exports this module. In ESM a module's
 * dependencies are evaluated before its own body regardless of where the
 * `export *` statement sits, so `em-trips → index → em-trips` would evaluate
 * this file while `sharedDestinations` is still in its temporal dead zone and
 * crash every consumer at import time. Inputs-here / composition-in-index is
 * the acyclic shape.
 *
 * Row keys are `${destinationId}|${category}|${name}` (singular category) —
 * author them via `rowKey` from ./schema or copy the formation exactly.
 * NO estPerPerson anywhere in this file: it is derived from the referenced
 * rows' published ranges at composition (see ./schema).
 */

import type { ComposedTripInput } from "./schema";

/**
 * Slice 1 (2026-08-20): 10 trips across the six cities the 0818 proposal
 * expansions made viable — newport-ri ×2, stowe-vt ×2, lake-placid-ny ×2,
 * door-county-wi, mackinac-island-mi, traverse-city-mi ×2. Every referenced
 * row survives the engagedmoon planner's own filters (ACTIVITY_ALLOW /
 * NIGHTLIFE_ALLOW / stay types / couplesCanBook), checked against the
 * consumer at authoring time; verify-trips enforces resolution forever.
 */
export const EM_COMPOSED_TRIP_INPUTS: ComposedTripInput[] = [
  {
    id: "forty-steps-and-the-vines",
    slug: "forty-steps-and-the-vines",
    planner: "engagedmoon",
    destinationId: "newport-ri",
    title: "Mansions on one side, the Atlantic on the other",
    category: "coastal-drive-cliff-overlook",
    season: [5, 6, 7, 8, 9, 10],
    nights: 3,
    groupRange: [2, 6],
    lodgingId: "newport-ri|lodging|The Chanler at Cliff Walk",
    activityIds: [
      "newport-ri|activity|Cliff Walk + Breakers mansion tour",
      "newport-ri|activity|Newport Vineyards + Greenvale tasting tour",
      "newport-ri|activity|Ocean Drive + Bellevue Avenue bike loop (Ten Speed Spokes)",
      "newport-ri|activity|Tea at Rosecliff or Marble House",
    ],
    diningIds: [
      "newport-ri|dining|The Mooring Seafood Kitchen & Bar",
      "newport-ri|dining|Giusto",
      "newport-ri|dining|Belle's Cafe at Newport Shipyard",
    ],
    nightlifeIds: ["newport-ri|nightlife|The Chanler at Cliff Walk cocktail terrace"],
    narrative:
      "The Cliff Walk runs three and a half miles with the mansions' back lawns on one side and the Atlantic on the other, and the Breakers tour explains what you are walking past. Do the walk early in the trip, so the geography settles in before anything is asked of it. The bike loop covers Ocean Drive and Bellevue Avenue in a morning. Newport Vineyards and Greenvale sit across the island, and the tasting tour fills the one afternoon the coastline doesn't need. Tea at Rosecliff or Marble House is the piece to add when you've brought people.",
    capstoneShape:
      "A stair of stone steps cut down into the cliff face, off the walk between the mansions and the water, with the waves working the rocks below and the walk itself carrying on above your heads.",
    capstoneSpotId: "newport-ri-cliff-walk",
    faqs: [
      {
        q: "Which mansion do we actually go inside?",
        a: "The Breakers, on the tour paired with the Cliff Walk. Tea at Rosecliff or Marble House is a different thing — a seated afternoon rather than a walk-through — and it wants at least four of you, so it belongs to the version of this trip with company.",
      },
      {
        q: "How busy is the Cliff Walk?",
        a: "Genuinely busy near the Forty Steps in July, and quieter the further you go. Most visitors walk the first stretch and turn around; past the first mile it is mostly gulls and a few runners.",
      },
      {
        q: "Does this trip scale past a couple?",
        a: "Yes — this is one of the entries that does. The mansion tour, the tasting tour and the bike loop all book to six and beyond, and the tea is the one piece that is actually better with the larger table.",
      },
    ],
    heroImageKey: "destinations/newport-ri",
  },
  {
    id: "headland-at-a-walk",
    slug: "headland-at-a-walk",
    planner: "engagedmoon",
    destinationId: "newport-ri",
    title: "A horse on the sand, and the headland after",
    category: "harbor-and-headland",
    season: [5, 6, 9, 10],
    nights: 2,
    groupRange: [2, 4],
    lodgingId: "newport-ri|lodging|Castle Hill Inn",
    activityIds: [
      "newport-ri|activity|Newport Equestrian Academy beach + wildlife-refuge trail ride",
      "newport-ri|activity|Sachuest Point National Wildlife Refuge shoreline loop",
      "newport-ri|activity|Ocean Drive + Bellevue Avenue bike loop (Ten Speed Spokes)",
    ],
    diningIds: [
      "newport-ri|dining|Aurelia at Castle Hill",
      "newport-ri|dining|Safari Room at OceanCliff",
      "newport-ri|dining|Anthony's Seafood",
    ],
    nightlifeIds: ["newport-ri|nightlife|Midtown Oyster Bar rooftop"],
    narrative:
      "This is the Newport past the mansions. Sachuest Point is a wildlife refuge on the island's far corner, with a flat shoreline loop and more birds than people, and the Newport Equestrian Academy rides the beach beside it — an hour at a walk on wet sand, which recalibrates what the island is for. Castle Hill holds its own headland west of town, lawn running down to the water, and dinner at Aurelia means the day ends where you sleep. The bike loop out Ocean Drive is the connective tissue between all of it.",
    capstoneShape:
      "A broad green headland where Ocean Drive turns the corner of the island, rocks stepping down to open water on two sides, with room to stand well apart from everyone else who had the same idea.",
    capstoneSpotId: "newport-ri-brenton-point",
    faqs: [
      {
        q: "Do we need riding experience?",
        a: "No. The rides go at a walk and the academy matches horses to riders. The cap is eight, so even the full version of this trip fits in one ride.",
      },
      {
        q: "Is two nights enough?",
        a: "For this version of the town, yes — two shoreline mornings and two good dinners is the trip. The mansion version of Newport is a different entry with a different ending, and stacking both flattens both.",
      },
      {
        q: "What is actually at Brenton Point?",
        a: "A state park on the corner of Ocean Drive — open lawn, rocks stepping down to open water, and on a windy weekend, kites. Nothing about it needs booking, which is part of why it works.",
      },
    ],
    heroImageKey: "destinations/newport-ri",
  },
  {
    id: "sterling-pond-under-snow",
    slug: "sterling-pond-under-snow",
    planner: "engagedmoon",
    destinationId: "stowe-vt",
    title: "The pond above the notch, under snow",
    category: "alpine-lodge-and-lake",
    season: [12, 1, 2, 3],
    nights: 3,
    groupRange: [2, 4],
    lodgingId: "stowe-vt|lodging|Topnotch Resort",
    activityIds: [
      "stowe-vt|activity|Trapp Family Lodge horse-drawn sleigh ride",
      "stowe-vt|activity|Trapp Family Lodge Outdoor Center cross-country ski day",
      "stowe-vt|activity|Spruce Peak Spa champagne soak + facial",
    ],
    diningIds: [
      "stowe-vt|dining|Edson Hill",
      "stowe-vt|dining|Alpine Hall at Spruce Peak",
    ],
    nightlifeIds: ["stowe-vt|nightlife|Smugglers' Notch Distillery Tasting Room, Stowe"],
    narrative:
      "Winter Stowe divides into people going up the mountain fast and people moving through the woods slowly, and this is the second kind of trip. The Trapp Family Lodge claims the first commercial cross-country ski trails in America, and a day on that network makes the claim feel earned. The sleigh ride is the same woods at a horse's pace, under blankets. The soak and facial at Spruce Peak answer the cold on your own terms, and the distillery tasting room in the village is a short, warm stop rather than an evening's project.",
    capstoneShape:
      "A small pond high in the notch, frozen and blank under snow, reached on skis or snowshoes through spruce that keep the wind off until the last rise — and then the ridge opens and the pond is simply there.",
    capstoneSpotId: "stowe-vt-sterling-pond",
    faqs: [
      {
        q: "Can we actually reach Sterling Pond in winter?",
        a: "Yes, and it is the trip's one real effort — a climb on snowshoes or backcountry skis, not a stroll. If the weather argues on the day, the sleigh ride is the ending that asks nothing of anyone.",
      },
      {
        q: "Do we need to be skiers?",
        a: "Not downhill ones. The Trapp Family Lodge Outdoor Center rents everything, and its beginner loops are genuinely gentle — a first-timer is tired and competent by lunch.",
      },
      {
        q: "Is the sleigh ride private?",
        a: "The sleighs carry up to ten, so it is as private as your headcount makes it — two of you, or everyone you brought.",
      },
    ],
    heroImageKey: "destinations/stowe-vt",
  },
  {
    id: "cider-and-the-notch",
    slug: "cider-and-the-notch",
    planner: "engagedmoon",
    destinationId: "stowe-vt",
    title: "Cider on the slow days, the climb on the fresh one",
    category: "ridge-and-overlook",
    season: [6, 7, 8, 9, 10],
    nights: 4,
    groupRange: [2, 4],
    lodgingId: "stowe-vt|lodging|Topnotch Resort",
    activityIds: [
      "stowe-vt|activity|Stowe Recreation Path ride (Ranch Camp rental)",
      "stowe-vt|activity|Cold Hollow Cider Mill tasting + picnic",
      "stowe-vt|activity|Mount Mansfield Equestrian Center trail ride",
      "stowe-vt|activity|Spa day at Topnotch",
    ],
    diningIds: [
      "stowe-vt|dining|Plate",
      "stowe-vt|dining|Edson Hill",
    ],
    nightlifeIds: [
      "stowe-vt|nightlife|Cork Restaurant & Natural Wine Shop",
      "stowe-vt|nightlife|Tipsy Trout at Spruce Peak",
    ],
    narrative:
      "Green-season Stowe is a village with a river path running out the back of it. Rent at Ranch Camp and ride the Recreation Path as far as the mood holds — it is flat, shaded, and crosses the river more times than you will bother counting. Cold Hollow's cider and a picnic take one slow noon; the trail ride takes another; the spa answers a rainy day without argument. Save the legs for Sterling Pond — a short, steep climb to the top of the notch, and the only part of this trip that asks for effort.",
    capstoneShape:
      "A mountain pond just over the ridge at the top of the notch, ringed with spruce, where the trail arrives at a rocky shoreline and the water holds whatever the sky is doing. Getting back means walking down through the woods you climbed.",
    capstoneSpotId: "stowe-vt-sterling-pond",
    faqs: [
      {
        q: "How hard is the climb to Sterling Pond?",
        a: "Short and steep — rock steps and roots for about an hour, real shoes required, nothing technical. The pond is the immediate reward, which is the right ratio of effort to payoff for a trip built on slow days.",
      },
      {
        q: "Why four nights?",
        a: "Because the good parts are slow ones. Four nights lets the cider mill, the horses and the path each have a day of their own, with the climb saved for the freshest morning of the four.",
      },
      {
        q: "Wine or cocktails?",
        a: "Both exist here without a scene attached. Cork is the wine answer in the village; Tipsy Trout is the cocktail answer up at Spruce Peak. Neither expects you to make a night of it.",
      },
    ],
    heroImageKey: "destinations/stowe-vt",
  },
  {
    id: "dogs-on-mirror-lake",
    slug: "dogs-on-mirror-lake",
    planner: "engagedmoon",
    destinationId: "lake-placid-ny",
    title: "Out on the ice, then up the mountain",
    category: "alpine-lodge-and-lake",
    season: [12, 1, 2],
    nights: 4,
    groupRange: [2, 4],
    lodgingId: "lake-placid-ny|lodging|Mirror Lake Inn Resort & Spa",
    activityIds: [
      "lake-placid-ny|activity|Thunder Mountain Dog Sled Tours on Mirror Lake",
      "lake-placid-ny|activity|Whiteface Mountain ski or gondola day",
      "lake-placid-ny|activity|Mt. Van Hoevenberg bobsled ride",
      "lake-placid-ny|activity|Spa day at Mirror Lake Inn",
    ],
    diningIds: [
      "lake-placid-ny|dining|Generations at Mirror Lake Inn",
      "lake-placid-ny|dining|The Cottage at Mirror Lake Inn",
      "lake-placid-ny|dining|Liquids & Solids",
    ],
    nightlifeIds: ["lake-placid-ny|nightlife|Peak 47 at The Whiteface Lodge"],
    narrative:
      "Lake Placid hosted the Winter Games twice and kept the equipment running. The bobsled at Mt. Van Hoevenberg is a real run with a professional pilot, over before you have finished being alarmed. The dog sleds work the frozen lake in front of the inn, at a pace from another century. Whiteface is the fast day — the biggest vertical drop in the East — and the spa is the slow one. Generations and The Cottage are downstairs from your room, and Liquids & Solids is in town for the night you want it louder.",
    capstoneShape:
      "A farmstead meadow above the village, snow unbroken across the field, with the High Peaks stacked along the southern sky. It is a historic site kept plainly, lightly visited in winter, and the mountains do the rest.",
    capstoneSpotId: "lake-placid-ny-john-brown-farm",
    faqs: [
      {
        q: "Why does the trip end at a farm?",
        a: "Because John Brown Farm is the quiet counterweight to four days of Olympic machinery. It is a state historic site a few minutes from the village, the meadow faces the High Peaks, and in winter the snow does the landscaping.",
      },
      {
        q: "Is the bobsled a serious undertaking?",
        a: "You ride with a professional pilot — nobody steers but them. It is loud, fast, and finished in about a minute, and it is the one thing here your partner will either veto or insist on.",
      },
      {
        q: "Do the dog sleds run all winter?",
        a: "They run when the ice does — deep winter, weather permitting. If the lake is not ready, the sleds do not go out, which is exactly the answer you want from people who work on ice.",
      },
    ],
    heroImageKey: "destinations/lake-placid-ny",
  },
  {
    id: "the-point-and-the-peaks",
    slug: "the-point-and-the-peaks",
    planner: "engagedmoon",
    destinationId: "lake-placid-ny",
    title: "A camp on its own lake, and one peak climbed",
    category: "ridge-and-overlook",
    season: [6, 7, 8, 9],
    nights: 3,
    groupRange: [2, 4],
    lodgingId: "lake-placid-ny|lodging|The Point, Upper Saranac Lake",
    activityIds: [
      "lake-placid-ny|activity|High Peaks hike (Cascade)",
      "lake-placid-ny|activity|Adirondack Rail Trail ride (High Peaks Cyclery)",
      "lake-placid-ny|activity|Mirror Lake kayak + paddleboard",
    ],
    diningIds: [
      "lake-placid-ny|dining|Artisans at Lake Placid Lodge",
      "lake-placid-ny|dining|Liquids & Solids",
    ],
    nightlifeIds: ["lake-placid-ny|nightlife|Maggie's Pub at Lake Placid Lodge"],
    narrative:
      "The Point is a great camp on Upper Saranac Lake — a handful of rooms on a wooded shore, all-inclusive, a half hour from Lake Placid — and it is the trip in these pages you take once, for the occasion that outranks the budget conversation. The days run back toward town. Cascade is the High Peak people climb first, open rock at the summit and a view out of proportion to the effort. The rail trail rolls flat out of the village, and Mirror Lake is for the morning nobody drives anywhere. Heart Lake waits at the foot of the range, where this trip was always heading.",
    capstoneShape:
      "A quiet shoreline at the foot of the High Peaks, reached by a flat path from the trailhead, with the range standing straight up across the water and the far shore going dark first while the near one holds the light.",
    capstoneSpotId: "lake-placid-ny-heart-lake",
    faqs: [
      {
        q: "What makes The Point different from the other places to stay here?",
        a: "It is small, all-inclusive, and on its own lake — closer to being handed a private house than checking into a hotel. Every other trip in these towns can be repeated next year; this one is built for the occasion that will not be.",
      },
      {
        q: "Is Cascade a hard climb?",
        a: "It is the most climbed of the High Peaks because it is the most forgiving — a steady ascent to bare summit rock. Start early; the trailhead parking, not the trail, is the real constraint.",
      },
      {
        q: "Does this work without the hike?",
        a: "Yes. Heart Lake's shoreline is a flat walk from the parking area, not a summit, so the ending survives a rainy forecast and tired knees alike. The climb earns the view; it was never the requirement.",
      },
    ],
    heroImageKey: "destinations/lake-placid-ny",
  },
  {
    id: "door-county-two-shores",
    slug: "door-county-two-shores",
    planner: "engagedmoon",
    destinationId: "door-county-wi",
    title: "The lake side, the bay side, and the bluff above both",
    category: "harbor-and-headland",
    season: [5, 6, 7, 8, 9, 10],
    nights: 3,
    groupRange: [2, 4],
    lodgingId: "door-county-wi|lodging|Eagle Harbor Inn",
    activityIds: [
      "door-county-wi|activity|Peninsula State Park bike loop",
      "door-county-wi|activity|Cave Point kayak + cliffs",
      "door-county-wi|activity|Door Peninsula Winery + cidery hop",
      "door-county-wi|activity|Lakeshore Adventures charter out of Baileys Harbor",
    ],
    diningIds: [
      "door-county-wi|dining|Wickman House",
      "door-county-wi|dining|Chives Door County",
      "door-county-wi|dining|Al Johnson's Swedish",
    ],
    nightlifeIds: [
      "door-county-wi|nightlife|Mr. Helsinki",
      "door-county-wi|nightlife|Hatch Distilling Co. tasting room",
    ],
    narrative:
      "Door County is a seventy-mile limestone peninsula with water on both sides, and the trick is deciding which side you want each day. The bay side is calm and the lake side is not; Cave Point is where the lake has spent a few thousand years making its argument, and the guided kayak along those cliffs is best when the swell is small. Peninsula State Park's bike loop earns the afternoon, the winery-and-cidery hop is what cherry country does instead of grapes, and a charter out of Baileys Harbor fills the spare morning when the weather holds.",
    capstoneShape:
      "A wooden overlook platform at the lip of a limestone bluff, well over a hundred feet above the water, with cedars leaning out over the drop and the bay running open to the horizon. The road in dead-ends at the parking area, so nobody arrives by accident.",
    capstoneSpotId: "door-county-wi-ellison-bluff-county-park",
    faqs: [
      {
        q: "Bay side or lake side?",
        a: "Both, and that is the point of the peninsula. The bay side is calm and the lake side is dramatic, and nothing on this trip is more than about half an hour from the inn. Cave Point and Ellison Bluff are the two ends of that argument.",
      },
      {
        q: "Do we need kayaking experience?",
        a: "No. The Cave Point trip is a guided shoreline paddle, not an open-water crossing, and outfitters reschedule when the lake is rough. The lake makes that call, not you, which is its own kind of relief.",
      },
      {
        q: "What happens to the charter if the wind comes up?",
        a: "Lakeshore Adventures makes the call out of Baileys Harbor, and the honest answer is that some mornings it does not go. The bike loop and the winery hop do not care about the wind, so the day is never a loss.",
      },
    ],
    heroImageKey: "destinations/door-county-wi",
  },
  {
    id: "mackinac-loop-and-fort",
    slug: "mackinac-loop-and-fort",
    planner: "engagedmoon",
    destinationId: "mackinac-island-mi",
    title: "No cars since 1898, and the fort above the harbor",
    category: "old-town-and-fort",
    season: [5, 6, 7, 8, 9, 10],
    nights: 3,
    groupRange: [2, 4],
    lodgingId: "mackinac-island-mi|lodging|Grand Hotel",
    activityIds: [
      "mackinac-island-mi|activity|Bike the 8-mile loop",
      "mackinac-island-mi|activity|Horse-drawn carriage tour",
      "mackinac-island-mi|activity|Grand Hotel afternoon tea on the Porch",
      "mackinac-island-mi|activity|Fudge tasting walk",
    ],
    diningIds: [
      "mackinac-island-mi|dining|The Jockey Club",
      "mackinac-island-mi|dining|Doud's Market deli + lawn picnic",
      "mackinac-island-mi|dining|Woods Restaurant",
    ],
    nightlifeIds: ["mackinac-island-mi|nightlife|Cupola Bar"],
    narrative:
      "There have been no cars on Mackinac Island since 1898, so the trip moves at the speed of a bicycle or a horse. The eight-mile loop around the shore is flat and the water stays in view the whole way; the carriage tour covers the wooded interior you would otherwise miss. Afternoon tea on the Grand Hotel's porch is the island at its most formal, and a Doud's Market deli lunch eaten on a lawn is the island at its least. The fudge shops are the oldest cliché here, and the walk through them is still worth an hour.",
    capstoneShape:
      "The island's highest point — a small earth-and-timber fort on a wooded rise, reached by a quiet road or a long stair. From the ramparts the Straits open in every direction, the freighters pass below, and the crowds of the harbor town do not make it up here.",
    capstoneSpotId: "mackinac-island-mi-fort-holmes",
    faqs: [
      {
        q: "How do we get around without a car?",
        a: "By bicycle, by carriage, or on foot. The island is small enough that this is a feature rather than a constraint — everything on this trip sits on the loop road or within the few blocks of town below the Grand Hotel.",
      },
      {
        q: "Is the Grand Hotel formal?",
        a: "In the evenings, in the public rooms, yes — there is a dress code and it is kept. Pack one outfit that would pass at a serious restaurant and the porch, the tea, and the Cupola Bar are all open to you.",
      },
      {
        q: "When should we not come?",
        a: "Outside early May through mid-October. The ferries thin out and most of what this trip is built on closes for the season — the island in winter is a different place, and not the one described here.",
      },
    ],
    heroImageKey: "destinations/mackinac-island-mi",
  },
  {
    id: "traverse-city-vines-and-dunes",
    slug: "traverse-city-vines-and-dunes",
    planner: "engagedmoon",
    destinationId: "traverse-city-mi",
    title: "Two wine peninsulas and the dune above the lake",
    category: "great-lake-and-dune",
    season: [6, 7, 8, 9],
    nights: 4,
    groupRange: [2, 4],
    lodgingId: "traverse-city-mi|lodging|Delamar Traverse City",
    activityIds: [
      "traverse-city-mi|activity|Old Mission / Leelanau wine tour",
      "traverse-city-mi|activity|Sleeping Bear Dunes day trip",
      "traverse-city-mi|activity|Grand Traverse Bay paddle + beach day",
      "traverse-city-mi|activity|Einstein Cycles TART Trail bike rental",
    ],
    diningIds: [
      "traverse-city-mi|dining|The Cooks' House",
      "traverse-city-mi|dining|Firefly",
      "traverse-city-mi|dining|Apache Trout Grill",
    ],
    nightlifeIds: ["traverse-city-mi|nightlife|Low Bar"],
    narrative:
      "Traverse City sits at the base of Grand Traverse Bay with two wine peninsulas to its north and the dunes to its west, and the trip splits along those lines. Old Mission and Leelanau are the tasting days — narrow roads, orchards between vineyards, water visible from most of them. Sleeping Bear is the day that needs the most daylight: the Lake Michigan Overlook stands some four hundred feet above the water, and the lake from up there is the color people do not believe in photographs. The TART Trail and the bay fill whatever is left over.",
    capstoneShape:
      "A platform at the crest of a dune bluff standing some four hundred feet above Lake Michigan, with the sand dropping so steeply below that the shoreline vanishes from view. The water runs from pale green over the bar to a blue with nothing on the far side of it.",
    capstoneSpotId: "traverse-city-mi-sleeping-bear-lake-michigan-overlook",
    faqs: [
      {
        q: "Old Mission or Leelanau?",
        a: "The wine tour covers both, and they differ — Old Mission is one narrow ridge with water visible from both sides; Leelanau is broader, with more tasting rooms and more distance between them. One peninsula per day is the right pace.",
      },
      {
        q: "How far are the dunes?",
        a: "Under an hour west of town, which is why they get a day to themselves. Give that day your best weather — the Lake Michigan Overlook is the one thing on this trip worth rearranging everything else around.",
      },
      {
        q: "Is four nights too many for one town?",
        a: "The town is the base, not the trip. Vines, dunes and the bay are three full days pointing in three directions, and the fourth night means none of them gets rushed or dropped when the weather has opinions.",
      },
    ],
    heroImageKey: "destinations/traverse-city-mi",
  },
  {
    id: "traverse-city-winter-bay",
    slug: "traverse-city-winter-bay",
    planner: "engagedmoon",
    destinationId: "traverse-city-mi",
    title: "Draft horses in the pines, and the bay gone quiet",
    category: "alpine-lodge-and-lake",
    season: [1, 2, 12],
    nights: 3,
    groupRange: [2, 4],
    lodgingId: "traverse-city-mi|lodging|Delamar Traverse City",
    activityIds: [
      "traverse-city-mi|activity|Ranch Rudolf horse-drawn sleigh ride",
      "traverse-city-mi|activity|Vasa Pathway cross-country skiing",
      "traverse-city-mi|activity|Old Mission / Leelanau wine tour",
    ],
    diningIds: [
      "traverse-city-mi|dining|Cellar & Flame",
      "traverse-city-mi|dining|Artisan",
      "traverse-city-mi|dining|The Burrow",
    ],
    nightlifeIds: ["traverse-city-mi|nightlife|The Parlor"],
    narrative:
      "Northern Michigan gets lake-effect snow off Lake Michigan all winter, and this trip leans into it rather than around it. Ranch Rudolf runs a horse-drawn sleigh through the pines south of town, and the Vasa Pathway grooms cross-country loops through the same forest — you can be entirely new on skis here and the terrain will forgive you. The tasting rooms of Old Mission and Leelanau stay open after the summer visitors leave, which is when the people pouring have time to talk. Dinner is the other half of the argument: this town cooks best in the cold months.",
    capstoneShape:
      "Open waterfront at the foot of downtown — a beach, a pier, and the west arm of the bay in front of you. In a hard winter it freezes white past the pier; in a mild one it stays dark and steel-blue. Either way the snow is quiet and town is two blocks behind you.",
    capstoneSpotId: "traverse-city-mi-clinch-park",
    faqs: [
      {
        q: "Do we need to know how to ski?",
        a: "No. The Vasa Pathway has groomed loops at every level and the rental covers the gear; the sleigh asks nothing of you at all. This is a trip for people who like winter, not a test of anyone's technique.",
      },
      {
        q: "What if the snow doesn't come?",
        a: "It usually does — this is lake-effect country. In a thin year the sleigh is the piece at risk, and Ranch Rudolf will tell you before you drive out; the tasting rooms, the restaurants and the waterfront hold the trip up on their own.",
      },
      {
        q: "Can we bring more than two people?",
        a: "Yes — the sleigh and the ski trails both take far more than a couple. The practical ceiling is the dinner table at this scale of restaurant, which is why this entry caps at four.",
      },
    ],
    heroImageKey: "destinations/traverse-city-mi",
  },
];
