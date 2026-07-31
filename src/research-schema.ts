/**
 * research-schema.ts — Task 14: the honesty firewall of the research harness.
 *
 * Every row produced by real-venue research MUST be REAL and VERIFIABLE. This
 * module defines `ResearchedRow` (a per-dataset shape mirroring the canonical
 * `SharedGolfCourse` / `SharedResidence` so Task 15 can ingest it directly)
 * PLUS two mandatory provenance fields on EVERY row:
 *
 *   - `sourceUrl`  — the venue's real primary URL (http/https, resolvable).
 *   - `citations`  — ≥1 primary-source URL/reference backing the row's facts.
 *
 * `validateResearchedRow` is the gate. It REJECTS anything that could be
 * fabricated or half-real: a missing/blank/non-http sourceUrl, no citation,
 * a missing/blank required canonical field, an obvious placeholder value, or
 * (residence only) a missing/zero display-critical numeric field — real
 * capacity and price are hard-required for residences because Offsite
 * Outpost renders them straight into live page copy with no zero-guard (see
 * the residence-only block below). Rejected rows never reach the dataset —
 * NO FABRICATION is the hard constraint (feedback_no_fabricated_social_proof,
 * feedback_research_before_drafting).
 */

import type { SharedGolfCourse } from "./golf-courses";
import type { SharedResidence } from "./residences";

/** Provenance every researched row carries, regardless of dataset. */
export interface Provenance {
  /** The venue's real, primary website URL (http/https). */
  sourceUrl: string;
  /** ≥1 primary-source citation (URL or precise reference). */
  citations: string[];
}

/** A researched golf course — the SharedGolfCourse shape + dataset tag + provenance. */
export type ResearchedGolfRow = { dataset: "golf" } & Partial<SharedGolfCourse> &
  Pick<SharedGolfCourse, "name" | "city" | "state" | "region" | "tier" | "highlight"> &
  Provenance;

/** A researched residence — the SharedResidence shape + dataset tag + provenance. */
export type ResearchedResidenceRow = { dataset: "residence" } & Partial<SharedResidence> &
  Pick<SharedResidence, "id" | "name" | "setting" | "region" | "country"> &
  Provenance;

/**
 * The five arrays a party-venue row can land in on a destination.
 * Explicit, because the ingest target is chosen from this — never sniffed from
 * the row's other fields.
 */
export const PARTY_VENUE_CATEGORIES = [
  "activity",
  "dining",
  "nightlife",
  "lodging",
  "transport",
] as const;
export type PartyVenueCategory = (typeof PARTY_VENUE_CATEGORIES)[number];

/**
 * A researched party-venue row — an item on an EXISTING destination.
 *
 * Added 2026-07-31. Until then the discriminator accepted only "golf" and
 * "residence", so the research harness structurally could not supplement the
 * party universe: ~4,200 rows across 212 destinations were hand-edit-only. That
 * is the direct cause of the party universe carrying 47 URLs while golf, which
 * passes through this gate, carries 877 of 999.
 *
 * `destinationId` is EXPLICIT and never inferred from a city/state string —
 * the same rule the golf `destinationId` anchor follows. Matching town names
 * across an international geography is exactly the silent mis-association this
 * repo has repeatedly been bitten by. The ingest gate resolves the anchor
 * against the real universe and fails loudly on a typo; this schema only
 * asserts it is present and non-blank.
 */
export type ResearchedPartyVenueRow = {
  dataset: "party-venue";
  destinationId: string;
  category: PartyVenueCategory;
  name: string;
} & Record<string, unknown> &
  Provenance;

/**
 * A researched ENRICHMENT of an existing party venue — an UPDATE, not an insert.
 *
 * Added 2026-07-31 alongside the patch overlay. It validates differently from
 * `ResearchedPartyVenueRow` in one decisive way: it does NOT have to carry a
 * full row. `PARTY_VENUE_REQUIRED_BY_CATEGORY` demands `type` + `highlight` of
 * a new activity, and requiring that of a patch would make the entire
 * coordinate backfill (0 of 4,251 rows) and URL backfill (47 of ~4,200)
 * impossible, since those patches carry neither.
 *
 * What it MUST have: the key that identifies an existing row, provenance, and
 * at least one payload field. A patch that changes nothing is a backfill row
 * that reports success and moves no data.
 *
 * The key fields are validated here for shape only. The ingest gate is what
 * resolves them against the real universe and fails loudly when the target row
 * does not exist — the same division of labour as the party-venue anchor.
 */
