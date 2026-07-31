/**
 * ingest-researched.ts — Task 15: the INGEST GATE.
 *
 * The safe write-path for the expansion engine. Takes validated
 * `ResearchedRow[]` (Task 14's honesty-firewall harness), converts each into
 * its dataset's canonical shape, tags it via `deriveRouting` (correct-by-
 * construction — never re-implements the routing rules), appends it to the
 * correct SANCTIONED EXPANSION FILE, then runs the real integrity gates:
 *
 *   npx tsx scripts/verify-universe.ts
 *   && npx tsx scripts/check-brand-rules.ts
 *   && npx tsx scripts/audit/index.ts
 *
 * The batch is only KEPT if every gate exits 0. On ANY failure the touched
 * expansion file(s) are restored to their exact prior contents — this module
 * never leaves a half-written or invariant-violating file on disk.
 *
 * ── Sanctioned expansion files (never the regen-only base files) ──────────
 *   - golf        → `src/golf-courses-hhq-merge.ts` (Task 3; already the
 *                   sanctioned golf expansion, merged into `ALL_GOLF_COURSES`).
 *   - residence   → `src/residences-expansion.ts` (Task 15; merged into
 *                   `ALL_RESIDENCES` / `residencesForSite()` in `residences.ts`).
 *   - party-venue → `src/party-venues-expansion.ts` (2026-07-31; attached onto
 *                   the anchored destination by `attachPartyVenues()` in
 *                   `index.ts`, BEFORE `bakeDestination`).
 *   - party-venue-patch → `src/party-venue-patches.ts` (2026-07-31; merged onto
 *                   an EXISTING row by `applyPartyVenuePatches()`, after the
 *                   attach and before the bake).
 *
 * ── insert vs. enrich ──────────────────────────────────────────────────────
 * `party-venue` INSERTS a venue; `party-venue-patch` ENRICHES one. They are
 * separate datasets because they validate under opposite rules:
 *   - an insert must carry a full row and LOSES to a curated row of the same
 *     name (never overwrite reviewed copy);
 *   - a patch may carry a single field, must name a row that ALREADY EXISTS,
 *     and deliberately OVERWRITES the curated value (correcting an editorial
 *     default like `groupMin: 4` is the entire point).
 * Requiring a patch to carry `type` + `highlight` the way an insert does would
 * make the coordinate backfill (0 of 4,251 rows) and the URL backfill (47 of
 * ~4,200) structurally impossible — those patches carry neither.
 * `golf-courses.ts`, the `SHARED_RESIDENCES` array in `residences.ts`, and the
 * curated `destinations-data.ts` + `destinations-expansion-*.ts` files are all
 * regen-only or hand-authored ("DO NOT hand-edit") and are NEVER touched here.
 *
 * ── why party venues do not append in place ────────────────────────────────
 * They are the one NESTED dataset — a party row belongs inside a destination's
 * `activities`/`dining`/`nightlife`/`lodging`/`transport` array. Those live in
 * ~1.7MB of hand-authored TS carrying inline comments and per-city section
 * headers, which does NOT round-trip through `JSON.parse`, so the append
 * machinery below cannot read it and a rewrite would flatten reviewed
 * formatting into one line. The row therefore lands FLAT, keeping an explicit
 * `destinationId` anchor, and is attached at assembly time — the same answer
 * golf reached (see the `destinationId` doc on `SharedGolfCourse`).
 *
 * ── "coverage strictly improves" ────────────────────────────────────────────
 * The coverage matrix (`docs/coverage-matrix.md`, built by `npm run audit`)
 * counts, per wizard × dataset, how many rows carry that wizard in their
 * derived `postWizards`. That count is a pure function of "how many rows are
 * in the array" × "does each row derive a non-empty core reach" — both of
 * which this module proves directly, in-process, right after the write:
 *   1. re-read the expansion file from disk and assert its row count grew by
 *      EXACTLY the number of accepted rows (proves the write landed, not a
 *      silent no-op);
 *   2. assert every accepted row's `deriveRouting(...).core.wizards` is
 *      non-empty (the same core reach `backfillUniverse()` unions in).
 * Together these guarantee the coverage-matrix cell(s) for that dataset's
 * core wizards strictly increase — without needing a second, cache-fragile
 * cross-process re-import of the whole universe to diff against (dynamic
 * `import()` cache-busting via query strings was tested against tsx's loader
 * and does NOT force a fresh read — see task-15-report.md).
 *
 * Run:  (library — no CLI entrypoint; called by the research/backfill harness)
 * Test: npx tsx --test scripts/ingest-researched.test.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateResearchedRow,
  type ResearchedRow,
  type ResearchedGolfRow,
  type ResearchedResidenceRow,
  type ResearchedPartyVenueRow,
  type ResearchedPartyVenuePatchRow,
} from "../src/research-schema";
import { deriveRouting } from "../src/tagging-rules";
import { SHARED_GOLF_COURSES } from "../src/golf-courses";
import type { SharedGolfCourse } from "../src/golf-courses";
import { SHARED_RESIDENCES } from "../src/residences";
import { SHARED_GOLF_DESTINATIONS } from "../src/golf-destinations";
import type { SharedResidence } from "../src/residences";
// The ASSEMBLED universe (attached + baked) — the anchor for a party row must
// resolve against what consumers actually read, not a raw expansion file.
import { sharedDestinations } from "../src/index";
import type { PartyVenueExpansionRow } from "../src/party-venues-expansion";
import type { PartyVenuePatch } from "../src/party-venue-patches";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

export const DEFAULT_GOLF_EXPANSION_PATH = join(REPO_ROOT, "src", "golf-courses-hhq-merge.ts");
export const DEFAULT_RESIDENCE_EXPANSION_PATH = join(REPO_ROOT, "src", "residences-expansion.ts");
export const DEFAULT_PARTY_VENUE_EXPANSION_PATH = join(REPO_ROOT, "src", "party-venues-expansion.ts");
export const DEFAULT_PARTY_PATCH_PATH = join(REPO_ROOT, "src", "party-venue-patches.ts");

export interface GateResult {
  ok: boolean;
  output: string;
  failedGate?: string;
}

export interface IngestOptions {
  /** Override for testing — write to a temp fixture instead of the real
   *  sanctioned golf expansion file. Defaults to the real file. */
  golfFilePath?: string;
  /** Override for testing — write to a temp fixture instead of the real
   *  sanctioned residence expansion file. Defaults to the real file. */
  residenceFilePath?: string;
  /** Override for testing — write to a temp fixture instead of the real
   *  sanctioned party-venue expansion file. Defaults to the real file. */
  partyVenueFilePath?: string;
  /** Override for testing — write to a temp fixture instead of the real
   *  sanctioned party-venue PATCH file. Defaults to the real file. */
  partyPatchFilePath?: string;
  /** Inject a gate runner for testing the rollback MECHANISM in isolation,
   *  without spawning the real (multi-second) verify/audit gates. Defaults to
   *  the real `npx tsx scripts/verify-universe.ts && ... && ... audit/index.ts`
   *  chain, run from the repo root. */
  runGates?: () => GateResult;
}

