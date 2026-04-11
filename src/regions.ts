/**
 * US regions and state→region mapping.
 *
 * Region groupings cribbed from TDF (the most opinionated of the projects).
 * Other projects can use these as-is or define their own region scheme.
 */

export type UsRegion =
  | "Northeast"
  | "Southeast"
  | "Midwest"
  | "South Central"
  | "Mountain West"
  | "Southwest"
  | "Pacific NW"
  | "West Coast"
  | "Other";

export const REGIONS: UsRegion[] = [
  "Northeast",
  "Southeast",
  "Midwest",
  "South Central",
  "Mountain West",
  "Southwest",
  "Pacific NW",
  "West Coast",
];

export const REGION_SLUGS: Record<UsRegion, string> = {
  "Northeast": "northeast",
  "Southeast": "southeast",
  "Midwest": "midwest",
  "South Central": "south-central",
  "Mountain West": "mountain-west",
  "Southwest": "southwest",
  "Pacific NW": "pacific-nw",
  "West Coast": "west-coast",
  "Other": "other",
};

export const REGION_LABELS: Record<string, UsRegion> = Object.fromEntries(
  Object.entries(REGION_SLUGS).map(([label, slug]) => [slug, label as UsRegion]),
);

/** State code → region. */
export const STATE_TO_REGION: Record<string, UsRegion> = {
  // Northeast
  CT: "Northeast", ME: "Northeast", MA: "Northeast", NH: "Northeast",
  NJ: "Northeast", NY: "Northeast", PA: "Northeast", RI: "Northeast", VT: "Northeast",
  MD: "Northeast", DE: "Northeast", DC: "Northeast",
  // Southeast
  AL: "Southeast", FL: "Southeast", GA: "Southeast", KY: "Southeast", MS: "Southeast",
  NC: "Southeast", SC: "Southeast", TN: "Southeast", VA: "Southeast", WV: "Southeast",
  // Midwest
  IL: "Midwest", IN: "Midwest", IA: "Midwest", MI: "Midwest", MN: "Midwest",
  MO: "Midwest", OH: "Midwest", WI: "Midwest", KS: "Midwest", NE: "Midwest", ND: "Midwest", SD: "Midwest",
  // South Central
  AR: "South Central", LA: "South Central", OK: "South Central", TX: "South Central",
  // Mountain West
  CO: "Mountain West", ID: "Mountain West", MT: "Mountain West", WY: "Mountain West",
  UT: "Mountain West",
  // Southwest
  AZ: "Southwest", NV: "Southwest", NM: "Southwest",
  // Pacific NW
  OR: "Pacific NW", WA: "Pacific NW",
  // West Coast
  CA: "West Coast", HI: "West Coast", AK: "West Coast",
};

export function regionForState(stateCode: string): UsRegion {
  return STATE_TO_REGION[stateCode.toUpperCase()] || "Other";
}

export function regionSlug(region: UsRegion): string {
  return REGION_SLUGS[region] || "other";
}
