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
  computeRegressions,
  type AuditBaseline,
} from "./index";
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
  const orphaned: Orphaned[] = [{ itemId: "y", kind: "golf-course", wizard: "tdf" }];
  const starved: Starved[] = [{ wizard: "tdf", cell: { golfRegion: "International", tier: "budget" }, count: 0 }];

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
    fakeRow({ id: "g1", dataset: "golf", postWizards: ["handicap", "tdf"] }),
  ];
  const matrix = buildCoverageMatrix(rows);
  assert.equal(matrix["offsite-retreat"].residence, 2);
  assert.equal(matrix["offsite-outing"].residence, 1);
  assert.equal(matrix.handicap.golf, 1);
  assert.equal(matrix.tdf.golf, 1);
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

test("FULL RUN: the current universe matches the known-good counts (0 under-tagged, 0 orphaned, 65 starved)", () => {
  // Starved dropped 72 → 65 when the sanctioned golf/residence expansion
  // (github:ncmills/shared-data#expand/true, +18 rows: golf+5, residence+13)
  // filled several previously-thin cells — notably International×budget golf,
  // which went 0 → 3 courses in ALL_GOLF_COURSES and is no longer starved.
  // under-tagged/orphaned stay at 0 (no reachability regressions).
  const result = runAudit({ writeFiles: false });
  assert.equal(result.underTagged.length, 0);
  assert.equal(result.orphaned.length, 0);
  assert.equal(result.starved.length, 65);
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
  assert.ok("generatedAt" in report);
  assert.ok(Array.isArray(report.underTagged));
  assert.ok(Array.isArray(report.orphaned));
  assert.ok(Array.isArray(report.starved));
  assert.ok(Array.isArray(report.regressions));
  assert.equal(typeof report.exitCode, "number");
});