export type ResearchedPartyVenuePatchRow = {
  dataset: "party-venue-patch";
  destinationId: string;
  category: PartyVenueCategory;
  name: string;
} & Record<string, unknown> &
  Provenance;

/** Discriminated union of every dataset a research agent can produce. */
export type ResearchedRow =
  | ResearchedGolfRow
  | ResearchedResidenceRow
  | ResearchedPartyVenueRow
  | ResearchedPartyVenuePatchRow;

/**
 * Keys that identify the target of a patch rather than being payload, plus the
 * discriminator and provenance. A patch whose fields are entirely drawn from
 * this set would merge nothing.
 */
const PATCH_NON_PAYLOAD_FIELDS = new Set([
  "dataset",
  "destinationId",
  "category",
  "name",
  "sourceUrl",
  "citations",
]);

export type ValidationResult =
  | { ok: true; row: ResearchedRow }
  | { ok: false; reasons: string[] };

/**
 * Required canonical fields per dataset. Task 15 ingests into these exact
 * shapes, so a row missing any of these can't become a real dataset entry.
 * (Kept to the discriminating/identity fields — the engine derives or
 * defaults the rest — so a genuinely-real venue isn't rejected for a missing
 * optional like `driveMinutes`.) Residence's `capacity`/`price` are display-
 * critical (see the dedicated numeric check below) so they're NOT defaulted
 * by the ingest gate the way every other optional residence field is.
 */
const REQUIRED_FIELDS: Record<ResearchedRow["dataset"], string[]> = {
  golf: ["name", "city", "state", "region", "tier", "highlight"],
  residence: ["id", "name", "setting", "region", "country"],
  // The anchor + identity. Per-category discriminating fields are checked
  // separately below, because they differ by which array the row lands in.
  "party-venue": ["destinationId", "category", "name"],
  // The KEY of the row being enriched. Deliberately the same three fields and
  // NOT the per-category set — see ResearchedPartyVenuePatchRow.
  "party-venue-patch": ["destinationId", "category", "name"],
};

/**
 * Per-category discriminating fields for a party-venue row. Kept to what makes
 * the row identifiable and renderable — the bake derives tags, and the ingest
 * gate defaults genuinely-optional fields — so a real venue is not rejected for
 * a missing nicety.
 */
const PARTY_VENUE_REQUIRED_BY_CATEGORY: Record<PartyVenueCategory, string[]> = {
  activity: ["type", "highlight"],
  dining: ["cuisine", "priceRange", "highlight"],
  nightlife: ["type", "vibe", "priceRange", "highlight"],
  lodging: ["type", "highlight"],
  transport: ["type", "highlight"],
};

/**
 * Small, documented placeholder denylist. These are the tells of a
 * fabricated / stub row (a filler URL, an unfilled field, lorem text). Kept
 * intentionally small — the goal is to catch obvious non-real values without
 * rejecting legitimate venues. Matched case-insensitively as a whole trimmed
 * value OR as a substring for the URL host tokens.
 */
