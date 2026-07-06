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
 *   - golf      → `src/golf-courses-hhq-merge.ts` (Task 3; already the
 *                 sanctioned golf expansion, merged into `ALL_GOLF_COURSES`).
 *   - residence → `src/residences-expansion.ts` (Task 15; new — merged into
 *                 `ALL_RESIDENCES` / `residencesForSite()` in `residences.ts`).
 * `golf-courses.ts` and the `SHARED_RESIDENCES` array in `residences.ts` are
 * regen-only ("DO NOT hand-edit") and are NEVER touched here.
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
} from "../src/research-schema";
import { deriveRouting } from "../src/tagging-rules";
import { SHARED_GOLF_COURSES } from "../src/golf-courses";
import type { SharedGolfCourse } from "../src/golf-courses";
import { SHARED_RESIDENCES } from "../src/residences";
import type { SharedResidence } from "../src/residences";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

export const DEFAULT_GOLF_EXPANSION_PATH = join(REPO_ROOT, "src", "golf-courses-hhq-merge.ts");
export const DEFAULT_RESIDENCE_EXPANSION_PATH = join(REPO_ROOT, "src", "residences-expansion.ts");

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
  dataset: "golf" | "residence";
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
 * `verify-universe.ts`'s enum guard (`sites ⊆ {tdf,offsite,handicap}`) to
 * catch if wrong — the LAST-resort backstop this module's own gate step
 * relies on. When absent, defaults to the full core-derived legacy mapping
 * (tdf/offsite/handicap), which is what every golf course core-routes to
 * regardless of content.
 */
function toGolfCourse(row: ResearchedGolfRow): ConvertResult<SharedGolfCourse> {
  // greenFeeRange / style are substantive commercial/categorical FACTS about
  // the course — there is no neutral default for "how much does it cost" or
  // "what style of course is it" that isn't a fabrication, so a row missing
  // either is still hard-rejected (unchanged from before Item 2).
  const missing: string[] = [];
  if (row.greenFeeRange === undefined) missing.push("greenFeeRange");
  if (typeof row.style !== "string" || !row.style.trim()) missing.push("style");
  if (missing.length > 0) {
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
      : (["tdf", "offsite", "handicap"] as SharedGolfCourse["sites"]);
  const products: SharedGolfCourse["products"] =
    Array.isArray(row.products) && row.products.length > 0
      ? (row.products as SharedGolfCourse["products"])
      : (routing.core.products as SharedGolfCourse["products"]);

  const course: SharedGolfCourse = {
    name: row.name,
    city: row.city,
    state: row.state,
    region: row.region,
    tier: row.tier,
    greenFeeRange: row.greenFeeRange as [number, number],
    style: row.style,
    walkable: typeof row.walkable === "boolean" ? row.walkable : false,
    driveMinutes: typeof row.driveMinutes === "number" ? row.driveMinutes : 0,
    highlight: row.highlight,
    sites,
    products,
    url: row.url ?? row.sourceUrl,
  };
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
  const { dataset: _dataset, sourceUrl: _sourceUrl, citations: _citations, wizards: _wizards, sites: rowSites, products: rowProducts, ...rest } = row;
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
  };
  return { ok: true, row: residence };
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
  const runGates = opts.runGates ?? defaultRunGates;

  const reasons: string[] = [];
  const skippedDuplicates: SkippedDuplicate[] = [];
  let rejected = 0;

  // Candidates surviving validation + shape-conversion, BEFORE dedup — kept
  // paired with their source ResearchedRow so a later duplicate-skip can
  // still report/exclude the right one.
  const golfCandidates: { source: ResearchedRow; course: SharedGolfCourse }[] = [];
  const residenceCandidates: { source: ResearchedRow; residence: SharedResidence }[] = [];

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
    } else {
      const conv = toResidence(v.row);
      if (!conv.ok) {
        rejected++;
        reasons.push(`rejected (shape): ${conv.reason}`);
        continue;
      }
      residenceCandidates.push({ source: v.row, residence: conv.row });
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

  // acceptedRows: same object references as the corresponding `rows` entries
  // (no cloning) — golf then residence, not necessarily the original submit
  // order (no caller relies on cross-dataset ordering; see IngestResult doc).
  const acceptedRows: ResearchedRow[] = [...acceptedGolfRows, ...acceptedResidenceRows];

  if (validGolf.length === 0 && validResidence.length === 0) {
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

    return { accepted: validGolf.length + validResidence.length, rejected, reasons, acceptedRows, skippedDuplicates };
  } catch (e) {
    // ── Step 5: roll back EVERY touched file to its exact prior contents ──
    for (const b of backups) writeFileSync(b.path, b.prevContent);
    const msg = e instanceof Error ? e.message : String(e);
    reasons.push(`batch rejected + rolled back: ${msg}`);
    return {
      accepted: 0,
      rejected: rejected + validGolf.length + validResidence.length,
      reasons,
      acceptedRows: [],
      skippedDuplicates,
    };
  }
}