/**
 * A candidate that was NEVER appended because its identity already exists —
 * either in the target sanctioned expansion file (a venue researched again
 * across two monthly runs) or in the regen-only base dataset (a venue the
 * curated data already carries). Reported explicitly (Item 1 of the arm-time
 * hardening) — never silently dropped, so an unattended monthly run's log /
 * PR-body builder can always see exactly why a row didn't land.
 */
export interface SkippedDuplicate {
  dataset: "golf" | "residence" | "party-venue" | "party-venue-patch";
  /** Human-readable identity of the skipped candidate (name+city, or id). */
  identity: string;
  reason: string;
}

export interface IngestResult {
  accepted: number;
  rejected: number;
  reasons: string[];
  /**
   * Candidates that passed validation + shape-conversion but were skipped
   * because their identity already exists in the expansion file or the base
   * dataset — see `SkippedDuplicate`. Always `[]` when nothing was skipped.
   * Every entry here is ALSO counted in `rejected` and has a matching line in
   * `reasons` (belt-and-suspenders — no separate silent bookkeeping).
   */
  skippedDuplicates: SkippedDuplicate[];
  /**
   * The exact `ResearchedRow`s that PASSED validation AND shape-conversion
   * AND every gate, and were actually written to a sanctioned expansion
   * file — i.e. the rows that landed for real. Same object references as
   * the corresponding entries of the `rows` argument (no cloning), so a
   * caller can identify which submitted rows are missing from this array
   * via reference equality.
   *
   * This exists so a downstream PR-body / commit-message builder (Task 17's
   * `runExpansion`) can derive its per-dataset row counts + citations from
   * rows that PROVABLY landed, never from the pre-ingest submitted batch —
   * `validateResearchedRow` (Task 14) intentionally requires FEWER fields
   * than this module's per-row shape conversion, so a row can pass research
   * validation and still be shape-rejected here (a normal partial-reject,
   * not the atomic gate rollback). Always empty when `accepted === 0`
   * (either nothing survived shape-conversion, or the whole batch was
   * rolled back by a failing gate).
   */
  acceptedRows: ResearchedRow[];
}

/** Thrown internally to short-circuit to the rollback path with a message. */
class GateFailure extends Error {}

// ─── expansion-file read/write (append-only, JSON-shaped array literal) ────

interface ParsedArrayFile {
  raw: string;
  arr: unknown[];
  prefix: string;
  suffix: string;
}

/**
 * Both sanctioned expansion files are a single `export const NAME: T[] = [ ... ];`
 * statement whose array literal is produced by `JSON.stringify` (no trailing
 * commas, no JS-only syntax), so it round-trips through `JSON.parse` exactly.
 * Only ever reads/writes THIS array — the file's header comment / import line
 * are preserved byte-for-byte via `prefix`/`suffix`.
 */
function readArrayFile(path: string): ParsedArrayFile {
  const raw = readFileSync(path, "utf-8");
  const re = /^([\s\S]*export const \w+\s*:\s*[^=\n]+=\s*)(\[[\s\S]*\])(;?\s*)$/;
  const m = raw.match(re);
  if (!m) {
    throw new Error(`ingest-researched: could not locate the array export in ${path}`);
  }
  const arr = JSON.parse(m[2]);
  if (!Array.isArray(arr)) {
    throw new Error(`ingest-researched: array export in ${path} did not parse to an array`);
  }
  return { raw, arr, prefix: m[1], suffix: m[3] ?? ";\n" };
}

