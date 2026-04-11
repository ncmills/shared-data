/**
 * US state codes ↔ names ↔ slugs.
 *
 * Single source of truth across all projects. Includes 50 states + DC.
 */

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/** Reverse lookup: name → code (case-insensitive). */
export const STATE_CODES: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code]),
);

export function stateName(code: string): string {
  return STATE_NAMES[code.toUpperCase()] || code;
}

export function stateCode(name: string): string {
  return STATE_CODES[name.toLowerCase()] || name;
}

export function stateSlug(code: string): string {
  const name = STATE_NAMES[code.toUpperCase()];
  return name ? name.toLowerCase().replace(/\s+/g, "-") : code.toLowerCase();
}

/** Slug → state code (e.g. "north-carolina" → "NC"). */
export function stateFromSlug(slug: string): string | null {
  const name = slug.replace(/-/g, " ");
  return STATE_CODES[name] || null;
}
