/**
 * index.ts — Task 12: the `npm run audit` aggregator + coverage matrix + CI gate.
 *
 * Composes the three existing audit checks — does NOT re-implement any of
 * their logic:
 *   - `under-tagged.ts`   (Task 9)  — rules ⟷ backfill consistency guard
 *   - `orphaned.ts`       (Task 10) — tag ⟷ engine consistency guard
 *   - `starved-inputs.ts` (Task 11) — input-space discovery tool
 *
 * Two things this file adds on top of the three checks:
 *
 * 1. A COVERAGE MATRIX (`docs/coverage-matrix.md`) — rows = wizard, columns =
 *    dataset, cell = real reachable row count (rows in `backfillUniverse()`
 *    whose `postWizards` includes that wizard, for that dataset) — plus a
 *    starved-cell summary per wizard pulled straight from `findStarved()`.
 *
 * 2. A REGRESSION GATE keyed off a committed `docs/audit-baseline.json`. The
 *    three checks report the univserse's CURRENT state, which includes
 *    known, accepted gaps (72 starved cells today — see starved-inputs.ts's
 *    module doc: it's a discovery tool, not a pass/fail check on its own).
 *    Failing CI on every pre-existing gap would make the gate useless the
 *    moment it's turned on. Instead, `runAudit()`'s exit code is 0 unless
 *    there is a NEW regression BEYOND the committed baseline:
 *      - a NEW under-tagged row (baseline has 0; any row is new)
 *      - a NEW orphaned cite (baseline has 0; any row is new)
 *      - a NEW starved cell (one the baseline didn't have at all), OR
 *      - an EXISTING starved cell that got WORSE (current count < baseline
 *        count for that same cell)
 *    A starved cell that stays the same, or improves, is NOT a regression —
 *    it's a pre-existing known gap living exactly as intended.
 *
 * Run:  npx tsx scripts/audit/index.ts               (writes docs/, exits per gate)
 *       npx tsx scripts/audit/index.ts --update-baseline  (recalibrates the baseline
 *         to the CURRENT findings — use only after deliberately accepting a new
 *         state, e.g. after Task 13 closes some starved cells for real)
 * Test: npx tsx --test scripts/audit/index.test.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { findUnderTaggedIn, type UnderTagged } from "./under-tagged";
import { findOrphanedIn, type Orphaned } from "./orphaned";
import { findStarved, type Starved } from "./starved-inputs";
import { backfillUniverse, type BackfilledRow, type Dataset } from "../backfill-tags";
import type { WizardTag } from "../../src/tags";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(HERE, "..", "..", "docs");
const DEFAULT_BASELINE_PATH = join(DOCS_DIR, "audit-baseline.json");
const REPORT_PATH = join(DOCS_DIR, "audit-report.json");
const MATRIX_PATH = join(DOCS_DIR, "coverage-matrix.md");

const ALL_WIZARDS: WizardTag[] = [
  "bestman",
  "moh",
  "tdf",
  "offsite-retreat",
  "offsite-outing",
  "handicap",
];

const ALL_DATASETS: Dataset[] = [
  "party",
  "golf",
  "residence",
  "tdf-destination",
  "moh-local",
  "bestman-local",
  "oo-experience",
  "oo-outing",
];

// ─── stable keys (so baseline comparisons don't depend on array order) ─────

function underTaggedKey(u: UnderTagged): string {
  return `${u.kind}/${u.itemId}`;
}

function orphanedKey(o: Orphaned): string {
  return `${o.kind}/${o.itemId}->${o.wizard}`;
}

/** Stable, sorted cell key — independent of the axis-value insertion order. */
function starvedKey(s: Starved): string {
  const axisParts = Object.entries(s.cell)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  return `${s.wizard}::${axisParts}`;
}

// ─── baseline shape ─────────────────────────────────────────────────────────

export interface AuditBaseline {
  underTaggedIds: string[];
  orphanedKeys: string[];
  /** starved-cell key → count, for every cell that was starved at baseline time */
  starvedCells: Record<string, number>;
}

export function buildBaseline(
  underTagged: UnderTagged[],
  orphaned: Orphaned[],
  starved: Starved[],
): AuditBaseline {
  const starvedCells: Record<string, number> = {};
  for (const s of starved) starvedCells[starvedKey(s)] = s.count;
  return {
    underTaggedIds: underTagged.map(underTaggedKey).sort(),
    orphanedKeys: orphaned.map(orphanedKey).sort(),
    starvedCells,
  };
}