function writeArrayFile(path: string, parsed: ParsedArrayFile, arr: unknown[]): void {
  writeFileSync(path, parsed.prefix + JSON.stringify(arr) + parsed.suffix);
}

// ─── dedup identity (Item 1: skip an already-present venue, never re-append) ─
//
// golf      → (name, city), case-insensitive.
// residence → id, case-insensitive (residence.id is required — see
//             REQUIRED_FIELDS.residence in research-schema.ts); falls back to
//             (name, region) case-insensitive if id is ever absent (defensive
//             — not reachable via the honesty-firewall validator today, kept
//             for interface robustness / direct callers of the converter).

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function golfIdentityKey(name: string, city: string): string {
  return `${norm(name)}|${norm(city)}`;
}

function residenceIdentityKey(id: string | undefined, name: string, region: string): string {
  if (typeof id === "string" && id.trim()) return `id:${norm(id)}`;
  return `nr:${norm(name)}|${norm(region)}`;
}

/** Collect identity keys out of a heterogeneous array of unknown-shaped
 *  objects (base-dataset rows, or the raw JSON parsed from an expansion
 *  file) — tolerant of any row missing the identity fields (skipped, not
 *  thrown on). */
function collectGolfIdentities(items: readonly unknown[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    const o = item as { name?: unknown; city?: unknown };
    if (typeof o?.name === "string" && typeof o?.city === "string") {
      set.add(golfIdentityKey(o.name, o.city));
    }
  }
  return set;
}

function collectResidenceIdentities(items: readonly unknown[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    const o = item as { id?: unknown; name?: unknown; region?: unknown };
    if (typeof o?.name === "string" && typeof o?.region === "string") {
      set.add(residenceIdentityKey(typeof o?.id === "string" ? o.id : undefined, o.name, o.region));
    }
  }
  return set;
}

// ─── canonical-shape conversion (correct-by-construction routing) ─────────

type ConvertResult<T> = { ok: true; row: T } | { ok: false; reason: string };

/**
 * ResearchedGolfRow → SharedGolfCourse. `sites` is the ONLY per-row routing
 * field golf carries (there is no `wizards` field on `SharedGolfCourse` —
 * `bestman`/`handicap`/etc. reach is derived fresh at load time by
 * `deriveRouting`, constant for every golf-course regardless of `sites`). When
 * the row supplies its own `sites`, it is respected here and left for
 * `verify-universe.ts`'s enum guard (`sites ⊆ {handicap,offsite}`) to
 * catch if wrong — the LAST-resort backstop this module's own gate step
 * relies on. When absent, defaults to the full core-derived legacy mapping
 * (handicap/offsite), which is what every golf course core-routes to
 * regardless of content.
 */
function toGolfCourse(row: ResearchedGolfRow): ConvertResult<SharedGolfCourse> {
  // greenFeeRange / style are substantive commercial/categorical FACTS about
  // the course — there is no neutral default for "how much does it cost" or
  // "what style of course is it" that isn't a fabrication, so a row missing
  // either is still hard-rejected (unchanged from before Item 2).
  // Narrowed into locals (rather than cast at the use site) so the typecheck
  // can SEE that this guard makes both fields non-undefined below — a cast
  // would re-open exactly the silent-undefined hole this guard exists to close.
  const greenFeeRange = row.greenFeeRange;
  const style = typeof row.style === "string" && row.style.trim() ? row.style : undefined;
  const missing: string[] = [];
  if (greenFeeRange === undefined) missing.push("greenFeeRange");
  if (style === undefined) missing.push("style");
  if (greenFeeRange === undefined || style === undefined) {
    return {
      ok: false,
      reason: `golf row "${row.name}" is missing required shape field(s) for SharedGolfCourse: ${missing.join(", ")}`,
    };
  }
  // driveMinutes / walkable ARE relaxed to SAFE, neutral defaults (Item 2 —
  // UI-field defaults): a minimal researched row that only has the honesty-
  // firewall's required fields must not be rejected outright over these.
  // `driveMinutes: 0` and `walkable: false` are non-fabricated, conservative
  // placeholders (HHQ's `HhqCourse` reads both directly, no `?`/fallback on
  // its end) — never a fake specific like an invented rating would be.

  const routing = deriveRouting({ kind: "golf-course" });
  const sites: SharedGolfCourse["sites"] =
    Array.isArray(row.sites) && row.sites.length > 0
      ? (row.sites as SharedGolfCourse["sites"])
      : (["handicap", "offsite"] as SharedGolfCourse["sites"]);
  const products: SharedGolfCourse["products"] =
    Array.isArray(row.products) && row.products.length > 0
      ? (row.products as SharedGolfCourse["products"])
      : (routing.core.products as SharedGolfCourse["products"]);

  // A researched course that names no destination reaches the flat catalog and
  // NO PAGE — Handicap HQ renders courses from each destination's embedded
  // `courses[]`. That is how the first batch of researched courses "closed" an
  // audit gap while appearing nowhere. When the row names a destination, it is
  // validated here so a typo'd anchor fails LOUDLY at ingest rather than
  // silently attaching to nothing.
  const destinationId = typeof row.destinationId === "string" ? row.destinationId.trim() : undefined;
  if (destinationId && !SHARED_GOLF_DESTINATIONS.some((d) => d.id === destinationId)) {
    return {
      ok: false,
      reason:
        `golf row "${row.name}" names destinationId "${destinationId}", which is not a real golf-trip destination. ` +
        `Use an id from SHARED_GOLF_DESTINATIONS, or omit it to keep the course catalog-only.`,
    };
  }

  const course: SharedGolfCourse = {
    name: row.name,
    city: row.city,
    state: row.state,
    region: row.region,
    tier: row.tier,
    greenFeeRange,
    style,
    walkable: typeof row.walkable === "boolean" ? row.walkable : false,
    driveMinutes: typeof row.driveMinutes === "number" ? row.driveMinutes : 0,
    highlight: row.highlight,
    sites,
    products,
    url: row.url ?? row.sourceUrl,
  };
  if (destinationId) course.destinationId = destinationId;
  if (row.rating !== undefined) course.rating = row.rating;
  if (row.googleRating !== undefined) course.googleRating = row.googleRating;
  if (row.reviewCount !== undefined) course.reviewCount = row.reviewCount;
  if (row.hypeTag !== undefined) course.hypeTag = row.hypeTag;
  if (row.rankNote !== undefined) course.rankNote = row.rankNote;

  return { ok: true, row: course };
}

