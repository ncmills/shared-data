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
import type { SharedGolfCourse } from "../src/golf-courses";
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

export interface IngestResult {
  accepted: number;
  rejected: number;
  reasons: string[];
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
  const missing: string[] = [];
  if (row.greenFeeRange === undefined) missing.push("greenFeeRange");
  if (typeof row.style !== "string" || !row.style.trim()) missing.push("style");
  if (typeof row.walkable !== "boolean") missing.push("walkable");
  if (typeof row.driveMinutes !== "number") missing.push("driveMinutes");
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `golf row "${row.name}" is missing required shape field(s) for SharedGolfCourse: ${missing.join(", ")}`,
    };
  }

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
    walkable: row.walkable as boolean,
    driveMinutes: row.driveMinutes as number,
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
  let rejected = 0;

  const validGolf: SharedGolfCourse[] = [];
  const validResidence: SharedResidence[] = [];
  // Parallel to validGolf/validResidence — the ORIGINAL ResearchedRow (same
  // object reference as validateResearchedRow's input) for every row that
  // survives shape-conversion. Threaded through as IngestResult.acceptedRows
  // once the batch is actually kept (Step 4/4b below).
  const acceptedRows: ResearchedRow[] = [];

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
      validGolf.push(conv.row);
      acceptedRows.push(v.row);
    } else {
      const conv = toResidence(v.row);
      if (!conv.ok) {
        rejected++;
        reasons.push(`rejected (shape): ${conv.reason}`);
        continue;
      }
      validResidence.push(conv.row);
      acceptedRows.push(v.row);
    }
  }

  if (validGolf.length === 0 && validResidence.length === 0) {
    return { accepted: 0, rejected, reasons, acceptedRows: [] };
  }

  // ── Step 3: transactional append — capture prior contents before ANY write
  const backups: { path: string; prevContent: string }[] = [];
  const expectedCounts: { path: string; expectedLen: number }[] = [];

  try {
    if (validGolf.length > 0) {
      const parsed = readArrayFile(golfPath);
      backups.push({ path: golfPath, prevContent: parsed.raw });
      const merged = [...parsed.arr, ...validGolf];
      writeArrayFile(golfPath, parsed, merged);
      expectedCounts.push({ path: golfPath, expectedLen: merged.length });
    }
    if (validResidence.length > 0) {
      const parsed = readArrayFile(residencePath);
      backups.push({ path: residencePath, prevContent: parsed.raw });
      const merged = [...parsed.arr, ...validResidence];
      writeArrayFile(residencePath, parsed, merged);
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

    return { accepted: validGolf.length + validResidence.length, rejected, reasons, acceptedRows };
  } catch (e) {
    // ── Step 5: roll back EVERY touched file to its exact prior contents ──
    for (const b of backups) writeFileSync(b.path, b.prevContent);
    const msg = e instanceof Error ? e.message : String(e);
    reasons.push(`batch rejected + rolled back: ${msg}`);
    return { accepted: 0, rejected: rejected + validGolf.length + validResidence.length, reasons, acceptedRows: [] };
  }
}
