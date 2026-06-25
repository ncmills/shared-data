/**
 * International destination expansion — Caribbean, Mexico, and Latin American
 * party capitals. Authored against the canonical CanonicalDestination schema
 * so both Best Man HQ (bachelor) and Maid of Honor HQ (bachelorette) consume
 * the same entries via the per-brand overlay.
 *
 * Every entry is region: "international". Venue names are real and were
 * verified against current operator/listing sources at authoring time
 * (June 2026). Prices are USD estimates and intended as planning ranges.
 *
 * Dedup note: Cabo San Lucas, Cancun, Tulum, Cartagena, Montreal, and
 * San Juan PR already live in destinations-data.ts and are intentionally
 * NOT repeated here.
 */

import type { CanonicalDestination } from "./destinations-types";

export const expansionInternational: CanonicalDestination[] = [
  { id: "punta-cana-do", city: "Punta Cana", state: "Dominican Republic", region: "international",
    nearestAirport: { code: "PUJ", name: "Punta Cana International Airport", driveMinutes: 25 },
    bestMonths: [12,1,2,3,4,5], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Coco Bongo Punta Cana", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Vegas-style show-club with acrobats, tribute acts, confetti cannons, and open bar", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Upscale nightlife attire, no athletic wear" },
      { name: "ORO Nightclub", type: "club", vibe: "unhinged", priceRange: "$$$$", highlight: "Two-level superclub inside Hard Rock Hotel built to rival Miami and Vegas", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Upscale nightlife attire, no athletic wear" },
      { name: "Imagine Punta Cana", type: "club", vibe: "balanced", priceRange: "$$", highlight: "Nightclub set inside a natural cave system — low cover, pay-as-you-go drinks", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Legacy Disco", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "High-energy Bavaro dance club popular with the late-night tourist crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Soles Chill Out Bar", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Beachfront bar at Los Corales with live music, hammocks, and sunset cocktails", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Jellyfish Restaurant", cuisine: "Caribbean / Seafood", priceRange: "$$$", highlight: "Beachfront palapa fine dining famous for fresh-grilled seafood and sunset tables", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "La Yola Restaurant", cuisine: "Mediterranean / Seafood", priceRange: "$$$$", highlight: "Boat-shaped restaurant on stilts over the marina at Puntacana Resort", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Citrus Punta Cana", cuisine: "International / Fusion", priceRange: "$$$", highlight: "Beloved Cortecito spot for inventive plates and a lively after-dinner vibe", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Noah Restaurant & Lounge", cuisine: "Contemporary / Tapas", priceRange: "$$$", highlight: "Stylish Los Corales lounge-restaurant that turns into a party as the night goes", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Wacamole Bavaro", cuisine: "Mexican / Tacos", priceRange: "$$", highlight: "Casual tacos and margaritas — the easy late group lunch near the beach", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Catamaran Party Cruise to Saona-area reefs", type: "boat-cruise", duration: "4 hours", pricePerPerson: [60, 120], groupMin: 6, groupMax: 40, highlight: "Open-bar catamaran with snorkel stop and the famous natural pool sandbar", bestFor: "The classic full-group day on the water", brands: ["both"] },
      { name: "Saona Island Day Trip", type: "beach", duration: "Full day", pricePerPerson: [70, 140], groupMin: 4, groupMax: 40, highlight: "Speedboat-and-catamaran combo to a postcard island with buffet and open bar", bestFor: "Bucket-list beach day", brands: ["both"] },
      { name: "Scape Park Cap Cana", type: "zip-lining", duration: "Half day", pricePerPerson: [90, 160], groupMin: 4, groupMax: 20, highlight: "Zip lines, a cenote swim, and cave tours in one adventure park", bestFor: "Adrenaline morning before the beach", brands: ["both"] },
      { name: "Buggy / ATV Off-Road Adventure", type: "atv", duration: "4 hours", pricePerPerson: [60, 110], groupMin: 4, groupMax: 24, highlight: "Mud-splattered dune-buggy run through countryside to a cave and beach", bestFor: "Muddy bachelor chaos", brands: ["bestman"] },
      { name: "Deep-Sea Fishing Charter", type: "fishing", duration: "Half day", pricePerPerson: [150, 350], groupMin: 4, groupMax: 10, highlight: "Private boat out of the marina for mahi, marlin, and tuna", bestFor: "Crews who want a big catch", brands: ["bestman"] },
      { name: "The Spa at Eden Roc Cap Cana", type: "spa", duration: "Half day", pricePerPerson: [150, 350], groupMin: 2, groupMax: 10, highlight: "Luxe treatment suites and hydrotherapy pools for a recovery morning", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hard Rock Hotel & Casino Punta Cana", type: "resort", pricePerNight: [300, 650], perRoom: true, maxGuests: 24, highlight: "All-inclusive mega-resort with casino, ORO nightclub, and 13 pools" },
      { name: "Breathless Punta Cana Resort & Spa", type: "resort", pricePerNight: [250, 500], perRoom: true, maxGuests: 20, highlight: "Adults-only all-inclusive built around daily pool parties and nightlife" },
      { name: "Cap Cana Private Villa (Airbnb/VRBO)", type: "airbnb", pricePerNight: [500, 1800], perRoom: false, maxGuests: 16, highlight: "Gated marina villa with private pool, chef option, and golf-cart access" },
    ],
    transport: [
      { name: "Punta Cana Private Airport Transfer", type: "shuttle", priceRange: "$40-80 per group each way", highlight: "Pre-book a private van from PUJ — no Uber at the resorts, taxis overcharge" },
      { name: "Resort Hopper / Private Driver", type: "charter", priceRange: "$30-60 per trip", highlight: "Hire a driver for the night — rideshare coverage is thin in the resort zone" },
    ],
    presentation: {
      moh: { tagline: "Adults-only pool parties, catamaran sandbars, and beachfront seafood", description: "Punta Cana for brides is the easy all-inclusive: Breathless pool days, a catamaran to the natural pool, and a sunset dinner at Jellyfish — concierge handles the rest." },
      bestman: { tagline: "All-inclusive resorts, a cave nightclub, and dune-buggy mud runs", description: "Punta Cana stacks open-bar resorts, the Coco Bongo show, casino floors, and a catamaran party day. Add deep-sea fishing or an ATV mud run and the trip plans itself." },
    },
  },

  { id: "nassau-bs", city: "Nassau / Paradise Island", state: "Bahamas", region: "international",
    nearestAirport: { code: "NAS", name: "Lynden Pindling International Airport", driveMinutes: 30 },
    bestMonths: [11,12,1,2,3,4,5], vibes: ["chill","balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Aura Nightclub", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Atlantis' upscale club at the top of the casino's grand staircase — South Beach energy", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Upscale nightlife attire, no athletic wear" },
      { name: "Atlantis Casino", type: "casino", vibe: "balanced", priceRange: "$$$", highlight: "60,000 sq ft over a 7-acre lagoon — 85 tables and 700+ slots", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Señor Frog's Nassau", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Harborside party bar with live bands, yard drinks, and dance contests", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Sea Glass Lounge at The Cove", type: "cocktail-lounge", vibe: "chill", priceRange: "$$$$", highlight: "Elegant oceanside patio lounge for a sunset cocktail away from the casino crowd", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"] },
      { name: "Arawak Cay (Fish Fry)", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Strip of colorful local bars and conch shacks — Goombay Smashes and live music", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
    ],
    dining: [
      { name: "Nobu at Atlantis", cuisine: "Japanese / Sushi", priceRange: "$$$$", highlight: "The Bahamas outpost of Nobu — black cod miso and a buzzy big-group room", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Fish by José Andrés", cuisine: "Seafood", priceRange: "$$$$", highlight: "Celebrity-chef seafood at The Cove with a raw bar built for a crew", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Graycliff Restaurant", cuisine: "Continental / Bahamian", priceRange: "$$$$", highlight: "Historic mansion with a legendary 250,000-bottle wine cellar", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Twin Brothers (Arawak Cay)", cuisine: "Bahamian / Seafood", priceRange: "$$", highlight: "Fish-fry institution for cracked conch and conch salad made tableside", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Café Martinique", cuisine: "French", priceRange: "$$$$", highlight: "Old-world French fine dining at Atlantis for the splurge group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Exuma Swimming Pigs Day Trip", type: "boat-cruise", duration: "Full day", pricePerPerson: [200, 450], groupMin: 4, groupMax: 16, highlight: "Powerboat to the Exumas to swim with pigs, nurse sharks, and iguanas", bestFor: "The Bahamas bucket-list day", brands: ["both"] },
      { name: "Blue Lagoon Island Beach Day", type: "beach", duration: "Full day", pricePerPerson: [80, 160], groupMin: 4, groupMax: 30, highlight: "Private island ferry day with hammocks, kayaks, and an optional dolphin swim", bestFor: "Easy full-group beach day", brands: ["both"] },
      { name: "Sandbar & Snorkel Sunset Cruise", type: "sunset-cruise", duration: "3 hours", pricePerPerson: [70, 140], groupMin: 6, groupMax: 30, highlight: "Catamaran to a snorkel reef and a sandbar bar stop with open bar", bestFor: "Day-drinking on the water", brands: ["both"] },
      { name: "Aquaventure Waterpark (Atlantis)", type: "adventure-park", duration: "Full day", pricePerPerson: [150, 250], groupMin: 2, groupMax: 30, highlight: "141-acre waterscape with the Leap of Faith near-vertical shark-tank slide", bestFor: "Group hangover-cure pool day", brands: ["both"] },
      { name: "Deep-Sea Fishing Charter", type: "fishing", duration: "Half day", pricePerPerson: [150, 350], groupMin: 4, groupMax: 8, highlight: "Private boat for wahoo, mahi, and marlin in Bahamian blue water", bestFor: "Crews chasing a trophy", brands: ["bestman"] },
      { name: "The Spa at One&Only Ocean Club", type: "spa", duration: "Half day", pricePerPerson: [200, 450], groupMin: 2, groupMax: 8, highlight: "Garden treatment villas for a quiet recovery morning", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Atlantis Paradise Island (The Royal)", type: "resort", pricePerNight: [350, 800], perRoom: true, maxGuests: 24, highlight: "The mega-resort — casino, waterpark, Aura club, and dozens of restaurants" },
      { name: "Baha Mar (SLS / Grand Hyatt)", type: "resort", pricePerNight: [300, 700], perRoom: true, maxGuests: 20, highlight: "Cable Beach resort complex with its own casino and beach clubs" },
      { name: "Paradise Island Villa (Airbnb)", type: "airbnb", pricePerNight: [400, 1500], perRoom: false, maxGuests: 14, highlight: "Private villa with pool a short ride from the casino and beaches" },
    ],
    transport: [
      { name: "Nassau Airport Taxi / Private Transfer", type: "shuttle", priceRange: "$35-70 per group each way", highlight: "Fixed-rate taxis from NAS; pre-book a van for bigger groups" },
      { name: "Water Taxi (Nassau ↔ Paradise Island)", type: "charter", priceRange: "$4-8 per person", highlight: "Quick harbor ferry between downtown Nassau and Paradise Island" },
    ],
    presentation: {
      moh: { tagline: "Swimming pigs, the Atlantis waterpark, and a sunset sandbar cruise", description: "Nassau for brides is the Exuma swimming-pigs day, an Aquaventure pool day, and a sunset catamaran — easy flights, English-speaking, and content everywhere." },
      bestman: { tagline: "Casino floors, swimming pigs, and offshore fishing", description: "Nassau pairs the Atlantis casino and Aura club with a swimming-pigs powerboat day and deep-sea fishing. Short flight, dollars accepted, no planning headache." },
    },
  },

  { id: "montego-bay-jm", city: "Montego Bay", state: "Jamaica", region: "international",
    nearestAirport: { code: "MBJ", name: "Sangster International Airport", driveMinutes: 15 },
    bestMonths: [11,12,1,2,3,4], vibes: ["chill","balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Pier 1 Marina & Nightclub", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Waterfront club whose Friday-night party draws over a thousand people", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Margaritaville Montego Bay", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Beachfront party bar with a 110-ft waterslide, bikini contests, and live music", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Blue Beat Lounge", type: "cocktail-lounge", vibe: "balanced", priceRange: "$$$", highlight: "Hip Strip jazz-and-cocktail lounge with a more grown-up late vibe", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Pork Pit", type: "bar", vibe: "chill", priceRange: "$", highlight: "Open-air jerk-and-Red-Stripe spot to start the night the local way", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
      { name: "Taboo Nightclub", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Late-night Hip Strip dance club with dancehall and reggae sets", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Scotchies", cuisine: "Jamaican / Jerk", priceRange: "$", highlight: "The definitive open-pit jerk chicken and pork — a mandatory group lunch", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "The Houseboat Grill", cuisine: "Caribbean / Seafood", priceRange: "$$$", highlight: "Dine on a converted houseboat floating in Bogue Lagoon", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Pelican Grill", cuisine: "Jamaican / American", priceRange: "$$", highlight: "Hip Strip diner institution for big breakfasts and rum punch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Sugar Mill Restaurant", cuisine: "Caribbean Fine Dining", priceRange: "$$$$", highlight: "Half Moon's elegant restaurant set by a 17th-century waterwheel", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Pier 1 Restaurant", cuisine: "Seafood / Jamaican", priceRange: "$$", highlight: "Waterfront seafood by day at the same marina that parties at night", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Rick's Café & Negril Cliff-Jump Day Trip", type: "tour", duration: "Full day", pricePerPerson: [70, 130], groupMin: 4, groupMax: 30, highlight: "Drive to Negril for 35-ft cliff jumping and a famous Rick's Café sunset", bestFor: "The signature Jamaica day", brands: ["both"] },
      { name: "Catamaran Cruise & Snorkel", type: "boat-cruise", duration: "4 hours", pricePerPerson: [60, 110], groupMin: 6, groupMax: 40, highlight: "Open-bar catamaran with a reef snorkel stop along the MoBay coast", bestFor: "Party on the water", brands: ["both"] },
      { name: "Martha Brae River Rafting", type: "rafting", duration: "Half day", pricePerPerson: [60, 100], groupMin: 2, groupMax: 20, highlight: "Lazy bamboo-raft float down a jungle river with a personal captain", bestFor: "Chill hangover-day activity", brands: ["both"] },
      { name: "Dunn's River Falls Climb", type: "hiking", duration: "Half day", pricePerPerson: [40, 90], groupMin: 4, groupMax: 30, highlight: "Climb the famous terraced waterfall hand-in-hand up to the top", bestFor: "Active group adventure", brands: ["both"] },
      { name: "ATV & Zipline Adventure", type: "atv", duration: "Half day", pricePerPerson: [80, 140], groupMin: 4, groupMax: 20, highlight: "ATVs through the hills plus a canopy zipline run", bestFor: "Adrenaline morning", brands: ["bestman"] },
      { name: "Spa at Round Hill", type: "spa", duration: "Half day", pricePerPerson: [150, 350], groupMin: 2, groupMax: 8, highlight: "Hillside treatment cottages overlooking the sea for a recovery morning", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hyatt Zilara Rose Hall", type: "resort", pricePerNight: [300, 600], perRoom: true, maxGuests: 20, highlight: "Adults-only all-inclusive on Rose Hall beach with multiple pools and bars" },
      { name: "Hyatt Ziva Rose Hall", type: "resort", pricePerNight: [280, 550], perRoom: true, maxGuests: 24, highlight: "Sister all-inclusive next door — good for a mixed-age crew" },
      { name: "Rose Hall Private Villa (Airbnb)", type: "airbnb", pricePerNight: [400, 1600], perRoom: false, maxGuests: 16, highlight: "Gated hillside villa with pool, butler option, and ocean views" },
    ],
    transport: [
      { name: "MBJ Private Airport Transfer", type: "shuttle", priceRange: "$30-70 per group each way", highlight: "Pre-book a van from Sangster — 15 minutes to Rose Hall, longer to Negril" },
      { name: "Private Driver for the Day", type: "charter", priceRange: "$120-250 per day", highlight: "Hire a driver to cover Negril/Dunn's River runs — easier than self-driving" },
    ],
    presentation: {
      moh: { tagline: "Adults-only resorts, a Negril cliff-sunset, and bamboo river rafting", description: "MoBay for brides is a Hyatt Zilara pool day, the Rick's Café sunset in Negril, and a lazy Martha Brae raft float — 15 minutes from the airport to the beach." },
      bestman: { tagline: "All-inclusive resorts, Rick's Café cliff jumps, and Red Stripe by the pier", description: "Montego Bay gives you open-bar resorts, Pier 1's massive Friday party, and a Negril cliff-diving day. Jerk at Scotchies, a catamaran, and an ATV run round it out." },
    },
  },

  { id: "negril-jm", city: "Negril", state: "Jamaica", region: "international",
    nearestAirport: { code: "MBJ", name: "Sangster International Airport", driveMinutes: 80 },
    bestMonths: [11,12,1,2,3,4], vibes: ["chill","balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Rick's Café", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Clifftop institution for 35-ft cliff diving, reggae, and the legendary sunset", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Margaritaville Negril", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "Seven Mile Beach party bar with waterslides, a trampoline, and live music", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Alfred's Ocean Palace", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beachfront bar with live reggae bands several nights a week", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Jungle Nightclub", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Negril's main late-night dance club with dancehall and EDM nights", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Pushcart Restaurant & Bar", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Clifftop jerk-and-rum spot at Rockhouse with a laid-back West End vibe", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "3 Dives Jerk Centre", cuisine: "Jamaican / Jerk", priceRange: "$", highlight: "Clifftop jerk pit beloved for charcoal-grilled chicken and lobster", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Rockhouse Restaurant", cuisine: "Caribbean Fine Dining", priceRange: "$$$", highlight: "Open-air cliffside dining over the water at the Rockhouse Hotel", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Sweet Spice", cuisine: "Jamaican", priceRange: "$", highlight: "Family-run local kitchen for curry goat and oxtail at honest prices", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "The Spot Bar & Grill", cuisine: "Jamaican / Seafood", priceRange: "$$", highlight: "Seven Mile Beach grill with fresh fish and beachside tables", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Ivan's Bar & Restaurant", cuisine: "Caribbean", priceRange: "$$$", highlight: "Clifftop Catcha Falling Star spot for a sunset dinner over the West End", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Seven Mile Beach Day", type: "beach", duration: "Full day", pricePerPerson: [0, 40], groupMin: 2, groupMax: 30, highlight: "One of the Caribbean's best swimmable beaches with bars the whole length", bestFor: "Low-effort group beach day", brands: ["both"] },
      { name: "Catamaran Cruise to Rick's Café", type: "sunset-cruise", duration: "4 hours", pricePerPerson: [70, 120], groupMin: 6, groupMax: 30, highlight: "Open-bar catamaran along the cliffs ending at Rick's for the sunset", bestFor: "Sunset on the water", brands: ["both"] },
      { name: "Cliff Jumping at the West End", type: "scenic-overlook", duration: "2 hours", pricePerPerson: [0, 30], groupMin: 2, groupMax: 20, highlight: "Leap from the famous Negril cliffs into deep turquoise water", bestFor: "Daredevil afternoon", brands: ["both"] },
      { name: "Snorkel & Reef Tour", type: "snorkeling", duration: "3 hours", pricePerPerson: [40, 80], groupMin: 4, groupMax: 16, highlight: "Boat to shallow reefs off the West End with gear and a guide", bestFor: "Easy water activity", brands: ["both"] },
      { name: "YS Falls & Black River Safari", type: "tour", duration: "Full day", pricePerPerson: [80, 130], groupMin: 4, groupMax: 20, highlight: "Waterfall rope-swing day plus a croc-spotting river safari", bestFor: "Adventure day trip", brands: ["both"] },
      { name: "Beachfront Spa Cabana", type: "spa", duration: "Half day", pricePerPerson: [80, 200], groupMin: 2, groupMax: 8, highlight: "Open-air massage cabanas on Seven Mile Beach with the waves as soundtrack", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Rockhouse Hotel", type: "boutique-hotel", pricePerNight: [200, 450], perRoom: true, maxGuests: 16, highlight: "Iconic clifftop villas over the West End with ladders into the sea" },
      { name: "Couples Negril", type: "resort", pricePerNight: [350, 700], perRoom: true, maxGuests: 16, highlight: "All-inclusive on Seven Mile Beach — popular for wedding-party crews" },
      { name: "Seven Mile Beach Villa (Airbnb)", type: "airbnb", pricePerNight: [350, 1200], perRoom: false, maxGuests: 14, highlight: "Private beach house steps from the water with cook and pool options" },
    ],
    transport: [
      { name: "MBJ → Negril Private Transfer", type: "shuttle", priceRange: "$80-140 per group each way", highlight: "Pre-book the 80-minute van ride from Sangster — no rideshare in Negril" },
      { name: "Route Taxi / Local Driver", type: "rideshare", priceRange: "$3-15 per ride", highlight: "Shared route taxis run Seven Mile Beach to the West End cheaply" },
    ],
    presentation: {
      moh: { tagline: "Seven Mile Beach, cliffside sunsets, and open-air spa cabanas", description: "Negril for brides is the slow, gorgeous one: a swimmable beach all day, beach-cabana massages, and a Rick's Café cliff sunset to close every night." },
      bestman: { tagline: "Cliff jumps, Seven Mile Beach, and jerk-and-rum nights", description: "Negril is the laid-back Jamaica trip: cliff diving at Rick's, a catamaran sunset, 3 Dives jerk, and Seven Mile Beach bars from end to end. Worth the 80-minute drive." },
    },
  },

  { id: "playa-del-carmen-mx", city: "Playa del Carmen", state: "Mexico", region: "international",
    nearestAirport: { code: "CUN", name: "Cancun International Airport", driveMinutes: 50 },
    bestMonths: [11,12,1,2,3,4], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Coco Bongo Playa del Carmen", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "1,800-capacity show-club with acrobats, tribute acts, and open bar on 5th Ave", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Upscale nightlife attire, no athletic wear" },
      { name: "Mandala Playa", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Oriental-themed superclub on 5th Ave with EDM, reggaeton, and a rooftop terrace", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Upscale nightlife attire, no athletic wear" },
      { name: "La Vaquita", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Cow-themed party bar with giant cups and inflatable cows — everyone ends up here", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "La Santanera", type: "club", vibe: "balanced", priceRange: "$$", highlight: "Two-level underground club known for house DJs and a cooler crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Zenzi Beach Bar", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Beachfront bar with live music, fire dancers, and toes-in-the-sand sunsets", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "El Fogón", cuisine: "Tacos / Mexican", priceRange: "$", highlight: "Locals' favorite for al pastor tacos — cheap, fast, and packed", bestFor: "late-night", groupFriendly: true, brands: ["both"] },
      { name: "Alux Restaurant", cuisine: "Mexican Fine Dining", priceRange: "$$$$", highlight: "Fine dining inside a real cavern with a lounge built into the rock", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "La Cueva del Chango", cuisine: "Mexican / Brunch", priceRange: "$$", highlight: "Jungle-garden brunch spot famous for chilaquiles and fresh juices", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Catch Playa del Carmen", cuisine: "Seafood / Rooftop", priceRange: "$$$$", highlight: "Rooftop seafood-and-sushi scene at Thompson with a DJ at dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Don Sirloin", cuisine: "Tacos / Grill", priceRange: "$", highlight: "Late-night arrachera taco chain — the post-club savior", bestFor: "late-night", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Cenote Snorkel & Swim Tour", type: "snorkeling", duration: "Half day", pricePerPerson: [60, 120], groupMin: 4, groupMax: 16, highlight: "Swim and snorkel a chain of crystalline jungle cenotes", bestFor: "Unmissable Riviera Maya activity", brands: ["both"] },
      { name: "Cozumel Reef Snorkel Day Trip", type: "boat-cruise", duration: "Full day", pricePerPerson: [80, 150], groupMin: 4, groupMax: 20, highlight: "Ferry to Cozumel for world-class reef snorkeling and a beach club", bestFor: "Full-group day on the water", brands: ["both"] },
      { name: "Mandala Beach Club Day Pass", type: "pool-party", duration: "5 hours", pricePerPerson: [40, 100], groupMin: 4, groupMax: 20, highlight: "Beach dayclub with DJ, pool, and all-you-can-drink packages", bestFor: "Day-drinking with the crew", brands: ["both"] },
      { name: "Tulum Ruins & Beach Day Trip", type: "tour", duration: "Full day", pricePerPerson: [60, 120], groupMin: 4, groupMax: 20, highlight: "Cliffside Mayan ruins over the sea plus a Tulum beach-club afternoon", bestFor: "Culture-plus-beach day", brands: ["both"] },
      { name: "ATV & Zipline Jungle Adventure", type: "atv", duration: "Half day", pricePerPerson: [80, 140], groupMin: 4, groupMax: 20, highlight: "ATVs, ziplines, and a cenote rappel in the jungle outside town", bestFor: "Adrenaline morning", brands: ["bestman"] },
      { name: "Mayan Cacao & Mezcal Tasting", type: "cooking-class", duration: "2 hours", pricePerPerson: [40, 80], groupMin: 4, groupMax: 15, highlight: "Grind cacao the Maya way and taste artisanal mezcals to warm up for dinner", bestFor: "Pre-dinner group activity", brands: ["both"] },
    ],
    lodging: [
      { name: "Thompson Playa del Carmen", type: "hotel", pricePerNight: [250, 550], perRoom: true, maxGuests: 16, highlight: "Design hotel a block off 5th Ave with the Catch rooftop and beach club" },
      { name: "Hotel Xcaret México", type: "resort", pricePerNight: [400, 800], perRoom: true, maxGuests: 24, highlight: "All-inclusive resort with river pools and free access to the Xcaret parks" },
      { name: "Playacar Private Villa (Airbnb)", type: "airbnb", pricePerNight: [350, 1200], perRoom: false, maxGuests: 16, highlight: "Gated Playacar villa with pool, walkable to the beach and 5th Ave" },
    ],
    transport: [
      { name: "CUN → Playa Private Transfer", type: "shuttle", priceRange: "$60-90 per group each way", highlight: "Pre-book the 50-minute van from Cancun airport down the highway" },
      { name: "Uber Playa del Carmen", type: "rideshare", priceRange: "$3-12 per ride", highlight: "Uber operates in Playa — much cheaper than the taxi cartel around 5th Ave" },
    ],
    presentation: {
      moh: { tagline: "Cenote swims, rooftop seafood, and a walkable 5th Avenue", description: "Playa for brides is a cenote-snorkel morning, the Catch rooftop at sunset, and a stroll down 5th Ave with everything in walking distance — Tulum and Cozumel are easy day trips." },
      bestman: { tagline: "Coco Bongo, cenotes, and a walkable party strip", description: "Playa del Carmen is Cancun's cooler cousin: Coco Bongo and Mandala on 5th Ave, cenote and Cozumel day trips, beach dayclubs, and tacos at 3am. Everything's walkable." },
    },
  },

  { id: "puerto-vallarta-mx", city: "Puerto Vallarta", state: "Mexico", region: "international",
    nearestAirport: { code: "PVR", name: "Lic. Gustavo Díaz Ordaz International Airport", driveMinutes: 20 },
    bestMonths: [11,12,1,2,3,4,5], vibes: ["chill","balanced","unhinged"], score: 8,
    nightlife: [
      { name: "La Santa", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Trendiest club in town with two dance floors, big DJs, and over-the-top shows", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Upscale nightlife attire, no athletic wear" },
      { name: "Mandala Vallarta", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Massive giant-Buddha club on the Malecón with ocean-view EDM and Top 40", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Upscale nightlife attire, no athletic wear" },
      { name: "Strana", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Hotel-zone club with rotating international DJs and a retractable-roof fireworks show", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Smart casual to upscale" },
      { name: "Mr. Flamingo", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Zona Romántica corner bar whose party spills into the street every night", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Mantamar Beach Club", type: "pool-party", vibe: "unhinged", priceRange: "$$$", highlight: "Los Muertos beach club with DJ daybed parties — a Zona Romántica institution", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "La Palapa", cuisine: "Mexican / Seafood", priceRange: "$$$", highlight: "Toes-in-the-sand fine dining on Los Muertos Beach with a romantic palapa", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Pancho's Takos", cuisine: "Tacos / Al Pastor", priceRange: "$", highlight: "The al pastor taco spot everyone lines up for in Zona Romántica", bestFor: "late-night", groupFriendly: true, brands: ["both"] },
      { name: "El Barracuda", cuisine: "Seafood / Beach Bar", priceRange: "$$", highlight: "Beachfront bar-restaurant for ceviche, micheladas, and a sunset crowd", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Café des Artistes", cuisine: "French / Mexican Fusion", priceRange: "$$$$", highlight: "Garden fine-dining landmark for the splurge group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The Iguana Restaurant", cuisine: "Mexican / Hacienda", priceRange: "$$$", highlight: "Hacienda dinner-and-show with mariachi and folkloric dancers — fun for groups", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Yelapa & Los Arcos Boat Tour", type: "boat-cruise", duration: "Full day", pricePerPerson: [60, 120], groupMin: 6, groupMax: 30, highlight: "Boat across Banderas Bay to a hidden cove village with snorkeling and open bar", bestFor: "Full-group day on the water", brands: ["both"] },
      { name: "Marigalante Pirate Ship Party Cruise", type: "sunset-cruise", duration: "4 hours", pricePerPerson: [80, 140], groupMin: 6, groupMax: 40, highlight: "Galleon replica with shows, open bar, and a full-on party at sea", bestFor: "Over-the-top group night", brands: ["both"] },
      { name: "Sierra Madre ATV & Zipline Combo", type: "atv", duration: "Half day", pricePerPerson: [80, 150], groupMin: 4, groupMax: 20, highlight: "ATVs through the jungle plus a canopy zipline above a river", bestFor: "Adrenaline morning", brands: ["bestman"] },
      { name: "Marietas Islands Snorkel Tour", type: "snorkeling", duration: "Full day", pricePerPerson: [90, 160], groupMin: 4, groupMax: 16, highlight: "Boat to a protected archipelago to snorkel and see the hidden Playa del Amor", bestFor: "Bucket-list water day", brands: ["both"] },
      { name: "Sportfishing Charter", type: "fishing", duration: "Half day", pricePerPerson: [150, 350], groupMin: 4, groupMax: 8, highlight: "Banderas Bay charter for sailfish, marlin, and dorado", bestFor: "Crews chasing a marlin", brands: ["bestman"] },
      { name: "Tequila & Mezcal Tasting Tour", type: "distillery-tour", duration: "3 hours", pricePerPerson: [40, 90], groupMin: 4, groupMax: 16, highlight: "Guided agave-spirit tasting through the old town before dinner", bestFor: "Pre-dinner warm-up", brands: ["both"] },
    ],
    lodging: [
      { name: "Hilton Vallarta Riviera All-Inclusive", type: "resort", pricePerNight: [250, 500], perRoom: true, maxGuests: 20, highlight: "Hotel-zone all-inclusive with pools, beach, and easy nightlife access" },
      { name: "Hotel Mousai", type: "hotel", pricePerNight: [300, 650], perRoom: true, maxGuests: 16, highlight: "Adults-only design hotel with a rooftop infinity pool over Conchas Chinas" },
      { name: "Conchas Chinas Private Villa (Airbnb)", type: "airbnb", pricePerNight: [350, 1500], perRoom: false, maxGuests: 16, highlight: "Hillside villa with infinity pool and bay views, walkable to Zona Romántica" },
    ],
    transport: [
      { name: "PVR Private Airport Transfer", type: "shuttle", priceRange: "$30-60 per group each way", highlight: "Pre-book a van from the airport — 20 minutes to most of the action" },
      { name: "Uber Puerto Vallarta", type: "rideshare", priceRange: "$3-12 per ride", highlight: "Uber works well across town and is cheaper than the malecón taxis" },
    ],
    presentation: {
      moh: { tagline: "Yelapa boat days, beach-club brunches, and a romantic Malecón", description: "PV for brides is a Marietas snorkel day, Mantamar beach-club afternoons, and a sunset dinner at La Palapa — walkable, welcoming, and gorgeous from the hills down." },
      bestman: { tagline: "Malecón clubs, a pirate-ship party, and Banderas Bay fishing", description: "Puerto Vallarta gives you ocean-view clubs on the Malecón, a Marigalante party cruise, sportfishing, and ATV jungle runs — short flight, big bay, easy Uber." },
    },
  },

  { id: "cozumel-mx", city: "Cozumel", state: "Mexico", region: "international",
    nearestAirport: { code: "CZM", name: "Cozumel International Airport", driveMinutes: 15 },
    bestMonths: [11,12,1,2,3,4,5], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Wet Wendy's Margarita House", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "San Miguel institution for oversized handcrafted margaritas and a loud crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Money Bar Beach Club", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Beach-club bar over a house reef — snorkel by day, live music at sunset", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Carlos'n Charlie's Cozumel", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "The reliable party bar with dancing, games, and yard drinks near the pier", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Tiki Tok", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Waterfront bar-restaurant with cocktails and a relaxed late vibe downtown", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "1.5 Tequila Lounge", type: "cocktail-lounge", vibe: "balanced", priceRange: "$$$", highlight: "Rooftop tequila-and-mezcal lounge with a curated agave list", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"] },
    ],
    dining: [
      { name: "Kondesa", cuisine: "Contemporary Mexican", priceRange: "$$$", highlight: "Garden-courtyard spot for modern Mexican plates and mezcal cocktails", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "La Choza", cuisine: "Traditional Mexican", priceRange: "$$", highlight: "Family-run favorite for cochinita pibil and chiles en nogada", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "El Coffee Cozumel", cuisine: "Brunch / Café", priceRange: "$", highlight: "Downtown brunch spot for chilaquiles and strong coffee before a dive", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Buccanos at Night", cuisine: "Seafood Fine Dining", priceRange: "$$$$", highlight: "Beach-club-turned-fine-dining for a special seafood dinner by the water", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Lobster Shanty", cuisine: "Seafood", priceRange: "$$$", highlight: "Beachfront lobster-and-margarita spot popular for big tables", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
    ],
    activities: [
      { name: "Palancar & El Cielo Reef Snorkel Tour", type: "snorkeling", duration: "Half day", pricePerPerson: [40, 90], groupMin: 4, groupMax: 20, highlight: "Boat to Cozumel's famous reefs and the starfish-strewn El Cielo sandbar", bestFor: "The signature Cozumel day", brands: ["both"] },
      { name: "Two-Tank Reef Dive (Palancar Gardens)", type: "boat-cruise", duration: "Half day", pricePerPerson: [80, 140], groupMin: 2, groupMax: 12, highlight: "World-class drift diving with turtles and walls of coral", bestFor: "Certified divers in the crew", brands: ["both"] },
      { name: "Open-Air Jeep Island Tour", type: "atv", duration: "Half day", pricePerPerson: [70, 130], groupMin: 4, groupMax: 20, highlight: "Self-drive jeep loop to the wild east coast beaches and a tequila stop", bestFor: "Group adventure day", brands: ["bestman"] },
      { name: "Money Bar Beach Day", type: "beach", duration: "Full day", pricePerPerson: [0, 40], groupMin: 2, groupMax: 30, highlight: "Snorkel a house reef straight off the beach with a bar and loungers", bestFor: "Easy beach-and-snorkel day", brands: ["both"] },
      { name: "Catamaran Snorkel & Sunset Sail", type: "sunset-cruise", duration: "4 hours", pricePerPerson: [70, 130], groupMin: 6, groupMax: 30, highlight: "Open-bar catamaran with a reef stop and a Caribbean sunset finish", bestFor: "Day-drinking on the water", brands: ["both"] },
      { name: "Beachfront Spa Day", type: "spa", duration: "Half day", pricePerPerson: [100, 250], groupMin: 2, groupMax: 8, highlight: "Seaside massage and temazcal options at an island resort spa", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Cozumel Palace All-Inclusive", type: "resort", pricePerNight: [250, 500], perRoom: true, maxGuests: 16, highlight: "Oceanfront all-inclusive in San Miguel with a house reef off the pier" },
      { name: "Hotel B Cozumel", type: "boutique-hotel", pricePerNight: [150, 350], perRoom: true, maxGuests: 16, highlight: "Eclectic boutique with a private beach club and great snorkeling" },
      { name: "Cozumel Beachfront Villa (Airbnb)", type: "airbnb", pricePerNight: [300, 1000], perRoom: false, maxGuests: 12, highlight: "Private villa with pool and snorkel-from-the-dock reef access" },
    ],
    transport: [
      { name: "Cozumel Taxi / Airport Transfer", type: "shuttle", priceRange: "$10-30 per group each way", highlight: "Short fixed-rate taxi ride from the airport; no Uber on the island" },
      { name: "Playa del Carmen ↔ Cozumel Ferry", type: "charter", priceRange: "$15-25 per person each way", highlight: "Frequent 45-minute ferry from Playa for crews staying on the mainland" },
    ],
    presentation: {
      moh: { tagline: "Crystal reefs, starfish sandbars, and seaside spa days", description: "Cozumel for brides is the calm, beautiful one: a Palancar-and-El-Cielo snorkel morning, oversized margaritas at Wet Wendy's, and a beachfront massage to recover." },
      bestman: { tagline: "World-class reefs, jeep tours, and margarita houses", description: "Cozumel is the dive-and-snorkel trip: Palancar Gardens drift dives, a self-drive jeep loop to the wild coast, and Wet Wendy's margaritas after. Easy ferry from Playa." },
    },
  },

  { id: "aruba-aw", city: "Aruba", state: "Aruba", region: "international",
    nearestAirport: { code: "AUA", name: "Queen Beatrix International Airport", driveMinutes: 20 },
    bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], vibes: ["chill","balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Bugaloe Beach Bar & Grill", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "The most popular Palm Beach pier bar — live music, happy hour, and Sunday blowouts", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Stellaris Casino (Aruba Marriott)", type: "casino", vibe: "balanced", priceRange: "$$$", highlight: "The island's largest casino floor with tables, slots, and a late lounge", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "South Beach Centre", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Palm Beach nightlife complex with a cluster of bars and dance floors", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Gusto Nightclub", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "High-energy Palm Beach club with DJ nights and bottle service", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Upscale nightlife attire" },
      { name: "Eduardo's Beach Shack", type: "bar", vibe: "chill", priceRange: "$", highlight: "Acai-and-cocktail beach shack on Palm Beach for a chill sunset start", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Zeerovers", cuisine: "Seafood / Local", priceRange: "$$", highlight: "Dock-side fish shack where you order fresh catch by the pound — pure local", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "The Old Cunucu House", cuisine: "Aruban", priceRange: "$$$", highlight: "Restored country house serving traditional keshi yena and fresh fish", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Bingo at the Sopranos / Wilhelmina", cuisine: "Mediterranean Fine Dining", priceRange: "$$$$", highlight: "Upscale Oranjestad dining for a polished group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "The West Deck", cuisine: "Caribbean / Tapas", priceRange: "$$$", highlight: "Beachfront island-grill tapas with a sunset crowd near downtown", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Eduardo's / Linda's Pancakes", cuisine: "Brunch", priceRange: "$$", highlight: "Easy boozy-brunch options along Palm Beach to start a beach day", bestFor: "brunch", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Renaissance Island Flamingo Beach Day", type: "beach", duration: "Full day", pricePerPerson: [100, 175], groupMin: 2, groupMax: 16, highlight: "Private-island day pass to the famous flamingo beach with cabanas", bestFor: "The Aruba photo everyone wants", brands: ["both"] },
      { name: "De Palm Island All-Inclusive Day", type: "snorkeling", duration: "Full day", pricePerPerson: [100, 160], groupMin: 4, groupMax: 30, highlight: "Coral-island day with snorkeling, slides, banana boats, and open bar", bestFor: "Easy full-group day", brands: ["both"] },
      { name: "Catamaran Snorkel & Sail (Antilla Wreck)", type: "boat-cruise", duration: "4 hours", pricePerPerson: [60, 120], groupMin: 6, groupMax: 40, highlight: "Open-bar catamaran to the Antilla shipwreck and reef snorkel stops", bestFor: "Party on the water", brands: ["both"] },
      { name: "UTV / Jeep Off-Road National Park Tour", type: "atv", duration: "Half day", pricePerPerson: [80, 150], groupMin: 4, groupMax: 20, highlight: "Off-road to Arikok park's Natural Pool, caves, and the rugged east coast", bestFor: "Adventure morning", brands: ["bestman"] },
      { name: "Sunset Sail with Open Bar", type: "sunset-cruise", duration: "2 hours", pricePerPerson: [50, 90], groupMin: 6, groupMax: 30, highlight: "Catamaran sunset sail with cocktails off Palm Beach", bestFor: "Pre-dinner group toast", brands: ["both"] },
      { name: "Spa del Sol / Resort Spa Day", type: "spa", duration: "Half day", pricePerPerson: [120, 300], groupMin: 2, groupMax: 8, highlight: "Beachfront massage palapas and resort hydrotherapy for a recovery morning", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Aruba Marriott Resort & Stellaris Casino", type: "resort", pricePerNight: [300, 600], perRoom: true, maxGuests: 20, highlight: "Palm Beach resort with the island's biggest casino and adults-only Tradewinds club" },
      { name: "Hilton Aruba Caribbean Resort", type: "resort", pricePerNight: [280, 550], perRoom: true, maxGuests: 20, highlight: "Palm Beach resort with two pools, beach cabanas, and a spa" },
      { name: "Palm/Eagle Beach Villa (Airbnb)", type: "airbnb", pricePerNight: [350, 1200], perRoom: false, maxGuests: 14, highlight: "Private villa with pool a short ride from Palm Beach nightlife" },
    ],
    transport: [
      { name: "AUA Airport Transfer / Taxi", type: "shuttle", priceRange: "$25-45 per group each way", highlight: "Fixed-rate taxis from the airport; 20 minutes to Palm Beach" },
      { name: "Aruba Public Bus / Private Driver", type: "charter", priceRange: "$3-50 per trip", highlight: "Reliable Arubus runs Oranjestad to Palm Beach; hire a driver for night runs" },
    ],
    presentation: {
      moh: { tagline: "Flamingo-beach photos, catamaran sails, and year-round sun", description: "Aruba for brides is the Renaissance Island flamingo day, a sunset catamaran, and Palm Beach pier cocktails — outside the hurricane belt, so it's reliable any month." },
      bestman: { tagline: "Beach-bar pier crawls, casino floors, and off-road jeep runs", description: "Aruba pairs Palm Beach bars and the Stellaris casino with a catamaran wreck snorkel and an off-road run through Arikok park. Sunny all year, easy and walkable." },
    },
  },

  { id: "providenciales-tc", city: "Providenciales", state: "Turks & Caicos", region: "international",
    nearestAirport: { code: "PLS", name: "Providenciales International Airport", driveMinutes: 15 },
    bestMonths: [11,12,1,2,3,4,5], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "Danny Buoy's", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Grace Bay Irish pub with karaoke, themed parties, and the island's liveliest late crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Da Conch Shack", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Beachfront conch shack with rum punch, a junkanoo band, and big Wednesday nights", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Infiniti Bar at Grace Bay Club", type: "cocktail-lounge", vibe: "balanced", priceRange: "$$$$", highlight: "90-ft oceanfront bar for sunset cocktails — one of the longest bars in the Caribbean", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "The Deck at Seven Stars", type: "bar", vibe: "balanced", priceRange: "$$$", highlight: "Grace Bay beach bar with fire pits, live music, and a sunset scene", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"] },
      { name: "Bugaloo's Conch Crawl", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Sandbar-side bar known for fresh conch, rum, and a weekend party", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
    ],
    dining: [
      { name: "Coco Bistro", cuisine: "Caribbean Fine Dining", priceRange: "$$$$", highlight: "Dinner under a palm grove — the island's most coveted reservation", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Las Brisas", cuisine: "Mediterranean / Spanish", priceRange: "$$$", highlight: "Waterfront tapas and paella on Chalk Sound with sunset tables", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mr. Grouper", cuisine: "Seafood / Local", priceRange: "$$", highlight: "No-frills local seafood shack for the freshest grouper and snapper", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Bay Bistro", cuisine: "International / Brunch", priceRange: "$$$", highlight: "Toes-in-the-sand Grace Bay dining famous for weekend brunch", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Coco Bistro Garden Bar", cuisine: "Cocktails / Small Plates", priceRange: "$$$", highlight: "Pre-dinner drinks in the palm garden — easy spot to gather the group", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Grace Bay Beach Day", type: "beach", duration: "Full day", pricePerPerson: [0, 50], groupMin: 2, groupMax: 30, highlight: "Routinely ranked the world's best beach — calm, powder-white, and swimmable", bestFor: "The reason you came", brands: ["both"] },
      { name: "Half-Day Snorkel & Conch-Diving Cruise", type: "snorkeling", duration: "Half day", pricePerPerson: [80, 150], groupMin: 4, groupMax: 16, highlight: "Boat to the barrier reef to snorkel and dive for fresh conch, cleaned aboard", bestFor: "Signature TCI experience", brands: ["both"] },
      { name: "Private Charter to Iguana Island & Sandbar", type: "boat-cruise", duration: "Full day", pricePerPerson: [150, 350], groupMin: 6, groupMax: 16, highlight: "Private boat to deserted cays, a sandbar bar stop, and snorkel reefs", bestFor: "Splurge full-group day", brands: ["both"] },
      { name: "Sunset Catamaran Cruise", type: "sunset-cruise", duration: "3 hours", pricePerPerson: [70, 130], groupMin: 6, groupMax: 30, highlight: "Open-bar catamaran along Grace Bay at golden hour", bestFor: "Pre-dinner group toast", brands: ["both"] },
      { name: "Kiteboarding / Paddle at Long Bay", type: "kayaking", duration: "2 hours", pricePerPerson: [50, 120], groupMin: 2, groupMax: 12, highlight: "Shallow flat-water lessons in paddleboarding or kiteboarding", bestFor: "Active morning", brands: ["both"] },
      { name: "Spa at Grace Bay Club", type: "spa", duration: "Half day", pricePerPerson: [150, 350], groupMin: 2, groupMax: 8, highlight: "Oceanfront treatment rooms for a quiet recovery morning", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Grace Bay Club", type: "resort", pricePerNight: [500, 1200], perRoom: true, maxGuests: 16, highlight: "Flagship Grace Bay resort with the Infiniti bar and suites for groups" },
      { name: "The Sands at Grace Bay", type: "hotel", pricePerNight: [300, 700], perRoom: true, maxGuests: 20, highlight: "Family-and-group friendly suites right on Grace Bay with three pools" },
      { name: "Grace Bay Private Villa (Airbnb)", type: "airbnb", pricePerNight: [600, 2500], perRoom: false, maxGuests: 16, highlight: "Beachfront villa with pool, chef option, and golf-cart access" },
    ],
    transport: [
      { name: "PLS Airport Transfer / Taxi", type: "shuttle", priceRange: "$25-50 per group each way", highlight: "Short fixed-rate taxi to Grace Bay; pre-book a van for groups" },
      { name: "Rental Car / Private Driver", type: "charter", priceRange: "$60-120 per day", highlight: "No rideshare on Provo — rent a car or hire a driver for nights out" },
    ],
    presentation: {
      moh: { tagline: "The world's best beach, sunset catamarans, and oceanfront spas", description: "Turks & Caicos for brides is pure: Grace Bay all day, a Coco Bistro dinner under the palms, a sunset catamaran, and a spa morning. Quiet luxury, zero chaos." },
      bestman: { tagline: "Grace Bay, conch-diving cruises, and private-cay charters", description: "Provo is the upscale chill trip: the world's best beach, a snorkel-and-conch-dive cruise, a private charter to deserted cays, and Danny Buoy's at night. Rent a car." },
    },
  },

  { id: "bermuda-bm", city: "Bermuda", state: "Bermuda", region: "international",
    nearestAirport: { code: "BDA", name: "L.F. Wade International Airport", driveMinutes: 30 },
    bestMonths: [5,6,7,8,9,10], vibes: ["chill","balanced"], score: 7,
    nightlife: [
      { name: "The Swizzle Inn", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Bermuda's oldest pub (1932) and the birthplace of the Rum Swizzle", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Hamilton Front Street Bars", type: "bar", vibe: "balanced", priceRange: "$$$", highlight: "Strip of Front Street pubs and balconies with DJs and Dark 'n' Stormys on weekends", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "The Docksider Pub", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Front Street pub with 20 HD screens — the go-to for the game and a pint", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Astwood Arms", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Victorian-themed Front Street pub for Guinness and classic pub fare", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Mickey's Beach Bistro & Bar", type: "cocktail-lounge", vibe: "chill", priceRange: "$$$", highlight: "Elbow Beach toes-in-the-sand cocktail spot for a sunset start", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["moh"] },
    ],
    dining: [
      { name: "Marcus' (Hamilton Princess)", cuisine: "Caribbean / American", priceRange: "$$$$", highlight: "Marcus Samuelsson's harborside restaurant for a polished group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Art Mel's Spicy Dicy", cuisine: "Bermudian / Fish", priceRange: "$$", highlight: "The island's legendary fish sandwich — a mandatory casual lunch", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "The Lobster Pot", cuisine: "Seafood", priceRange: "$$$", highlight: "Hamilton seafood institution for lobster and the local fish chowder", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Woody's Drive-In", cuisine: "Bermudian / Casual", priceRange: "$$", highlight: "West-end local spot for fish sandwiches and rum swizzles by the water", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Blu Bar & Grill", cuisine: "Italian / Steakhouse", priceRange: "$$$$", highlight: "Hilltop dining with sweeping South Shore views for a special dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Horseshoe Bay Pink-Sand Beach Day", type: "beach", duration: "Full day", pricePerPerson: [0, 40], groupMin: 2, groupMax: 30, highlight: "Bermuda's iconic pink-sand cove with coves to snorkel and rocks to climb", bestFor: "The Bermuda postcard", brands: ["both"] },
      { name: "Crystal & Fantasy Caves Tour", type: "tour", duration: "2 hours", pricePerPerson: [25, 45], groupMin: 2, groupMax: 20, highlight: "Walk floating pontoons over underground crystal-clear cave lakes", bestFor: "Unique group activity", brands: ["both"] },
      { name: "Catamaran Snorkel & Shipwreck Cruise", type: "boat-cruise", duration: "Half day", pricePerPerson: [80, 140], groupMin: 6, groupMax: 30, highlight: "Boat to reefs and 17th-century shipwrecks with snorkel gear and drinks", bestFor: "Day on the water", brands: ["both"] },
      { name: "Two-Person Scooter / Twizy Tour", type: "tour", duration: "Half day", pricePerPerson: [50, 110], groupMin: 2, groupMax: 16, highlight: "Rent scooters or electric Twizys to ride the South Shore (no rental cars on island)", bestFor: "Exploring at your own pace", brands: ["both"] },
      { name: "Deep-Sea Fishing Charter", type: "fishing", duration: "Half day", pricePerPerson: [200, 400], groupMin: 4, groupMax: 8, highlight: "Charter for wahoo, tuna, and marlin in famous Bermuda blue water", bestFor: "Crews chasing a catch", brands: ["bestman"] },
      { name: "Spa at Hamilton Princess / Rosewood", type: "spa", duration: "Half day", pricePerPerson: [150, 350], groupMin: 2, groupMax: 8, highlight: "Harborfront or oceanside treatment rooms for a recovery morning", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hamilton Princess & Beach Club", type: "hotel", pricePerNight: [350, 800], perRoom: true, maxGuests: 16, highlight: "Pink harborfront landmark with Marcus', a marina, and a beach-club shuttle" },
      { name: "The Loren at Pink Beach", type: "boutique-hotel", pricePerNight: [500, 1200], perRoom: true, maxGuests: 12, highlight: "Modern oceanfront boutique on the South Shore for a stylish small group" },
      { name: "South Shore Private Cottage (Airbnb)", type: "airbnb", pricePerNight: [300, 1000], perRoom: false, maxGuests: 10, highlight: "Pastel Bermuda cottage near a pink-sand cove with a scooter-friendly base" },
    ],
    transport: [
      { name: "BDA Airport Transfer / Taxi", type: "shuttle", priceRange: "$30-60 per group each way", highlight: "Taxis or pre-booked vans from the airport; no rideshare and no rental cars" },
      { name: "Twizy / Scooter Rental + Ferry/Bus", type: "charter", priceRange: "$50-110 per day", highlight: "Get around by electric Twizy, scooter, and the pink ferry and bus network" },
    ],
    presentation: {
      moh: { tagline: "Pink-sand beaches, crystal caves, and pastel-cottage charm", description: "Bermuda for brides is Horseshoe Bay pink sand, a crystal-cave float, scooters along the South Shore, and a harborfront dinner at Marcus' — preppy, pretty, and a short flight from the East Coast." },
      bestman: { tagline: "Rum Swizzles, deep-sea fishing, and South Shore scooter runs", description: "Bermuda is the easy preppy trip: the Swizzle Inn, Front Street pubs, deep-sea fishing in legendary blue water, and scooters to pink-sand beaches. No rental cars — ride Twizys." },
    },
  },

  { id: "tamarindo-cr", city: "Tamarindo", state: "Costa Rica", region: "international",
    nearestAirport: { code: "LIR", name: "Daniel Oduber Quirós International Airport (Liberia)", driveMinutes: 75 },
    bestMonths: [12,1,2,3,4], vibes: ["chill","balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Sharky's Sports Bar", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "The heart of Tamarindo nightlife — no cover, Sunday beer-pong tournaments, big crowd", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Pacifico Bar", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "The classic Tamarindo club — Wednesday ladies' night and 'Wild Nights' on Saturdays", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "El Vaquero Brewpub", type: "brewery-tour", vibe: "balanced", priceRange: "$$", highlight: "Beach-town brewpub with craft beer, live music, and a relaxed late vibe", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Crazy Monkey Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beachfront bar at Tamarindo Diria with sunset cocktails and live bands", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Bar 1 / Beach Lounge", type: "cocktail-lounge", vibe: "chill", priceRange: "$$$", highlight: "Sunset cocktail lounge on the sand for a slower start to the night", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["moh"] },
    ],
    dining: [
      { name: "Patagonia Argentinian Grill", cuisine: "Argentine / Steakhouse", priceRange: "$$$", highlight: "Wood-fired steaks and chimichurri — the group steak-night spot", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "El Mercadito", cuisine: "Food Hall / Street Food", priceRange: "$$", highlight: "Open-air food-hall garden with taco, poke, and pizza stalls and a bar", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Green Papaya Taco Bar", cuisine: "Tacos / Mexican", priceRange: "$$", highlight: "Beachy taco-and-margarita spot beloved for fish tacos", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Nogui's", cuisine: "Seafood / Costa Rican", priceRange: "$$", highlight: "Beachfront Tamarindo institution for fresh fish and a famous pie", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Pangas Beach Club", cuisine: "Seafood Fine Dining", priceRange: "$$$$", highlight: "Estuary-side fine dining under the trees for a special dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Beginner Surf Lesson at Main Break", type: "tour", duration: "2 hours", pricePerPerson: [45, 75], groupMin: 2, groupMax: 12, highlight: "Two-hour lesson on Tamarindo's mellow beginner waves with board and rashguard", bestFor: "Everyone gets to their feet", brands: ["both"] },
      { name: "Marlin del Rey Sunset Catamaran", type: "sunset-cruise", duration: "4 hours", pricePerPerson: [80, 120], groupMin: 6, groupMax: 40, highlight: "Open-bar catamaran with a snorkel stop and a Pacific sunset", bestFor: "Party on the water", brands: ["both"] },
      { name: "Ziplining & ATV Combo (Diamante / Congo Trail)", type: "zip-lining", duration: "Half day", pricePerPerson: [80, 150], groupMin: 4, groupMax: 20, highlight: "Canopy ziplines plus an ATV jungle ride near the coast", bestFor: "Adrenaline morning", brands: ["bestman"] },
      { name: "Whitewater Rafting (Tenorio / Corobicí)", type: "rafting", duration: "Full day", pricePerPerson: [90, 150], groupMin: 4, groupMax: 16, highlight: "Class II-III river rafting through Guanacaste rainforest", bestFor: "Active adventure day", brands: ["both"] },
      { name: "Rio Perdido / Hot Springs Day", type: "hiking", duration: "Full day", pricePerPerson: [60, 130], groupMin: 4, groupMax: 16, highlight: "Volcanic hot-spring river canyon with hiking and natural pools", bestFor: "Chill recovery adventure", brands: ["both"] },
      { name: "Beachfront Yoga & Spa Morning", type: "spa", duration: "Half day", pricePerPerson: [60, 180], groupMin: 2, groupMax: 12, highlight: "Sunrise beach yoga and open-air massage to reset the crew", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Tamarindo Diria Beach Resort", type: "resort", pricePerNight: [180, 400], perRoom: true, maxGuests: 16, highlight: "Beachfront resort in the center of town, steps from Sharky's and the surf" },
      { name: "Wyndham Tamarindo", type: "hotel", pricePerNight: [150, 350], perRoom: true, maxGuests: 16, highlight: "Hilltop hotel with rooftop pool and ocean views above town" },
      { name: "Langosta / Tamarindo Private Villa (Airbnb)", type: "airbnb", pricePerNight: [300, 1200], perRoom: false, maxGuests: 16, highlight: "Jungle-edge villa with pool a short ride from the beach and bars" },
    ],
    transport: [
      { name: "LIR → Tamarindo Private Transfer", type: "shuttle", priceRange: "$90-160 per group each way", highlight: "Pre-book the 75-minute van from Liberia airport — no rideshare in town" },
      { name: "4x4 Rental / Local Driver", type: "charter", priceRange: "$60-120 per day", highlight: "A 4x4 helps for tour days; or hire a driver for the rafting/zipline runs" },
    ],
    presentation: {
      moh: { tagline: "Sunrise surf lessons, catamaran sunsets, and jungle hot springs", description: "Tamarindo for brides is a learn-to-surf morning, a Marlin del Rey sunset sail, beach yoga, and a hot-spring day — adventure with a beach-town heartbeat." },
      bestman: { tagline: "Surf breaks, zipline-and-ATV runs, and Sharky's till late", description: "Tamarindo is the surf-and-adventure trip: beginner surf at Main Break, ziplines and ATVs, whitewater rafting, a catamaran party, and Sharky's and Pacifico at night." },
    },
  },

  { id: "medellin-co", city: "Medellín", state: "Colombia", region: "international",
    nearestAirport: { code: "MDE", name: "José María Córdova International Airport (Rionegro)", driveMinutes: 45 },
    bestMonths: [1,2,3,4,5,6,7,8,9,10,11,12], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Vintrash", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Famous El Poblado club — two floors and a rooftop playing reggaeton and electro", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Parque Lleras", type: "bar", vibe: "unhinged", priceRange: "$$", highlight: "The Zona Rosa party heart — a plaza ringed by bars and clubs that erupts on weekends", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Provenza", type: "cocktail-lounge", vibe: "balanced", priceRange: "$$$", highlight: "Trendier streets just off Lleras with cocktail bars and rooftop lounges", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Salón Amador", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Respected house-and-techno club for crews who want a real DJ night", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"] },
      { name: "Envy Rooftop (The Charlee)", type: "rooftop", vibe: "balanced", priceRange: "$$$$", highlight: "Glass-walled rooftop pool-bar over El Poblado for sunset cocktails", reservationNeeded: true, groupFriendly: true, lateNight: false, brands: ["both"], dressCode: "Smart casual" },
    ],
    dining: [
      { name: "Carmen", cuisine: "Contemporary Colombian", priceRange: "$$$$", highlight: "Medellín's top tasting-menu restaurant for the splurge group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "El Cielo", cuisine: "Avant-Garde Tasting", priceRange: "$$$$", highlight: "Theatrical molecular tasting menu — a bucket-list dinner experience", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mondongo's", cuisine: "Traditional Colombian", priceRange: "$$", highlight: "Beloved local spot for a giant bandeja paisa — the classic group lunch", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Alambique", cuisine: "Colombian / Grill", priceRange: "$$$", highlight: "Provenza favorite for grilled plates and a buzzy after-dinner scene", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Hatoviejo", cuisine: "Antioquian", priceRange: "$$", highlight: "Hearty regional cooking to fuel up before a long night out", bestFor: "dinner", groupFriendly: true, brands: ["bestman"] },
    ],
    activities: [
      { name: "Guatapé & El Peñol Day Trip", type: "tour", duration: "Full day", pricePerPerson: [50, 110], groupMin: 4, groupMax: 20, highlight: "Climb the 740 steps up El Peñol then explore the colorful Guatapé town", bestFor: "The signature Medellín day", brands: ["both"] },
      { name: "Guatapé Lake Private Boat Party", type: "boat-cruise", duration: "Full day", pricePerPerson: [80, 200], groupMin: 6, groupMax: 20, highlight: "Private catamaran on the reservoir with DJ, open bar, and jaw-dropping views", bestFor: "Over-the-top group day", brands: ["bestman"] },
      { name: "Comuna 13 Graffiti & Escalators Tour", type: "walking-tour", duration: "Half day", pricePerPerson: [25, 60], groupMin: 4, groupMax: 20, highlight: "Walking tour of the transformed hillside neighborhood with street art and music", bestFor: "Culture morning", brands: ["both"] },
      { name: "Coffee Farm (Finca) Tour", type: "farm-tour", duration: "Half day", pricePerPerson: [40, 90], groupMin: 4, groupMax: 16, highlight: "Tour a working coffee finca outside the city with a tasting", bestFor: "Easy half-day with the crew", brands: ["both"] },
      { name: "Paragliding over the Aburrá Valley", type: "adventure-park", duration: "2 hours", pricePerPerson: [60, 120], groupMin: 2, groupMax: 12, highlight: "Tandem paraglide off the mountains above Medellín", bestFor: "Adrenaline morning", brands: ["bestman"] },
      { name: "Day Spa in El Poblado", type: "spa", duration: "Half day", pricePerPerson: [60, 180], groupMin: 2, groupMax: 8, highlight: "Affordable luxe spa morning to recover from Parque Lleras", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "The Charlee Hotel", type: "boutique-hotel", pricePerNight: [180, 400], perRoom: true, maxGuests: 16, highlight: "Design hotel in the middle of El Poblado with the Envy rooftop pool-bar" },
      { name: "Marquee Medellín / Click Clack", type: "hotel", pricePerNight: [150, 350], perRoom: true, maxGuests: 16, highlight: "Stylish Provenza-area hotels walkable to the nightlife" },
      { name: "El Poblado Penthouse (Airbnb)", type: "airbnb", pricePerNight: [200, 800], perRoom: false, maxGuests: 12, highlight: "Modern penthouse with terrace steps from Parque Lleras — go-to for crews" },
    ],
    transport: [
      { name: "MDE → El Poblado Private Transfer", type: "shuttle", priceRange: "$30-60 per group each way", highlight: "Pre-book the 45-minute ride from Rionegro airport down to the city" },
      { name: "Uber / Cabify Medellín", type: "rideshare", priceRange: "$3-15 per ride", highlight: "Rideshare works across the city and is the safe, cheap way to get around at night" },
    ],
    presentation: {
      moh: { tagline: "Guatapé lake views, rooftop pools, and world-class tasting menus", description: "Medellín for brides is the eternal-spring city: El Peñol and Guatapé, a Comuna 13 art tour, a coffee-farm morning, rooftop pool-bars, and dinner at Carmen — incredible value." },
      bestman: { tagline: "Parque Lleras nights, Guatapé boat parties, and paragliding mornings", description: "Medellín is a bachelor-trip heavyweight: Parque Lleras and Provenza nightlife, a Guatapé lake boat party, paragliding, and Comuna 13 by day. Springlike year-round and a steal." },
    },
  },

  { id: "panama-city-pa", city: "Panama City", state: "Panama", region: "international",
    nearestAirport: { code: "PTY", name: "Tocumen International Airport", driveMinutes: 35 },
    bestMonths: [1,2,3,4,12], vibes: ["balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Tántalo Rooftop", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "The Casco Viejo rooftop that sparked Panama's modern party scene — DJs and city views", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Smart casual" },
      { name: "Sama Sky Lounge", type: "rooftop", vibe: "balanced", priceRange: "$$$$", highlight: "Casco Viejo's most panoramic rooftop, perfect for golden hour cocktails", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Smart casual" },
      { name: "Casa Casco", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Multi-level Casco Viejo nightlife complex with bars and a rooftop dance floor", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "La Rana Dorada (Casco Viejo)", type: "brewery-tour", vibe: "chill", priceRange: "$$", highlight: "Popular craft brewpub for a relaxed start before the rooftops", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Bling Strip Clubs Zone (Calle Uruguay)", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Calle Uruguay's cluster of modern clubs for a high-energy late night", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["bestman"], dressCode: "Upscale nightlife attire" },
    ],
    dining: [
      { name: "Donde José", cuisine: "Panamanian Tasting", priceRange: "$$$$", highlight: "Tiny, coveted tasting-menu restaurant celebrating Panamanian ingredients", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Fonda Lo Que Hay", cuisine: "Panamanian / Contemporary", priceRange: "$$$", highlight: "Casco Viejo fonda turning local street food into a buzzy sit-down feast", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Mercado de Mariscos", cuisine: "Seafood / Ceviche", priceRange: "$", highlight: "The fish market's upstairs eatery — cheap ceviche and fresh catch", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "Tántalo Kitchen", cuisine: "International / Tapas", priceRange: "$$$", highlight: "Ground-floor restaurant under the famous rooftop for an easy group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Maito", cuisine: "Panamanian Fusion", priceRange: "$$$$", highlight: "One of Latin America's top restaurants for a special celebratory dinner", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Panama Canal & Miraflores Locks Tour", type: "tour", duration: "Half day", pricePerPerson: [30, 80], groupMin: 4, groupMax: 30, highlight: "Watch giant ships transit the locks from the visitor-center observation deck", bestFor: "The must-do Panama sight", brands: ["both"] },
      { name: "San Blas Islands Day Trip", type: "boat-cruise", duration: "Full day", pricePerPerson: [120, 250], groupMin: 4, groupMax: 16, highlight: "Boat to the Guna Yala archipelago of white-sand cays and clear water", bestFor: "Bucket-list island day", brands: ["both"] },
      { name: "Casco Viejo Food & Rum Walking Tour", type: "food-tour", duration: "3 hours", pricePerPerson: [50, 100], groupMin: 4, groupMax: 16, highlight: "Walk the old town tasting ceviche, empanadas, and Panamanian rum", bestFor: "Easy group afternoon", brands: ["both"] },
      { name: "Gatún Lake Boat & Monkey Island Tour", type: "boat-cruise", duration: "Half day", pricePerPerson: [60, 130], groupMin: 4, groupMax: 16, highlight: "Boat the canal's lake to spot howler and capuchin monkeys on jungle islands", bestFor: "Nature adventure morning", brands: ["both"] },
      { name: "Deep-Sea Fishing Charter (Pacific)", type: "fishing", duration: "Half day", pricePerPerson: [150, 350], groupMin: 4, groupMax: 8, highlight: "Charter out of the Pacific coast for tuna, dorado, and sailfish", bestFor: "Crews chasing a catch", brands: ["bestman"] },
      { name: "Casco Viejo Spa Day", type: "spa", duration: "Half day", pricePerPerson: [80, 200], groupMin: 2, groupMax: 8, highlight: "Boutique-hotel spa morning to recover from the rooftops", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "American Trade Hotel", type: "boutique-hotel", pricePerNight: [200, 450], perRoom: true, maxGuests: 16, highlight: "Restored landmark in the heart of Casco Viejo, steps from the rooftops" },
      { name: "Sortis Hotel, Spa & Casino", type: "hotel", pricePerNight: [180, 400], perRoom: true, maxGuests: 20, highlight: "Modern banking-district hotel with a casino, rooftop pool, and spa" },
      { name: "Casco Viejo Penthouse (Airbnb)", type: "airbnb", pricePerNight: [200, 800], perRoom: false, maxGuests: 12, highlight: "Old-town penthouse with terrace and skyline views, walkable to nightlife" },
    ],
    transport: [
      { name: "PTY → Casco Viejo Private Transfer", type: "shuttle", priceRange: "$30-50 per group each way", highlight: "Pre-book a van from Tocumen — 35 minutes to the old town" },
      { name: "Uber Panama City", type: "rideshare", priceRange: "$3-15 per ride", highlight: "Uber works well across the city and to the canal — cheap and easy at night" },
    ],
    presentation: {
      moh: { tagline: "San Blas island cays, Casco Viejo rooftops, and a world-class food scene", description: "Panama City for brides is a San Blas island day, a Casco Viejo food-and-rum walk, sunset on the Tántalo rooftop, and dinner at Maito — old-town charm meets a skyline." },
      bestman: { tagline: "Casco Viejo rooftops, the Canal, and San Blas island runs", description: "Panama City is the underrated bachelor pick: Casco Viejo rooftops and Calle Uruguay clubs, the Canal locks, a San Blas island day, and Pacific sportfishing. Short flight, easy Uber." },
    },
  },

  { id: "ambergris-caye-bz", city: "Ambergris Caye", state: "Belize", region: "international",
    nearestAirport: { code: "SPR", name: "San Pedro Airport (puddle-jump from Belize City BZE)", driveMinutes: 10 },
    bestMonths: [11,12,1,2,3,4,5], vibes: ["chill","balanced","unhinged"], score: 7,
    nightlife: [
      { name: "Palapa Bar & Grill", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Iconic over-the-water bar north of town with inner tubes to float and live music", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Wayo's Beachside Beernet", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beachfront sports-and-music bar with live bands several nights a week", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Secret Beach Bars (Blue Bayou, etc.)", type: "pool-party", vibe: "unhinged", priceRange: "$$", highlight: "Cluster of in-water beach-club bars with swim-up tables and DJ days", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Sandy Toes Bar & Grill", type: "bar", vibe: "chill", priceRange: "$$", highlight: "Easygoing beach bar in town with cold Belikins and a friendly crowd", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["both"] },
      { name: "Crazy Canucks Beach Bar", type: "bar", vibe: "balanced", priceRange: "$$", highlight: "Beachfront bar with bonfires, live music, and a Sunday-funday scene", reservationNeeded: false, groupFriendly: true, lateNight: false, brands: ["bestman"] },
    ],
    dining: [
      { name: "Elvi's Kitchen", cuisine: "Belizean / Seafood", priceRange: "$$", highlight: "San Pedro institution under a flamboyant tree for whole fish and rice-and-beans", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Hidden Treasure", cuisine: "Caribbean Fine Dining", priceRange: "$$$$", highlight: "Garden fine-dining tucked off the main road for a special group dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Estel's Dine by the Sea", cuisine: "Breakfast / Belizean", priceRange: "$", highlight: "Toes-in-the-sand breakfast spot famous for fry jacks", bestFor: "brunch", groupFriendly: true, brands: ["both"] },
      { name: "Wild Mango's", cuisine: "Caribbean Fusion", priceRange: "$$$", highlight: "Beachfront favorite for ceviche and 'New Wave' Belizean plates", bestFor: "dinner", groupFriendly: true, brands: ["both"] },
      { name: "Lily's Treasure Chest", cuisine: "Seafood", priceRange: "$$", highlight: "Family-run spot for the freshest grilled lobster and conch in season", bestFor: "lunch", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Hol Chan & Shark Ray Alley Snorkel", type: "snorkeling", duration: "Half day", pricePerPerson: [50, 90], groupMin: 4, groupMax: 16, highlight: "Snorkel the marine reserve and swim with nurse sharks and rays", bestFor: "The signature Belize day", brands: ["both"] },
      { name: "Great Blue Hole Flight & Snorkel", type: "boat-cruise", duration: "Full day", pricePerPerson: [250, 500], groupMin: 4, groupMax: 12, highlight: "Boat or flight to the world-famous sinkhole with reef snorkel stops", bestFor: "Bucket-list splurge day", brands: ["both"] },
      { name: "Secret Beach Golf-Cart Day", type: "beach", duration: "Full day", pricePerPerson: [30, 80], groupMin: 4, groupMax: 16, highlight: "Cruise carts 45 minutes north to the in-water bars and swim-up tables", bestFor: "Group beach-bar crawl", brands: ["both"] },
      { name: "Sunset Catamaran & Rum Cruise", type: "sunset-cruise", duration: "3 hours", pricePerPerson: [60, 110], groupMin: 6, groupMax: 30, highlight: "Open-bar catamaran along the reef at golden hour", bestFor: "Day-drinking on the water", brands: ["both"] },
      { name: "Reef Fishing / Fly-Fishing Charter", type: "fishing", duration: "Half day", pricePerPerson: [150, 350], groupMin: 2, groupMax: 8, highlight: "Charter the flats and reef for tarpon, bonefish, snapper, and grouper", bestFor: "Anglers in the crew", brands: ["bestman"] },
      { name: "Beachfront Spa & Yoga Morning", type: "spa", duration: "Half day", pricePerPerson: [80, 200], groupMin: 2, groupMax: 10, highlight: "Open-air massage and beach yoga at a resort spa to recover", bestFor: "recovery day", brands: ["moh"] },
    ],
    lodging: [
      { name: "Las Terrazas Resort & Residences", type: "resort", pricePerNight: [300, 600], perRoom: true, maxGuests: 16, highlight: "Beachfront suites north of town with a pool, dock, and easy snorkel access" },
      { name: "Mahogany Bay Resort (Curio by Hilton)", type: "resort", pricePerNight: [200, 450], perRoom: true, maxGuests: 20, highlight: "Village-style resort with a beach club, pool, and golf-cart life" },
      { name: "Ambergris Beachfront Villa (Airbnb)", type: "airbnb", pricePerNight: [300, 1000], perRoom: false, maxGuests: 14, highlight: "Private villa with pool and dock, golf cart included for island runs" },
    ],
    transport: [
      { name: "BZE → San Pedro Puddle-Jump / Water Taxi", type: "charter", priceRange: "$40-100 per person each way", highlight: "Short Tropic/Maya Air flight or a fast water taxi from Belize City to the island" },
      { name: "Golf-Cart Rental", type: "charter", priceRange: "$50-90 per day", highlight: "Golf carts are the island's main transport — rent one per few people" },
    ],
    presentation: {
      moh: { tagline: "Golf carts, Secret Beach swings, and swim-with-the-sharks snorkels", description: "Ambergris Caye for brides is the barefoot one: golf carts to Secret Beach swim-up bars, a Hol Chan ray snorkel, a sunset rum cruise, and fry jacks at Estel's. English-speaking and easy." },
      bestman: { tagline: "Hol Chan sharks, the Blue Hole, and over-the-water bars", description: "Ambergris Caye is the laid-back adventure trip: snorkel sharks at Hol Chan, hit the Blue Hole, golf-cart to Secret Beach bars, and float at the Palapa Bar. Belize speaks English and runs on golf carts." },
    },
  },

  { id: "mexico-city-mx", city: "Mexico City", state: "Mexico", region: "international",
    nearestAirport: { code: "MEX", name: "Mexico City International Airport (Benito Juárez)", driveMinutes: 40 },
    bestMonths: [3,4,5,10,11], vibes: ["balanced","unhinged"], score: 8,
    nightlife: [
      { name: "Madre Café Rooftop (Roma)", type: "rooftop", vibe: "balanced", priceRange: "$$$", highlight: "Mansion rooftop in Roma Norte with terraces, cocktails, and a stylish crowd", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"], dressCode: "Smart casual" },
      { name: "Patrick Miller", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Legendary Friday-night dance party with hi-NRG and dance-circle battles", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Departamento (Condesa)", type: "club", vibe: "unhinged", priceRange: "$$$", highlight: "Apartment-style rooftop club in Condesa with house DJs and a young crowd", reservationNeeded: true, groupFriendly: true, lateNight: true, brands: ["both"] },
      { name: "Hanky Panky", type: "cocktail-lounge", vibe: "balanced", priceRange: "$$$$", highlight: "World-ranked hidden speakeasy — reserve ahead for the password", reservationNeeded: true, groupFriendly: false, lateNight: true, brands: ["moh"] },
      { name: "Mama Rumba (Roma)", type: "club", vibe: "unhinged", priceRange: "$$", highlight: "Live salsa club where the whole room dances — a CDMX rite of passage", reservationNeeded: false, groupFriendly: true, lateNight: true, brands: ["bestman"] },
    ],
    dining: [
      { name: "Pujol", cuisine: "Contemporary Mexican Tasting", priceRange: "$$$$", highlight: "Enrique Olvera's world-famous tasting menu — book weeks ahead", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Contramar", cuisine: "Seafood", priceRange: "$$$", highlight: "The legendary long-lunch spot for tuna tostadas and the signature pescado", bestFor: "lunch", groupFriendly: true, brands: ["both"] },
      { name: "El Califa de León / Taquería El Califa", cuisine: "Tacos", priceRange: "$", highlight: "Iconic late-night taco stops — the classic post-club move", bestFor: "late-night", groupFriendly: true, brands: ["both"] },
      { name: "Maximo Bistrot", cuisine: "Contemporary / Bistro", priceRange: "$$$$", highlight: "Roma market-driven bistro for a polished celebratory dinner", bestFor: "group-dinner", groupFriendly: true, brands: ["both"] },
      { name: "Rosetta", cuisine: "Italian-Mexican", priceRange: "$$$$", highlight: "Romantic Roma mansion restaurant — its bakery next door is a morning must", bestFor: "dinner", groupFriendly: true, brands: ["moh"] },
    ],
    activities: [
      { name: "Xochimilco Trajinera Boat Party", type: "boat-cruise", duration: "Half day", pricePerPerson: [30, 90], groupMin: 6, groupMax: 25, highlight: "Rent a colorful canal boat with mariachi, michelada vendors, and your own crew", bestFor: "The quintessential CDMX group day", brands: ["both"] },
      { name: "Lucha Libre Night at Arena México", type: "sports-event", duration: "3 hours", pricePerPerson: [20, 60], groupMin: 4, groupMax: 30, highlight: "Friday-night masked wrestling spectacle — loud, theatrical, and a blast", bestFor: "Bachelor crew night out", brands: ["bestman"] },
      { name: "Teotihuacán Pyramids & Hot-Air Balloon", type: "scenic-overlook", duration: "Full day", pricePerPerson: [120, 280], groupMin: 2, groupMax: 16, highlight: "Sunrise balloon ride over the ancient pyramids north of the city", bestFor: "Bucket-list morning", brands: ["both"] },
      { name: "Roma-Condesa Food & Mezcal Tour", type: "food-tour", duration: "4 hours", pricePerPerson: [60, 120], groupMin: 4, groupMax: 16, highlight: "Walk the trendy neighborhoods tasting tacos, mezcal, and street eats", bestFor: "Easy group afternoon", brands: ["both"] },
      { name: "Mezcalería Crawl & Tasting", type: "distillery-tour", duration: "3 hours", pricePerPerson: [40, 90], groupMin: 4, groupMax: 16, highlight: "Guided crawl through the city's best mezcal bars with a spirits expert", bestFor: "Pre-dinner warm-up", brands: ["both"] },
      { name: "Centro Histórico Walking & Frida Tour", type: "walking-tour", duration: "Half day", pricePerPerson: [25, 70], groupMin: 4, groupMax: 20, highlight: "Zócalo, murals, and a stop at Coyoacán's Frida Kahlo Casa Azul", bestFor: "Culture morning", brands: ["moh"] },
    ],
    lodging: [
      { name: "Hotel Carlota (Cuauhtémoc)", type: "boutique-hotel", pricePerNight: [180, 400], perRoom: true, maxGuests: 16, highlight: "Design hotel with a glass pool courtyard, central to Roma and Reforma" },
      { name: "Andaz Mexico City Condesa", type: "hotel", pricePerNight: [250, 500], perRoom: true, maxGuests: 20, highlight: "Stylish hotel in the heart of Condesa nightlife with a rooftop bar" },
      { name: "Roma Norte Penthouse (Airbnb)", type: "airbnb", pricePerNight: [150, 600], perRoom: false, maxGuests: 12, highlight: "Art-deco apartment in Roma walkable to bars, cafés, and restaurants" },
    ],
    transport: [
      { name: "MEX → Roma/Condesa Private Transfer", type: "shuttle", priceRange: "$20-40 per group each way", highlight: "Pre-book a van from the airport into the central neighborhoods" },
      { name: "Uber / DiDi Mexico City", type: "rideshare", priceRange: "$3-12 per ride", highlight: "Rideshare is abundant, cheap, and the easy way to move around at night" },
    ],
    presentation: {
      moh: { tagline: "Xochimilco boat parties, rooftop cocktails, and world-class tasting menus", description: "CDMX for brides is the foodie-and-culture trip: a Xochimilco canal-boat day, Roma rooftops, a Casa Azul stop, and dinner at Pujol or Rosetta — endless and electric." },
      bestman: { tagline: "Lucha libre nights, Xochimilco boats, and a mezcal-soaked nightlife", description: "Mexico City is the big-city bachelor pick: a Xochimilco boat party, Friday-night lucha libre at Arena México, mezcal crawls, salsa at Mama Rumba, and Teotihuacán by balloon." },
    },
  },
];
