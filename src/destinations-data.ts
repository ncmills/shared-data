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
      { name: "Sunsphere + World's Fair Park photoshoot", type: "photoshoot", duration: "2 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 14, highlight: "Golden-hour shots at the 1982 World's Fair landmark", bestFor: "photo ops", brands: ["moh"] },
      { name: "Dollywood's DreamMore spa day", type: "spa", duration: "4 hr", pricePerPerson: [200,380], groupMin: 2, groupMax: 8, highlight: "Hill-country treatments + infinity pool in Pigeon Forge", bestFor: "recovery day", brands: ["moh"] },
      { name: "Sugarlands Distilling moonshine flight", type: "distillery-tour", duration: "3 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 14, highlight: "Appalachian moonshine + craft-whiskey flight in Gatlinburg", bestFor: "first day", brands: ["bestman"] },
      { name: "Neyland Stadium gameday (fall only)", type: "sports-event", duration: "4 hr", pricePerPerson: [85,280], groupMin: 6, groupMax: 20, highlight: "Tennessee football + Vol Navy tailgate on the river", bestFor: "autumn Saturday", brands: ["bestman"] },
      { name: "Smoky Mountain Axe House", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [30,55], groupMin: 4, groupMax: 16, highlight: "Downtown axe-throwing lanes + BYO beer", bestFor: "first night", brands: ["bestman"] },
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
      { name: "Shelburne Farms cheesemaking + tea on the porch", type: "tea-ceremony", duration: "2 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 12, highlight: "Inn-estate lawn with Lake Champlain view", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Flower-crown workshop at a Burlington florist", type: "flower-crown", duration: "1.5 hr", pricePerPerson: [60,95], groupMin: 4, groupMax: 14, highlight: "Local seasonal blooms + champagne pours", bestFor: "morning before dinner", brands: ["moh"] },
      { name: "Kingdom Trails mountain-bike shuttle", type: "biking", duration: "4 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 12, highlight: "East Burke singletrack — some of New England's best", bestFor: "active day", brands: ["bestman"] },
      { name: "Vermont Axe throwing lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [30,55], groupMin: 4, groupMax: 16, highlight: "Winooski warehouse + local beer", bestFor: "first night", brands: ["bestman"] },
      { name: "Ethan Allen Firing Range", type: "shooting-range", duration: "2 hr", pricePerPerson: [60,140], groupMin: 4, groupMax: 12, highlight: "Indoor range + rifle / pistol packages", bestFor: "active afternoon", brands: ["bestman"] },
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
      { name: "Spruce Peak Spa champagne soak + facial", type: "spa", duration: "3 hr", pricePerPerson: [220,420], groupMin: 2, groupMax: 8, highlight: "Mountain-view cedar soaking tubs + bridal package", bestFor: "bridal afternoon", brands: ["moh"] },
      { name: "Cold Hollow Cider Mill tasting + picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 14, highlight: "Fresh-pressed cider + cheese boards on the orchard lawn", bestFor: "afternoon", brands: ["moh"] },
      { name: "Stowe Cider + Idletyme brewery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [55,120], groupMin: 4, groupMax: 14, highlight: "Mountain Road tap-room hop + driver included", bestFor: "first night", brands: ["bestman"] },
      { name: "Stowe Country Club golf round", type: "golf", duration: "5 hr", pricePerPerson: [110,220], groupMin: 4, groupMax: 8, highlight: "Mansfield views from the 18th tee", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Crescent Beach luxe picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [65,140], groupMin: 4, groupMax: 12, highlight: "Catered beach spread with rosé + umbrellas", bestFor: "afternoon", brands: ["moh"] },
      { name: "Spring House Hotel spa afternoon", type: "spa", duration: "3 hr", pricePerPerson: [180,340], groupMin: 2, groupMax: 6, highlight: "Ocean-view massages at Block Island's grande-dame hotel", bestFor: "recovery day", brands: ["moh"] },
      { name: "Deep-sea fishing charter with Captain Mike", type: "fishing", duration: "5 hr", pricePerPerson: [180,320], groupMin: 4, groupMax: 8, highlight: "Striper + bluefish + open-bar ride back", bestFor: "morning", brands: ["bestman"] },
      { name: "Block Island Club tennis + cocktails", type: "sports-event", duration: "2 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 8, highlight: "Clay-court club with harbor-view bar", bestFor: "afternoon", brands: ["bestman"] },
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
      { name: "Tucson cooking class (Sonoran-style tamales)", type: "cooking-class", duration: "3 hr", pricePerPerson: [85,140], groupMin: 4, groupMax: 12, highlight: "Market tour + hands-on prep in a historic adobe", bestFor: "afternoon", brands: ["moh"] },
      { name: "Saguaro-sunset photoshoot at Gates Pass", type: "photoshoot", duration: "2 hr", pricePerPerson: [75,140], groupMin: 4, groupMax: 12, highlight: "Golden-hour silhouettes in the saguaro forest", bestFor: "photo ops", brands: ["moh"] },
      { name: "Whetstone Distillery bourbon + whiskey tasting", type: "distillery-tour", duration: "2 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 14, highlight: "Downtown Tucson grain-to-glass tasting room", bestFor: "first night", brands: ["bestman"] },
      { name: "Tucson Clay Pigeon Shooting Park", type: "shooting-range", duration: "2 hr", pricePerPerson: [75,150], groupMin: 4, groupMax: 12, highlight: "Trap + skeet stations with instructor", bestFor: "active morning", brands: ["bestman"] },
      { name: "Omni Tucson National golf round", type: "golf", duration: "5 hr", pricePerPerson: [140,260], groupMin: 4, groupMax: 8, highlight: "Catalina-foothills resort course", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Sedona red-rock sunset photoshoot", type: "photoshoot", duration: "3 hr", pricePerPerson: [95,180], groupMin: 4, groupMax: 12, highlight: "Cathedral Rock overlook shots, 45-min drive", bestFor: "photo ops", brands: ["moh"] },
      { name: "Flagstaff aerial-yoga + herbal soak", type: "spa", duration: "3 hr", pricePerPerson: [120,220], groupMin: 2, groupMax: 8, highlight: "Red-rock energy retreat + cedar plunge", bestFor: "recovery day", brands: ["moh"] },
      { name: "Mother Road Brewing tap crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 14, highlight: "Downtown beer district — 4 walkable breweries", bestFor: "first night", brands: ["bestman"] },
      { name: "Flagstaff Axe Co. throwing lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [30,55], groupMin: 4, groupMax: 16, highlight: "Downtown lanes + local beer list", bestFor: "late afternoon", brands: ["bestman"] },
      { name: "Continental Country Club golf + Peaks view", type: "golf", duration: "5 hr", pricePerPerson: [80,160], groupMin: 4, groupMax: 8, highlight: "Pine-lined fairways at 7,000 ft", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Eagle Ridge Resort spa day", type: "spa", duration: "4 hr", pricePerPerson: [180,340], groupMin: 2, groupMax: 8, highlight: "Bridal packages + rooftop hot tub at the resort", bestFor: "recovery day", brands: ["moh"] },
      { name: "Main Street flower-crown + photoshoot", type: "flower-crown", duration: "2 hr", pricePerPerson: [65,120], groupMin: 4, groupMax: 14, highlight: "Local florist workshop + brick-alley photos after", bestFor: "afternoon", brands: ["moh"] },
      { name: "Blaum Bros Distilling tour + flight", type: "distillery-tour", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 14, highlight: "Gin + bourbon + moonshine flights", bestFor: "first night", brands: ["bestman"] },
      { name: "Eagle Ridge General golf round", type: "golf", duration: "5 hr", pricePerPerson: [110,220], groupMin: 4, groupMax: 8, highlight: "Top-100 public course in the Mississippi bluffs", bestFor: "morning", brands: ["bestman"] },
      { name: "Galena Cigars + whiskey lounge", type: "cigar-bar", duration: "2 hr", pricePerPerson: [35,85], groupMin: 4, groupMax: 12, highlight: "Main Street walk-in humidor + small-batch pours", bestFor: "after dinner", brands: ["bestman"] },
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
      { name: "Horseback-ride sunset at a Wapiti guest ranch", type: "photoshoot", duration: "2 hr", pricePerPerson: [95,160], groupMin: 4, groupMax: 12, highlight: "Golden-hour trail ride through the Shoshone Forest", bestFor: "photo ops", brands: ["moh"] },
      { name: "Cody Country cooking class (Dutch-oven)", type: "cooking-class", duration: "3 hr", pricePerPerson: [75,140], groupMin: 4, groupMax: 12, highlight: "Cast-iron biscuits + bison chili over the fire", bestFor: "afternoon", brands: ["moh"] },
      { name: "Cody Firearms Experience live-fire", type: "shooting-range", duration: "2 hr", pricePerPerson: [120,280], groupMin: 4, groupMax: 10, highlight: "Old-West firearms + Tommy-gun package on the museum range", bestFor: "active morning", brands: ["bestman"] },
      { name: "Stampede Rodeo VIP chute seats", type: "sports-event", duration: "3 hr", pricePerPerson: [80,160], groupMin: 6, groupMax: 14, highlight: "Cody Stampede Fourth-of-July week premium tickets", bestFor: "summer only", brands: ["bestman"] },
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
      { name: "Shui Spa at Crowne Pointe", type: "spa", duration: "3 hr", pricePerPerson: [180,360], groupMin: 2, groupMax: 8, highlight: "Harbor-view massages + hot tub in a Victorian inn", bestFor: "recovery day", brands: ["moh"] },
      { name: "Herring Cove luxe beach picnic", type: "luxe-picnic", duration: "3 hr", pricePerPerson: [75,160], groupMin: 4, groupMax: 14, highlight: "Catered spread at the seashore sunset beach", bestFor: "afternoon", brands: ["moh"] },
      { name: "Deep-sea fishing charter from MacMillan", type: "fishing", duration: "5 hr", pricePerPerson: [160,320], groupMin: 4, groupMax: 8, highlight: "Striper + bluefish on the Cape shelf", bestFor: "morning", brands: ["bestman"] },
      { name: "Highland Links golf round in Truro", type: "golf", duration: "5 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 8, highlight: "Oldest public course in New England, Atlantic bluff-top", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Sole Lab pottery + paint class", type: "pottery-class", duration: "2 hr", pricePerPerson: [50,95], groupMin: 4, groupMax: 14, highlight: "Village of West Greenville clay studio + BYO bubbles", bestFor: "afternoon", brands: ["moh"] },
      { name: "Grand Bohemian spa afternoon", type: "spa", duration: "3 hr", pricePerPerson: [160,320], groupMin: 2, groupMax: 8, highlight: "Falls Park-adjacent spa + rooftop bar finish", bestFor: "recovery day", brands: ["moh"] },
      { name: "Dark Corner Distillery moonshine flight", type: "distillery-tour", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 14, highlight: "Main Street tasting room + house moonshine + rye", bestFor: "first night", brands: ["bestman"] },
      { name: "The Preserve at Verdae golf round", type: "golf", duration: "5 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 8, highlight: "Willard Byrd course 10 min from downtown", bestFor: "morning", brands: ["bestman"] },
      { name: "Stickee Fingaz axe-throwing", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [30,55], groupMin: 4, groupMax: 16, highlight: "Village of West Greenville lanes + beer counter", bestFor: "late afternoon", brands: ["bestman"] },
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
      { name: "Sagamore spa day with lake-view pedicure lounge", type: "spa", duration: "4 hr", pricePerPerson: [220,420], groupMin: 2, groupMax: 8, highlight: "Adirondack stone treatments + indoor pool", bestFor: "recovery day", brands: ["moh"] },
      { name: "Private dock luxe picnic + champagne sail", type: "luxe-picnic", duration: "3 hr", pricePerPerson: [110,220], groupMin: 4, groupMax: 10, highlight: "Catered lakefront spread + charter to a quiet cove", bestFor: "afternoon", brands: ["moh"] },
      { name: "Sagamore golf round (Donald Ross)", type: "golf", duration: "5 hr", pricePerPerson: [140,260], groupMin: 4, groupMax: 8, highlight: "Ross mountain course across from the resort", bestFor: "morning", brands: ["bestman"] },
      { name: "Adirondack Extreme ropes course + axe-throw", type: "axe-throwing", duration: "3 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 14, highlight: "Treetop course + throwing lanes combo package", bestFor: "active afternoon", brands: ["bestman"] },
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
      { name: "Buckstaff bathhouse traditional package", type: "spa", duration: "2 hr", pricePerPerson: [60,140], groupMin: 2, groupMax: 8, highlight: "Original 1912 bathhouse — needle showers + loofa", bestFor: "bridal afternoon", brands: ["moh"] },
      { name: "Bathhouse Row luxe-picnic + champagne", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [55,120], groupMin: 4, groupMax: 12, highlight: "Magnolia-lined promenade catered spread", bestFor: "afternoon", brands: ["moh"] },
      { name: "Crystal Ridge Distillery tour + rickhouse", type: "distillery-tour", duration: "2 hr", pricePerPerson: [25,70], groupMin: 4, groupMax: 14, highlight: "Bourbon + vodka tasting in the Ouachita foothills", bestFor: "first night", brands: ["bestman"] },
      { name: "Hot Springs Country Club golf round", type: "golf", duration: "5 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 8, highlight: "Arlington course oldest in Arkansas", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Hunting Island luxe-picnic + sunset photos", type: "luxe-picnic", duration: "3 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 14, highlight: "Driftwood-beach catered spread + bridal portraits", bestFor: "photo ops", brands: ["moh"] },
      { name: "Lowcountry cooking class (shrimp & grits)", type: "cooking-class", duration: "3 hr", pricePerPerson: [85,150], groupMin: 4, groupMax: 12, highlight: "Stone-ground grits + blue-crab technique on Bay Street", bestFor: "afternoon", brands: ["moh"] },
      { name: "Palmetto Bluff sporting clays", type: "shooting-range", duration: "2 hr", pricePerPerson: [140,260], groupMin: 4, groupMax: 10, highlight: "14-station sporting-clays course 30 min south", bestFor: "active morning", brands: ["bestman"] },
      { name: "Dataw Island golf round", type: "golf", duration: "5 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 8, highlight: "Two Tom Fazio courses 15 min east on Dataw", bestFor: "morning", brands: ["bestman"] },
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
      { name: "New Moon Spa at the Crescent Hotel", type: "spa", duration: "3 hr", pricePerPerson: [140,300], groupMin: 2, groupMax: 8, highlight: "Hilltop Victorian spa + bridal package", bestFor: "recovery day", brands: ["moh"] },
      { name: "Eureka Flower Farm crown workshop", type: "flower-crown", duration: "1.5 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Farm-grown stems + bride's photoshoot after", bestFor: "morning", brands: ["moh"] },
      { name: "Rowdy Beaver Den sports-bar night", type: "sports-event", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Downtown dive + game day crowd + late patio", bestFor: "first night", brands: ["bestman"] },
      { name: "Holiday Island golf round", type: "golf", duration: "5 hr", pricePerPerson: [60,120], groupMin: 4, groupMax: 8, highlight: "Table-Rock-adjacent course 15 min north", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Seacrets Spa bayfront afternoon", type: "spa", duration: "3 hr", pricePerPerson: [160,300], groupMin: 2, groupMax: 8, highlight: "Bay-view massages + pool pass day", bestFor: "recovery day", brands: ["moh"] },
      { name: "Beach luxe-picnic with umbrella service", type: "luxe-picnic", duration: "3 hr", pricePerPerson: [65,140], groupMin: 4, groupMax: 14, highlight: "Catered boardwalk spread + cabana setup", bestFor: "afternoon", brands: ["moh"] },
      { name: "Deep-sea fishing charter from the inlet", type: "fishing", duration: "6 hr", pricePerPerson: [160,280], groupMin: 4, groupMax: 8, highlight: "White-marlin-capital flounder + mahi", bestFor: "morning", brands: ["bestman"] },
      { name: "Ocean City Golf Club (Newport Bay)", type: "golf", duration: "5 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 8, highlight: "Two courses on the bay — 10 min from the boardwalk", bestFor: "morning", brands: ["bestman"] },
      { name: "Shorebirds baseball game (AA, Delmarva)", type: "sports-event", duration: "3 hr", pricePerPerson: [20,50], groupMin: 6, groupMax: 20, highlight: "Salisbury stadium 30 min inland + cheap beer", bestFor: "summer weekday", brands: ["bestman"] },
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
      { name: "Bellmoor Inn spa afternoon", type: "spa", duration: "3 hr", pricePerPerson: [160,320], groupMin: 2, groupMax: 8, highlight: "Quiet-block full-service spa + pool day pass", bestFor: "recovery day", brands: ["moh"] },
      { name: "Drag brunch at Aqua", type: "drag-brunch", duration: "2 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 14, highlight: "Bottomless mimosas + pool-deck queens", bestFor: "Sunday", brands: ["moh"] },
      { name: "Indian River inlet fishing charter", type: "fishing", duration: "5 hr", pricePerPerson: [160,300], groupMin: 4, groupMax: 8, highlight: "Flounder + sea bass off the Indian River", bestFor: "morning", brands: ["bestman"] },
      { name: "Kings Creek Country Club golf round", type: "golf", duration: "5 hr", pricePerPerson: [80,160], groupMin: 4, groupMax: 8, highlight: "Rees Jones course 10 min west", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Hands On Art Studio pottery class", type: "pottery-class", duration: "2 hr", pricePerPerson: [40,95], groupMin: 4, groupMax: 14, highlight: "Fish Creek ceramics barn + take-home piece", bestFor: "afternoon", brands: ["moh"] },
      { name: "Lakeside Spa at the Edgewater Resort", type: "spa", duration: "3 hr", pricePerPerson: [160,320], groupMin: 2, groupMax: 8, highlight: "Ephraim bay-view massage suite", bestFor: "recovery day", brands: ["moh"] },
      { name: "Death's Door Distillery tour (Bailey's Harbor)", type: "distillery-tour", duration: "2 hr", pricePerPerson: [30,75], groupMin: 4, groupMax: 14, highlight: "Wisconsin-grain gin + whiskey flight", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Peninsula State Park golf round", type: "golf", duration: "5 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 8, highlight: "State-park course with Green Bay views", bestFor: "morning", brands: ["bestman"] },
      { name: "Door County Fish Boil + beer night", type: "sports-event", duration: "2 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 16, highlight: "Rowleys Bay boil-over with local taps", bestFor: "first night", brands: ["bestman"] },
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
      { name: "Grand Hotel afternoon tea on the Porch", type: "tea-ceremony", duration: "2 hr", pricePerPerson: [65,110], groupMin: 4, groupMax: 12, highlight: "660-foot porch, 1887 silver service, string trio", bestFor: "bridal afternoon", brands: ["moh"] },
      { name: "Astor Spa at Mission Point", type: "spa", duration: "3 hr", pricePerPerson: [180,340], groupMin: 2, groupMax: 8, highlight: "Straits-view massages + pool lounge", bestFor: "recovery day", brands: ["moh"] },
      { name: "Arch Rock sunrise photoshoot", type: "photoshoot", duration: "2 hr", pricePerPerson: [75,140], groupMin: 4, groupMax: 12, highlight: "Iconic limestone arch + Lake Huron dawn", bestFor: "photo ops", brands: ["moh"] },
      { name: "The Jewel golf round at Grand Hotel", type: "golf", duration: "5 hr", pricePerPerson: [120,240], groupMin: 4, groupMax: 8, highlight: "Two nine-hole courses played by horse-drawn cart between", bestFor: "morning", brands: ["bestman"] },
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
      { name: "The Spa at the Coeur d'Alene Resort", type: "spa", duration: "4 hr", pricePerPerson: [220,440], groupMin: 2, groupMax: 8, highlight: "Lake-view couples' suites + cedar soaks", bestFor: "recovery day", brands: ["moh"] },
      { name: "Tubbs Hill luxe picnic + champagne", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [75,140], groupMin: 4, groupMax: 12, highlight: "Catered lakeshore spread at the rose garden overlook", bestFor: "afternoon", brands: ["moh"] },
      { name: "Up North Distillery tasting + barrel pick", type: "distillery-tour", duration: "2 hr", pricePerPerson: [30,75], groupMin: 4, groupMax: 14, highlight: "Post Falls vodka + whiskey flight", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Silverwood Theme Park Thrillville day", type: "sports-event", duration: "8 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 14, highlight: "65 rides + Boulder Beach water park 40 min north", bestFor: "summer", brands: ["bestman"] },
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
      { name: "Needles Highway luxe-picnic + photoshoot", type: "luxe-picnic", duration: "3 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 12, highlight: "Sylvan Lake catered spread + granite-spire backdrop", bestFor: "photo ops", brands: ["moh"] },
      { name: "Deadwood wild-west corseted portrait session", type: "photoshoot", duration: "2 hr", pricePerPerson: [65,130], groupMin: 4, groupMax: 12, highlight: "Historic-saloon costumed photos on Main Street", bestFor: "afternoon", brands: ["moh"] },
      { name: "Deadwood Mountain Grand poker night", type: "poker-night", duration: "4 hr", pricePerPerson: [80,260], groupMin: 4, groupMax: 10, highlight: "Live-card-room buy-in in the Wild Bill saloon district", bestFor: "first night", brands: ["bestman"] },
      { name: "Black Hills Shooting Sports range", type: "shooting-range", duration: "2 hr", pricePerPerson: [80,180], groupMin: 4, groupMax: 12, highlight: "Outdoor range in Rapid Valley + rifle packages", bestFor: "active afternoon", brands: ["bestman"] },
      { name: "Arrowhead Country Club golf round", type: "golf", duration: "5 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 8, highlight: "Rapid City pine-shadowed course", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Big Bear Spa retreat in-cabin", type: "spa", duration: "3 hr", pricePerPerson: [160,320], groupMin: 2, groupMax: 8, highlight: "In-cabin massage therapists + cedar-facial package", bestFor: "recovery day", brands: ["moh"] },
      { name: "Forest-floor luxe-picnic at Boulder Bay", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [65,130], groupMin: 4, groupMax: 12, highlight: "Alpine spread under pines with champagne", bestFor: "afternoon", brands: ["moh"] },
      { name: "Bear Valley Axe throwing at The Cave", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [30,55], groupMin: 4, groupMax: 14, highlight: "Village-adjacent lanes + coach-run rounds", bestFor: "late afternoon", brands: ["bestman"] },
      { name: "Bear Mountain Golf Course round", type: "golf", duration: "5 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 8, highlight: "Par-35 lakeside 9-hole + beer cart", bestFor: "morning", brands: ["bestman"] },
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
      { name: "Beau Rivage spa suite afternoon", type: "spa", duration: "3 hr", pricePerPerson: [160,340], groupMin: 2, groupMax: 8, highlight: "Bridal couples' rooms + Gulf-view rest lounge", bestFor: "recovery day", brands: ["moh"] },
      { name: "Ship Island luxe-picnic with catered ferry", type: "luxe-picnic", duration: "4 hr", pricePerPerson: [95,180], groupMin: 6, groupMax: 14, highlight: "White-sand barrier-island spread + rosé cooler", bestFor: "summer afternoon", brands: ["moh"] },
      { name: "Crooked Letter Brewing tap crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 14, highlight: "Ocean Springs brewery district + growler fills", bestFor: "first night", brands: ["bestman"] },
      { name: "Fallen Oak golf round (Beau Rivage)", type: "golf", duration: "5 hr", pricePerPerson: [260,460], groupMin: 4, groupMax: 8, highlight: "Tom Fazio private course reserved for resort guests", bestFor: "must-do", brands: ["bestman"] },
      { name: "Beau Rivage poker room night", type: "poker-night", duration: "4 hr", pricePerPerson: [120,360], groupMin: 4, groupMax: 10, highlight: "20+ live-poker tables in the Biloxi resort", bestFor: "first night", brands: ["bestman"] },
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
      { name: "Cedar Creek Spa at Big Cedar", type: "spa", duration: "4 hr", pricePerPerson: [220,400], groupMin: 2, groupMax: 8, highlight: "Ozark-stone saunas + lake-view soaking pools", bestFor: "recovery day", brands: ["moh"] },
      { name: "Top of the Rock lawn luxe-picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 12, highlight: "Cliff-top spread over Table Rock + champagne", bestFor: "photo ops", brands: ["moh"] },
      { name: "Copper Run Distillery tasting + rickhouse", type: "distillery-tour", duration: "2 hr", pricePerPerson: [25,60], groupMin: 4, groupMax: 14, highlight: "Ozark corn-whiskey + moonshine flights", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Payne Stewart golf round", type: "golf", duration: "5 hr", pricePerPerson: [90,180], groupMin: 4, groupMax: 8, highlight: "Championship course + 19th-hole grill", bestFor: "morning", brands: ["bestman"] },
      { name: "Andy B's Bowl + sports-bar night", type: "sports-event", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Bowling + games + beer-tower tables", bestFor: "late afternoon", brands: ["bestman"] },
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
      { name: "Keeneland paddock photoshoot + fascinators", type: "photoshoot", duration: "2 hr", pricePerPerson: [75,140], groupMin: 4, groupMax: 12, highlight: "Dress-the-bride portraits on the race-day rails", bestFor: "photo ops", brands: ["moh"] },
      { name: "The Spa at 21c afternoon", type: "spa", duration: "3 hr", pricePerPerson: [160,320], groupMin: 2, groupMax: 8, highlight: "Art-hotel bridal treatments + courtyard lounge", bestFor: "recovery day", brands: ["moh"] },
      { name: "Keene Barn flower-crown workshop", type: "flower-crown", duration: "1.5 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 14, highlight: "Horse-country farm workshop with local stems", bestFor: "afternoon", brands: ["moh"] },
      { name: "Kentucky Castle sporting clays", type: "shooting-range", duration: "2 hr", pricePerPerson: [140,260], groupMin: 4, groupMax: 10, highlight: "Full sporting-clay course on the castle estate", bestFor: "active morning", brands: ["bestman"] },
      { name: "Griffin Gate golf round", type: "golf", duration: "5 hr", pricePerPerson: [80,160], groupMin: 4, groupMax: 8, highlight: "Marriott Rees Jones course in horse country", bestFor: "morning", brands: ["bestman"] },
      { name: "Barrel House Distilling cigar + bourbon pairing", type: "cigar-bar", duration: "2 hr", pricePerPerson: [55,120], groupMin: 4, groupMax: 12, highlight: "Distillery district warehouse + cedar humidor lounge", bestFor: "after dinner", brands: ["bestman"] },
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
      { name: "Heritage House cliff-side luxe-picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [85,170], groupMin: 4, groupMax: 12, highlight: "Catered spread on the bluff + sunset champagne", bestFor: "afternoon", brands: ["moh"] },
      { name: "Mendocino Botanical Gardens photoshoot", type: "photoshoot", duration: "2 hr", pricePerPerson: [65,120], groupMin: 4, groupMax: 12, highlight: "47-acre coastal gardens + sea-cliff bridal portraits", bestFor: "photo ops", brands: ["moh"] },
      { name: "Tamar Distillery gin + whiskey tasting", type: "distillery-tour", duration: "2 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 12, highlight: "Craft botanical gin producer in Fort Bragg", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Little River Inn golf round", type: "golf", duration: "5 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 8, highlight: "Oceanfront 9-hole with Pacific-cliff fairways", bestFor: "morning", brands: ["bestman"] },
      { name: "Deep-sea salmon charter from Noyo Harbor", type: "fishing", duration: "6 hr", pricePerPerson: [180,320], groupMin: 4, groupMax: 8, highlight: "Pacific salmon + rockfish (seasonal)", bestFor: "morning", brands: ["bestman"] },
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

  // 26
  { id: "nantucket-ma", city: "Nantucket", state: "MA", region: "northeast",
    nearestAirport: { code: "ACK", name: "Nantucket Memorial", driveMinutes: 10 },
    bestMonths: [6,7,8,9], vibes: ["chill","balanced"], score: 8,
    nightlife: [
      { name: "The Chicken Box", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Island institution — live band every summer night since 1948", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Straight Wharf bar", type: "bar", vibe: "balanced", priceRange: "$$$", highlight: "Harbor-deck cocktails off the ferry dock", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Topper's at The Wauwinet lounge", type: "lounge", vibe: "chill", priceRange: "$$$$", highlight: "Jacket-optional piano lounge at the grande-dame inn", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"] },
      { name: "Gazebo at the Boat Basin", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Dockside raw-bar pub with the sailing crowd", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "Cru Oyster Bar", cuisine: "Raw bar", priceRange: "$$$$", highlight: "Straight-Wharf oyster lunch with the harbor at your elbow", bestFor: "lunch", groupFriendly: true, brands: ["moh"] },
      { name: "The Pearl", cuisine: "Coastal fine-dining", priceRange: "$$$$", highlight: "Upstairs dining room on Federal Street — reservation-only institution", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Sayle's Seafood", cuisine: "Clam shack", priceRange: "$$", highlight: "Lobster-roll picnic off Washington Street, no frills", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Black-Eyed Susan's", cuisine: "Brunch", priceRange: "$$", highlight: "BYOB cottage brunch — the line is the tradition", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Private sunset sail on Endeavor", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [95,180], groupMin: 4, groupMax: 20, highlight: "Charter sloop out of Straight Wharf — captain pours the rosé", bestFor: "first night", brands: ["moh"] },
      { name: "Tea service at White Elephant porch", type: "tea-ceremony", duration: "1.5 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 12, highlight: "Harbor-lawn tea with scones + pastries + linen everything", bestFor: "afternoon", brands: ["moh"] },
      { name: "Flower-crown workshop at Flowers on Chestnut", type: "flower-crown", duration: "1.5 hr", pricePerPerson: [65,110], groupMin: 4, groupMax: 12, highlight: "Local blooms + champagne in a cobblestone-lane studio", bestFor: "morning before dinner", brands: ["moh"] },
      { name: "Sankaty Head Golf Club round", type: "golf", duration: "5 hr", pricePerPerson: [280,520], groupMin: 4, groupMax: 8, highlight: "Bluff links with the red-striped lighthouse on 6 — member guest-play only", bestFor: "morning", brands: ["bestman"] },
      { name: "Striped-bass charter out of Madaket", type: "fishing", duration: "5 hr", pricePerPerson: [220,380], groupMin: 4, groupMax: 8, highlight: "Captain-run striper + bluefish run — back by lunch", bestFor: "morning", brands: ["bestman"] },
      { name: "Cisco Brewers beach bar", type: "brewery-tour", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 16, highlight: "Open-air brewery + distillery + winery on one lot", bestFor: "afternoon", brands: ["bestman"] },
      { name: "'Sconset bluff walk + Sankaty Light", type: "walking-tour", duration: "2 hr", pricePerPerson: [0,0], groupMin: 2, groupMax: 20, highlight: "Rose-covered cottages along the eastern bluff to the red-striped lighthouse", bestFor: "morning", brands: ["both"] },
      { name: "Madaket Beach sunset picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [75,150], groupMin: 4, groupMax: 14, highlight: "Catered beach spread for the island's best sunset", bestFor: "first night", brands: ["both"] },
    ],
    lodging: [
      { name: "White Elephant", type: "resort", pricePerNight: [680,1400], perRoom: true, maxGuests: 2, highlight: "Harbor-front grande dame — rose garden, Brant Point walk, breakfast on the porch" },
      { name: "'Sconset 5BR shingled cottage", type: "house", pricePerNight: [1400,3200], perRoom: false, maxGuests: 10, highlight: "Rose-trellised east-bluff rental — private yard + outdoor shower" },
    ],
    transport: [{ name: "Hy-Line ferry from Hyannis", type: "shuttle", priceRange: "$80/person RT (fast ferry)", highlight: "1 hr from Cape — book ahead in summer" }],
    presentation: {
      moh: { tagline: "The shingled-cottage, linen-everything weekend", description: "Nantucket is the bachelorette weekend the bridesmaids will be screenshotting for months. Private sloop at sunset, oyster lunch off Straight Wharf, tea service on the White Elephant porch, a 'Sconset cottage with roses on the trellis — the quiet-luxury setting the Pinterest board was already built around." },
      bestman: { tagline: "Striper charters, Sankaty Head, and the Chicken Box at midnight", description: "Nantucket keeps it honest under the shingles: striped-bass charter before 9 and back for lunch, Sankaty Head links in the afternoon, Cisco out back for the brewery hour, Chicken Box for the live band at midnight." },
    } },

  // 27
  { id: "marthas-vineyard-ma", city: "Martha's Vineyard", state: "MA", region: "northeast",
    nearestAirport: { code: "MVY", name: "Martha's Vineyard", driveMinutes: 10 },
    bestMonths: [6,7,8,9], vibes: ["chill","balanced"], score: 8,
    nightlife: [
      { name: "Black Dog Tavern", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Vineyard Haven harbor-front institution since 1971", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Ritz Café", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Oak Bluffs dive + live music most nights — the late one", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Nobnocket Gin bar at Beach Plum Inn", type: "lounge", vibe: "chill", priceRange: "$$$", highlight: "Menemsha cliff lounge for sunset cocktails before dinner", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"] },
      { name: "Offshore Ale Co.", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Oak Bluffs brewpub with peanut-shells-on-the-floor energy", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "State Road Restaurant", cuisine: "Farm-to-table", priceRange: "$$$$", highlight: "West Tisbury cottage with the up-island farm connection", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Beach Plum Inn", cuisine: "Coastal fine-dining", priceRange: "$$$$", highlight: "Menemsha hilltop with the island's best sunset seating", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Larsen's Fish Market", cuisine: "Clam shack", priceRange: "$$", highlight: "Menemsha dock lobster + chowder — BYO wine on the jetty", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Art Cliff Diner", cuisine: "Brunch", priceRange: "$$", highlight: "Vineyard Haven brunch — the line is also the tradition", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Katama Bay private sail charter", type: "sunset-cruise", duration: "3 hr", pricePerPerson: [110,210], groupMin: 4, groupMax: 16, highlight: "Edgartown catboat charter with rosé + cheese board", bestFor: "first night", brands: ["moh"] },
      { name: "Plein-air painting class at Featherstone Center", type: "painting-class", duration: "2 hr", pricePerPerson: [65,120], groupMin: 4, groupMax: 12, highlight: "Oak Bluffs arts barn — take home a vineyard watercolor", bestFor: "afternoon", brands: ["moh"] },
      { name: "Tennis clinic at Farm Neck", type: "sports-event", duration: "2 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 8, highlight: "Har-tru courts + pro clinic at the island's social club", bestFor: "morning", brands: ["moh"] },
      { name: "Menemsha lobster-boat day + clam bake", type: "fishing", duration: "5 hr", pricePerPerson: [210,380], groupMin: 4, groupMax: 10, highlight: "Pot-haul with a working captain + shore bake on Lobsterville", bestFor: "morning", brands: ["bestman"] },
      { name: "Vineyard Golf Club round (Edgartown)", type: "golf", duration: "5 hr", pricePerPerson: [220,420], groupMin: 4, groupMax: 8, highlight: "Members-guest all-organic course near Katama", bestFor: "morning", brands: ["bestman"] },
      { name: "Chappy Ferry + striped-bass surfcast", type: "fishing", duration: "4 hr", pricePerPerson: [140,260], groupMin: 4, groupMax: 8, highlight: "Chappaquiddick wade-fishing with a local guide", bestFor: "morning", brands: ["bestman"] },
      { name: "Gay Head Cliffs + Aquinnah Lighthouse walk", type: "walking-tour", duration: "2 hr", pricePerPerson: [0,20], groupMin: 2, groupMax: 20, highlight: "Clay cliffs + Wampanoag-land lighthouse at the west end", bestFor: "afternoon", brands: ["both"] },
      { name: "Up-island farm + vineyard tour", type: "food-tour", duration: "4 hr", pricePerPerson: [95,180], groupMin: 4, groupMax: 14, highlight: "Grey Barn + Chilmark Coffee + Morning Glory farm stops", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "Harbor View Hotel Edgartown", type: "resort", pricePerNight: [580,1200], perRoom: true, maxGuests: 2, highlight: "Edgartown Harbor icon — porch rockers face the lighthouse walk" },
      { name: "Chilmark 5BR farmhouse", type: "house", pricePerNight: [1200,2800], perRoom: false, maxGuests: 12, highlight: "Up-island acreage with pond + outdoor shower + private beach rights" },
    ],
    transport: [{ name: "Steamship Authority ferry from Woods Hole", type: "shuttle", priceRange: "$20/person RT walk-on", highlight: "45 min from the Cape — car reservations book months ahead" }],
    presentation: {
      moh: { tagline: "Up-island farmhouse weekend with the private catboat", description: "Martha's Vineyard is the bachelorette weekend that quiets down on purpose. Katama Bay sail with the bride tribe, Featherstone painting class in the afternoon, Beach Plum Inn at sunset over Menemsha harbor, farmhouse up-island with nobody around for a mile." },
      bestman: { tagline: "Menemsha pot-haul, Edgartown links, Ritz at midnight", description: "The Vineyard runs a real weekend: Menemsha lobster-boat morning, Vineyard Golf Club round, Larsen's lobster at the jetty, and the Ritz in Oak Bluffs for the late set. Farmhouse up-island that sleeps twelve." },
    } },

  // 28
  { id: "newport-ri", city: "Newport", state: "RI", region: "northeast",
    nearestAirport: { code: "PVD", name: "T.F. Green", driveMinutes: 40 },
    bestMonths: [5,6,7,8,9,10], vibes: ["balanced"], score: 8,
    nightlife: [
      { name: "The Chanler at Cliff Walk cocktail terrace", type: "lounge", vibe: "chill", priceRange: "$$$$", highlight: "Ocean-Drive mansion terrace — champagne at sunset", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"] },
      { name: "Midtown Oyster Bar rooftop", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Thames Street rooftop with harbor view", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Landing", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Bowen's Wharf deck-bar — yacht-week crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "One Pelham East", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Lower Thames live-band bar — cover-song energy", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Mooring", cuisine: "Seafood", priceRange: "$$$", highlight: "Bowen's Wharf — the bag-of-donuts starter is the tradition", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Bouchard Restaurant", cuisine: "French fine-dining", priceRange: "$$$$", highlight: "Romantic Lower Thames room — white-tablecloth anniversary energy", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Anthony's Seafood", cuisine: "Raw bar", priceRange: "$$", highlight: "Middletown dock steamers + lobster roll — paper-plate vibe", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Belle's Cafe at Newport Shipyard", cuisine: "Brunch", priceRange: "$$", highlight: "Working-yacht-yard brunch — mimosa + boats on the hoist", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "12-meter America's-Cup yacht charter", type: "sunset-cruise", duration: "2.5 hr", pricePerPerson: [120,220], groupMin: 4, groupMax: 20, highlight: "Sail a former America's-Cup boat out of Fort Adams — captain + crew included", bestFor: "first night", brands: ["both"] },
      { name: "Cliff Walk + Breakers mansion tour", type: "walking-tour", duration: "3 hr", pricePerPerson: [35,60], groupMin: 2, groupMax: 20, highlight: "3.5-mile ocean walk along the Gilded-Age mansions + Vanderbilt Breakers tour", bestFor: "afternoon", brands: ["both"] },
      { name: "Tea at Rosecliff or Marble House", type: "tea-ceremony", duration: "1.5 hr", pricePerPerson: [75,140], groupMin: 4, groupMax: 12, highlight: "Mansion-lawn tea service with scones + champagne", bestFor: "afternoon", brands: ["moh"] },
      { name: "Flower-arranging class at Newport Mansions greenhouse", type: "flower-crown", duration: "2 hr", pricePerPerson: [80,140], groupMin: 4, groupMax: 12, highlight: "Build a bouquet from the estate garden with the resident florist", bestFor: "morning", brands: ["moh"] },
      { name: "Newport Vineyards + Greenvale tasting tour", type: "wine-tour", duration: "4 hr", pricePerPerson: [95,180], groupMin: 4, groupMax: 14, highlight: "Aquidneck-Island winery van + cheese board on the lawn", bestFor: "afternoon", brands: ["moh"] },
      { name: "Newport National Golf Club round", type: "golf", duration: "5 hr", pricePerPerson: [160,320], groupMin: 4, groupMax: 8, highlight: "Bay-links-style course 10 min from downtown", bestFor: "morning", brands: ["bestman"] },
      { name: "Sporting clays at Preservation Shooting Preserve", type: "shooting-range", duration: "3 hr", pricePerPerson: [150,280], groupMin: 4, groupMax: 12, highlight: "25-station clays course 30 min up Route 138", bestFor: "morning", brands: ["bestman"] },
      { name: "Sakonnet striped-bass charter", type: "fishing", duration: "5 hr", pricePerPerson: [190,340], groupMin: 4, groupMax: 8, highlight: "Narragansett-Bay striper + bluefish run with a local captain", bestFor: "morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Chanler at Cliff Walk", type: "boutique-hotel", pricePerNight: [680,1400], perRoom: true, maxGuests: 2, highlight: "Ocean-Drive mansion hotel on the Cliff Walk — every room themed to a historic era" },
      { name: "Ocean-Drive 6BR shingled estate", type: "house", pricePerNight: [1400,3200], perRoom: false, maxGuests: 14, highlight: "Private-drive rental near Castle Hill — ocean lawn + outdoor shower" },
    ],
    transport: [{ name: "Viking Tours trolley + van", type: "charter", priceRange: "$180-$420", highlight: "Mansion + vineyard loops + late pickup from the wharf" }],
    presentation: {
      moh: { tagline: "Gilded-Age mansions, America's-Cup sails, and tea at Rosecliff", description: "Newport is the bachelorette weekend that understood the assignment from the Pinterest board down. America's-Cup sail out of Fort Adams, tea service on a Bellevue Avenue mansion lawn, Cliff Walk in linen, Chanler terrace at sunset, flower-arranging class in the Gilded-Age greenhouse — the quiet-luxury coastal weekend." },
      bestman: { tagline: "12-meter sail, Ocean Drive, and the Thames-Street late set", description: "Newport works for a guys' weekend in ways most coastal towns don't. America's-Cup yacht charter out of Fort Adams, clay shoot up the bay in the morning, Newport National in the afternoon, Thames Street for the live-band hour, and an Ocean-Drive shingled rental that sleeps fourteen." },
    } },

  // 29
  { id: "kennebunkport-me", city: "Kennebunkport", state: "ME", region: "northeast",
    nearestAirport: { code: "PWM", name: "Portland Jetport", driveMinutes: 40 },
    bestMonths: [6,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Batson River Brewing & Distilling", type: "beer-garden", vibe: "balanced", priceRange: "$$", highlight: "Dock Square brewery-distillery with an outdoor firepit bar", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Burleigh at Kennebunkport Inn", type: "lounge", vibe: "chill", priceRange: "$$$", highlight: "Piano-bar parlor in the historic inn — fireside martinis", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"] },
      { name: "Federal Jack's", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Harbor-deck brewpub where Shipyard was born", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Hurricane Restaurant bar", type: "bar", vibe: "chill", priceRange: "$$$", highlight: "Dock Square window seats over the Kennebunk River", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Earth at Hidden Pond", cuisine: "Farm-to-table", priceRange: "$$$$", highlight: "Ken Oringer woodland-resort dining — garden-to-table tasting menu", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Tides Beach Club", cuisine: "Coastal fine-dining", priceRange: "$$$$", highlight: "Goose Rocks Beach veranda — oyster lunch with the Atlantic at your feet", bestFor: "lunch", groupFriendly: true, brands: ["moh"] },
      { name: "The Clam Shack", cuisine: "Clam shack", priceRange: "$$", highlight: "Dock-Square lobster-roll window — best-in-Maine debate starts here", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Mornings in Paris patisserie", cuisine: "Patisserie", priceRange: "$", highlight: "French pastry window + espresso on Ocean Avenue", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Cape Arundel Golf Club round", type: "golf", duration: "5 hr", pricePerPerson: [180,340], groupMin: 4, groupMax: 8, highlight: "Walker Cup-era links the Bushes played — ocean holes on the back nine", bestFor: "morning", brands: ["bestman"] },
      { name: "Rugosa lobster-boat ride + pot-haul", type: "fishing", duration: "2 hr", pricePerPerson: [45,85], groupMin: 4, groupMax: 20, highlight: "Kennebunk River harbor tour with a working lobsterman", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Sporting clays at the Old Orchard clays club", type: "shooting-range", duration: "3 hr", pricePerPerson: [140,260], groupMin: 4, groupMax: 12, highlight: "Woodland-station clays course 20 min south", bestFor: "morning", brands: ["bestman"] },
      { name: "Private sunset sail on the Pineapple Ketch", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [85,160], groupMin: 4, groupMax: 12, highlight: "Kennebunk-River ketch charter with sparkling on the deck", bestFor: "first night", brands: ["moh"] },
      { name: "Hidden Pond spa afternoon", type: "spa", duration: "3 hr", pricePerPerson: [240,460], groupMin: 2, groupMax: 8, highlight: "Tree-house treatment rooms in the pine forest — bridal package available", bestFor: "recovery day", brands: ["moh"] },
      { name: "Blueberry-pie baking + Goat Island Lighthouse tour", type: "cooking-class", duration: "3 hr", pricePerPerson: [90,160], groupMin: 4, groupMax: 10, highlight: "Maine-blueberry pie class + drive out to Goat Island Light", bestFor: "afternoon", brands: ["moh"] },
      { name: "Ocean Avenue bike + Walker's Point overlook", type: "biking", duration: "2 hr", pricePerPerson: [35,75], groupMin: 2, groupMax: 14, highlight: "Coastal-road ride past Walker's Point + St. Ann's chapel", bestFor: "morning", brands: ["both"] },
      { name: "Goose Rocks Beach luxe picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 12, highlight: "Three-mile tidal beach with a catered spread + umbrellas", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "The White Barn Inn", type: "resort", pricePerNight: [620,1300], perRoom: true, maxGuests: 2, highlight: "Relais & Châteaux in Kennebunk — rose garden + candlelit barn dining onsite" },
      { name: "Cape Porpoise 5BR shingled house", type: "house", pricePerNight: [1100,2400], perRoom: false, maxGuests: 12, highlight: "Working-harbor cottage with screen porch + outdoor shower + walk to the pier" },
    ],
    transport: [{ name: "Intown Trolley + private van", type: "charter", priceRange: "$24/person day-pass + $180 charters", highlight: "Dock Square ↔ Goose Rocks loop runs summer; van for golf + dinner" }],
    presentation: {
      moh: { tagline: "Shingled cottages, blueberry pie, and oyster lunch on Goose Rocks", description: "Kennebunkport is the bachelorette weekend that reads like a Nancy Meyers set. Pineapple-ketch sail at sunset, Tides Beach Club oyster lunch with the Atlantic at your feet, blueberry-pie class in the afternoon, Hidden Pond spa the next morning, a Cape Porpoise cottage with roses on the trellis — linen everything." },
      bestman: { tagline: "Cape Arundel links, lobster-boat ride, Federal Jack's at midnight", description: "Kennebunkport keeps the coastal-Maine weekend honest: Cape Arundel round the Bushes played, Rugosa pot-haul in the afternoon, clay shoot up the road, Clam Shack lobster-roll lunch, Federal Jack's late, and a working-harbor rental in Cape Porpoise that sleeps twelve." },
    } },

  // ─────────────────────────────────────────────────────────────────
  // Phase 2A — 8 overlap cities migrated to canonical 2026-04-16
  // Cities present in BOTH ~/maid-of-honor-hq/src/data and
  // ~/plan-my-party/src/data. Each entry has bilateral item sets:
  // MOH-voiced bachelorette venues, BESTMAN-voiced bachelor venues,
  // and shared "both" items (brunch classics, pedal taverns, etc).
  // Per-repo destinations still live alongside until Phase 2B.
  // ─────────────────────────────────────────────────────────────────

  // 30 — Nashville, TN
  { id: "nashville-tn", city: "Nashville", state: "TN", region: "south",
    nearestAirport: { code: "BNA", name: "Nashville International Airport", driveMinutes: 15 },
    bestMonths: [3,4,5,6,9,10], vibes: ["balanced","unhinged"], score: 10,
    nightlife: [
      { name: "White Limozeen", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Pink-and-palm rooftop at the Graduate — Dolly-inspired, peak bachelorette aesthetic", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Smart casual to dressy" },
      { name: "L.A. Jackson", type: "rooftop", vibe: "chill", priceRange: "$$$", highlight: "Gulch rooftop at the Thompson with skyline views and craft cocktails", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], dressCode: "Smart casual to upscale" },
      { name: "FGL House", type: "rooftop", vibe: "unhinged", priceRange: "$$", highlight: "Florida Georgia Line's multi-level Broadway rooftop — country-bar energy, big-group friendly", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Smart casual" },
      { name: "The Patterson House", type: "speakeasy", vibe: "chill", priceRange: "$$$", highlight: "Hidden craft cocktail speakeasy with a no-standing policy — intimate and upscale", reservationNeeded: true, groupFriendly: false, lateNight: false, brands: ["both"] },
      { name: "Pinewood Social", type: "lounge", vibe: "balanced", priceRange: "$$", highlight: "Bowling lanes, karaoke, cocktails, and food in one spot — a bachelorette one-stop-shop", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "Lipstick Lounge", type: "lounge", vibe: "balanced", priceRange: "$$", highlight: "East Nashville LGBTQ+ favorite with karaoke, drag, and an inclusive late-night crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "Tootsies Orchid Lounge", type: "honky-tonk", vibe: "unhinged", priceRange: "$", highlight: "Three floors of live country music right on Broadway — the original honky-tonk", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Nudie's Honky Tonk", type: "honky-tonk", vibe: "unhinged", priceRange: "$$", highlight: "Three floors of live music, vintage country vibe, Cadillac over the bar", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Losers Bar & Grill", type: "dive-bar", vibe: "balanced", priceRange: "$", highlight: "Divey Midtown favorite with live music and cheap drinks off the tourist strip", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Zanies Comedy Club", type: "comedy-club", vibe: "balanced", priceRange: "$$", highlight: "Nashville's top comedy club with national touring headliners", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "Biscuit Love (Gulch)", cuisine: "Southern Brunch", priceRange: "$$", highlight: "Bonuts and East Nasty biscuits, line down the block by 9am — the brunch institution", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Hattie B's Hot Chicken", cuisine: "Southern / Hot Chicken", priceRange: "$", highlight: "The quintessential Nashville hot chicken experience — line up early, order the Damn Hot", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Adele's", cuisine: "Farm-to-Table", priceRange: "$$$", highlight: "Jonathan Waxman's Gulch dinner spot with seasonal Italian and stunning group tables", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Party Fowl", cuisine: "Hot Chicken / Brunch", priceRange: "$$", highlight: "Hot chicken with boozy slushies and bottomless mimosas — the recovery brunch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Milk & Honey Nashville", cuisine: "Brunch / Cafe", priceRange: "$$", highlight: "Light-filled Gulch brunch with espresso flights and housemade pastries — photogenic", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Yolan", cuisine: "Italian Fine Dining", priceRange: "$$$$", highlight: "The Joseph's elevated Italian — pasta tasting menu, dramatic dining room, the splurge dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Martin's Bar-B-Que Joint", cuisine: "BBQ", priceRange: "$", highlight: "Whole-hog BBQ with a laid-back vibe — perfect for big groups", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Bajo Sexto Taco", cuisine: "Mexican / Tacos", priceRange: "$", highlight: "Late-night taco spot attached to Robert's Western World — post-bar essential", bestFor: "late-night", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Nashville Pedal Tavern", type: "brewery-tour", duration: "2 hr", pricePerPerson: [35,50], groupMin: 6, groupMax: 16, highlight: "BYOB pedal-powered pub crawl through downtown — the iconic Nashville photo op", bestFor: "afternoon", brands: ["both"] },
      { name: "Nashville Brunch Crawl (Music City Food Tours)", type: "brunch-crawl", duration: "3 hr", pricePerPerson: [60,85], groupMin: 2, groupMax: 15, highlight: "Guided 3-stop brunch crawl with bottomless mimosas", bestFor: "morning", brands: ["both"] },
      { name: "Nashville Party Barge (Percy Priest Lake)", type: "boat-cruise", duration: "3-4 hr", pricePerPerson: [60,110], groupMin: 6, groupMax: 25, highlight: "BYOB party barge with swimming and a photo dock", bestFor: "day party", brands: ["both"] },
      { name: "TopGolf Nashville", type: "golf", duration: "2-3 hr", pricePerPerson: [30,65], groupMin: 2, groupMax: 30, highlight: "Multi-level driving range with full bar — works for any crew energy", bestFor: "afternoon", brands: ["both"] },
      { name: "Wildflower Crown Bar", type: "flower-crown", duration: "1.5 hr", pricePerPerson: [45,75], groupMin: 4, groupMax: 16, highlight: "Build-your-own flower crown workshop with prosecco", bestFor: "pre-night-out", brands: ["moh"] },
      { name: "Nashville Line Dance Class", type: "dance-class", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 30, highlight: "Private line-dancing lesson with a real Nashville cowgirl", bestFor: "pre-honky-tonk", brands: ["moh"] },
      { name: "Studio Goddess Burlesque", type: "burlesque-class", duration: "1.5 hr", pricePerPerson: [45,80], groupMin: 6, groupMax: 20, highlight: "Most-booked bachelorette dance studio — private burlesque with costume prompts", bestFor: "pre-dinner", brands: ["moh"] },
      { name: "Boudoir Bachelorette Studio", type: "boudoir", duration: "2 hr", pricePerPerson: [120,250], groupMin: 1, groupMax: 8, highlight: "Private group boudoir with hair, makeup, curated outfits", bestFor: "bride keepsake", brands: ["moh"] },
      { name: "Pins Mechanical Co.", type: "axe-throwing", duration: "1-2 hr", pricePerPerson: [10,25], groupMin: 4, groupMax: 40, highlight: "Duckpin bowling, pinball, and axe throwing with craft cocktails", bestFor: "group competition", brands: ["bestman"] },
      { name: "Nashville Gun Club (Sporting Clays)", type: "shooting-range", duration: "2 hr", pricePerPerson: [40,75], groupMin: 4, groupMax: 20, highlight: "Sporting clays and trap shooting just outside the city", bestFor: "morning", brands: ["bestman"] },
      { name: "Nashville Craft Brewery Tour", type: "brewery-tour", duration: "3-4 hr", pricePerPerson: [50,80], groupMin: 4, groupMax: 15, highlight: "Guided tour of Nashville's best craft breweries with tastings", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Graduate Nashville", type: "boutique-hotel", pricePerNight: [220,420], perRoom: true, maxGuests: 4, highlight: "Vanderbilt-area boutique with White Limozeen rooftop on top — central, photogenic" },
      { name: "The Joseph", type: "boutique-hotel", pricePerNight: [400,800], perRoom: true, maxGuests: 4, highlight: "SoBro luxury with museum-quality art collection and Yolan downstairs" },
      { name: "Broadway Party House (Airbnb)", type: "airbnb", pricePerNight: [500,1200], perRoom: false, maxGuests: 16, highlight: "Full house rental near Broadway with rooftop deck and party space" },
    ],
    transport: [
      { name: "Nashville Pedal Tavern", type: "party-bus", priceRange: "$450-$900 for 2 hr", highlight: "BYOB pedal-powered — transport and the activity in one" },
      { name: "Glitter Wagon Nashville", type: "party-bus", priceRange: "$600-$1,400 for 4 hr", highlight: "Decked-out party buses with disco lights and aux cords" },
    ],
    presentation: {
      moh: { tagline: "Cowboy boots, brunch crawls, and rooftop sunsets — the Last Rodeo capital", description: "Nashville is the bachelorette capital of America for a reason. Pedal taverns roll past honky-tonks, every restaurant has a brunch line on Saturday morning, and the rooftop bars stay packed until last call. Her crew can do a full Last Rodeo weekend without trying — boots, hats, and string lights are everywhere. Lean into Music Row, the Gulch, and East Nashville for the most curated weekend." },
      bestman: { tagline: "Honky-tonks, hot chicken, and zero regrets", description: "Broadway is basically a conveyor belt of bachelor parties — and for good reason. Live music pours out of every door, pedal taverns clog the streets, and the late-night hot chicken scene is undefeated. Nashville delivers whether the crew wants cowboy boots or craft cocktails." },
    } },

  // 31 — Charleston, SC
  { id: "charleston-sc", city: "Charleston", state: "SC", region: "south",
    nearestAirport: { code: "CHS", name: "Charleston International Airport", driveMinutes: 20 },
    bestMonths: [3,4,5,9,10,11], vibes: ["balanced","chill"], score: 9,
    nightlife: [
      { name: "The Watch (Restoration Hotel)", type: "rooftop", vibe: "chill", priceRange: "$$$", highlight: "King Street rooftop with skyline + harbor sunset views", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], dressCode: "Smart casual to dressy" },
      { name: "The Cocktail Club", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Upper King cocktail bar with rooftop garden patio — mixology focus", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Republic Garden & Lounge", type: "lounge", vibe: "unhinged", priceRange: "$$", highlight: "Upper King late-night dance lounge — closest Charleston comes to a club", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Belmont", type: "cocktail-bar", vibe: "chill", priceRange: "$$$", highlight: "Upper King speakeasy-style cocktail bar with old-school glamour and great vinyl", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "Bin 152 Wine Bar", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "Intimate wine bar in an 1870s building with cheese boards and natural wine", reservationNeeded: false, groupFriendly: false, lateNight: false, brands: ["moh"] },
      { name: "Cane Rhum Bar", type: "cocktail-bar", vibe: "chill", priceRange: "$$", highlight: "Tropical rum bar on King Street — frozen daiquiris, rum flights, vacation vibes", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "The Commodore", type: "dive-bar", vibe: "unhinged", priceRange: "$", highlight: "Tiny dance bar with DJs and a late-night party vibe — gets rowdy", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Revelry Brewing", type: "beer-garden", vibe: "balanced", priceRange: "$$", highlight: "Craft brewery with a rooftop deck and harbor views on Upper King", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
      { name: "Uptown Social", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Multi-level bar with live music, dancing, and rooftop on Upper King", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Husk", cuisine: "Modern Southern", priceRange: "$$$$", highlight: "Sean Brock's iconic Southern restaurant in a Queen Street home — the pilgrimage dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "FIG (Food Is Good)", cuisine: "Modern American", priceRange: "$$$$", highlight: "Acclaimed chef-driven dinner spot near Marion Square — the locals' top rec", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "167 Raw Oyster Bar", cuisine: "Seafood / Oysters", priceRange: "$$$", highlight: "King Street oyster bar with Maine-to-Florida lineup — quick, lively, perfect lunch", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Poogan's Porch", cuisine: "Southern", priceRange: "$$$", highlight: "Historic Victorian house turned Southern restaurant — porch seating, peak aesthetic", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Hominy Grill", cuisine: "Lowcountry Brunch", priceRange: "$$", highlight: "Charleston classic for shrimp & grits + buttermilk biscuits — recovery institution", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "The Ordinary", cuisine: "Seafood Brasserie", priceRange: "$$$$", highlight: "Mike Lata's Upper King seafood brasserie in a converted bank — raw-bar destination", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Lewis Barbecue", cuisine: "Texas-style BBQ", priceRange: "$$", highlight: "Austin-style BBQ in Charleston — brisket and ribs by the pound", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Halls Chophouse", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "Legendary Charleston steakhouse with live gospel brunch on Sundays", bestFor: "group-dinner", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Charleston Harbor Sunset Sail", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [50,100], groupMin: 4, groupMax: 25, highlight: "Schooner from the City Marina at sunset with BYOB — iconic Charleston moment", bestFor: "evening", brands: ["both"] },
      { name: "Charleston Carriage Tour", type: "tour", duration: "1 hr", pricePerPerson: [25,50], groupMin: 2, groupMax: 16, highlight: "Mule-drawn carriage tour through the historic district — touristy but iconic", bestFor: "morning", brands: ["both"] },
      { name: "Cooking Class at Charleston Cooks", type: "cooking-class", duration: "2-3 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 16, highlight: "Hands-on Lowcountry class with shrimp & grits, biscuits, pralines", bestFor: "afternoon", brands: ["both"] },
      { name: "Charleston Food Tours", type: "food-tour", duration: "2.5 hr", pricePerPerson: [65,85], groupMin: 2, groupMax: 15, highlight: "Walking food tour through downtown with 5-6 tastings", bestFor: "afternoon", brands: ["both"] },
      { name: "King Street Boutique Crawl", type: "shopping-tour", duration: "2-3 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 12, highlight: "Self-guided crawl of Hampden, Worthwhile, Croghan's — outfit hunting + iced coffee", bestFor: "afternoon", brands: ["moh"] },
      { name: "Charleston Tea Garden + Tasting", type: "tea-ceremony", duration: "half day", pricePerPerson: [40,80], groupMin: 2, groupMax: 12, highlight: "America's only working tea plantation — very Bridgerton-coded", bestFor: "morning", brands: ["moh"] },
      { name: "Charleston Boudoir Studio", type: "boudoir", duration: "2 hr", pricePerPerson: [180,320], groupMin: 1, groupMax: 6, highlight: "Private boudoir in a historic Charleston studio with hair and makeup", bestFor: "bride keepsake", brands: ["moh"] },
      { name: "Magnolia Plantation Garden Walk + Luxe Picnic", type: "luxe-picnic", duration: "3 hr", pricePerPerson: [70,150], groupMin: 4, groupMax: 14, highlight: "Historic gardens with a styled picnic and grazing board", bestFor: "afternoon", brands: ["moh"] },
      { name: "Charleston Surf Lessons (Folly Beach)", type: "beach", duration: "2 hr", pricePerPerson: [55,80], groupMin: 2, groupMax: 10, highlight: "Group surf lessons at Folly Beach — no experience needed", bestFor: "morning", brands: ["bestman"] },
      { name: "Patriots Point Links", type: "golf", duration: "4-5 hr", pricePerPerson: [60,120], groupMin: 4, groupMax: 16, highlight: "Waterfront golf with views of Fort Sumter and the Ravenel Bridge", bestFor: "morning", brands: ["bestman"] },
      { name: "Wild Blue Ropes Adventure Park", type: "adventure-park", duration: "2-3 hr", pricePerPerson: [40,60], groupMin: 2, groupMax: 20, highlight: "Aerial ropes course and zip lines at Isle of Palms", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Restoration Hotel", type: "boutique-hotel", pricePerNight: [350,750], perRoom: true, maxGuests: 4, highlight: "King Street boutique with The Watch rooftop bar — central, beautiful, group-friendly" },
      { name: "Belmond Charleston Place", type: "hotel", pricePerNight: [350,700], perRoom: true, maxGuests: 4, highlight: "Grand downtown hotel with rooftop pool and full-service spa" },
      { name: "Charleston Historic House (Airbnb)", type: "airbnb", pricePerNight: [500,1300], perRoom: false, maxGuests: 12, highlight: "Restored 1850s Charleston single-house with piazza, garden, walkable to King" },
    ],
    transport: [
      { name: "Charleston Party Bus", type: "party-bus", priceRange: "$450-$1,000 for 4 hr", highlight: "For groups of 8+ — handles King Street and downtown loops" },
      { name: "Charleston Pedicab", type: "shuttle", priceRange: "$5-$20 per ride", highlight: "Bicycle rickshaws perfect for short downtown hops — fun, scenic, photogenic" },
    ],
    presentation: {
      moh: { tagline: "Sunset rooftops, oyster bars, and a King Street boutique crawl in pastel light", description: "Charleston is the bachelorette city for the bride who wants Southern charm without Nashville's chaos. King Street is a curated boutique-and-restaurant strip, the rooftop bars catch a sunset over the harbor, and the historic district reads like a movie set. Lean Upper King for nightlife + lower King for shopping, and pair with a beach day at Sullivan's Island or a sailing afternoon for variety." },
      bestman: { tagline: "Southern charm with a side of late-night chaos on King Street", description: "Charleston blends cobblestone elegance with a surprisingly rowdy bar scene. King Street is the main artery, lined with rooftop bars and speakeasies, while Sullivan's Island and Folly Beach deliver daytime escapes. Perfect for groups that want to look classy in the group chat photos and still close down the bars." },
    } },

  // 32 — Savannah, GA
  { id: "savannah-ga", city: "Savannah", state: "GA", region: "south",
    nearestAirport: { code: "SAV", name: "Savannah/Hilton Head International Airport", driveMinutes: 15 },
    bestMonths: [3,4,5,9,10,11], vibes: ["chill","balanced"], score: 8,
    nightlife: [
      { name: "Rocks on the Roof (Bohemian Hotel)", type: "rooftop", vibe: "chill", priceRange: "$$", highlight: "Casual riverfront rooftop with panoramic Savannah River views", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Congress Street Up", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beloved multi-level bar on Congress with a rooftop deck", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Olde Pink House", type: "speakeasy", vibe: "chill", priceRange: "$$$", highlight: "18th-century mansion with a candlelit tavern basement and coastal cocktails", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Smart casual to dressy" },
      { name: "Prohibition", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Prohibition-era speakeasy aesthetic with craft cocktails and live jazz", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"], dressCode: "Dressy casual" },
      { name: "Planter's Tavern", type: "lounge", vibe: "chill", priceRange: "$$$", highlight: "Below-stairs tavern under the Olde Pink House with live piano", reservationNeeded: false, groupFriendly: false, lateNight: false, brands: ["moh"] },
      { name: "Club One Jefferson", type: "drag-show", vibe: "unhinged", priceRange: "$$", highlight: "Iconic drag shows — home of Lady Chablis from Midnight in the Garden", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Savannah Smiles Dueling Pianos", type: "dueling-piano", vibe: "unhinged", priceRange: "$$", highlight: "Dueling piano bar where the crowd picks the songs", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Barrelhouse South", type: "bar", vibe: "unhinged", priceRange: "$", highlight: "College-meets-party crowd on Congress Street with cheap drinks", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Grey", cuisine: "Modern Southern", priceRange: "$$$$", highlight: "James Beard-recognized restaurant in a 1938 Greyhound terminal — best dinner in Savannah", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Collins Quarter", cuisine: "Australian-inspired Brunch", priceRange: "$$$", highlight: "Savannah's most photogenic brunch — floral decor, lavender lattes, eggs benedict", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Husk Savannah", cuisine: "Southern", priceRange: "$$$", highlight: "Sean Brock's Savannah outpost with garden seating", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Clary's Cafe", cuisine: "Southern Breakfast", priceRange: "$$", highlight: "Classic Savannah diner — the recovery brunch after a big night", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Alligator Soul", cuisine: "Coastal Southern", priceRange: "$$$", highlight: "Subterranean candlelit restaurant with fresh seafood and slow-cooked plates", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Huey's on the River", cuisine: "New Orleans-style Southern", priceRange: "$$", highlight: "Beignets, bloody marys, and river views on the waterfront", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Mrs. Wilkes Dining Room", cuisine: "Southern / Family-style", priceRange: "$", highlight: "Legendary communal Southern lunch — get in line early", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Zunzi's", cuisine: "South African / Sandwiches", priceRange: "$", highlight: "Cult-favorite South African sandwiches — the Conquistador is legendary", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Crystal Beer Parlor", cuisine: "American / Pub", priceRange: "$$", highlight: "Savannah's oldest restaurant with great burgers and craft beer", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Savannah Ghost Tours (Sixth Sense)", type: "walking-tour", duration: "2 hr", pricePerPerson: [25,40], groupMin: 2, groupMax: 20, highlight: "Historic ghost tour through cobblestone squares — signature Savannah night", bestFor: "evening", brands: ["both"] },
      { name: "Savannah River Sunset Cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [40,75], groupMin: 6, groupMax: 40, highlight: "Narrated cruise past the historic waterfront at golden hour", bestFor: "evening", brands: ["both"] },
      { name: "Historic Squares Walking Tour", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [20,35], groupMin: 2, groupMax: 20, highlight: "Guided stroll through Savannah's 22 historic squares", bestFor: "morning", brands: ["both"] },
      { name: "Tybee Island Beach Day", type: "beach", duration: "4-6 hr", pricePerPerson: [0,20], groupMin: 2, groupMax: 30, highlight: "30-minute drive to Savannah's beach with rentals and pier bars", bestFor: "chill day", brands: ["both"] },
      { name: "Forsyth Park Luxe Picnic", type: "luxe-picnic", duration: "2-3 hr", pricePerPerson: [60,120], groupMin: 4, groupMax: 16, highlight: "Styled picnic under live oaks at Forsyth's fountain — grazing boards and champagne", bestFor: "afternoon", brands: ["moh"] },
      { name: "Tarot Reading at Hoodoo Bleu", type: "tarot-reading", duration: "1 hr", pricePerPerson: [35,75], groupMin: 1, groupMax: 10, highlight: "Group tarot at one of Savannah's most celebrated spiritual shops", bestFor: "afternoon", brands: ["moh"] },
      { name: "Candle Making at Savannah Candle Co.", type: "candle-making", duration: "1.5 hr", pricePerPerson: [50,70], groupMin: 4, groupMax: 14, highlight: "Blend custom scents and pour candles to take home", bestFor: "afternoon", brands: ["moh"] },
      { name: "Mansion on Forsyth Afternoon Tea", type: "tea-ceremony", duration: "2 hr", pricePerPerson: [49,65], groupMin: 2, groupMax: 16, highlight: "Tiered sandwiches, scones, petit fours inside the Kessler Collection mansion", bestFor: "afternoon", brands: ["moh"] },
      { name: "Hearse Ghost Tours (Haunted Pub Crawl)", type: "tour", duration: "1.5 hr", pricePerPerson: [25,40], groupMin: 2, groupMax: 12, highlight: "Haunted pub crawl in an actual hearse through America's most haunted city", bestFor: "evening", brands: ["bestman"] },
      { name: "Savannah Bananas Game", type: "sports-event", duration: "3 hr", pricePerPerson: [25,75], groupMin: 4, groupMax: 20, highlight: "Viral baseball entertainment with on-field antics and party atmosphere", bestFor: "evening", brands: ["bestman"] },
      { name: "Ghost Coast Distillery Tour", type: "distillery-tour", duration: "1 hr", pricePerPerson: [15,25], groupMin: 2, groupMax: 20, highlight: "Savannah's first distillery since Prohibition with tastings", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Bohemian Hotel Savannah Riverfront", type: "boutique-hotel", pricePerNight: [200,500], perRoom: true, maxGuests: 4, highlight: "Riverfront boutique with Rocks on the Roof — unbeatable waterfront location" },
      { name: "The Mansion on Forsyth Park", type: "boutique-hotel", pricePerNight: [250,550], perRoom: true, maxGuests: 4, highlight: "Autograph Collection on Forsyth Park with bold art, pool, full spa" },
      { name: "Historic District House (Airbnb)", type: "airbnb", pricePerNight: [400,1000], perRoom: false, maxGuests: 14, highlight: "Restored Victorian in the Historic District with a courtyard" },
    ],
    transport: [
      { name: "Savannah Pedicab", type: "shuttle", priceRange: "$5-$20 per ride", highlight: "Bicycle rickshaws — the most charming way to move between squares" },
      { name: "Savannah Party Bus", type: "party-bus", priceRange: "$400-$900 for 4 hr", highlight: "Essential for groups doing the bar crawl — drivers know every stop" },
    ],
    presentation: {
      moh: { tagline: "Spanish moss, ghost tours, and rooftop cocktails in America's most hauntingly beautiful city", description: "Savannah is the bachelorette destination for the bride who wants Southern gothic magic without the noise. Twenty-two oak-canopied squares form a walkable playground of wine bars, speakeasies, and historic architecture draped in Spanish moss. Do a ghost tour by night, a Forsyth Park luxe picnic by afternoon, and close out on a rooftop with a Savannah Smash." },
      bestman: { tagline: "Open containers, oak-lined streets, and Southern mayhem", description: "Savannah is one of the few US cities where you can walk around with an open drink, which basically makes the entire historic district one big bar. Add Spanish moss, haunted pub crawls, and a killer food scene, and you have a low-key legendary party destination that punches way above its weight." },
    } },

  // 33 — New Orleans, LA
  { id: "new-orleans-la", city: "New Orleans", state: "LA", region: "south",
    nearestAirport: { code: "MSY", name: "Louis Armstrong New Orleans International", driveMinutes: 25 },
    bestMonths: [2,3,4,5,10,11], vibes: ["balanced","unhinged"], score: 10,
    nightlife: [
      { name: "The Carousel Bar (Hotel Monteleone)", type: "lounge", vibe: "chill", priceRange: "$$$", highlight: "Iconic rotating carousel bar — slow spinning, Vieux Carré cocktails, photo-op required", reservationNeeded: false, groupFriendly: false, lateNight: false, brands: ["both"] },
      { name: "The Sazerac Bar (Roosevelt)", type: "lounge", vibe: "chill", priceRange: "$$$", highlight: "1920s-era hotel bar with original murals — the Sazerac at the Sazerac", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"], dressCode: "Smart casual" },
      { name: "Bar Tonique", type: "cocktail-bar", vibe: "chill", priceRange: "$$", highlight: "Locals' classic-cocktail bar — Sazeracs, Vieux Carrés, no-frills perfection", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Harrah's New Orleans Casino", type: "casino", vibe: "balanced", priceRange: "$$$", highlight: "The only land-based casino in NOLA — table games, slots, poker steps from Bourbon", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Cane & Table", type: "cocktail-bar", vibe: "chill", priceRange: "$$$", highlight: "French Quarter rum bar with tropical cocktails in a candlelit courtyard", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "Bacchanal Wine", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "Bywater backyard wine bar with live music and a tapas kitchen", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"] },
      { name: "Hot Tin (Pontchartrain Hotel)", type: "rooftop", vibe: "chill", priceRange: "$$$", highlight: "Garden District rooftop bar with skyline views — quieter than the Quarter", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Smart casual" },
      { name: "Pat O'Brien's", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Home of the Hurricane cocktail with dueling pianos and a flaming fountain", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Cat's Meow Karaoke", type: "karaoke", vibe: "unhinged", priceRange: "$", highlight: "Bourbon Street karaoke bar with a balcony — sing to the street", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Lafitte's Blacksmith Shop Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "One of the oldest bars in America — candlelit and atmospheric", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Brennan's", cuisine: "Creole", priceRange: "$$$$", highlight: "Original bananas-Foster brunch since 1946 — pink dining room, peak French Quarter elegance", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Compere Lapin", cuisine: "Caribbean / Creole", priceRange: "$$$", highlight: "Nina Compton's chef-driven Caribbean-Creole — James Beard winner, group dinner of the trip", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Commander's Palace", cuisine: "Creole Fine Dining", priceRange: "$$$$", highlight: "Legendary Garden District restaurant with 25-cent martini lunches", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Country Club (Drag Brunch)", cuisine: "Southern Brunch", priceRange: "$$$", highlight: "Bywater estate with famous Sunday drag brunch and clothing-optional pool", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Atchafalaya", cuisine: "Creole Brunch", priceRange: "$$", highlight: "Bloody Mary bar so famous it's its own destination — recovery brunch institution", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Coquette", cuisine: "Modern Southern", priceRange: "$$$", highlight: "Garden District corner bistro with seasonal Southern menu and great wine list", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Willie Mae's Scotch House", cuisine: "Southern / Fried Chicken", priceRange: "$", highlight: "America's best fried chicken — James Beard Award winner", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Cochon Butcher", cuisine: "Cajun Sandwiches", priceRange: "$", highlight: "Casual butcher-shop sandwich spot for a quick lunch between activities", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Acme Oyster House", cuisine: "Seafood / Oysters", priceRange: "$$", highlight: "Chargrilled oysters and po'boys in the French Quarter since 1910", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Cafe Du Monde", cuisine: "Beignets / Coffee", priceRange: "$", highlight: "24/7 beignets and chicory coffee — non-negotiable NOLA stop", bestFor: "late-night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Frenchmen Street Music Crawl", type: "tour", duration: "3-4 hr", pricePerPerson: [40,100], groupMin: 2, groupMax: 20, highlight: "Self-guided or guided crawl of Frenchmen's jazz bars — the locals' choice over Bourbon", bestFor: "evening", brands: ["both"] },
      { name: "New Orleans School of Cooking", type: "cooking-class", duration: "2-3 hr", pricePerPerson: [35,90], groupMin: 4, groupMax: 20, highlight: "Hands-on Cajun-Creole class with gumbo, jambalaya, and pralines", bestFor: "afternoon", brands: ["both"] },
      { name: "Cajun Swamp Tour (Pearl River)", type: "boat-cruise", duration: "3 hr", pricePerPerson: [30,90], groupMin: 2, groupMax: 25, highlight: "Airboat tour through Louisiana swamps — alligators, cypress trees, only-in-NOLA content", bestFor: "half day", brands: ["both"] },
      { name: "Haunted Ghost Pub Crawl", type: "tour", duration: "2-3 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 25, highlight: "Guided pub crawl through the French Quarter's haunted bars — history + cocktails", bestFor: "evening", brands: ["both"] },
      { name: "Voodoo + Cemetery Walking Tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [25,50], groupMin: 2, groupMax: 20, highlight: "Lafayette #1 cemetery and voodoo history walk — peak witchy bachelorette content", bestFor: "afternoon", brands: ["moh"] },
      { name: "Tarot at Bottom of the Cup Tea Room", type: "tarot-reading", duration: "30-60 min", pricePerPerson: [25,80], groupMin: 1, groupMax: 8, highlight: "NOLA's oldest occult shop — book a series for the bridal party", bestFor: "afternoon", brands: ["moh"] },
      { name: "Tijon Parfumerie — Class 101", type: "perfume-making", duration: "2.5 hr", pricePerPerson: [175,195], groupMin: 2, groupMax: 20, highlight: "Build a custom scent from raw accords inside Tijon's French Quarter fragrance lab", bestFor: "afternoon", brands: ["moh"] },
      { name: "Audubon Park Luxe Picnic", type: "luxe-picnic", duration: "2-3 hr", pricePerPerson: [60,130], groupMin: 4, groupMax: 12, highlight: "Pre-styled luxe picnic with linens, florals, and grazing board", bestFor: "afternoon", brands: ["moh"] },
      { name: "Steamboat Natchez Jazz Cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [45,85], groupMin: 2, groupMax: 30, highlight: "Live jazz dinner cruise on an authentic paddlewheel steamboat", bestFor: "evening", brands: ["bestman"] },
      { name: "Stumpys Hatchet House", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [20,35], groupMin: 4, groupMax: 24, highlight: "BYOB axe throwing lanes perfect for group competition", bestFor: "afternoon", brands: ["bestman"] },
      { name: "NOLA Brewing Company Tour", type: "brewery-tour", duration: "1.5 hr", pricePerPerson: [10,20], groupMin: 2, groupMax: 20, highlight: "Free Friday taproom tours at one of NOLA's top craft breweries", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Monteleone", type: "hotel", pricePerNight: [200,450], perRoom: true, maxGuests: 4, highlight: "Historic French Quarter hotel with the famous Carousel Bar on-site" },
      { name: "The Roosevelt New Orleans", type: "hotel", pricePerNight: [250,550], perRoom: true, maxGuests: 4, highlight: "Grand Waldorf Astoria with rooftop pool and Sazerac Bar" },
      { name: "Hotel Peter & Paul", type: "boutique-hotel", pricePerNight: [280,600], perRoom: true, maxGuests: 4, highlight: "Marigny boutique in a converted 19th-century church and rectory — peak Pinterest stay" },
      { name: "Ace Hotel New Orleans", type: "boutique-hotel", pricePerNight: [180,380], perRoom: true, maxGuests: 4, highlight: "Trendy Warehouse District hotel with rooftop pool and great restaurant" },
      { name: "French Quarter Courtyard House (Airbnb)", type: "airbnb", pricePerNight: [550,1400], perRoom: false, maxGuests: 12, highlight: "Historic French Quarter house with private courtyard and balconies on Royal Street" },
    ],
    transport: [
      { name: "NOLA Party Bus", type: "party-bus", priceRange: "$450-$1,000 for 4 hr", highlight: "Garden District ↔ French Quarter ↔ Frenchmen runs" },
      { name: "St. Charles Streetcar", type: "shuttle", priceRange: "$1.25 per ride", highlight: "Historic streetcar Canal → Garden District → Audubon — scenic transport with character" },
    ],
    presentation: {
      moh: { tagline: "Drag brunch, tarot readings, ghost tours, and a hurricane in a courtyard bar", description: "NOLA is the bachelorette city for the crew that wants something with character — not the basic Vegas/Nashville run. Drag brunches are an institution, ghost tours are unironically cool, tarot readers line Jackson Square, and the courtyard cocktail bars are pure magic. Lean French Quarter, Frenchmen Street, and Bywater for the curated weekend." },
      bestman: { tagline: "Bourbon Street is just the appetizer", description: "NOLA is the godfather of American party cities. Bourbon Street gets the headlines, but Frenchmen Street has the real music, the Garden District has the charm, and the food is the best in the country. Open containers everywhere, 24/7 bars, and a city that treats every weekend like Mardi Gras." },
    } },

  // 34 — Austin, TX
  { id: "austin-tx", city: "Austin", state: "TX", region: "south",
    nearestAirport: { code: "AUS", name: "Austin-Bergstrom International Airport", driveMinutes: 18 },
    bestMonths: [3,4,5,10,11], vibes: ["balanced","unhinged"], score: 9,
    nightlife: [
      { name: "Rainey Street Historic District", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Block of converted bungalows-turned-bars with patios and food trucks", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Pete's Dueling Piano Bar", type: "dueling-piano", vibe: "unhinged", priceRange: "$$", highlight: "Dirty 6th dueling pianos — request songs, sing along, zero judgment", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Roosevelt Room", type: "cocktail-bar", vibe: "chill", priceRange: "$$$", highlight: "Award-winning craft cocktail bar with Prohibition-era vibes", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Geraldine's (Hotel Van Zandt)", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Rainey Street rooftop with live music and skyline views", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Smart casual to dressy" },
      { name: "Half Step", type: "cocktail-bar", vibe: "chill", priceRange: "$$$", highlight: "Intimate Rainey Street craft cocktail bar with a best-in-class menu", reservationNeeded: true, groupFriendly: false, lateNight: false, brands: ["moh"] },
      { name: "Midnight Cowboy", type: "speakeasy", vibe: "chill", priceRange: "$$$", highlight: "Reservation-only speakeasy with bespoke cocktails — intimate and unforgettable", reservationNeeded: true, groupFriendly: false, lateNight: false, brands: ["moh"], dressCode: "Dressy casual" },
      { name: "Rain on 4th", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Austin's iconic LGBTQ+ nightclub with drag shows and a raucous late-night floor", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "Maggie Mae's (6th Street)", type: "bar", vibe: "unhinged", priceRange: "$", highlight: "Multi-level 6th Street bar with rooftop and live music — party central", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Kung Fu Saloon", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Arcade bar with skeeball, air hockey, and a young party crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Barbarella", type: "club", vibe: "unhinged", priceRange: "$", highlight: "Red River indie dance club with themed nights and cheap covers", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Franklin Barbecue", cuisine: "Texas BBQ", priceRange: "$$", highlight: "The most famous BBQ in Texas — go at lunch, arrive early, order the full tray", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Uchi", cuisine: "Japanese / New American", priceRange: "$$$$", highlight: "James Beard-winning sushi — book the omakase and watch everyone go silent", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Josephine House", cuisine: "American Brunch", priceRange: "$$$", highlight: "Garden cottage brunch in Clarksville with the best mimosas and avocado toast in Austin", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Perla's Seafood & Oyster Bar", cuisine: "Coastal Seafood", priceRange: "$$$", highlight: "South Congress seafood with a gorgeous patio, oysters on ice, frozen rosé", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Launderette", cuisine: "Italian-American", priceRange: "$$$", highlight: "East Austin converted laundromat with handmade pasta and weekend brunch", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Torchy's Tacos", cuisine: "Tacos", priceRange: "$", highlight: "Austin taco legend — the Trailer Park (trashy) is essential", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Kemuri Tatsu-ya", cuisine: "Japanese / BBQ Fusion", priceRange: "$$$", highlight: "Texas BBQ meets Japanese izakaya — smoked brisket ramen is insane", bestFor: "dinner", groupFriendly: true, brands: ["bestman"] },
      { name: "Home Slice Pizza", cuisine: "Pizza", priceRange: "$", highlight: "New York-style slices on South Congress — essential late-night food", bestFor: "late-night", groupFriendly: true, brands: ["bestman"] },
      { name: "Kerbey Lane Cafe", cuisine: "Brunch / American", priceRange: "$$", highlight: "24-hour Austin institution — pancakes and queso at 3am", bestFor: "late-night", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Lake Austin Pontoon Rental", type: "boat-cruise", duration: "4-6 hr", pricePerPerson: [80,160], groupMin: 6, groupMax: 18, highlight: "Pontoon on Lake Austin with swimming, paddleboards, a cooler — the marquee day", bestFor: "day party", brands: ["both"] },
      { name: "TopGolf Austin", type: "golf", duration: "2-3 hr", pricePerPerson: [30,60], groupMin: 2, groupMax: 30, highlight: "Driving range with full bar, food, and competitive games", bestFor: "afternoon", brands: ["both"] },
      { name: "Austin Brew Bus Tour", type: "brewery-tour", duration: "4 hr", pricePerPerson: [50,80], groupMin: 6, groupMax: 20, highlight: "Guided tour of 3-4 Austin craft breweries with tastings and transport", bestFor: "afternoon", brands: ["both"] },
      { name: "Barton Springs Pool", type: "pool-party", duration: "2-3 hr", pricePerPerson: [5,10], groupMin: 2, groupMax: 30, highlight: "Natural spring-fed pool in the heart of the city — 68°F year-round", bestFor: "recovery day", brands: ["both"] },
      { name: "Texas Hill Country Winery Tour", type: "wine-tour", duration: "full day", pricePerPerson: [90,180], groupMin: 6, groupMax: 16, highlight: "Guided shuttle to Becker and Flat Creek Estate — tasting fees and picnic included", bestFor: "day trip", brands: ["moh"] },
      { name: "Drag Brunch at Elysium", type: "drag-brunch", duration: "3 hr", pricePerPerson: [45,85], groupMin: 4, groupMax: 20, highlight: "Austin drag brunch with full performances and bottomless mimosas", bestFor: "morning", brands: ["moh"] },
      { name: "Flower Crown Workshop (Lovely Poppy)", type: "flower-crown", duration: "1.5 hr", pricePerPerson: [55,85], groupMin: 4, groupMax: 14, highlight: "Fresh floral crowns — wearable all night, perfect for photos", bestFor: "afternoon", brands: ["moh"] },
      { name: "Sound Bath at Austin Salt Cave", type: "sound-bath", duration: "1 hr", pricePerPerson: [45,75], groupMin: 4, groupMax: 14, highlight: "Crystal bowl sound healing in a Himalayan salt cave", bestFor: "recovery", brands: ["moh"] },
      { name: "San Marcos River Tubing (Texas State Tubes)", type: "beach", duration: "3-4 hr", pricePerPerson: [20,35], groupMin: 2, groupMax: 30, highlight: "Lazy river float trip with coolers — quintessential Texas summer move", bestFor: "day activity", brands: ["bestman"] },
      { name: "Urban Axes Austin", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,40], groupMin: 4, groupMax: 24, highlight: "BYOB axe-throwing lanes with tournament brackets", bestFor: "evening", brands: ["bestman"] },
      { name: "COTA Karting", type: "go-karts", duration: "2 hr", pricePerPerson: [50,100], groupMin: 4, groupMax: 20, highlight: "Pro-style karting at the F1 track — race your crew on a real circuit", bestFor: "afternoon", brands: ["bestman"] },
      { name: "The Range at Austin", type: "shooting-range", duration: "1.5 hr", pricePerPerson: [30,75], groupMin: 2, groupMax: 16, highlight: "Indoor range with machine guns, pistols, and rifles for groups", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Van Zandt", type: "boutique-hotel", pricePerNight: [280,600], perRoom: true, maxGuests: 4, highlight: "Music-forward boutique on Rainey with a rooftop pool and live music lobby" },
      { name: "South Congress Hotel", type: "boutique-hotel", pricePerNight: [250,550], perRoom: true, maxGuests: 4, highlight: "Design-forward hotel on SoCo with a pool and excellent restaurant" },
      { name: "Lake Austin Waterfront Rental (Airbnb)", type: "airbnb", pricePerNight: [800,2200], perRoom: false, maxGuests: 14, highlight: "Lakefront house with private dock and paddleboards" },
      { name: "The Driskill Hotel", type: "hotel", pricePerNight: [280,600], perRoom: true, maxGuests: 4, highlight: "Austin's iconic 1886 landmark downtown — historic, grand, a classic splurge" },
    ],
    transport: [
      { name: "Austin Party Bus", type: "party-bus", priceRange: "$500-$1,400 for 4 hr", highlight: "Rainey Street and East Sixth crawl logistics for groups of 8+" },
      { name: "Hill Country Winery Shuttle", type: "shuttle", priceRange: "$80-$160 per person", highlight: "Pre-booked tour shuttle handles Hill Country wineries" },
    ],
    presentation: {
      moh: { tagline: "Lake days, Rainey rooftops, Hill Country wineries, and taco trucks at 2am — Texas does bachelorette", description: "Austin has everything Nashville has but swaps honky-tonks for rooftop bars and adds a lake. Rainey Street's bungalow bars keep the vibe intimate and eclectic, while Lake Austin pontoon rentals deliver the marquee day activity. The Texas Hill Country wineries are 30 minutes out for a vineyard afternoon, and the brunch scene on East Sixth is legitimately one of the best in the country." },
      bestman: { tagline: "Keep it weird. Keep it loud. Keep it going until sunrise", description: "Austin combines live music on 6th Street with craft cocktails on Rainey, world-class BBQ, and enough outdoor activities to cure any hangover. It's one of the few cities where you can tube a river at noon, eat brisket at 3, and rage until 2am without leaving a 5-mile radius." },
    } },

  // 35 — Miami, FL
  { id: "miami-fl", city: "Miami", state: "FL", region: "south",
    nearestAirport: { code: "MIA", name: "Miami International Airport", driveMinutes: 25 },
    bestMonths: [11,12,1,2,3,4], vibes: ["balanced","unhinged"], score: 10,
    nightlife: [
      { name: "Broken Shaker (Freehand)", type: "cocktail-bar", vibe: "chill", priceRange: "$$$", highlight: "Award-winning backyard cocktail bar at the Freehand — laid-back, photogenic", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Sugar (East Hotel / Brickell)", type: "rooftop", vibe: "chill", priceRange: "$$$", highlight: "40th-floor Brickell rooftop with Asian-inspired cocktails and bay views", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], dressCode: "Smart casual to dressy" },
      { name: "Wynwood Marketplace", type: "lounge", vibe: "balanced", priceRange: "$$", highlight: "Open-air Wynwood market with rotating bars, food trucks, and live DJs", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Komodo Lounge", type: "lounge", vibe: "unhinged", priceRange: "$$$$", highlight: "Brickell's most-photographed dining + dancing destination — bottle service, fashion crowd", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"], dressCode: "Dressy / club" },
      { name: "Sweet Liberty", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Award-winning Sunset Harbour cocktail bar with mid-century vibes", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "Lobby Bar at the Faena", type: "lounge", vibe: "chill", priceRange: "$$$$", highlight: "Faena's iconic gilded lobby — the most photographed room in Miami", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Resort upscale" },
      { name: "LIV Nightclub (Fontainebleau)", type: "club", vibe: "unhinged", priceRange: "$$$$", highlight: "Miami's most famous mega-club — celebrity DJs and insane production", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Upscale nightclub attire" },
      { name: "E11EVEN Miami", type: "club", vibe: "unhinged", priceRange: "$$$$", highlight: "24/7 ultraclub in downtown — literally never closes", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Upscale nightclub attire" },
      { name: "Ball & Chain (Little Havana)", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Live salsa, craft cocktails, and Cuban culture on Calle Ocho", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Mango's Tropical Cafe", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Ocean Drive mega-bar with live Latin music, dancers, and nonstop energy", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Joe's Stone Crab", cuisine: "Seafood", priceRange: "$$$$", highlight: "Iconic South Beach institution since 1913 — stone crab claws, Key lime pie", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Carbone Miami", cuisine: "Italian American", priceRange: "$$$$", highlight: "Old-school Italian fine dining — spicy rigatoni vodka, hardest res in Miami", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mandolin Aegean Bistro", cuisine: "Greek / Mediterranean", priceRange: "$$$", highlight: "Buena Vista garden Greek bistro — string lights, blue-and-white tablecloths", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Pura Vida", cuisine: "Healthy / Brunch", priceRange: "$$", highlight: "Bright, fresh acai bowls and avocado toasts — recovery brunch HQ", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Salt Wynwood", cuisine: "Modern American", priceRange: "$$", highlight: "Wynwood patio brunch with bottomless cocktails surrounded by murals", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Doce Provisions", cuisine: "Cuban / Modern American", priceRange: "$$", highlight: "Little Havana brunch and lunch favorite with a beautiful patio", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
      { name: "Versailles Restaurant", cuisine: "Cuban", priceRange: "$$", highlight: "Iconic Little Havana — cafe con leche and croquetas", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
      { name: "KYU", cuisine: "Asian BBQ / Fusion", priceRange: "$$$", highlight: "Wynwood wood-fired Asian BBQ — the short rib is legendary", bestFor: "group-dinner", groupFriendly: true, brands: ["bestman"] },
      { name: "La Sandwicherie", cuisine: "French / Sandwiches", priceRange: "$", highlight: "Late-night South Beach sandwich counter open until 5am — post-club essential", bestFor: "late-night", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Miami Yacht Charter (Half Day)", type: "boat-cruise", duration: "4 hr", pricePerPerson: [100,350], groupMin: 6, groupMax: 20, highlight: "Private yacht with captain — Biscayne Bay swim stops, sandbar party, sunset return", bestFor: "marquee day", brands: ["both"] },
      { name: "Wynwood Walls + Mural Tour", type: "mural-tour", duration: "2 hr", pricePerPerson: [25,50], groupMin: 2, groupMax: 20, highlight: "Self-guided or guided walk through the iconic Wynwood mural district", bestFor: "morning", brands: ["both"] },
      { name: "Nikki Beach Day Club", type: "pool-party", duration: "all day", pricePerPerson: [60,200], groupMin: 4, groupMax: 20, highlight: "Iconic white-cabana beach club with day beds, DJ sets, rosé service", bestFor: "day party", brands: ["both"] },
      { name: "Everglades Airboat Tour", type: "boat-cruise", duration: "2 hr", pricePerPerson: [30,55], groupMin: 2, groupMax: 20, highlight: "Airboat ride through the Everglades with alligator encounters", bestFor: "half day", brands: ["both"] },
      { name: "Little Havana Food & Culture Tour", type: "food-tour", duration: "2.5 hr", pricePerPerson: [55,100], groupMin: 2, groupMax: 16, highlight: "Walking tour of Calle Ocho with Cuban coffee, cigars, croquetas, and live music", bestFor: "afternoon", brands: ["both"] },
      { name: "Lapis Spa (Fontainebleau)", type: "spa", duration: "half day", pricePerPerson: [200,450], groupMin: 2, groupMax: 10, highlight: "Fontainebleau spa with hammam, mineral pools, and group treatment rooms", bestFor: "recovery", brands: ["moh"] },
      { name: "Boudoir Miami Studio", type: "boudoir", duration: "2 hr", pricePerPerson: [180,320], groupMin: 1, groupMax: 6, highlight: "South Beach designer studio for group + bride boudoir with HMU", bestFor: "bride keepsake", brands: ["moh"] },
      { name: "Salsa Class (Salsa Mia)", type: "dance-class", duration: "1.5 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 30, highlight: "Group salsa lesson — embarrassing video content guaranteed", bestFor: "pre-night-out", brands: ["moh"] },
      { name: "Vizcaya Museum & Gardens", type: "tour", duration: "2-3 hr", pricePerPerson: [25,35], groupMin: 2, groupMax: 20, highlight: "Italian-Renaissance estate with formal gardens — peak European content backdrop", bestFor: "morning", brands: ["moh"] },
      { name: "Jet Ski Tour (Biscayne Bay)", type: "boat-cruise", duration: "1.5 hr", pricePerPerson: [80,130], groupMin: 2, groupMax: 10, highlight: "Guided jet ski past Star Island and the Miami skyline", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Crandon Park Golf Course", type: "golf", duration: "4-5 hr", pricePerPerson: [60,150], groupMin: 4, groupMax: 16, highlight: "Oceanside championship course with Key Biscayne views", bestFor: "morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Fontainebleau Miami Beach", type: "resort", pricePerNight: [350,800], perRoom: true, maxGuests: 4, highlight: "Iconic South Beach resort with LIV nightclub, pools, and restaurants" },
      { name: "Faena Hotel Miami Beach", type: "boutique-hotel", pricePerNight: [800,2000], perRoom: true, maxGuests: 4, highlight: "Mid-Beach Faena with red-velvet lobby, beachfront pool, iconic gilded mammoth" },
      { name: "Freehand Miami", type: "boutique-hotel", pricePerNight: [100,450], perRoom: true, maxGuests: 4, highlight: "Boutique with Broken Shaker in the courtyard — affordable, fun, very photogenic" },
      { name: "Wynwood Loft (Airbnb)", type: "airbnb", pricePerNight: [400,900], perRoom: false, maxGuests: 10, highlight: "Industrial loft in the arts district — central to murals and Wynwood nightlife" },
    ],
    transport: [
      { name: "Miami Party Bus", type: "party-bus", priceRange: "$600-$1,500 for 4 hr", highlight: "Necessary for groups doing both Wynwood and South Beach in one night" },
      { name: "Yacht Charter Captain", type: "charter", priceRange: "$1,500-$5,000 for 4-8 hr", highlight: "Marquee day activity AND transport — cruises Biscayne Bay with stops" },
    ],
    presentation: {
      moh: { tagline: "Yacht days, Wynwood walls, and a rosé-soaked South Beach weekend", description: "Miami is the bachelorette city for the crew that wants the works: yacht charter day, beach club afternoon, Wynwood mural walk, brunch with bottomless rosé, and late-night dancing on Ocean Drive. The Faena and 1 Hotel anchor the elevated end; Wynwood and Brickell deliver more chill artsy days. International airport access makes it easy for guests flying from anywhere." },
      bestman: { tagline: "Bottle service, beach clubs, and bad decisions until 5am", description: "Miami is the undisputed heavyweight of American party cities. South Beach delivers mega-clubs and pool parties, Wynwood brings the art and cocktails, Brickell has the rooftops, and Little Havana has the culture. If the crew wants world-class nightlife, there is no substitute." },
    } },

  // 36 — Scottsdale, AZ
  { id: "scottsdale-az", city: "Scottsdale", state: "AZ", region: "west",
    nearestAirport: { code: "PHX", name: "Phoenix Sky Harbor International", driveMinutes: 22 },
    bestMonths: [10,11,12,1,2,3,4,5], vibes: ["balanced","chill"], score: 9,
    nightlife: [
      { name: "Maya Day + Nightclub", type: "pool-party", vibe: "unhinged", priceRange: "$$$", highlight: "Massive pool club with cabanas and DJ sets — the Old Town dayclub anchor", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Pool dressy" },
      { name: "Casa Amigos", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Old Town rooftop with sunset views, mezcal flights, and a curated DJ vibe", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Smart casual to dressy" },
      { name: "Bottled Blonde Scottsdale", type: "rooftop", vibe: "unhinged", priceRange: "$$", highlight: "Sprawling Old Town pizza-bar-club hybrid — brunch + late-night dance floor", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Riot House", type: "rooftop", vibe: "unhinged", priceRange: "$$$", highlight: "Old Town rooftop pool bar with dueling DJs and bottle service", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Mission", type: "cocktail-bar", vibe: "chill", priceRange: "$$$", highlight: "Tableside guacamole, mezcal flights, moody candlelit room", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Smart casual" },
      { name: "Sanctuary Jade Bar", type: "lounge", vibe: "chill", priceRange: "$$$$", highlight: "Sanctuary resort bar with Camelback Mountain sunset views — bucket-list cocktail moment", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Resort upscale" },
      { name: "Mowry & Cotton (Phoenician)", type: "cocktail-bar", vibe: "chill", priceRange: "$$$", highlight: "Phoenician resort lobby bar with seasonal cocktails and desert sunset views", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"], dressCode: "Resort casual" },
      { name: "Dierks Bentley's Whiskey Row", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Country star's multi-level honky-tonk with rooftop bar", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Coach House", type: "dive-bar", vibe: "balanced", priceRange: "$", highlight: "Legendary Old Town dive with cheap drinks and zero pretension", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Talking Stick Resort Casino", type: "casino", vibe: "balanced", priceRange: "$$$", highlight: "Table games, poker, sportsbook with a rooftop pool — 15 min from Old Town", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Smart casual" },
    ],
    dining: [
      { name: "Hash Kitchen", cuisine: "Brunch", priceRange: "$$", highlight: "Bloody Mary bar, bottomless mimosas, build-your-own donut wall — the bachelorette brunch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Steak 44", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "Modern steakhouse, big group tables, the unofficial Scottsdale celebration dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Diego Pops", cuisine: "Mexican", priceRange: "$$", highlight: "Festive Old Town spot with frozen palomas, tacos, and a great patio", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Olive & Ivy", cuisine: "Mediterranean", priceRange: "$$$", highlight: "Waterfront Mediterranean with a stunning canal-side patio", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Cala (Andaz)", cuisine: "Coastal Mediterranean", priceRange: "$$$$", highlight: "Andaz resort's airy seafood spot with sunset patio — fancy group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Tia Carmen (JW Camelback)", cuisine: "Modern Southwestern", priceRange: "$$$", highlight: "Angelo Sosa's Native-influenced Southwestern menu — unique, photogenic", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Postino Highland", cuisine: "Wine Bar / Bruschetta", priceRange: "$$", highlight: "Bruschetta boards + bottle wine deals 4-5pm", bestFor: "lunch", groupFriendly: true, brands: ["moh"] },
      { name: "Toca Madera", cuisine: "Mexican-Asian Fusion", priceRange: "$$$$", highlight: "Scene-y dinner with live DJs and inventive plates", bestFor: "group-dinner", groupFriendly: true, brands: ["bestman"] },
      { name: "Maple & Ash", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "Wood-fired steaks and dramatic tableside service", bestFor: "group-dinner", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Pool Cabana Day (Talking Stick / W / Andaz)", type: "pool-party", duration: "all day", pricePerPerson: [80,200], groupMin: 4, groupMax: 20, highlight: "Cabana day at one of the Valley's top pool clubs with service and DJ", bestFor: "day party", brands: ["both"] },
      { name: "Camelback Mountain Hike", type: "hiking", duration: "2-3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 12, highlight: "Iconic Camelback summit hike with city panoramas", bestFor: "morning", brands: ["both"] },
      { name: "Saguaro Lake Boat Day", type: "boat-cruise", duration: "4 hr", pricePerPerson: [80,180], groupMin: 6, groupMax: 20, highlight: "Pontoon on Saguaro Lake with swim spots and desert backdrops", bestFor: "day activity", brands: ["both"] },
      { name: "Old Town Pedal Crawler", type: "brewery-tour", duration: "2 hr", pricePerPerson: [35,55], groupMin: 6, groupMax: 15, highlight: "Pedal-powered party bike through Old Town bars", bestFor: "afternoon", brands: ["both"] },
      { name: "Cucina Pasta-Making Class", type: "cooking-class", duration: "2-3 hr", pricePerPerson: [85,130], groupMin: 4, groupMax: 16, highlight: "Hands-on pasta class with wine — eat what you make", bestFor: "afternoon", brands: ["both"] },
      { name: "Hot Air Expeditions Sunrise Balloon", type: "tour", duration: "3-4 hr", pricePerPerson: [225,350], groupMin: 2, groupMax: 12, highlight: "Sunrise balloon over the Sonoran with champagne breakfast — bucket-list content", bestFor: "morning", brands: ["moh"] },
      { name: "Sanctuary Spa Day", type: "spa", duration: "half day", pricePerPerson: [200,500], groupMin: 2, groupMax: 10, highlight: "Camelback resort spa with private group room and mountain views", bestFor: "recovery", brands: ["moh"] },
      { name: "Boudoir Scottsdale", type: "boudoir", duration: "2 hr", pricePerPerson: [150,280], groupMin: 1, groupMax: 8, highlight: "Group boudoir in a designer Scottsdale studio with hair + makeup", bestFor: "bride keepsake", brands: ["moh"] },
      { name: "Sonoran Desert Sound Bath", type: "sound-bath", duration: "1 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 15, highlight: "Crystal sound bowl session in a desert garden", bestFor: "recovery", brands: ["moh"] },
      { name: "TPC Scottsdale", type: "golf", duration: "4-5 hr", pricePerPerson: [150,350], groupMin: 4, groupMax: 16, highlight: "Home of the WM Phoenix Open with the famous par-3 16th", bestFor: "morning", brands: ["bestman"] },
      { name: "Scottsdale Gun Club", type: "shooting-range", duration: "1-2 hr", pricePerPerson: [50,150], groupMin: 2, groupMax: 20, highlight: "Indoor range with huge firearm selection and group packages", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Desert Wolf Tomcar ATV", type: "atv", duration: "3 hr", pricePerPerson: [130,220], groupMin: 4, groupMax: 16, highlight: "Off-road tomcar tour through the Sonoran Desert", bestFor: "afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Andaz Scottsdale Resort & Bungalows", type: "resort", pricePerNight: [400,850], perRoom: true, maxGuests: 4, highlight: "Mid-century modern bungalow resort with three pools and Cala restaurant" },
      { name: "W Scottsdale", type: "boutique-hotel", pricePerNight: [250,700], perRoom: true, maxGuests: 4, highlight: "Old Town W with WET Deck pool club and walkable nightlife" },
      { name: "Hotel Valley Ho", type: "boutique-hotel", pricePerNight: [200,450], perRoom: true, maxGuests: 4, highlight: "Mid-century modern icon with an epic pool deck" },
      { name: "Old Town Pool House (Airbnb)", type: "airbnb", pricePerNight: [600,1500], perRoom: false, maxGuests: 14, highlight: "Whole-house rental in Old Town — heated pool, hot tub, fire pit" },
    ],
    transport: [
      { name: "Scottsdale Party Bus", type: "party-bus", priceRange: "$500-$1,200 for 4 hr", highlight: "Decked-out buses for Old Town nightlife — necessary for groups of 8+" },
      { name: "Pink Jeep Tours", type: "shuttle", priceRange: "$120-$220 per person", highlight: "Pink jeep desert tours — transport AND a marquee activity" },
    ],
    presentation: {
      moh: { tagline: "Pool floats, palm shadows, and rooftop margaritas — desert glam done right", description: "Scottsdale is the West Coast bachelorette HQ. Days are pool clubs at the W or Andaz, evenings are Old Town rooftops, and the spa hotels (Sanctuary, Miraval, Four Seasons Troon) deliver the ultimate \"recover before the wedding\" energy. Pinterest's \"desert bachelorette\" board is basically a Scottsdale lookbook. Best October through May — summer is brutal." },
      bestman: { tagline: "Desert glam meets daytime debauchery", description: "Old Town Scottsdale is ground zero for golf-obsessed bachelor trips and weekend warriors alike. Pool parties by day, bottle service by night, world-class spas in between, and TPC Scottsdale 20 minutes away for the group that came to play 18." },
    } },

  // 37 — Las Vegas, NV
  { id: "las-vegas-nv", city: "Las Vegas", state: "NV", region: "west",
    nearestAirport: { code: "LAS", name: "Harry Reid International Airport", driveMinutes: 12 },
    bestMonths: [3,4,5,9,10,11], vibes: ["balanced","unhinged"], score: 10,
    nightlife: [
      { name: "Marquee Nightclub & Dayclub", type: "pool-party", vibe: "unhinged", priceRange: "$$$$", highlight: "Cosmopolitan's three-story club with legendary rooftop pool deck", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "On The Record", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Park MGM's multi-room vinyl bar hiding behind a bookshelf entrance", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Bellagio Casino Floor", type: "casino", vibe: "balanced", priceRange: "$$$", highlight: "The classic Vegas experience — blackjack and craps under the Chihuly ceiling", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Zouk Nightclub", type: "club", vibe: "unhinged", priceRange: "$$$$", highlight: "Resorts World's flagship — stunning visuals, world-class DJs", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "Omnia Nightclub", type: "club", vibe: "unhinged", priceRange: "$$$$", highlight: "Caesars Palace mega-club with a chandelier kinetic sculpture and rooftop terrace", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "The Velveteen Rabbit", type: "cocktail-bar", vibe: "chill", priceRange: "$$", highlight: "Arts District craft cocktail bar with a garden patio — local alternative to Strip excess", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["moh"] },
      { name: "XS Nightclub", type: "club", vibe: "unhinged", priceRange: "$$$$", highlight: "Wynn's flagship mega-club with world-class DJs and pool views", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Upscale nightlife attire" },
      { name: "Hakkasan", type: "club", vibe: "unhinged", priceRange: "$$$$", highlight: "Five-level megaclub at MGM Grand with top-tier residencies", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Upscale nightlife attire" },
      { name: "Encore Beach Club", type: "pool-party", vibe: "unhinged", priceRange: "$$$$", highlight: "Premier dayclub with headliner DJs and VIP cabanas", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["bestman"] },
      { name: "Frankie's Tiki Room", type: "tiki-bar", vibe: "balanced", priceRange: "$$", highlight: "24-hour tiki dive with strong rum drinks and zero windows", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Mon Ami Gabi", cuisine: "French bistro", priceRange: "$$$", highlight: "Paris Las Vegas terrace with Bellagio fountain views — brunch is a classic", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "STK Steakhouse", cuisine: "Modern steakhouse", priceRange: "$$$$", highlight: "Party-atmosphere steakhouse with DJ and a lively vibe", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Eggslut", cuisine: "American comfort", priceRange: "$$", highlight: "Cosmopolitan's cult egg sandwich counter — fast, essential", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Estiatorio Milos", cuisine: "Greek seafood", priceRange: "$$$$", highlight: "Stunning Greek seafood — whole fish by the pound, pristine presentation", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Beauty & Essex", cuisine: "New American", priceRange: "$$$", highlight: "Hidden behind a pawn shop entrance at the Cosmopolitan — social scene", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
      { name: "Secret Pizza", cuisine: "NY-style pizza", priceRange: "$", highlight: "Hidden on Cosmopolitan's third floor — beloved post-club tradition", bestFor: "late-night", groupFriendly: true, brands: ["moh"] },
      { name: "Hell's Kitchen", cuisine: "American", priceRange: "$$$$", highlight: "Gordon Ramsay's Strip-side restaurant with beef Wellington", bestFor: "group-dinner", groupFriendly: true, brands: ["bestman"] },
      { name: "Bacchanal Buffet", cuisine: "International Buffet", priceRange: "$$$", highlight: "Caesars' legendary 250-item buffet with crab legs and sushi", bestFor: "brunch", groupFriendly: true, brands: ["bestman"] },
      { name: "Tacos El Gordo", cuisine: "Mexican Street Food", priceRange: "$", highlight: "Legendary late-night taco stand on the Strip", bestFor: "late-night", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Strip Casino Crawl", type: "casino", duration: "3-6 hr", pricePerPerson: [50,500], groupMin: 2, groupMax: 30, highlight: "Hit Bellagio, Caesars, and the Venetian — the core Vegas experience", bestFor: "evening", brands: ["both"] },
      { name: "High Roller Observation Wheel", type: "scenic-overlook", duration: "30 min", pricePerPerson: [25,60], groupMin: 2, groupMax: 40, highlight: "World's tallest observation wheel with open-bar cabins — golden hour is spectacular", bestFor: "sunset", brands: ["both"] },
      { name: "Lip Smacking Foodie Tours", type: "food-tour", duration: "3 hr", pricePerPerson: [100,175], groupMin: 2, groupMax: 20, highlight: "Walking food tour of the Strip's best bites with VIP access", bestFor: "afternoon", brands: ["both"] },
      { name: "TopGolf Las Vegas", type: "golf", duration: "2-3 hr", pricePerPerson: [30,60], groupMin: 2, groupMax: 30, highlight: "Four-story driving range with Strip views, food, and drinks", bestFor: "afternoon", brands: ["both"] },
      { name: "Maverick Helicopter Tour", type: "sunset-cruise", duration: "2-4 hr", pricePerPerson: [150,500], groupMin: 2, groupMax: 6, highlight: "Helicopter tour over the Strip and Grand Canyon at sunset", bestFor: "marquee experience", brands: ["both"] },
      { name: "Wynn Spa Day", type: "spa", duration: "3-5 hr", pricePerPerson: [150,400], groupMin: 2, groupMax: 12, highlight: "Forbes Five-Star spa with private couple suites and a garden pool", bestFor: "recovery", brands: ["moh"] },
      { name: "Las Vegas Drag Brunch", type: "drag-brunch", duration: "2 hr", pricePerPerson: [45,85], groupMin: 4, groupMax: 30, highlight: "High-energy drag performances with bottomless mimosas", bestFor: "morning", brands: ["moh"] },
      { name: "Private Boudoir Session", type: "boudoir", duration: "2 hr", pricePerPerson: [200,500], groupMin: 1, groupMax: 6, highlight: "Studio-quality boudoir shoot with wardrobe and HMU", bestFor: "bride keepsake", brands: ["moh"] },
      { name: "Sound Off Vegas (Silent Disco)", type: "silent-disco", duration: "2-3 hr", pricePerPerson: [40,75], groupMin: 8, groupMax: 80, highlight: "Vegas's locally-owned silent disco for private bachelorette events on or off the Strip", bestFor: "evening", brands: ["moh"] },
      { name: "SpeedVegas", type: "racing", duration: "2-3 hr", pricePerPerson: [200,600], groupMin: 2, groupMax: 20, highlight: "Drive Lamborghinis and Ferraris on a real racetrack", bestFor: "afternoon", brands: ["bestman"] },
      { name: "The Range 702", type: "shooting-range", duration: "1-2 hr", pricePerPerson: [100,400], groupMin: 2, groupMax: 15, highlight: "Shoot machine guns and exotic firearms in group packages", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Vegas Indoor Skydiving", type: "skydiving", duration: "1-2 hr", pricePerPerson: [75,125], groupMin: 2, groupMax: 15, highlight: "Indoor wind tunnel flight experience near the Strip", bestFor: "afternoon", brands: ["bestman"] },
      { name: "Red Rock Canyon Canyoneering", type: "canyoneering", duration: "half day", pricePerPerson: [120,200], groupMin: 2, groupMax: 8, highlight: "Guided technical canyoneering in Red Rock's Calico Hills — 30 min from the Strip", bestFor: "day activity", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Cosmopolitan of Las Vegas", type: "resort", pricePerNight: [200,600], perRoom: true, maxGuests: 4, highlight: "The Strip's most stylish hotel — wraparound terrace suites and five nightlife venues steps away" },
      { name: "Wynn Las Vegas", type: "resort", pricePerNight: [250,700], perRoom: true, maxGuests: 4, highlight: "Forbes Five-Star with the best pool complex on the Strip and a Forbes-rated spa" },
      { name: "Park MGM", type: "boutique-hotel", pricePerNight: [150,400], perRoom: true, maxGuests: 4, highlight: "NoMad-branded rooms with the quietest vibe on the Strip" },
      { name: "Las Vegas Luxury Rental Home", type: "house", pricePerNight: [400,2000], perRoom: false, maxGuests: 20, highlight: "Private pool, hot tub, and game room away from the Strip" },
    ],
    transport: [
      { name: "Strip Party Bus", type: "party-bus", priceRange: "$300-$1,500 for 4 hr", highlight: "Dedicated party bus shuttling between clubs — keeps energy up, eliminates wait times" },
      { name: "Presidential Limousine", type: "limo", priceRange: "$500-$1,500 for 4 hr", highlight: "Stretch limos, Hummers, and Escalades for VIP arrivals" },
    ],
    presentation: {
      moh: { tagline: "The Strip, pool parties, and shows that never end — America's ultimate bachelorette playground", description: "Las Vegas is the undisputed #1 bachelorette destination in the country. The Strip delivers world-class nightclubs, Michelin-starred dinners, rooftop pools, and headliner shows all within walking distance. Off-Strip, the Arts District and Fremont Street offer a grittier, more local counterpoint. The bride and her crew can custom-build any energy here — from spa days at the Wynn to 3 AM dance floors at Zouk." },
      bestman: { tagline: "What happens in Vegas... you already know the rest", description: "The undisputed heavyweight champ of bachelor parties. World-class clubs, 24/7 action, bottomless buffets, and the understanding that nobody here is judging you. XS, Hakkasan, Encore Beach Club, TopGolf, and a Lamborghini on a real track — Vegas doesn't do subtle." },
    } },
];
