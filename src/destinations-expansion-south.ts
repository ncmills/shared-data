/**
 * Canonical destinations — South-region US expansion batch (2026-06-24).
 *
 * 16 new party-trip cities filling Southern coverage gaps (Virginia had ZERO
 * prior coverage). Every city is unique to BOTH the MOH and BESTMAN catalogs
 * at time of write (deduped against destinations-data.ts + plan-my-party).
 *
 * Venues are real and were web-verified as operating in 2025-2026. Per-person
 * activity prices are typical ranges (many charters/buses bill a flat boat/group
 * rate); confirm at booking. Each entry carries per-brand presentation blocks
 * and activity/nightlife/dining items tagged for the brands they fit.
 *
 * Density target matches the Knoxville template: 3+ nightlife / 3+ dining /
 * 5+ activities / 2+ lodging / 1+ transport per city.
 */

import type { CanonicalDestination } from "./destinations-types";

export const expansionSouth: CanonicalDestination[] = [
  // 1 — Virginia Beach VA
  { id: "virginia-beach-va", city: "Virginia Beach", state: "VA", region: "south",
    nearestAirport: { code: "ORF", name: "Norfolk Intl", driveMinutes: 22 },
    bestMonths: [5,6,7,8,9], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Sky Bar", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "21st-floor Hilton rooftop pool bar that turns club on weekends", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://www.hiltonvb.com" },
      { name: "Tarnished Truth Distillery", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "On-site craft distillery inside the Historic Cavalier with tastings + cocktails", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], url: "https://www.cavalierresortvb.com" },
      { name: "Peabody's", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Longstanding oceanfront dance club, classic bachelor/ette scene", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Orion's Roof", cuisine: "Asian fusion", priceRange: "$$$$", highlight: "23rd-floor sushi + rooftop wok with full Atlantic views", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://www.cavalierresortvb.com/dining" },
      { name: "Waterman's Surfside Grille", cuisine: "Seafood", priceRange: "$$", highlight: "Iconic oceanfront grille, home of the Orange Crush", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Chix on the Beach", cuisine: "Beach American", priceRange: "$$", highlight: "Beachfront casual that handles big groups", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "New Realm Brewing tour", type: "brewery-tour", duration: "2 hr", pricePerPerson: [20,50], groupMin: 4, groupMax: 20, highlight: "Big brewery + kitchen built for groups", bestFor: "first night", brands: ["both"] },
      { name: "Boardwalk surf lesson", type: "snorkeling", duration: "2 hr", pricePerPerson: [60,100], groupMin: 2, groupMax: 10, highlight: "Learn-to-surf right off the resort beach", bestFor: "active morning", brands: ["both"] },
      { name: "Tribal Axe", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [25,40], groupMin: 2, groupMax: 20, highlight: "Virginia's first indoor axe range with a full bar", bestFor: "first night", brands: ["both"] },
      { name: "Spa at the Cavalier", type: "spa", duration: "4 hr", pricePerPerson: [120,300], groupMin: 2, groupMax: 8, highlight: "Restored-landmark resort spa for a recovery day", bestFor: "recovery day", brands: ["moh"] },
      { name: "Rudee Inlet deep-sea charter", type: "fishing", duration: "6 hr", pricePerPerson: [125,250], groupMin: 4, groupMax: 6, highlight: "Offshore + inshore charters with crew and gear", bestFor: "active day", brands: ["bestman"] },
      { name: "Fox Brothers Paintball", type: "paintball", duration: "3 hr", pricePerPerson: [30,60], groupMin: 6, groupMax: 30, highlight: "Outdoor fields just inland from the oceanfront", bestFor: "active afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Historic Cavalier Hotel & Beach Club", type: "boutique-hotel", pricePerNight: [350,700], perRoom: true, maxGuests: 2, highlight: "Restored 1927 landmark with distillery + spa on-site" },
      { name: "Embassy Suites VB Oceanfront", type: "hotel", pricePerNight: [200,400], perRoom: true, maxGuests: 6, highlight: "All-suite oceanfront — suites sleep a crew" },
    ],
    transport: [
      { name: "Virginia Beach Party Bus", type: "party-bus", priceRange: "$150-$350/hr", highlight: "11-49 passenger buses + ORF airport transfers" },
    ],
    presentation: {
      moh: { tagline: "Boardwalk beach days with a rooftop finish", description: "Virginia Beach is the easy-yes bachelorette: three miles of boardwalk, surf lessons in the morning, a resort spa in the afternoon, and a 21st-floor rooftop for the night. Beachy by day, dressed-up by dark, and a flight away for half the East Coast." },
      bestman: { tagline: "Offshore charters, paintball, oceanfront bars", description: "Virginia Beach runs the full bachelor program: deep-sea charter out of Rudee Inlet, paintball or axes by afternoon, then the oceanfront strip from a brewery into a rooftop club. No pretense, big beach, late nights." },
    } },

  // 2 — Richmond VA
  { id: "richmond-va", city: "Richmond", state: "VA", region: "south",
    nearestAirport: { code: "RIC", name: "Richmond Intl", driveMinutes: 15 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "The Jasper", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Carytown's premier craft cocktail bar", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Quirk Hotel Rooftop", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Panoramic downtown views off the art-hotel roof", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Can Can Brasserie", type: "wine-bar", vibe: "balanced", priceRange: "$$$", highlight: "80-foot French zinc bar in Carytown with private dining", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"] },
    ],
    dining: [
      { name: "Brenner Pass", cuisine: "Alpine European", priceRange: "$$$", highlight: "Bon Appetit top-50, in the Scott's Addition beer district", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "L'Opossum", cuisine: "French", priceRange: "$$$$", highlight: "Eccentric decor, escargot + caviar, unforgettable", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Jefferson Hotel brunch", cuisine: "Southern", priceRange: "$$$$", highlight: "Grand-hotel brunch worth booking months out", bestFor: "brunch", groupFriendly: true, brands: ["moh"], url: "https://www.jeffersonhotel.com" },
    ],
    activities: [
      { name: "James River urban rafting", type: "rafting", duration: "4 hr", pricePerPerson: [60,100], groupMin: 6, groupMax: 20, highlight: "Class III-IV rapids running right through downtown", bestFor: "active day", brands: ["both"] },
      { name: "Scott's Addition brewery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 20, highlight: "30+ breweries, cideries + distilleries all walkable", bestFor: "first night", brands: ["both"] },
      { name: "Carytown boutique + bar crawl", type: "walking-tour", duration: "3 hr", pricePerPerson: [30,75], groupMin: 4, groupMax: 16, highlight: "Shops and cocktail stops with no car needed", bestFor: "afternoon", brands: ["both"] },
      { name: "Downtown spa day", type: "spa", duration: "4 hr", pricePerPerson: [120,300], groupMin: 2, groupMax: 8, highlight: "Hotel-spa pampering between the rafting and the dinner", bestFor: "recovery day", brands: ["moh"] },
      { name: "Hardywood / Ardent taproom golf-sim afternoon", type: "go-karts", duration: "2 hr", pricePerPerson: [25,55], groupMin: 4, groupMax: 16, highlight: "Beer-district arcade + games stop between taprooms", bestFor: "afternoon downtime", brands: ["bestman"] },
      { name: "RVA whiskey-trail black-car tour", type: "distillery-tour", duration: "4 hr", pricePerPerson: [90,170], groupMin: 6, groupMax: 14, highlight: "Chauffeured Virginia distillery hop", bestFor: "tasting day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Quirk Hotel", type: "boutique-hotel", pricePerNight: [250,450], perRoom: true, maxGuests: 2, highlight: "Art-gallery boutique with the city's best rooftop" },
      { name: "Graduate Richmond", type: "hotel", pricePerNight: [180,350], perRoom: true, maxGuests: 2, highlight: "Rooftop pool + bar, party-friendly and central" },
    ],
    transport: [
      { name: "Richmond Party Bus", type: "party-bus", priceRange: "$150-$350/hr", highlight: "Brewery-tour buses + RIC airport transfers" },
    ],
    presentation: {
      moh: { tagline: "Cocktails, Carytown, and a river running through it", description: "Richmond is the sleeper bachelorette: rafting Class IV rapids downtown, a craft-cocktail bar in Carytown, a French brasserie for the group dinner, and Sunday brunch at a grand hotel. Editorial, walkable, and far cheaper than DC." },
      bestman: { tagline: "Urban whitewater + 30 breweries in one zip code", description: "Richmond is the only city with Class IV rapids inside the city limits and a beer district (Scott's Addition) with thirty taprooms you can walk between. Raft by day, crawl by night, black-car the whiskey trail in between." },
    } },

  // 3 — Norfolk VA
  { id: "norfolk-va", city: "Norfolk", state: "VA", region: "south",
    nearestAirport: { code: "ORF", name: "Norfolk Intl", driveMinutes: 15 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Granby Theater", type: "club", vibe: "balanced", priceRange: "$$$", highlight: "Restored historic theater turned downtown nightclub", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Gershwin's on Granby", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "Upscale downtown jazz club with live music nightly", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://gershwinsongranby.com" },
      { name: "The Banque", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Longtime Norfolk dance club, country + Top-40 nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Waterside District", cuisine: "Food hall", priceRange: "$$", highlight: "Waterfront hall of vendors + bars, easy on a group", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://www.watersidedistrict.com" },
      { name: "Gershwin's on Granby", cuisine: "American", priceRange: "$$$", highlight: "Dinner with live jazz on the Granby strip", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://gershwinsongranby.com" },
      { name: "MJ's Tavern", cuisine: "Brunch", priceRange: "$$", highlight: "Granby St brunch, karaoke + daily specials", bestFor: "brunch", groupFriendly: true, brands: ["moh"], url: "https://mjstavern.com" },
    ],
    activities: [
      { name: "Granby Street bar crawl", type: "walking-tour", duration: "4 hr", pricePerPerson: [40,90], groupMin: 4, groupMax: 20, highlight: "Dense downtown bar + club strip with no car needed", bestFor: "first night", brands: ["both"] },
      { name: "Elizabeth River harbor cruise", type: "boat-cruise", duration: "2 hr", pricePerPerson: [25,60], groupMin: 6, groupMax: 30, highlight: "Naval-base + waterfront sightseeing by water", bestFor: "afternoon", brands: ["both"] },
      { name: "Norfolk brewery party-bus tour", type: "brewery-tour", duration: "4 hr", pricePerPerson: [50,100], groupMin: 10, groupMax: 30, highlight: "Craft-beer hop by bus across the metro", bestFor: "first day", brands: ["both"] },
      { name: "Waterside day-drinking + lawn games", type: "rooftop-bar", duration: "3 hr", pricePerPerson: [30,70], groupMin: 4, groupMax: 20, highlight: "Bars, food + river views in one spot", bestFor: "afternoon downtime", brands: ["both"] },
      { name: "Downtown spa + waterfront brunch day", type: "spa", duration: "4 hr", pricePerPerson: [100,250], groupMin: 2, groupMax: 8, highlight: "Pampering paired with a long waterfront brunch", bestFor: "recovery day", brands: ["moh"] },
      { name: "Virginia Beach surf day trip", type: "beach", duration: "5 hr", pricePerPerson: [40,120], groupMin: 4, groupMax: 16, highlight: "Oceanfront is 25 minutes from a Norfolk base", bestFor: "active day", brands: ["both"] },
    ],
    lodging: [
      { name: "Hilton Norfolk The Main", type: "hotel", pricePerNight: [200,400], perRoom: true, maxGuests: 2, highlight: "Downtown flagship with rooftop bar, walk to Granby" },
      { name: "Glass Light Hotel (Autograph Collection)", type: "boutique-hotel", pricePerNight: [180,350], perRoom: true, maxGuests: 2, highlight: "Art-forward downtown boutique near the nightlife" },
    ],
    transport: [
      { name: "Norfolk Party Bus", type: "party-bus", priceRange: "$150-$350/hr", highlight: "11-49 passenger buses, ORF transfers + brewery tours" },
    ],
    presentation: {
      moh: { tagline: "Waterfront brunches and a walkable night out", description: "Norfolk is the relaxed coastal-Virginia pick: a waterfront food hall, brunch and karaoke on Granby Street, a harbor cruise, and the beach a short drive away. Pair it with a spa day and you have a low-stress weekend that still goes late." },
      bestman: { tagline: "Granby Street crawl, harbor cruise, beach nearby", description: "Norfolk keeps it simple: a dense walkable bar strip on Granby, a brewery party-bus tour, a harbor cruise past the naval base, and the Virginia Beach oceanfront twenty-five minutes out when you want sand." },
    } },

  // 4 — Wilmington NC
  { id: "wilmington-nc", city: "Wilmington", state: "NC", region: "south",
    nearestAirport: { code: "ILM", name: "Wilmington Intl", driveMinutes: 12 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "The Blind Elephant", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Hidden Smith Alley speakeasy with a retro entrance", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Rebellion NC", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Bourbon + whiskey focus in the historic district", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Dead Crow Comedy Room", type: "comedy-club", vibe: "balanced", priceRange: "$$", highlight: "Wilmington's full-time stand-up club, great group anchor", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["moh"], url: "https://www.deadcrowcomedy.com" },
    ],
    dining: [
      { name: "Elijah's", cuisine: "Seafood", priceRange: "$$", highlight: "Big Riverwalk deck over the Cape Fear", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Dram Yard", cuisine: "Southern coastal", priceRange: "$$$", highlight: "Courtyard bar + weekend brunch at ARRIVE", bestFor: "brunch", groupFriendly: true, brands: ["both"], url: "https://www.arrivehotels.com/hotels/wilmington" },
      { name: "Anne Bonny's Bar & Grill", cuisine: "Calabash seafood", priceRange: "$$", highlight: "The only floating bar on the Riverwalk", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Wrightsville Beach boat charter", type: "boat-cruise", duration: "3 hr", pricePerPerson: [75,150], groupMin: 6, groupMax: 12, highlight: "Island-hop, sandbar party + sunset cruise", bestFor: "first day", brands: ["both"] },
      { name: "Trolley Pub Wilmington", type: "brunch-crawl", duration: "2 hr", pricePerPerson: [30,45], groupMin: 6, groupMax: 15, highlight: "Pedal-powered Riverwalk bar crawl", bestFor: "afternoon", brands: ["both"] },
      { name: "Wrightsville Beach surf + paddleboard lesson", type: "snorkeling", duration: "2 hr", pricePerPerson: [60,100], groupMin: 2, groupMax: 10, highlight: "Premier East Coast surf town", bestFor: "active morning", brands: ["both"] },
      { name: "Wilmington Ale Trail crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [40,80], groupMin: 4, groupMax: 20, highlight: "20+ craft breweries + bottle shops", bestFor: "first night", brands: ["both"] },
      { name: "Riverwalk spa + shopping day", type: "spa", duration: "4 hr", pricePerPerson: [100,250], groupMin: 2, groupMax: 8, highlight: "Pampering + waterfront boutiques", bestFor: "recovery day", brands: ["moh"] },
      { name: "Crossfire axe + GellyBall", type: "axe-throwing", duration: "2.5 hr", pricePerPerson: [30,60], groupMin: 6, groupMax: 30, highlight: "Axe, GellyBall, Nerf + paintball with private rooms", bestFor: "active afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "ARRIVE Wilmington", type: "boutique-hotel", pricePerNight: [200,400], perRoom: true, maxGuests: 2, highlight: "Downtown courtyard hotel with bar + Dram Yard dining" },
      { name: "Wrightsville Beach house", type: "house", pricePerNight: [400,1200], perRoom: false, maxGuests: 14, highlight: "Whole beach house for the crew, steps from the surf" },
    ],
    transport: [
      { name: "Wilmington Party Bus Company", type: "party-bus", priceRange: "$150-$350/hr", highlight: "6-50 passengers, pickup at ILM, Riverwalk or Wrightsville" },
    ],
    presentation: {
      moh: { tagline: "River-town nights and Wrightsville beach days", description: "Wilmington splits the difference perfectly: a historic Riverwalk with speakeasies and a comedy club, then Wrightsville Beach ten minutes away for surf lessons and a sandbar boat day. Rent a beach house, brunch on the water, and never repeat a night." },
      bestman: { tagline: "Sandbar charters, the Ale Trail, beach house base", description: "Wilmington is a beach-house bachelor weekend with a real downtown attached: charter to the Wrightsville sandbar, run the 20-brewery Ale Trail, throw axes, and close it out on the floating bar over the Cape Fear." },
    } },

  // 5 — Chattanooga TN
  { id: "chattanooga-tn", city: "Chattanooga", state: "TN", region: "south",
    nearestAirport: { code: "CHA", name: "Chattanooga Metropolitan (Lovell Field)", driveMinutes: 15 },
    bestMonths: [4,5,6,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Whiskey Thief", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Top-floor Edwin Hotel bar, 100+ whiskeys + river views", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], url: "https://whiskeythiefchattanooga.com" },
      { name: "Gate 11 Distillery", type: "cocktail-bar", vibe: "balanced", priceRange: "$$", highlight: "House spirits on the Station St bar-hop strip", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Hutton & Smith Brewing Co.", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Award-winning Southside IPA brewer, walkable taproom cluster", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "STIR", cuisine: "Southern + raw bar", priceRange: "$$$", highlight: "Open-air patio in the historic Choo Choo complex", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Alleia", cuisine: "Italian", priceRange: "$$$", highlight: "Southside fine-dining standby, handmade pasta + wood fire", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Milk & Honey", cuisine: "Cafe brunch", priceRange: "$$", highlight: "Popular Southside brunch spot", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Ocoee River whitewater rafting", type: "rafting", duration: "5 hr", pricePerPerson: [45,90], groupMin: 6, groupMax: 20, highlight: "Five miles of continuous Class III on the 1996 Olympic river", bestFor: "active day", brands: ["both"] },
      { name: "Southern Belle Riverboat Sip & Sail", type: "boat-cruise", duration: "2 hr", pricePerPerson: [36,100], groupMin: 6, groupMax: 30, highlight: "21+ sunset cruise past Lookout Mountain", bestFor: "first night", brands: ["both"] },
      { name: "Craft Axe Throwing", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [22,35], groupMin: 3, groupMax: 20, highlight: "15 lanes with a full bar + TVs", bestFor: "first night", brands: ["both"] },
      { name: "Lookout Mountain (Incline + Rock City + Ruby Falls)", type: "scenic-overlook", duration: "4 hr", pricePerPerson: [25,45], groupMin: 2, groupMax: 20, highlight: "Iconic seven-states overlook + waterfall cavern", bestFor: "afternoon", brands: ["moh"] },
      { name: "Southside brewery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [0,60], groupMin: 4, groupMax: 20, highlight: "Hutton & Smith, OddStory, WanderLinger + Five Wits all walkable", bestFor: "first day", brands: ["both"] },
      { name: "Shooter's Depot indoor range", type: "shooting-range", duration: "1 hr", pricePerPerson: [20,50], groupMin: 2, groupMax: 12, highlight: "Climate-controlled lanes with certified range masters", bestFor: "active afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Edwin Hotel", type: "boutique-hotel", pricePerNight: [300,550], perRoom: true, maxGuests: 2, highlight: "Waterfront five-star with the Whiskey Thief rooftop + plunge pool" },
      { name: "The Read House", type: "boutique-hotel", pricePerNight: [200,400], perRoom: true, maxGuests: 2, highlight: "Award-winning historic landmark with in-house steakhouse + lobby bar" },
    ],
    transport: [
      { name: "Chattanooga Party Bus Company", type: "party-bus", priceRange: "$150-$350/hr", highlight: "10-50 passenger buses + sprinter limos, crawl + airport runs" },
    ],
    presentation: {
      moh: { tagline: "Riverfront cruises and Lookout Mountain views", description: "Chattanooga is the scenic-South bachelorette: a riverfront five-star, a 21+ sunset cruise past Lookout Mountain, the walkable Southside for cocktails, and a waterfall-and-overlook day for the photos. Outdoorsy, pretty, and easy on the budget." },
      bestman: { tagline: "Ocoee rafting, brewery crawls, river city grit", description: "Chattanooga delivers the active bachelor weekend: Olympic-grade whitewater on the Ocoee, one of the South's best brewery strips on the Southside, axes and a range when you want them, and a riverfront rooftop to close it out." },
    } },

  // 6 — Franklin TN
  { id: "franklin-tn", city: "Franklin", state: "TN", region: "south",
    nearestAirport: { code: "BNA", name: "Nashville Intl", driveMinutes: 30 },
    bestMonths: [4,5,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "Gray's on Main", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Cocktails + live music in a restored 1900s drugstore", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], url: "https://graysonmain.com" },
      { name: "Amendment XVIII", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Hidden behind Mellow Mushroom off the square", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Vintage Vine 100", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "Rooftop with 100+ wines by the glass + chef small plates", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"], url: "https://franklinis.com/venue/vintage-vine-100/" },
    ],
    dining: [
      { name: "Ludlow & Prime", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "USDA Prime steaks with private dining rooms", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://ludlowandprime.com" },
      { name: "Red Pony", cuisine: "Contemporary Southern", priceRange: "$$$", highlight: "Private dining for groups of 11+", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://redponyrestaurant.com" },
      { name: "Sixty Vines", cuisine: "Wine-country American", priceRange: "$$$", highlight: "60 wines on tap + a strong brunch", bestFor: "brunch", groupFriendly: true, brands: ["moh"], url: "https://sixtyvines.com" },
    ],
    activities: [
      { name: "Arrington Vineyards tasting + picnic", type: "wine-tour", duration: "3 hr", pricePerPerson: [25,60], groupMin: 2, groupMax: 20, highlight: "Kix Brooks' scenic winery with weekend live music", bestFor: "afternoon", brands: ["both"] },
      { name: "Leiper's Fork Distillery tour", type: "distillery-tour", duration: "1.5 hr", pricePerPerson: [25,45], groupMin: 2, groupMax: 20, highlight: "Small-batch Tennessee whiskey in a rural setting", bestFor: "first day", brands: ["both"] },
      { name: "Franklin Whiskey Trail black-car tour", type: "tour", duration: "5 hr", pricePerPerson: [120,200], groupMin: 6, groupMax: 14, highlight: "Chauffeured distillery + dinner loop", bestFor: "tasting day", brands: ["both"] },
      { name: "Creekside Riding Academy trail ride", type: "horseback-riding", duration: "1.5 hr", pricePerPerson: [60,90], groupMin: 2, groupMax: 10, highlight: "Guided English/Western trail rides", bestFor: "morning", brands: ["moh"] },
      { name: "Stable Reserve barrel-blend experience", type: "cocktail-class", duration: "2 hr", pricePerPerson: [40,90], groupMin: 2, groupMax: 12, highlight: "Build and bottle your own barrel-proof bourbon blend", bestFor: "afternoon downtime", brands: ["bestman"] },
      { name: "Downtown Franklin axe lanes", type: "axe-throwing", duration: "1.5 hr", pricePerPerson: [20,35], groupMin: 4, groupMax: 20, highlight: "Private lanes with a full bar", bestFor: "first night", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Harpeth (Curio Collection by Hilton)", type: "boutique-hotel", pricePerNight: [250,450], perRoom: true, maxGuests: 2, highlight: "The only true downtown hotel, on the river, walk to Main St" },
      { name: "Rural Franklin 4BR rental", type: "house", pricePerNight: [400,700], perRoom: false, maxGuests: 16, highlight: "Bunkroom farmhouse minutes from the historic square" },
    ],
    transport: [
      { name: "Nashville Party Bus Company", type: "party-bus", priceRange: "$150-$250/hr", highlight: "10-50 passenger buses + 14-pax sprinter limos for winery loops" },
    ],
    presentation: {
      moh: { tagline: "Vineyards, a wine-wall rooftop, historic charm", description: "Franklin is the polished, pretty alternative to Nashville's chaos: a vineyard picnic with live music, a rooftop wine bar with a hundred pours, a Prime steakhouse for the group dinner, and a Victorian Main Street to wander. Twenty minutes of calm from BNA." },
      bestman: { tagline: "Tennessee whiskey trail without the Broadway crowds", description: "Franklin is Nashville's grown-up cousin: distillery tours and a chauffeured whiskey trail, build-your-own-bourbon, axes off the square, and a Prime steakhouse — all a half-hour from the airport and none of the bachelorette-party gridlock on Broadway." },
    } },

  // 7 — Birmingham AL
  { id: "birmingham-al", city: "Birmingham", state: "AL", region: "south",
    nearestAirport: { code: "BHM", name: "Birmingham-Shuttlesworth Intl", driveMinutes: 12 },
    bestMonths: [4,5,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "The Marble Ring", type: "speakeasy", vibe: "balanced", priceRange: "$$$", highlight: "Named the best hidden bar in Alabama, tucked into Avondale", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Denim on 7th", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Premier Lakeview craft-cocktail room with live entertainment", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Avondale Brewing Company", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Flagship Avondale brewery with a big outdoor stage", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"], url: "https://www.avondalebrewing.com" },
    ],
    dining: [
      { name: "Automatic Seafood & Oysters", cuisine: "Seafood", priceRange: "$$$", highlight: "James Beard-recognized, upscale group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://automaticseafood.com" },
      { name: "Hold Your Horses", cuisine: "Bar + karaoke", priceRange: "$$", highlight: "Karaoke and a fun, loud group vibe", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Market at Pepper Place", cuisine: "Food market", priceRange: "$", highlight: "Saturday market of local food + makers", bestFor: "brunch", groupFriendly: true, brands: ["moh"], url: "https://pepperplace.com" },
    ],
    activities: [
      { name: "Topgolf Birmingham", type: "go-karts", duration: "3 hr", pricePerPerson: [30,60], groupMin: 2, groupMax: 18, highlight: "Driving-range games with bar + food bays", bestFor: "first night", brands: ["both"] },
      { name: "Birmingham pedal pub", type: "brunch-crawl", duration: "2 hr", pricePerPerson: [35,55], groupMin: 8, groupMax: 14, highlight: "Pedal-powered crawl between Avondale + Lakeview bars", bestFor: "afternoon", brands: ["both"] },
      { name: "Avondale + Lakeview brewery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [20,50], groupMin: 4, groupMax: 20, highlight: "Avondale, TrimTab + Back Forty all within reach", bestFor: "first day", brands: ["both"] },
      { name: "Escape room", type: "escape-room", duration: "1 hr", pricePerPerson: [25,40], groupMin: 4, groupMax: 10, highlight: "Team puzzle challenge to kick off the day", bestFor: "afternoon downtime", brands: ["both"] },
      { name: "Drag brunch", type: "drag-brunch", duration: "2 hr", pricePerPerson: [40,75], groupMin: 2, groupMax: 16, highlight: "Weekend afternoon show + bottomless brunch", bestFor: "brunch", brands: ["moh"] },
      { name: "Birmingham rage room", type: "axe-throwing", duration: "1 hr", pricePerPerson: [25,50], groupMin: 2, groupMax: 8, highlight: "Smash-room stress release with bats + crowbars", bestFor: "active afternoon", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Elyton Hotel (Autograph Collection)", type: "boutique-hotel", pricePerNight: [200,400], perRoom: true, maxGuests: 2, highlight: "1909 landmark with the Moonshine rooftop bar, walk downtown" },
      { name: "Redmont Hotel (Curio by Hilton)", type: "boutique-hotel", pricePerNight: [170,320], perRoom: true, maxGuests: 2, highlight: "Birmingham's oldest hotel + highest rooftop bar in the state" },
    ],
    transport: [
      { name: "Birmingham Party Bus", type: "party-bus", priceRange: "$125-$200/hr", highlight: "Group transport between Avondale, Lakeview + downtown" },
    ],
    presentation: {
      moh: { tagline: "Drag brunch, rooftop bars, hidden speakeasies", description: "Birmingham punches above its weight for a bachelorette: a drag brunch, a Saturday maker's market, the best hidden bar in Alabama, and rooftop cocktails downtown. Underrated, walkable in pockets, and a quick BHM hop from anywhere in the South." },
      bestman: { tagline: "Topgolf, brewery districts, a rage room finish", description: "Birmingham is an easy bachelor base: Topgolf and a rage room by day, the Avondale and Lakeview brewery districts by night, James-Beard seafood for the group dinner, and rooftop bars when you want the skyline." },
    } },

  // 8 — Mobile AL
  { id: "mobile-al", city: "Mobile", state: "AL", region: "south",
    nearestAirport: { code: "MOB", name: "Mobile Regional", driveMinutes: 22 },
    bestMonths: [3,4,5,10], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Alchemy Tavern", type: "dive-bar", vibe: "unhinged", priceRange: "$$", highlight: "40+ taps, karaoke + DJ nights on the Dauphin St strip", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Wet Willie's", type: "dive-bar", vibe: "unhinged", priceRange: "$$", highlight: "Frozen-daiquiri bar, a classic Dauphin St crawl stop", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Saddle Up Saloon", type: "honky-tonk", vibe: "balanced", priceRange: "$$", highlight: "Country dance bar with line dancing on Dauphin St", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Wintzell's Oyster House", cuisine: "Seafood", priceRange: "$$", highlight: "Iconic Mobile oysters: fried, stewed or nude", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://www.wintzellsoysterhouse.com" },
      { name: "The Noble South", cuisine: "Southern farm-to-table", priceRange: "$$$", highlight: "Gulf-South seasonal cooking downtown", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://thenoblesouth.com" },
      { name: "Spot of Tea", cuisine: "Southern brunch", priceRange: "$$", highlight: "Beloved downtown breakfast + brunch", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "USS Alabama Battleship Memorial Park", type: "tour", duration: "3 hr", pricePerPerson: [18,30], groupMin: 2, groupMax: 30, highlight: "Tour a WWII battleship, submarine + aircraft", bestFor: "afternoon", brands: ["both"] },
      { name: "Dauphin Island beach day", type: "beach", duration: "5 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 30, highlight: "Gulf beaches + bird sanctuary 45 minutes south", bestFor: "active day", brands: ["both"] },
      { name: "Mobile Bay dolphin + sunset cruise", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [30,60], groupMin: 4, groupMax: 30, highlight: "Dolphin watching with beer + wine aboard", bestFor: "first night", brands: ["both"] },
      { name: "Mobile Carnival Museum", type: "walking-tour", duration: "1.5 hr", pricePerPerson: [10,18], groupMin: 2, groupMax: 16, highlight: "Inside the actual birthplace of Mardi Gras", bestFor: "afternoon downtime", brands: ["moh"] },
      { name: "FinAtics inshore fishing charter", type: "fishing", duration: "5 hr", pricePerPerson: [125,300], groupMin: 2, groupMax: 6, highlight: "Top-rated Dauphin Island redfish + snapper trips", bestFor: "active day", brands: ["bestman"] },
      { name: "Captain Mike's deep-sea charter", type: "fishing", duration: "8 hr", pricePerPerson: [150,300], groupMin: 6, groupMax: 28, highlight: "A/C salon boats for big-group offshore runs", bestFor: "active day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "The Battle House Renaissance Mobile Hotel & Spa", type: "hotel", pricePerNight: [200,380], perRoom: true, maxGuests: 2, highlight: "Historic downtown hotel with full spa + rooftop pool" },
      { name: "The Admiral Hotel", type: "boutique-hotel", pricePerNight: [150,280], perRoom: true, maxGuests: 2, highlight: "Reimagined historic downtown boutique near the strip" },
    ],
    transport: [
      { name: "Mobile Party Bus", type: "party-bus", priceRange: "$100-$175/hr", highlight: "Downtown crawl + Dauphin Island fishing runs" },
    ],
    presentation: {
      moh: { tagline: "Birthplace of Mardi Gras, by the bay", description: "Mobile is the underrated Gulf bachelorette: the actual birthplace of Mardi Gras, a dolphin sunset cruise on the bay, a battleship and a carnival museum for the daytime, and the Dauphin Street strip for the night. Beachy, historic, and unpretentious." },
      bestman: { tagline: "Offshore charters + the Dauphin Street strip", description: "Mobile is a charter-and-crawl bachelor town: red snapper and offshore runs out of Dauphin Island, oysters at Wintzell's, a battleship to climb, then a blocks-long Dauphin Street bar district that stays loud past two." },
    } },

  // 9 — Pensacola FL
  { id: "pensacola-fl", city: "Pensacola", state: "FL", region: "south",
    nearestAirport: { code: "PNS", name: "Pensacola Intl", driveMinutes: 12 },
    bestMonths: [4,5,9,10], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Seville Quarter", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Seven-room downtown complex: dueling pianos, karaoke + Rosie O'Grady's", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://sevillequarter.com" },
      { name: "The Kennedy", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Upscale mid-century cocktails with house-infused liquors on Palafox", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Perfect Plain Brewing Co.", type: "beer-garden", vibe: "chill", priceRange: "$$", highlight: "Downtown brewhouse with a dog-friendly patio", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"], url: "https://perfectplain.com" },
    ],
    dining: [
      { name: "Pearl & Horn", cuisine: "Modern American", priceRange: "$$$", highlight: "USA TODAY 2025 Restaurant of the Year, snapper collars + lobster rolls", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Grand Marlin", cuisine: "Seafood", priceRange: "$$$", highlight: "Waterfront oyster bar with Sunday brunch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "The Fish House", cuisine: "Gulf seafood", priceRange: "$$$", highlight: "Upscale dockside dining over the water", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://fishhousepensacola.com" },
    ],
    activities: [
      { name: "Paddle Pub Pensacola", type: "boat-cruise", duration: "2 hr", pricePerPerson: [50,75], groupMin: 6, groupMax: 20, highlight: "BYOB pedal party boat", bestFor: "first day", brands: ["both"] },
      { name: "Cruisin' Tikis", type: "sunset-cruise", duration: "2 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 6, highlight: "BYOB floating tiki bar with dolphins + sunsets", bestFor: "first night", brands: ["both"] },
      { name: "Key Sailing parasail + jet ski", type: "boat-cruise", duration: "2 hr", pricePerPerson: [85,160], groupMin: 2, groupMax: 12, highlight: "Parasail flights + jet-ski dolphin tours", bestFor: "active day", brands: ["both"] },
      { name: "Pensacola Beach day", type: "beach", duration: "5 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 30, highlight: "Sugar-white sand on the Gulf Islands National Seashore", bestFor: "afternoon", brands: ["both"] },
      { name: "The Spa private group day", type: "spa", duration: "4 hr", pricePerPerson: [100,300], groupMin: 2, groupMax: 8, highlight: "Bookable private group lounge + treatments", bestFor: "recovery day", brands: ["moh"] },
      { name: "'Bout Time offshore charter", type: "fishing", duration: "6 hr", pricePerPerson: [150,300], groupMin: 4, groupMax: 6, highlight: "Offshore + inshore charter packages", bestFor: "active day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Hilton Pensacola Beach", type: "resort", pricePerNight: [220,450], perRoom: true, maxGuests: 4, highlight: "Gulf-front with pools + three restaurants" },
      { name: "Pensacola Beach 4BR rental", type: "house", pricePerNight: [600,1400], perRoom: false, maxGuests: 12, highlight: "Beachfront house with deck + grill" },
    ],
    transport: [
      { name: "Pensacola Party Bus", type: "party-bus", priceRange: "$125-$250/hr", highlight: "Bach runs, pub-crawl shuttles + airport transfers" },
    ],
    presentation: {
      moh: { tagline: "Sugar-white sand and a floating tiki bar", description: "Pensacola is the laid-back Gulf bachelorette: sugar-white beaches, a BYOB tiki cruise at sunset, a private spa day, and Palafox Street cocktails when the sun's down. Affordable, gorgeous water, and far less crowded than the Florida brands south of it." },
      bestman: { tagline: "Offshore charters, a pedal boat, Palafox bars", description: "Pensacola is a beach-and-charter bachelor weekend: offshore fishing, a BYOB pedal party boat, jet skis off the seashore, and Seville Quarter's seven rooms downtown to finish. Cheap flights, real Gulf water." },
    } },

  // 10 — Naples FL
  { id: "naples-fl", city: "Naples", state: "FL", region: "south",
    nearestAirport: { code: "RSW", name: "Southwest Florida Intl", driveMinutes: 40 },
    bestMonths: [3,4,5,10,11], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Bar Tulia", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Fifth Ave staple with house-infused spirits + Tuscan Mules", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Easy Tiger", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Perry Hotel rooftop with a Lynnette Marrero cocktail program", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Blue Martini", type: "club", vibe: "balanced", priceRange: "$$$", highlight: "Dancing + live music at Mercato", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Ocean Prime", cuisine: "Seafood + steak", priceRange: "$$$$", highlight: "Fifth Ave private dining + a Wine Spectator list", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://www.ocean-prime.com/locations-menus/naples" },
      { name: "Chops City Grill", cuisine: "Steakhouse", priceRange: "$$$", highlight: "In-house aged steaks + craft cocktails", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://chopscitygrill.com" },
      { name: "The Boathouse", cuisine: "Seafood", priceRange: "$$", highlight: "Naples Bay waterfront brunch", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Cool Beans 'Last Sail Before the Veil' cruise", type: "sunset-cruise", duration: "3 hr", pricePerPerson: [60,120], groupMin: 6, groupMax: 20, highlight: "Bachelorette catamaran cruise on the Gulf", bestFor: "first day", brands: ["both"] },
      { name: "Sand Dollar Tiki Tours", type: "boat-cruise", duration: "2 hr", pricePerPerson: [50,100], groupMin: 4, groupMax: 6, highlight: "Decoratable BYO tiki boat with your own playlist", bestFor: "afternoon", brands: ["both"] },
      { name: "Naples Bay private party pontoon", type: "boat-cruise", duration: "4 hr", pricePerPerson: [60,120], groupMin: 6, groupMax: 12, highlight: "Captain + mate, BYOB, shelling beach stop", bestFor: "active day", brands: ["both"] },
      { name: "Naples Bay Resort spa day", type: "spa", duration: "4 hr", pricePerPerson: [120,300], groupMin: 2, groupMax: 8, highlight: "Facials, massage + wellness pool", bestFor: "recovery day", brands: ["moh"] },
      { name: "Luxury yacht charter", type: "sunset-cruise", duration: "4 hr", pricePerPerson: [150,400], groupMin: 6, groupMax: 12, highlight: "Crewed bespoke charter for the splurge night", bestFor: "first night", brands: ["moh"] },
      { name: "Naples Catamaran sail + snorkel", type: "snorkeling", duration: "4 hr", pricePerPerson: [90,175], groupMin: 4, groupMax: 12, highlight: "Sail-and-snorkel half-day on the Gulf", bestFor: "active day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Naples Bay Resort & Marina", type: "resort", pricePerNight: [300,700], perRoom: false, maxGuests: 6, highlight: "Five pools, spa + marina, full-kitchen suites for groups" },
      { name: "Inn on Fifth", type: "boutique-hotel", pricePerNight: [350,800], perRoom: true, maxGuests: 2, highlight: "On Fifth Ave, walk to nightlife + dining" },
    ],
    transport: [
      { name: "Naples Transportation & Tours", type: "party-bus", priceRange: "$175-$450/hr", highlight: "75-vehicle fleet, bach + wine-tour runs, 24/7" },
    ],
    presentation: {
      moh: { tagline: "Yacht charters and Fifth Avenue polish", description: "Naples is the upscale-Gulf bachelorette: a catamaran 'Last Sail Before the Veil,' a resort spa day, a yacht charter for the splurge, and Fifth Avenue South for cocktails and a Wine-Spectator dinner. Refined, sun-drenched, and built for a dressed-up weekend." },
      bestman: { tagline: "Private pontoons, sail-and-snorkel, steakhouse nights", description: "Naples runs a smooth bachelor weekend: a private party pontoon with a shelling stop, a sail-and-snorkel half-day, in-house aged steaks, and rooftop cocktails on Fifth Avenue. Calm Gulf water and a marina at your door." },
    } },

  // 11 — Amelia Island FL
  { id: "amelia-island-fl", city: "Amelia Island", state: "FL", region: "south",
    nearestAirport: { code: "JAX", name: "Jacksonville Intl", driveMinutes: 35 },
    bestMonths: [4,5,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "The Palace Saloon", type: "dive-bar", vibe: "balanced", priceRange: "$$", highlight: "Florida's oldest continuously operating bar, home of the Pirate's Punch", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Green Turtle Tavern", type: "cocktail-bar", vibe: "chill", priceRange: "$$", highlight: "Historic-district cocktails with garden-fresh ingredients", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Decantery", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "The island's premier wine, craft-beer + cocktail lounge", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"] },
    ],
    dining: [
      { name: "Salty Pelican", cuisine: "Seafood", priceRange: "$$", highlight: "Harbor-front Sunday brunch with live music", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "The Boat House", cuisine: "Seafood + steak", priceRange: "$$$", highlight: "Riverfront patio with two outdoor bars", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Espana", cuisine: "Spanish tapas", priceRange: "$$$", highlight: "Shareable spreads + a garden patio", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Kelly Seahorse Ranch beach ride", type: "horseback-riding", duration: "1 hr", pricePerPerson: [120,150], groupMin: 2, groupMax: 10, highlight: "The only beach horseback riding in Florida's state parks", bestFor: "morning", brands: ["moh"] },
      { name: "Sunset + dolphin sailing charter", type: "sunset-cruise", duration: "3 hr", pricePerPerson: [75,150], groupMin: 4, groupMax: 12, highlight: "Cumberland Sound dolphins at golden hour", bestFor: "first night", brands: ["both"] },
      { name: "Historic-district pub crawl", type: "walking-tour", duration: "3 hr", pricePerPerson: [20,60], groupMin: 4, groupMax: 16, highlight: "Palace, Green Turtle, Mocama + Decantery all clustered", bestFor: "first day", brands: ["both"] },
      { name: "Fort Clinch + paddle day", type: "kayaking", duration: "3 hr", pricePerPerson: [30,75], groupMin: 2, groupMax: 12, highlight: "Historic fort + SUP/kayak rentals", bestFor: "afternoon", brands: ["both"] },
      { name: "Ritz-Carlton oceanfront spa", type: "spa", duration: "4 hr", pricePerPerson: [150,400], groupMin: 2, groupMax: 8, highlight: "Luxury oceanfront treatments", bestFor: "recovery day", brands: ["moh"] },
      { name: "Amelia Island offshore charter", type: "fishing", duration: "4 hr", pricePerPerson: [125,250], groupMin: 2, groupMax: 6, highlight: "Snapper + grouper over the wrecks", bestFor: "active day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Omni Amelia Island Resort", type: "resort", pricePerNight: [350,800], perRoom: false, maxGuests: 8, highlight: "Beach + golf with big-group villas that sleep crews" },
      { name: "Fernandina Beach 6BR rental", type: "house", pricePerNight: [700,1800], perRoom: false, maxGuests: 12, highlight: "Historic-district or beach house for the whole group" },
    ],
    transport: [
      { name: "Amelia Island shuttle charter", type: "shuttle", priceRange: "$150-$350/hr", highlight: "JAX transfers + island bar-crawl runs" },
    ],
    presentation: {
      moh: { tagline: "Beach horseback rides and oceanfront spa days", description: "Amelia Island is the genteel barrier-island bachelorette: the only beach horseback riding in Florida's state parks, a Ritz-Carlton spa, a dolphin sunset sail, and a tidy historic district of wine bars and cocktail rooms. Quiet luxury, an hour from Jacksonville." },
      bestman: { tagline: "Offshore charters and Florida's oldest saloon", description: "Amelia Island is a low-key island bachelor weekend: snapper charters over the wrecks, a dolphin sail, kayaking at a Civil-War fort, and the Palace Saloon — Florida's oldest bar — anchoring a walkable crawl." },
    } },

  // 12 — Sanibel FL
  { id: "sanibel-fl", city: "Sanibel", state: "FL", region: "south",
    nearestAirport: { code: "RSW", name: "Southwest Florida Intl", driveMinutes: 50 },
    bestMonths: [3,4,5,11], vibes: ["chill"], score: 6,
    nightlife: [
      { name: "The Mucky Duck", type: "dive-bar", vibe: "chill", priceRange: "$$", highlight: "Iconic British-style sunset beach pub on neighboring Captiva", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"], url: "https://muckyduck.com" },
      { name: "RC Otter's Island Eats", type: "dive-bar", vibe: "chill", priceRange: "$$", highlight: "Daily live music in Old Captiva Village", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Pinchers (Fort Myers Beach)", type: "dive-bar", vibe: "balanced", priceRange: "$$", highlight: "Beachfront tiki bar with live music for the late-night run off-island", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://pinchersusa.com" },
    ],
    dining: [
      { name: "The Bubble Room (Captiva)", cuisine: "Whimsical American", priceRange: "$$$", highlight: "Kitschy island institution famous for its cakes", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Keylime Bistro (Captiva)", cuisine: "Caribbean American", priceRange: "$$", highlight: "Patio live music + light dancing, strong brunch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Sunshine Seafood Cafe & Wine Bar", cuisine: "Seafood + wine", priceRange: "$$$", highlight: "Captiva wine-bar dining", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Captiva Cruises dolphin + island cruise", type: "boat-cruise", duration: "3 hr", pricePerPerson: [45,95], groupMin: 6, groupMax: 30, highlight: "Cabbage Key + Cayo Costa with a sunset serenade", bestFor: "first day", brands: ["both"] },
      { name: "Shelling beach trip (Bowman's / Cayo Costa)", type: "beach", duration: "4 hr", pricePerPerson: [0,50], groupMin: 2, groupMax: 20, highlight: "World-class shelling on quiet barrier-island sand", bestFor: "afternoon", brands: ["both"] },
      { name: "Tarpon Bay Explorers mangrove paddle", type: "kayaking", duration: "3 hr", pricePerPerson: [40,75], groupMin: 4, groupMax: 14, highlight: "Guided eco-paddle through the Ding Darling refuge", bestFor: "active day", brands: ["both"] },
      { name: "Sundial Beach Resort spa day", type: "spa", duration: "4 hr", pricePerPerson: [120,300], groupMin: 2, groupMax: 8, highlight: "Newly renovated beachfront spa", bestFor: "recovery day", brands: ["moh"] },
      { name: "Sanibel bike-the-island day", type: "biking", duration: "3 hr", pricePerPerson: [20,45], groupMin: 2, groupMax: 16, highlight: "25 miles of flat shared-use paths end to end", bestFor: "morning", brands: ["both"] },
      { name: "Sanibel Custom Charters private trip", type: "fishing", duration: "4 hr", pricePerPerson: [125,250], groupMin: 2, groupMax: 6, highlight: "Private fishing, shelling + dolphin charters", bestFor: "active day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Sundial Beach Resort & Spa", type: "resort", pricePerNight: [300,700], perRoom: false, maxGuests: 8, highlight: "Beachfront units with kitchens, pickleball + four restaurants" },
      { name: "Sanibel/Captiva 5BR rental", type: "house", pricePerNight: [700,2000], perRoom: false, maxGuests: 12, highlight: "Beach or canal house for the whole crew" },
    ],
    transport: [
      { name: "Fort Myers / RSW shuttle charter", type: "shuttle", priceRange: "$150-$400/hr", highlight: "RSW transfers + off-island nightlife runs" },
    ],
    presentation: {
      moh: { tagline: "Shelling, sunsets, and the slow-luxe island reset", description: "Sanibel is the quiet bachelorette: world-class shelling, a dolphin cruise, a mangrove paddle through a wildlife refuge, and a beachfront spa. It's the slow, pretty, recharge-the-group weekend — pair it with off-island Fort Myers if you want a louder night." },
      bestman: { tagline: "Private charters and a barrier-island reset", description: "Sanibel is the chill bachelor base: private fishing and dolphin charters, an island you can bike end to end, sunset at the Mucky Duck, and Fort Myers Beach a short drive off-island when the crew wants it rowdy." },
    } },

  // 13 — Tunica MS
  { id: "tunica-ms", city: "Tunica", state: "MS", region: "south",
    nearestAirport: { code: "MEM", name: "Memphis Intl", driveMinutes: 40 },
    bestMonths: [4,5,9,10], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Gold Strike Casino Resort", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Tunica's tallest tower with multiple bars + Millennium Theatre shows", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://www.goldstrike.com/" },
      { name: "Horseshoe Tunica", type: "club", vibe: "balanced", priceRange: "$$", highlight: "Big gaming floor with the Bluesville live-music venue on-site", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Hollywood Casino & Hotel Tunica", type: "club", vibe: "balanced", priceRange: "$$", highlight: "The one venue offering private slot tournaments + poker lessons for groups", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://www.hollywoodcasinotunica.com/" },
    ],
    dining: [
      { name: "Jack Binion's Steak House", cuisine: "Steakhouse", priceRange: "$$$$", highlight: "Premier high-end steak inside Horseshoe", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Chicago Steakhouse", cuisine: "Steakhouse", priceRange: "$$$", highlight: "Long-running upscale steakhouse at Gold Strike", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://www.goldstrike.com/" },
      { name: "Epic Buffet", cuisine: "American buffet", priceRange: "$$", highlight: "Big-group casual feeding at Hollywood", bestFor: "lunch", groupFriendly: true, brands: ["both"], url: "https://www.hollywoodcasinotunica.com/" },
    ],
    activities: [
      { name: "Casino floor gaming", type: "casino", duration: "open", pricePerPerson: [50,500], groupMin: 2, groupMax: 30, highlight: "Blackjack, craps, poker + slots across multiple 24-hour resorts", bestFor: "anytime", brands: ["both"] },
      { name: "Tunica National golf round", type: "golf", duration: "5 hr", pricePerPerson: [60,110], groupMin: 4, groupMax: 16, highlight: "Tournament-level championship course in the resort area", bestFor: "morning", brands: ["both"] },
      { name: "Tunica RiverPark + river museum", type: "tour", duration: "2 hr", pricePerPerson: [10,40], groupMin: 2, groupMax: 20, highlight: "Mellow Mississippi River exhibits + riverboat", bestFor: "afternoon downtime", brands: ["both"] },
      { name: "Spa at Gold Strike", type: "spa", duration: "3 hr", pricePerPerson: [80,200], groupMin: 2, groupMax: 8, highlight: "Casino-resort spa day", bestFor: "recovery day", brands: ["moh"] },
      { name: "The Willows sporting clays", type: "shooting-range", duration: "3 hr", pricePerPerson: [50,120], groupMin: 2, groupMax: 12, highlight: "Competitive clay shooting in a natural Delta setting", bestFor: "active day", brands: ["bestman"] },
      { name: "Private poker / slot tournament", type: "poker-night", duration: "3 hr", pricePerPerson: [40,150], groupMin: 8, groupMax: 20, highlight: "Bookable private group gaming at Hollywood", bestFor: "first night", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Gold Strike Casino Resort", type: "resort", pricePerNight: [99,249], perRoom: true, maxGuests: 4, highlight: "The tallest tower + biggest property, central to everything" },
      { name: "Hollywood Casino & Hotel Tunica", type: "resort", pricePerNight: [79,189], perRoom: true, maxGuests: 4, highlight: "Group-event amenities, on-strip" },
    ],
    transport: [
      { name: "Memphis party-bus / limo charter", type: "limo", priceRange: "$120-$200/hr", highlight: "MEM airport to the Tunica strip + casino hopping" },
    ],
    presentation: {
      moh: { tagline: "Casino glam, golf, and a spa day on the Delta", description: "Tunica is the budget-Vegas bachelorette: tables and slots across a row of riverside resorts, a casino spa for the recovery morning, championship golf, and Memphis (Beale Street) forty minutes north when you want the real club night. Cheap rooms, big weekend." },
      bestman: { tagline: "Tables, sporting clays, and Beale Street nearby", description: "Tunica is a low-cost casino bachelor weekend: 24-hour tables, private poker and slot tournaments, sporting clays in the Delta, golf, and a Beale Street run into Memphis when the floor gets old. Rooms are dirt cheap." },
    } },

  // 14 — Bentonville AR
  { id: "bentonville-ar", city: "Bentonville", state: "AR", region: "south",
    nearestAirport: { code: "XNA", name: "Northwest Arkansas National", driveMinutes: 28 },
    bestMonths: [4,5,9,10], vibes: ["chill","balanced"], score: 6,
    nightlife: [
      { name: "The Tower Bar at The Momentary", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Rooftop of the contemporary-art Momentary, the best aesthetic spot in town", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], url: "https://themomentary.org/food-and-drink/" },
      { name: "Hardwater Cocktail Room", type: "cocktail-bar", vibe: "balanced", priceRange: "$$$", highlight: "Serious craft cocktails in a refined square-side room", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Bar Cleeta", type: "dive-bar", vibe: "balanced", priceRange: "$$", highlight: "NYC-style hang with pool tables, a big wine list + a patio", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "The Hive (21c Museum Hotel)", cuisine: "New American Ozark", priceRange: "$$$", highlight: "Flagship chef-driven, art-filled group-dinner room", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://21cmuseumhotels.com/bentonville/" },
      { name: "Local Lime", cuisine: "Tex-Mex", priceRange: "$$", highlight: "Margaritas + an easy big-group feed", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Big Orange", cuisine: "Burgers", priceRange: "$$", highlight: "Crowd-pleasing burgers + shakes, post-ride fuel", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Coler Mountain Bike Preserve", type: "biking", duration: "4 hr", pricePerPerson: [0,60], groupMin: 2, groupMax: 16, highlight: "Part of 550+ miles in the 'Mountain Bike Capital of the World'", bestFor: "active day", brands: ["both"] },
      { name: "Guided MTB ride + rental (Phat Tire)", type: "biking", duration: "4 hr", pricePerPerson: [75,175], groupMin: 2, groupMax: 10, highlight: "Full-suspension rentals + a guide for out-of-towners", bestFor: "active morning", brands: ["both"] },
      { name: "Crystal Bridges Museum of American Art", type: "tour", duration: "3 hr", pricePerPerson: [0,20], groupMin: 2, groupMax: 20, highlight: "Free world-class art, trails + Moshe Safdie architecture", bestFor: "afternoon", brands: ["moh"] },
      { name: "The Momentary contemporary-art visit", type: "tour", duration: "2 hr", pricePerPerson: [0,20], groupMin: 2, groupMax: 16, highlight: "Modern art in a former cheese factory, rooftop bar by night", bestFor: "afternoon downtime", brands: ["both"] },
      { name: "Razorback Greenway paved ride", type: "biking", duration: "2 hr", pricePerPerson: [0,40], groupMin: 2, groupMax: 16, highlight: "Easy paved route connecting the museum to downtown", bestFor: "morning", brands: ["both"] },
      { name: "Bentonville brewery crawl", type: "brewery-tour", duration: "3 hr", pricePerPerson: [20,50], groupMin: 4, groupMax: 16, highlight: "Bike Rack + Bentonville Brewing taprooms, walkable", bestFor: "first night", brands: ["both"] },
    ],
    lodging: [
      { name: "21c Museum Hotel Bentonville", type: "boutique-hotel", pricePerNight: [199,400], perRoom: true, maxGuests: 2, highlight: "Art hotel on the square with bike valet + wash station" },
      { name: "Downtown Bentonville house rental", type: "house", pricePerNight: [250,700], perRoom: false, maxGuests: 12, highlight: "Whole house near the square for the crew" },
    ],
    transport: [
      { name: "NWA party-bus / trail shuttle", type: "shuttle", priceRange: "$100-$175/hr", highlight: "XNA pickup, trail shuttles + brewery crawl runs" },
    ],
    presentation: {
      moh: { tagline: "Free world-class art and rooftop cocktails", description: "Bentonville is the unexpected bachelorette: free admission to the Crystal Bridges art museum, rooftop cocktails atop the Momentary, an art-filled boutique hotel on the square, and easy paved rides between it all. Cultured, photogenic, and nothing like you'd guess from the map." },
      bestman: { tagline: "550 miles of singletrack, breweries, art on the side", description: "Bentonville is a mountain-bike bachelor town first: 550+ miles of trail at Coler and across NWA, full-suspension rentals and a guide, bike-culture taprooms, and free world-class art when the legs need a rest. The 'Mountain Bike Capital of the World' earns it." },
    } },

  // 15 — Columbia SC
  { id: "columbia-sc", city: "Columbia", state: "SC", region: "south",
    nearestAirport: { code: "CAE", name: "Columbia Metropolitan", driveMinutes: 18 },
    bestMonths: [4,5,6,9,10], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "The Senate", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Big Vista nightclub with DJs + bottle service", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Gervais & Vine", type: "wine-bar", vibe: "chill", priceRange: "$$$", highlight: "Extensive wine list + tapas in the Vista", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Woody on Main", type: "honky-tonk", vibe: "balanced", priceRange: "$$", highlight: "Country line-dancing lessons + DJs Friday and Saturday", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Motor Supply Co. Bistro", cuisine: "New Southern", priceRange: "$$$", highlight: "Vista institution with a daily-changing farm-to-table menu", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Bourbon", cuisine: "Cajun Creole", priceRange: "$$$", highlight: "Big bourbon list + NOLA food on Main St", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Soda City Market", cuisine: "Food market", priceRange: "$", highlight: "Saturday Main Street market for a graze-y hangover brunch", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Saluda River tubing (Palmetto Outdoor)", type: "rafting", duration: "3 hr", pricePerPerson: [25,45], groupMin: 4, groupMax: 30, highlight: "Class I-II floats with an hourly shuttle", bestFor: "active day", brands: ["both"] },
      { name: "Congaree River flat-water float", type: "kayaking", duration: "2 hr", pricePerPerson: [20,40], groupMin: 4, groupMax: 30, highlight: "Calm social float past a sunken ship + Granby Locks", bestFor: "afternoon", brands: ["both"] },
      { name: "Vista + Five Points bar crawl", type: "walking-tour", duration: "4 hr", pricePerPerson: [20,60], groupMin: 4, groupMax: 20, highlight: "Two dense districts of bars, self-guided or booked", bestFor: "first night", brands: ["both"] },
      { name: "Congaree National Park canoe tour", type: "kayaking", duration: "4 hr", pricePerPerson: [40,90], groupMin: 2, groupMax: 12, highlight: "Old-growth swamp paddle 25 minutes out", bestFor: "active morning", brands: ["both"] },
      { name: "The Woody line-dancing lessons", type: "dance-class", duration: "1.5 hr", pricePerPerson: [10,25], groupMin: 4, groupMax: 16, highlight: "Bachata + country warm-up before the party", bestFor: "evening", brands: ["moh"] },
      { name: "Vista spa day", type: "spa", duration: "3 hr", pricePerPerson: [75,200], groupMin: 2, groupMax: 8, highlight: "Downtown salon pampering for the recovery morning", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hotel Trundle", type: "boutique-hotel", pricePerNight: [180,320], perRoom: true, maxGuests: 2, highlight: "Stylish downtown boutique, walk to Main + the Vista" },
      { name: "Congaree Vista house rental", type: "house", pricePerNight: [200,500], perRoom: false, maxGuests: 14, highlight: "Whole house near the Vista nightlife" },
    ],
    transport: [
      { name: "Columbia party-bus / shuttle", type: "party-bus", priceRange: "$100-$160/hr", highlight: "Vista to Five Points hops + river-trip shuttle runs" },
    ],
    presentation: {
      moh: { tagline: "River floats by day, line dancing by night", description: "Columbia is the easy Southern-summer bachelorette: a lazy Saluda River tube float, a Saturday food market for brunch, line-dancing lessons before the party, and the Vista's wine bars and clubs after dark. Cheap, sunny, and built for a group that wants water and a dance floor." },
      bestman: { tagline: "Tube the river, crawl the Vista, paddle the swamp", description: "Columbia keeps it loose: float the Saluda with a cooler, paddle old-growth swamp at Congaree, and crawl the Vista and Five Points after dark. River by day, two bar districts by night, and a college-town price tag." },
    } },

  // 16 — Shreveport LA
  { id: "shreveport-la", city: "Shreveport", state: "LA", region: "south",
    nearestAirport: { code: "SHV", name: "Shreveport Regional", driveMinutes: 18 },
    bestMonths: [3,4,5,10,11], vibes: ["balanced","unhinged"], score: 6,
    nightlife: [
      { name: "Margaritaville Resort Casino", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Market-leading casino with the 5 o'Clock Somewhere Bar + island-party vibe", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://www.margaritavillebossiercity.com/" },
      { name: "The Noble Savage", type: "cocktail-bar", vibe: "balanced", priceRange: "$$", highlight: "Downtown craft cocktails + scotch with live music nightly", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"], url: "https://thenoblesavageshreveport.com/" },
      { name: "Stray Cat", type: "dive-bar", vibe: "unhinged", priceRange: "$$", highlight: "NOLA-style tucked-away patio with late-night ramen til 6am", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Jimmy's Seafood & Steak", cuisine: "Seafood + steak", priceRange: "$$$", highlight: "Upscale group-dinner anchor inside Margaritaville", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://www.margaritavillebossiercity.com/" },
      { name: "The Noble Savage", cuisine: "New American", priceRange: "$$", highlight: "Rotating menu + live music, dinner into nightlife", bestFor: "group-dinner", groupFriendly: true, brands: ["both"], url: "https://thenoblesavageshreveport.com/" },
      { name: "Fatty Arbuckles Pub", cuisine: "Pub", priceRange: "$$", highlight: "Massive bourbon collection + late steak specials", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Casino floor gaming", type: "casino", duration: "open", pricePerPerson: [50,500], groupMin: 2, groupMax: 30, highlight: "Six riverfront casinos to hop across the Red River", bestFor: "anytime", brands: ["both"] },
      { name: "Red River District boardwalk", type: "walking-tour", duration: "3 hr", pricePerPerson: [20,80], groupMin: 4, groupMax: 20, highlight: "Bossier riverfront strip of bars + restaurants near the casinos", bestFor: "afternoon", brands: ["both"] },
      { name: "Downtown Shreveport bar crawl", type: "walking-tour", duration: "4 hr", pricePerPerson: [20,60], groupMin: 4, groupMax: 20, highlight: "Live-music + cocktail crawl off the casino floor", bestFor: "first night", brands: ["both"] },
      { name: "Casino-resort spa day", type: "spa", duration: "3 hr", pricePerPerson: [80,200], groupMin: 2, groupMax: 8, highlight: "Recovery + pampering at Margaritaville or Horseshoe", bestFor: "recovery day", brands: ["moh"] },
      { name: "Sci-Port + riverfront day", type: "tour", duration: "2 hr", pricePerPerson: [10,25], groupMin: 2, groupMax: 20, highlight: "Daytime riverfront filler between casino sessions", bestFor: "afternoon downtime", brands: ["both"] },
      { name: "Boomtown gaming + sportsbook", type: "casino", duration: "3 hr", pricePerPerson: [50,300], groupMin: 2, groupMax: 20, highlight: "Extra Bossier-side gaming + a sportsbook session", bestFor: "first day", brands: ["bestman"] },
    ],
    lodging: [
      { name: "Margaritaville Resort Casino Hotel", type: "resort", pricePerNight: [129,299], perRoom: true, maxGuests: 4, highlight: "Tropical-themed market leader, best all-in-one base" },
      { name: "Horseshoe Bossier City Hotel", type: "resort", pricePerNight: [99,259], perRoom: true, maxGuests: 4, highlight: "Central casino-row property with suites for groups" },
    ],
    transport: [
      { name: "Shreveport-Bossier party-bus / limo", type: "limo", priceRange: "$110-$180/hr", highlight: "SHV airport + cross-river casino hopping" },
    ],
    presentation: {
      moh: { tagline: "Margaritaville casino glam on the Red River", description: "Shreveport is the southern-casino bachelorette: a Margaritaville resort that leads the market, a casino spa for recovery, a Red River District boardwalk, and a downtown live-music crawl. Cheap rooms, Louisiana food, and a riverfront strip of six casinos to bounce between." },
      bestman: { tagline: "Six casinos, a sportsbook, and late-night ramen", description: "Shreveport-Bossier is a real casino bachelor weekend: six riverfront casinos and a sportsbook within minutes, bourbon at Fatty Arbuckles, a downtown crawl, and NOLA-style late-night ramen at the Stray Cat. Vegas energy at Louisiana prices." },
    } },
];
