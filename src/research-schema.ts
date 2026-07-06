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

/** Discriminated union of every dataset a research agent can produce. */
export type ResearchedRow = ResearchedGolfRow | ResearchedResidenceRow;

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
  if (dataset !== "golf" && dataset !== "residence") {
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
