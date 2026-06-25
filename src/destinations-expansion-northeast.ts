/**
 * Canonical destinations — Northeast US expansion (added 2026-06-24).
 *
 * 16 new northeast cities filling the remaining gaps in NH / CT / upstate-NY /
 * PA / ME / NJ / MD / MA / VT. None duplicate the existing catalog
 * (destinations-data.ts + plan-my-party data + prior expansion files).
 *
 * Every venue, activity, lodging, and airport code below is real and
 * web-verified at time of write. Per-brand presentation blocks carry distinct
 * voices (bachelorette vs bachelor). Activity types conform to the per-brand
 * enums (rowdy → bestman, pampering/aesthetic → moh, most dining/activities
 * → both).
 *
 * Per-city minimums met: 3 nightlife / 3 dining / 5 activities / 2 lodging /
 * 1 transport.
 */

import type { CanonicalDestination } from "./destinations-types";

export const expansionNortheast: CanonicalDestination[] = [
  // 1
  { id: "portsmouth-nh", city: "Portsmouth", state: "NH", region: "northeast",
    nearestAirport: { code: "PWM", name: "Portland Intl Jetport", driveMinutes: 50 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "The Press Room", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Four-decade live-music institution on Daniel Street with dance nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Slow Burn Lounge", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "1700s cellar bar with 150+ bourbons under the cobblestones", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Thirsty Moose Taphouse", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "100+ tap lines + live music downstairs", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Row 34", cuisine: "Seafood / raw bar", priceRange: "$$$", highlight: "Oysters + New England seafood in a buzzy room", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Friendly Toast", cuisine: "Brunch", priceRange: "$$", highlight: "Retro diner with bottomless coffee + creative plates", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Earth Eagle Brewings", cuisine: "Gastropub", priceRange: "$$", highlight: "House brews + gruit beers + shareable food", bestFor: "lunch", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Isles of Shoals harbor cruise", type: "boat-cruise", duration: "3 hr", pricePerPerson: [40,75], groupMin: 4, groupMax: 30, highlight: "Star Island lighthouse cruise out of Portsmouth Harbor", bestFor: "first day", brands: ["both"] },
      { name: "Portsmouth craft-cocktail + brewery walk", type: "brewery-tour", duration: "3 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 14, highlight: "Portsmouth Brewery + Earth Eagle + Press Room loop on foot", bestFor: "first night", brands: ["both"] },
      { name: "Strawbery Banke + Old Town walking tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [25,55], groupMin: 2, groupMax: 16, highlight: "Living-history waterfront village + colonial Old Town", bestFor: "afternoon", brands: ["both"] },
      { name: "Piscataqua River kayak paddle", type: "kayaking", duration: "3 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Guided paddle past the harbor tugs and Kittery shoreline", bestFor: "active morning", brands: ["both"] },
      { name: "Spa day at Wentworth by the Sea", type: "spa", duration: "4 hr", pricePerPerson: [180,360], groupMin: 2, groupMax: 8, highlight: "Ocean-view treatments at the grand New Castle resort", bestFor: "recovery day", brands: ["moh"] },
      { name: "Seacoast wine + paint afternoon", type: "pottery-class", duration: "2 hr", pricePerPerson: [45,85], groupMin: 6, groupMax: 14, highlight: "BYO bubbles paint session in the arts district", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Great Bay deep-sea fishing charter", type: "fishing", duration: "5 hr", pricePerPerson: [120,260], groupMin: 4, groupMax: 12, highlight: "Striper + cod charter off the New Hampshire coast", bestFor: "morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hotel Portsmouth", type: "boutique-hotel", pricePerNight: [260,460], perRoom: true, maxGuests: 2, highlight: "Victorian B&B-style boutique steps from the bars" },
      { name: "South End harbor townhouse", type: "airbnb", pricePerNight: [500,1100], perRoom: false, maxGuests: 10, highlight: "Walkable 4BR near Strawbery Banke + the waterfront" },
    ],
    transport: [{ name: "Seacoast party shuttle", type: "shuttle", priceRange: "$120-$260/group", highlight: "Brewery + beach runs to Hampton and Kittery" }],
    presentation: {
      moh: { tagline: "Seacoast charm without the Cape crowds", description: "Portsmouth is the New England weekend that feels coastal and walkable at once — a brick downtown of cocktail cellars and oyster bars, a harbor cruise to the Isles of Shoals, and a spa afternoon at Wentworth before a long dinner. Low-key, photogenic, and easy to pull off." },
      bestman: { tagline: "Oysters, taphouses, and harbor charters", description: "Portsmouth keeps a weekend tight: a striper charter at dawn, oysters and a 100-tap house by lunch, a brewery walk through the brick Old Town, and a live-music room that's been the spot for forty years. Walkable start to finish." },
    } },

  // 2
  { id: "north-conway-nh", city: "North Conway", state: "NH", region: "northeast",
    nearestAirport: { code: "PWM", name: "Portland Intl Jetport", driveMinutes: 90 },
    bestMonths: [1,2,6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Moat Mountain Smoke House & Brewing", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "174-seat brewpub in a historic building with house ales + BBQ", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Sea Dog Brewing Co.", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Horseshoe bar, 14 taps + nano-brewed cask ales", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Ledge Brewing Company", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Granite-slab tap + mountain-town home brews north of the village", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Wild Rose at Stonehurst Manor", cuisine: "Wood-fired American", priceRange: "$$$", highlight: "Wood-fired bread + pizza with mountain views", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Peach's", cuisine: "Breakfast / brunch", priceRange: "$$", highlight: "Locals' breakfast spot with farmhouse plates", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "May Kelly's Cottage", cuisine: "Irish pub", priceRange: "$$", highlight: "Hillside Irish pub with a deck over the valley", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Conway Scenic Railroad ride", type: "tour", duration: "3 hr", pricePerPerson: [35,95], groupMin: 2, groupMax: 20, highlight: "Vintage train through Crawford Notch from the Victorian depot", bestFor: "afternoon", brands: ["both"] },
      { name: "Saco River kayak + tube float", type: "kayaking", duration: "4 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 16, highlight: "Lazy paddle or tube on the Saco with river outfitters", bestFor: "summer day", brands: ["both"] },
      { name: "Cranmore Mountain Adventure Park", type: "adventure-park", duration: "3 hr", pricePerPerson: [40,90], groupMin: 2, groupMax: 14, highlight: "Mountain coaster, ziplines, and aerial park at the ski hill", bestFor: "active afternoon", brands: ["both"] },
      { name: "White Mountains brewery van crawl", type: "brewery-tour", duration: "4 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 14, highlight: "Moat + Ledge + Tuckerman valley-wide with a driver", bestFor: "first night", brands: ["both"] },
      { name: "Diana's Baths + Cathedral Ledge hike", type: "hiking", duration: "3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 12, highlight: "Waterfall cascades + a quick climb to the cliff overlook", bestFor: "morning", brands: ["both"] },
      { name: "Mt. Washington Auto Road summit drive", type: "scenic-overlook", duration: "3 hr", pricePerPerson: [40,80], groupMin: 2, groupMax: 8, highlight: "Drive or guided van to the Northeast's highest summit", bestFor: "clear day", brands: ["both"] },
      { name: "Alpine Adventures zipline canopy tour", type: "zip-lining", duration: "3 hr", pricePerPerson: [90,160], groupMin: 4, groupMax: 12, highlight: "Treetop zip course in the White Mountains", bestFor: "active day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "White Mountain Hotel & Resort", type: "resort", pricePerNight: [240,440], perRoom: true, maxGuests: 2, highlight: "Cathedral Ledge views + pool + on-site dining" },
      { name: "Mt. Washington Valley chalet", type: "house", pricePerNight: [500,1300], perRoom: false, maxGuests: 14, highlight: "Hot tub + game room minutes from the village" },
    ],
    transport: [{ name: "Valley adventure shuttle", type: "shuttle", priceRange: "$140-$300/group", highlight: "Brewery and trailhead runs across the Mt. Washington Valley" }],
    presentation: {
      moh: { tagline: "Mountain-town weekend with a coaster and a deck", description: "North Conway is the easy outdoorsy version of a New England getaway — a scenic train, a lazy Saco float, an afternoon at the mountain coaster, then deck dinners with valley views. Tax-free shopping at Settlers Green is the bonus round." },
      bestman: { tagline: "Six breweries, a zipline, and Mt. Washington", description: "North Conway is a White Mountains base camp: zipline canopy tours, the Saco River, the auto road to the summit, and one of the densest brewery clusters in New England. Rent a chalet with a hot tub and run the valley." },
    } },

  // 3
  { id: "mystic-ct", city: "Mystic", state: "CT", region: "northeast",
    nearestAirport: { code: "PVD", name: "T.F. Green Intl", driveMinutes: 50 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "The Engine Room", type: "bar", vibe: "balanced", priceRange: "$$$", highlight: "Industrial-chic spot with a deep whiskey list + craft burgers", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Red 36", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Waterfront raw bar + deck on the Mystic River", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Port of Call", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Shuffleboard, vintage arcade, and karaoke night below deck", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Oyster Club", cuisine: "Seafood / farm-to-table", priceRange: "$$$", highlight: "James Beard-recognized; the Treehouse deck is the move", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "S&P Oyster", cuisine: "Seafood", priceRange: "$$$", highlight: "River-view seafood + steaks by the Bascule Bridge", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Sift Bakery", cuisine: "Bakery / brunch", priceRange: "$$", highlight: "Award-winning pastries for the morning-after fix", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Schooner Argia sunset sail", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 30, highlight: "81' windjammer past lighthouses and islands from downtown", bestFor: "first night", brands: ["both"] },
      { name: "Mystic Seaport Museum visit", type: "tour", duration: "3 hr", pricePerPerson: [30,55], groupMin: 2, groupMax: 20, highlight: "Tour the Charles W. Morgan whaling ship + planetarium", bestFor: "afternoon", brands: ["both"] },
      { name: "Mystic River paddleboard + kayak", type: "kayaking", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 12, highlight: "Adventure Mystic rentals from Schooner Wharf", bestFor: "active morning", brands: ["both"] },
      { name: "Mystified escape room", type: "escape-room", duration: "1.5 hr", pricePerPerson: [30,45], groupMin: 4, groupMax: 12, highlight: "Live puzzle rooms in downtown Mystic", bestFor: "rainy afternoon", brands: ["both"] },
      { name: "Stonington Borough winery + tasting day", type: "wine-tour", duration: "4 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 14, highlight: "Saltwater Farm + Stonington Vineyards a short hop away", bestFor: "tasting day", brands: ["both"] },
      { name: "Mystic Aquarium beluga encounter", type: "tour", duration: "2 hr", pricePerPerson: [35,90], groupMin: 2, groupMax: 16, highlight: "Belugas, penguins, and sea-lion shows", bestFor: "downtime", brands: ["both"] },
      { name: "Spa day at Spa at Norwich Inn", type: "spa", duration: "4 hr", pricePerPerson: [170,340], groupMin: 2, groupMax: 8, highlight: "Full-service destination spa 20 minutes inland", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Whaler's Inn", type: "boutique-hotel", pricePerNight: [240,440], perRoom: true, maxGuests: 2, highlight: "Downtown, walk to the bridge and the bars" },
      { name: "Mystic River 4BR", type: "airbnb", pricePerNight: [450,1000], perRoom: false, maxGuests: 10, highlight: "Riverside rental within strolling distance of the seaport" },
    ],
    transport: [{ name: "Mystic Country shuttle", type: "shuttle", priceRange: "$120-$260/group", highlight: "Winery loops + casino runs to Foxwoods and Mohegan Sun" }],
    presentation: {
      moh: { tagline: "Coastal Connecticut at golden hour", description: "Mystic is the small-coastal-town weekend that overdelivers: a sunset sail on a real schooner, oysters on the Oyster Club treehouse deck, vineyard tastings in Stonington, and a downtown you can do on foot. Foodie, photogenic, and refreshingly unhurried." },
      bestman: { tagline: "Whiskey bars, schooners, and casino runs", description: "Mystic anchors a relaxed coastal weekend — a windjammer sail, river paddleboards, a deep whiskey list at the Engine Room, and Foxwoods or Mohegan Sun a short shuttle away when the group wants a table." },
    } },

  // 4
  { id: "new-haven-ct", city: "New Haven", state: "CT", region: "northeast",
    nearestAirport: { code: "BDL", name: "Bradley Intl", driveMinutes: 50 },
    bestMonths: [4,5,6,9,10,11], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "116 Crown", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "One of Connecticut's top cocktail bars with an avant-garde menu", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "BAR", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Brewpub + mashed-potato pizza + live-music nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Ordinary", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Historic tavern with an intense, unique cocktail list", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Frank Pepe Pizzeria Napoletana", cuisine: "Pizza", priceRange: "$$", highlight: "The white-clam apizza that put New Haven on the map", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Union League Cafe", cuisine: "French brasserie", priceRange: "$$$", highlight: "Classic brasserie off the Yale green", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Geronimo Southwest Grill", cuisine: "Southwest", priceRange: "$$", highlight: "Largest tequila selection on the East Coast", bestFor: "first night", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "New Haven apizza tour", type: "food-tour", duration: "3 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 14, highlight: "Pepe's vs. Sally's vs. Modern, settled the right way", bestFor: "first day", brands: ["both"] },
      { name: "Chapel + Crown Street cocktail crawl", type: "walking-tour", duration: "3 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 14, highlight: "116 Crown + Ordinary + the downtown craft-bar strip", bestFor: "first night", brands: ["both"] },
      { name: "Yale campus + art-museum walking tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [0,35], groupMin: 2, groupMax: 16, highlight: "Gothic quads + the free Yale University Art Gallery", bestFor: "afternoon", brands: ["both"] },
      { name: "Escape New Haven game", type: "escape-room", duration: "1.5 hr", pricePerPerson: [30,45], groupMin: 4, groupMax: 12, highlight: "Downtown escape rooms for groups of all sizes", bestFor: "rainy afternoon", brands: ["both"] },
      { name: "East Rock Park summit hike", type: "hiking", duration: "2 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 14, highlight: "Quick climb to skyline + Long Island Sound views", bestFor: "morning", brands: ["both"] },
      { name: "Long Island Sound sail charter", type: "boat-cruise", duration: "3 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 12, highlight: "Sail out of City Point with lighthouse views", bestFor: "afternoon", brands: ["both"] },
      { name: "Shubert Theatre pre-Broadway show", type: "tour", duration: "3 hr", pricePerPerson: [45,150], groupMin: 2, groupMax: 16, highlight: "Catch a Broadway-bound production downtown", bestFor: "night out", brands: ["moh"] },
    ],
    lodging: [
      { name: "The Study at Yale", type: "boutique-hotel", pricePerNight: [220,400], perRoom: true, maxGuests: 2, highlight: "Smart boutique on Chapel Street by the galleries" },
      { name: "Wooster Square loft", type: "airbnb", pricePerNight: [350,800], perRoom: false, maxGuests: 8, highlight: "Walk to the apizza row + downtown bars" },
    ],
    transport: [{ name: "Elm City group van", type: "shuttle", priceRange: "$110-$240/group", highlight: "Pizza-tour + casino transfers" }],
    presentation: {
      moh: { tagline: "Apizza, art, and a real night out", description: "New Haven is the underrated city weekend — the country's best apizza, the free Yale art museums, a Broadway-bound show at the Shubert, and a Crown Street cocktail crawl to close it out. Easy on the budget, heavy on the memory." },
      bestman: { tagline: "Clam pizza, tequila, and a pizza-tour debate", description: "New Haven settles the apizza argument in person — Pepe's vs. Sally's vs. Modern — then keeps going with the East Coast's biggest tequila list, a real cocktail bar, and a campus you can walk between rounds." },
    } },

  // 5
  { id: "saratoga-springs-ny", city: "Saratoga Springs", state: "NY", region: "northeast",
    nearestAirport: { code: "ALB", name: "Albany Intl", driveMinutes: 40 },
    bestMonths: [5,6,7,8,9], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Saratoga City Tavern", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Five floors on Caroline Street — tavern, sports bar, nightclub, rooftop", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Sperry's", type: "bar", vibe: "balanced", priceRange: "$$$", highlight: "Iconic Caroline Street patio + supper-club energy", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Bourbon Room", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Deep bourbon + whiskey list and specialty cocktails", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "15 Church", cuisine: "New American", priceRange: "$$$$", highlight: "White-tablecloth standout off Broadway", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Morrissey's at the Adelphi", cuisine: "Wood-fired", priceRange: "$$$", highlight: "Wood-fired pizza + crafted cocktails in the historic Adelphi Hotel", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Wild Horse", cuisine: "Gastropub", priceRange: "$$", highlight: "Caroline Street fine dining with a cozy pub feel", bestFor: "first night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Day at the Saratoga Race Course", type: "tour", duration: "5 hr", pricePerPerson: [10,90], groupMin: 4, groupMax: 20, highlight: "Historic thoroughbred meet (July-Sept) — the whole reason to come", bestFor: "summer afternoon", brands: ["both"] },
      { name: "Spa City Brew Bus", type: "brewery-tour", duration: "4 hr", pricePerPerson: [75,130], groupMin: 6, groupMax: 14, highlight: "Three breweries, wineries, or distilleries with tastings + driver", bestFor: "first day", brands: ["both"] },
      { name: "Roosevelt Baths & Spa mineral soak", type: "spa", duration: "3 hr", pricePerPerson: [110,260], groupMin: 2, groupMax: 8, highlight: "Historic mineral baths in Saratoga Spa State Park", bestFor: "recovery day", brands: ["moh"] },
      { name: "Saratoga Springs walking + spring tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [25,55], groupMin: 2, groupMax: 16, highlight: "Victorian Broadway + the public mineral springs", bestFor: "afternoon", brands: ["both"] },
      { name: "Saratoga Lake pontoon + sunset cruise", type: "boat-cruise", duration: "2 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 12, highlight: "Lake afternoon a few minutes from downtown", bestFor: "sunset", brands: ["both"] },
      { name: "Complexions Spa massage afternoon", type: "spa", duration: "3 hr", pricePerPerson: [140,300], groupMin: 2, groupMax: 8, highlight: "Full-service spa for a bridal-party block booking", bestFor: "bridal afternoon", brands: ["moh"] },
      { name: "Saratoga National golf round", type: "golf", duration: "5 hr", pricePerPerson: [120,240], groupMin: 4, groupMax: 8, highlight: "Upscale public course with a clubhouse restaurant", bestFor: "morning", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Adelphi Hotel", type: "boutique-hotel", pricePerNight: [320,620], perRoom: true, maxGuests: 2, highlight: "Restored Broadway grande-dame with Morrissey's downstairs" },
      { name: "Broadway-area Victorian", type: "airbnb", pricePerNight: [500,1300], perRoom: false, maxGuests: 12, highlight: "Walk to Caroline Street + the track" },
    ],
    transport: [{ name: "Saratoga party shuttle", type: "shuttle", priceRange: "$140-$300/group", highlight: "Track + brewery + lake runs all weekend" }],
    presentation: {
      moh: { tagline: "Hats at the track, mineral baths, and Broadway nights", description: "Saratoga in season is a bachelorette built around a day at the races — sundresses and hats at the historic track, mineral baths at Roosevelt, a brew-bus through the wineries, and five floors of Caroline Street when the group wants to dance." },
      bestman: { tagline: "Track days and five-floor Caroline Street nights", description: "Saratoga is a summer betting-and-bourbon weekend: a day at one of the country's most historic racetracks, a brew bus through three stops, a golf round at Saratoga National, and Caroline Street's five-floor tavern to finish." },
    } },

  // 6
  { id: "lake-placid-ny", city: "Lake Placid", state: "NY", region: "northeast",
    nearestAirport: { code: "SLK", name: "Adirondack Regional", driveMinutes: 25 },
    bestMonths: [1,2,3,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Lake Placid Pub & Brewery", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Birthplace of Ubu Ale; the town's premier brewpub since 1996", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Big Slide Brewery & Public House", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "10 rotating taps + mountain-town public house", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Zig Zags Pub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Olympic-themed dive where the athletes drink", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Generations at Mirror Lake Inn", cuisine: "New American", priceRange: "$$$", highlight: "Lake-view fine dining at the AAA Five-Diamond inn", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Cottage at Mirror Lake Inn", cuisine: "Tavern", priceRange: "$$", highlight: "Lakeside deck for cocktails and a casual lunch", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Liquids & Solids", cuisine: "Gastropub", priceRange: "$$$", highlight: "Charcuterie + craft cocktails on a tight seasonal menu", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Mt. Van Hoevenberg bobsled ride", type: "adventure-park", duration: "2 hr", pricePerPerson: [95,130], groupMin: 1, groupMax: 12, highlight: "Pro-piloted run down the Olympic bobsled track", bestFor: "marquee thrill", brands: ["both"] },
      { name: "Olympic Jumping Complex + zipline", type: "zip-lining", duration: "2 hr", pricePerPerson: [40,90], groupMin: 2, groupMax: 14, highlight: "Elevator to the 120m tower + zipline back to base", bestFor: "afternoon", brands: ["both"] },
      { name: "Whiteface Mountain ski or gondola day", type: "skiing", duration: "6 hr", pricePerPerson: [60,200], groupMin: 2, groupMax: 12, highlight: "Greatest vertical east of the Rockies; gondola in summer", bestFor: "marquee day", brands: ["both"] },
      { name: "Mirror Lake kayak + paddleboard", type: "kayaking", duration: "2 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 12, highlight: "Right off Main Street with motorboat-free water", bestFor: "morning", brands: ["both"] },
      { name: "High Peaks hike (Cascade)", type: "hiking", duration: "4 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 12, highlight: "Most accessible 46er summit with big Adirondack views", bestFor: "active day", brands: ["both"] },
      { name: "Spa day at Mirror Lake Inn", type: "spa", duration: "3 hr", pricePerPerson: [160,340], groupMin: 2, groupMax: 8, highlight: "Lake-view treatments at the Five-Diamond inn", bestFor: "recovery day", brands: ["moh"] },
      { name: "Adirondack brewery + distillery flight", type: "distillery-tour", duration: "3 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 14, highlight: "Big Slide + Lake Placid Spirits tasting hop", bestFor: "first night", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Mirror Lake Inn Resort & Spa", type: "resort", pricePerNight: [380,720], perRoom: true, maxGuests: 2, highlight: "Five-Diamond lakefront with spa + two restaurants" },
      { name: "Lakefront Adirondack lodge", type: "house", pricePerNight: [600,1500], perRoom: false, maxGuests: 12, highlight: "Private dock + great room with a stone fireplace" },
    ],
    transport: [{ name: "Adirondack adventure shuttle", type: "shuttle", priceRange: "$140-$320/group", highlight: "Whiteface + Olympic-site + trailhead runs" }],
    presentation: {
      moh: { tagline: "Olympic-town adventure with a lakefront spa", description: "Lake Placid stacks a memorable weekend — a bobsled run down the Olympic track, a paddle on Mirror Lake right off Main Street, a High Peaks hike, then lake-view treatments at the Mirror Lake Inn spa. Adventurous and storybook at once." },
      bestman: { tagline: "Bobsled the Olympic track, then ski Whiteface", description: "Lake Placid is a two-time Olympic host and it shows: ride the bobsled track with a pro pilot, ski the biggest vertical in the East at Whiteface, summit a 46er, and close at the brewpub that invented Ubu Ale." },
    } },

  // 7
  { id: "niagara-falls-ny", city: "Niagara Falls", state: "NY", region: "northeast",
    nearestAirport: { code: "BUF", name: "Buffalo Niagara Intl", driveMinutes: 30 },
    bestMonths: [5,6,7,8,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Seneca Niagara Casino floor & bars", type: "casino", vibe: "unhinged", priceRange: "$$$", highlight: "Gaming floor + lounges + headliner shows downtown", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Griffon Gastropub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Deep craft-beer list in nearby Lewiston", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Power City Eatery", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Local taproom + coffee bar a few blocks from the falls", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Brickyard Pub & BBQ", cuisine: "BBQ", priceRange: "$$", highlight: "Smoked meats + craft beer in Lewiston", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Savor at the Niagara Falls Culinary Institute", cuisine: "New American", priceRange: "$$$", highlight: "Student-run fine dining with downtown views", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Wine on Third", cuisine: "Wine bar / small plates", priceRange: "$$", highlight: "Downtown wine bar with shareable plates", bestFor: "first night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Maid of the Mist falls boat", type: "boat-cruise", duration: "1 hr", pricePerPerson: [25,45], groupMin: 2, groupMax: 30, highlight: "Iconic boat ride into the base of the Horseshoe Falls", bestFor: "first day", brands: ["both"] },
      { name: "Cave of the Winds deck experience", type: "tour", duration: "1.5 hr", pricePerPerson: [20,40], groupMin: 2, groupMax: 20, highlight: "Hurricane Deck right beside the Bridal Veil Falls", bestFor: "afternoon", brands: ["both"] },
      { name: "Niagara Jet Adventures jet boat", type: "boat-cruise", duration: "1.5 hr", pricePerPerson: [70,120], groupMin: 4, groupMax: 14, highlight: "360 spins + class-V whitewater to the Whirlpool", bestFor: "marquee thrill", brands: ["both"] },
      { name: "Niagara Wine Trail tasting day", type: "wine-tour", duration: "4 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 14, highlight: "Lake Ontario-side wineries north of the falls", bestFor: "tasting day", brands: ["both"] },
      { name: "Whirlpool State Park gorge hike", type: "hiking", duration: "2 hr", pricePerPerson: [0,15], groupMin: 2, groupMax: 12, highlight: "Stairs into the gorge along the Niagara whirlpool", bestFor: "morning", brands: ["both"] },
      { name: "Niagara Helicopters scenic flight", type: "scenic-overlook", duration: "1 hr", pricePerPerson: [120,180], groupMin: 2, groupMax: 6, highlight: "Aerial loop over the Horseshoe Falls", bestFor: "splurge", brands: ["both"] },
      { name: "Old Fort Niagara + lakefront walk", type: "walking-tour", duration: "2 hr", pricePerPerson: [15,40], groupMin: 2, groupMax: 16, highlight: "18th-century fort where the river meets Lake Ontario", bestFor: "afternoon", brands: ["both"] },
    ],
    lodging: [
      { name: "Giacomo Hotel", type: "boutique-hotel", pricePerNight: [180,360], perRoom: true, maxGuests: 2, highlight: "Art-deco tower with a rooftop lounge near the falls" },
      { name: "Riverfront group rental (Lewiston)", type: "airbnb", pricePerNight: [350,900], perRoom: false, maxGuests: 12, highlight: "Quieter base on the lower river minutes from the casino" },
    ],
    transport: [{ name: "Niagara region shuttle", type: "shuttle", priceRange: "$130-$280/group", highlight: "Wine-trail + falls + casino transfers" }],
    presentation: {
      moh: { tagline: "The falls, the wine trail, and a casino night", description: "Niagara Falls is more bachelorette-ready than its reputation: the Maid of the Mist into the spray, a wine-trail afternoon on the Lake Ontario side, a gorge walk, and the Seneca casino floor when the group wants a night. Big scenery, easy budget." },
      bestman: { tagline: "Jet boats, the casino, and the Maid of the Mist", description: "Niagara Falls runs a high-low weekend: a jet boat doing 360s through class-V whitewater, the Maid of the Mist into the Horseshoe, a helicopter loop for the splurge, and the Seneca casino to close it out." },
    } },

  // 8
  { id: "bar-harbor-me", city: "Bar Harbor", state: "ME", region: "northeast",
    nearestAirport: { code: "BGR", name: "Bangor Intl", driveMinutes: 60 },
    bestMonths: [6,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Thirsty Whale Tavern", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Year-round downtown tavern with a deep local-beer list", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "McKay's Public House", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Cozy pub with a garden patio and a strong cocktail list", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Rebel Lobster Speakeasy", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Seasonal speakeasy hidden behind the dining room", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["moh"] },
    ],
    dining: [
      { name: "Stewman's Lobster Pound", cuisine: "Seafood", priceRange: "$$$", highlight: "Waterfront lobster bake straight off the boat", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Side Street Cafe", cuisine: "American", priceRange: "$$", highlight: "Lobster mac + a porch for the whole group", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Havana", cuisine: "Latin-American", priceRange: "$$$", highlight: "Bar Harbor's date-night standout with island sourcing", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Bar Harbor whale watch", type: "boat-cruise", duration: "3.5 hr", pricePerPerson: [60,110], groupMin: 2, groupMax: 30, highlight: "Humpbacks, finbacks, and puffins offshore", bestFor: "first day", brands: ["both"] },
      { name: "Cadillac Mountain sunrise drive", type: "scenic-overlook", duration: "2 hr", pricePerPerson: [10,40], groupMin: 2, groupMax: 12, highlight: "First sunrise in the U.S. from Acadia's summit (reserve ahead)", bestFor: "early morning", brands: ["both"] },
      { name: "Acadia carriage-road bike ride", type: "biking", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 14, highlight: "57 miles of crushed-stone roads through the park", bestFor: "active day", brands: ["both"] },
      { name: "Frenchman Bay sea-kayak tour", type: "kayaking", duration: "3 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Guided paddle past the Porcupine Islands", bestFor: "morning", brands: ["both"] },
      { name: "Bar Island low-tide land-bridge walk", type: "hiking", duration: "1.5 hr", pricePerPerson: [0,10], groupMin: 2, groupMax: 16, highlight: "Walk to the island on the sandbar at low tide", bestFor: "afternoon", brands: ["both"] },
      { name: "Lobster-boat tour + haul", type: "boat-cruise", duration: "2 hr", pricePerPerson: [40,75], groupMin: 4, groupMax: 14, highlight: "Watch a working lobsterman haul traps in the bay", bestFor: "afternoon", brands: ["both"] },
      { name: "Schooner sunset sail", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [55,100], groupMin: 4, groupMax: 24, highlight: "Tall-ship sail out of Bar Harbor at golden hour", bestFor: "first night", brands: ["moh"] },
    ],
    lodging: [
      { name: "Harborside Hotel, Spa & Marina", type: "resort", pricePerNight: [320,620], perRoom: true, maxGuests: 2, highlight: "Waterfront resort with a spa + walk to downtown" },
      { name: "Mount Desert Island cottage", type: "house", pricePerNight: [600,1500], perRoom: false, maxGuests: 12, highlight: "Coastal rental minutes from the Acadia gates" },
    ],
    transport: [{ name: "Island Explorer + private shuttle", type: "shuttle", priceRange: "Free seasonal + $140-$300 charters", highlight: "Free park shuttle in season; private vans for tours" }],
    presentation: {
      moh: { tagline: "Acadia views, lobster bakes, and a sunset sail", description: "Bar Harbor is a coastal-Maine weekend that earns every photo — a whale watch, a Cadillac Mountain sunrise, carriage-road bikes through Acadia, and a schooner sail at golden hour, with lobster pulled straight off the boat every night." },
      bestman: { tagline: "Whale watches, carriage roads, and lobster off the boat", description: "Bar Harbor is the rugged-coast trip: a whale watch offshore, 57 miles of Acadia carriage roads on a bike, a working lobster-boat haul, and a tavern downtown when the group's done. Bangor's an hour out, so fly into BGR and drive." },
    } },

  // 9
  { id: "cape-may-nj", city: "Cape May", state: "NJ", region: "northeast",
    nearestAirport: { code: "ACY", name: "Atlantic City Intl", driveMinutes: 45 },
    bestMonths: [5,6,7,8,9], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Carney's", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beach Avenue bar with live music and a late dance floor", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Rusty Nail", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beachside bar with live bands and firepits", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Cabanas Beach Bar & Grill", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beach Avenue patio + nightly music", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Lobster House", cuisine: "Seafood", priceRange: "$$$", highlight: "Fisherman's-Wharf classic with a raw bar on a schooner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Mad Batter", cuisine: "Brunch", priceRange: "$$", highlight: "Victorian-porch brunch institution", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Lucky Bones Backwater Grille", cuisine: "American", priceRange: "$$", highlight: "Wood-fired pizza + crowd-friendly menu", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Cape May winery tasting trail", type: "wine-tour", duration: "4 hr", pricePerPerson: [60,120], groupMin: 4, groupMax: 14, highlight: "Willow Creek + Cape May Winery + Hawk Haven within minutes", bestFor: "first day", brands: ["both"] },
      { name: "Cape May Cycle Cruises pedal pontoon", type: "boat-cruise", duration: "2 hr", pricePerPerson: [45,90], groupMin: 6, groupMax: 14, highlight: "10-person pedal pontoon with a built-in bar around the harbor", bestFor: "afternoon", brands: ["both"] },
      { name: "Victorian historic district walking tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [20,45], groupMin: 2, groupMax: 16, highlight: "Painted-lady Victorians + the Emlen Physick Estate", bestFor: "afternoon", brands: ["both"] },
      { name: "Cape May Lighthouse + beach day", type: "beach", duration: "4 hr", pricePerPerson: [10,40], groupMin: 2, groupMax: 16, highlight: "Climb the lighthouse, then claim a stretch of sand", bestFor: "afternoon", brands: ["both"] },
      { name: "Dolphin-watch harbor cruise", type: "boat-cruise", duration: "2 hr", pricePerPerson: [35,70], groupMin: 4, groupMax: 30, highlight: "Resident bottlenose dolphins off the Cape", bestFor: "first day", brands: ["both"] },
      { name: "Beach luxe picnic + bubbly", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [65,140], groupMin: 4, groupMax: 14, highlight: "Catered sand spread with rosé and umbrellas", bestFor: "afternoon", brands: ["moh"] },
      { name: "Sea Spa group day at Congress Hall", type: "spa", duration: "3 hr", pricePerPerson: [150,320], groupMin: 4, groupMax: 10, highlight: "Block booking that fits a bigger bridal party", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Congress Hall", type: "resort", pricePerNight: [320,640], perRoom: true, maxGuests: 2, highlight: "Landmark seaside hotel with a spa and the Boiler Room bar" },
      { name: "Victorian beach-block house", type: "house", pricePerNight: [600,1600], perRoom: false, maxGuests: 12, highlight: "Painted-lady rental a block from the sand" },
    ],
    transport: [{ name: "Cape May trolley + party shuttle", type: "shuttle", priceRange: "$120-$280/group", highlight: "Winery-trail + beach runs" }],
    presentation: {
      moh: { tagline: "Painted ladies, wineries, and pedal-pontoon afternoons", description: "Cape May quietly became a top bachelorette pick — three wineries within minutes, a pedal pontoon with its own bar, painted-Victorian streets for the photos, and a beach luxe picnic with bubbly. Congress Hall anchors it all in style." },
      bestman: { tagline: "Beach bars, dolphin cruises, and the Lobster House", description: "Cape May is the laid-back shore weekend: a pedal pontoon with a bar around the harbor, a winery trail, dolphin cruises off the Cape, and beach bars with live bands. Less boardwalk chaos than the rest of the Jersey Shore." },
    } },

  // 10
  { id: "annapolis-md", city: "Annapolis", state: "MD", region: "northeast",
    nearestAirport: { code: "BWI", name: "Baltimore/Washington Intl", driveMinutes: 30 },
    bestMonths: [4,5,6,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Middleton Tavern", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "250-year-old waterfront tavern with nightly live music + oyster bar", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Pusser's Caribbean Grille", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Painkillers on the City Dock waterfront deck", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Stan & Joe's Saloon", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "West Street tavern with live bands, trivia, and karaoke", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Cantler's Riverside Inn", cuisine: "Crab house", priceRange: "$$$", highlight: "The definitive Annapolis crab pick since 1974, on Mill Creek", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Carrol's Creek Cafe", cuisine: "Chesapeake seafood", priceRange: "$$$", highlight: "Spa Creek views of the Bay Bridge + city skyline", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Boatyard Bar & Grill", cuisine: "Seafood / raw bar", priceRange: "$$", highlight: "Award-winning crab cakes + a great raw bar", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Woodwind schooner sunset sail", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [55,90], groupMin: 4, groupMax: 24, highlight: "74' schooner into the Chesapeake with cocktails aboard", bestFor: "first night", brands: ["both"] },
      { name: "Annapolis sailing lesson / skippered charter", type: "boat-cruise", duration: "3 hr", pricePerPerson: [80,160], groupMin: 4, groupMax: 8, highlight: "Take the helm in the sailing capital of the U.S.", bestFor: "active afternoon", brands: ["both"] },
      { name: "Maryland crab feast", type: "food-tour", duration: "2.5 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 16, highlight: "Mallets, Old Bay, and a bushel at a creekside crab house", bestFor: "group-dinner", brands: ["both"] },
      { name: "Historic Annapolis + Naval Academy walking tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [25,55], groupMin: 2, groupMax: 16, highlight: "Colonial streets + the USNA yard", bestFor: "afternoon", brands: ["both"] },
      { name: "Spa Creek kayak + paddleboard", type: "kayaking", duration: "2 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 12, highlight: "Paddle the creeks past the historic harbor", bestFor: "morning", brands: ["both"] },
      { name: "Eastern Shore + St. Michaels wine day", type: "wine-tour", duration: "5 hr", pricePerPerson: [80,150], groupMin: 4, groupMax: 14, highlight: "Cross the Bay Bridge for vineyards + a waterfront lunch", bestFor: "tasting day", brands: ["both"] },
      { name: "Rams Head On Stage show + dinner", type: "tour", duration: "3 hr", pricePerPerson: [40,120], groupMin: 4, groupMax: 12, highlight: "300-seat listening room with national touring acts", bestFor: "night out", brands: ["moh"] },
    ],
    lodging: [
      { name: "Annapolis Waterfront Hotel", type: "hotel", pricePerNight: [280,520], perRoom: true, maxGuests: 2, highlight: "Only hotel directly on the harbor at City Dock" },
      { name: "Eastport waterfront townhouse", type: "airbnb", pricePerNight: [450,1100], perRoom: false, maxGuests: 10, highlight: "Walk-to-the-dock 4BR with a creek view" },
    ],
    transport: [{ name: "Annapolis harbor shuttle", type: "shuttle", priceRange: "$120-$260/group", highlight: "Crab-house + winery + downtown transfers" }],
    presentation: {
      moh: { tagline: "Schooner sails, crab feasts, and harbor-town charm", description: "Annapolis is the easy waterfront weekend — a sunset sail on a schooner, a creekside crab feast with mallets and Old Bay, a paddle on Spa Creek, and a Rams Head show to close. Colonial-pretty, walkable, and 30 minutes from BWI." },
      bestman: { tagline: "Sail the Chesapeake, then crack a bushel", description: "Annapolis is the sailing capital, so take the helm on a skippered charter, crack a bushel of blue crabs creekside, and post up at a 250-year-old tavern with live music. Low-key, on-the-water, and easy to reach." },
    } },

  // 11
  { id: "berkshires-ma", city: "Berkshires", state: "MA", region: "northeast",
    nearestAirport: { code: "ALB", name: "Albany Intl", driveMinutes: 55 },
    bestMonths: [6,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Mooncloud", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Inventive cocktails in a cozy upscale Pittsfield room", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Thistle & Mirth", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Hip gastropub with deep craft beer + whiskey", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Barrington Brewery & Restaurant", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Solar-powered craft brewery + American fare in Great Barrington", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "Nudel", cuisine: "Seasonal American", priceRange: "$$$", highlight: "Tiny, beloved Lenox spot built on the day's market", bestFor: "group-dinner", groupFriendly: false, brands: ["both"] },
      { name: "Prairie Whale", cuisine: "Farm-to-table", priceRange: "$$$", highlight: "Great Barrington farmhouse plates with a patio", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Haven Cafe & Bakery", cuisine: "Brunch", priceRange: "$$", highlight: "Lenox brunch staple with house pastries", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Concert on the lawn at Tanglewood", type: "tour", duration: "4 hr", pricePerPerson: [30,120], groupMin: 2, groupMax: 16, highlight: "Boston Symphony summer home — bring a picnic and rosé", bestFor: "summer evening", brands: ["both"] },
      { name: "MASS MoCA contemporary-art day", type: "tour", duration: "3 hr", pricePerPerson: [20,30], groupMin: 2, groupMax: 16, highlight: "The country's largest contemporary-art campus in North Adams", bestFor: "afternoon", brands: ["both"] },
      { name: "Canyon Ranch spa day", type: "spa", duration: "5 hr", pricePerPerson: [250,500], groupMin: 2, groupMax: 8, highlight: "Destination-spa treatments + grounds in Lenox", bestFor: "recovery day", brands: ["moh"] },
      { name: "Berkshires winery + cidery tasting loop", type: "wine-tour", duration: "4 hr", pricePerPerson: [65,120], groupMin: 4, groupMax: 14, highlight: "Local wineries + Hilltop Orchards cider with a driver", bestFor: "tasting day", brands: ["both"] },
      { name: "Monument Mountain or Mount Greylock hike", type: "hiking", duration: "3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 12, highlight: "Summit views from the highest point in Massachusetts", bestFor: "morning", brands: ["both"] },
      { name: "The Mount estate + garden tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [20,45], groupMin: 2, groupMax: 16, highlight: "Edith Wharton's Gilded-Age estate and gardens", bestFor: "afternoon", brands: ["moh"] },
      { name: "Ashintully gardens luxe picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 12, highlight: "Catered spread on the lawn before a Tanglewood show", bestFor: "afternoon", brands: ["moh"] },
    ],
    lodging: [
      { name: "Kemble Inn", type: "boutique-hotel", pricePerNight: [320,600], perRoom: true, maxGuests: 2, highlight: "Gilded-Age mansion inn walkable to Lenox village" },
      { name: "Lenox-area country house", type: "house", pricePerNight: [600,1500], perRoom: false, maxGuests: 12, highlight: "Hot tub + fireplaces near Tanglewood" },
    ],
    transport: [{ name: "Berkshires private van", type: "charter", priceRange: "$160-$340/group", highlight: "Winery loops + Tanglewood + trailhead drops" }],
    presentation: {
      moh: { tagline: "Tanglewood lawns, Canyon Ranch, and Gilded-Age inns", description: "The Berkshires is the cultured, slower bachelorette — a picnic on the Tanglewood lawn, a Canyon Ranch spa day, MASS MoCA in the afternoon, and a country-house rental with a hot tub. Editorial, restorative, and easy to make feel special." },
      bestman: { tagline: "Mountain hikes, breweries, and a country house", description: "The Berkshires keeps it relaxed: a Mount Greylock summit hike, a solar-powered brewery in Great Barrington, MASS MoCA's industrial galleries, and a country house with fireplaces and a hot tub when you're done." },
    } },

  // 12
  { id: "salem-ma", city: "Salem", state: "MA", region: "northeast",
    nearestAirport: { code: "BOS", name: "Boston Logan Intl", driveMinutes: 35 },
    bestMonths: [5,6,7,8,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "The Roof at the Hotel Salem", type: "rooftop-bar", vibe: "balanced", priceRange: "$$$", highlight: "Rooftop drinks + churros with downtown views", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Hallowed Ground", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Cozy basement speakeasy beneath the Dire Wolf Tavern", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Dire Wolf Tavern", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Casual-elevated tavern in the heart of downtown", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Turner's Seafood at Lyceum Hall", cuisine: "Seafood", priceRange: "$$$", highlight: "Raw bar + New England seafood in a historic (and haunted) hall", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Ledger Restaurant & Bar", cuisine: "New American", priceRange: "$$$", highlight: "Elevated plates + cocktails in a former bank", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Red's Sandwich Shop", cuisine: "Breakfast", priceRange: "$", highlight: "300-year-old building, classic morning-after breakfast", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Salem witch-history walking tour", type: "walking-tour", duration: "2 hr", pricePerPerson: [25,45], groupMin: 2, groupMax: 16, highlight: "The 1692 trials told on the actual streets", bestFor: "afternoon", brands: ["both"] },
      { name: "Boos & Brews haunted pub crawl", type: "walking-tour", duration: "2.5 hr", pricePerPerson: [35,55], groupMin: 4, groupMax: 14, highlight: "Local watering holes + ghost stories between rounds", bestFor: "first night", brands: ["both"] },
      { name: "Peabody Essex Museum visit", type: "tour", duration: "2 hr", pricePerPerson: [20,30], groupMin: 2, groupMax: 16, highlight: "World-class maritime + Asian art collections downtown", bestFor: "afternoon", brands: ["both"] },
      { name: "Salem Harbor sail or schooner cruise", type: "boat-cruise", duration: "2 hr", pricePerPerson: [40,85], groupMin: 4, groupMax: 24, highlight: "Tall-ship sail past the old maritime waterfront", bestFor: "sunset", brands: ["both"] },
      { name: "WitchPix costume photoshoot", type: "photoshoot", duration: "1.5 hr", pricePerPerson: [45,95], groupMin: 4, groupMax: 12, highlight: "Dress as witches and shoot themed group portraits", bestFor: "afternoon", brands: ["moh"] },
      { name: "The Witchery broom + spell-jar workshop", type: "candle-making", duration: "1.5 hr", pricePerPerson: [45,85], groupMin: 4, groupMax: 12, highlight: "Make your own broomstick or spell jar in an art studio", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "Tarot + candlelit reading session", type: "tarot-reading", duration: "1.5 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 10, highlight: "Group readings at a downtown metaphysical shop", bestFor: "evening", brands: ["moh"] },
    ],
    lodging: [
      { name: "The Merchant", type: "boutique-hotel", pricePerNight: [240,480], perRoom: true, maxGuests: 2, highlight: "1784 mansion boutique steps from the action" },
      { name: "McIntire District Federal house", type: "airbnb", pricePerNight: [400,950], perRoom: false, maxGuests: 10, highlight: "Historic 4BR within walking distance of downtown" },
    ],
    transport: [{ name: "MBTA Newburyport/Rockport line + local rideshare", type: "shuttle", priceRange: "$8 train + rideshare", highlight: "30-min train from Boston North Station; walkable once there" }],
    presentation: {
      moh: { tagline: "Witch tours, tarot, and themed photoshoots", description: "Salem is the witchy bachelorette with built-in theme — a witch-history tour, a costume photoshoot, a spell-jar workshop, tarot by candlelight, and a haunted pub crawl. Add a rooftop bar and a seafood dinner in a haunted hall and it plans itself." },
      bestman: { tagline: "Haunted pub crawls and maritime history", description: "Salem is an easy day-trippable weekend from Boston: a haunted pub crawl through the old watering holes, the Peabody Essex maritime collection, a schooner sail off the historic waterfront, and a speakeasy under the tavern to close." },
    } },

  // 13
  { id: "lancaster-pa", city: "Lancaster", state: "PA", region: "northeast",
    nearestAirport: { code: "PHL", name: "Philadelphia Intl", driveMinutes: 75 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Lancaster Brewing Company", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Flagship Lancaster brewpub with a long taplist", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Tellus360", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Multi-level Irish bar with live music and a rooftop", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Spring House Brewing Company", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "City taproom + barrel-aged program", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "Passerine", cuisine: "Fine dining", priceRange: "$$$$", highlight: "NYT-recognized as one of America's best (2024)", bestFor: "group-dinner", groupFriendly: false, brands: ["both"] },
      { name: "Lancaster Central Market", cuisine: "Market hall", priceRange: "$$", highlight: "Oldest continuously running public market in the U.S. — grab cup cheese", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Bird-in-Hand Family Restaurant & Smorgasbord", cuisine: "Pennsylvania Dutch", priceRange: "$$", highlight: "Classic Amish-country buffet for the big-group meal", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Lancaster brewery + cidery van tour", type: "brewery-tour", duration: "4 hr", pricePerPerson: [70,130], groupMin: 4, groupMax: 14, highlight: "Lancaster Ale Trail stops with a driver", bestFor: "first day", brands: ["both"] },
      { name: "Lancaster County wine-trail tasting", type: "wine-tour", duration: "4 hr", pricePerPerson: [60,120], groupMin: 4, groupMax: 14, highlight: "Mount Hope + Deerfoot + nearby vineyards", bestFor: "tasting day", brands: ["both"] },
      { name: "Amish-country buggy ride + farm tour", type: "farm-tour", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 14, highlight: "Horse-and-buggy ride through the working countryside", bestFor: "afternoon", brands: ["both"] },
      { name: "Central Market + downtown food tour", type: "food-tour", duration: "3 hr", pricePerPerson: [55,100], groupMin: 4, groupMax: 14, highlight: "Cup cheese, whoopie pies, and downtown bites", bestFor: "morning", brands: ["both"] },
      { name: "Hot-air balloon ride over the farms", type: "scenic-overlook", duration: "3 hr", pricePerPerson: [220,320], groupMin: 2, groupMax: 8, highlight: "Sunrise balloon over the patchwork farmland", bestFor: "splurge morning", brands: ["both"] },
      { name: "Strasburg steam-train + rail excursion", type: "tour", duration: "2 hr", pricePerPerson: [20,60], groupMin: 2, groupMax: 16, highlight: "America's oldest short-line railroad through the fields", bestFor: "afternoon", brands: ["both"] },
      { name: "Pottery + paint class downtown", type: "pottery-class", duration: "2 hr", pricePerPerson: [45,85], groupMin: 6, groupMax: 14, highlight: "BYO-bubbles studio session in the arts district", bestFor: "afternoon downtime", brands: ["moh"] },
    ],
    lodging: [
      { name: "Lancaster Arts Hotel", type: "boutique-hotel", pricePerNight: [200,380], perRoom: true, maxGuests: 2, highlight: "Converted tobacco warehouse with local art throughout" },
      { name: "Amish-country farmhouse rental", type: "house", pricePerNight: [400,1000], perRoom: false, maxGuests: 12, highlight: "Big farmhouse with a porch over the fields" },
    ],
    transport: [{ name: "Lancaster brewery + farm shuttle", type: "shuttle", priceRange: "$130-$280/group", highlight: "Ale-trail + wine-trail + Amish-country loops" }],
    presentation: {
      moh: { tagline: "Markets, balloons, and Amish-country charm", description: "Lancaster is the wholesome-with-an-edge weekend — a sunrise balloon over the farmland, the country's oldest public market for cup cheese and whoopie pies, a wine-trail afternoon, and a downtown arts hotel. Unexpected and easy on the wallet." },
      bestman: { tagline: "Ale trail, steam trains, and a farmhouse base", description: "Lancaster runs a relaxed weekend: a brewery van down the Ale Trail, a steam-train excursion, a Pennsylvania Dutch smorgasbord for the big meal, and a farmhouse rental with a porch. Easy, cheap, and not what anyone expects." },
    } },

  // 14
  { id: "gettysburg-pa", city: "Gettysburg", state: "PA", region: "northeast",
    nearestAirport: { code: "BWI", name: "Baltimore/Washington Intl", driveMinutes: 75 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 5,
    nightlife: [
      { name: "Ploughman Cider Taproom", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Craft-cider taproom right on Lincoln Square", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Battlefield Brew Works", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Brewery in an 1848 Dutch barn — Red Bayonet Ale + live nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Pub & Restaurant", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Lincoln Square pub with a deep beer list", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Farnsworth House Inn", cuisine: "American / tavern", priceRange: "$$$", highlight: "Civil War-era tavern + beer garden (famously haunted)", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "One Lincoln", cuisine: "New American", priceRange: "$$$", highlight: "Upscale Lincoln Square plates + cocktails", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Food 101", cuisine: "Bistro / brunch", priceRange: "$$", highlight: "Farm-sourced bistro for the morning-after meal", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Boos & Booze haunted pub crawl", type: "walking-tour", duration: "2 hr", pricePerPerson: [30,50], groupMin: 4, groupMax: 14, highlight: "Nightly crawl through one of America's most haunted towns", bestFor: "first night", brands: ["both"] },
      { name: "Gettysburg battlefield guided tour", type: "tour", duration: "3 hr", pricePerPerson: [40,90], groupMin: 2, groupMax: 14, highlight: "Licensed guide across the battlefield + Little Round Top", bestFor: "afternoon", brands: ["both"] },
      { name: "Gettysburg brew + cider tour", type: "brewery-tour", duration: "4 hr", pricePerPerson: [65,120], groupMin: 4, groupMax: 14, highlight: "Battlefield Brew Works + Ploughman Cider with a driver", bestFor: "first day", brands: ["both"] },
      { name: "Horseback ride across the battlefield", type: "horseback-riding", duration: "2 hr", pricePerPerson: [80,140], groupMin: 4, groupMax: 10, highlight: "Trail ride over the historic fields", bestFor: "morning", brands: ["both"] },
      { name: "Adams County wine-trail tasting", type: "wine-tour", duration: "4 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 14, highlight: "Hauser Estate + Adams County vineyards nearby", bestFor: "tasting day", brands: ["both"] },
      { name: "Segway or e-bike battlefield loop", type: "biking", duration: "2.5 hr", pricePerPerson: [55,95], groupMin: 4, groupMax: 12, highlight: "Cover more ground across the monuments", bestFor: "active afternoon", brands: ["both"] },
      { name: "Welty House ghost hunt", type: "tour", duration: "2 hr", pricePerPerson: [40,70], groupMin: 4, groupMax: 12, highlight: "Pro ghost-hunting gear in a notoriously haunted home", bestFor: "late night", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Gettysburg Hotel", type: "boutique-hotel", pricePerNight: [200,400], perRoom: true, maxGuests: 2, highlight: "Historic hotel right on Lincoln Square" },
      { name: "Adams County farmhouse rental", type: "house", pricePerNight: [350,900], perRoom: false, maxGuests: 12, highlight: "Quiet farmhouse minutes from the battlefield" },
    ],
    transport: [{ name: "Gettysburg tour shuttle", type: "shuttle", priceRange: "$120-$260/group", highlight: "Battlefield + brewery + winery transfers" }],
    presentation: {
      moh: { tagline: "Haunted crawls, cider, and a wine-trail afternoon", description: "Gettysburg is the offbeat, low-cost weekend — a haunted pub crawl through one of America's most haunted towns, cider on Lincoln Square, a wine-trail afternoon, and dinner in a Civil War-era tavern. Quirky, walkable, and easy to plan." },
      bestman: { tagline: "Battlefield rides, breweries, and ghost hunts", description: "Gettysburg is a history-and-beer weekend: a guided battlefield tour or horseback ride across the fields, a brewery-and-cider crawl, a late-night ghost hunt, and a haunted tavern dinner. Cheap, different, and within 90 minutes of BWI." },
    } },

  // 15
  { id: "poconos-pa", city: "Poconos", state: "PA", region: "northeast",
    nearestAirport: { code: "ABE", name: "Lehigh Valley Intl", driveMinutes: 45 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Wallenpaupack Brewing Company", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Big Hawley brewpub with a beer garden + lawn games", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Dock on Wallenpaupack", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Waterfront deck bar + brick-oven pizza on the lake", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Mount Airy Casino floor & lounges", type: "casino", vibe: "unhinged", priceRange: "$$$", highlight: "Gaming floor + nightlife + spa under one roof", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Gresham's Chop House", cuisine: "Steak / Italian", priceRange: "$$$", highlight: "Steaks + seafood with indoor-outdoor dining", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Ledges at Hawley Silk Mill", cuisine: "American", priceRange: "$$", highlight: "Patio overlooking the Wallenpaupack gorge", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "The Settlers Hospitality / Glass Wine.Bar.Kitchen", cuisine: "Wine bar / bistro", priceRange: "$$$", highlight: "Restored silk-mill wine bar in Hawley", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Lehigh Gorge whitewater rafting", type: "rafting", duration: "5 hr", pricePerPerson: [60,120], groupMin: 4, groupMax: 16, highlight: "Pocono Whitewater dam-release rapids in the gorge", bestFor: "marquee day", brands: ["both"] },
      { name: "Lake Wallenpaupack pontoon + tube day", type: "boat-cruise", duration: "4 hr", pricePerPerson: [60,140], groupMin: 6, groupMax: 12, highlight: "Pontoon rental + tubing on the 13-mile lake", bestFor: "summer day", brands: ["both"] },
      { name: "Pocono ATV / off-road tour", type: "atv", duration: "2 hr", pricePerPerson: [80,150], groupMin: 4, groupMax: 12, highlight: "Guided trail ride through the mountain forest", bestFor: "active afternoon", brands: ["both"] },
      { name: "Waterfall hike (Bushkill or Dingmans)", type: "hiking", duration: "3 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 14, highlight: "The 'Niagara of Pennsylvania' falls trail system", bestFor: "morning", brands: ["both"] },
      { name: "Pocono ziplining canopy course", type: "zip-lining", duration: "3 hr", pricePerPerson: [70,140], groupMin: 4, groupMax: 12, highlight: "Treetop course at a Pocono adventure park", bestFor: "active day", brands: ["both"] },
      { name: "Resort spa day at Mount Airy", type: "spa", duration: "4 hr", pricePerPerson: [180,360], groupMin: 2, groupMax: 8, highlight: "Full-service casino-resort spa", bestFor: "recovery day", brands: ["moh"] },
      { name: "Wallenpaupack sunset luxe picnic", type: "luxe-picnic", duration: "2 hr", pricePerPerson: [55,110], groupMin: 4, groupMax: 12, highlight: "Catered lakeside spread with bubbly at golden hour", bestFor: "sunset", brands: ["moh"] },
    ],
    lodging: [
      { name: "Lodge at Woodloch", type: "resort", pricePerNight: [380,720], perRoom: true, maxGuests: 2, highlight: "Adults-only destination spa resort on a private lake" },
      { name: "Lakefront Pocono cabin", type: "house", pricePerNight: [500,1500], perRoom: false, maxGuests: 14, highlight: "Hot tub + dock + game room on Wallenpaupack" },
    ],
    transport: [{ name: "Pocono adventure shuttle", type: "shuttle", priceRange: "$140-$320/group", highlight: "Rafting + lake + casino transfers" }],
    presentation: {
      moh: { tagline: "Lake days, spa resorts, and lakeside picnics", description: "The Poconos is the cabin-and-lake bachelorette — a pontoon and tube day on Lake Wallenpaupack, a destination-spa afternoon, a sunset luxe picnic on the water, and a lakefront cabin with a hot tub. Add a brewery beer garden and it's a full weekend." },
      bestman: { tagline: "Whitewater, ATVs, and a lakefront cabin", description: "The Poconos is the action weekend close to the cities: dam-release whitewater in the Lehigh Gorge, an ATV trail ride, ziplining, a pontoon day on Wallenpaupack, and a casino at night. Rent a cabin with a hot tub and a dock." },
    } },

  // 16
  { id: "killington-vt", city: "Killington", state: "VT", region: "northeast",
    nearestAirport: { code: "RUT", name: "Rutland-Southern Vermont Regional", driveMinutes: 25 },
    bestMonths: [1,2,3,7,8,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "The Pickle Barrel Night Club", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Three levels, four bars, two stages — the East's legendary après spot", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Wobbly Barn", type: "bar", vibe: "unhinged", priceRange: "$$$", highlight: "Steakhouse + nightclub + music venue, an Access Road staple since 1963", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Lookout Tavern", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Deck après with Vermont beers and house cocktails", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Garlic", cuisine: "Italian", priceRange: "$$$", highlight: "Access Road favorite — garlic rack of lamb + pastas", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Sushi Yoshi", cuisine: "Japanese / hibachi", priceRange: "$$$", highlight: "Hibachi-with-a-show + a big sushi list", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Killington Distillery (Preston's)", cuisine: "Farm-to-table", priceRange: "$$$", highlight: "House-distilled spirits + craft cocktails + farm-to-table plates", bestFor: "first night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Killington ski or ride day", type: "skiing", duration: "6 hr", pricePerPerson: [90,220], groupMin: 2, groupMax: 12, highlight: "The 'Beast of the East' — the biggest terrain in New England", bestFor: "winter weekend", brands: ["both"] },
      { name: "Killington bike-park downhill day", type: "biking", duration: "4 hr", pricePerPerson: [80,160], groupMin: 4, groupMax: 12, highlight: "Lift-served downhill MTB on the gondola in summer", bestFor: "active day", brands: ["both"] },
      { name: "Killington Distillery tasting + cocktail flight", type: "distillery-tour", duration: "2 hr", pricePerPerson: [45,90], groupMin: 4, groupMax: 14, highlight: "Bourbon, gin, and rum distilled on-mountain", bestFor: "first day", brands: ["both"] },
      { name: "Pico / Deer Leap hike", type: "hiking", duration: "4 hr", pricePerPerson: [0,30], groupMin: 2, groupMax: 12, highlight: "Green Mountain ridgeline views in fall foliage", bestFor: "leaf-peeping", brands: ["both"] },
      { name: "Ottauquechee River tube + kayak float", type: "kayaking", duration: "3 hr", pricePerPerson: [35,75], groupMin: 4, groupMax: 14, highlight: "Lazy river float through the Vermont valleys", bestFor: "summer day", brands: ["both"] },
      { name: "Killington Snowshed mountain coaster + adventure park", type: "adventure-park", duration: "3 hr", pricePerPerson: [40,90], groupMin: 2, groupMax: 14, highlight: "Mountain coaster, ropes course, and the SkyeShip gondola", bestFor: "afternoon", brands: ["both"] },
      { name: "Spa day at the Killington Grand", type: "spa", duration: "3 hr", pricePerPerson: [150,320], groupMin: 2, groupMax: 8, highlight: "Slopeside spa treatments + pool day", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Killington Grand Resort Hotel", type: "resort", pricePerNight: [240,520], perRoom: true, maxGuests: 2, highlight: "Slopeside hotel with a spa, pool, and base-area bars" },
      { name: "Access Road ski chalet", type: "house", pricePerNight: [600,1600], perRoom: false, maxGuests: 14, highlight: "Hot tub + game room steps from the après strip" },
    ],
    transport: [{ name: "Killington Access Road shuttle", type: "shuttle", priceRange: "Free seasonal + $100-$280 charters", highlight: "The Ramble shuttle loops the bars; private vans for groups" }],
    presentation: {
      moh: { tagline: "Ski-and-spa days with the East's biggest après", description: "Killington is the mountain bachelorette with built-in nightlife — a ski or bike-park day, a slopeside spa afternoon, distillery cocktails, and the Pickle Barrel when the group wants to dance. Rent an Access Road chalet with a hot tub and it runs itself." },
      bestman: { tagline: "The Beast of the East and the legendary après strip", description: "Killington is the biggest terrain in New England paired with the rowdiest après on the East Coast — ski or ride all day, hit the on-mountain distillery, and bounce between the Wobbly Barn and the Pickle Barrel's four bars all night. Chalet on the Access Road, done." },
    } },
];
