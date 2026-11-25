/**
 * Optional `retreat` facet on a SharedResidence: the facts a group retreat
 * (quiet, worship, dietary, lodging) needs to know about a place.
 *
 * Rules (honesty firewall):
 * - Every present field carries `source`, an https URL to the venue's own page
 *   (or another primary source) that states the fact.
 * - All fields are optional. ABSENT MEANS UNKNOWN, never false: a missing
 *   `alcoholFree` says nothing about the bar.
 * - `traditionsHosted` is free text copied from the venue's own page. This
 *   facet is a property of the PLACE; there is deliberately no tradition
 *   tag in the universe tags.
 *
 * Kept out of residences.ts so the ingest gate can import the vocab without
 * loading the residence data array.
 */

export const RETREAT_WORSHIP_SPACES = [
  "none",
  "chapel",
  "multi-faith-room",
  "sanctuary",
  "other",
] as const;
export type RetreatWorshipSpace = (typeof RETREAT_WORSHIP_SPACES)[number];

export const RETREAT_DIETARY = [
  "kosher",
  "halal",
  "vegetarian",
  "alcohol-free-kitchen",
] as const;
export type RetreatDietary = (typeof RETREAT_DIETARY)[number];

export interface ResidenceRetreatFacet {
  worshipSpace?: { value: RetreatWorshipSpace; source: string };
  quietHours?: { value: boolean; text?: string; source: string };
  dietary?: { value: RetreatDietary[]; source: string };
  singleSexLodging?: { value: boolean; source: string };
  alcoholFree?: { value: boolean; source: string };
  /** Free text, copied verbatim from the venue's own page. Never empty. */
  traditionsHosted?: { value: string[]; source: string };
}

export const RETREAT_FACET_FIELDS = [
  "worshipSpace",
  "quietHours",
  "dietary",
  "singleSexLodging",
  "alcoholFree",
  "traditionsHosted",
] as const;

function isHttpsUrl(v: unknown): boolean {
  if (typeof v !== "string" || v.trim().length === 0) return false;
  try {
    return new URL(v.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Validate a candidate `retreat` facet. Returns reasons, each naming the
 * field (`retreat.<field>...`); an empty array means the facet is valid.
 */
export function validateRetreatFacet(facet: unknown): string[] {
  const reasons: string[] = [];
  if (typeof facet !== "object" || facet === null || Array.isArray(facet)) {
    return ["retreat facet is not an object"];
  }
  const f = facet as Record<string, unknown>;

  for (const key of Object.keys(f)) {
    if (!(RETREAT_FACET_FIELDS as readonly string[]).includes(key)) {
      reasons.push(`retreat.${key} is not a known retreat field (${RETREAT_FACET_FIELDS.join("/")})`);
    }
  }

  for (const field of RETREAT_FACET_FIELDS) {
    if (!(field in f) || f[field] === undefined) continue; // absent = unknown
    const entry = f[field];
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      reasons.push(`retreat.${field} must be an object { value, source }`);
      continue;
    }
    const e = entry as Record<string, unknown>;

    if (!isHttpsUrl(e.source)) {
      reasons.push(`retreat.${field}.source must be an https URL, got ${JSON.stringify(e.source)}`);
    }

    const value = e.value;
    switch (field) {
      case "worshipSpace":
        if (!(RETREAT_WORSHIP_SPACES as readonly unknown[]).includes(value)) {
          reasons.push(
            `retreat.worshipSpace.value must be one of ${RETREAT_WORSHIP_SPACES.join("/")}, got ${JSON.stringify(value)}`,
          );
        }
        break;
      case "dietary":
        if (!Array.isArray(value)) {
          reasons.push(`retreat.dietary.value must be an array of ${RETREAT_DIETARY.join("/")}`);
        } else {
          for (const d of value) {
            if (!(RETREAT_DIETARY as readonly unknown[]).includes(d)) {
              reasons.push(
                `retreat.dietary.value has off-vocab entry ${JSON.stringify(d)} (allowed: ${RETREAT_DIETARY.join("/")})`,
              );
            }
          }
        }
        break;
      case "traditionsHosted":
        if (!Array.isArray(value) || value.length === 0) {
          reasons.push("retreat.traditionsHosted.value must be a non-empty list (absent = unknown)");
        } else if (!value.every(isNonEmptyString)) {
          reasons.push("retreat.traditionsHosted.value has a blank or non-string entry");
        }
        break;
      case "quietHours":
        if (typeof value !== "boolean") {
          reasons.push(`retreat.quietHours.value must be a boolean, got ${JSON.stringify(value)}`);
        }
        if (e.text !== undefined && !isNonEmptyString(e.text)) {
          reasons.push("retreat.quietHours.text, when present, must be non-blank");
        }
        break;
      case "singleSexLodging":
      case "alcoholFree":
        if (typeof value !== "boolean") {
          reasons.push(`retreat.${field}.value must be a boolean, got ${JSON.stringify(value)}`);
        }
        break;
    }
  }
  return reasons;
}