const EMPTY_BASELINE: AuditBaseline = { underTaggedIds: [], orphanedKeys: [], starvedCells: {} };

export function loadBaseline(path: string = DEFAULT_BASELINE_PATH): AuditBaseline {
  if (!existsSync(path)) return EMPTY_BASELINE;
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return {
    underTaggedIds: raw.underTaggedIds ?? [],
    orphanedKeys: raw.orphanedKeys ?? [],
    starvedCells: raw.starvedCells ?? {},
  };
}

// ─── regression detection (the key behavior — pure, independently testable) ─

export interface Regression {
  kind: "under-tagged" | "orphaned" | "starved-new" | "starved-worse";
  detail: string;
}

/**
 * Compare CURRENT findings against a BASELINE and return every regression —
 * i.e. every way the current universe is WORSE than the committed baseline.
 * Pre-existing, unchanged, or improved findings are never regressions.
 */
export function computeRegressions(
  current: { underTagged: UnderTagged[]; orphaned: Orphaned[]; starved: Starved[] },
  baseline: AuditBaseline,
): Regression[] {
  const regressions: Regression[] = [];

  const baselineUnderTagged = new Set(baseline.underTaggedIds);
  for (const u of current.underTagged) {
    const key = underTaggedKey(u);
    if (!baselineUnderTagged.has(key)) {
      regressions.push({ kind: "under-tagged", detail: `new under-tagged row: ${key}` });
    }
  }

  const baselineOrphaned = new Set(baseline.orphanedKeys);
  for (const o of current.orphaned) {
    const key = orphanedKey(o);
    if (!baselineOrphaned.has(key)) {
      regressions.push({ kind: "orphaned", detail: `new orphaned cite: ${key}` });
    }
  }

  for (const s of current.starved) {
    const key = starvedKey(s);
    const baselineCount = baseline.starvedCells[key];
    if (baselineCount === undefined) {
      regressions.push({
        kind: "starved-new",
        detail: `new starved cell: ${key} (count ${s.count})`,
      });
    } else if (s.count < baselineCount) {
      regressions.push({
        kind: "starved-worse",
        detail: `starved cell got worse: ${key} (baseline ${baselineCount} → now ${s.count})`,
      });
    }
  }

  return regressions;
}

// ─── coverage matrix (rows = wizard, columns = dataset) ────────────────────

export type CoverageMatrix = Record<WizardTag, Record<Dataset, number>>;

export function buildCoverageMatrix(rows: BackfilledRow[]): CoverageMatrix {
  const matrix = Object.fromEntries(
    ALL_WIZARDS.map((w) => [w, Object.fromEntries(ALL_DATASETS.map((d) => [d, 0]))]),
  ) as CoverageMatrix;

  for (const r of rows) {
    for (const w of r.postWizards) {
      if (!(w in matrix)) continue; // defensive; every WizardTag is in ALL_WIZARDS today
      matrix[w as WizardTag][r.dataset]++;
    }
  }

  return matrix;
}

export function renderCoverageMatrixMd(
  matrix: CoverageMatrix,
  starved: Starved[],
  regressions: Regression[],
): string {
  const lines: string[] = [];
  lines.push("# Coverage matrix");
  lines.push("");
  lines.push(
    "Rows = wizard, columns = dataset. Cell = real reachable row count in the " +
      "canonical baked universe (`backfillUniverse()`'s `postWizards`), i.e. how " +
      "many rows of that dataset are tagged for that wizard. Generated by " +
      "`npm run audit` — do not hand-edit.",
  );
  lines.push("");

  const header = ["wizard", ...ALL_DATASETS].join(" | ");
  const divider = ALL_DATASETS.map(() => "---").join(" | ");
  lines.push(`| ${header} |`);
  lines.push(`| --- | ${divider} |`);
  for (const w of ALL_WIZARDS) {
    const row = ALL_DATASETS.map((d) => matrix[w][d]).join(" | ");
    lines.push(`| ${w} | ${row} |`);
  }

  lines.push("");
  lines.push("## Starved-cell summary (input-space cells below threshold, per wizard)");
  lines.push("");
  const byWizard = new Map<WizardTag, Starved[]>();
  for (const s of starved) {
    if (!byWizard.has(s.wizard)) byWizard.set(s.wizard, []);
    byWizard.get(s.wizard)!.push(s);
  }
  if (byWizard.size === 0) {
    lines.push("None — every input-space cell meets the threshold.");
  } else {
    for (const w of ALL_WIZARDS) {
      const cells = byWizard.get(w) ?? [];
      lines.push(`- **${w}**: ${cells.length} starved cell(s)`);
    }
  }

  lines.push("");
  lines.push("## Regression gate");
  lines.push("");
  if (regressions.length === 0) {
    lines.push(
      "No regressions vs `docs/audit-baseline.json` — pre-existing known gaps " +
        "(including the starved cells above) do not fail the build.",
    );
  } else {
    lines.push(`${regressions.length} regression(s) found beyond baseline:`);
    lines.push("");
    for (const r of regressions) lines.push(`- **${r.kind}**: ${r.detail}`);
  }

  lines.push("");
  return lines.join("\n");
}

