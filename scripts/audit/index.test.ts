// index.test.ts — Task 12: the `npm run audit` aggregator + regression gate.
//
// SYNTHETIC tests prove the regression-detection logic (`computeRegressions`)
// in isolation: a new under-tagged row, a new orphaned cite, a brand-new
// starved cell, and an EXISTING starved cell getting worse must all trip
// `exitCode !== 0`; a current state that matches the baseline exactly (known
// gaps included) must NOT. FULL RUN tests exercise `runAudit()` end-to-end
// against the real universe + the committed `docs/audit-baseline.json`,
// confirming the shipped baseline is green and the report/matrix files land
// with the expected top-level shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runAudit,
  buildBaseline,
  buildCoverageMatrix,
  renderCoverageMatrixMd,
  computeRegressions,
  type AuditBaseline,
} from "./index";
import { ALL_WIZARD_TAGS } from "../../src/tags";
import type { UnderTagged } from "./under-tagged";
import type { Orphaned } from "./orphaned";
import type { Starved } from "./starved-inputs";
import type { BackfilledRow } from "../backfill-tags";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(HERE, "..", "..", "docs");

function baseline(overrides: Partial<AuditBaseline> = {}): AuditBaseline {
  return {
    underTaggedIds: [],
    orphanedKeys: [],
    starvedCells: { "handicap::golfRegion=International|tier=budget": 0 },
    ...overrides,
  };
}

// ─── SYNTHETIC: computeRegressions ──────────────────────────────────────────

test("SYNTHETIC: current state matching baseline exactly reports zero regressions", () => {
  const current = {
    underTagged: [] as UnderTagged[],
    orphaned: [] as Orphaned[],
    starved: [{ wizard: "handicap", cell: { golfRegion: "International", tier: "budget" }, count: 0 }] as Starved[],
  };
  const regressions = computeRegressions(current, baseline());
  assert.deepEqual(regressions, []);
});

test("SYNTHETIC: a NEW under-tagged row beyond baseline is a regression", () => {
  const current = {
    underTagged: [
      { itemId: "new-item", kind: "residence", missingWizards: ["offsite-outing"] },
    ] as UnderTagged[],
    orphaned: [] as Orphaned[],
    starved: [] as Starved[],
  };
  const regressions = computeRegressions(current, baseline({ starvedCells: {} }));
  assert.equal(regressions.length, 1);
  assert.equal(regressions[0].kind, "under-tagged");
});

test("SYNTHETIC: a NEW orphaned cite beyond baseline is a regression", () => {
  const current = {
    underTagged: [] as UnderTagged[],
    orphaned: [{ itemId: "new-item", kind: "residence", wizard: "bestman" }] as Orphaned[],
    starved: [] as Starved[],
  };
  const regressions = computeRegressions(current, baseline({ starvedCells: {} }));
  assert.equal(regressions.length, 1);
  assert.equal(regressions[0].kind, "orphaned");
});

test("SYNTHETIC: a starved cell not present in the baseline at all is a NEW-starved regression", () => {
  const current = {
    underTagged: [] as UnderTagged[],
    orphaned: [] as Orphaned[],
    starved: [
      { wizard: "handicap", cell: { golfRegion: "International", tier: "budget" }, count: 0 },
      { wizard: "moh", cell: { region: "south", partyVibe: "chill" }, count: 1 }, // brand new
    ] as Starved[],
  };
  const regressions = computeRegressions(current, baseline());
  assert.equal(regressions.length, 1);
  assert.equal(regressions[0].kind, "starved-new");
  assert.match(regressions[0].detail, /moh/);
});

test("SYNTHETIC: an existing starved cell whose count drops below baseline is a starved-worse regression", () => {
  const worseBaseline = baseline({
    starvedCells: { "handicap::golfRegion=International|tier=solid": 1 },
  });
  const current = {
    underTagged: [] as UnderTagged[],
    orphaned: [] as Orphaned[],
    starved: [
      { wizard: "handicap", cell: { golfRegion: "International", tier: "solid" }, count: 0 }, // was 1, now 0
    ] as Starved[],
  };
  const regressions = computeRegressions(current, worseBaseline);
  assert.equal(regressions.length, 1);
  assert.equal(regressions[0].kind, "starved-worse");
});

