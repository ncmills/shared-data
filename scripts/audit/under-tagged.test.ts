// under-tagged.test.ts — audit check #1: rules ↔ backfill consistency guard.
//
// The synthetic-item tests prove the CHECKER's logic in isolation (a
// deliberately stripped `postWizards` must be reported as under-tagged) —
// this must pass regardless of what the real universe's full-run count is.
// The full-run test proves the current universe is clean (~0), which is the
// EXPECTED, CORRECT state post-Task-7 (the backfill unions core by
// construction) — not evidence the checker is a no-op.
import { test } from "node:test";
import assert from "node:assert/strict";

import { findUnderTagged, findUnderTaggedIn, type UnderTagged } from "./under-tagged";
import type { BackfilledRow } from "../backfill-tags";

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

test("SYNTHETIC: a row with a deliberately stripped wizards field is reported as under-tagged", () => {
  const stripped = fakeRow({
    id: "synthetic-residence-1",
    kind: "residence",
    coreWizards: ["offsite-retreat", "offsite-outing"],
    // deliberately stripped: rules say offsite-outing belongs, baked view lacks it
    postWizards: ["offsite-retreat"],
  });

  const result = findUnderTaggedIn([stripped]);

  assert.equal(result.length, 1);
  assert.equal(result[0].itemId, "synthetic-residence-1");
  assert.equal(result[0].kind, "residence");
  assert.deepEqual(result[0].missingWizards, ["offsite-outing"]);
});

test("SYNTHETIC: a fully-consistent row (core ⊆ post) is NOT reported", () => {
  const consistent = fakeRow({
    id: "synthetic-golf-1",
    kind: "golf-course",
    coreWizards: ["handicap"],
    postWizards: ["tdf", "handicap"],
  });

  assert.deepEqual(findUnderTaggedIn([consistent]), []);
});

test("SYNTHETIC: multiple missing wizards are all reported for one row", () => {
  const badlyStripped = fakeRow({
    id: "synthetic-experience-1",
    kind: "experience",
    coreWizards: ["bestman", "moh"],
    postWizards: [],
  });

  const result = findUnderTaggedIn([badlyStripped]);
  assert.equal(result.length, 1);
  assert.deepEqual([...result[0].missingWizards].sort(), ["bestman", "moh"]);
});

test("SYNTHETIC: locals (moh-local/bestman-local) are excluded from the EntityKind report even if stripped", () => {
  const strippedLocal = fakeRow({
    id: "synthetic-moh-local-1",
    dataset: "moh-local",
    kind: "moh-local",
    coreWizards: ["moh"],
    postWizards: [], // would look under-tagged, but locals never route through deriveRouting
  });

  assert.deepEqual(findUnderTaggedIn([strippedLocal]), []);
});

test("FULL RUN: the canonical baked universe reports ~zero under-tagged rows", () => {
  // Expected and correct post-Task-7: backfillUniverse() bakes postWizards as
  // union(preWizards, coreWizards), so core ⊆ post holds by construction. A
  // non-zero count here would mean a future rule/backfill change broke that
  // invariant — that's exactly what this guard is for.
  const under: UnderTagged[] = findUnderTagged();
  assert.equal(
    under.length,
    0,
    `expected zero under-tagged rows in the canonical baked view, got ${under.length}: ${JSON.stringify(under.slice(0, 5))}`,
  );
});