/**
 * Item 2 — UI-field defaults for residence. `residencesForSite("offsite")`
 * is consumed by Offsite Outpost as `residencesForSite(...) as unknown as
 * Venue[]` — a DIRECT CAST, no per-field hydration step for offsite venues
 * (unlike its lighter "wizard pool" tier, which IS hydrated with defaults).
 * OO's engine (`generate.ts`) reads `v.capacity.min/.max`, `v.seasonality.*`,
 * `v.price.perPersonPerNight.*`, `v.goodFor.includes(...)`,
 * `v.signatureExperiences.includes(...)`, and `v.spaces.breakout` WITHOUT
 * optional chaining — any of these left `undefined` on a minimal researched
 * row is a real production TypeError (`Cannot read properties of undefined`)
 * the moment that venue is scored/rendered, not just a cosmetic gap.
 *
 * These defaults are all neutral/empty (0, "", [], false) — NEVER an
 * invented specific fact (no fake capacity numbers, no fake pricing, no fake
 * "great room seats 250"). A residence written with these defaults simply
 * scores as "unknown fit" everywhere those fields are read.
 *
 * `capacity` and `price` are DELIBERATELY ABSENT from this default table —
 * unlike every other field here, OO interpolates them straight into live
 * page copy ("Capacity: {min}–{max} guests", "Sleeps {sleepsOnsite}",
 * "${low}–{high} per person/night") with no zero-guard, so a `0`/`0` default
 * doesn't just "score as unknown fit," it PUBLISHES fabricated-looking copy
 * on real commercial pages. `validateResearchedRow` (research-schema.ts)
 * now hard-requires real (>0) `capacity.min/.max` and
 * `price.perPersonPerNight.low/.high` for every residence row, so by the
 * time a row reaches this function those fields are always present and real
 * — spread in from `...rest` below, never defaulted to zero here.
 */
const RESIDENCE_UI_DEFAULTS: Record<string, unknown> = {
  nearestAirports: [],
  summary: "",
  whySpecial: "",
  spaces: { general: "", breakout: "", outdoor: "" },
  dining: "",
  signatureExperiences: [],
  seasonality: { bestMonths: "", offPeak: "" },
  logistics: "",
  accessibility: "",
  goodFor: [],
  tags: [],
  imageQuery: "",
};

/**
 * ResearchedResidenceRow → SharedResidence. Unlike golf, `wizards` IS a real
 * field consumers read (`residencesForSite` prefers a stored `wizards` over
 * deriving it). `deriveRouting`'s residence `core` is a constant
 * `[offsite-retreat, offsite-outing]` regardless of setting/audiences, so it
 * is ALWAYS derived fresh here and never trusted from the researched payload —
 * correct-by-construction, no hand-forced tag can ever reach the file.
 */
function toResidence(row: ResearchedResidenceRow): ConvertResult<SharedResidence> {
  // PROVENANCE IS PERSISTED, NOT STRIPPED. `sourceUrl` and `citations` used to
  // be destructured away here, so the schema gate and the live URL check both
  // ran and then discarded their evidence — residences ended up 0 of 341 with a
  // url while golf, which keeps it via `url: row.url ?? row.sourceUrl`, was 877
  // of 999. Offsite Outpost renders residences into live copy, so a claim with
  // no followable source is exactly the unverifiable specific the honesty rules
  // exist to stop, and the citation cannot be re-derived later — the
  // researching agent is long gone. Only `dataset` (the discriminator) and
  // `wizards` (always re-derived from products, never hand-forced) are dropped.
  const { dataset: _dataset, wizards: _wizards, sites: rowSites, products: rowProducts, ...rest } = row;
  const routing = deriveRouting({ kind: "residence" });
  const sites = Array.isArray(rowSites) && rowSites.length > 0 ? rowSites : ["offsite"];
  const products = Array.isArray(rowProducts) && rowProducts.length > 0 ? rowProducts : (routing.core.products as string[]);

  const residence: SharedResidence = {
    ...RESIDENCE_UI_DEFAULTS,
    ...rest,
    id: row.id,
    name: row.name,
    setting: row.setting,
    region: row.region,
    country: row.country,
    sites,
    products,
    wizards: routing.core.wizards,
    // Same contract golf already honours (`url: row.url ?? row.sourceUrl`): the
    // canonical row exposes the primary source as `url`, and `sourceUrl` +
    // `citations` ride along via ...rest as the full audit trail.
    url: (row as { url?: string }).url ?? row.sourceUrl,
  };
  return { ok: true, row: residence };
}