test("SYNTHETIC: an existing starved cell that IMPROVES (still below threshold) is NOT a regression", () => {
  const improvedBaseline = baseline({
    starvedCells: { "handicap::golfRegion=International|tier=solid": 0 },
  });
  const current = {
    underTagged: [] as UnderTagged[],
    orphaned: [] as Orphaned[],
    starved: [
      { wizard: "handicap", cell: { golfRegion: "International", tier: "solid" }, count: 1 }, // was 0, now 1: better
    ] as Starved[],
  };
  const regressions = computeRegressions(current, improvedBaseline);
  assert.deepEqual(regressions, []);
});

test("SYNTHETIC: buildBaseline round-trips into a baseline that reports zero regressions against itself", () => {
  const underTagged: UnderTagged[] = [{ itemId: "x", kind: "residence", missingWizards: ["moh"] }];
  const orphaned: Orphaned[] = [{ itemId: "y", kind: "golf-course", wizard: "handicap" }];
  const starved: Starved[] = [{ wizard: "handicap", cell: { golfRegion: "International", tier: "budget" }, count: 0 }];

  const built = buildBaseline(underTagged, orphaned, starved);
  const regressions = computeRegressions({ underTagged, orphaned, starved }, built);
  assert.deepEqual(regressions, []);
});

// ─── SYNTHETIC: buildCoverageMatrix ─────────────────────────────────────────

function fakeRow(overrides: Partial<BackfilledRow>): BackfilledRow {
  return {
    id: "synthetic-item",
    dataset: "residence",
    kind: "residence",
    preWizards: [],
    coreWizards: [],
    postWizards: [],
    audiences: [],
    products: [],
    expand: [],
    ...overrides,
  };
}

test("SYNTHETIC: buildCoverageMatrix counts rows per wizard x dataset cell", () => {
  const rows: BackfilledRow[] = [
    fakeRow({ id: "r1", dataset: "residence", postWizards: ["offsite-retreat", "offsite-outing"] }),
    fakeRow({ id: "r2", dataset: "residence", postWizards: ["offsite-retreat"] }),
    fakeRow({ id: "g1", dataset: "golf", postWizards: ["handicap"] }),
  ];
  const matrix = buildCoverageMatrix(rows);
  assert.equal(matrix["offsite-retreat"].residence, 2);
  assert.equal(matrix["offsite-outing"].residence, 1);
  assert.equal(matrix.handicap.golf, 1);
  assert.equal(matrix.bestman.residence, 0);
});

// ─── FULL RUN: runAudit() against the real universe + committed baseline ───

test("FULL RUN: runAudit() returns the three finding arrays plus an exitCode", () => {
  const result = runAudit({ writeFiles: false });
  assert.ok(Array.isArray(result.underTagged));
  assert.ok(Array.isArray(result.orphaned));
  assert.ok(Array.isArray(result.starved));
  assert.ok(Array.isArray(result.regressions));
  assert.equal(typeof result.exitCode, "number");
});

test("FULL RUN: the canonical universe reports zero regressions against the committed baseline (known gaps don't fail the build)", () => {
  const result = runAudit({ writeFiles: false });
  assert.deepEqual(
    result.regressions,
    [],
    `expected zero regressions vs docs/audit-baseline.json, got: ${JSON.stringify(result.regressions)}`,
  );
  assert.equal(result.exitCode, 0);
});

