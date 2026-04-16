/**
 * Canonical destinations — 25 new US cities added 2026-04-16.
 *
 * Every entry is unique to BOTH MOH and BESTMAN catalogs at time of write.
 * Each carries per-brand presentation blocks (tagline + description) and
 * activity/nightlife/dining items tagged for the brands they fit.
 *
 * Compact-but-valid: minimum 2 nightlife / 2 dining / 3 activities / 1 lodging
 * / 1 transport per city. Engines accept this shape today; future enrichment
 * (more venues, prose overviews) is a follow-up sweep.
 */

import type { CanonicalDestination } from "./destinations-types";

export const sharedDestinations: CanonicalDestination[] = [
  // 1
  { id: "knoxville-tn", city: "Knoxville", state: "TN", region: "south",
    nearestAirport: { code: "TYS", name: "McGhee Tyson", driveMinutes: 25 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Brother Wolf", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Negroni-forward speakeasy in the Old City", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Sapphire", type: "lounge", vibe: "balanced", priceRange: "$$", highlight: "Gay Street rooftop with Smokies sightlines", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Pretentious Beer Co.", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Brewery + glassblowing studio in one room", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "OliBea", cuisine: "Southern brunch", priceRange: "$$", highlight: "House biscuits + heirloom hash", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Emilia", cuisine: "Italian", priceRange: "$$$", highlight: "Hand-rolled pasta + natural-wine list", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Stock & Barrel", cuisine: "Burgers", priceRange: "$$", highlight: "Bourbon-glazed patties + market square patio", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Smokies hike", type: "hiking", duration: "4 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 12, highlight: "Laurel Falls or Alum Cave trail", bestFor: "active group", brands: ["both"] },
      { name: "Knoxville Brewery Trail", type: "brewery-tour", duration: "3 hr", pricePerPerson: [60,120], groupMin: 4, groupMax: 14, highlight: "Five breweries via van + tastings", bestFor: "first night", brands: ["both"] },
      { name: "River cruise", type: "boat-cruise", duration: "2 hr", pricePerPerson: [40,80], groupMin: 6, groupMax: 30, highlight: "Tennessee River sunset paddler", bestFor: "sunset photos", brands: ["both"] },
      { name: "Clayton Arts paint night", type: "pottery-class", duration: "2 hr", pricePerPerson: [55,90], groupMin: 6, groupMax: 14, highlight: "BYO bubbles + take home a piece", bestFor: "afternoon downtime", brands: ["moh"] },
    ],
    lodging: [
      { name: "The Tennessean Personal Luxury Hotel", type: "boutique-hotel", pricePerNight: [320,520], perRoom: true, maxGuests: 2, highlight: "Walkable to Market Square + skybridge spa" },
      { name: "Old City loft", type: "airbnb", pricePerNight: [600,1100], perRoom: false, maxGuests: 12, highlight: "Exposed-brick 4BR over the music venues" },
    ],
    transport: [
      { name: "Knox Brew Tours van", type: "shuttle", priceRange: "$120-$240/group", highlight: "Driver knows every brewery + late pickup standard" },
    ],
    presentation: {
      moh: { tagline: "The southern-cool sleeper pick", description: "Knoxville hits a sweet spot between bachelorette towns that have priced themselves out and ones that don't have enough going on. Walkable Old City, a real cocktail scene, the Smokies an hour away, and a price tag that lets the budget breathe." },
      bestman: { tagline: "Brewery crawls + Smokies + zero pretense", description: "Knoxville is what Asheville used to feel like. Walkable downtown, one of the South's best brewery trails, river paddling in the morning, and the Smokies in your back yard." },
    } },

  // 2
  { id: "burlington-vt", city: "Burlington", state: "VT", region: "northeast",
    nearestAirport: { code: "BTV", name: "Burlington Intl", driveMinutes: 10 },
    bestMonths: [6,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Drink", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Apothecary-style basement, six-stool bar", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["both"] },
      { name: "Citizen Cider", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Tasting room + local cheese boards", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Vermont Comedy Club", type: "comedy-club", vibe: "balanced", priceRange: "$$", highlight: "Touring acts + improv weekends", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"] },
    ],
    dining: [
      { name: "Hen of the Wood", cuisine: "Farm-to-table", priceRange: "$$$$", highlight: "Mushroom toast that built the reputation", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Penny Cluse", cuisine: "Brunch", priceRange: "$$", highlight: "Maple sausage gravy + bottomless coffee", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Lake Champlain sunset sail", type: "boat-cruise", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 24, highlight: "Spirit of Ethan Allen with Adirondacks across the water", bestFor: "first night", brands: ["both"] },
      { name: "Stowe-Smugglers' loop hike", type: "hiking", duration: "5 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 12, highlight: "Sterling Pond from the gondola top", bestFor: "active group", brands: ["both"] },
      { name: "Vermont distillery + cidery tour", type: "distillery-tour", duration: "4 hr", pricePerPerson: [85,140], groupMin: 4, groupMax: 14, highlight: "Mad River + Citizen + Smugglers' Notch in one van", bestFor: "tasting day", brands: ["both"] },
      { name: "Farmhouse cooking class", type: "cooking-class", duration: "3 hr", pricePerPerson: [95,165], groupMin: 4, groupMax: 12, highlight: "Cheese + maple + heritage grains", bestFor: "afternoon", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hotel Vermont", type: "boutique-hotel", pricePerNight: [340,560], perRoom: true, maxGuests: 2, highlight: "Lake-facing lobby fire + walkable to Church Street" },
      { name: "Lake-view 5BR", type: "airbnb", pricePerNight: [700,1300], perRoom: false, maxGuests: 12, highlight: "Private dock + sunset deck" },
    ],
    transport: [{ name: "Vermont Tour Co. van", type: "charter", priceRange: "$140-$280", highlight: "Distillery loops + farm visits" }],
    presentation: {
      moh: { tagline: "Lake Champlain + maple + the easy kind of upscale", description: "Burlington is Vermont's editorial answer to a bachelorette weekend. Lakeside sails, farm-table dinners that taste like the Saturday market, walkable Church Street, and a cocktail apothecary the bridesmaids will text about for months." },
      bestman: { tagline: "Mountain biking, breweries, and lake sails", description: "Burlington keeps it simple: bike the Stowe rec path in the morning, hike a notch by lunch, distillery van by happy hour, then a farm-table dinner that doesn't feel like one." },
    } },

  // 3
  { id: "stowe-vt", city: "Stowe", state: "VT", region: "northeast",
    nearestAirport: { code: "BTV", name: "Burlington Intl", driveMinutes: 50 },
    bestMonths: [1,2,3,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Doc Ponds", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "20+ Vermont taps + après-friendly", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Idletyme Brewing", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Riverside firepits + Mountain Road location", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Plate", cuisine: "Modern American", priceRange: "$$$", highlight: "Snug 30-seat, chef's-counter energy", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Edson Hill", cuisine: "Tavern", priceRange: "$$$", highlight: "Stone fireplace dining room + après hour", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Spruce Peak ski day", type: "skiing", duration: "6 hr", pricePerPerson: [120,250], groupMin: 2, groupMax: 12, highlight: "Lift tickets + lodge lunch", bestFor: "winter weekend", brands: ["both"] },
      { name: "Trapp Family lodge backcountry tour", type: "hiking", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Sound-of-Music meadows + brewery finish", bestFor: "summer", brands: ["both"] },
      { name: "Spa day at Topnotch", type: "spa", duration: "4 hr", pricePerPerson: [180,420], groupMin: 2, groupMax: 8, highlight: "Couples massages + maple-sugar scrub", bestFor: "recovery day", brands: ["moh"] },
      { name: "Mountain biking Cady Hill", type: "biking", duration: "3 hr", pricePerPerson: [60,140], groupMin: 2, groupMax: 10, highlight: "Flowy single-track for all levels", bestFor: "active morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Topnotch Resort", type: "resort", pricePerNight: [420,760], perRoom: true, maxGuests: 2, highlight: "Spa + tennis + après bar onsite" },
      { name: "Mountain Road chalet", type: "house", pricePerNight: [800,1700], perRoom: false, maxGuests: 14, highlight: "Hot tub + ski-in/out walk" },
    ],
    transport: [{ name: "Stowe Trolley", type: "shuttle", priceRange: "Free public + $80 charters", highlight: "Mountain Road loop runs in season" }],
    presentation: {
      moh: { tagline: "The cozy mountain weekend", description: "Stowe is the bachelorette weekend that opens with a ski day or a hike, runs through a spa afternoon, and lands at a Vermont farm-table that's been booked for months. Slower pace, denser memory." },
      bestman: { tagline: "Ski lifts, breweries, and a mountain chalet", description: "Stowe earns its reputation honestly: real terrain, deep beer culture, lodges that double as bars, and chalets that fit twelve guys with a hot tub on the deck." },
    } },

  // 4
  { id: "block-island-ri", city: "Block Island", state: "RI", region: "northeast",
    nearestAirport: { code: "PVD", name: "T.F. Green", driveMinutes: 60 },
    bestMonths: [6,7,8,9], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Yellow Kittens", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Live bands every summer night since 1876", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Captain Nick's", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Multi-level deck + DJ nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Eli's", cuisine: "Seafood", priceRange: "$$$", highlight: "Tiny New Harbor room, lobster gnocchi", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Persephone's Kitchen", cuisine: "Cafe", priceRange: "$$", highlight: "Beach picnics + smoothie bowls", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Mohegan Bluffs cliff walk", type: "hiking", duration: "2 hr", pricePerPerson: [0,0], groupMin: 2, groupMax: 20, highlight: "141 wood steps to the most photographed beach in RI", bestFor: "morning", brands: ["both"] },
      { name: "Mopeds across the island", type: "tour", duration: "4 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 14, highlight: "Loop the lighthouses + harbor swim stops", bestFor: "first day", brands: ["both"] },
      { name: "Sunset sail", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 24, highlight: "Old Harbor sloop charter", bestFor: "first night", brands: ["both"] },
    ],
    lodging: [
      { name: "1661 Inn", type: "boutique-hotel", pricePerNight: [380,720], perRoom: true, maxGuests: 2, highlight: "Ocean-view rooms + breakfast on the deck" },
      { name: "Crescent Beach 4BR", type: "house", pricePerNight: [900,1800], perRoom: false, maxGuests: 10, highlight: "Walk to the beach + outdoor shower" },
    ],
    transport: [{ name: "Block Island Ferry", type: "shuttle", priceRange: "$30/person RT", highlight: "From Point Judith — book ahead summer" }],
    presentation: {
      moh: { tagline: "The salt-air weekend that doesn't try too hard", description: "Block Island is the antidote to a Newport weekend that sells out by January. Bike the bluffs, picnic on Crescent Beach, sunset sail with the bridesmaids, and a tiny dining room reservation that only works because someone planned ahead." },
      bestman: { tagline: "Ferries, mopeds, and ocean cliffs", description: "Block Island is Nantucket without the price tag or the dress code. Mopeds, lighthouses, deep beach time, a music bar that's been there 150 years, and a ferry ride that reads as the start of the weekend." },
    } },

  // 5
  { id: "tucson-az", city: "Tucson", state: "AZ", region: "west",
    nearestAirport: { code: "TUS", name: "Tucson Intl", driveMinutes: 15 },
    bestMonths: [10,11,12,1,2,3,4], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Owls Club", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Funeral-home-turned-craft-cocktail bar", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Hotel Congress", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Historic dance floor + live music", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Westbound", type: "lounge", vibe: "balanced", priceRange: "$$$", highlight: "Sonoran-inspired tasting cocktails", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"] },
    ],
    dining: [
      { name: "El Charro Café", cuisine: "Sonoran Mexican", priceRange: "$$", highlight: "Oldest family-owned Mexican in the U.S.", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Cup Café", cuisine: "Brunch", priceRange: "$$", highlight: "Inside Hotel Congress, prickly-pear mimosa", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Sabino Canyon tram", type: "tour", duration: "3 hr", pricePerPerson: [25,50], groupMin: 2, groupMax: 30, highlight: "Saguaro Park desert trams + waterfalls", bestFor: "morning", brands: ["both"] },
      { name: "Mt. Lemmon scenic drive", type: "scenic-overlook", duration: "5 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 14, highlight: "9k feet, pine forest at the top", bestFor: "afternoon", brands: ["both"] },
      { name: "Hot-air balloon at sunrise", type: "tour", duration: "4 hr", pricePerPerson: [220,340], groupMin: 4, groupMax: 12, highlight: "Saguaro forest under the basket", bestFor: "splurge morning", brands: ["both"] },
      { name: "Desert spa day at Miraval", type: "spa", duration: "5 hr", pricePerPerson: [320,550], groupMin: 2, groupMax: 8, highlight: "Catalina-foothills wellness resort", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hotel McCoy", type: "boutique-hotel", pricePerNight: [180,320], perRoom: true, maxGuests: 2, highlight: "Local-art pool patio + walkable" },
      { name: "Catalina-foothills 5BR", type: "house", pricePerNight: [600,1400], perRoom: false, maxGuests: 12, highlight: "Pool + saguaro views + outdoor kitchen" },
    ],
    transport: [{ name: "Tucson Tour Co. SUV", type: "charter", priceRange: "$160-$320", highlight: "Mt. Lemmon + Saguaro day trips" }],
    presentation: {
      moh: { tagline: "Desert sunsets, vintage cocktails, no airport drama", description: "Tucson is what Sedona used to be before it became a backdrop. Sonoran sunsets, an actual cocktail scene, a wellness resort that takes the recovery day seriously, and a hot-air-balloon morning that wrecks the camera roll." },
      bestman: { tagline: "Desert trail riding, Sonoran food, Mexican border-town energy", description: "Tucson is the Arizona weekend that doesn't sell itself short. Real Mexican food, real desert hiking at sunrise, a mountain you can drive up in afternoon, and craft cocktails in a converted funeral home." },
    } },

  // 6
  { id: "flagstaff-az", city: "Flagstaff", state: "AZ", region: "west",
    nearestAirport: { code: "FLG", name: "Flagstaff Pulliam", driveMinutes: 10 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Dark Sky Brewing", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Tap haus + live folk weekends", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Hops on Birch", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "30+ AZ taps + downtown spillover", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Tinderbox", cuisine: "American", priceRange: "$$$", highlight: "Wood-fired meats + Southside vibes", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Toasted Owl", cuisine: "Brunch", priceRange: "$$", highlight: "Portion sizes that earn the name", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Grand Canyon south rim day trip", type: "tour", duration: "8 hr", pricePerPerson: [120,240], groupMin: 4, groupMax: 14, highlight: "90 min each way + 4 hr at the rim", bestFor: "must-do", brands: ["both"] },
      { name: "Sunset Crater + Wupatki loop", type: "scenic-overlook", duration: "4 hr", pricePerPerson: [25,60], groupMin: 2, groupMax: 14, highlight: "Volcano craters + Indigenous ruins", bestFor: "afternoon", brands: ["both"] },
      { name: "Snowbowl ski day or alpine slide", type: "skiing", duration: "6 hr", pricePerPerson: [110,240], groupMin: 2, groupMax: 12, highlight: "Winter lifts; summer chairlift to peak", bestFor: "weather-dependent", brands: ["both"] },
    ],
    lodging: [
      { name: "Little America Hotel", type: "hotel", pricePerNight: [220,420], perRoom: true, maxGuests: 2, highlight: "Pine forest grounds + walking trails" },
      { name: "Downtown 4BR cabin", type: "house", pricePerNight: [500,1100], perRoom: false, maxGuests: 10, highlight: "Walk to Heritage Square + fire pit" },
    ],
    transport: [{ name: "Flagstaff Shuttle Service", type: "shuttle", priceRange: "$140-$280", highlight: "Grand Canyon + Sedona day trips" }],
    presentation: {
      moh: { tagline: "Grand Canyon as a side trip, mountain town as the base", description: "Flagstaff is the strategic basecamp — Grand Canyon at sunrise, Sedona for an afternoon, mountain-town breweries by night, and a 4BR cabin with a fire pit that holds the bridesmaids." },
      bestman: { tagline: "Grand Canyon basecamp + mountain dive bars", description: "Flagstaff is where you stay if you want to see the Grand Canyon without paying El Tovar prices. Pine air, real dive bars on Birch, and a ski mountain you can hit in winter or chairlift up in summer." },
    } },

  // 7
  { id: "galena-il", city: "Galena", state: "IL", region: "midwest",
    nearestAirport: { code: "MLI", name: "Quad City Intl", driveMinutes: 80 },
    bestMonths: [5,6,9,10,12], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Galena Brewing Co.", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Main Street tasting room + patio", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Frank O'Dowd's", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Irish pub + late dancing crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Fried Green Tomatoes", cuisine: "Italian-Southern", priceRange: "$$$", highlight: "1880s building, namesake plate", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "One Eleven Main", cuisine: "American bistro", priceRange: "$$$", highlight: "Wine bar + small plates", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Main Street historic walk", type: "walking-tour", duration: "2 hr", pricePerPerson: [15,30], groupMin: 4, groupMax: 20, highlight: "U.S. Grant home + boutique browsing", bestFor: "afternoon", brands: ["both"] },
      { name: "Ziplining at Long Hollow", type: "zip-lining", duration: "3 hr", pricePerPerson: [85,140], groupMin: 4, groupMax: 14, highlight: "Six runs + treetop views", bestFor: "active morning", brands: ["both"] },
      { name: "Wine tasting at Galena Cellars", type: "wine-tour", duration: "2 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 16, highlight: "Drive to vineyard + 8 pours", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "Eagle Ridge Resort", type: "resort", pricePerNight: [320,560], perRoom: true, maxGuests: 4, highlight: "Lake views + golf + spa onsite" },
      { name: "Riverview cabin 4BR", type: "house", pricePerNight: [450,880], perRoom: false, maxGuests: 10, highlight: "Hot tub + downtown walk" },
    ],
    transport: [{ name: "Galena Trolley", type: "shuttle", priceRange: "$40-$120", highlight: "Historic-tour loops + private charter" }],
    presentation: {
      moh: { tagline: "Storybook Main Street + Mississippi River bluffs", description: "Galena is the bachelorette weekend you didn't know was 90 minutes from Chicago. Brick-and-stone Main Street, a ridge resort with a real spa, wine tasting at the river, and zero crowds outside fall foliage week." },
      bestman: { tagline: "1850s-Main-Street hangs + zip lines + craft brewery", description: "Galena is what bachelor weekends used to be — small downtown you can walk in 20 minutes, brewery on the corner, zip lines outside town, and a cabin that fits ten with a hot tub." },
    } },

  // 8
  { id: "cody-wy", city: "Cody", state: "WY", region: "west",
    nearestAirport: { code: "COD", name: "Yellowstone Regional", driveMinutes: 5 },
    bestMonths: [6,7,8,9], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Silver Dollar Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Saloon-style, dollar-bill ceiling", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Cassie's Supper Club", type: "honky-tonk", vibe: "unhinged", priceRange: "$$", highlight: "Live country band + dance floor", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Local Grill", cuisine: "American", priceRange: "$$$", highlight: "Bison ribeye + craft cocktails", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Beta Cafe", cuisine: "Brunch", priceRange: "$$", highlight: "Mountain-town breakfast + climbers", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Yellowstone east-entrance day", type: "tour", duration: "10 hr", pricePerPerson: [180,340], groupMin: 4, groupMax: 12, highlight: "50 minutes to the gate, all-day driving loop", bestFor: "must-do", brands: ["both"] },
      { name: "Cody Nite Rodeo", type: "sports-event", duration: "2 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 30, highlight: "Every summer night since 1938", bestFor: "first night", brands: ["both"] },
      { name: "Whitewater raft Shoshone Canyon", type: "rafting", duration: "4 hr", pricePerPerson: [90,160], groupMin: 6, groupMax: 14, highlight: "Class III rapids + bald eagle sightings", bestFor: "active day", brands: ["both"] },
      { name: "Buffalo Bill Center museums", type: "tour", duration: "3 hr", pricePerPerson: [25,60], groupMin: 2, groupMax: 14, highlight: "Five-museum complex on the West", bestFor: "rainy backup", brands: ["both"] },
    ],
    lodging: [
      { name: "Chamberlin Inn", type: "boutique-hotel", pricePerNight: [280,520], perRoom: true, maxGuests: 2, highlight: "1903 brick boutique + courtyard" },
      { name: "Wapiti cabin 6BR", type: "house", pricePerNight: [600,1300], perRoom: false, maxGuests: 14, highlight: "20 min from Yellowstone gate + hot tub" },
    ],
    transport: [{ name: "Cody Yellowstone Tours van", type: "charter", priceRange: "$240-$520", highlight: "Day trips into the park + back" }],
    presentation: {
      moh: { tagline: "Yellowstone by day, saloon nights, no jet lag", description: "Cody is the Wyoming weekend that doesn't try to compete with Jackson. A real western downtown, an east-gate basecamp for Yellowstone, a nightly rodeo, and prices that don't punish a 12-person group." },
      bestman: { tagline: "Yellowstone gateway + nightly rodeo + raft canyon", description: "Cody is what Jackson used to be before everyone showed up. Saloons that mean it, a real rodeo every night, Class III whitewater 20 minutes out, and Yellowstone's east gate before the lots fill." },
    } },

  // 9
  { id: "provincetown-ma", city: "Provincetown", state: "MA", region: "northeast",
    nearestAirport: { code: "BOS", name: "Boston Logan", driveMinutes: 130 },
    bestMonths: [6,7,8,9], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Atlantic House", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Oldest gay bar in the country, three rooms", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Boatslip Tea Dance", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Sunset DJ deck on the harbor — institution", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Crown & Anchor", type: "drag-show", vibe: "unhinged", priceRange: "$$$", highlight: "Cabaret + pool party + drag shows on rotation", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"] },
    ],
    dining: [
      { name: "The Mews", cuisine: "Seafood", priceRange: "$$$$", highlight: "Beachfront fine dining + 250-cocktail menu", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Liz's Cafe", cuisine: "Brunch", priceRange: "$$", highlight: "Lobster Benedict + cottage patio", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Whale watch from MacMillan Wharf", type: "boat-cruise", duration: "4 hr", pricePerPerson: [60,90], groupMin: 4, groupMax: 30, highlight: "Stellwagen Bank — humpback hot zone", bestFor: "morning", brands: ["both"] },
      { name: "Race Point dunes Jeep tour", type: "tour", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Sand-road convoy through the seashore", bestFor: "afternoon", brands: ["both"] },
      { name: "Drag brunch at the Crown", type: "drag-brunch", duration: "2 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 16, highlight: "Bottomless mimosas + headliner sets", bestFor: "Sunday", brands: ["moh"] },
      { name: "Pilgrim Monument climb", type: "scenic-overlook", duration: "1 hr", pricePerPerson: [15,30], groupMin: 2, groupMax: 14, highlight: "252 feet over the harbor", bestFor: "quick", brands: ["both"] },
    ],
    lodging: [
      { name: "Crowne Pointe Inn", type: "boutique-hotel", pricePerNight: [380,680], perRoom: true, maxGuests: 2, highlight: "Spa + heated pool + breakfast" },
      { name: "West End 5BR cottage", type: "house", pricePerNight: [900,1900], perRoom: false, maxGuests: 12, highlight: "Walk to Tea Dance + private deck" },
    ],
    transport: [{ name: "Bay State Cruise ferry", type: "shuttle", priceRange: "$120/person RT", highlight: "Boston ↔ P-town, 90 min, sunset return" }],
    presentation: {
      moh: { tagline: "The drag-brunch / tea-dance / harbor-cottage weekend", description: "Provincetown is the bachelorette town that knows it's a bachelorette town. Tea dance at sundown, drag brunch on Sunday, harbor cottage that fits twelve, whale watch in the morning that nobody regrets." },
      bestman: { tagline: "Cape Cod's only real party town", description: "P-town is the Cape's escape valve. Walkable downtown, a half-mile of bars that open at noon, ferry over from Boston, and a beach scene that runs itself." },
    } },

  // 10
  { id: "greenville-sc", city: "Greenville", state: "SC", region: "south",
    nearestAirport: { code: "GSP", name: "Greenville-Spartanburg", driveMinutes: 25 },
    bestMonths: [3,4,5,9,10,11], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Vault & Vator", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Below-the-bank cocktail vault", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Methodical Coffee + Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Late-night cocktails in the design district", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Birds Fly South Ale Project", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Wild ales + reclaimed warehouse", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "Soby's", cuisine: "Southern", priceRange: "$$$", highlight: "Main Street institution + shrimp and grits", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Sully's Steamers", cuisine: "Bagel sandwiches", priceRange: "$", highlight: "Late-night and brunch shovels", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Falls Park + Liberty Bridge stroll", type: "walking-tour", duration: "2 hr", pricePerPerson: [0,0], groupMin: 2, groupMax: 30, highlight: "Downtown waterfall + suspended bridge", bestFor: "morning", brands: ["both"] },
      { name: "Swamp Rabbit Trail bike", type: "biking", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 16, highlight: "Greenway to Travelers Rest brewpubs", bestFor: "afternoon", brands: ["both"] },
      { name: "Yeah, that Greenville food tour", type: "food-tour", duration: "3 hr", pricePerPerson: [85,140], groupMin: 4, groupMax: 14, highlight: "Six tastings on Main", bestFor: "first day", brands: ["both"] },
    ],
    lodging: [
      { name: "Hotel Domestique", type: "boutique-hotel", pricePerNight: [380,680], perRoom: true, maxGuests: 2, highlight: "Cyclist-themed luxury 30 min north" },
      { name: "Downtown 5BR", type: "house", pricePerNight: [600,1200], perRoom: false, maxGuests: 12, highlight: "Walkable to Main + private courtyard" },
    ],
    transport: [{ name: "Greenlink Trolley", type: "shuttle", priceRange: "Free + $80 charters", highlight: "Downtown loop runs Thu-Sun" }],
    presentation: {
      moh: { tagline: "Charleston's chill cousin with the waterfall downtown", description: "Greenville is the bachelorette weekend that lets the budget breathe. Walkable Main with a real waterfall, a speakeasy in a former bank vault, food-tour first day, brewery bike trail second — and Charleston prices nowhere in sight." },
      bestman: { tagline: "Underrated downtown + brewery bike trail", description: "Greenville is the South's quiet flex. Walkable downtown, a brewery scene that climbs the Swamp Rabbit Trail north, a vault speakeasy, and lodging at half what Charleston runs." },
    } },

  // 11
  { id: "lake-george-ny", city: "Lake George", state: "NY", region: "northeast",
    nearestAirport: { code: "ALB", name: "Albany Intl", driveMinutes: 60 },
    bestMonths: [6,7,8,9], vibes: ["chill","balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Caldwell House Pub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Lake-view patio + late karaoke", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Adirondack Pub & Brewery", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "House-brewed + lake-village walk", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Bistro LeRoux", cuisine: "French-American", priceRange: "$$$", highlight: "Fine dining outside the village din", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Tea Island Restaurant", cuisine: "Lakefront seafood", priceRange: "$$$", highlight: "On-the-water deck dining", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Steamboat dinner cruise", type: "boat-cruise", duration: "3 hr", pricePerPerson: [85,140], groupMin: 6, groupMax: 30, highlight: "Lac du Saint Sacrement + sunset deck", bestFor: "first night", brands: ["both"] },
      { name: "Tubing the Sacandaga", type: "rafting", duration: "4 hr", pricePerPerson: [60,110], groupMin: 6, groupMax: 20, highlight: "Lazy float + mid-river beer keg", bestFor: "all day", brands: ["both"] },
      { name: "Prospect Mountain hike + drive", type: "hiking", duration: "3 hr", pricePerPerson: [10,30], groupMin: 2, groupMax: 14, highlight: "Five-state view at the summit", bestFor: "morning", brands: ["both"] },
      { name: "Wakeboard charter", type: "boat-cruise", duration: "3 hr", pricePerPerson: [120,240], groupMin: 4, groupMax: 8, highlight: "Captain + boards + tube included", bestFor: "active group", brands: ["both"] },
    ],
    lodging: [
      { name: "The Sagamore Resort", type: "resort", pricePerNight: [420,780], perRoom: true, maxGuests: 4, highlight: "Island resort + dock + spa" },
      { name: "Bolton Landing 6BR", type: "house", pricePerNight: [800,1900], perRoom: false, maxGuests: 14, highlight: "Private dock + hot tub + lake views" },
    ],
    transport: [{ name: "Lake George Steamboat Co.", type: "shuttle", priceRange: "$50-$140/person", highlight: "Multiple cruise tiers + private charters" }],
    presentation: {
      moh: { tagline: "Lakefront glam, steamboat sunsets, mountain backdrop", description: "Lake George reads as the Adirondack version of a destination wedding weekend. Sagamore-resort polish, sunset steamboat dinner, lazy-river tubing afternoon, and a 6BR with a private dock that holds the bridal party." },
      bestman: { tagline: "Lake house, wakeboard charter, mountain views", description: "Lake George is the upstate weekend that earns it. Private boat charter all afternoon, mountain hike in the morning, beer-tubing the river by lunch, and a six-bedroom on the water with the dock to yourselves." },
    } },

  // 12
  { id: "hot-springs-ar", city: "Hot Springs", state: "AR", region: "south",
    nearestAirport: { code: "LIT", name: "Little Rock Bill & Hillary Clinton", driveMinutes: 60 },
    bestMonths: [3,4,5,9,10,11], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Maxine's Live", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Dive-meets-music hall in the bathhouse row", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Superior Bathhouse Brewery", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Only brewery inside a national park", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Grateful Head Pizza Oven", cuisine: "Pizza", priceRange: "$$", highlight: "Wood-fired + craft cocktails", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Will's Cinnamon Shop", cuisine: "Brunch", priceRange: "$", highlight: "Famous rolls + coffee bar", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Quapaw bathhouse soak", type: "spa", duration: "3 hr", pricePerPerson: [60,180], groupMin: 4, groupMax: 12, highlight: "Four mineral pools at varying temps", bestFor: "recovery day", brands: ["both"] },
      { name: "Oaklawn racing", type: "casino", duration: "5 hr", pricePerPerson: [40,200], groupMin: 4, groupMax: 30, highlight: "Live thoroughbred season Dec-May", bestFor: "afternoon", brands: ["both"] },
      { name: "Hot Springs Mountain hike", type: "hiking", duration: "2 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 14, highlight: "Tower views over the bathhouse row", bestFor: "morning", brands: ["both"] },
    ],
    lodging: [
      { name: "Hotel Hale", type: "boutique-hotel", pricePerNight: [240,420], perRoom: true, maxGuests: 2, highlight: "1892 bathhouse with thermal soaking tubs in-room" },
      { name: "Lake Hamilton 5BR", type: "house", pricePerNight: [500,1100], perRoom: false, maxGuests: 12, highlight: "Boat dock + screened porch" },
    ],
    transport: [{ name: "Hot Springs Trolley", type: "shuttle", priceRange: "Free + $80 charters", highlight: "Bathhouse Row loop" }],
    presentation: {
      moh: { tagline: "Bathhouse spa weekend that doesn't cost a Sedona price tag", description: "Hot Springs is the most underrated bachelorette weekend in the country. Original 1890s bathhouses, thermal-soaking suites, brewery row inside a national park, and lake-house lodging that costs a fraction of Asheville." },
      bestman: { tagline: "Bathhouses, horse track, brewery in a national park", description: "Hot Springs is what Vegas would be if it had hiking and self-respect. Live racing at Oaklawn, the country's only national-park brewery, bathhouses for the recovery day, and a lake house with a boat dock." },
    } },

  // 13
  { id: "beaufort-sc", city: "Beaufort", state: "SC", region: "south",
    nearestAirport: { code: "SAV", name: "Savannah/Hilton Head", driveMinutes: 45 },
    bestMonths: [3,4,5,10,11], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Q on Bay", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Waterfront cocktail patio", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Old Bull Tavern", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Bay Street craft cocktail favorite", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Saltus River Grill", cuisine: "Lowcountry", priceRange: "$$$$", highlight: "Sushi + steaks on the river", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Blackstone's Café", cuisine: "Brunch", priceRange: "$$", highlight: "Shrimp + grits institution", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Hunting Island sunset", type: "beach", duration: "3 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 30, highlight: "Lighthouse climb + driftwood beach", bestFor: "first night", brands: ["both"] },
      { name: "Marsh kayak tour", type: "kayaking", duration: "3 hr", pricePerPerson: [70,120], groupMin: 4, groupMax: 14, highlight: "Dolphins + tidal creeks", bestFor: "morning", brands: ["both"] },
      { name: "Carriage tour Old Town", type: "tour", duration: "1 hr", pricePerPerson: [30,60], groupMin: 2, groupMax: 16, highlight: "Antebellum houses + Pat Conroy lore", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "Beaufort Inn", type: "boutique-hotel", pricePerNight: [320,560], perRoom: true, maxGuests: 2, highlight: "Historic district garden cottages" },
      { name: "Bay-Street 5BR", type: "house", pricePerNight: [700,1500], perRoom: false, maxGuests: 12, highlight: "Wraparound porch + walk to dinner" },
    ],
    transport: [{ name: "Beaufort Tours van", type: "charter", priceRange: "$140-$320", highlight: "Hunting Island + sea-island day trips" }],
    presentation: {
      moh: { tagline: "Lowcountry weekend without the Charleston wait list", description: "Beaufort is the Lowcountry weekend the bridesmaids will Google after. Spanish-moss streets, marsh kayaks at sunrise, river-grill dinner, and a bay-street house that sleeps twelve and didn't book six months out." },
      bestman: { tagline: "Marsh kayaking + Lowcountry oyster dinner", description: "Beaufort is the South Carolina weekend that doesn't get oversold. Marsh kayaking with dolphins, a riverfront grill that does it right, and a 5BR on Bay Street that costs less than one room in Charleston." },
    } },

  // 14
  { id: "eureka-springs-ar", city: "Eureka Springs", state: "AR", region: "south",
    nearestAirport: { code: "XNA", name: "NW Arkansas Regional", driveMinutes: 60 },
    bestMonths: [4,5,9,10,11], vibes: ["chill","balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Chelsea's Corner Cafe", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Live music nightly + Ozark crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Squid & Whale Pub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Underground vibe, late karaoke", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Local Flavor Cafe", cuisine: "Eclectic", priceRange: "$$", highlight: "Patio dining + global menu", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mud Street Cafe", cuisine: "Brunch", priceRange: "$$", highlight: "Underground breakfast institution", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Crescent Hotel ghost tour", type: "tour", duration: "1.5 hr", pricePerPerson: [30,60], groupMin: 4, groupMax: 20, highlight: "America's most haunted hotel claim", bestFor: "first night", brands: ["both"] },
      { name: "Beaver Lake boat day", type: "boat-cruise", duration: "5 hr", pricePerPerson: [120,260], groupMin: 6, groupMax: 14, highlight: "Pontoon rental + cliff-jump cove", bestFor: "summer", brands: ["both"] },
      { name: "Thorncrown Chapel + downtown wander", type: "walking-tour", duration: "3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 20, highlight: "Iconic glass chapel + boutique street", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "1886 Crescent Hotel", type: "boutique-hotel", pricePerNight: [220,420], perRoom: true, maxGuests: 2, highlight: "Hilltop Victorian + spa" },
      { name: "Victorian 4BR", type: "house", pricePerNight: [400,900], perRoom: false, maxGuests: 10, highlight: "Walk to bars + wraparound porch" },
    ],
    transport: [{ name: "Eureka Trolley", type: "shuttle", priceRange: "Free + $80 charters", highlight: "Historic district loops" }],
    presentation: {
      moh: { tagline: "Ghost tours, hilltop Victorian hotel, weird-Arkansas charm", description: "Eureka Springs is the chaotic-good bachelorette pick. Haunted hotel suites, downtown bars within stagger distance, Beaver Lake pontoon afternoon, and a vibe that's part Salem-spooky, part Ozark-warm." },
      bestman: { tagline: "Ozark weekend with a haunted hotel and a boat day", description: "Eureka Springs runs a different play. Live music every night, ghost tour at midnight, pontoon all day on Beaver Lake, and a 4BR Victorian downtown for the price of a Nashville hotel room." },
    } },

  // 15
  { id: "ocean-city-md", city: "Ocean City", state: "MD", region: "northeast",
    nearestAirport: { code: "BWI", name: "Baltimore-Washington", driveMinutes: 150 },
    bestMonths: [6,7,8,9], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Seacrets", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Massive bay-front complex, 18 bars in one", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Fager's Island", type: "lounge", vibe: "balanced", priceRange: "$$$", highlight: "Sunset deck + 1812 Overture every night", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "The Hobbit", cuisine: "Seafood", priceRange: "$$$", highlight: "Bayfront crab + Tolkien-era decor", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Layton's", cuisine: "Brunch", priceRange: "$$", highlight: "Pancakes + boardwalk start", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Beach day + boardwalk", type: "beach", duration: "5 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 30, highlight: "Three miles of boardwalk + Thrasher's fries", bestFor: "all day", brands: ["both"] },
      { name: "Assateague pony beach", type: "tour", duration: "4 hr", pricePerPerson: [25,80], groupMin: 4, groupMax: 14, highlight: "Wild ponies on the dunes", bestFor: "morning", brands: ["both"] },
      { name: "Pontoon party charter", type: "boat-cruise", duration: "4 hr", pricePerPerson: [110,240], groupMin: 6, groupMax: 14, highlight: "BYOB + sandbar swimming", bestFor: "summer", brands: ["both"] },
    ],
    lodging: [
      { name: "Hilton OC Oceanfront", type: "hotel", pricePerNight: [320,620], perRoom: true, maxGuests: 4, highlight: "Beachfront + walk to OC bars" },
      { name: "Bayfront 6BR", type: "house", pricePerNight: [700,1900], perRoom: false, maxGuests: 14, highlight: "Private dock + pool" },
    ],
    transport: [{ name: "OC Bus", type: "shuttle", priceRange: "$3/ride + charters", highlight: "Coastal Highway runs all night" }],
    presentation: {
      moh: { tagline: "East-coast beach weekend with the boardwalk circus", description: "Ocean City is the bachelorette weekend that doesn't pretend. Beach all day, Seacrets at night (the bay-front 18-bar complex you can't believe is real), pontoon-charter afternoon, and a 6BR with a dock that holds the bridesmaids." },
      bestman: { tagline: "Seacrets, beach, boardwalk — done", description: "Ocean City is what Myrtle Beach wants to be. Bay-front clubs, real boardwalk food, pontoon charters with BYOB, and lodging on the bay that lets you walk home from the bars." },
    } },

  // 16
  { id: "rehoboth-beach-de", city: "Rehoboth Beach", state: "DE", region: "northeast",
    nearestAirport: { code: "PHL", name: "Philadelphia Intl", driveMinutes: 120 },
    bestMonths: [6,7,8,9], vibes: ["chill","balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Aqua Grill", type: "lounge", vibe: "balanced", priceRange: "$$$", highlight: "Pool + DJ + outdoor bar — gay-friendly anchor", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Diego's", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Late dancing + drag shows weekly", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Henlopen City Oyster House", cuisine: "Seafood", priceRange: "$$$", highlight: "30 oysters at all times", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Egg", cuisine: "Brunch", priceRange: "$$", highlight: "All-day breakfast + boardwalk-adjacent", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Beach day + boardwalk", type: "beach", duration: "5 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 30, highlight: "Funland rides + Thrasher's fries (yes, here too)", bestFor: "all day", brands: ["both"] },
      { name: "Cape Henlopen kayak", type: "kayaking", duration: "3 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 14, highlight: "Bay-side paddle + osprey nests", bestFor: "morning", brands: ["both"] },
      { name: "Dogfish Head brewery tour", type: "brewery-tour", duration: "2 hr", pricePerPerson: [30,75], groupMin: 4, groupMax: 16, highlight: "30-min drive to Milton — the original", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "Hotel Rehoboth", type: "hotel", pricePerNight: [320,580], perRoom: true, maxGuests: 4, highlight: "Boardwalk-adjacent + pool" },
      { name: "Henlopen Acres 5BR", type: "house", pricePerNight: [800,1700], perRoom: false, maxGuests: 12, highlight: "Quiet north-end + private deck" },
    ],
    transport: [{ name: "Jolly Trolley", type: "shuttle", priceRange: "$3/ride + charters", highlight: "Coastal Highway tourist trolley" }],
    presentation: {
      moh: { tagline: "Mid-Atlantic beach + boardwalk + Dogfish Head", description: "Rehoboth is the East Coast's quiet alternative to a P-town weekend. Tax-free outlet shopping, oyster-house dinners, sunrise kayak in Cape Henlopen, and a downtown that's gay-friendly and wedding-friendly in equal measure." },
      bestman: { tagline: "Beach weekend with brewery tours and tax-free outlets", description: "Rehoboth is what Ocean City would be if it slowed down. Cleaner beach, better food, the original Dogfish Head 30 minutes north, and tax-free shopping the bachelors didn't know they needed." },
    } },

  // 17
  { id: "door-county-wi", city: "Door County", state: "WI", region: "midwest",
    nearestAirport: { code: "GRB", name: "Green Bay Austin Straubel", driveMinutes: 50 },
    bestMonths: [6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Husby's Food & Spirits", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Sister Bay supper club + dance crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Mr. Helsinki", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "Fish Creek wine + tapas above the harbor", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Wickman House", cuisine: "Farm-to-table", priceRange: "$$$", highlight: "Ellison Bay reservation worth driving for", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Al Johnson's Swedish", cuisine: "Brunch", priceRange: "$$", highlight: "Goats on the sod roof, Swedish pancakes", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Peninsula State Park bike loop", type: "biking", duration: "3 hr", pricePerPerson: [30,80], groupMin: 4, groupMax: 16, highlight: "Eagle Tower + bayfront single-track", bestFor: "morning", brands: ["both"] },
      { name: "Door Peninsula Winery + cidery hop", type: "wine-tour", duration: "4 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 14, highlight: "Five tasting rooms, designated van", bestFor: "afternoon", brands: ["both"] },
      { name: "Cave Point kayak + cliffs", type: "kayaking", duration: "3 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 14, highlight: "Sea cave entrances at Cave Point", bestFor: "active morning", brands: ["both"] },
    ],
    lodging: [
      { name: "Eagle Harbor Inn", type: "boutique-hotel", pricePerNight: [320,560], perRoom: true, maxGuests: 2, highlight: "Ephraim historic district + breakfast" },
      { name: "Bayfront 6BR cottage", type: "house", pricePerNight: [700,1500], perRoom: false, maxGuests: 12, highlight: "Private dock + sunset porch" },
    ],
    transport: [{ name: "Door County Trolley", type: "shuttle", priceRange: "$50-$120", highlight: "Lighthouse + winery tour loops" }],
    presentation: {
      moh: { tagline: "Bayside cottages, lighthouses, the Wisconsin secret", description: "Door County is the bachelorette weekend Chicago bridesmaids keep to themselves. Bayfront cottages, lighthouse hopping, sunset wine tours, and a Sister Bay supper club with goats on the sod roof." },
      bestman: { tagline: "Bay-side cottage + cidery + sea-cave kayaks", description: "Door County is the upper-Midwest weekend that doesn't sell itself. Sea-cave kayaking at Cave Point, cidery van tour, lakefront cottage with a dock, and supper club nights that end with old-fashioneds." },
    } },

  // 18
  { id: "mackinac-island-mi", city: "Mackinac Island", state: "MI", region: "midwest",
    nearestAirport: { code: "PLN", name: "Pellston Regional", driveMinutes: 30 },
    bestMonths: [6,7,8,9], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Pink Pony Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Harbor-view dance floor + pink everything", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Horn's Gaslight Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Live country/rock, late nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "The Jockey Club", cuisine: "American", priceRange: "$$$$", highlight: "Lake-view fine dining at Grand Hotel", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Doud's Market deli + lawn picnic", cuisine: "Picnic", priceRange: "$$", highlight: "Pack lunch for the bluffs", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Bike the 8-mile loop", type: "biking", duration: "3 hr", pricePerPerson: [30,60], groupMin: 4, groupMax: 16, highlight: "Lakeshore loop with Arch Rock + cliffs", bestFor: "first day", brands: ["both"] },
      { name: "Horse-drawn carriage tour", type: "tour", duration: "2 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "No cars allowed — horses are the transit", bestFor: "afternoon", brands: ["both"] },
      { name: "Fudge tasting walk", type: "food-tour", duration: "1 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Six fudge shops on Main", bestFor: "after dinner", brands: ["both"] },
    ],
    lodging: [
      { name: "Grand Hotel", type: "resort", pricePerNight: [620,1200], perRoom: true, maxGuests: 4, highlight: "Iconic 1887 porch + jacket-required dining" },
      { name: "Inn-at-Stonecliffe 5BR", type: "house", pricePerNight: [900,2100], perRoom: false, maxGuests: 12, highlight: "Private cliff-side estate" },
    ],
    transport: [{ name: "Star Line ferry", type: "shuttle", priceRange: "$30/person RT", highlight: "From Mackinaw City — bikes go on board" }],
    presentation: {
      moh: { tagline: "No-cars, horse-and-bike, Grand Hotel romance", description: "Mackinac Island is the bachelorette weekend that runs at a different speed. No cars, all bikes and carriages, Grand Hotel afternoon tea, and a porch sunset cocktail that earns a slow weekend." },
      bestman: { tagline: "Old-school resort weekend with no cars", description: "Mackinac is what bachelor weekends used to be before they got loud. Bike the loop, fudge crawl, Pink Pony nights, and a hotel porch that's been booked since 1887." },
    } },

  // 19
  { id: "coeur-dalene-id", city: "Coeur d'Alene", state: "ID", region: "west",
    nearestAirport: { code: "GEG", name: "Spokane Intl", driveMinutes: 35 },
    bestMonths: [6,7,8,9], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Beverly's", type: "lounge", vibe: "balanced", priceRange: "$$$", highlight: "Coeur d'Alene Resort lake-view bar", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Moontime Pub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Sherman Ave dive + late nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "The Cedars Floating Restaurant", cuisine: "Steak & seafood", priceRange: "$$$$", highlight: "On a barge in the lake", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Kitchen", cuisine: "Brunch", priceRange: "$$", highlight: "Egg-bowl menu + downtown patio", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Lake cruise sunset", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 30, highlight: "Wooden cruiser + open bar", bestFor: "first night", brands: ["both"] },
      { name: "Tubbs Hill loop hike", type: "hiking", duration: "2 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 14, highlight: "2-mile lakeshore trail from downtown", bestFor: "morning", brands: ["both"] },
      { name: "Wakeboard charter", type: "boat-cruise", duration: "3 hr", pricePerPerson: [110,260], groupMin: 4, groupMax: 8, highlight: "Captain + boards + tube", bestFor: "active afternoon", brands: ["both"] },
      { name: "Floating golf hole at the resort", type: "golf", duration: "5 hr", pricePerPerson: [240,520], groupMin: 4, groupMax: 8, highlight: "World's only floating green, 14th hole", bestFor: "must-do", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Coeur d'Alene Resort", type: "resort", pricePerNight: [380,820], perRoom: true, maxGuests: 4, highlight: "Lake-view rooms + spa + golf onsite" },
      { name: "Hayden Lake 6BR", type: "house", pricePerNight: [800,1800], perRoom: false, maxGuests: 14, highlight: "Private dock + boat lift" },
    ],
    transport: [{ name: "Coeur d'Alene Tour Co. van", type: "charter", priceRange: "$160-$340", highlight: "Lake + winery + Spokane day trips" }],
    presentation: {
      moh: { tagline: "Lake resort weekend, mountain backdrop, no jet lag", description: "Coeur d'Alene is the Pacific Northwest bachelorette weekend with the airport already attached. Resort sunset cruise, lake-house wakeboard afternoon, downtown boutique walk, and a hot-tub-on-the-dock evening." },
      bestman: { tagline: "Floating golf hole + lake-house weekend", description: "Coeur d'Alene is the lake weekend with one absolute must-do: the world's only floating green at the resort. Wakeboard charter all afternoon, lakeside dinner on a barge, and a 6BR with a private dock." },
    } },

  // 20
  { id: "black-hills-sd", city: "Black Hills", state: "SD", region: "midwest",
    nearestAirport: { code: "RAP", name: "Rapid City Regional", driveMinutes: 20 },
    bestMonths: [6,7,8,9], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Mt. Rushmore Brewing", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Hill City patio + custom flights", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Saloon No. 10", type: "honky-tonk", vibe: "unhinged", priceRange: "$$", highlight: "Deadwood saloon where Wild Bill died", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Tally's Silver Spoon", cuisine: "American", priceRange: "$$$", highlight: "Rapid City brunch + dinner anchor", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Jacobs Brewhouse + Grocer", cuisine: "Brunch", priceRange: "$$", highlight: "Custer breakfast + craft coffee", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Mt. Rushmore + Crazy Horse loop", type: "tour", duration: "5 hr", pricePerPerson: [30,90], groupMin: 4, groupMax: 14, highlight: "Both monuments in one drive", bestFor: "must-do", brands: ["both"] },
      { name: "Custer State Park wildlife loop", type: "tour", duration: "4 hr", pricePerPerson: [25,80], groupMin: 4, groupMax: 14, highlight: "Bison herds + needle highway", bestFor: "afternoon", brands: ["both"] },
      { name: "Sturgis dive bar crawl", type: "tour", duration: "4 hr", pricePerPerson: [60,140], groupMin: 6, groupMax: 16, highlight: "Iconic biker bars (off-rally weeks)", bestFor: "first night", brands: ["bestman"] },
      { name: "Reptile Gardens + spa day backup", type: "spa", duration: "3 hr", pricePerPerson: [180,380], groupMin: 4, groupMax: 8, highlight: "Resort spa for the recovery day", bestFor: "downtime", brands: ["moh"] },
    ],
    lodging: [
      { name: "K Bar S Lodge (Keystone)", type: "boutique-hotel", pricePerNight: [240,460], perRoom: true, maxGuests: 4, highlight: "Mountain views + walkable to Mt. Rushmore base" },
      { name: "Hill City 5BR cabin", type: "house", pricePerNight: [500,1200], perRoom: false, maxGuests: 12, highlight: "Hot tub + fire pit + wildlife views" },
    ],
    transport: [{ name: "Black Hills Adventure Tours", type: "charter", priceRange: "$200-$500", highlight: "Custer + Rushmore + Badlands day loops" }],
    presentation: {
      moh: { tagline: "Mountain monuments + spa weekend basecamp", description: "Black Hills is the unexpected bachelorette pick — Mt. Rushmore, Crazy Horse, Custer State Park bison herds, and a 5BR Hill City cabin with a hot tub and fire pit. Better photos than people expect." },
      bestman: { tagline: "Rushmore + Sturgis dive bars + Custer State Park", description: "Black Hills is the bachelor weekend that gets remembered. Rushmore at sunrise, Custer State Park bison loop, Sturgis dive-bar crawl that made Wild Bill famous, and a cabin that fits twelve under pine trees." },
    } },

  // 21
  { id: "big-bear-lake-ca", city: "Big Bear Lake", state: "CA", region: "west",
    nearestAirport: { code: "ONT", name: "Ontario Intl", driveMinutes: 100 },
    bestMonths: [1,2,3,6,7,8,9], vibes: ["chill","balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Murray's Saloon", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Mountain dive + late karaoke", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Big Bear Lake Brewing", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Pine-forest patio + tap house", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Madlon's Steakhouse", cuisine: "Steak", priceRange: "$$$", highlight: "Cottage-style fairytale dining room", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Teddy Bear Restaurant", cuisine: "Brunch", priceRange: "$$", highlight: "Lumberjack-portion mountain breakfast", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Snow Summit / Bear Mountain ski day", type: "skiing", duration: "6 hr", pricePerPerson: [110,220], groupMin: 2, groupMax: 14, highlight: "Two LA-area resorts + lift tickets", bestFor: "winter weekend", brands: ["both"] },
      { name: "Pontoon party charter", type: "boat-cruise", duration: "4 hr", pricePerPerson: [110,240], groupMin: 6, groupMax: 14, highlight: "BYOB + Boulder Bay swim stop", bestFor: "summer", brands: ["both"] },
      { name: "Castle Rock hike + Pine Knot summit", type: "hiking", duration: "3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 14, highlight: "Lake-view summit", bestFor: "morning", brands: ["both"] },
    ],
    lodging: [
      { name: "Marina Resort", type: "boutique-hotel", pricePerNight: [220,440], perRoom: true, maxGuests: 4, highlight: "Lakefront + dock onsite" },
      { name: "Lakefront 6BR cabin", type: "house", pricePerNight: [600,1500], perRoom: false, maxGuests: 14, highlight: "Hot tub + game room + dock" },
    ],
    transport: [{ name: "Big Bear Mountain Resort shuttle", type: "shuttle", priceRange: "Free + $80 charters", highlight: "Resort-to-village loop in season" }],
    presentation: {
      moh: { tagline: "LA's mountain weekend escape", description: "Big Bear is the LA-adjacent bachelorette weekend that lets you ski in the morning and pontoon by afternoon depending on season. Lakefront cabin, fire-pit nights, and a fairytale steakhouse the bridesmaids will text about." },
      bestman: { tagline: "Ski mountain + pontoon lake + 6BR cabin", description: "Big Bear is what bachelor weekends in SoCal should be. Ski terrain in winter, pontoon charter in summer, mountain dive bars at night, and a 6BR lakefront with a dock and a hot tub." },
    } },

  // 22
  { id: "gulfport-ms", city: "Gulfport", state: "MS", region: "south",
    nearestAirport: { code: "GPT", name: "Gulfport-Biloxi", driveMinutes: 10 },
    bestMonths: [3,4,5,9,10,11], vibes: ["balanced","unhinged"], score: 5,
    nightlife: [
      { name: "Beau Rivage Casino", type: "casino", vibe: "balanced", priceRange: "$$$", highlight: "Biloxi resort with full nightclub", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Murky Waters BBQ", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Live blues + late patio crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Half Shell Oyster House", cuisine: "Seafood", priceRange: "$$$", highlight: "Char-grilled oysters institution", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Chimneys", cuisine: "Brunch", priceRange: "$$", highlight: "Bayside brunch with panoramic views", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Ship Island ferry + beach day", type: "boat-cruise", duration: "6 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 30, highlight: "Barrier-island white sand + Civil War fort", bestFor: "all day", brands: ["both"] },
      { name: "Casino pool day", type: "pool-party", duration: "5 hr", pricePerPerson: [60,180], groupMin: 4, groupMax: 14, highlight: "Beau Rivage cabanas + DJ pool", bestFor: "summer", brands: ["both"] },
      { name: "Deep-sea fishing charter", type: "fishing", duration: "6 hr", pricePerPerson: [180,340], groupMin: 4, groupMax: 8, highlight: "Snapper + grouper + bay return", bestFor: "morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Beau Rivage Resort", type: "resort", pricePerNight: [240,520], perRoom: true, maxGuests: 4, highlight: "Casino + spa + nightclub onsite" },
      { name: "Beachfront 5BR", type: "house", pricePerNight: [600,1300], perRoom: false, maxGuests: 12, highlight: "Pool + walk to bars + balcony" },
    ],
    transport: [{ name: "Coast Transit Authority", type: "shuttle", priceRange: "$3/ride + $120 charters", highlight: "Beach Boulevard loop runs late" }],
    presentation: {
      moh: { tagline: "Gulf Coast casino + beach weekend on a real budget", description: "Gulfport is the Gulf-Coast bachelorette weekend that doesn't pretend to be Florida. Casino-resort nights, Ship Island day trip on a ferry, char-grilled-oyster dinner, and lodging at half the panhandle price." },
      bestman: { tagline: "Casino weekend + deep-sea fishing + Gulf beach", description: "Gulfport is what bachelor weekends in the South can be on a real budget. Beau Rivage casino + nightclub, deep-sea fishing charter at sunrise, Ship Island white-sand day, and lodging that doesn't gouge." },
    } },

  // 23
  { id: "branson-mo", city: "Branson", state: "MO", region: "midwest",
    nearestAirport: { code: "SGF", name: "Springfield-Branson", driveMinutes: 50 },
    bestMonths: [5,6,9,10,11,12], vibes: ["chill","balanced","unhinged"], score: 5,
    nightlife: [
      { name: "Lampe Karaoke Lodge", type: "karaoke", vibe: "unhinged", priceRange: "$$", highlight: "Lake-area late karaoke institution", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Florentina's at Chateau", type: "lounge", vibe: "balanced", priceRange: "$$$", highlight: "Lakefront resort piano bar", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Top of the Rock", cuisine: "American", priceRange: "$$$$", highlight: "Cliff-edge dining over Table Rock Lake", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Billy Gail's", cuisine: "Brunch", priceRange: "$$", highlight: "Plate-sized pancakes — gas-station diner", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Table Rock Lake pontoon party", type: "boat-cruise", duration: "5 hr", pricePerPerson: [110,220], groupMin: 6, groupMax: 14, highlight: "BYOB + cliff-jump cove + sandbar", bestFor: "all day", brands: ["both"] },
      { name: "Silver Dollar City day", type: "tour", duration: "8 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 14, highlight: "Coasters + craft demos + bachelorette-friendly", bestFor: "active day", brands: ["both"] },
      { name: "Branson show night", type: "tour", duration: "2 hr", pricePerPerson: [55,140], groupMin: 4, groupMax: 30, highlight: "Comedy / drag / variety on the strip", bestFor: "first night", brands: ["both"] },
    ],
    lodging: [
      { name: "Big Cedar Lodge", type: "resort", pricePerNight: [340,720], perRoom: true, maxGuests: 4, highlight: "Bass-Pro-built lakeside resort + spa" },
      { name: "Table Rock Lake 6BR", type: "house", pricePerNight: [500,1200], perRoom: false, maxGuests: 14, highlight: "Hot tub + dock + fire pit" },
    ],
    transport: [{ name: "Branson Trolley Tours", type: "charter", priceRange: "$160-$320", highlight: "Strip + show + lake transport" }],
    presentation: {
      moh: { tagline: "Lake-house weekend with a wild card show night", description: "Branson is the Ozark bachelorette pick that earns the chaos. Table Rock pontoon all afternoon, Big Cedar resort dinner, lake-house hot tub night, and a Branson show as the wild card the bridesmaids will quote for years." },
      bestman: { tagline: "Lake weekend + go-kart town + cheap as it gets", description: "Branson is the most budget-efficient bachelor weekend in America. Table Rock lake house, Silver Dollar City coasters, dueling-piano show night, and a strip that will say yes to whatever you bring." },
    } },

  // 24
  { id: "lexington-ky", city: "Lexington", state: "KY", region: "south",
    nearestAirport: { code: "LEX", name: "Blue Grass", driveMinutes: 15 },
    bestMonths: [4,5,9,10,11], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Belle's Cocktail House", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Old-fashioned focused, Jefferson Ave", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Goodfellas Pizzeria + Whiskey Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Late slices + 80+ bourbons", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Coles 735 Main", cuisine: "Modern Southern", priceRange: "$$$", highlight: "Reservation-required dining room", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Doodles", cuisine: "Brunch", priceRange: "$$", highlight: "Eggs benedict + farm pancakes", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Bourbon Trail van day", type: "distillery-tour", duration: "8 hr", pricePerPerson: [180,340], groupMin: 4, groupMax: 14, highlight: "Woodford + Wild Turkey + Buffalo Trace", bestFor: "must-do", brands: ["both"] },
      { name: "Keeneland race meet", type: "sports-event", duration: "5 hr", pricePerPerson: [60,180], groupMin: 4, groupMax: 30, highlight: "April + October meets, paddock walks", bestFor: "all-day social", brands: ["both"] },
      { name: "Horse-farm tour Castle Hill", type: "farm-tour", duration: "2 hr", pricePerPerson: [50,90], groupMin: 4, groupMax: 16, highlight: "Thoroughbred breeding farm visits", bestFor: "morning", brands: ["both"] },
      { name: "Bourbon-blending experience at Bardstown Bourbon", type: "distillery-tour", duration: "3 hr", pricePerPerson: [180,260], groupMin: 4, groupMax: 12, highlight: "Bottle your own custom blend", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "21c Museum Hotel Lexington", type: "boutique-hotel", pricePerNight: [320,560], perRoom: true, maxGuests: 2, highlight: "Contemporary art hotel + Lockbox restaurant" },
      { name: "Downtown 5BR", type: "house", pricePerNight: [600,1300], perRoom: false, maxGuests: 12, highlight: "Walk to bars + private courtyard" },
    ],
    transport: [{ name: "Mint Julep Tours", type: "charter", priceRange: "$200-$540", highlight: "Bourbon-trail vans + horse-farm loops" }],
    presentation: {
      moh: { tagline: "Horse country, derby fashion, bourbon trail", description: "Lexington is the bachelorette weekend that earns the dress code. Keeneland race day with the bridesmaids in fascinators, Bourbon Trail tour, horse-farm visit, and a 21c boutique hotel that doubles as an art museum." },
      bestman: { tagline: "Bourbon Trail + Keeneland + bourbon-blending", description: "Lexington is the bourbon-bachelor weekend that runs serious. Trail van day across Woodford / Wild Turkey / Buffalo Trace, Keeneland race meet for the afternoon, blending experience at Bardstown, and 21c hotel rooms downtown." },
    } },

  // 25
  { id: "mendocino-ca", city: "Mendocino", state: "CA", region: "west",
    nearestAirport: { code: "STS", name: "Charles M. Schulz Sonoma", driveMinutes: 130 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Patterson's Pub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Local-favorite Main Street pub", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "MacCallum House Bar", type: "lounge", vibe: "chill", priceRange: "$$$", highlight: "Victorian B&B parlor cocktails", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Cafe Beaujolais", cuisine: "Cal-French", priceRange: "$$$$", highlight: "Garden-cottage tasting menu", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "GoodLife Cafe & Bakery", cuisine: "Brunch", priceRange: "$$", highlight: "Pastries + organic bowls + Main St patio", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Anderson Valley wineries", type: "wine-tour", duration: "5 hr", pricePerPerson: [120,240], groupMin: 4, groupMax: 14, highlight: "Pinot + Gewürztraminer at small producers", bestFor: "afternoon", brands: ["both"] },
      { name: "Big River kayak from town", type: "kayaking", duration: "3 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 14, highlight: "Estuary paddle to redwoods", bestFor: "morning", brands: ["both"] },
      { name: "Glass Beach + headlands hike", type: "hiking", duration: "3 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 14, highlight: "Sea-glass beach in Fort Bragg", bestFor: "afternoon", brands: ["both"] },
      { name: "Sound bath at Stanford Inn", type: "sound-bath", duration: "1 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 12, highlight: "Forest yoga studio + crystal bowls", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Heritage House Resort", type: "resort", pricePerNight: [380,820], perRoom: true, maxGuests: 2, highlight: "Cliff-side cottages + spa onsite" },
      { name: "Headland-view 5BR", type: "house", pricePerNight: [800,1700], perRoom: false, maxGuests: 12, highlight: "Cliff-edge deck + outdoor tub" },
    ],
    transport: [{ name: "Mendocino Transit Authority", type: "shuttle", priceRange: "$5/ride + $200 charters", highlight: "Coast + Anderson Valley loops" }],
    presentation: {
      moh: { tagline: "Coastal-Northern-California cliff weekend", description: "Mendocino is the bachelorette weekend that opens the Saturday morning kayak through the redwoods, runs an Anderson Valley wine afternoon, and lands at a cliff-side cottage with an outdoor tub at sunset. Quieter, denser memory." },
      bestman: { tagline: "Coastal kayak weekend + Anderson Valley wine", description: "Mendocino is the NorCal weekend that's not Napa. Big River kayak through redwoods, Anderson Valley pinot van day, headlands hike, and a five-bedroom on the bluff." },
    } },
];
