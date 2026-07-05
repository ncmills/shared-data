// backfill-tags.test.ts — the cross-tag backfill contract.
//
// Task 7: applying deriveRouting().core across the WHOLE universe must only ever
// ADD wizard reachability (union, never subtract), and must actually fire at
// least one cross-tag. Brand protection (golf ↛ moh, corporate ↛ party,
// party-brand locals stay single-brand) must survive the backfill.
import { test } from "node:test";
import assert from "node:assert/strict";
import { backfillUniverse, buildExpandSet, type BackfilledRow } from "./backfill-tags";

const rows: BackfilledRow[] = backfillUniverse();

const isSuperset = <T>(post: T[], pre: T[]) => pre.every((x) => post.includes(x));

test("universe is non-trivial (every dataset represented)", () => {
  const datasets = new Set(rows.map((r) => r.dataset));
  for (const d of ["party", "golf", "residence", "tdf-destination", "moh-local", "bestman-local"] as const) {
    assert.ok(datasets.has(d), `missing dataset ${d}`);
  }
  assert.ok(rows.length > 7000, `expected a large universe, got ${rows.length}`);
});

test("SUPERSET INVARIANT: every row's post wizards ⊇ its pre wizards", () => {
  for (const r of rows) {
    assert.ok(
      isSuperset(r.postWizards, r.preWizards),
      `${r.dataset}/${r.id}: post ${JSON.stringify(r.postWizards)} dropped a pre wizard ${JSON.stringify(r.preWizards)}`,
    );
  }
});

test("backfill actually applied: core ⊆ post for every row", () => {
  for (const r of rows) {
    assert.ok(
      isSuperset(r.postWizards, r.coreWizards),
      `${r.dataset}/${r.id}: core ${JSON.stringify(r.coreWizards)} not fully baked into post ${JSON.stringify(r.postWizards)}`,
    );
  }
});

test("CROSS-TAG FIRES: ≥1 residence GAINS offsite-outing it lacked pre-backfill", () => {
  const gained = rows.filter(
    (r) =>
      r.dataset === "residence" &&
      !r.preWizards.includes("offsite-outing") &&
      r.postWizards.includes("offsite-outing"),
  );
  assert.ok(gained.length > 0, "no residence gained offsite-outing — cross-tag did not fire");
});

test("CROSS-TAG FIRES: ≥1 tdf-destination GAINS handicap", () => {
  const gained = rows.filter(
    (r) =>
      r.dataset === "tdf-destination" &&
      !r.preWizards.includes("handicap") &&
      r.postWizards.includes("handicap"),
  );
  assert.ok(gained.length > 0, "no tdf-destination gained handicap — cross-tag did not fire");
});

test("BRAND GUARD: no golf row ever routes to moh (post or expand)", () => {
  for (const r of rows.filter((r) => r.dataset === "golf")) {
    assert.ok(!r.postWizards.includes("moh"), `${r.id}: golf post leaked to moh`);
    assert.ok(
      !r.expand.flatMap((e) => e.wizards).includes("moh"),
      `${r.id}: golf expand leaked to moh`,
    );
  }
});

test("BRAND GUARD: expand reach never leaks into baked post wizards", () => {
  // golf expands to [bestman] but bestman must never appear in golf's baked post.
  for (const r of rows.filter((r) => r.dataset === "golf")) {
    assert.ok(!r.postWizards.includes("bestman"), `${r.id}: golf expand(bestman) leaked into post`);
  }
});

test("BRAND GUARD: locals stay single-brand after backfill", () => {
  for (const r of rows.filter((r) => r.dataset === "moh-local")) {
    assert.deepEqual([...r.postWizards].sort(), ["moh"], `${r.id}: moh-local drifted`);
  }
  for (const r of rows.filter((r) => r.dataset === "bestman-local")) {
    assert.deepEqual([...r.postWizards].sort(), ["bestman"], `${r.id}: bestman-local drifted`);
  }
});

test("EXPAND SET: golf courses each contribute a bestman expand entry", () => {
  const expandSet = buildExpandSet(rows);
  const golfBestman = expandSet.filter((e) => e.kind === "golf-course" && e.targetWizard === "bestman");
  assert.ok(golfBestman.length > 0, "golf-course bestman expansion candidates missing from expand set");
  // expand entries must carry a reason
  for (const e of expandSet) assert.ok(e.reason && e.reason.length > 0, `expand entry ${e.id} missing reason`);
});
