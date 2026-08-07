/**
 * seed-private-dining-2026-08.ts — one researched batch, run once.
 *
 * WHAT THIS ADDS, AND WHY IT IS NOT A DUPLICATE OF THE 1,319 DINING ROWS
 * ALREADY HERE.
 *
 * The party universe's dining rows answer "where can this group eat?" — they
 * carry `groupFriendly: true`, which means the restaurant tolerates a large
 * booking. They do NOT answer the question a just-married couple and fourteen
 * friends actually ask the week after a wedding: *is there a room where all of
 * us sit at one table?* That is a different fact about a different space, and
 * nothing in the catalog carried it.
 *
 * Every row below is a restaurant's OWN private-dining / private-events page,
 * with the seated capacity that page states. Where a source gave no number, the
 * highlight says what the space is and stops — it never guesses a capacity,
 * because the capacity is the entire reason the row exists.
 *
 * ROUTING. These rows carry no `brands`, so `bakeDining` derives
 * `["offsite-outing", "friendsmoon", "engagedmoon"]` — deliberately NOT bestman
 * or moh. A private dining room is the right shape for a friends trip, a
 * proposal trip and a corporate outing; adding it to the two party wizards
 * would change two live sites that did not ask for it, and is a separate call.
 *
 * INSERTS vs PATCHES. Eleven researched venues already exist as curated rows.
 * Appending would drop them (curated wins, correctly). Eight of those eleven
 * carry no `url` at all, so they land instead as PATCHES that add one — the
 * enrichment lane `party-venue-patches.ts` exists for exactly this, and it
 * names "reservation + private-dining data" as a case. The remaining three
 * (Tavernetta, Guard and Grace, Matsuhisa Aspen) already carry a correct
 * venue URL and are left untouched: a patch overwrites, and there is nothing
 * here worth overwriting a good curated link with.
 *
 * SOURCING. Rows without a venue-owned URL were dropped rather than sourced to
 * a listicle. A wrongly-sourced row suppresses the partner+Maps fallback and is
 * strictly worse than no source at all — see `scripts/audit-url-subject.ts`.
 * Patch URLs point at the venue ROOT, not the private-events subpage: the
 * `url` is shared with Offsite Outpost, where a private-events landing page
 * would be the wrong destination for an ordinary dinner link.
 *
 * Researched 2026-08-06 by search over each venue's own site.
 *
 * Run:  npx tsx scripts/seed-private-dining-2026-08.ts [--dry]
 */
import type { ResearchedRow } from "../src/research-schema";
import { ingestResearched } from "./ingest-researched";

/** A private-dining room, expressed as the dining row the catalog wants. */
const room = (
  destinationId: string,
  name: string,
  cuisine: string,
  priceRange: string,
  highlight: string,
  url: string,
): ResearchedRow =>
  ({
    dataset: "party-venue",
    destinationId,
    category: "dining",
    name,
    cuisine,
    priceRange,
    highlight,
    bestFor: "group-dinner",
    groupFriendly: true,
    sourceUrl: url,
    citations: [url],
  }) as ResearchedRow;

/**
 * An existing curated row that has no `url`, given one.
 *
 * `root` is the venue's home page — the honest general-purpose link. `evidence`
 * is the private-dining page that proves the root belongs to this venue, and
 * rides through as the citation.
 */
const linkOnly = (
  destinationId: string,
  name: string,
  root: string,
  evidence: string,
): ResearchedRow =>
  ({
    dataset: "party-venue-patch",
    destinationId,
    category: "dining",
    name,
    url: root,
    sourceUrl: root,
    citations: [evidence],
  }) as ResearchedRow;