const PLACEHOLDER_HOSTS = ["example.com", "example.org", "example.net", "test.com", "localhost"];
const PLACEHOLDER_VALUES = ["tbd", "todo", "n/a", "na", "none", "lorem", "lorem ipsum", "placeholder", "xxx", "unknown"];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isPlaceholderUrl(v: string): boolean {
  let host = "";
  try {
    host = new URL(v.trim()).host.toLowerCase();
  } catch {
    return false;
  }
  return PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`) || host === `www.${h}`);
}

function isPlaceholderValue(v: string): boolean {
  return PLACEHOLDER_VALUES.includes(v.trim().toLowerCase());
}

/**
 * Validate a candidate researched row. Returns `{ ok:true, row }` only when
 * the row is provably real-shaped: real primary URL, ≥1 citation, all
 * required canonical fields present + non-blank, and no obvious placeholders.
 * Otherwise `{ ok:false, reasons }` lists every failed check (so the harness
 * can log why a candidate was dropped).
 */
export function validateResearchedRow(input: unknown): ValidationResult {
  const reasons: string[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, reasons: ["row is not an object"] };
  }
  const row = input as Record<string, unknown>;

  // ── dataset discriminator ──────────────────────────────────────────────
  const dataset = row.dataset;
  if (
    dataset !== "golf" &&
    dataset !== "residence" &&
    dataset !== "party-venue" &&
    dataset !== "party-venue-patch"
  ) {
    return { ok: false, reasons: [`unknown or missing dataset: ${JSON.stringify(dataset)}`] };
  }

  // ── provenance: sourceUrl ──────────────────────────────────────────────
  if (!isNonEmptyString(row.sourceUrl)) {
    reasons.push("missing or empty sourceUrl");
  } else if (!isHttpUrl(row.sourceUrl)) {
    reasons.push(`sourceUrl is not an http(s) URL: ${row.sourceUrl}`);
  } else if (isPlaceholderUrl(row.sourceUrl)) {
    reasons.push(`sourceUrl is a placeholder host: ${row.sourceUrl}`);
  }

  // ── provenance: citations ──────────────────────────────────────────────
  if (!Array.isArray(row.citations) || row.citations.length === 0) {
    reasons.push("citations is empty (need ≥1)");
  } else if (!row.citations.some((c) => isNonEmptyString(c))) {
    reasons.push("citations has no non-blank entry");
  }

  // ── required canonical fields ──────────────────────────────────────────
  for (const field of REQUIRED_FIELDS[dataset]) {
    if (!isNonEmptyString(row[field])) {
      reasons.push(`missing or blank required field: ${field}`);
    } else if (isPlaceholderValue(row[field] as string)) {
      reasons.push(`placeholder value in field ${field}: ${row[field]}`);
    }
  }

  // ── name must not just echo its region/setting (a classic stub tell) ───
  const name = typeof row.name === "string" ? row.name.trim().toLowerCase() : "";
  const region = typeof row.region === "string" ? row.region.trim().toLowerCase() : "";
  const setting = typeof row.setting === "string" ? row.setting.trim().toLowerCase() : "";
  if (name && (name === region || name === setting)) {
    reasons.push(`name equals its region/setting (placeholder tell): ${row.name}`);
  }

  // ── residence-only: display-critical numeric fields ─────────────────────
  // Offsite Outpost renders `residencesForSite("offsite")` as a direct,
  // unguarded `Venue[]` cast (no hydration step) and interpolates
  // `capacity.min/.max` and `price.perPersonPerNight.low/.high` straight
  // into live page copy — no zero-guard. A missing/zero value here doesn't
  // crash (unlike golf's greenFeeRange, which the wizard engine actively
  // needs to score against); it PUBLISHES fabricated-looking copy
  // ("Capacity: 0–0 guests", "Sleeps 0", "$0–0 per person/night") on real
  // commercial pages. So these are hard-required here, with REAL (>0)
  // numbers, at the same tier as golf's greenFeeRange/style — reject rather
  // than let the ingest gate default them to zero.
  if (dataset === "party-venue") {
    const category = row.category;
    if (!PARTY_VENUE_CATEGORIES.includes(category as PartyVenueCategory)) {
      reasons.push(
        `party-venue category must be one of ${PARTY_VENUE_CATEGORIES.join("/")}, got ${JSON.stringify(category)}`,
      );
    } else {
      for (const field of PARTY_VENUE_REQUIRED_BY_CATEGORY[category as PartyVenueCategory]) {
        if (!isNonEmptyString(row[field])) {
          reasons.push(`missing or blank required ${category} field: ${field}`);
        } else if (isPlaceholderValue(row[field] as string)) {
          reasons.push(`placeholder value in ${category} field ${field}: ${row[field]}`);
        }
      }
    }

    // Display-critical numbers, same rule as residence capacity/price: a zero
    // renders as a confident fabricated "$0" or "fits 0 people", which is worse
    // than an absent row. Only checked for the categories that carry them.
    if (category === "activity") {
      const band = row.pricePerPerson as unknown;
      const realBand =
        Array.isArray(band) &&
        band.length === 2 &&
        band.every((n) => typeof n === "number" && n > 0) &&
        (band[0] as number) <= (band[1] as number);
      if (!realBand) {
        reasons.push(
          "activity missing real pricePerPerson ([low, high], both numbers > 0, low <= high)",
        );
      }
      const gMin = row.groupMin;
      const gMax = row.groupMax;
      const realGroup =
        typeof gMin === "number" && typeof gMax === "number" && gMin > 0 && gMax >= gMin;
      if (!realGroup) {
        reasons.push("activity missing a real group range (groupMin > 0 and groupMax >= groupMin)");
      }
    }
  }

  if (dataset === "party-venue-patch") {
    const category = row.category;
    if (!PARTY_VENUE_CATEGORIES.includes(category as PartyVenueCategory)) {
      reasons.push(
        `party-venue-patch category must be one of ${PARTY_VENUE_CATEGORIES.join("/")}, got ${JSON.stringify(category)}`,
      );
    }

    // A patch must CHANGE something. Key + provenance only would merge no
    // fields — a backfill row that reports success and moves no data, which is
    // the failure this whole path exists to prevent.
    const payloadFields = Object.keys(row).filter((k) => !PATCH_NON_PAYLOAD_FIELDS.has(k));
    if (payloadFields.length === 0) {
      reasons.push(
        "patch carries no payload field — it would change nothing (key + provenance only)",
      );
    }

    // Display-critical numbers are checked ONLY when the patch sets them. A
    // patch is a partial row, so absence means "not changing this"; but a
    // present zero still renders as a confident "$0" or "fits 0 people", which
    // is worse than leaving the old value alone.
    if ("pricePerPerson" in row) {
      const band = row.pricePerPerson as unknown;
      const realBand =
        Array.isArray(band) &&
        band.length === 2 &&
        band.every((n) => typeof n === "number" && n > 0) &&
        (band[0] as number) <= (band[1] as number);
      if (!realBand) {
        reasons.push(
          "patch sets pricePerPerson but not to a real band ([low, high], both numbers > 0, low <= high)",
        );
      }
    }
    if ("groupMin" in row || "groupMax" in row) {
      // Either bound may be patched alone, so only the supplied one is checked
      // for realness; the pair relation is checked when both are present.
      const gMin = row.groupMin;
      const gMax = row.groupMax;
      if ("groupMin" in row && !(typeof gMin === "number" && gMin > 0)) {
        reasons.push("patch sets groupMin but not to a number > 0");
      }
      if ("groupMax" in row && !(typeof gMax === "number" && gMax > 0)) {
        reasons.push("patch sets groupMax but not to a number > 0");
      }
      if (typeof gMin === "number" && typeof gMax === "number" && gMax < gMin) {
        reasons.push("patch sets groupMax below groupMin");
      }
    }
    // Coordinates are the headline use of this path, and a swapped or
    // out-of-range pair silently places a venue in the ocean — which then
    // yields a confidently wrong sunset time, the exact fabrication the
    // coordinate backfill exists to prevent.
    for (const [field, limit] of [
      ["lat", 90],
      ["lng", 180],
    ] as const) {
      if (field in row) {
        const v = row[field];
        if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > limit) {
          reasons.push(`patch sets ${field} to ${JSON.stringify(v)} — must be a finite number within ±${limit}`);
        }
      }
    }
    if (("lat" in row) !== ("lng" in row)) {
      reasons.push("patch sets only one of lat/lng — a half coordinate locates nothing");
    }
  }

  if (dataset === "residence") {
    const capacity = row.capacity as { min?: unknown; max?: unknown } | undefined;
    const hasRealCapacity =
      typeof capacity === "object" &&
      capacity !== null &&
      typeof capacity.min === "number" &&
      typeof capacity.max === "number" &&
      capacity.min > 0 &&
      capacity.max > 0;
    if (!hasRealCapacity) {
      reasons.push(
        "residence missing real capacity (capacity.min and capacity.max must be present numbers > 0)",
      );
    }

    const price = row.price as { perPersonPerNight?: { low?: unknown; high?: unknown } } | undefined;
    const perPersonPerNight = price?.perPersonPerNight;
    const hasRealPrice =
      typeof perPersonPerNight === "object" &&
      perPersonPerNight !== null &&
      typeof perPersonPerNight.low === "number" &&
      typeof perPersonPerNight.high === "number" &&
      perPersonPerNight.low > 0 &&
      perPersonPerNight.high > 0;
    if (!hasRealPrice) {
      reasons.push(
        "residence missing real price (price.perPersonPerNight.low and .high must be present numbers > 0)",
      );
    }
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true, row: row as unknown as ResearchedRow };
}