/**
 * ResearchedPartyVenueRow → PartyVenueExpansionRow.
 *
 * Party venues are the one dataset whose canonical home is NESTED (inside a
 * destination's `activities` / `dining` / `nightlife` / `lodging` / `transport`
 * array), spread across ~1.7MB of hand-authored TS that carries inline comments
 * and therefore does not round-trip through `JSON.parse`. Rather than
 * machine-edit curated files, the row lands FLAT in the sanctioned
 * `party-venues-expansion.ts` keeping its `destinationId` + `category`, and
 * `attachPartyVenues()` merges it into the destination at assembly time —
 * before `bakeDestination`, so the row is tagged by the identical code path as
 * a curated one. This is the answer golf reached first (see the `destinationId`
 * doc on SharedGolfCourse).
 *
 * `dataset` is dropped (the discriminator). Everything else — including
 * `sourceUrl` + `citations` — rides through: e57103a fixed exactly this strip
 * for residences, which had left them 0-of-341 with a followable source.
 * Tag fields are NOT set here and must not be: the bake derives
 * wizards/audiences/products/priceTier from `brands` + `type`, so a hand-forced
 * tag could never reach the file even if a researcher supplied one.
 */
function toPartyVenue(row: ResearchedPartyVenueRow): ConvertResult<PartyVenueExpansionRow> {
  const { dataset: _dataset, ...rest } = row;
  return {
    ok: true,
    row: {
      ...rest,
      destinationId: row.destinationId,
      category: row.category,
      name: row.name,
      // Same contract golf and residences already honour.
      url: (rest as { url?: string }).url ?? row.sourceUrl,
    },
  };
}

// ─── party-venue anchor resolution + identity ───────────────────────────────
//
// The anchor is EXPLICIT and fatal on a miss — a destination is never inferred
// from a row's city/state. Town names collide across an international
// geography, and a wrong-but-plausible attach is silent forever. Golf's
// `destinationId` doc carries the identical rule.

/** Every destination id in the real universe. Memoised — the universe is
 *  immutable for the life of the process. */
let _destinationIds: Set<string> | undefined;
function knownDestinationIds(): Set<string> {
  if (!_destinationIds) _destinationIds = new Set(sharedDestinations.map((d) => d.id));
  return _destinationIds;
}

/** `destinationId|category|name`, normalised — scoped per category, so a
 *  restaurant and an activity may legitimately share a name. */
function partyIdentityKey(destinationId: string, category: string, name: string): string {
  return `${norm(destinationId)}|${norm(category)}|${norm(name)}`;
}

/** Identity keys for every party item the CURATED universe already carries.
 *  Built once per ingest run, and only when party candidates exist. */
function collectCuratedPartyIdentities(): Set<string> {
  const keys = new Set<string>();
  for (const d of sharedDestinations) {
    for (const a of d.activities) keys.add(partyIdentityKey(d.id, "activity", a.name));
    for (const x of d.dining) keys.add(partyIdentityKey(d.id, "dining", x.name));
    for (const n of d.nightlife) keys.add(partyIdentityKey(d.id, "nightlife", n.name));
    for (const l of d.lodging) keys.add(partyIdentityKey(d.id, "lodging", l.name));
    for (const t of d.transport) keys.add(partyIdentityKey(d.id, "transport", t.name));
  }
  return keys;
}

/**
 * ResearchedPartyVenuePatchRow → PartyVenuePatch. Drops only the discriminator;
 * the key fields and every payload field ride through, as does provenance.
 *
 * No `url` mirror here, unlike the insert paths: a patch is a partial row, and
 * silently writing `url` from `sourceUrl` would overwrite a venue's real
 * homepage with whatever page happened to document the patched fact. If a patch
 * means to set `url`, it says so.
 */
function toPartyPatch(row: ResearchedPartyVenuePatchRow): ConvertResult<PartyVenuePatch> {
  const { dataset: _dataset, ...rest } = row;
  return { ok: true, row: rest as PartyVenuePatch };
}

/**
 * Every (destination, category, name) that EXISTS in the universe — the set a
 * patch target must be found in. Memoised; built only when patches are present.
 */
let _curatedPartyIdentities: Set<string> | undefined;
function existingPartyRowIdentities(): Set<string> {
  if (!_curatedPartyIdentities) _curatedPartyIdentities = collectCuratedPartyIdentities();
  return _curatedPartyIdentities;
}

/** Identity keys out of the raw JSON parsed from the party PATCH file. */
function collectPatchIdentities(arr: unknown[]): Set<string> {
  const keys = new Set<string>();
  for (const r of arr) {
    if (typeof r !== "object" || r === null) continue;
    const row = r as { destinationId?: unknown; category?: unknown; name?: unknown };
    if (typeof row.destinationId !== "string" || typeof row.category !== "string" || typeof row.name !== "string") {
      continue;
    }
    keys.add(partyIdentityKey(row.destinationId, row.category, row.name));
  }
  return keys;
}