const ROWS: ResearchedRow[] = [
  // ── Charleston, SC ────────────────────────────────────────────────────────
  room("charleston-sc", "Peninsula Grill", "Low Country", "$$$$",
    "Private dining seven days a week for 10 to 120, in the garden courtyard rooms behind Planters Inn — the room, not a corner of the dining room.",
    "https://peninsulagrill.com/private-dining/"),
  room("charleston-sc", "The Red Drum Wine Room", "Southwestern", "$$$",
    "The Wine Room seats up to 20 with its own server. The Pub Room next door holds 50 if the group grows.",
    "https://reddrumrestaurant.com/charleston-the-red-drum-gastro-private-events"),
  room("charleston-sc", "Indaco", "Italian", "$$$",
    "Takes large parties from 11 up, with private seating for as many as 48 and a heated patio when the room fills.",
    "https://www.indacorestaurant.com/private-events-charleston/"),
  room("charleston-sc", "Edmund's Original", "Modern Southern", "$$$$",
    "The Library is a fully closed rectangular room seating 32 — one table, one door, no passing traffic.",
    "https://www.edmundsoriginal.com/charleston-private-event-spaces/"),

  // ── Savannah, GA ──────────────────────────────────────────────────────────
  room("savannah-ga", "Common", "Modern American", "$$$",
    "Private space above the main dining room for 10 to 60 — The Room seats 16 to 24 inside the old Orpheum Theatre.",
    "https://www.commonrestaurant.com/private-events/"),
  room("savannah-ga", "The Olde Pink House", "Lowcountry", "$$$$",
    "The Study seats 24 with glass doors onto a balcony; the Grand Ballroom takes 80 if half the wedding is still in town.",
    "https://www.theoldepinkhouserestaurant.com/private-dining"),
  room("savannah-ga", "Alligator Soul — The Marsou Room", "Creole", "$$$$",
    "One communal table, twelve seats, one set menu a night. Exactly the shape of a crew that wants to eat together rather than in shifts.",
    "https://alligatorsoul.com/savannah-alligator-soul-the-marsou-room"),

  // ── Asheville, NC ─────────────────────────────────────────────────────────
  room("asheville-nc", "Luminosa", "Coastal Italian", "$$$",
    "Semi-private dining for up to 20 in the Flat Iron Hotel, with a rooftop buyout available if the group wants the floor.",
    "https://www.luminosaavl.com/events-and-private-dining/"),
  room("asheville-nc", "The Market Place", "Appalachian", "$$$$",
    "The Back Dining Room takes up to 60 — the long-running downtown room for a group that wants its own space.",
    "https://marketplace-restaurant.com/private-dining"),
  room("asheville-nc", "Xico Cocina de Fuego", "Mexican", "$$$",
    "A private room for 12 to 24, served family style under one chandelier.",
    "https://www.xicoasheville.com/"),
  room("asheville-nc", "Cúrate Bar de Tapas", "Spanish", "$$$$",
    "The wine cellar seats 36; La Bodega next door takes 75. Tapas is the format that actually works at this size.",
    "https://www.curatetapasbar.com/private-events/"),

  // ── New Orleans, LA ───────────────────────────────────────────────────────
  room("new-orleans-la", "Galatoire's Private Rooms", "Creole", "$$$$",
    "Rooms upstairs from the Bourbon Street dining room, bookable individually — the classic New Orleans group dinner.",
    "https://www.galatoires.com/our-rooms"),
  room("new-orleans-la", "Arnaud's Private Dining", "Creole", "$$$$",
    "Fourteen private rooms across the French Quarter block, sized from a single table to a full floor.",
    "https://www.arnaudsrestaurant.com/private-dining/"),
  room("new-orleans-la", "Brennan's Private Parties", "Creole", "$$$$",
    "Private rooms in the pink Royal Street house, breakfast through dinner — the courtyard is the one to ask for.",
    "https://www.brennansneworleans.com/private-parties/"),
  room("new-orleans-la", "Plates Restaurant & Bar", "Modern Creole", "$$$",
    "Private dining and group events, booked through the restaurant rather than a platform.",
    "https://www.platesnola.com/privatedining"),
  room("new-orleans-la", "Rib Room Private Dining", "Steakhouse", "$$$$",
    "Several intimate rooms in the Omni Royal Orleans, each seating 10 to 12 — good for a crew happy to split in two.",
    "https://ribroomneworleans.com/book-private-dining/"),

  // ── Nashville, TN ─────────────────────────────────────────────────────────
  room("nashville-tn", "The Palm Nashville", "Steakhouse", "$$$$",
    "The Jubilee Room seats 16 at table and holds 20 standing.",
    "https://www.thepalm.com/nashville-private-events/"),
  room("nashville-tn", "The Finch", "Modern American", "$$$",
    "Five reservable spaces including Arches 1 and 2, seating 38 and 28 — pick the size rather than take what is left.",
    "https://www.thefinchnashville.com/private-events/"),
  room("nashville-tn", "Bourbon Steak Nashville", "Steakhouse", "$$$$",
    "Private event space inside the JW Marriott, with its own menus and an events team.",
    "https://nashvillebourbonsteak.com/private-events/"),
  room("nashville-tn", "M Street Private Events", "Varies by room", "$$$",
    "One events team across the Gulch group — Kayne Prime, Saint Añejo, Tavern and Virago — so a 20-person dinner gets placed by room instead of by guesswork.",
    "https://www.mstreetnashville.com/private-events"),

  // ── Austin, TX ────────────────────────────────────────────────────────────
  room("austin-tx", "Suerte", "Oaxacan", "$$$",
    "The semi-private room seats 20 at one table, or 24 across three, and closes off behind a sliding partition.",
    "https://www.suerteatx.com/private-events-venue/semi-private-dining-room/"),
  room("austin-tx", "Este", "Coastal Mexican", "$$$",
    "Semi-private partial buyout for up to 20 across two adjacent ten-tops.",
    "https://www.esteatx.com/private-dining/"),
  room("austin-tx", "Salty Sow", "Gastropub", "$$",
    "Private dining on the east side, booked through the restaurant.",
    "https://www.saltysow.com/private-dining"),
  room("austin-tx", "Corner Restaurant", "Modern American", "$$$",
    "Private dining inside the JW Marriott downtown, walkable from most of the central rentals.",
    "https://www.cornerrestaurantaustin.com/private-dining-austin"),
  room("austin-tx", "Lonesome Dove Austin", "Western", "$$$$",
    "Tim Love's Rainey Street room, with events and catering handled in-house.",
    "https://www.lonesomedoveaustin.com/events-catering"),

  // ── Napa Valley, CA ───────────────────────────────────────────────────────
  room("napa-valley-ca", "Brix Restaurant & Gardens", "Wine Country", "$$$$",
    "Several private rooms plus vineyard space; the Reserve Wine Cellar is one long wooden table seating twelve.",
    "https://www.brix.com/private-events/"),
  room("napa-valley-ca", "PRESS Napa Valley", "Steakhouse", "$$$$",
    "The Wine Cellar seats up to 18, fully private.",
    "https://pressnapavalley.com/private-events/"),
  room("napa-valley-ca", "V. Sattui Winery", "Winery", "$$$",
    "Indoor and outdoor space from an intimate 35 up, from a pizza night to a long sit-down dinner.",
    "https://www.vsattui.com/experiences/private-events/"),
  room("napa-valley-ca", "House of Far Niente", "Winery", "$$$$",
    "Seated tastings for up to 16 across the Far Niente estate venues.",
    "https://farniente.com/private-events"),

  // ── Scottsdale, AZ ────────────────────────────────────────────────────────
  room("scottsdale-az", "Mastro's Ocean Club", "Seafood", "$$$$",
    "Private room for 20, or 16 once the audio-visual setup goes in.",
    "https://www.mastrosrestaurants.com/private-events-scottsdale-ocean-club/"),
  room("scottsdale-az", "Dominick's Steakhouse", "Steakhouse", "$$$$",
    "The Wine Room takes up to 25.",
    "https://www.dominickssteakhouse.com/private-events/"),
  room("scottsdale-az", "Ocean 44", "Seafood", "$$$$",
    "Private and semi-private rooms on Scottsdale Road, with the events team handling the menu.",
    "https://www.ocean44.com/private-events/"),
  room("scottsdale-az", "Roaring Fork", "Southwestern", "$$$",
    "Private dining in Old Town, close enough to walk back to most of the rentals.",
    "https://www.roaringfork.com/scottsdale-private-dining"),

  // ── Bozeman, MT ───────────────────────────────────────────────────────────
  room("bozeman-mt", "Fielding's", "Modern Mountain", "$$$$",
    "Takes 8 to 20 for a private dinner, or the whole room for up to 90.",
    "https://www.fieldingsbozeman.com/private-dining"),
  room("bozeman-mt", "Tanglewood", "American Bistro", "$$$",
    "A private room built around one large round table, taking group reservations from 16 up.",
    "https://www.tanglewoodmt.com/private-events/"),
  room("bozeman-mt", "Montana Ale Works", "American", "$$",
    "The Main Street Lounge books privately for up to twenty, in the old railroad building downtown.",
    "https://www.montanaaleworks.com/spaces"),
  room("bozeman-mt", "Kimpton Armory Hotel", "American", "$$$",
    "The second-floor mezzanine, or a reserved stretch of the Sky Shed rooftop, each bookable on its own.",
    "https://www.armoryhotelbzn.com/bozeman-restaurants/private-dining/"),

  // ── Jackson Hole, WY ──────────────────────────────────────────────────────
  room("jackson-hole-wy", "Roadhouse Brewing Pub & Eatery", "Brewpub", "$$",
    "The small private dining room takes up to 20; the large one holds 80 and has its own bar.",
    "http://roadhousebrewery.com/pub-eatery-private-events.php"),
  room("jackson-hole-wy", "The Kitchen", "Modern American", "$$$",
    "Steps from Town Square, taking private groups up to 75.",
    "https://thekitchenjacksonhole.com/private-events.php"),
  room("jackson-hole-wy", "Calico Bar + Restaurant", "Italian", "$$",
    "Private dining out on the Wilson road toward Teton Village, with a lawn for the pre-dinner part.",
    "https://www.calicorestaurant.com/private-dining"),

  // ── Denver, CO ────────────────────────────────────────────────────────────
  room("denver-co", "Urban Farmer", "Steakhouse", "$$$$",
    "The Parlor Room seats 20, in the Oxford Hotel in LoDo.",
    "https://www.urbanfarmersteakhouse.com/denver-private-events/"),
  room("denver-co", "Saverina", "Italian", "$$$",
    "Seats 20 at table, 30 standing.",
    "https://www.saverinadenver.com/private-dining"),
  room("denver-co", "Tamayo", "Modern Mexican", "$$$",
    "Takes groups of 20 up, with a Larimer Square rooftop for the drinks half.",
    "https://tamayodenver.com/private-events"),
  room("denver-co", "Edge Restaurant & Bar", "Steakhouse", "$$$$",
    "Private dining in the Four Seasons on 14th, with its own way in off the lobby.",
    "https://www.edgerestaurantdenver.com/private-dining/"),
  room("denver-co", "Corinne", "American Brasserie", "$$$",
    "Private events in the Le Méridien downtown, a short walk from the 16th Street rentals.",
    "https://www.corinnedenver.com/private-events"),

  // ── San Diego, CA ─────────────────────────────────────────────────────────
  room("san-diego-ca", "AVANT", "Modern American", "$$$$",
    "The El Biz room seats up to 20 around one large table.",
    "https://www.avantrestaurant.com/private-dining-san-diego"),
  room("san-diego-ca", "Top of the Market", "Seafood", "$$$$",
    "The Fish Bowl seats up to 20, with harbour windows on three sides.",
    "https://topofthemarketsd.com/private-dining/"),
  room("san-diego-ca", "Grant Grill", "Modern American", "$$$$",
    "The private room seats 12; the main room sets one long feast table, and the bar and lounge buy out for up to 100.",
    "https://www.grantgrill.com/san-diego-private-dining/"),
  room("san-diego-ca", "Kettner Exchange", "Modern American", "$$$",
    "Event spaces from 20 to over 450, across three levels in Little Italy.",
    "https://www.kettnerexchange.com/private-events/"),
  room("san-diego-ca", "Allegro", "Italian", "$$$",
    "A private room with flexible seating and a dedicated events contact.",
    "https://allegro-sd.com/private-events/"),

  // ── Palm Springs, CA ──────────────────────────────────────────────────────
  room("palm-springs-ca", "Parker Palm Springs", "Modern American", "$$$$",
    "The Den seats up to 28 for a sit-down dinner, behind the hedges at the Parker.",
    "https://www.parkerpalmsprings.com/private-events"),
  room("palm-springs-ca", "4 Saints", "Modern American", "$$$$",
    "The rooftop private room looks straight at San Jacinto; the Jacinto space banquets up to 50.",
    "https://www.4saintspalmsprings.com/private-dining"),
  room("palm-springs-ca", "Lola Rose", "Modern American", "$$$",
    "An intimate space for up to 10 and a larger private room for up to 30.",
    "https://www.lolaroseps.com/group-dining/"),
  room("palm-springs-ca", "Alice B.", "Modern American", "$$$",
    "Patio, main room or the whole restaurant, with semi-private options in between.",
    "https://www.aliceb.com/private-events/"),
  room("palm-springs-ca", "Kimpton Rowan Rooftop", "Modern American", "$$$",
    "Private dining at the rooftop restaurant, mountains on one side and downtown on the other.",
    "https://www.rowanpalmsprings.com/palm-springs-restaurants/private-dining/"),

  // ── Newport, RI ───────────────────────────────────────────────────────────
  room("newport-ri", "22 Bowen's", "Steakhouse", "$$$$",
    "The Scull Room takes up to 40; the climate-controlled deck seats 32 on the harbour.",
    "https://www.22bowens.com/private-events/"),
  room("newport-ri", "The Mooring Seafood Kitchen & Bar", "Seafood", "$$$",
    "The South Deck seats 20; the Harborview Room holds 40.",
    "https://www.mooringrestaurant.com/private-events/"),
  room("newport-ri", "Safari Room at OceanCliff", "Modern American", "$$$$",
    "Seats 50 inside and 70 out, on the cliff at the end of Ocean Drive.",
    "https://www.newportexperience.com/venues/safari-room/"),
  room("newport-ri", "Giusto", "Coastal Italian", "$$$",
    "Private events on the waterfront at Hammetts Wharf.",
    "https://www.giustonewport.com/private-events/"),

  // ── Boston, MA ────────────────────────────────────────────────────────────
  room("boston-ma", "Ramsay's Kitchen Boston", "Modern British", "$$$$",
    "A 368-square-foot semi-private room seating twenty, bookable online rather than by waiting on an events reply.",
    "https://www.gordonramsayrestaurants.com/en/us/ramsays-kitchen/private-dining-boston"),
  room("boston-ma", "Rochambeau", "French", "$$$",
    "A semi-private table for 12, the Bordeaux Room at 70 seated, or the whole place — a block from the Public Garden.",
    "https://www.rochambeauboston.com/private-dining"),
  room("boston-ma", "Porto", "Coastal Italian", "$$$",
    "Private, semi-private and full buyout, from 20 to 200.",
    "https://www.porto-boston.com/private-events"),
  room("boston-ma", "Committee", "Greek", "$$$",
    "The board room seats up to 18, lunch or dinner, in the Seaport.",
    "https://committeeboston.com/category/private-event/"),
  room("boston-ma", "The Palm Boston", "Steakhouse", "$$$$",
    "Private rooms in the Westin Copley, walkable from most of the Back Bay stays.",
    "https://www.thepalm.com/boston-private-events/"),

  // ── Seattle, WA ───────────────────────────────────────────────────────────
  room("seattle-wa", "Neb Wine Bar", "Wine Bar", "$$$",
    "The kitchen table seats up to 20 — one table, in front of the pass.",
    "https://www.nebseattle.com/private-events/"),
  room("seattle-wa", "Red Cow", "French Brasserie", "$$$",
    "Fully private for up to 20 in Madrona, part of the Ethan Stowell group.",
    "https://ethanstowellrestaurants.com/group-dining"),
  room("seattle-wa", "El Gaucho Seattle", "Steakhouse", "$$$$",
    "The Wall Street room holds up to 20 reception-style, with a screen if anyone insists on a slideshow.",
    "https://elgaucho.com/private-dining-seattle/"),
  room("seattle-wa", "Duke's Seafood", "Seafood", "$$",
    "The Cabin takes 14 to 26 on South Lake Union, on the water.",
    "https://dukesseafood.com/private-dining-seattle/"),
  room("seattle-wa", "Aerlume", "Pacific Northwest", "$$$$",
    "Two glass private rooms over Puget Sound; up to 16 gather round the interior fire table.",
    "https://aerlumeseattle.com/private-dining/"),
  room("seattle-wa", "Tom Douglas Restaurants", "Pacific Northwest", "$$$",
    "One events team across the downtown rooms, so a group gets placed by size rather than by luck.",
    "https://www.tomdouglas.com/private-dining/"),
  room("seattle-wa", "2120", "Modern American", "$$$",
    "Private dining in South Lake Union with its own street entrance.",
    "https://www.2120restaurant.com/private-dining"),

  // ── Aspen, CO ─────────────────────────────────────────────────────────────
  room("aspen-co", "The Board Room at The Little Nell", "Modern American", "$$$$",
    "Twelve for a sit-down dinner, fifteen standing — couches, a bar and a pool table rather than a banquet room.",
    "https://www.thelittlenell.com/dine/board-room"),
  room("aspen-co", "Mawa's Kitchen", "Farm to Table", "$$$",
    "A private room for up to 25, or the whole restaurant for 75, out by the airport.",
    "https://www.mawaskitchen.com/private-events/"),
  room("aspen-co", "Duemani", "Coastal Italian", "$$$$",
    "The Cove seats 18, or holds 25 standing.",
    "https://www.duemaniaspen.com/private-dining"),
  room("aspen-co", "PARC Aspen", "Modern American", "$$$$",
    "The Chef's Table seats up to 12, in a restored building on Hyman.",
    "https://www.parcaspen.com/events"),
  room("aspen-co", "Pine Creek Cookhouse", "Modern Mountain", "$$$$",
    "Private events twelve miles up Castle Creek — in winter you ski or sleigh in, which is the point.",
    "https://pinecreekcookhouse.com/aspen-private-events/"),
  room("aspen-co", "Campo de Fiori", "Italian", "$$$",
    "Several private areas for larger groups, plus catering if the dinner moves back to the house.",
    "https://www.campodefiori.net/private-events"),

  // ── Sonoma, CA ────────────────────────────────────────────────────────────
  room("sonoma-ca", "Wit and Wisdom", "Wood-Fired American", "$$$$",
    "A private room for smaller groups, the main room for larger, or the whole place.",
    "https://www.witandwisdomsonoma.com/private-events/"),

  // ── Hilton Head, SC ───────────────────────────────────────────────────────
  room("hilton-head-sc", "Alexander's Restaurant", "Lowcountry", "$$$",
    "Lagoon-side, seating up to 120 inside and 55 on the porch.",
    "https://www.alexandersrestaurant.com/private-dining"),
  room("hilton-head-sc", "Bowdie's Chophouse", "Steakhouse", "$$$$",
    "A private space for up to 30.",
    "https://bowdieschophouse.com/locations/hilton-head/private-dining/"),
  room("hilton-head-sc", "Hudson's on the Docks", "Seafood", "$$",
    "Private waterfront dining on Skull Creek, from a small table to a large one.",
    "https://www.hudsonsonthedocks.com/private-waterfront-dining-hilton-head/"),
  room("hilton-head-sc", "Red Fish", "Caribbean", "$$$",
    "The Chef's Cellar seats up to 75, walls lined with wine and an open kitchen at one end.",
    "https://www.redfishofhiltonhead.com/privatedining"),
  room("hilton-head-sc", "Frankie Bones", "Italian American", "$$$",
    "Three rooms — the Boardroom seats up to 40, Sinatra's Lounge takes 12.",
    "https://frankiebones.com/the-best-private-dining-on-hilton-head-island-and-bluffton/"),

  // ── Key West, FL ──────────────────────────────────────────────────────────
  room("key-west-fl", "Four Flamingos", "Floridian", "$$$$",
    "The Marquesa room is floor-to-ceiling glass over the water — take it for the sunset half of the evening.",
    "https://fourflamingoskeywest.com/private-dining"),
  room("key-west-fl", "Mangoes Key West", "Caribbean", "$$$",
    "A room for up to 120 with its own bar and a balcony over Duval.",
    "https://www.mangoeskeywest.com/privateevents.html"),

  // ── Bend, OR ──────────────────────────────────────────────────────────────
  room("bend-or", "The Rio Room at Barrio", "Latin", "$$$",
    "Downtown, 15 to 90, with a covered heated patio for the shoulder months.",
    "https://www.barriobend.com/private-parties"),
  room("bend-or", "900 Wall", "Pacific Northwest", "$$$",
    "The private room closes off completely and seats 35, on seasonal family-style menus.",
    "https://www.900wall.com/events"),

  // ── Traverse City, MI ─────────────────────────────────────────────────────
  room("traverse-city-mi", "Cellar & Flame", "Steakhouse", "$$$$",
    "The Riverside Room for a smaller sitting, or semi-private and full-restaurant arrangements above that, with the wine pairings handled in-house.",
    "https://cellarandflame.com/private-events-traverse-city/"),
  room("traverse-city-mi", "Artisan", "Modern American", "$$$$",
    "Full and partial buyouts from 10 to 160; the Birch Room is the small one, and the patio looks over West Bay.",
    "https://www.artisantc.com/private-events"),
  room("traverse-city-mi", "The Burrow", "Modern American", "$$$",
    "Booth seating facing the open kitchen — the rehearsal-dinner room downtown.",
    "https://burrowtc.com/events/"),

  // ── Enrichment: curated rows that had no link at all ───────────────────────
  linkOnly("savannah-ga", "Husk Savannah", "https://husksavannah.com/",
    "https://husksavannah.com/private-dining/"),
  linkOnly("savannah-ga", "The Grey", "https://thegreyrestaurant.com/",
    "https://thegreyrestaurant.com/events_space/"),
  linkOnly("napa-valley-ca", "La Toque", "https://latoque.com/",
    "https://latoque.com/la-toque-private-dining-restaurant-napa/"),
  linkOnly("scottsdale-az", "Toca Madera", "https://tocamadera.com/",
    "https://tocamadera.com/private-events/scottsdale"),
  linkOnly("jackson-hole-wy", "Gather", "https://gatherjh.com/",
    "https://gatherjh.com/private-dining-party-rooms/"),
  linkOnly("sonoma-ca", "El Dorado Kitchen", "https://eldoradosonoma.com/",
    "https://eldoradosonoma.com/meetings-events/"),
  linkOnly("hilton-head-sc", "Skull Creek Boathouse", "https://www.skullcreekboathouse.com/",
    "https://www.skullcreekboathouse.com/private-dining/"),
  linkOnly("key-west-fl", "El Meson de Pepe", "https://www.elmesondepepe.com/",
    "https://www.elmesondepepe.com/key-west-private-parties/"),
];

const dry = process.argv.includes("--dry");

const inserts = ROWS.filter((r) => r.dataset === "party-venue");
const patches = ROWS.filter((r) => r.dataset === "party-venue-patch");
const byDest = new Map<string, number>();
for (const r of ROWS) {
  const id = (r as { destinationId: string }).destinationId;
  byDest.set(id, (byDest.get(id) ?? 0) + 1);
}
console.log(
  `seed-private-dining: ${inserts.length} inserts + ${patches.length} link patches ` +
    `= ${ROWS.length} rows across ${byDest.size} destinations`,
);

if (dry) {
  for (const [id, n] of [...byDest].sort()) console.log(`  ${id}: ${n}`);
  process.exit(0);
}

const result = ingestResearched(ROWS);
console.log(
  JSON.stringify(
    { accepted: result.accepted, rejected: result.rejected, reasons: result.reasons },
    null,
    2,
  ),
);
process.exit(result.accepted === ROWS.length ? 0 : 1);