// ─── top-level aggregator ───────────────────────────────────────────────────

export interface AuditResult {
  underTagged: UnderTagged[];
  orphaned: Orphaned[];
  starved: Starved[];
  regressions: Regression[];
  exitCode: number;
}

export interface RunAuditOptions {
  /** Override for testing; defaults to the real canonical universe. */
  rows?: BackfilledRow[];
  underTagged?: UnderTagged[];
  orphaned?: Orphaned[];
  starved?: Starved[];
  baselinePath?: string;
  /** When true, write docs/coverage-matrix.md + docs/audit-report.json. Default true. */
  writeFiles?: boolean;
  /** When true, write the CURRENT findings as the new baseline instead of gating against it. */
  updateBaseline?: boolean;
}

export function runAudit(opts: RunAuditOptions = {}): AuditResult {
  const rows = opts.rows ?? backfillUniverse();
  const underTagged = opts.underTagged ?? findUnderTaggedIn(rows);
  const orphaned = opts.orphaned ?? findOrphanedIn(rows);
  // The starved check needs real source arrays for its axis attributes
  // (region/vibe/tier/setting/country) that don't live on BackfilledRow, so a
  // synthetic `rows` override can't feed it directly — tests that want to
  // control starved findings pass `opts.starved` explicitly instead. With no
  // override at all, fall back to the real full run.
  const starvedFinal = opts.starved ?? findStarved(3);

  const baselinePath = opts.baselinePath ?? DEFAULT_BASELINE_PATH;
  const baseline = opts.updateBaseline
    ? EMPTY_BASELINE
    : loadBaseline(baselinePath);

  const regressions = opts.updateBaseline
    ? []
    : computeRegressions({ underTagged, orphaned, starved: starvedFinal }, baseline);

  const writeFiles = opts.writeFiles ?? true;
  if (writeFiles) {
    mkdirSync(DOCS_DIR, { recursive: true });

    const matrix = buildCoverageMatrix(rows);
    writeFileSync(MATRIX_PATH, renderCoverageMatrixMd(matrix, starvedFinal, regressions));

    const report = {
      generatedAt: new Date().toISOString(),
      underTagged,
      orphaned,
      starved: starvedFinal,
      regressions,
      exitCode: regressions.length > 0 ? 1 : 0,
    };
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

    if (opts.updateBaseline) {
      const newBaseline = buildBaseline(underTagged, orphaned, starvedFinal);
      writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2));
    }
  }

  return {
    underTagged,
    orphaned,
    starved: starvedFinal,
    regressions,
    exitCode: regressions.length > 0 ? 1 : 0,
  };
}

// ESM "run as script" guard
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const updateBaseline = process.argv.includes("--update-baseline");
  const result = runAudit({ updateBaseline });

  console.log(
    `audit: ${result.underTagged.length} under-tagged, ${result.orphaned.length} orphaned, ` +
      `${result.starved.length} starved cell(s)`,
  );
  if (updateBaseline) {
    console.log(`baseline updated → ${DEFAULT_BASELINE_PATH}`);
  } else if (result.regressions.length === 0) {
    console.log("no regressions vs docs/audit-baseline.json — PASS");
  } else {
    console.log(`${result.regressions.length} regression(s) beyond baseline — FAIL`);
    for (const r of result.regressions) console.log(`  ✗ [${r.kind}] ${r.detail}`);
  }
  console.log(`wrote ${MATRIX_PATH}`);
  console.log(`wrote ${REPORT_PATH}`);

  process.exit(result.exitCode);
}
