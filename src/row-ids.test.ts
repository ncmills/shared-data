// row-ids.test.ts — CORPUS-M3a row identity: the id rules, collisions, aliases,
// overrides-by-id and the reference derivation, plus planted violations that
// must turn the identity check red.
import { test } from "node:test";
import assert from "node:assert/strict";

import { assignIds, idSlug, legacyKeyToId, partyRowIdBase, golfCourseIdBase } from "./row-ids";
import { checkRowIdentity, type RowIdentityInput } from "./row-identity-check";
import { deriveLocals } from "./locals-views";
import { deriveRow } from "./row-views";
import { OVERRIDES_BY_ID, TAG_OVERRIDES } from "./destinations-bake";
import { sharedDestinations, SHARED_GOLF_COURSES, golfDestinations, mohLocals, bestmanLocals } from "./index";
import type { CanonicalDestination } from "./destinations-types";

test("idSlug: the documented normalisation", () => {
  assert.equal(idSlug("Cúrate"), "curate");
  assert.equal(idSlug("Bill’s Tavern & Brewhouse"), "bills-tavern-and-brewhouse");
  assert.equal(idSlug("  République!! "), "republique");
  assert.throws(() => idSlug("—"), /empty slug/);
  assert.equal(partyRowIdBase("asheville-nc", "dining", "Cúrate"), "asheville-nc--dining--curate");
  assert.equal(
    golfCourseIdBase({ name: "TPC Scottsdale (Stadium Course)", city: "Scottsdale", state: "AZ" }),
    "scottsdale-az--golf--tpc-scottsdale-stadium-course",
  );
});

test("collisions disambiguate in source order", () => {
  const rows: { name: string; id?: string }[] = [{ name: "Cúrate" }, { name: "Curate" }, { name: "CURATE" }];
  assert.deepEqual(
    assignIds(rows, (r) => partyRowIdBase("x", "dining", r.name)),
    ["x--dining--curate", "x--dining--curate-2", "x--dining--curate-3"],
  );
});

test("an authored id that clashes is NOT renumbered around — it surfaces as a duplicate", () => {
  // Sabotage found 2026-09-24: when computed ids stepped around authored ones,
  // authoring "…olibea" on the NEXT row silently moved OliBea itself to
  // "…olibea-2" and verify stayed green.
  const rows = [{ name: "OliBea" }, { name: "Emilia", id: "x--dining--olibea" }];
  const ids = assignIds(rows, (r) => partyRowIdBase("x", "dining", r.name));
  assert.deepEqual(ids, ["x--dining--olibea", "x--dining--olibea"]);
  const r = checkRowIdentity({
    canonical: [{ label: "party", rows: rows.map((row, i) => ({ ...row, id: ids[i] })) }],
    views: [],
    overrideKeys: [],
    knownDeadOverrideKeys: {},
    overrideSetLabel: "party",
  });
  assert.deepEqual(r.violations, ['party: duplicate id "x--dining--olibea"']);
});

test("legacy override keys become ids; an id key passes through", () => {
  assert.equal(legacyKeyToId("bend-or|lodging|Tetherow Lodge"), "bend-or--lodging--tetherow-lodge");
  assert.equal(legacyKeyToId("bend-or--lodging--tetherow-lodge"), "bend-or--lodging--tetherow-lodge");
});

test("every canonical nested row and golf course carries a unique id (real data)", () => {
  const ids = sharedDestinations.flatMap((d) =>
    [...d.nightlife, ...d.dining, ...d.activities, ...d.lodging, ...d.transport].map((r) => r.id),
  );
  // No exact count: other test files append rows to the source files while the
  // suite runs in parallel (ingest-* tests), so the total is not this test's to own.
  assert.ok(ids.length > 6000);
  assert.ok(ids.every(Boolean));
  assert.equal(new Set(ids).size, ids.length);
  const g = SHARED_GOLF_COURSES.map((c) => c.id);
  assert.ok(g.every(Boolean));
  assert.equal(new Set(g).size, g.length);
});

test("overrides still land on the same 33 rows as the old exact-string keys (measured 2026-09-25)", () => {
  const hit: string[] = [];
  const cat = { nightlife: "nightlife", dining: "dining", activities: "activity", lodging: "lodging", transport: "transport" } as const;
  for (const d of sharedDestinations)
    for (const [arr, c] of Object.entries(cat))
      for (const r of d[arr as keyof typeof cat] as { id?: string; name: string }[])
        if (r.id && OVERRIDES_BY_ID.has(r.id)) {
          assert.ok(`${d.id}|${c}|${r.name}` in TAG_OVERRIDES, `override now reaches a different row: ${r.id}`);
          hit.push(r.id);
        }
  assert.equal(hit.length, 33);
});

test("derived copies carry ids: locals and embedded golf courses", () => {
  for (const d of [...mohLocals(), ...bestmanLocals()] as Record<string, unknown>[])
    for (const arr of ["nightlife", "dining", "activities", "lodging", "transport"])
      for (const r of d[arr] as { id?: string }[]) assert.ok(r.id, `${d.id}/${arr} row without id`);
  for (const d of golfDestinations())
    for (const c of (d.courses as { id?: string }[]) ?? []) assert.ok(c.id, `${d.id} course without id`);
});

