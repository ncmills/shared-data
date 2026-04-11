/**
 * Major US airport directory.
 *
 * Curated list of the busiest US commercial airports — useful for
 * trip-planning sites that need quick lookups by IATA code, city,
 * or state. Not exhaustive (only ~50 hubs); extend per project needs.
 */

export interface Airport {
  code: string;        // IATA code (e.g. "PHX")
  name: string;        // Full name
  city: string;        // City name
  state: string;       // 2-letter state code
}

export const AIRPORTS: Record<string, Airport> = {
  ATL: { code: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", state: "GA" },
  AUS: { code: "AUS", name: "Austin-Bergstrom International", city: "Austin", state: "TX" },
  BNA: { code: "BNA", name: "Nashville International", city: "Nashville", state: "TN" },
  BOI: { code: "BOI", name: "Boise Airport", city: "Boise", state: "ID" },
  BOS: { code: "BOS", name: "Boston Logan International", city: "Boston", state: "MA" },
  BWI: { code: "BWI", name: "Baltimore/Washington International", city: "Baltimore", state: "MD" },
  BZN: { code: "BZN", name: "Bozeman Yellowstone International", city: "Bozeman", state: "MT" },
  CHS: { code: "CHS", name: "Charleston International", city: "Charleston", state: "SC" },
  CLT: { code: "CLT", name: "Charlotte Douglas International", city: "Charlotte", state: "NC" },
  COS: { code: "COS", name: "Colorado Springs Airport", city: "Colorado Springs", state: "CO" },
  DAL: { code: "DAL", name: "Dallas Love Field", city: "Dallas", state: "TX" },
  DCA: { code: "DCA", name: "Ronald Reagan Washington National", city: "Arlington", state: "VA" },
  DEN: { code: "DEN", name: "Denver International", city: "Denver", state: "CO" },
  DFW: { code: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", state: "TX" },
  DTW: { code: "DTW", name: "Detroit Metropolitan Wayne County", city: "Detroit", state: "MI" },
  EUG: { code: "EUG", name: "Eugene Airport", city: "Eugene", state: "OR" },
  EWR: { code: "EWR", name: "Newark Liberty International", city: "Newark", state: "NJ" },
  FLL: { code: "FLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale", state: "FL" },
  GEG: { code: "GEG", name: "Spokane International", city: "Spokane", state: "WA" },
  HNL: { code: "HNL", name: "Daniel K. Inouye International", city: "Honolulu", state: "HI" },
  IAD: { code: "IAD", name: "Washington Dulles International", city: "Dulles", state: "VA" },
  IAH: { code: "IAH", name: "George Bush Intercontinental", city: "Houston", state: "TX" },
  JAC: { code: "JAC", name: "Jackson Hole Airport", city: "Jackson", state: "WY" },
  JFK: { code: "JFK", name: "John F. Kennedy International", city: "New York", state: "NY" },
  LAS: { code: "LAS", name: "Harry Reid International", city: "Las Vegas", state: "NV" },
  LAX: { code: "LAX", name: "Los Angeles International", city: "Los Angeles", state: "CA" },
  LGA: { code: "LGA", name: "LaGuardia Airport", city: "New York", state: "NY" },
  LGB: { code: "LGB", name: "Long Beach Airport", city: "Long Beach", state: "CA" },
  MCO: { code: "MCO", name: "Orlando International", city: "Orlando", state: "FL" },
  MDW: { code: "MDW", name: "Chicago Midway International", city: "Chicago", state: "IL" },
  MEM: { code: "MEM", name: "Memphis International", city: "Memphis", state: "TN" },
  MIA: { code: "MIA", name: "Miami International", city: "Miami", state: "FL" },
  MKE: { code: "MKE", name: "Milwaukee Mitchell International", city: "Milwaukee", state: "WI" },
  MSO: { code: "MSO", name: "Missoula Montana Airport", city: "Missoula", state: "MT" },
  MSP: { code: "MSP", name: "Minneapolis-St. Paul International", city: "Minneapolis", state: "MN" },
  MSY: { code: "MSY", name: "Louis Armstrong New Orleans International", city: "New Orleans", state: "LA" },
  OAK: { code: "OAK", name: "Oakland International", city: "Oakland", state: "CA" },
  OKC: { code: "OKC", name: "Will Rogers World Airport", city: "Oklahoma City", state: "OK" },
  OMA: { code: "OMA", name: "Eppley Airfield", city: "Omaha", state: "NE" },
  ORD: { code: "ORD", name: "O'Hare International", city: "Chicago", state: "IL" },
  PDX: { code: "PDX", name: "Portland International", city: "Portland", state: "OR" },
  PHL: { code: "PHL", name: "Philadelphia International", city: "Philadelphia", state: "PA" },
  PHX: { code: "PHX", name: "Phoenix Sky Harbor International", city: "Phoenix", state: "AZ" },
  PIT: { code: "PIT", name: "Pittsburgh International", city: "Pittsburgh", state: "PA" },
  PSP: { code: "PSP", name: "Palm Springs International", city: "Palm Springs", state: "CA" },
  RDU: { code: "RDU", name: "Raleigh-Durham International", city: "Raleigh", state: "NC" },
  RNO: { code: "RNO", name: "Reno-Tahoe International", city: "Reno", state: "NV" },
  SAN: { code: "SAN", name: "San Diego International", city: "San Diego", state: "CA" },
  SAT: { code: "SAT", name: "San Antonio International", city: "San Antonio", state: "TX" },
  SAV: { code: "SAV", name: "Savannah/Hilton Head International", city: "Savannah", state: "GA" },
  SDF: { code: "SDF", name: "Louisville Muhammad Ali International", city: "Louisville", state: "KY" },
  SEA: { code: "SEA", name: "Seattle-Tacoma International", city: "Seattle", state: "WA" },
  SFO: { code: "SFO", name: "San Francisco International", city: "San Francisco", state: "CA" },
  SJC: { code: "SJC", name: "Norman Y. Mineta San José International", city: "San Jose", state: "CA" },
  SLC: { code: "SLC", name: "Salt Lake City International", city: "Salt Lake City", state: "UT" },
  SMF: { code: "SMF", name: "Sacramento International", city: "Sacramento", state: "CA" },
  STL: { code: "STL", name: "St. Louis Lambert International", city: "St. Louis", state: "MO" },
  SUN: { code: "SUN", name: "Friedman Memorial Airport", city: "Sun Valley", state: "ID" },
  TPA: { code: "TPA", name: "Tampa International", city: "Tampa", state: "FL" },
  TUS: { code: "TUS", name: "Tucson International", city: "Tucson", state: "AZ" },
};

export function airportByCode(code: string): Airport | null {
  return AIRPORTS[code.toUpperCase()] || null;
}

export function airportsByState(state: string): Airport[] {
  return Object.values(AIRPORTS).filter((a) => a.state === state.toUpperCase());
}