test("FULL RUN: the current universe is clean (0 under-tagged, 0 orphaned) and starved never exceeds the committed baseline", () => {
  // under-tagged / orphaned are true invariants — the correct assertion is
  // the absolute 0, and any nonzero value is a real reachability regression.
  //
  // Starved is NOT an invariant: it's a DISCOVERY count that legitimately moves
  // whenever the catalog grows (72 → 65 when the sanctioned golf/residence
  // expansion filled several thin cells). This used to assert `=== 65`, which
  // had already drifted once and does nothing the regression gate doesn't
  // already do better: `docs/audit-baseline.json` tracks starvation PER CELL,
  // so it catches "a different cell got worse" — which an aggregate count can
  // hide entirely (one cell improving while another regresses nets to zero).
  //
  // So: assert the direction against the committed baseline (starvation must
  // never grow) and let `computeRegressions` own the per-cell detail. Catalog
  // growth makes this pass by getting better, not by needing a number edited.
  const result = runAudit({ writeFiles: false });
  assert.equal(result.underTagged.length, 0, "under-tagged must stay at 0 — a nonzero value is a real regression");
  assert.equal(result.orphaned.length, 0, "orphaned must stay at 0 — a nonzero value is a real regression");

  const committed = JSON.parse(
    readFileSync(join(DOCS_DIR, "audit-baseline.json"), "utf-8"),
  ) as AuditBaseline;
  const baselineStarvedCells = Object.keys(committed.starvedCells).length;
  assert.ok(
    result.starved.length <= baselineStarvedCells,
    `starved cells (${result.starved.length}) must not exceed the committed baseline (${baselineStarvedCells}); ` +
      `run \`npx tsx scripts/audit/index.ts --update-baseline\` only when the increase is understood and intended`,
  );
  assert.equal(result.regressions.length, 0, `no per-cell regressions vs the baseline: ${JSON.stringify(result.regressions)}`);
});

test("FULL RUN: runAudit() writes docs/coverage-matrix.md and docs/audit-report.json with expected top-level shape", () => {
  runAudit({ writeFiles: true });

  const matrixPath = join(DOCS_DIR, "coverage-matrix.md");
  const reportPath = join(DOCS_DIR, "audit-report.json");
  assert.ok(existsSync(matrixPath), "coverage-matrix.md should exist after runAudit()");
  assert.ok(existsSync(reportPath), "audit-report.json should exist after runAudit()");

  const matrixMd = readFileSync(matrixPath, "utf-8");
  assert.match(matrixMd, /# Coverage matrix/);
  assert.match(matrixMd, /bestman/);
  assert.match(matrixMd, /Regression gate/);

  const report = JSON.parse(readFileSync(reportPath, "utf-8"));
  // Deliberately ABSENT (2026-08-06). This assertion used to require
  // `generatedAt`, which changed on every run and left the committed artifact
  // permanently dirty — read by loop_runner._repo_busy() as "a human is
  // mid-work", which deadlocked the fleet's autonomous loop for two weeks.
  // See scripts/audit-report-determinism.test.ts.
  assert.ok(!("generatedAt" in report), "the report must carry no volatile timestamp");
  assert.ok(Array.isArray(report.underTagged));
  assert.ok(Array.isArray(report.orphaned));
  assert.ok(Array.isArray(report.starved));
  assert.ok(Array.isArray(report.regressions));
  assert.equal(typeof report.exitCode, "number");
});

// ---------------------------------------------------------------------------
// The coverage matrix must cover EVERY wizard.
//
// Regression guard for a real false-green found 2026-07-31 while adding the
// friendsmoon/engagedmoon wizards: `ALL_WIZARDS` in index.ts was a hand-copied
// literal of the then-six names. A seventh and eighth wizard were absent from
// it, so `buildCoverageMatrix` never created their rows and the `!(w in matrix)
// continue` guard at the row loop silently dropped every one of their tags.
// The audit then reported "0 under-tagged, 0 orphaned, 65 starved — no
// regressions" and rendered a matrix with no row for either wizard. Green, and
// wrong: it certified coverage for wizards it had not looked at.
//
// Typecheck cannot catch this — `ALL_WIZARDS` is a `WizardTag[]`, not a
// `Record<WizardTag, …>`, so a missing member is a shorter array, not a type
// error. Only a runtime assertion against the tag vocabulary closes it.
test("coverage matrix is keyed by every WizardTag", () => {
  const matrix = buildCoverageMatrix([]);
  assert.deepEqual(
    Object.keys(matrix).sort(),
    [...ALL_WIZARD_TAGS].sort(),
    "buildCoverageMatrix must emit a row per wizard — a wizard missing here is " +
      "invisible to the audit and reads as fully covered",
  );
});

test("rendered coverage matrix has a row per wizard", () => {
  const md = renderCoverageMatrixMd(buildCoverageMatrix([]), [], []);
  for (const wizard of ALL_WIZARD_TAGS) {
    assert.ok(
      md.includes(`| ${wizard} |`),
      `coverage-matrix.md is missing a row for "${wizard}"`,
    );
  }
});