/** Identity keys out of the raw JSON parsed from the party expansion file. */
function collectPartyFileIdentities(arr: unknown[]): Set<string> {
  const keys = new Set<string>();
  for (const r of arr) {
    if (typeof r !== "object" || r === null) continue;
    const row = r as { destinationId?: unknown; category?: unknown; name?: unknown };
    if (typeof row.destinationId !== "string" || typeof row.category !== "string" || typeof row.name !== "string") {
      continue;
    }
    keys.add(partyIdentityKey(row.destinationId, row.category, row.name));
  }
  return keys;
}

// ─── the real integrity gate (shelled out — always a fresh process, so it
//     always reads the CURRENT on-disk state, no ESM module-cache risk) ────

function defaultRunGates(): GateResult {
  const gates: [string, string[]][] = [
    ["verify-universe", ["tsx", "scripts/verify-universe.ts"]],
    ["check-brand-rules", ["tsx", "scripts/check-brand-rules.ts"]],
    ["audit", ["tsx", "scripts/audit/index.ts"]],
  ];
  let output = "";
  for (const [name, args] of gates) {
    try {
      output += execFileSync("npx", args, { cwd: REPO_ROOT, encoding: "utf-8" });
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const errOut = [err.stdout, err.stderr].filter(Boolean).join("\n") || String(err.message ?? e);
      return { ok: false, output: output + errOut, failedGate: name };
    }
  }
  return { ok: true, output };
}

// ─── the ingest gate ────────────────────────────────────────────────────────

