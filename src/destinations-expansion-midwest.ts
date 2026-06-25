/**
 * Canonical destinations — Midwest US expansion (added 2026-06-24).
 *
 * Fills zero/low-coverage Midwest gaps: Iowa, Kansas, Nebraska, North/South
 * Dakota, plus more in Wisconsin, Michigan, Ohio, Minnesota, Indiana. Every
 * city here is unique vs. destinations-data.ts and existing expansion files at
 * time of write (Chicago, Milwaukee, Minneapolis, KC, St. Louis, Cincinnati,
 * Cleveland, Detroit, Indianapolis, Galena, Door County, Mackinac, Black Hills,
 * Branson, Lake of the Ozarks, Columbus, OKC already covered — skipped).
 *
 * region = "midwest" for all. Per-city density: min 3 nightlife / 3 dining /
 * 5 activities / 2 lodging / 1 transport, with distinct moh + bestman
 * presentation blocks. Real, verifiable venues only.
 *
 * Activity `type` values stay within the per-brand allowed unions (overlays
 * silently drop unrecognized types); "both"-tagged activities use only the
 * shared union.
 */

import type { CanonicalDestination } from "./destinations-types";

export const expansionMidwest: CanonicalDestination[] = [
  // 1 — Des Moines, IA
  { id: "des-moines-ia", city: "Des Moines", state: "IA", region: "midwest",
    nearestAirport: { code: "DSM", name: "Des Moines Intl", driveMinutes: 15 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Hello, Marjorie", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Deep-green leather lounge that anchors the city's cocktail scene", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Bellhop Tiki Bar", type: "tiki-bar", vibe: "balanced", priceRange: "$$", highlight: "Palm Springs-style tiki den in the East Village", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Up-Down", type: "arcade-bar", vibe: "balanced", priceRange: "$$", highlight: "Classic arcade + pinball with a real cocktail list", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Exile Brewing Company", cuisine: "American", priceRange: "$$", highlight: "Craft beer + big patio in the East Village", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Le Bouillon", cuisine: "French", priceRange: "$$$", highlight: "Rural-French comfort food — duck frites + raw bar", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Ted & Wally's", cuisine: "Dessert", priceRange: "$", highlight: "Premium homemade ice cream to cap the night", bestFor: "late-night treat", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "East Village cocktail crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Walkable bohemian district — bar to bar without an Uber", bestFor: "first night", brands: ["both"] },
      { name: "Pappajohn Sculpture Park walking tour", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,20], groupMin: 2, groupMax: 16, highlight: "Free downtown park with 30+ blue-chip sculptures", bestFor: "afternoon", brands: ["both"] },
      { name: "Exile Brewing taproom tour", type: "brewery-tour", duration: "2 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 14, highlight: "Flagship craft brewery + tasting flight", bestFor: "first day", brands: ["both"] },
      { name: "Gray's Lake kayak paddle", type: "kayaking", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 12, highlight: "Downtown-skyline lake with rental fleet", bestFor: "active morning", brands: ["both"] },
      { name: "Downtown Farmers' Market food tour", type: "food-tour", duration: "2.5 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "One of the country's biggest markets, May–Oct Saturdays", bestFor: "Saturday brunch", brands: ["both"] },
      { name: "In Confidence speakeasy cocktail class", type: "cocktail-class", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Hands-on mixing inside Hotel Fort Des Moines", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Smash Park pickleball + axe lanes", type: "axe-throwing", duration: "2 hr", pricePerPerson: [30,60], groupMin: 4, groupMax: 16, highlight: "Pickleball, axe lanes, and a full bar under one roof", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Fort Des Moines (Curio Collection)", type: "boutique-hotel", pricePerNight: [180,320], perRoom: true, maxGuests: 2, highlight: "1919 landmark hotel with the In Confidence speakeasy downstairs" },
      { name: "East Village loft", type: "airbnb", pricePerNight: [350,650], perRoom: false, maxGuests: 10, highlight: "Walkable to the cocktail bars + sculpture park" },
    ],
    transport: [{ name: "Des Moines party shuttle", type: "shuttle", priceRange: "$100-$220/group", highlight: "East Village to downtown loop with late pickup" }],
    presentation: {
      moh: { tagline: "The underrated East Village weekend", description: "Des Moines surprises every bridesmaid who shows up skeptical. The Historic East Village is a walkable strip of cocktail dens, tiki bars, and patios, the sculpture park is free, and the whole weekend costs a fraction of a coastal trip." },
      bestman: { tagline: "Cocktail crawl + breweries + zero cover charges", description: "Des Moines keeps it cheap and walkable: the East Village packs craft cocktails, an arcade bar, and one of the Midwest's best breweries into a few blocks, with kayaking and pickleball to fill the daytime." },
    } },

  // 2 — Iowa City, IA
  { id: "iowa-city-ia", city: "Iowa City", state: "IA", region: "midwest",
    nearestAirport: { code: "CID", name: "Eastern Iowa (Cedar Rapids)", driveMinutes: 30 },
    bestMonths: [4,5,6,9,10], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "The Dublin Underground", type: "pub", vibe: "balanced", priceRange: "$", highlight: "Cozy basement Irish pub off the Ped Mall", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Vue Rooftop", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Downtown rooftop with skyline views", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Fieldhouse", type: "bar", vibe: "unhinged", priceRange: "$", highlight: "Big multi-level college-town nightclub energy", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Pullman Bar & Diner", cuisine: "Modern American", priceRange: "$$$", highlight: "Wood-fired plates + serious cocktail list", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Big Grove Brewery & Taproom", cuisine: "Gastropub", priceRange: "$$", highlight: "Sprawling taproom + patio for big groups", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Deadwood Tavern", cuisine: "Bar food", priceRange: "$", highlight: "Beloved dive with the best patio in town", bestFor: "afternoon beers", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Pedestrian Mall bar crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 16, highlight: "130+ venues in a pedestrian-only district — no Uber needed", bestFor: "first night", brands: ["both"] },
      { name: "Big Grove brewery tour + flight", type: "brewery-tour", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 14, highlight: "Tour the brewhouse then take over the beer garden", bestFor: "first day", brands: ["both"] },
      { name: "Iowa River kayak float", type: "kayaking", duration: "2.5 hr", pricePerPerson: [30,60], groupMin: 4, groupMax: 12, highlight: "Paddle past the campus and downtown", bestFor: "active morning", brands: ["both"] },
      { name: "Literary Walk + downtown walking tour", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,25], groupMin: 2, groupMax: 16, highlight: "UNESCO City of Literature panels set into the sidewalks", bestFor: "afternoon", brands: ["both"] },
      { name: "Wilson's Orchard cider tasting", type: "farm-tour", duration: "3 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 16, highlight: "Orchard cidery + pies + barn patio just outside town", bestFor: "fall afternoon", brands: ["both"] },
      { name: "Beadology pottery + jewelry workshop", type: "pottery-class", duration: "2 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 12, highlight: "Make-and-take studio session with bubbles allowed", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Backpocket axe-throwing lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Coralville lanes + brewery taproom next door", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Vetro", type: "boutique-hotel", pricePerNight: [160,280], perRoom: true, maxGuests: 2, highlight: "Glass-tower hotel steps from the Ped Mall" },
      { name: "Downtown 4BR rental", type: "airbnb", pricePerNight: [320,600], perRoom: false, maxGuests: 10, highlight: "Walk to every bar on the Ped Mall" },
    ],
    transport: [{ name: "Iowa City group shuttle", type: "shuttle", priceRange: "$90-$200/group", highlight: "Orchard + brewery loop with downtown drop" }],
    presentation: {
      moh: { tagline: "College-town energy with a grown-up cocktail list", description: "Iowa City is a UNESCO City of Literature with a Pedestrian Mall that crams 130+ venues into a few car-free blocks. Daytime is orchard cider and pottery; nighttime is a crawl you can do entirely on foot." },
      bestman: { tagline: "Ped Mall crawl + breweries + Hawkeye Saturdays", description: "Iowa City is built for a group on foot. The Pedestrian Mall has dozens of bars within a stumble, Big Grove pours all day, and an axe-and-brewery combo handles the daytime. Add a Hawkeye game and it's a lock." },
    } },

  // 3 — Omaha, NE
  { id: "omaha-ne", city: "Omaha", state: "NE", region: "midwest",
    nearestAirport: { code: "OMA", name: "Eppley Airfield", driveMinutes: 10 },
    bestMonths: [5,6,7,8,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "The Berry & Rye", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Prohibition-era craft cocktails with house bitters + sodas", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["both"] },
      { name: "Laka Lono Rum Club", type: "tiki-bar", vibe: "balanced", priceRange: "$$$", highlight: "Hidden Old Market tiki bar with flaming cocktails", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Wicked Rabbit", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Hidden behind a swinging liquor-store shelf next to Hotel Deco", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Le Bouillon", cuisine: "French", priceRange: "$$$", highlight: "Rural French in a restored Old Market warehouse", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Brickway Brewery & Distillery", cuisine: "Gastropub", priceRange: "$$", highlight: "Old Market brewery + distillery making gin, bourbon, rum", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Ted & Wally's", cuisine: "Dessert", priceRange: "$", highlight: "Old Market homemade ice cream institution", bestFor: "late-night treat", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Old Market cobblestone bar crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [45,95], groupMin: 4, groupMax: 16, highlight: "Historic warehouse district packed with bars + speakeasies", bestFor: "first night", brands: ["both"] },
      { name: "Brickway brewery + distillery tour", type: "distillery-tour", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 14, highlight: "Beer and spirits flight under one Old Market roof", bestFor: "first day", brands: ["both"] },
      { name: "Bob Kerrey pedestrian bridge + Missouri riverfront stroll", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 16, highlight: "Stand in two states at once over the Missouri River", bestFor: "afternoon photos", brands: ["both"] },
      { name: "Henry Doorly Zoo day", type: "tour", duration: "3 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Top-ranked zoo with the indoor Desert Dome + rainforest", bestFor: "daytime", brands: ["both"] },
      { name: "Missouri River sunset cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [40,85], groupMin: 6, groupMax: 30, highlight: "River Capital paddler with downtown skyline at dusk", bestFor: "first night", brands: ["both"] },
      { name: "Old Market cocktail-class afternoon", type: "cocktail-class", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Learn to build classics with a Berry & Rye-trained bartender", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "60+ Club axe-throwing + sports", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 16, highlight: "Downtown axe lanes with a full bar", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Deco", type: "boutique-hotel", pricePerNight: [180,320], perRoom: true, maxGuests: 2, highlight: "Art-deco landmark with Wicked Rabbit hidden behind it" },
      { name: "Old Market loft", type: "airbnb", pricePerNight: [350,700], perRoom: false, maxGuests: 12, highlight: "Exposed-brick warehouse loft above the bars" },
    ],
    transport: [{ name: "Omaha party bus", type: "party-bus", priceRange: "$140-$320/group", highlight: "Old Market loop + brewery runs with a driver" }],
    presentation: {
      moh: { tagline: "Cobblestone speakeasies + a riverfront skyline", description: "Omaha's Old Market is the surprise of the Midwest: cobblestone streets, a tiki bar with cocktails on fire, and a speakeasy behind a swinging liquor-store shelf. The riverfront and a world-class zoo handle the daytime." },
      bestman: { tagline: "Old Market crawl, brewery-distillery, and a bridge in two states", description: "Omaha punches way above its size. The Old Market is a dense crawl of breweries and hidden bars, Brickway pours beer and spirits in one stop, and the Bob Kerrey bridge puts you in two states at once for the group photo." },
    } },

  // 4 — Lincoln, NE
  { id: "lincoln-ne", city: "Lincoln", state: "NE", region: "midwest",
    nearestAirport: { code: "LNK", name: "Lincoln Airport", driveMinutes: 10 },
    bestMonths: [5,6,7,8,9,10], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "The Other Room", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Hidden Haymarket speakeasy with off-menu craft cocktails", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["both"] },
      { name: "Tipsy Tina's Cantina", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Colorful patio cantina with house-blended cocktails + tacos", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Starlite", type: "bar", vibe: "unhinged", priceRange: "$", highlight: "Retro Haymarket bar that gets loud on weekends", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Lazlo's Brewery & Grill", cuisine: "Gastropub", priceRange: "$$", highlight: "Nebraska's oldest brewpub in the Haymarket", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Blue Sushi Sake Grill", cuisine: "Sushi", priceRange: "$$$", highlight: "Inventive rolls + sake for a group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Oven", cuisine: "Indian", priceRange: "$$", highlight: "Haymarket institution for tandoor and curries", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Historic Haymarket bar crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 16, highlight: "Brick-street district of bars, rooftops, and breweries", bestFor: "first night", brands: ["both"] },
      { name: "Kinkaider Brewing taproom tour", type: "brewery-tour", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 14, highlight: "Nebraska craft beer with a Haymarket taproom", bestFor: "first day", brands: ["both"] },
      { name: "Sunken Gardens + Pioneers Park stroll", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 16, highlight: "Terraced flower gardens — a top free photo spot", bestFor: "afternoon photos", brands: ["both"] },
      { name: "Mana board-game café afternoon", type: "tour", duration: "2 hr", pricePerPerson: [15,40], groupMin: 4, groupMax: 14, highlight: "1,100+ games + full menu and bar in the Haymarket", bestFor: "afternoon downtime", brands: ["both"] },
      { name: "Escape Lincoln room challenge", type: "escape-room", duration: "1 hr", pricePerPerson: [30,40], groupMin: 4, groupMax: 12, highlight: "Themed escape rooms built for groups", bestFor: "afternoon", brands: ["both"] },
      { name: "Haymarket cocktail-making class", type: "cocktail-class", duration: "2 hr", pricePerPerson: [50,90], groupMin: 4, groupMax: 12, highlight: "Hands-on session with bubbles included", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Tomahawks axe-throwing lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Group axe lanes in the heart of the Haymarket", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Graduate Lincoln", type: "boutique-hotel", pricePerNight: [160,290], perRoom: true, maxGuests: 2, highlight: "Husker-themed boutique hotel on the edge of the Haymarket" },
      { name: "Haymarket loft", type: "airbnb", pricePerNight: [300,580], perRoom: false, maxGuests: 10, highlight: "Brick-warehouse loft walkable to every bar" },
    ],
    transport: [{ name: "Lincoln group shuttle", type: "shuttle", priceRange: "$90-$200/group", highlight: "Haymarket + brewery loop with late pickup" }],
    presentation: {
      moh: { tagline: "Brick streets, hidden speakeasies, and flower gardens", description: "Lincoln's Historic Haymarket is a romantic brick-street district with a hidden speakeasy, a colorful taco cantina, and a board-game café for the downtime. The Sunken Gardens make the photo album." },
      bestman: { tagline: "Haymarket crawl + breweries + Husker red", description: "Lincoln's Haymarket keeps a crew busy: a hidden cocktail speakeasy, Nebraska's oldest brewpub, axe lanes, and an escape room, all on brick streets you can walk between. Game-day Lincoln turns it up to eleven." },
    } },

  // 5 — Wichita, KS
  { id: "wichita-ks", city: "Wichita", state: "KS", region: "midwest",
    nearestAirport: { code: "ICT", name: "Wichita Eisenhower National", driveMinutes: 15 },
    bestMonths: [4,5,6,9,10], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Walker's Jazz Lounge", type: "lounge", vibe: "balanced", priceRange: "$$$", highlight: "Handcrafted cocktails + live jazz in Old Town", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Mort's Martini & Cigar Bar", type: "cocktail-bar", vibe: "balanced", priceRange: "$$", highlight: "Old Town martini-and-cigar staple with live acts", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Brickyard", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Live-music courtyard bar that anchors Old Town nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Larkspur Bistro & Bar", cuisine: "American bistro", priceRange: "$$$", highlight: "Old Town's reliable group-dinner bistro", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Nortons Brewing Co.", cuisine: "Gastropub", priceRange: "$$", highlight: "Old Town brewery + scratch kitchen", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Old Mill Tasty Shop", cuisine: "Diner / brunch", priceRange: "$", highlight: "1930s soda fountain for hangover brunch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Old Town bar crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 16, highlight: "100+ businesses in converted brick warehouses", bestFor: "first night", brands: ["both"] },
      { name: "River City Brewing taproom tour", type: "brewery-tour", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 14, highlight: "Wichita's original brewpub + flight", bestFor: "first day", brands: ["both"] },
      { name: "Arkansas River + Keeper of the Plains walk", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 16, highlight: "44-ft riverfront statue with a nightly ring of fire", bestFor: "sunset photos", brands: ["both"] },
      { name: "Botanica gardens stroll", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [10,25], groupMin: 2, groupMax: 16, highlight: "30+ themed gardens for a slower afternoon", bestFor: "afternoon", brands: ["both"] },
      { name: "Arkansas River kayak paddle", type: "kayaking", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 12, highlight: "Paddle past the Keeper of the Plains", bestFor: "active morning", brands: ["both"] },
      { name: "Old Town cocktail class", type: "cocktail-class", duration: "2 hr", pricePerPerson: [50,90], groupMin: 4, groupMax: 12, highlight: "Mixing class with bubbles in a warehouse loft", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Kiss My Axe throwing lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Old Town axe lanes built for groups", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel at Old Town", type: "boutique-hotel", pricePerNight: [160,280], perRoom: true, maxGuests: 2, highlight: "All-suite historic hotel in the middle of the nightlife district" },
      { name: "Old Town warehouse loft", type: "airbnb", pricePerNight: [280,520], perRoom: false, maxGuests: 10, highlight: "Brick loft steps from the bars" },
    ],
    transport: [{ name: "Wichita party shuttle", type: "shuttle", priceRange: "$100-$220/group", highlight: "Old Town loop + brewery runs" }],
    presentation: {
      moh: { tagline: "Old Town brick + jazz + the Keeper of the Plains", description: "Wichita's Old Town is 100+ venues in converted warehouses — a jazz lounge, a martini bar, and live-music courtyards all walkable. Cap a night at the Keeper of the Plains for the riverfront ring of fire." },
      bestman: { tagline: "Old Town crawl, breweries, and axe lanes", description: "Wichita's Old Town is a dense brick playground: breweries, a cigar-and-martini bar, live music, and axe lanes within a few blocks, plus river paddling to clear the heads in the morning." },
    } },

  // 6 — Overland Park, KS
  { id: "overland-park-ks", city: "Overland Park", state: "KS", region: "midwest",
    nearestAirport: { code: "MCI", name: "Kansas City Intl", driveMinutes: 35 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 5,
    nightlife: [
      { name: "Vintage '78 Wine Bar", type: "wine-bar", vibe: "balanced", priceRange: "$$$", highlight: "Downtown OP wine bar with elevated small plates", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Brew Lab", type: "taproom", vibe: "chill", priceRange: "$$", highlight: "Downtown OP taproom + shareable plates", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Maloney's Sports Bar & Grill", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Rooftop + heated patios in downtown OP", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Peanut", cuisine: "American pub", priceRange: "$", highlight: "Downtown OP wings-and-burgers staple since 1981", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Discourse Brewing", cuisine: "Gastropub", priceRange: "$$", highlight: "Sleek modern taproom in north OP", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Vintage '78", cuisine: "Modern American", priceRange: "$$$", highlight: "American classics paired to the wine list", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Downtown OP wine + taproom crawl", type: "brunch-crawl", duration: "2.5 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Walkable strip of wine bars and taprooms", bestFor: "first night", brands: ["both"] },
      { name: "Discourse Brewing tour + flight", type: "brewery-tour", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 14, highlight: "Modern brewhouse tour and tasting", bestFor: "first day", brands: ["both"] },
      { name: "Andretti Indoor Karting", type: "go-karts", duration: "2 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 16, highlight: "Electric karts, laser tag, VR, and full bars", bestFor: "competitive afternoon", brands: ["both"] },
      { name: "Aubrey Vineyards wine tasting", type: "wine-tour", duration: "2.5 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 14, highlight: "Southern OP winery on rolling vines", bestFor: "afternoon", brands: ["both"] },
      { name: "Arboretum & Botanical Gardens stroll", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [5,20], groupMin: 2, groupMax: 16, highlight: "300 acres of gardens and trails for a slow morning", bestFor: "afternoon", brands: ["both"] },
      { name: "Craft Putt mini-golf + cocktails", type: "cocktail-class", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 16, highlight: "Indoor mini-golf taphouse with cocktails and small plates", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Dave & Buster's games night", type: "sports-event", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 16, highlight: "Wall-to-wall games + big-screen sports + full bar", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "AC Hotel Overland Park", type: "hotel", pricePerNight: [150,260], perRoom: true, maxGuests: 2, highlight: "Modern hotel near the downtown OP bars" },
      { name: "Suburban group rental", type: "airbnb", pricePerNight: [300,600], perRoom: false, maxGuests: 12, highlight: "Big house with room to spread out, close to KC" },
    ],
    transport: [{ name: "OP / KC party shuttle", type: "shuttle", priceRange: "$120-$280/group", highlight: "Downtown OP loop + runs into Kansas City" }],
    presentation: {
      moh: { tagline: "The easy KC-metro home base", description: "Overland Park is the relaxed-luxury side of the Kansas City metro — a walkable downtown of wine bars and taprooms, a sprawling arboretum, and a vineyard, with all of KC twenty minutes away when you want more." },
      bestman: { tagline: "Karting, taprooms, and KC on tap", description: "Overland Park makes a sane base camp: indoor karting and laser tag, modern breweries, a sports-bar rooftop, and a fifteen-minute hop into Kansas City's full slate when the night needs more." },
    } },

  // 7 — Fargo, ND
  { id: "fargo-nd", city: "Fargo", state: "ND", region: "midwest",
    nearestAirport: { code: "FAR", name: "Hector Intl", driveMinutes: 10 },
    bestMonths: [5,6,7,8,9], vibes: ["balanced","unhinged"], score: 5,
    nightlife: [
      { name: "District 64", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Two-level Broadway bar with a weekend dance floor", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Blarney Stone Pub", type: "pub", vibe: "balanced", priceRange: "$$", highlight: "Cocktails at the Hotel Donaldson on Broadway", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Cowboy Jack's", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Downtown saloon dance bar that gets rowdy", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Mezzaluna", cuisine: "Modern American", priceRange: "$$$", highlight: "Downtown Fargo's top fine-dining cocktail room", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Wurst Bier Hall", cuisine: "German gastropub", priceRange: "$$", highlight: "40+ taps + sausages in a big communal hall", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "84 Italian Steakhouse", cuisine: "Italian steakhouse", priceRange: "$$$", highlight: "Steaks, pasta, and a strong cocktail list downtown", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Broadway bar crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 16, highlight: "Downtown Broadway packed with bars, dance floors, and taprooms", bestFor: "first night", brands: ["both"] },
      { name: "Drekker Brewing brewhall tour", type: "brewery-tour", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 14, highlight: "Sprawling Brewhalla taproom + flight", bestFor: "first day", brands: ["both"] },
      { name: "Vikre / Proof distillery tasting", type: "distillery-tour", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 12, highlight: "Regional craft spirits flight downtown", bestFor: "first day", brands: ["both"] },
      { name: "Broadway pedicab + downtown stroll", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [10,30], groupMin: 2, groupMax: 14, highlight: "Broadway Rickshaw pedicabs + shops and murals", bestFor: "afternoon", brands: ["both"] },
      { name: "Red River kayak paddle", type: "kayaking", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 12, highlight: "Paddle the river that splits Fargo and Moorhead", bestFor: "active morning", brands: ["both"] },
      { name: "Unglued craft + cocktail workshop", type: "candle-making", duration: "2 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 12, highlight: "Make-and-take craft studio downtown with bubbles", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Fargo Brewing axe + taproom afternoon", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Axe lanes plus the city's flagship brewery", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Donaldson (The HoDo)", type: "boutique-hotel", pricePerNight: [180,320], perRoom: true, maxGuests: 2, highlight: "Artist-themed boutique rooms over the Blarney Stone on Broadway" },
      { name: "Downtown Broadway loft", type: "airbnb", pricePerNight: [250,500], perRoom: false, maxGuests: 10, highlight: "Walk to every Broadway bar" },
    ],
    transport: [{ name: "Fargo party shuttle", type: "shuttle", priceRange: "$100-$220/group", highlight: "Broadway loop + brewery runs with late pickup" }],
    presentation: {
      moh: { tagline: "Broadway nights + a surprisingly good cocktail scene", description: "Fargo is the friendliest party town nobody expects. Broadway is a walkable strip of dance bars, taprooms, and a top-rated cocktail room, with craft distilleries and make-and-take craft studios for the daytime." },
      bestman: { tagline: "Broadway crawl, breweries, and a beer hall with 40 taps", description: "Fargo keeps it cheap, friendly, and loud. Broadway packs dance bars and a 40-tap beer hall into a few blocks, Drekker's Brewhalla is a destination, and axe lanes handle the daytime." },
    } },

  // 8 — Madison, WI
  { id: "madison-wi", city: "Madison", state: "WI", region: "midwest",
    nearestAirport: { code: "MSN", name: "Dane County Regional", driveMinutes: 15 },
    bestMonths: [5,6,7,8,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "The Robin Room", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Craft cocktails, slushies, and a huge mezcal list", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Eno Vino Rooftop", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "AC Hotel rooftop with Capitol-dome views", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Kollege Klub", type: "bar", vibe: "unhinged", priceRange: "$", highlight: "Legendary State Street basement college bar", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "The Old Fashioned", cuisine: "Wisconsin supper club", priceRange: "$$", highlight: "Cheese curds, brandy old-fashioneds, and 150+ beers on the Square", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Sardine", cuisine: "French / seafood", priceRange: "$$$", highlight: "Lake Monona oysters and a perfect dry martini", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Graze", cuisine: "Brunch / American", priceRange: "$$", highlight: "Capitol-view brunch from the L'Etoile team", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "State Street to Capitol Square crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [40,95], groupMin: 4, groupMax: 16, highlight: "Pedestrian State Street flows straight into Capitol Square bars", bestFor: "first night", brands: ["both"] },
      { name: "Lake Mendota pontoon party cruise", type: "boat-cruise", duration: "3 hr", pricePerPerson: [55,110], groupMin: 6, groupMax: 20, highlight: "Captained pontoon with a cooler and a swim stop", bestFor: "first day", brands: ["both"] },
      { name: "Dane County Farmers' Market food tour", type: "food-tour", duration: "2.5 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "The country's largest producer-only market circling the Capitol", bestFor: "Saturday brunch", brands: ["both"] },
      { name: "Working Draft / Karben4 brewery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [55,120], groupMin: 4, groupMax: 14, highlight: "Atwood + east-side taprooms with a driver", bestFor: "afternoon", brands: ["both"] },
      { name: "Memorial Union Terrace + kayak the lakes", type: "kayaking", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 12, highlight: "Iconic sunburst-chair terrace then paddle Lake Mendota", bestFor: "active morning", brands: ["both"] },
      { name: "Capitol Square cocktail + slushie class", type: "cocktail-class", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Build craft cocktails and boozy slushies with a Robin Room pro", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Axe & Arrow throwing lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Group axe lanes with local beer", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "AC Hotel Madison Downtown", type: "hotel", pricePerNight: [180,330], perRoom: true, maxGuests: 2, highlight: "Eno Vino rooftop on top + steps from State Street" },
      { name: "Isthmus lake-view rental", type: "airbnb", pricePerNight: [400,800], perRoom: false, maxGuests: 12, highlight: "Between Mendota and Monona, walkable downtown" },
    ],
    transport: [{ name: "Madison party trolley", type: "party-bus", priceRange: "$150-$320/group", highlight: "State Street + east-side brewery loop" }],
    presentation: {
      moh: { tagline: "Lakes, State Street, and Capitol-Square cocktails", description: "Madison sits on an isthmus between two lakes with a pedestrian State Street that pours straight into Capitol Square. Pontoon the lake by day, hit a craft-cocktail room and the country's best farmers' market, and never need a car." },
      bestman: { tagline: "Lake pontoon + brewery crawl + State Street", description: "Madison is a college town that grew up well: lake pontoons with a cooler, an east-side brewery crawl, supper-club old-fashioneds, and a walkable State Street that runs from the lake to the Capitol." },
    } },

  // 9 — Lake Geneva, WI
  { id: "lake-geneva-wi", city: "Lake Geneva", state: "WI", region: "midwest",
    nearestAirport: { code: "MKE", name: "Milwaukee Mitchell Intl", driveMinutes: 60 },
    bestMonths: [5,6,7,8,9], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Maxwell Mansion Apothecary Bar", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Speakeasy-style craft cocktails in a historic mansion", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Barrique Wine Bar", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "Intimate wine bar + small plates", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Geneva Tap House", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Big craft-beer list + casual late-night hang", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Pier 290", cuisine: "American / seafood", priceRange: "$$$", highlight: "Lakeside dining on the water in Williams Bay", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Geneva Chophouse", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "Prime steaks at the Grand Geneva Resort", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mars Resort", cuisine: "Wisconsin supper club", priceRange: "$$", highlight: "Classic lakeside supper club with comfort food", bestFor: "first night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Lake Geneva cocktail cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [45,95], groupMin: 6, groupMax: 30, highlight: "Vintage tour boat past mansions with drinks at sunset", bestFor: "first night", brands: ["both"] },
      { name: "Private speedboat charter", type: "boat-cruise", duration: "3 hr", pricePerPerson: [70,160], groupMin: 4, groupMax: 12, highlight: "Charter the lake for tubing and mansion-row views", bestFor: "first day", brands: ["both"] },
      { name: "Geneva Lake Shore Path walk", type: "hiking", duration: "2 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 16, highlight: "21-mile public path past Gilded-Age estates", bestFor: "morning", brands: ["both"] },
      { name: "Stand-up paddleboard + lake swim", type: "kayaking", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 12, highlight: "SUP and kayak rentals on the public beach", bestFor: "active morning", brands: ["both"] },
      { name: "Lake-area winery + cidery tasting", type: "wine-tour", duration: "3 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 14, highlight: "Studio Winery + regional tasting room loop", bestFor: "afternoon", brands: ["both"] },
      { name: "Well Spa at Grand Geneva day", type: "spa", duration: "4 hr", pricePerPerson: [180,400], groupMin: 2, groupMax: 8, highlight: "Resort spa with bridal packages + relaxation lounge", bestFor: "recovery day", brands: ["moh"] },
      { name: "Grand Geneva golf round", type: "golf", duration: "5 hr", pricePerPerson: [90,200], groupMin: 4, groupMax: 12, highlight: "The Brute and Highlands courses at the resort", bestFor: "morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Grand Geneva Resort & Spa", type: "resort", pricePerNight: [260,520], perRoom: true, maxGuests: 2, highlight: "Full resort — spa, golf, restaurants, indoor waterpark" },
      { name: "The Abbey Resort", type: "resort", pricePerNight: [240,480], perRoom: true, maxGuests: 2, highlight: "Only full-service lakefront resort + 35,000-sq-ft Avani Spa" },
      { name: "Lakefront rental house", type: "house", pricePerNight: [700,1600], perRoom: false, maxGuests: 14, highlight: "Private dock + hot tub on Geneva Lake" },
    ],
    transport: [{ name: "Lake Geneva charter van", type: "charter", priceRange: "$150-$320/group", highlight: "Winery loops + Milwaukee/Chicago airport runs" }],
    presentation: {
      moh: { tagline: "Gilded-Age lake town built for a girls' weekend", description: "Lake Geneva is the Midwest's Hamptons: a cocktail cruise past Gilded-Age mansions, a 35,000-square-foot resort spa, a speakeasy in a historic mansion, and a 21-mile shore path. Equal parts pamper and play." },
      bestman: { tagline: "Boat charters, golf, and resort downtime", description: "Lake Geneva is the easy lake weekend from Chicago or Milwaukee: charter a speedboat for tubing, play the Grand Geneva's courses, and land at a supper club, all an hour from two airports." },
    } },

  // 10 — Wisconsin Dells, WI
  { id: "wisconsin-dells-wi", city: "Wisconsin Dells", state: "WI", region: "midwest",
    nearestAirport: { code: "MSN", name: "Dane County Regional (Madison)", driveMinutes: 60 },
    bestMonths: [5,6,7,8,9], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Old Time Saloon & Grill", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Lively main-strip saloon, a bachelorette-party magnet", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Asgard Axe & Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "14 axe lanes + 24 craft taps + arcade under one roof", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Showboat Saloon", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Downtown live-music bar that runs late", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "The Boathouse", cuisine: "American / seafood", priceRange: "$$$", highlight: "Wood-fired upscale-casual on the river", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Hot Rocks", cuisine: "Steakhouse", priceRange: "$$$", highlight: "Cook-your-own lava-stone steaks", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "High Rock Café", cuisine: "American bistro", priceRange: "$$", highlight: "Downtown bistro for a calmer dinner", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Dells jet boat thrill ride", type: "boat-cruise", duration: "1 hr", pricePerPerson: [35,70], groupMin: 4, groupMax: 16, highlight: "High-speed spins through the Lower Dells rock formations", bestFor: "first day", brands: ["both"] },
      { name: "Upper Dells scenic river tour", type: "boat-cruise", duration: "2 hr", pricePerPerson: [35,65], groupMin: 4, groupMax: 30, highlight: "Sandstone cliffs and landings on the Wisconsin River", bestFor: "afternoon", brands: ["both"] },
      { name: "WWII Duck amphibious tour", type: "tour", duration: "1 hr", pricePerPerson: [30,55], groupMin: 4, groupMax: 20, highlight: "Land-and-water ride in restored WWII DUKWs", bestFor: "daytime", brands: ["both"] },
      { name: "Kalahari indoor + outdoor waterpark day", type: "pool-party", duration: "4 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 16, highlight: "Wisconsin's largest waterpark + swim-up bar", bestFor: "daytime", brands: ["both"] },
      { name: "Dells ATV / UTV trail excursion", type: "atv", duration: "3 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 12, highlight: "Guided off-road run through the river country", bestFor: "active afternoon", brands: ["both"] },
      { name: "Sundara resort spa day", type: "spa", duration: "4 hr", pricePerPerson: [200,420], groupMin: 2, groupMax: 8, highlight: "Pine-forest destination spa with a Purification Ritual", bestFor: "recovery day", brands: ["moh"] },
      { name: "Asgard axe-throwing tournament", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "14 lanes + craft beer + arcade", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Sundara Inn & Spa", type: "resort", pricePerNight: [320,600], perRoom: true, maxGuests: 2, highlight: "Adults-only pine-forest spa resort for the calmer crew" },
      { name: "Kalahari Resort", type: "resort", pricePerNight: [220,460], perRoom: true, maxGuests: 4, highlight: "Massive indoor waterpark + suites that sleep big groups" },
      { name: "River-country rental house", type: "house", pricePerNight: [500,1200], perRoom: false, maxGuests: 16, highlight: "Big group house near the strip with a hot tub" },
    ],
    transport: [{ name: "Dells group shuttle", type: "shuttle", priceRange: "$120-$280/group", highlight: "Strip + waterpark + boat-tour loop" }],
    presentation: {
      moh: { tagline: "Waterparks by day, spa-and-strip by night", description: "Wisconsin Dells is unapologetic fun: a jet-boat thrill ride and the country's biggest waterpark by day, an adults-only forest spa to recover, and a main strip that's been hosting bachelorette parties for decades." },
      bestman: { tagline: "Jet boats, ATVs, axe lanes, and a waterpark", description: "The Dells is a Midwest sampler platter for a guys' weekend: jet-boat spins through the rock formations, ATV trails, 14 axe lanes with craft beer, and Kalahari's waterpark to nurse the hangover." },
    } },

  // 11 — Traverse City, MI
  { id: "traverse-city-mi", city: "Traverse City", state: "MI", region: "midwest",
    nearestAirport: { code: "TVC", name: "Cherry Capital", driveMinutes: 10 },
    bestMonths: [6,7,8,9,10], vibes: ["chill","balanced"], score: 8,
    nightlife: [
      { name: "Low Bar", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Vintage basement speakeasy beneath 7 Monks", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "7 Monks Taproom", type: "taproom", vibe: "balanced", priceRange: "$$", highlight: "Heart-of-downtown taphouse with a deep tap wall", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Parlor", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Old-fashioned craft cocktails in a historic train weigh station + live music", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Firefly", cuisine: "Sushi / fondue", priceRange: "$$$", highlight: "Sushi and fondue plates a half-mile from downtown", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Apache Trout Grill", cuisine: "American / seafood", priceRange: "$$$", highlight: "Waterfront dining on Grand Traverse Bay", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Towne Plaza", cuisine: "Modern American", priceRange: "$$", highlight: "Downtown brunch + patio for big groups", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Old Mission / Leelanau wine tour", type: "wine-tour", duration: "5 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 14, highlight: "40+ wineries on the 45th parallel with a driver", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Nauti-Cat sunset champagne sail", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [49,95], groupMin: 6, groupMax: 24, highlight: "Catamaran cruise on Grand Traverse Bay", bestFor: "first night", brands: ["both"] },
      { name: "Cycle Pub pedal-bar tour", type: "brunch-crawl", duration: "2 hr", pricePerPerson: [40,75], groupMin: 6, groupMax: 14, highlight: "Pedal-powered group bar tour through downtown", bestFor: "afternoon", brands: ["both"] },
      { name: "Sleeping Bear Dunes day trip", type: "hiking", duration: "4 hr", pricePerPerson: [25,60], groupMin: 4, groupMax: 14, highlight: "National Lakeshore dune climb + Lake Michigan overlooks", bestFor: "active day", brands: ["both"] },
      { name: "Grand Traverse Bay paddle + beach day", type: "kayaking", duration: "2 hr", pricePerPerson: [30,65], groupMin: 4, groupMax: 12, highlight: "Clear-water kayak and SUP off Clinch Park Beach", bestFor: "active morning", brands: ["both"] },
      { name: "Old Mission lavender + flower-crown afternoon", type: "flower-crown", duration: "2 hr", pricePerPerson: [55,100], groupMin: 4, groupMax: 14, highlight: "Lavender-farm workshop with bubbles on the peninsula", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Brewery + distillery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [55,120], groupMin: 4, groupMax: 14, highlight: "Downtown taprooms + Hop Lot in Suttons Bay", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Delamar Traverse City", type: "boutique-hotel", pricePerNight: [280,520], perRoom: true, maxGuests: 2, highlight: "Bayfront boutique hotel + private beach" },
      { name: "Old Mission Peninsula rental", type: "house", pricePerNight: [600,1400], perRoom: false, maxGuests: 14, highlight: "Vineyard-country house with a bay view + hot tub" },
    ],
    transport: [{ name: "Grand Traverse wine-tour van", type: "charter", priceRange: "$150-$340/group", highlight: "Winery loops on both peninsulas, driver included" }],
    presentation: {
      moh: { tagline: "Michigan wine country on the 45th parallel", description: "Traverse City is the Midwest's quiet wine-country answer — 40+ wineries on two peninsulas, a champagne catamaran sail, clear-water beaches, and a downtown speakeasy. The bachelorette town the coasts haven't ruined yet." },
      bestman: { tagline: "Wine + brewery crawls, dunes, and the bay", description: "Traverse City balances out a weekend: a winery tour by van, a brewery crawl, the Sleeping Bear dune climb, and a sunset sail on Grand Traverse Bay, all from a walkable downtown." },
    } },

  // 12 — Grand Rapids, MI
  { id: "grand-rapids-mi", city: "Grand Rapids", state: "MI", region: "midwest",
    nearestAirport: { code: "GRR", name: "Gerald R. Ford Intl", driveMinutes: 20 },
    bestMonths: [5,6,7,8,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Buffalo Traders Lounge", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Plant-filled downtown craft-cocktail lounge", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The B.O.B.", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Big Old Building — brewery, comedy, and a nightclub under one roof", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Mojo's Dueling Piano Bar", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Dueling pianos + sing-alongs, a bachelorette favorite", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"] },
    ],
    dining: [
      { name: "Founders Brewing Co.", cuisine: "Gastropub", priceRange: "$$", highlight: "Flagship taproom of one of America's best breweries", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "SideBar", cuisine: "Modern American", priceRange: "$$$", highlight: "Seasonal plates + bespoke cocktails downtown", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Stella's Lounge", cuisine: "Burgers", priceRange: "$$", highlight: "Cult burgers + 200+ whiskeys + arcade", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Beer City Ale Trail crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [55,120], groupMin: 4, groupMax: 14, highlight: "35+ breweries — repeated USA Today Best Beer City", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Long Road Distillers tasting", type: "distillery-tour", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 12, highlight: "West-side craft spirits flight + cocktails", bestFor: "afternoon", brands: ["both"] },
      { name: "Grand River kayak paddle", type: "kayaking", duration: "2 hr", pricePerPerson: [30,60], groupMin: 4, groupMax: 12, highlight: "Paddle through downtown on the Grand", bestFor: "active morning", brands: ["both"] },
      { name: "Frederik Meijer Gardens + Sculpture Park", type: "walking-tour", duration: "2 hr", pricePerPerson: [20,40], groupMin: 2, groupMax: 16, highlight: "158-acre gardens with a tropical conservatory + blue-chip sculpture", bestFor: "afternoon", brands: ["both"] },
      { name: "Downtown Market food tour", type: "food-tour", duration: "2.5 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "Indoor market hall with 20+ vendors and a rooftop", bestFor: "Saturday brunch", brands: ["both"] },
      { name: "West-side cocktail class", type: "cocktail-class", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Build craft cocktails with a Buffalo Traders bartender", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "AXE GR throwing lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Downtown axe lanes + local beer", bestFor: "competitive afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Mertens", type: "boutique-hotel", pricePerNight: [200,360], perRoom: true, maxGuests: 2, highlight: "1920s landmark boutique hotel with a brasserie" },
      { name: "Heritage Hill historic rental", type: "house", pricePerNight: [350,750], perRoom: false, maxGuests: 12, highlight: "Big Victorian near downtown breweries" },
    ],
    transport: [{ name: "Grand Rapids brewery shuttle", type: "shuttle", priceRange: "$130-$300/group", highlight: "Ale Trail loop + west-side distilleries" }],
    presentation: {
      moh: { tagline: "Beer City with a real cocktail-and-gardens side", description: "Grand Rapids is more than beer (though it's the repeat Best Beer City): plant-filled cocktail lounges, dueling pianos, a 158-acre sculpture garden, and a downtown food hall. The polished Michigan weekend." },
      bestman: { tagline: "Beer City USA — 35+ breweries, walkable", description: "Grand Rapids is the brewery-crawl capital of the Midwest: 35+ breweries on the Ale Trail, the B.O.B.'s multi-floor chaos, Stella's burgers and 200 whiskeys, and axe lanes between rounds." },
    } },

  // 13 — Sandusky, OH
  { id: "sandusky-oh", city: "Sandusky", state: "OH", region: "midwest",
    nearestAirport: { code: "CLE", name: "Cleveland Hopkins Intl", driveMinutes: 60 },
    bestMonths: [6,7,8,9], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Volstead Bar", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Prohibition-era speakeasy in the historic Green Door building", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Paddle Bar", type: "tiki-bar", vibe: "balanced", priceRange: "$$", highlight: "Waterfront tiki bar on Sandusky Bay, 5 min from Cedar Point", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Small City Taphouse", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Downtown taphouse + late-night kitchen", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Crush Wine Bar", cuisine: "Small plates / wine", priceRange: "$$$", highlight: "Downtown wine bar with shareable plates", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "DeMore's Fish Den", cuisine: "Seafood", priceRange: "$$", highlight: "Lake Erie perch and walleye, the local move", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Small City Taphouse", cuisine: "Gastropub", priceRange: "$$", highlight: "Burgers + craft beer for the first night", bestFor: "first night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Cedar Point coaster day", type: "adventure-park", duration: "6 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 16, highlight: "17 world-class coasters on a Lake Erie peninsula", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Put-in-Bay island ferry day", type: "boat-cruise", duration: "5 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 16, highlight: "Jet Express to Ohio's biggest island party town", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Sandusky Bay sunset cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [40,80], groupMin: 6, groupMax: 24, highlight: "Bay cruise with Cedar Point's skyline at dusk", bestFor: "first night", brands: ["both"] },
      { name: "Lake Erie wine-shore tasting", type: "wine-tour", duration: "4 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 14, highlight: "20+ shoreline wineries — Rieslings + ice wines", bestFor: "afternoon", brands: ["both"] },
      { name: "Kelleys Island bike + beach day", type: "biking", duration: "4 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 14, highlight: "Quieter island — glacial grooves, trails, and quarry swims", bestFor: "active day", brands: ["both"] },
      { name: "Put-in-Bay swim platform + bachelorette boat day", type: "boat-cruise", duration: "4 hr", pricePerPerson: [80,160], groupMin: 6, groupMax: 16, highlight: "Charter boat to the islands with a cooler", bestFor: "party day", brands: ["moh"] },
      { name: "Cedar Point Shores waterpark + swim-up bar", type: "pool-party", duration: "4 hr", pricePerPerson: [50,95], groupMin: 4, groupMax: 16, highlight: "Lake-side waterpark with a swim-up bar", bestFor: "recovery day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Cedar Point's Hotel Breakers", type: "resort", pricePerNight: [220,460], perRoom: true, maxGuests: 4, highlight: "Beachfront resort steps from the coaster gates" },
      { name: "Sandusky Bay rental house", type: "house", pricePerNight: [400,950], perRoom: false, maxGuests: 14, highlight: "Bayfront house with a dock near downtown" },
    ],
    transport: [{ name: "Sandusky islands shuttle + ferry combo", type: "shuttle", priceRange: "$130-$300/group", highlight: "Downtown to ferry docks + Cedar Point loop" }],
    presentation: {
      moh: { tagline: "Lake Erie islands, coasters, and a speakeasy", description: "Sandusky pairs Cedar Point's coasters with Lake Erie island-hopping: a charter boat to Put-in-Bay, a sunset bay cruise, shoreline wineries, and a Prohibition-era speakeasy back downtown." },
      bestman: { tagline: "Cedar Point + Put-in-Bay party islands", description: "Sandusky is a one-two punch: ride the best coasters in the country at Cedar Point, then ferry out to Put-in-Bay's island bars. A waterfront tiki bar and a bay swim platform fill the rest." },
    } },

  // 14 — St. Paul, MN
  { id: "st-paul-mn", city: "St. Paul", state: "MN", region: "midwest",
    nearestAirport: { code: "MSP", name: "Minneapolis-St. Paul Intl", driveMinutes: 15 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Flora Room", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Plant-drenched speakeasy off the Porzana steakhouse", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["both"] },
      { name: "CrowBar", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Tasting room for women-owned Voliere Spirits, distilled on site", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Amsterdam Bar & Hall", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Belgian beers + live music in a downtown hall", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Parlour St. Paul", cuisine: "Burgers / cocktails", priceRange: "$$", highlight: "Best burger in the Twin Cities + boozy malts", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "The Commodore Bar & Restaurant", cuisine: "Supper club", priceRange: "$$$", highlight: "Art-deco room Fitzgerald drank in — a destination group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mickey's Diner", cuisine: "Diner", priceRange: "$", highlight: "Iconic 24-hour rail-car diner for late-night and brunch", bestFor: "late night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Mississippi riverboat cruise", type: "boat-cruise", duration: "2 hr", pricePerPerson: [40,90], groupMin: 6, groupMax: 30, highlight: "Padelford paddlewheeler from Harriet Island", bestFor: "first day", brands: ["both"] },
      { name: "Cathedral Hill + Summit Avenue walk", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,25], groupMin: 2, groupMax: 16, highlight: "America's longest stretch of Victorian mansions", bestFor: "afternoon", brands: ["both"] },
      { name: "St. Paul brewery + distillery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 14, highlight: "Bad Weather + 7th-street taprooms with a driver", bestFor: "afternoon", brands: ["both"] },
      { name: "Como Park conservatory + lakeside stroll", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 16, highlight: "Free glass conservatory + Lake Como path", bestFor: "morning", brands: ["both"] },
      { name: "Camp Bar cabaret + drag-brunch night", type: "drag-brunch", duration: "2 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "Cocktails + cabaret performances downtown", bestFor: "afternoon", brands: ["moh"] },
      { name: "Voliere distilling cocktail class", type: "cocktail-class", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Mix with small-batch spirits at the women-owned distillery", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Twins or Wild game night", type: "sports-event", duration: "3 hr", pricePerPerson: [35,120], groupMin: 4, groupMax: 16, highlight: "Catch a game then walk to the downtown bars", bestFor: "evening", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Saint Paul Hotel", type: "boutique-hotel", pricePerNight: [190,340], perRoom: true, maxGuests: 2, highlight: "1910 grand hotel on Rice Park, walkable downtown" },
      { name: "Cathedral Hill rental", type: "airbnb", pricePerNight: [350,700], perRoom: false, maxGuests: 12, highlight: "Victorian near Summit Avenue + the cocktail bars" },
    ],
    transport: [{ name: "St. Paul party shuttle", type: "shuttle", priceRange: "$120-$280/group", highlight: "Brewery loop + Minneapolis runs across the river" }],
    presentation: {
      moh: { tagline: "The classy, leafy half of the Twin Cities", description: "St. Paul is the grown-up Twin: a plant-drenched speakeasy, a women-owned distillery tasting room, Victorian Summit Avenue, and a paddlewheeler on the Mississippi. Minneapolis is fifteen minutes away when you want louder." },
      bestman: { tagline: "Riverboats, brewery crawls, and game nights", description: "St. Paul is the easy base in the Twin Cities: a Mississippi riverboat, a 7th-street brewery crawl, a Belgian beer hall, and a Twins or Wild game within walking distance of downtown bars." },
    } },

  // 15 — Duluth, MN
  { id: "duluth-mn", city: "Duluth", state: "MN", region: "midwest",
    nearestAirport: { code: "DLH", name: "Duluth Intl", driveMinutes: 15 },
    bestMonths: [6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "The Rathskeller", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Underground speakeasy with a dark, unique vibe", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["both"] },
      { name: "Vikre Distillery Cocktail Room", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Lake Superior-water spirits + cocktails in Canal Park", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Canal Park Brewing Company", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Lakeside beer garden with firepits over Lake Superior", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "Northern Waters Smokehaus", cuisine: "Smoked fish / deli", priceRange: "$$", highlight: "Cult Canal Park smokehouse sandwiches", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Lake Avenue Restaurant & Bar", cuisine: "New American", priceRange: "$$$", highlight: "Creative plates in Canal Park's DeWitt-Seitz building", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Silos at Pier B", cuisine: "American", priceRange: "$$$", highlight: "Harbor-view dining as freighters pass", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Lake Superior harbor cruise", type: "boat-cruise", duration: "2 hr", pricePerPerson: [40,80], groupMin: 6, groupMax: 30, highlight: "Vista Fleet cruise under the Aerial Lift Bridge", bestFor: "first day", brands: ["both"] },
      { name: "Lakewalk + Aerial Lift Bridge stroll", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 16, highlight: "Seven-mile lakefront walk past the iconic lift bridge", bestFor: "afternoon", brands: ["both"] },
      { name: "North Shore Scenic Drive + waterfall hike", type: "hiking", duration: "4 hr", pricePerPerson: [25,60], groupMin: 4, groupMax: 14, highlight: "Gooseberry Falls + cliffside Lake Superior overlooks", bestFor: "active day", brands: ["both"] },
      { name: "Vikre + Bent Paddle taproom crawl", type: "distillery-tour", duration: "3 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 14, highlight: "Lake Superior-water spirits and beer with a driver", bestFor: "afternoon", brands: ["both"] },
      { name: "St. Louis River kayak paddle", type: "kayaking", duration: "2.5 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 12, highlight: "Sea-kayak the estuary or the big-lake shoreline", bestFor: "active morning", brands: ["both"] },
      { name: "Lake Superior Art Glass blowing class", type: "pottery-class", duration: "2 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 10, highlight: "Blow-your-own glass piece in Canal Park", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "North Shore charter fishing", type: "fishing", duration: "5 hr", pricePerPerson: [120,240], groupMin: 4, groupMax: 8, highlight: "Lake Superior salmon and lake trout charter", bestFor: "morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Pier B Resort", type: "resort", pricePerNight: [220,440], perRoom: true, maxGuests: 2, highlight: "Harborfront resort with a dock and rooftop deck" },
      { name: "Canal Park rental loft", type: "airbnb", pricePerNight: [350,700], perRoom: false, maxGuests: 10, highlight: "Lake-view loft walkable to the brewery district" },
    ],
    transport: [{ name: "Duluth North Shore charter van", type: "charter", priceRange: "$140-$320/group", highlight: "Brewery loop + scenic North Shore day trips" }],
    presentation: {
      moh: { tagline: "Lake Superior, glass-blowing, and cliffside waterfalls", description: "Duluth trades a club scene for something rarer: a harbor cruise under the Aerial Lift Bridge, a glass-blowing class in Canal Park, a distillery using Lake Superior water, and waterfall hikes up the North Shore. The scenic-reset weekend." },
      bestman: { tagline: "Big-lake fishing, breweries, and the North Shore", description: "Duluth is rugged in the best way: charter Lake Superior for salmon, crawl the Canal Park breweries and distilleries, and run the North Shore scenic drive past cliffs and waterfalls." },
    } },

  // 16 — Sioux Falls, SD
  { id: "sioux-falls-sd", city: "Sioux Falls", state: "SD", region: "midwest",
    nearestAirport: { code: "FSD", name: "Sioux Falls Regional", driveMinutes: 10 },
    bestMonths: [5,6,7,8,9], vibes: ["chill","balanced"], score: 5,
    nightlife: [
      { name: "Carpenter Bar", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Intimate craft-cocktail bar with a Phillips Ave patio", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "PAve", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Multi-level downtown bar — beer, wine, and craft cocktails", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Highball", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Light-filled cocktail bar that glows after dark", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Minervas", cuisine: "American", priceRange: "$$$", highlight: "Downtown mainstay with a patio + weekend live music", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Fernson Downtown", cuisine: "Gastropub", priceRange: "$$", highlight: "Phillips Ave taproom with 16 beers + shareable plates", bestFor: "first night", groupFriendly: true, brands: ["both"] },
      { name: "Bread & Circus Sandwich Kitchen", cuisine: "Sandwiches / brunch", priceRange: "$$", highlight: "Beloved downtown brunch and sandwiches", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Phillips Avenue cocktail crawl", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 16, highlight: "Walkable strip of cocktail bars and taprooms downtown", bestFor: "first night", brands: ["both"] },
      { name: "Falls Park walk + overlook tower", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [0,10], groupMin: 2, groupMax: 16, highlight: "Pink-quartzite waterfalls in the middle of the city", bestFor: "afternoon photos", brands: ["both"] },
      { name: "Fernson + WoodGrain brewery crawl", type: "brewery-tour", duration: "2.5 hr", pricePerPerson: [40,85], groupMin: 4, groupMax: 14, highlight: "Two downtown taprooms within a few blocks", bestFor: "first day", brands: ["both"] },
      { name: "Glacial Lakes Distillery tasting", type: "distillery-tour", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 12, highlight: "Locally made vodka, gin, bourbon, and brandy", bestFor: "afternoon", brands: ["both"] },
      { name: "Big Sioux River bike loop", type: "biking", duration: "2 hr", pricePerPerson: [20,45], groupMin: 4, groupMax: 14, highlight: "Paved river-greenway loop through downtown and Falls Park", bestFor: "active morning", brands: ["both"] },
      { name: "Downtown cocktail-making class", type: "cocktail-class", duration: "2 hr", pricePerPerson: [50,90], groupMin: 4, groupMax: 12, highlight: "Hands-on session with bubbles included", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Shenanigans sports + games night", type: "sports-event", duration: "2 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 16, highlight: "36 screens + craft beer for the big game", bestFor: "evening", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel on Phillips", type: "boutique-hotel", pricePerNight: [160,300], perRoom: true, maxGuests: 2, highlight: "Restored 1918 bank building in the center of the bar district" },
      { name: "Downtown group rental", type: "airbnb", pricePerNight: [280,560], perRoom: false, maxGuests: 10, highlight: "Walk to Phillips Avenue + Falls Park" },
    ],
    transport: [{ name: "Sioux Falls group shuttle", type: "shuttle", priceRange: "$90-$200/group", highlight: "Phillips Ave + brewery loop with late pickup" }],
    presentation: {
      moh: { tagline: "Phillips Avenue cocktails + a waterfall downtown", description: "Sioux Falls is a tidy surprise: a walkable Phillips Avenue of craft-cocktail bars and taprooms, a pink-quartzite waterfall in the heart of the city, and a women-friendly pace that won't blow the budget." },
      bestman: { tagline: "Cocktail crawl, breweries, and a city waterfall", description: "Sioux Falls keeps it simple and cheap: a Phillips Avenue crawl of breweries and cocktail bars, a distillery tasting, a river bike loop, and Falls Park's waterfalls a few blocks away." },
    } },

  // 17 — Nashville, IN (Brown County)
  { id: "nashville-in", city: "Nashville", state: "IN", region: "midwest",
    nearestAirport: { code: "IND", name: "Indianapolis Intl", driveMinutes: 60 },
    bestMonths: [5,6,9,10], vibes: ["chill","balanced"], score: 5,
    nightlife: [
      { name: "Big Woods Brewing", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Flagship Brown County brewpub + Quaff ON taproom", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Hard Truth Distilling Tasting Room", type: "tasting-room", vibe: "balanced", priceRange: "$$$", highlight: "Wooded distillery campus — bourbon, rum, and cocktails", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Mike's Music & Dance Barn", type: "bar", vibe: "balanced", priceRange: "$", highlight: "Old-time dance barn with live music in the hills", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "The Nashville House", cuisine: "Country / comfort", priceRange: "$$", highlight: "Fried biscuits, apple butter, and fried chicken since 1859", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Hobnob Corner", cuisine: "American bistro", priceRange: "$$", highlight: "Historic corner restaurant for brunch and lunch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Big Woods Restaurant", cuisine: "Gastropub", priceRange: "$$", highlight: "Wood-fired pub fare paired to the house beer", bestFor: "first night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Brown County wineries + cidery tasting", type: "wine-tour", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Brown County Winery + Cedar Creek tasting rooms downtown", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Hard Truth Distilling tour + flight", type: "distillery-tour", duration: "2 hr", pricePerPerson: [35,80], groupMin: 4, groupMax: 14, highlight: "325-acre wooded distillery campus + UTV tour option", bestFor: "first day", brands: ["both"] },
      { name: "Brown County State Park hike", type: "hiking", duration: "3 hr", pricePerPerson: [10,40], groupMin: 2, groupMax: 14, highlight: "The 'Little Smokies' — 18+ miles of ridgeline trails", bestFor: "active day", brands: ["both"] },
      { name: "Nashville village art + shop stroll", type: "walking-tour", duration: "2 hr", pricePerPerson: [0,25], groupMin: 2, groupMax: 16, highlight: "120+ galleries, studios, and shops in eight walkable blocks", bestFor: "afternoon", brands: ["both"] },
      { name: "Brown County State Park horseback ride", type: "horseback-riding", duration: "2 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 10, highlight: "Guided trail rides through the wooded hills", bestFor: "morning", brands: ["both"] },
      { name: "Salt Creek candle + craft workshop", type: "candle-making", duration: "1.5 hr", pricePerPerson: [40,75], groupMin: 4, groupMax: 12, highlight: "Make-and-take craft session in the artist village", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Hard Truth backwoods UTV adventure", type: "atv", duration: "2 hr", pricePerPerson: [60,130], groupMin: 4, groupMax: 12, highlight: "Guided UTV run through the distillery's wooded acreage", bestFor: "active afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Seasons Lodge & Conference Center", type: "hotel", pricePerNight: [140,260], perRoom: true, maxGuests: 2, highlight: "Walkable to the village + Brown County State Park gate" },
      { name: "Brown County hills cabin", type: "house", pricePerNight: [350,800], perRoom: false, maxGuests: 12, highlight: "Wooded group cabin with a hot tub and a fire pit" },
    ],
    transport: [{ name: "Brown County wine-tour van", type: "charter", priceRange: "$130-$300/group", highlight: "Winery + distillery loop, Indianapolis airport runs" }],
    presentation: {
      moh: { tagline: "Indiana's artsy hill-country hideaway", description: "Nashville is Brown County's walkable village of 120+ galleries and shops, wineries and a wooded distillery, with the 'Little Smokies' state park out the back door. A slower, prettier kind of weekend." },
      bestman: { tagline: "Distillery campus, UTV trails, and the Little Smokies", description: "Brown County is a low-key cabin weekend done right: a 325-acre distillery with UTV trails, a flagship brewpub, ridgeline hikes in the 'Little Smokies,' and a hot-tub cabin in the hills." },
    } },
];
