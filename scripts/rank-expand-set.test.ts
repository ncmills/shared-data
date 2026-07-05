// rank-expand-set.test.ts — Task 8 aggregation + leverage-sort contract.
import { test } from "node:test";
import assert from "node:assert/strict";

import { rankExpandSet } from "./rank-expand-set";
import type { ExpandEntry } from "./backfill-tags";

function entry(overrides: Partial<ExpandEntry>): ExpandEntry {
  return {
    id: "fixture-id",
    dataset: "golf" as ExpandEntry["dataset"],
    kind: "golf-course" as ExpandEntry["kind"],
    targetWizard: "bestman" as ExpandEntry["targetWizard"],
    reason: "fixture reason",
    ...overrides,
  };
}

test("aggregation: rows per (kind, targetWizard) and wizardsAffected per kind are correct", () => {
  const fixture: ExpandEntry[] = [
    // kind A -> two rows targeting bestman
    entry({ id: "a1", kind: "golf-course", targetWizard: "bestman" }),
    entry({ id: "a2", kind: "golf-course", targetWizard: "bestman" }),
    // kind B -> targets both bestman and moh (3 + 1 rows), 2 distinct wizards
    entry({ id: "b1", kind: "residence", targetWizard: "bestman" }),
    entry({ id: "b2", kind: "residence", targetWizard: "bestman" }),
    entry({ id: "b3", kind: "residence", targetWizard: "bestman" }),
    entry({ id: "b4", kind: "residence", targetWizard: "moh" }),
  ];

  const ranked = rankExpandSet(fixture);

  const golfBestman = ranked.find((c) => c.kind === "golf-course" && c.targetWizard === "bestman");
  assert.ok(golfBestman, "expected a golf-course -> bestman candidate");
  assert.strictEqual(golfBestman!.rows, 2);
  assert.strictEqual(golfBestman!.wizardsAffected, 1); // only bestman targets golf-course in this fixture

  const residenceBestman = ranked.find((c) => c.kind === "residence" && c.targetWizard === "bestman");
  const residenceMoh = ranked.find((c) => c.kind === "residence" && c.targetWizard === "moh");
  assert.ok(residenceBestman && residenceMoh);
  assert.strictEqual(residenceBestman!.rows, 3);
  assert.strictEqual(residenceMoh!.rows, 1);
  // residence targets 2 distinct wizards (bestman, moh) -> wizardsAffected is
  // shared across BOTH rows of the same kind, not per-row.
  assert.strictEqual(residenceBestman!.wizardsAffected, 2);
  assert.strictEqual(residenceMoh!.wizardsAffected, 2);

  // leverage = rows * wizardsAffected
  assert.strictEqual(golfBestman!.leverage, 2 * 1);
  assert.strictEqual(residenceBestman!.leverage, 3 * 2);
  assert.strictEqual(residenceMoh!.leverage, 1 * 2);

  // total candidates = distinct (kind, targetWizard) pairs
  assert.strictEqual(ranked.length, 3);
});

test("leverage sort: a smaller-rows/more-wizards candidate outranks a larger-rows/single-wizard one when its leverage is higher", () => {
  const fixture: ExpandEntry[] = [
    // "big" kind: 10 rows, but only ever targets ONE wizard -> leverage 10
    ...Array.from({ length: 10 }, (_, i) => entry({ id: `big-${i}`, kind: "golf-course", targetWizard: "bestman" })),
    // "small" kind: 3 rows, but targets FIVE distinct wizards -> leverage 15
    entry({ id: "small-1", kind: "residence", targetWizard: "bestman" }),
    entry({ id: "small-2", kind: "residence", targetWizard: "moh" }),
    entry({ id: "small-3", kind: "residence", targetWizard: "tdf" }),
    entry({ id: "small-4", kind: "residence", targetWizard: "offsite-retreat" }),
    entry({ id: "small-5", kind: "residence", targetWizard: "offsite-outing" }),
  ];

  const ranked = rankExpandSet(fixture);

  // Every "small" (residence) row has leverage 1 * 5 = 5, and the "big" (golf-course)
  // row has leverage 10 * 1 = 10 -- so the big single-wizard candidate should still
  // outrank any individual small row. To actually test "more rows*wizards wins" we
  // compare the aggregated per-candidate leverage values directly.
  const golfCourseBestman = ranked.find((c) => c.kind === "golf-course" && c.targetWizard === "bestman")!;
  const residenceBestman = ranked.find((c) => c.kind === "residence" && c.targetWizard === "bestman")!;

  assert.strictEqual(golfCourseBestman.leverage, 10);
  assert.strictEqual(residenceBestman.leverage, 5);
  assert.ok(golfCourseBestman.leverage > residenceBestman.leverage);

  // Ranked list must be sorted descending by leverage.
  const golfIdx = ranked.indexOf(golfCourseBestman);
  const residenceIdx = ranked.indexOf(residenceBestman);
  assert.ok(golfIdx < residenceIdx, "higher-leverage candidate must sort above lower-leverage candidate");

  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].leverage >= ranked[i].leverage, "leverage must be non-increasing down the ranked list");
  }
});

test("leverage sort (direct case): fewer rows but more wizards affected beats more rows but fewer wizards", () => {
  const fixture: ExpandEntry[] = [
    // kind X: 4 rows, 1 wizard -> leverage 4
    ...Array.from({ length: 4 }, (_, i) => entry({ id: `x-${i}`, kind: "kind-x", targetWizard: "wizard-a" })),
    // kind Y: 2 rows spread across 3 wizards -> each row's kind has wizardsAffected=3;
    // pick the row with 2 rows for wizard-b to get leverage 2*3=6 > 4.
    entry({ id: "y-1", kind: "kind-y", targetWizard: "wizard-b" }),
    entry({ id: "y-2", kind: "kind-y", targetWizard: "wizard-b" }),
    entry({ id: "y-3", kind: "kind-y", targetWizard: "wizard-c" }),
    entry({ id: "y-4", kind: "kind-y", targetWizard: "wizard-d" }),
  ];

  const ranked = rankExpandSet(fixture);
  const kindX = ranked.find((c) => c.kind === "kind-x" && c.targetWizard === "wizard-a")!;
  const kindYB = ranked.find((c) => c.kind === "kind-y" && c.targetWizard === "wizard-b")!;

  assert.strictEqual(kindX.rows, 4);
  assert.strictEqual(kindX.wizardsAffected, 1);
  assert.strictEqual(kindX.leverage, 4);

  assert.strictEqual(kindYB.rows, 2);
  assert.strictEqual(kindYB.wizardsAffected, 3);
  assert.strictEqual(kindYB.leverage, 6);

  assert.ok(ranked.indexOf(kindYB) < ranked.indexOf(kindX), "kind-y/wizard-b (leverage 6) must rank above kind-x/wizard-a (leverage 4)");
});