export function ingestResearched(rows: ResearchedRow[], opts: IngestOptions = {}): IngestResult {
  const golfPath = opts.golfFilePath ?? DEFAULT_GOLF_EXPANSION_PATH;
  const residencePath = opts.residenceFilePath ?? DEFAULT_RESIDENCE_EXPANSION_PATH;
  const partyPath = opts.partyVenueFilePath ?? DEFAULT_PARTY_VENUE_EXPANSION_PATH;
  const patchPath = opts.partyPatchFilePath ?? DEFAULT_PARTY_PATCH_PATH;
  const runGates = opts.runGates ?? defaultRunGates;

  const reasons: string[] = [];
  const skippedDuplicates: SkippedDuplicate[] = [];
  let rejected = 0;

  // Candidates surviving validation + shape-conversion, BEFORE dedup — kept
  // paired with their source ResearchedRow so a later duplicate-skip can
  // still report/exclude the right one.
  const golfCandidates: { source: ResearchedRow; course: SharedGolfCourse }[] = [];
  const residenceCandidates: { source: ResearchedRow; residence: SharedResidence }[] = [];
  const partyCandidates: { source: ResearchedRow; venue: PartyVenueExpansionRow }[] = [];
  const patchCandidates: { source: ResearchedRow; patch: PartyVenuePatch }[] = [];

  // ── Step 1: validate every row through the honesty firewall ─────────────
  for (const row of rows) {
    const v = validateResearchedRow(row);
    if (!v.ok) {
      rejected++;
      reasons.push(`rejected (validation): ${v.reasons.join("; ")}`);
      continue;
    }
    // ── Step 2: convert to canonical shape, deriving tags via deriveRouting ─
    if (v.row.dataset === "golf") {
      const conv = toGolfCourse(v.row);
      if (!conv.ok) {
        rejected++;
        reasons.push(`rejected (shape): ${conv.reason}`);
        continue;
      }
      golfCandidates.push({ source: v.row, course: conv.row });
    } else if (v.row.dataset === "residence") {
      const conv = toResidence(v.row);
      if (!conv.ok) {
        rejected++;
        reasons.push(`rejected (shape): ${conv.reason}`);
        continue;
      }
      residenceCandidates.push({ source: v.row, residence: conv.row });
    } else if (v.row.dataset === "party-venue") {
      // The anchor is resolved HERE, before any write, and a miss is a hard
      // reject that names the bad id. Never inferred from city/state — see
      // `destinationIds` above. `attachPartyVenues` throws on the same
      // condition at assembly time, so a row that somehow reached the file
      // with a dead anchor breaks the build rather than vanishing; this check
      // is what stops it ever getting there.
      if (!knownDestinationIds().has(v.row.destinationId)) {
        rejected++;
        reasons.push(
          `rejected (unresolved anchor): destinationId ${JSON.stringify(v.row.destinationId)} ` +
            `for "${v.row.name}" matches no destination in the universe. ` +
            `The anchor is explicit and is never inferred from city/state — fix the id.`,
        );
        continue;
      }
      const conv = toPartyVenue(v.row);
      if (!conv.ok) {
        rejected++;
        reasons.push(`rejected (shape): ${conv.reason}`);
        continue;
      }
      partyCandidates.push({ source: v.row, venue: conv.row });
    } else if (v.row.dataset === "party-venue-patch") {
      // A patch must name a row that ALREADY EXISTS. Resolved here, before any
      // write, against the assembled universe. `applyPartyVenuePatches` throws
      // on the same condition at assembly time; this check is what stops a
      // dead patch reaching the file, and it is the difference between a
      // backfill that moves data and one that reports success and moves none.
      const key = partyIdentityKey(v.row.destinationId, v.row.category, v.row.name);
      if (!existingPartyRowIdentities().has(key)) {
        rejected++;
        reasons.push(
          `rejected (patch target not found): no ${v.row.category} named "${v.row.name}" on ` +
            `${JSON.stringify(v.row.destinationId)}. The target is matched on destination + category + ` +
            `name and is never searched for elsewhere — fix the key or drop the patch.`,
        );
        continue;
      }
      const conv = toPartyPatch(v.row);
      if (!conv.ok) {
        rejected++;
        reasons.push(`rejected (shape): ${conv.reason}`);
        continue;
      }
      patchCandidates.push({ source: v.row, patch: conv.row });
    } else {
      // EXPLICIT dispatch, no trailing else that silently assumes a dataset —
      // the same shape that let a seventh wizard fall into offsite-outing's
      // counter in starved-inputs.ts. A new dataset lands here and is REJECTED
      // until someone writes its write path; it is never guessed into an
      // existing one.
      //
      // Failing loudly here is the point. Silently dropping a validated,
      // URL-verified row would reproduce the exact bug this repo keeps hitting:
      // a row that passes every gate and reaches no user.
      rejected++;
      reasons.push(
        `rejected (unsupported ingest target): dataset "${(v.row as { dataset: string }).dataset}" ` +
          `validates but has no write path. Do NOT silently skip — build the write path or land the row by hand.`,
      );
      continue;
    }
  }

  // ── Step 2.5: dedup before append (Item 1) ───────────────────────────────
  // Identity already existing in EITHER the sanctioned expansion file OR the
  // regen-only base dataset is skipped — reported via `skippedDuplicates` +
  // a matching `reasons` line, counted in `rejected`, never silently
  // dropped. Also dedups WITHIN this batch (two researched rows for the same
  // venue in one run): first occurrence wins.
  //
  // The expansion file is read here (not just inside the Step 3 try) so the
  // parsed contents can be reused for the actual write below — one read, no
  // staleness risk (single-threaded, nothing else can mutate it in between).
  let golfParsed: ParsedArrayFile | undefined;
  const validGolf: SharedGolfCourse[] = [];
  const acceptedGolfRows: ResearchedRow[] = [];
  if (golfCandidates.length > 0) {
    golfParsed = readArrayFile(golfPath);
    const existing = new Set<string>([
      ...collectGolfIdentities(SHARED_GOLF_COURSES),
      ...collectGolfIdentities(golfParsed.arr),
    ]);
    for (const { source, course } of golfCandidates) {
      const key = golfIdentityKey(course.name, course.city);
      if (existing.has(key)) {
        rejected++;
        const identity = `${course.name} (${course.city})`;
        skippedDuplicates.push({
          dataset: "golf",
          identity,
          reason: `duplicate of an existing golf course (matched name+city, case-insensitive)`,
        });
        reasons.push(`skipped duplicate (golf): "${identity}" already exists in the dataset`);
        continue;
      }
      existing.add(key);
      validGolf.push(course);
      acceptedGolfRows.push(source);
    }
  }

  let residenceParsed: ParsedArrayFile | undefined;
  const validResidence: SharedResidence[] = [];
  const acceptedResidenceRows: ResearchedRow[] = [];
  if (residenceCandidates.length > 0) {
    residenceParsed = readArrayFile(residencePath);
    const existing = new Set<string>([
      ...collectResidenceIdentities(SHARED_RESIDENCES),
      ...collectResidenceIdentities(residenceParsed.arr),
    ]);
    for (const { source, residence } of residenceCandidates) {
      const key = residenceIdentityKey(residence.id, residence.name, residence.region);
      if (existing.has(key)) {
        rejected++;
        const identity = residence.id || `${residence.name} (${residence.region})`;
        skippedDuplicates.push({
          dataset: "residence",
          identity,
          reason: `duplicate of an existing residence (matched id, case-insensitive)`,
        });
        reasons.push(`skipped duplicate (residence): "${identity}" already exists in the dataset`);
        continue;
      }
      existing.add(key);
      validResidence.push(residence);
      acceptedResidenceRows.push(source);
    }
  }

  // Party dedup is scoped per (destination, category, name) and checks BOTH
  // the curated universe and the expansion file. The curated row always wins —
  // a researched row never overwrites reviewed copy.
  let partyParsed: ParsedArrayFile | undefined;
  const validParty: PartyVenueExpansionRow[] = [];
  const acceptedPartyRows: ResearchedRow[] = [];
  if (partyCandidates.length > 0) {
    partyParsed = readArrayFile(partyPath);
    const existing = new Set<string>([
      ...collectCuratedPartyIdentities(),
      ...collectPartyFileIdentities(partyParsed.arr),
    ]);
    for (const { source, venue } of partyCandidates) {
      const key = partyIdentityKey(venue.destinationId, venue.category, venue.name);
      if (existing.has(key)) {
        rejected++;
        const identity = `${venue.name} (${venue.destinationId}/${venue.category})`;
        skippedDuplicates.push({
          dataset: "party-venue",
          identity,
          reason: `duplicate of an existing party venue (matched destination+category+name, case-insensitive)`,
        });
        reasons.push(`skipped duplicate (party-venue): "${identity}" already exists in the dataset`);
        continue;
      }
      existing.add(key);
      validParty.push(venue);
      acceptedPartyRows.push(source);
    }
  }

  // Patch dedup is ONE patch per (destination, category, name). A second patch
  // for a row already patched is skipped rather than appended: two patches
  // against one row make the merged result depend on array order, and
  // `applyPartyVenuePatches` throws on exactly that. Re-patching a row means
  // editing the existing entry, not stacking a new one.
  let patchParsed: ParsedArrayFile | undefined;
  const validPatch: PartyVenuePatch[] = [];
  const acceptedPatchRows: ResearchedRow[] = [];
  if (patchCandidates.length > 0) {
    patchParsed = readArrayFile(patchPath);
    const existing = collectPatchIdentities(patchParsed.arr);
    for (const { source, patch } of patchCandidates) {
      const key = partyIdentityKey(patch.destinationId, patch.category, patch.name);
      if (existing.has(key)) {
        rejected++;
        const identity = `${patch.name} (${patch.destinationId}/${patch.category})`;
        skippedDuplicates.push({
          dataset: "party-venue-patch",
          identity,
          reason: `a patch for this row already exists (matched destination+category+name, case-insensitive)`,
        });
        reasons.push(`skipped duplicate (party-venue-patch): "${identity}" is already patched`);
        continue;
      }
      existing.add(key);
      validPatch.push(patch);
      acceptedPatchRows.push(source);
    }
  }

  // acceptedRows: same object references as the corresponding `rows` entries
  // (no cloning) — golf, residence, party-venue, then patches; not necessarily
  // the original submit order (no caller relies on cross-dataset ordering; see
  // IngestResult doc).
  const acceptedRows: ResearchedRow[] = [
    ...acceptedGolfRows,
    ...acceptedResidenceRows,
    ...acceptedPartyRows,
    ...acceptedPatchRows,
  ];

  if (
    validGolf.length === 0 &&
    validResidence.length === 0 &&
    validParty.length === 0 &&
    validPatch.length === 0
  ) {
    return { accepted: 0, rejected, reasons, acceptedRows: [], skippedDuplicates };
  }

  // ── Step 3: transactional append — capture prior contents before ANY write
  const backups: { path: string; prevContent: string }[] = [];
  const expectedCounts: { path: string; expectedLen: number }[] = [];

  try {
    if (validGolf.length > 0 && golfParsed) {
      backups.push({ path: golfPath, prevContent: golfParsed.raw });
      const merged = [...golfParsed.arr, ...validGolf];
      writeArrayFile(golfPath, golfParsed, merged);
      expectedCounts.push({ path: golfPath, expectedLen: merged.length });
    }
    if (validResidence.length > 0 && residenceParsed) {
      backups.push({ path: residencePath, prevContent: residenceParsed.raw });
      const merged = [...residenceParsed.arr, ...validResidence];
      writeArrayFile(residencePath, residenceParsed, merged);
      expectedCounts.push({ path: residencePath, expectedLen: merged.length });
    }
    if (validParty.length > 0 && partyParsed) {
      backups.push({ path: partyPath, prevContent: partyParsed.raw });
      const merged = [...partyParsed.arr, ...validParty];
      writeArrayFile(partyPath, partyParsed, merged);
      expectedCounts.push({ path: partyPath, expectedLen: merged.length });
    }
    if (validPatch.length > 0 && patchParsed) {
      backups.push({ path: patchPath, prevContent: patchParsed.raw });
      const merged = [...patchParsed.arr, ...validPatch];
      writeArrayFile(patchPath, patchParsed, merged);
      expectedCounts.push({ path: patchPath, expectedLen: merged.length });
    }

    // ── Step 4a: structural proof the write landed + coverage strictly
    // improved (re-read from disk — proves it's not a silent no-op) ────────
    for (const c of expectedCounts) {
      const post = readArrayFile(c.path);
      if (post.arr.length !== c.expectedLen) {
        throw new GateFailure(
          `coverage did not strictly improve for ${c.path}: expected ${c.expectedLen} row(s), found ${post.arr.length}`,
        );
      }
    }
    // belt + suspenders: every accepted row must carry non-empty derived core
    // reach, or the coverage matrix cell it's meant to grow wouldn't move.
    if (validGolf.length > 0 && deriveRouting({ kind: "golf-course" }).core.wizards.length === 0) {
      throw new GateFailure("golf-course core routing derived zero wizards — coverage would not improve");
    }
    if (validResidence.length > 0 && deriveRouting({ kind: "residence" }).core.wizards.length === 0) {
      throw new GateFailure("residence core routing derived zero wizards — coverage would not improve");
    }

    // ── Step 4b: the real gate — verify + check-brand-rules + audit ────────
    const gate = runGates();
    if (!gate.ok) {
      throw new GateFailure(`gate "${gate.failedGate ?? "verify/audit"}" failed:\n${gate.output.slice(0, 4000)}`);
    }

    return { accepted: validGolf.length + validResidence.length + validParty.length + validPatch.length, rejected, reasons, acceptedRows, skippedDuplicates };
  } catch (e) {
    // ── Step 5: roll back EVERY touched file to its exact prior contents ──
    for (const b of backups) writeFileSync(b.path, b.prevContent);
    const msg = e instanceof Error ? e.message : String(e);
    reasons.push(`batch rejected + rolled back: ${msg}`);
    return {
      accepted: 0,
      rejected: rejected + validGolf.length + validResidence.length + validParty.length + validPatch.length,
      reasons,
      acceptedRows: [],
      skippedDuplicates,
    };
  }
}
