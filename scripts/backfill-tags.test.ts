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
  for (const d of ["party", "golf", "residence", "golf-destination", "moh-local", "bestman-local"] as const) {
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

test("REACH: EVERY golf-destination row routes to handicap", () => {
  // This used to assert the backfill ADDED handicap to rows tagged `["tdf"]`.
  // That was an artifact of the migration state: since the tdf wizard was
  // retired (2026-07-31) the rows are natively `["handicap"]`, so nothing can
  // "gain" it and the old test could only ever fail.
  //
  // The durable property is REACH, not the delta — every golf destination must
  // end up routed to Handicap HQ, which is the only site that renders them.
  const golfDests = rows.filter((r) => r.dataset === "golf-destination");
  assert.ok(golfDests.length > 0, "expected golf-destination rows in the backfilled universe");
  const unreached = golfDests.filter((r) => !r.postWizards.includes("handicap"));
  assert.deepEqual(
    unreached.map((r) => r.id).slice(0, 5),
    [],
    `${unreached.length} golf-destination row(s) do not route to handicap`,
  );
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

test("CORE REACH: golf rows now BAKE bestman (golf intended on BestMan HQ) and never moh", () => {
  // golf→bestman is LIVE core reach now (BM engine reads courses via coursesForCity),
  // so bestman SHOULD appear in golf's baked post; moh must still never appear.
  const golf = rows.filter((r) => r.dataset === "golf");
  assert.ok(golf.length > 0, "expected golf rows in the universe");
  for (const r of golf) {
    assert.ok(r.postWizards.includes("bestman"), `${r.id}: golf should bake bestman as core reach`);
    assert.ok(!r.postWizards.includes("moh"), `${r.id}: golf must never bake moh`);
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

test("EXPAND SET: golf courses NO LONGER contribute a bestman expand entry (golf→bestman is core now)", () => {
  const expandSet = buildExpandSet(rows);
  const golfBestman = expandSet.filter((e) => e.kind === "golf-course" && e.targetWizard === "bestman");
  assert.equal(golfBestman.length, 0, "golf-course→bestman is live core reach, not an expand candidate");
  // the expand set is still non-trivial: residences legitimately expand to party
  // brands (party engines don't read residences yet).
  const residenceParty = expandSet.filter(
    (e) => e.kind === "residence" && (e.targetWizard === "bestman" || e.targetWizard === "moh"),
  );
  assert.ok(residenceParty.length > 0, "residence party expansion candidates should remain in the expand set");
  // expand entries must carry a reason
  for (const e of expandSet) assert.ok(e.reason && e.reason.length > 0, `expand entry ${e.id} missing reason`);
});