// ── the reference mechanism, on a fixture ───────────────────────────────────
const canonDest = (rows: Record<string, unknown>[]) =>
  [{ id: "x-tn", nightlife: rows, dining: [], activities: [], lodging: [], transport: [] }] as unknown as CanonicalDestination[];

test("a local copy keeps its own value where it differs, and follows canonical elsewhere", () => {
  const canon = canonDest([{ id: "x-tn--nightlife--bar", name: "Bar", highlight: "canonical", vibe: "chill", url: "https://bar.test/" }]);
  const [d] = deriveLocals(
    [{ id: "x-tn", nightlife: [{ ref: "x-tn--nightlife--bar", set: { highlight: "brand copy", bacheloretteFriendly: true } }, { name: "Local Only" }, { name: "Local Only" }] }],
    { nightlife: ["name", "highlight", "vibe", "bacheloretteFriendly"] },
    canon,
    "fixture",
  ) as { nightlife: Record<string, unknown>[] }[];
  assert.deepEqual(d.nightlife[0], { id: "x-tn--nightlife--bar", name: "Bar", highlight: "brand copy", vibe: "chill", bacheloretteFriendly: true });
  // url is not in the view: canonical provenance does not leak into the copy
  assert.equal("url" in d.nightlife[0], false);
  assert.deepEqual(d.nightlife.slice(1).map((r) => r.id), ["x-tn--nightlife--local-only", "x-tn--nightlife--local-only-2"]);
});

test("a rename without an alias fails loudly; with the old id as an alias it resolves", () => {
  const src = [{ id: "x-tn", nightlife: [{ ref: "x-tn--nightlife--old-name" }] }];
  const order = { nightlife: ["name"] };
  assert.throws(
    () => deriveLocals(src, order, canonDest([{ id: "x-tn--nightlife--new-name", name: "New Name" }]), "fixture"),
    /resolves to no canonical row.*aliases: \["x-tn--nightlife--old-name"\]/,
  );
  const [d] = deriveLocals(
    src,
    order,
    canonDest([{ id: "x-tn--nightlife--new-name", aliases: ["x-tn--nightlife--old-name"], name: "New Name" }]),
    "fixture",
  ) as { nightlife: Record<string, unknown>[] }[];
  assert.deepEqual(d.nightlife[0], { id: "x-tn--nightlife--new-name", aliases: ["x-tn--nightlife--old-name"], name: "New Name" });
});

test("a derived row is a clone: mutating it cannot reach the canonical row", () => {
  const canon = { id: "a", name: "A", pricePerPerson: [10, 20] };
  const row = deriveRow({ ref: "a" }, canon, ["name", "pricePerPerson"]);
  (row.pricePerPerson as number[])[0] = 999;
  assert.deepEqual(canon.pricePerPerson, [10, 20]);
});

// ── the identity check goes red on each planted violation ───────────────────
const base = (): RowIdentityInput => ({
  canonical: [{ label: "party", rows: [{ id: "a--dining--x", name: "X" }, { id: "a--dining--y", name: "Y", aliases: ["a--dining--old-y"] }] }],
  views: [{ label: "moh a/dining", rows: [{ id: "a--dining--x" }, { id: "a--dining--local" }] }],
  overrideKeys: ["a|dining|X", "a--dining--old-y"],
  knownDeadOverrideKeys: {},
  overrideSetLabel: "party",
});

test("identity check: control is clean", () => {
  const r = checkRowIdentity(base());
  assert.deepEqual(r.violations, []);
  assert.equal(r.counts["overrides.resolved"], 2);
});

test("identity check: planted violations each go red", () => {
  const plant = (mut: (i: RowIdentityInput) => void, re: RegExp) => {
    const i = base();
    mut(i);
    const v = checkRowIdentity(i).violations;
    assert.ok(v.some((m) => re.test(m)), `expected ${re} in ${JSON.stringify(v)}`);
  };
  plant((i) => (i.canonical[0].rows as object[]).push({ id: "a--dining--x", name: "X again" }), /duplicate id "a--dining--x"/);
  plant((i) => (i.canonical[0].rows as object[]).push({ name: "No Id" }), /"No Id" has no id/);
  plant((i) => (i.views[0].rows as object[]).push({ id: "a--dining--local" }), /moh a\/dining: duplicate id/);
  plant((i) => (i.views[0].rows as object[]).push({ name: "bare" }), /"bare" has no id/);
  plant((i) => ((i.canonical[0].rows[0] as { aliases?: string[] }).aliases = ["a--dining--y"]), /alias "a--dining--y".*is also a row id/);
  plant((i) => ((i.canonical[0].rows[0] as { aliases?: string[] }).aliases = ["a--dining--old-y"]), /claimed by two rows/);
  plant((i) => i.overrideKeys.push("a|dining|Gone"), /override "a\|dining\|Gone" resolves to no row/);
  plant((i) => (i.knownDeadOverrideKeys["a|dining|X"] = "stale"), /known-dead but resolves again/);
});
