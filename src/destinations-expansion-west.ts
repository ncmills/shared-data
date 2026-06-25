import type { CanonicalDestination } from "./destinations-types";

/**
 * West US destination expansion. Fills gaps in the canonical catalog with
 * party-trip-viable desert, mountain, lake, and casino towns across AZ, NV,
 * NM, CO, CA, MT, and ID. All venues are real and verifiable. region = "west".
 */
export const expansionWest: CanonicalDestination[] = [
  // Phoenix, AZ
  { id: "phoenix-az", city: "Phoenix", state: "AZ", region: "west",
    nearestAirport: { code: "PHX", name: "Phoenix Sky Harbor Intl", driveMinutes: 15 },
    bestMonths: [3,4,10,11,12], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "The Duce", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "1928 warehouse with rooftop, boxing ring + backyard games", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Monarch Theatre", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "21+ Washington St club with two dance floors incl. rooftop", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Eden Rooftop", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Rooftop pool lounge atop Kimpton Hotel Palomar downtown", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Pizzeria Bianco", cuisine: "Italian", priceRange: "$$$", highlight: "James Beard wood-fired pies in Heritage Square", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Barrio Café", cuisine: "Mexican", priceRange: "$$", highlight: "Modern regional Mexican + tableside guac", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Matt's Big Breakfast", cuisine: "Breakfast", priceRange: "$$", highlight: "Downtown brunch institution, cash-fueled lines", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Old Town Scottsdale day trip + Camelback hike", type: "hiking", duration: "4 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 12, highlight: "Echo Canyon summit then walkable bars", bestFor: "active morning", brands: ["both"] },
      { name: "Desert sunset Jeep tour", type: "tour", duration: "3 hr", pricePerPerson: [110,180], groupMin: 4, groupMax: 14, highlight: "Sonoran Desert 4x4 + saguaro golden hour", bestFor: "first day", brands: ["both"] },
      { name: "Hot-air balloon over the Sonoran Desert", type: "tour", duration: "3 hr", pricePerPerson: [180,280], groupMin: 2, groupMax: 12, highlight: "Sunrise float with champagne landing", bestFor: "photo ops", brands: ["both"] },
      { name: "Resort pool day pass", type: "pool-party", duration: "5 hr", pricePerPerson: [40,150], groupMin: 4, groupMax: 16, highlight: "DJ day-club cabanas at a Valley resort", bestFor: "afternoon", brands: ["both"] },
      { name: "Salt River tubing (summer)", type: "kayaking", duration: "4 hr", pricePerPerson: [25,45], groupMin: 6, groupMax: 30, highlight: "Float the Salt with a cooler tube", bestFor: "hot day", brands: ["both"] },
      { name: "Wine Girl bachelorette tasting", type: "wine-tour", duration: "2 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 12, highlight: "Roses + photo backdrops, built for the sash crowd", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "TOPGOLF Scottsdale bay", type: "sports-event", duration: "2.5 hr", pricePerPerson: [40,75], groupMin: 4, groupMax: 12, highlight: "Climate-controlled bays + bottle service", bestFor: "first night", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Kimpton Hotel Palomar Phoenix", type: "boutique-hotel", pricePerNight: [240,420], perRoom: true, maxGuests: 2, highlight: "Downtown CityScape, rooftop pool + Eden lounge" },
      { name: "Arcadia 5BR pool house", type: "airbnb", pricePerNight: [600,1400], perRoom: false, maxGuests: 14, highlight: "Heated pool, Camelback views, walkable to bars" },
    ],
    transport: [
      { name: "Detour party bus", type: "party-bus", priceRange: "$180-$350/group", highlight: "AC coaches for Salt River + Old Town runs" },
    ],
    presentation: {
      moh: { tagline: "Pool days, desert sunsets, and a budget that breathes", description: "Phoenix gives you Scottsdale's day-club energy without paying Scottsdale prices for everything. Heated-pool rentals, a real downtown cocktail scene, a sunrise balloon over the saguaros, and warm weather when the rest of the country is frozen." },
      bestman: { tagline: "Day clubs, desert 4x4, and the Salt River float", description: "Phoenix is a no-fuss desert blowout: pool-party day passes, a Jeep tour through the Sonoran, Salt River tubing with a cooler, and a downtown that actually has bars worth crawling. Cheaper home base than Scottsdale, same playground." },
    } },

  // Tempe, AZ
  { id: "tempe-az", city: "Tempe", state: "AZ", region: "west",
    nearestAirport: { code: "PHX", name: "Phoenix Sky Harbor Intl", driveMinutes: 12 },
    bestMonths: [3,4,10,11], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Varsity Tavern", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Multi-level Mill Ave bar with DJs + rooftop", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Rula Bula Irish Pub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Mill Ave gastropub with fire pits + patio games", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Skysill Rooftop Lounge", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Atop the Westin Tempe near Mill Ave", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "House of Tricks", cuisine: "New American", priceRange: "$$$", highlight: "Garden-patio bungalow off Mill Ave", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Snooze, an A.M. Eatery", cuisine: "Breakfast", priceRange: "$$", highlight: "Pineapple-upside-down pancakes + brunch cocktails", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Pita Jungle", cuisine: "Mediterranean", priceRange: "$$", highlight: "Tempe-born healthy Med, shareable mezze", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Tempe Town Lake kayak + SUP", type: "kayaking", duration: "2 hr", pricePerPerson: [25,50], groupMin: 4, groupMax: 16, highlight: "Rentals under the Mill Ave Bridge", bestFor: "morning", brands: ["both"] },
      { name: "Donut party boat on Town Lake", type: "boat-cruise", duration: "2 hr", pricePerPerson: [40,80], groupMin: 6, groupMax: 10, highlight: "Motorized round party boat for the group", bestFor: "afternoon", brands: ["both"] },
      { name: "'A' Mountain (Hayden Butte) climb", type: "hiking", duration: "1.5 hr", pricePerPerson: [0,10], groupMin: 2, groupMax: 14, highlight: "Quick city-view scramble above campus", bestFor: "active morning", brands: ["both"] },
      { name: "Mill Avenue bar crawl", type: "brunch-crawl", duration: "4 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 16, highlight: "Walkable college-town strip of bars", bestFor: "first night", brands: ["both"] },
      { name: "Town Lake bike + brewery loop", type: "biking", duration: "3 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 12, highlight: "5-mile lake loop with taproom stops", bestFor: "active afternoon", brands: ["both"] },
      { name: "Fat Tuesday frozen-daiquiri stop", type: "cocktail-class", duration: "1.5 hr", pricePerPerson: [25,45], groupMin: 4, groupMax: 14, highlight: "Bourbon St-style frozen drinks on Mill", bestFor: "kickoff", brands: ["both"] },
    ],
    lodging: [
      { name: "The Westin Tempe", type: "hotel", pricePerNight: [220,380], perRoom: true, maxGuests: 2, highlight: "Steps from Mill Ave with Skysill rooftop" },
      { name: "Downtown Tempe 4BR loft", type: "airbnb", pricePerNight: [450,900], perRoom: false, maxGuests: 12, highlight: "Walk to Mill Ave + Town Lake" },
    ],
    transport: [
      { name: "Valley Metro Rail + rideshare", type: "shuttle", priceRange: "$2-$25/ride", highlight: "Light rail links Tempe, Phoenix airport + downtown" },
    ],
    presentation: {
      moh: { tagline: "College-town energy on a lake, ten minutes from the airport", description: "Tempe is the easy-landing pick: kayak or party-boat Town Lake by day, crawl Mill Avenue by night, and you never need a car thanks to the light rail. Cheaper and rowdier than Scottsdale, with brunch spots built for a group." },
      bestman: { tagline: "Mill Ave bars, Town Lake party boats, zero logistics", description: "Tempe is a walkable college strip with a lake bolted on. Donut party boat in the afternoon, Mill Ave crawl at night, and the airport is twelve minutes out. Low-effort, high-volume, and the rail keeps everyone moving." },
    } },

  // Lake Havasu City, AZ
  { id: "lake-havasu-city-az", city: "Lake Havasu City", state: "AZ", region: "west",
    nearestAirport: { code: "LAS", name: "Harry Reid Intl (Las Vegas)", driveMinutes: 165 },
    bestMonths: [3,4,5,9,10], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Kokomo Beach Club", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "10,000 sq ft pool + dance bar at London Bridge Resort", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Martini Bay", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Waterfront live-music bar on the channel", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Barley Brothers Brewery", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Lakeside brewery overlooking London Bridge", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Shugrue's", cuisine: "Seafood", priceRange: "$$$", highlight: "Waterfront seafood + steaks over the channel", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Javelina Cantina", cuisine: "Mexican", priceRange: "$$", highlight: "Margaritas + patio on the Bridgewater Channel", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "College Street Brewhouse & Pub", cuisine: "American", priceRange: "$$", highlight: "House brews + big group tables", bestFor: "casual-dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Party boat / cabana boat rental", type: "boat-cruise", duration: "4 hr", pricePerPerson: [60,150], groupMin: 6, groupMax: 16, highlight: "Tiki bar boat with karaoke + bathroom for the group", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Jet ski rental at London Bridge", type: "boat-cruise", duration: "2 hr", pricePerPerson: [100,200], groupMin: 2, groupMax: 12, highlight: "Skis off the channel beach", bestFor: "afternoon", brands: ["both"] },
      { name: "Copper Canyon boat day + cliff jumping", type: "boat-cruise", duration: "5 hr", pricePerPerson: [70,160], groupMin: 6, groupMax: 16, highlight: "Anchor in the sandstone coves off the lake", bestFor: "centerpiece day", brands: ["both"] },
      { name: "London Bridge channel SUP", type: "kayaking", duration: "2 hr", pricePerPerson: [30,55], groupMin: 4, groupMax: 12, highlight: "Paddle under the original London Bridge", bestFor: "morning", brands: ["both"] },
      { name: "Sunset dinner cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [55,110], groupMin: 6, groupMax: 20, highlight: "Channel cruise as the desert lights up", bestFor: "last night", brands: ["both"] },
    ],
    lodging: [
      { name: "London Bridge Resort", type: "resort", pricePerNight: [200,420], perRoom: true, maxGuests: 4, highlight: "On the channel, home to Kokomo + boat rentals" },
      { name: "Lakefront 5BR with dock", type: "airbnb", pricePerNight: [700,1600], perRoom: false, maxGuests: 14, highlight: "Private dock, pool, and walk-to-channel" },
    ],
    transport: [
      { name: "Group SUV rental", type: "shuttle", priceRange: "$80-$150/day", highlight: "Needed — nearest major airport is Vegas (~2.5 hr)" },
    ],
    presentation: {
      moh: { tagline: "The West's spring-break lake, built for a boat day", description: "Havasu is pure water-party energy: rent a cabana boat with a tiki bar, anchor in Copper Canyon, then dance at Kokomo by the London Bridge. It's the rowdy desert-lake pick when everyone wants sun, a cooler, and a soundtrack." },
      bestman: { tagline: "Boat, bridge, and the biggest party lake out West", description: "Lake Havasu is a boat-day machine: party pontoon with a bathroom and karaoke, jet skis off the beach, cliff coves in Copper Canyon, and Kokomo at night. Fly into Vegas, drive 2.5 hours, and you've got the loudest lake in the desert." },
    } },

  // Prescott, AZ
  { id: "prescott-az", city: "Prescott", state: "AZ", region: "west",
    nearestAirport: { code: "PHX", name: "Phoenix Sky Harbor Intl", driveMinutes: 100 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "The Palace Restaurant & Saloon", type: "saloon", vibe: "balanced", priceRange: "$$", highlight: "Arizona's oldest frontier saloon (1877) on Whiskey Row", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Matt's Saloon", type: "honky-tonk", vibe: "balanced", priceRange: "$", highlight: "Live country + dance floor on Whiskey Row", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Jersey Lilly Saloon", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Balcony bar over Courthouse Plaza", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "The Rose Restaurant", cuisine: "Fine dining", priceRange: "$$$", highlight: "Victorian-house tasting menus off Whiskey Row", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "El Gato Azul", cuisine: "Spanish tapas", priceRange: "$$", highlight: "Creekside tapas + sangria patio", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Local", cuisine: "American", priceRange: "$$", highlight: "Farm-to-table brunch off the Plaza", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Whiskey Row saloon crawl", type: "brunch-crawl", duration: "4 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 16, highlight: "Walk the historic block of frontier saloons", bestFor: "first night", brands: ["both"] },
      { name: "Watson Lake kayak + Granite Dells", type: "kayaking", duration: "3 hr", pricePerPerson: [30,60], groupMin: 4, groupMax: 14, highlight: "Paddle among the granite dells boulders", bestFor: "morning", brands: ["both"] },
      { name: "Thumb Butte hike", type: "hiking", duration: "2 hr", pricePerPerson: [0,10], groupMin: 2, groupMax: 14, highlight: "1.75-mile loop with sweeping pine views", bestFor: "active morning", brands: ["both"] },
      { name: "Lonesome Valley Brewing taproom", type: "brewery-tour", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 14, highlight: "Small-batch craft beer off Whiskey Row", bestFor: "afternoon", brands: ["both"] },
      { name: "Granite Dells horseback ride", type: "horseback-riding", duration: "2 hr", pricePerPerson: [70,120], groupMin: 4, groupMax: 12, highlight: "Trail ride through the granite formations", bestFor: "morning", brands: ["both"] },
    ],
    lodging: [
      { name: "Hassayampa Inn", type: "boutique-hotel", pricePerNight: [180,320], perRoom: true, maxGuests: 2, highlight: "1927 historic hotel one block off Whiskey Row" },
      { name: "Granite Dells 4BR cabin", type: "airbnb", pricePerNight: [400,800], perRoom: false, maxGuests: 12, highlight: "Boulder-view home near Watson Lake" },
    ],
    transport: [
      { name: "Group SUV from Phoenix", type: "shuttle", priceRange: "$90-$150/day", highlight: "~100 min scenic drive up from PHX" },
    ],
    presentation: {
      moh: { tagline: "Old-West charm, granite lakes, and a real saloon block", description: "Prescott is the laid-back AZ pick: paddle Watson Lake's surreal granite dells in the morning, sip sangria on a creekside patio, and end on Whiskey Row's balcony bars. Pine-cool air, mile-high, and a true mountain town an easy drive from Phoenix." },
      bestman: { tagline: "Whiskey Row saloons where Wyatt Earp actually drank", description: "Prescott is a frontier saloon crawl with a lake attached. Kayak the granite dells, hike Thumb Butte, then work the block of historic saloons on Whiskey Row, Palace included. Mile-high, pine-cooled, and short on pretense." },
    } },

  // Reno, NV
  { id: "reno-nv", city: "Reno", state: "NV", region: "west",
    nearestAirport: { code: "RNO", name: "Reno-Tahoe Intl", driveMinutes: 10 },
    bestMonths: [5,6,7,8,9], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "The Depot Craft Brewery Distillery", type: "brewpub", vibe: "balanced", priceRange: "$$", highlight: "Brewery + distillery in a 1910 train depot", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Death & Taxes", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Apothecary-style craft cocktail den", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Peppermill Reno casino floor", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "24-hr gaming + EDGE nightclub", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Centro", cuisine: "Mexican", priceRange: "$$", highlight: "Midtown's best Mexican + mezcal program", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Roundabout Grill", cuisine: "Steakhouse", priceRange: "$$$", highlight: "The city's top steakhouse at the Peppermill", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Two Chicks", cuisine: "Breakfast", priceRange: "$$", highlight: "Midtown brunch with creative scrambles", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Truckee River Whitewater Park tubing", type: "rafting", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 16, highlight: "Free downtown course with 11 drop pools", bestFor: "hot afternoon", brands: ["both"] },
      { name: "Midtown bar + distillery crawl", type: "distillery-tour", duration: "4 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Walkable Virginia St cocktail + brewery strip", bestFor: "first night", brands: ["both"] },
      { name: "Lake Tahoe day trip", type: "scenic-overlook", duration: "6 hr", pricePerPerson: [40,120], groupMin: 2, groupMax: 14, highlight: "45-min drive to Sand Harbor + alpine swims", bestFor: "full day", brands: ["both"] },
      { name: "Casino gaming + show night", type: "casino", duration: "4 hr", pricePerPerson: [40,150], groupMin: 4, groupMax: 16, highlight: "Tables, slots, and headliner shows downtown", bestFor: "any night", brands: ["both"] },
      { name: "Hot-air balloon over the valley", type: "tour", duration: "3 hr", pricePerPerson: [180,280], groupMin: 2, groupMax: 12, highlight: "Sunrise float over the Truckee Meadows", bestFor: "photo ops", brands: ["both"] },
    ],
    lodging: [
      { name: "Whitney Peak Hotel", type: "boutique-hotel", pricePerNight: [180,340], perRoom: true, maxGuests: 2, highlight: "Non-gaming downtown hotel with a climbing wall" },
      { name: "Midtown 4BR craftsman", type: "airbnb", pricePerNight: [400,900], perRoom: false, maxGuests: 12, highlight: "Walk to Midtown bars + the river" },
    ],
    transport: [
      { name: "Reno party bus", type: "party-bus", priceRange: "$150-$300/group", highlight: "Airport + casino + Tahoe runs, 10-min from RNO" },
    ],
    presentation: {
      moh: { tagline: "Vegas energy, Tahoe access, half the price", description: "Reno is the budget-savvy mountain-meets-casino pick: tube the free downtown river course, crawl the Midtown cocktail bars, gamble all night, and drive 45 minutes to Tahoe for an alpine swim. Big-city playground, small-city prices, airport ten minutes out." },
      bestman: { tagline: "Casinos, a downtown whitewater park, and Tahoe next door", description: "Reno punches way above its size: 24-hour casinos, a free whitewater park running through downtown, a real Midtown bar crawl, and Lake Tahoe under an hour away. Cheaper than Vegas, with mountains attached and the airport on the doorstep." },
    } },

  // Stateline, NV
  { id: "stateline-nv", city: "Stateline", state: "NV", region: "west",
    nearestAirport: { code: "RNO", name: "Reno-Tahoe Intl", driveMinutes: 75 },
    bestMonths: [1,2,6,7,8,9], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Blu Nightclub at Bally's Lake Tahoe", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Casino dance club with live entertainment", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Harrah's Lake Tahoe casino floor", type: "casino", vibe: "balanced", priceRange: "$$$", highlight: "24-hr tables + 1,000 slots steps from the gondola", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Loft Theatre & Lounge", type: "lounge", vibe: "balanced", priceRange: "$$$", highlight: "Magic dinner-show lounge + cocktails", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Gordon Ramsay Hell's Kitchen", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "Beef Wellington at Caesars Republic Lake Tahoe", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mastro's Steak House", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "Lakeside steaks at the Golden Nugget", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Wolf by Vanderpump", cuisine: "American", priceRange: "$$$", highlight: "Lisa Vanderpump's casino restaurant", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Heavenly Gondola ride", type: "scenic-overlook", duration: "2.5 hr", pricePerPerson: [60,80], groupMin: 2, groupMax: 16, highlight: "2.4-mile gondola to lake-view observation deck", bestFor: "first day", brands: ["both"] },
      { name: "Zephyr Cove boat + kayak day", type: "kayaking", duration: "4 hr", pricePerPerson: [40,100], groupMin: 4, groupMax: 16, highlight: "Marina rentals + beach volleyball on the cove", bestFor: "summer day", brands: ["both"] },
      { name: "Tahoe sunset paddle-wheel cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [70,130], groupMin: 6, groupMax: 30, highlight: "Emerald Bay cruise on the M.S. Dixie II", bestFor: "last night", brands: ["both"] },
      { name: "Heavenly skiing / snowboarding (winter)", type: "skiing", duration: "6 hr", pricePerPerson: [120,220], groupMin: 2, groupMax: 14, highlight: "Lake-view runs straight from town", bestFor: "winter day", brands: ["both"] },
      { name: "Casino gaming night", type: "casino", duration: "4 hr", pricePerPerson: [50,200], groupMin: 4, groupMax: 16, highlight: "Crawl four casinos clustered at the state line", bestFor: "any night", brands: ["both"] },
    ],
    lodging: [
      { name: "Harrah's Lake Tahoe", type: "hotel", pricePerNight: [180,420], perRoom: true, maxGuests: 4, highlight: "Casino tower at the gondola, lake-view rooms" },
      { name: "South Tahoe 5BR cabin", type: "airbnb", pricePerNight: [600,1500], perRoom: false, maxGuests: 14, highlight: "Hot tub + walk to the casinos and gondola" },
    ],
    transport: [
      { name: "South Tahoe Airporter + party bus", type: "party-bus", priceRange: "$50-$300/group", highlight: "Reno-airport shuttle plus local casino/lake bus" },
    ],
    presentation: {
      moh: { tagline: "Alpine lake by day, casino tower by night", description: "Stateline is the year-round Tahoe pick: ride the Heavenly Gondola for that postcard lake view, kayak Zephyr Cove in summer or ski straight from town in winter, then dance at a casino club at night. Four casinos, one walkable strip, on the bluest lake in the West." },
      bestman: { tagline: "Four casinos on the lake, gondola out the back door", description: "Stateline stacks a Vegas-style casino strip onto Lake Tahoe. Heavenly Gondola or ski runs by day, Gordon Ramsay steak for dinner, casino tables and a dance club at night. Everything's clustered at the state line so nobody needs to drive." },
    } },

  // Albuquerque, NM
  { id: "albuquerque-nm", city: "Albuquerque", state: "NM", region: "west",
    nearestAirport: { code: "ABQ", name: "Albuquerque Intl Sunport", driveMinutes: 15 },
    bestMonths: [4,5,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Teddy Roe's", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Hidden Nob Hill speakeasy with twist cocktails", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Ten 3", type: "bar", vibe: "balanced", priceRange: "$$$", highlight: "Cocktail bar atop the Sandia Peak Tram (10,378 ft)", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Marble Brewery", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Downtown taproom with rooftop + live music", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Sadie's of New Mexico", cuisine: "New Mexican", priceRange: "$$", highlight: "Iconic red/green chile + margaritas", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Frontier Restaurant", cuisine: "New Mexican diner", priceRange: "$", highlight: "Cult sweet rolls + huevos near UNM", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Campo at Los Poblanos", cuisine: "Farm-to-table", priceRange: "$$$", highlight: "Field-to-fork dinners on a lavender farm", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Hot-air balloon ride", type: "tour", duration: "3 hr", pricePerPerson: [180,300], groupMin: 2, groupMax: 12, highlight: "Sunrise float in the ballooning capital of the world", bestFor: "photo ops", brands: ["both"] },
      { name: "Sandia Peak Tramway", type: "scenic-overlook", duration: "3 hr", pricePerPerson: [30,55], groupMin: 2, groupMax: 16, highlight: "North America's longest tram to a 10,378-ft ridge", bestFor: "first day", brands: ["both"] },
      { name: "Old Town + Nob Hill walking food tour", type: "food-tour", duration: "3 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 14, highlight: "Chile-forward bites in the 318-year-old core", bestFor: "afternoon", brands: ["both"] },
      { name: "Rio Grande Bosque bike + brewery loop", type: "biking", duration: "3 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 12, highlight: "River-trail ride with taproom stops", bestFor: "active afternoon", brands: ["both"] },
      { name: "Breaking Bad RV + filming-locations tour", type: "tour", duration: "3 hr", pricePerPerson: [60,90], groupMin: 4, groupMax: 14, highlight: "Hit the show's ABQ shooting sites", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "Hotel Andaluz", type: "boutique-hotel", pricePerNight: [170,320], perRoom: true, maxGuests: 2, highlight: "Conrad Hilton's 1939 downtown hotel + rooftop bar" },
      { name: "Los Ranchos 4BR adobe", type: "airbnb", pricePerNight: [400,850], perRoom: false, maxGuests: 12, highlight: "Bosque-side adobe near Los Poblanos" },
    ],
    transport: [
      { name: "ABQ party bus", type: "party-bus", priceRange: "$140-$280/group", highlight: "Brewery + tram + balloon-field runs" },
    ],
    presentation: {
      moh: { tagline: "Sunrise balloons, chile feasts, and a tram to the sky", description: "Albuquerque is the unexpectedly cool pick: a sunrise balloon ride in the world's ballooning capital, the longest tram in North America to a cocktail bar at 10,000 feet, and a Nob Hill speakeasy scene. Red-or-green chile everywhere and prices that leave room for the trip." },
      bestman: { tagline: "Balloon at dawn, tram to a 10,000-ft bar, Breaking Bad by van", description: "Albuquerque delivers desert oddball energy: ride a balloon at sunrise, take the longest aerial tram in North America to a ridge-top bar, do the Breaking Bad tour, then hit Marble's rooftop. Chile-soaked food and a low bill." },
    } },

  // Taos, NM
  { id: "taos-nm", city: "Taos", state: "NM", region: "west",
    nearestAirport: { code: "ABQ", name: "Albuquerque Intl Sunport", driveMinutes: 150 },
    bestMonths: [1,2,6,7,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "KTAOS Solar Center", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Live-music venue + full bar with Sangre de Cristo views", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Burger Stand at Taos Ale House", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Craft beer + burgers in a lively taproom", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Sagebrush Cantina", type: "honky-tonk", vibe: "balanced", priceRange: "$$", highlight: "Live music every night at the Sagebrush Inn", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "De La Tierra", cuisine: "New American", priceRange: "$$$", highlight: "Seasonal regional dining at El Monte Sagrado", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Lambert's of Taos", cuisine: "Fine dining", priceRange: "$$$", highlight: "Longtime Taos special-occasion table", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Doc Martin's", cuisine: "New Mexican", priceRange: "$$", highlight: "Historic Taos Inn restaurant + Adobe Bar margaritas", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Taos Box whitewater rafting", type: "rafting", duration: "6 hr", pricePerPerson: [110,180], groupMin: 4, groupMax: 16, highlight: "Class III-IV run through the Rio Grande Gorge", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Rio Grande Gorge Bridge + rim walk", type: "scenic-overlook", duration: "2 hr", pricePerPerson: [0,20], groupMin: 2, groupMax: 16, highlight: "650-ft bridge over the gorge + rim trail", bestFor: "photo ops", brands: ["both"] },
      { name: "Taos Pueblo guided visit", type: "walking-tour", duration: "2 hr", pricePerPerson: [25,55], groupMin: 2, groupMax: 14, highlight: "1,000-year-old UNESCO adobe village", bestFor: "morning", brands: ["both"] },
      { name: "Taos Plaza art-gallery + adobe stroll", type: "walking-tour", duration: "2 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 14, highlight: "Native-owned galleries around the historic plaza", bestFor: "afternoon", brands: ["both"] },
      { name: "Taos Ski Valley (winter)", type: "skiing", duration: "6 hr", pricePerPerson: [110,200], groupMin: 2, groupMax: 14, highlight: "Steep, scenic Sangre de Cristo runs", bestFor: "winter day", brands: ["both"] },
    ],
    lodging: [
      { name: "El Monte Sagrado", type: "resort", pricePerNight: [250,500], perRoom: true, maxGuests: 2, highlight: "Eco-luxe resort with spa + Living Spa pools" },
      { name: "Adobe casita 4BR near the Plaza", type: "airbnb", pricePerNight: [400,900], perRoom: false, maxGuests: 12, highlight: "Kiva-fireplace adobe walk to galleries" },
    ],
    transport: [
      { name: "Group SUV from ABQ/SAF", type: "shuttle", priceRange: "$120-$200/day", highlight: "Scenic drive up; Santa Fe (SAF) is closer at ~90 min" },
    ],
    presentation: {
      moh: { tagline: "Adobe art town, gorge rafting, and a 1,000-year-old pueblo", description: "Taos is the soulful, slow-down pick: raft the Taos Box through the Rio Grande Gorge, walk the 650-foot bridge, tour the ancient Pueblo, and browse Native-owned galleries on the Plaza before margaritas at the Adobe Bar. Spa-resort recovery built in." },
      bestman: { tagline: "Class IV on the Rio Grande, gorge bridge, ski-town nights", description: "Taos pairs real adventure with high-desert character: run the Class III-IV Taos Box, stand on the 650-foot gorge bridge, ski steep Sangre de Cristo lines in winter, and catch live music at KTAOS. Gritty, scenic, and unlike anywhere else." },
    } },

  // Colorado Springs, CO
  { id: "colorado-springs-co", city: "Colorado Springs", state: "CO", region: "west",
    nearestAirport: { code: "COS", name: "Colorado Springs Airport", driveMinutes: 15 },
    bestMonths: [5,6,7,8,9], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Lumen8", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Downtown rooftop lounge with craft cocktails + peak views", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Axe and the Oak Distillery", type: "cocktail-bar", vibe: "balanced", priceRange: "$$", highlight: "Local whiskey distillery + tasting room", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Rabbit Hole", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Late-night subterranean New American haunt", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Four by Brother Luck", cuisine: "Southwestern", priceRange: "$$$", highlight: "Top-Chef alum's regional small plates", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Grand View at Garden of the Gods Resort", cuisine: "Fine dining", priceRange: "$$$$", highlight: "Floor-to-ceiling red-rock + Pikes Peak views", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Rabbit Hole brunch", cuisine: "New American", priceRange: "$$", highlight: "Downtown weekend brunch + mimosas", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Garden of the Gods jeep + photo tour", type: "tour", duration: "2 hr", pricePerPerson: [40,75], groupMin: 4, groupMax: 14, highlight: "Open-air tour through the red sandstone formations", bestFor: "first day", brands: ["both"] },
      { name: "Pikes Peak cog railway summit", type: "scenic-overlook", duration: "4 hr", pricePerPerson: [60,90], groupMin: 2, groupMax: 16, highlight: "Cog train to the 14,115-ft summit", bestFor: "morning", brands: ["both"] },
      { name: "Garden of the Gods rock climbing", type: "adventure-park", duration: "3 hr", pricePerPerson: [110,170], groupMin: 2, groupMax: 10, highlight: "Guided climb on the red sandstone", bestFor: "active group", brands: ["both"] },
      { name: "Manitou Springs whitewater rafting", type: "rafting", duration: "4 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 16, highlight: "Arkansas River Class II-III nearby", bestFor: "summer day", brands: ["both"] },
      { name: "Downtown Tejon St brewery + distillery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "Walkable cluster of taprooms + distilleries", bestFor: "first night", brands: ["both"] },
    ],
    lodging: [
      { name: "Garden of the Gods Resort & Club", type: "resort", pricePerNight: [280,600], perRoom: true, maxGuests: 2, highlight: "Spa resort with red-rock + Pikes Peak views" },
      { name: "Old Colorado City 5BR house", type: "airbnb", pricePerNight: [450,1000], perRoom: false, maxGuests: 14, highlight: "Walk to historic shops + near Garden of the Gods" },
    ],
    transport: [
      { name: "Springs party bus", type: "party-bus", priceRange: "$150-$300/group", highlight: "Brewery + Garden of the Gods + Pikes Peak runs" },
    ],
    presentation: {
      moh: { tagline: "Red rocks, a 14er by train, and a spa to recover", description: "Colorado Springs is the scenic, easy pick: jeep through Garden of the Gods at golden hour, take the cog railway up Pikes Peak, then unwind at a red-rock spa resort. Mountain-town drama without the resort-town markup, and its own airport." },
      bestman: { tagline: "Garden of the Gods climbing, a 14er, and a Tejon St crawl", description: "Colorado Springs stacks real outdoors onto an easy base: climb or jeep the red rocks at Garden of the Gods, ride the cog to the top of a 14er, raft the Arkansas, then crawl the Tejon St breweries and distilleries. Its own airport, no Denver detour." },
    } },

  // Vail, CO
  { id: "vail-co", city: "Vail", state: "CO", region: "west",
    nearestAirport: { code: "EGE", name: "Eagle County Regional", driveMinutes: 35 },
    bestMonths: [1,2,3,7,8,9], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Shakedown Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "198-cap live-music basement bar in the Village", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "El Segundo", type: "bar", vibe: "balanced", priceRange: "$$$", highlight: "Taqueria + 100-tequila agave bar in Vail Village", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Express Lift Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Prime base-area aprés steps from Gondola One", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Sweet Basil", cuisine: "New American", priceRange: "$$$$", highlight: "Vail Village fine-dining institution since 1977", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mountain Standard", cuisine: "Wood-fired American", priceRange: "$$$", highlight: "Open-fire cooking on Gore Creek", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Little Diner", cuisine: "Breakfast", priceRange: "$$", highlight: "Cult West Vail brunch spot", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Vail Mountain skiing / snowboarding", type: "skiing", duration: "6 hr", pricePerPerson: [150,260], groupMin: 2, groupMax: 14, highlight: "The legendary Back Bowls", bestFor: "winter day", brands: ["both"] },
      { name: "Gondola One scenic ride + summit hike", type: "hiking", duration: "3 hr", pricePerPerson: [40,75], groupMin: 2, groupMax: 14, highlight: "Lift to 10,350 ft for wildflower trails", bestFor: "summer day", brands: ["both"] },
      { name: "Eagle River whitewater rafting", type: "rafting", duration: "4 hr", pricePerPerson: [80,140], groupMin: 4, groupMax: 16, highlight: "Class II-III runs near the Village", bestFor: "summer day", brands: ["both"] },
      { name: "Bol bowling + cocktails", type: "adventure-park", duration: "2.5 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "Upscale bowling + small plates in Solaris", bestFor: "evening", brands: ["both"] },
      { name: "Aprés-ski village crawl", type: "brunch-crawl", duration: "4 hr", pricePerPerson: [40,100], groupMin: 4, groupMax: 14, highlight: "Walkable Bridge Street aprés bars", bestFor: "first afternoon", brands: ["both"] },
      { name: "RockResorts spa day", type: "spa", duration: "4 hr", pricePerPerson: [200,400], groupMin: 2, groupMax: 8, highlight: "Alpine treatments + thermal pools", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Sonnenalp Hotel", type: "resort", pricePerNight: [400,900], perRoom: true, maxGuests: 2, highlight: "Bavarian-style luxury in Vail Village + spa" },
      { name: "Lionshead 4BR ski condo", type: "airbnb", pricePerNight: [700,1800], perRoom: false, maxGuests: 12, highlight: "Ski-in/out near the gondola with hot tub" },
    ],
    transport: [
      { name: "Vail village shuttle + EGE transfer", type: "shuttle", priceRange: "$0-$120/group", highlight: "Free in-town bus; EGE transfer 35 min" },
    ],
    presentation: {
      moh: { tagline: "Alpine glamour, gondola wildflowers, and a Bavarian spa", description: "Vail is the polished mountain pick: ride the gondola to wildflower trails in summer or ski the Back Bowls in winter, then aprés on cobblestone Bridge Street and recover at a true alpine spa. Storybook village, big-resort comfort, and a regional airport 35 minutes out." },
      bestman: { tagline: "Back Bowls, the Eagle River, and aprés on Bridge Street", description: "Vail is a real mountain base camp: ski the famous Back Bowls or raft the Eagle River, then work the walkable Bridge Street aprés bars, hit Shakedown for live music, and bowl at Bol. World-class slopes with a village you never have to drive in." },
    } },

  // Crested Butte, CO
  { id: "crested-butte-co", city: "Crested Butte", state: "CO", region: "west",
    nearestAirport: { code: "GUC", name: "Gunnison-Crested Butte Regional", driveMinutes: 35 },
    bestMonths: [1,2,7,8,9], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "The Eldo Brewery", type: "brewpub", vibe: "balanced", priceRange: "$$", highlight: "Second-story Elk Ave deck — 'a sunny place for shady people'", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Talk of the Town", type: "bar", vibe: "balanced", priceRange: "$", highlight: "Classic Elk Ave dive + dance floor", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Montanya Distillers", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Mountain-rum distillery + tasting room", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "The Secret Stash", cuisine: "Pizza", priceRange: "$$", highlight: "Eclectic award-winning pies in a historic building", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Sunflower", cuisine: "Farm-to-table", priceRange: "$$$", highlight: "Seasonal farm-driven plates on Elk Ave", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Slogar", cuisine: "Comfort", priceRange: "$$", highlight: "Family-style fried-chicken prix fixe", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Wildflower hike (July peak)", type: "hiking", duration: "4 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 14, highlight: "Trails through the 'Wildflower Capital of Colorado'", bestFor: "summer morning", brands: ["both"] },
      { name: "Lift-served mountain biking", type: "biking", duration: "4 hr", pricePerPerson: [60,130], groupMin: 2, groupMax: 12, highlight: "30+ miles of lift-access trails at the bike park", bestFor: "active day", brands: ["both"] },
      { name: "Crested Butte skiing / snowboarding (winter)", type: "skiing", duration: "6 hr", pricePerPerson: [120,200], groupMin: 2, groupMax: 14, highlight: "Famously steep extreme terrain", bestFor: "winter day", brands: ["both"] },
      { name: "Elk Avenue bar crawl", type: "brunch-crawl", duration: "4 hr", pricePerPerson: [30,80], groupMin: 4, groupMax: 14, highlight: "Walkable strip of historic-building bars", bestFor: "first night", brands: ["both"] },
      { name: "Taylor River rafting", type: "rafting", duration: "4 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 16, highlight: "Class III runs in the Gunnison Valley", bestFor: "summer day", brands: ["both"] },
    ],
    lodging: [
      { name: "Elevation Hotel & Spa", type: "resort", pricePerNight: [250,500], perRoom: true, maxGuests: 2, highlight: "Slopeside at Mt. Crested Butte with spa" },
      { name: "Historic Elk Ave 4BR Victorian", type: "airbnb", pricePerNight: [500,1100], perRoom: false, maxGuests: 12, highlight: "Painted-lady home walk to the bars" },
    ],
    transport: [
      { name: "Mountain Express + GUC transfer", type: "shuttle", priceRange: "$0-$120/group", highlight: "Free town-to-mountain bus; GUC 35 min" },
    ],
    presentation: {
      moh: { tagline: "Wildflower capital with a painted-Victorian main street", description: "Crested Butte is the charming, uncrowded pick: hike through Colorado's wildflower capital at July peak, browse the painted-lady storefronts on Elk Avenue, and crawl a surprisingly good bar strip for a town this small. End-of-the-road quiet, real mountain-town soul." },
      bestman: { tagline: "Lift-served downhill, steep winter lines, Elk Ave dives", description: "Crested Butte is a true ski-and-ride town with zero pretense: 30+ miles of lift-served downhill in summer, famously steep terrain in winter, and a walkable Elk Avenue lined with dives, a rum distillery, and the best pizza in the valley." },
    } },

  // Glenwood Springs, CO
  { id: "glenwood-springs-co", city: "Glenwood Springs", state: "CO", region: "west",
    nearestAirport: { code: "EGE", name: "Eagle County Regional", driveMinutes: 50 },
    bestMonths: [5,6,7,8,9], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Glenwood Canyon Brewpub", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Downtown brewery + pub on the rail line", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Riviera Supper Club", type: "lounge", vibe: "chill", priceRange: "$$", highlight: "Nightly piano + cocktails over dinner", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Pullman", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Craft cocktails + chef plates downtown", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "The Pullman", cuisine: "New American", priceRange: "$$$", highlight: "Seasonal mountain-modern dinners", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Slope & Hatch", cuisine: "Tacos + dogs", priceRange: "$", highlight: "Gourmet tacos and dogs, group-easy", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Daily Bread Café", cuisine: "Breakfast", priceRange: "$", highlight: "Decades-old downtown breakfast standby", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Iron Mountain Hot Springs soak", type: "spa", duration: "3 hr", pricePerPerson: [40,75], groupMin: 2, groupMax: 16, highlight: "16+ riverside pools incl. 21+ WorldSprings", bestFor: "recovery day", brands: ["both"] },
      { name: "Glenwood Caverns Adventure Park", type: "adventure-park", duration: "4 hr", pricePerPerson: [60,100], groupMin: 4, groupMax: 16, highlight: "Mountaintop coasters, canyon swing + cave tours", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Glenwood Canyon whitewater rafting", type: "rafting", duration: "4 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 16, highlight: "Colorado River Class II-III through the canyon", bestFor: "summer day", brands: ["both"] },
      { name: "Hanging Lake / Canyon bike path", type: "biking", duration: "3 hr", pricePerPerson: [25,55], groupMin: 2, groupMax: 12, highlight: "Paved Glenwood Canyon trail along the river", bestFor: "active morning", brands: ["both"] },
      { name: "Yampah vapor caves + spa", type: "spa", duration: "2 hr", pricePerPerson: [30,80], groupMin: 2, groupMax: 10, highlight: "Natural underground steam caves", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hotel Colorado", type: "hotel", pricePerNight: [180,360], perRoom: true, maxGuests: 2, highlight: "1893 grand hotel across from the hot springs" },
      { name: "Roaring Fork 4BR riverside home", type: "airbnb", pricePerNight: [400,900], perRoom: false, maxGuests: 12, highlight: "River-view house walk to downtown + springs" },
    ],
    transport: [
      { name: "Group SUV / Amtrak", type: "shuttle", priceRange: "$0-$150/group", highlight: "Amtrak California Zephyr stops downtown; EGE 50 min" },
    ],
    presentation: {
      moh: { tagline: "Riverside hot-spring pools and a mountaintop thrill park", description: "Glenwood Springs is the soak-and-adventure pick: 16 riverside hot-spring pools (with a 21+ section), a mountaintop park with coasters and cave tours, and Colorado River rafting between Aspen and Vail. Recovery and thrills in the same valley, even reachable by train." },
      bestman: { tagline: "Canyon rafting, mountaintop coasters, and hot-spring recovery", description: "Glenwood Springs runs the gamut in one day: raft the Colorado through Glenwood Canyon, ride the highest looping coaster in the US atop Iron Mountain, then soak it all off in riverside hot-spring pools. Big adventure with a built-in recovery plan." },
    } },

  // Mammoth Lakes, CA
  { id: "mammoth-lakes-ca", city: "Mammoth Lakes", state: "CA", region: "west",
    nearestAirport: { code: "RNO", name: "Reno-Tahoe Intl", driveMinutes: 165 },
    bestMonths: [1,2,3,7,8,9], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Mammoth Brewing Company", type: "brewpub", vibe: "balanced", priceRange: "$$", highlight: "Hop-forward tasting room + big group tables", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Lakanuki", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Village tiki bar with famous mai tais", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Outlaw Saloon", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Big booths + tables built for bigger parties", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Mammoth Tavern", cuisine: "Gastropub", priceRange: "$$$", highlight: "California-spin gastro fare + fondue", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Vulcania", cuisine: "Italian", priceRange: "$$$", highlight: "Wood-fired Italian by the Village gondola", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Stellar Brew", cuisine: "Breakfast café", priceRange: "$", highlight: "Local breakfast burritos + coffee", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Mammoth Mountain skiing / snowboarding", type: "skiing", duration: "6 hr", pricePerPerson: [150,250], groupMin: 2, groupMax: 14, highlight: "Some of the deepest, longest seasons in the West", bestFor: "winter day", brands: ["both"] },
      { name: "Scenic Gondola to 11,053 ft", type: "scenic-overlook", duration: "2.5 hr", pricePerPerson: [40,65], groupMin: 2, groupMax: 16, highlight: "Year-round ride to the Eleven53 deck", bestFor: "first day", brands: ["both"] },
      { name: "Hot Creek + natural hot springs soak", type: "spa", duration: "3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 12, highlight: "Wild geothermal springs near town", bestFor: "recovery day", brands: ["both"] },
      { name: "Mammoth Lakes Basin hike", type: "hiking", duration: "4 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 14, highlight: "Crystal Lake + alpine basin trails", bestFor: "summer morning", brands: ["both"] },
      { name: "June Lake Loop brewery + lake day", type: "brewery-tour", duration: "5 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "June Lake Brewing + four-lake scenic drive", bestFor: "summer day", brands: ["both"] },
    ],
    lodging: [
      { name: "The Westin Monache Resort", type: "resort", pricePerNight: [280,550], perRoom: true, maxGuests: 4, highlight: "Village ski-in base by the gondola" },
      { name: "Mammoth 4BR ski cabin", type: "airbnb", pricePerNight: [500,1300], perRoom: false, maxGuests: 12, highlight: "Hot tub + shuttle to the mountain" },
    ],
    transport: [
      { name: "Group SUV / Mammoth Transit", type: "shuttle", priceRange: "$0-$150/group", highlight: "Free town trolley; RNO ~2.75 hr, LA ~5 hr" },
    ],
    presentation: {
      moh: { tagline: "Eastern Sierra alpine, wild hot springs, and tiki mai tais", description: "Mammoth is the dramatic-Sierra pick: gondola to 11,000 feet, soak in wild geothermal hot springs at sunrise, hike alpine basins, then mai tais at the Village tiki bar. Big mountain scenery with breweries and a walkable base — long winters, lush summers." },
      bestman: { tagline: "Deepest-season skiing, wild hot springs, brewery base", description: "Mammoth has the longest, deepest ski season in California and a summer to match: ride the gondola, soak in free geothermal springs, hike the lakes basin, and post up at Mammoth Brewing. Remote enough to feel earned, with the bars to back it up." },
    } },

  // Joshua Tree, CA
  { id: "joshua-tree-ca", city: "Joshua Tree", state: "CA", region: "west",
    nearestAirport: { code: "PSP", name: "Palm Springs Intl", driveMinutes: 50 },
    bestMonths: [3,4,5,10,11], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Pappy & Harriet's", type: "honky-tonk", vibe: "balanced", priceRange: "$$", highlight: "Legendary Pioneertown BBQ + live-music roadhouse", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Red Dog Saloon", type: "saloon", vibe: "balanced", priceRange: "$$", highlight: "Wild-West movie-set saloon on Mane Street", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Joshua Tree Saloon", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Town-center bar + grill near the park gate", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "La Copine", cuisine: "New American", priceRange: "$$$", highlight: "Desert destination dining in Flamingo Heights", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Pioneertown BBQ at Pappy's", cuisine: "BBQ + Tex-Mex", priceRange: "$$", highlight: "Burgers, steaks + smoked plates indoors/out", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Crossroads Cafe", cuisine: "Café", priceRange: "$", highlight: "Hiker-favorite breakfast at the park gate", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Joshua Tree National Park hike + boulder scramble", type: "hiking", duration: "4 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 14, highlight: "Hidden Valley + Skull Rock among the Joshua trees", bestFor: "morning", brands: ["both"] },
      { name: "Stargazing night tour", type: "tour", duration: "2 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "Dark-sky telescope session in the high desert", bestFor: "evening", brands: ["both"] },
      { name: "Pioneertown Mountains Preserve horseback ride", type: "horseback-riding", duration: "2 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 12, highlight: "Trail ride through the movie-set badlands", bestFor: "morning", brands: ["both"] },
      { name: "Desert villa pool + sunset photoshoot", type: "photoshoot", duration: "2 hr", pricePerPerson: [40,100], groupMin: 4, groupMax: 14, highlight: "Cowboy-pool golden-hour shoot at the rental", bestFor: "afternoon downtime", brands: ["both"] },
      { name: "Rock climbing in the park", type: "adventure-park", duration: "4 hr", pricePerPerson: [120,180], groupMin: 2, groupMax: 8, highlight: "Guided climb on world-famous granite", bestFor: "active group", brands: ["both"] },
      { name: "Desert sound bath", type: "sound-bath", duration: "1.5 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 12, highlight: "Crystal-bowl session under the high-desert sky", bestFor: "afternoon downtime", brands: ["moh"] },
    ],
    lodging: [
      { name: "Pioneertown Motel", type: "boutique-hotel", pricePerNight: [200,380], perRoom: true, maxGuests: 2, highlight: "Restored Western-set motel next to Pappy's" },
      { name: "Desert 4BR villa with cowboy pool", type: "airbnb", pricePerNight: [500,1400], perRoom: false, maxGuests: 12, highlight: "Hot tub, plunge pool + stargazing deck" },
    ],
    transport: [
      { name: "Group SUV from PSP", type: "shuttle", priceRange: "$80-$150/day", highlight: "Car required; ~50 min from Palm Springs airport" },
    ],
    presentation: {
      moh: { tagline: "Cowboy-pool villas, desert sound baths, and dark-sky nights", description: "Joshua Tree is the design-girl desert pick: a photogenic villa with a cowboy pool and stargazing deck, a sound bath under the Joshua trees, golden-hour shoots, and live music at Pappy & Harriet's. Slow, surreal, and made for a group rental with a hot tub." },
      bestman: { tagline: "Boulder scrambles, Pappy & Harriet's, and the darkest skies", description: "Joshua Tree is a low-key desert escape with real adventure: scramble granite in the national park, climb world-famous routes, then BBQ and live music at Pappy & Harriet's biker roadhouse. Stargaze from a pool-equipped villa under the darkest skies around." },
    } },

  // Missoula, MT
  { id: "missoula-mt", city: "Missoula", state: "MT", region: "west",
    nearestAirport: { code: "MSO", name: "Missoula Montana Airport", driveMinutes: 15 },
    bestMonths: [5,6,7,8,9], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Montgomery Distillery", type: "cocktail-bar", vibe: "balanced", priceRange: "$$", highlight: "Montana-grain spirits + cocktails downtown", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "KettleHouse Brewing", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Riverside taproom of a beloved MT brewery", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Rhinoceros", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "50+ taps, a 30-year downtown staple", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Scotty's Table", cuisine: "New American", priceRange: "$$$", highlight: "Local, seasonal regional plates downtown", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Biga Pizza", cuisine: "Pizza", priceRange: "$$", highlight: "Wood-fired pies, widely called the city's best", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Catalyst Café", cuisine: "Breakfast", priceRange: "$$", highlight: "Downtown brunch + espresso", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Alberton Gorge whitewater rafting", type: "rafting", duration: "5 hr", pricePerPerson: [80,150], groupMin: 4, groupMax: 16, highlight: "Class III-IV Clark Fork canyon run", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Clark Fork brewery float", type: "kayaking", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 16, highlight: "Mellow river float between taprooms", bestFor: "hot afternoon", brands: ["both"] },
      { name: "Downtown brewery + distillery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "Walkable cluster of taprooms + Montgomery", bestFor: "first night", brands: ["both"] },
      { name: "Mount Sentinel 'M' trail hike", type: "hiking", duration: "1.5 hr", pricePerPerson: [0,10], groupMin: 2, groupMax: 14, highlight: "Switchback climb to a city overlook", bestFor: "active morning", brands: ["both"] },
      { name: "Blackfoot River fly-fishing float", type: "fishing", duration: "5 hr", pricePerPerson: [120,220], groupMin: 2, groupMax: 8, highlight: "Guided drift on the 'A River Runs Through It' water", bestFor: "morning", brands: ["both"] },
    ],
    lodging: [
      { name: "The Wren Hotel", type: "boutique-hotel", pricePerNight: [180,340], perRoom: true, maxGuests: 2, highlight: "Modern downtown boutique near the breweries" },
      { name: "Riverfront 4BR home", type: "airbnb", pricePerNight: [400,900], perRoom: false, maxGuests: 12, highlight: "Clark Fork-side house walk to downtown" },
    ],
    transport: [
      { name: "Missoula group shuttle", type: "shuttle", priceRange: "$120-$250/group", highlight: "Rafting put-in + brewery runs, 15-min from MSO" },
    ],
    presentation: {
      moh: { tagline: "River town with breweries, floats, and easy mountain air", description: "Missoula is the laid-back river-town pick: float the Clark Fork between taprooms, raft the Alberton Gorge for a jolt, and crawl a genuinely good downtown brewery-and-distillery scene. College-town friendly, mountain-fresh, and an easy 15 minutes from the airport." },
      bestman: { tagline: "Alberton Gorge whitewater, blue-ribbon fishing, brewery row", description: "Missoula is an outdoorsman's river town: run Class III-IV at the Alberton Gorge, drift-fish the Blackfoot, then float the Clark Fork into a downtown packed with breweries and Montgomery Distillery. Real Montana with a walkable bar core and its own airport." },
    } },

  // McCall, ID
  { id: "mccall-id", city: "McCall", state: "ID", region: "west",
    nearestAirport: { code: "BOI", name: "Boise Airport", driveMinutes: 110 },
    bestMonths: [1,2,7,8,9], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Salmon River Brewery", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Brewery in the old McCall train depot, elk burgers", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "McCall Brewing Company", type: "brewpub", vibe: "chill", priceRange: "$$", highlight: "Downtown brewpub with lake-edge deck", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Foresters Club", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Local downtown bar near the lakefront", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Rupert's at Hotel McCall", cuisine: "Fine dining", priceRange: "$$$", highlight: "Northwest seasonal dinners on the lake", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Cutwater", cuisine: "American", priceRange: "$$$", highlight: "Lakefront New American + cocktails", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Pueblo Lindo", cuisine: "Mexican", priceRange: "$$", highlight: "Margaritas + group-friendly Mexican", bestFor: "casual-dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Payette Lake boat + SUP day", type: "boat-cruise", duration: "4 hr", pricePerPerson: [50,120], groupMin: 4, groupMax: 16, highlight: "Rent a boat on 22 miles of clear shoreline", bestFor: "centerpiece day", brands: ["both"] },
      { name: "Salmon River whitewater rafting", type: "rafting", duration: "6 hr", pricePerPerson: [100,180], groupMin: 4, groupMax: 16, highlight: "Guided run on the nearby Salmon", bestFor: "summer day", brands: ["both"] },
      { name: "Gold Fork Hot Springs soak", type: "spa", duration: "3 hr", pricePerPerson: [10,30], groupMin: 2, groupMax: 12, highlight: "Tiered natural pools 30 min south", bestFor: "recovery day", brands: ["both"] },
      { name: "Ponderosa State Park hike + bike", type: "hiking", duration: "3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 14, highlight: "Peninsula trails into Payette Lake", bestFor: "active morning", brands: ["both"] },
      { name: "Sunset lake cruise on the Idaho", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [40,90], groupMin: 6, groupMax: 30, highlight: "62-ft vessel cruise across Payette Lake", bestFor: "last night", brands: ["both"] },
      { name: "Brundage Mountain skiing (winter)", type: "skiing", duration: "6 hr", pricePerPerson: [90,160], groupMin: 2, groupMax: 14, highlight: "Famous powder above the lake", bestFor: "winter day", brands: ["both"] },
    ],
    lodging: [
      { name: "Shore Lodge", type: "resort", pricePerNight: [300,650], perRoom: true, maxGuests: 4, highlight: "Lakefront resort on Payette with The Cove spa" },
      { name: "Payette Lake 5BR cabin", type: "airbnb", pricePerNight: [500,1300], perRoom: false, maxGuests: 14, highlight: "Dock + hot tub on the lake" },
    ],
    transport: [
      { name: "Group SUV from Boise", type: "shuttle", priceRange: "$100-$180/day", highlight: "~2 hr scenic drive north from BOI" },
    ],
    presentation: {
      moh: { tagline: "Alpine lake cabin, hot-spring soaks, and a true mountain quiet", description: "McCall is the secret-lake pick: a dock cabin on crystal-clear Payette Lake, a soak at tiered Gold Fork Hot Springs, sunset cruises, and a lakefront resort spa to recover. Idaho's most underrated mountain-lake town — quiet, scenic, and worth the drive from Boise." },
      bestman: { tagline: "Payette Lake boat days, the Salmon River, and powder above town", description: "McCall is a real lake-and-river base camp: rent a boat on Payette, raft the Salmon, ski Brundage powder in winter, then soak at Gold Fork and post up at Salmon River Brewery in the old depot. Off the radar, big on water, two hours from Boise." },
    } },
];
