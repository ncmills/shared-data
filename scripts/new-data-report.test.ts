// new-data-report.test.ts — the adoption queue.
//
// SYNTHETIC tests prove the queue logic against a hand-built universe, so the
// assertions stay true as real rows come and go. One LIVE test pins the
// specific regression that motivated the script: a row tagged for a wizard
// whose `type` the overlay does not recognise is dropped with no signal.
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildAdoptionQueue, renderMarkdown } from "./new-data-report";
import { sharedDestinations } from "../src/index";
import { BESTMAN_ACTIVITY_TYPES } from "../src/destinations-overlay";

/** Minimal baked-destination shape — only the fields the queue reads. */
function dest(id: string, activities: { name: string; type: string; wizards: string[] }[]) {
  return { id, activities } as unknown as (typeof sharedDestinations)[number];
}

const REGISTRY = [
  {
    wizard: "moh" as const,
    site: "example.com",
    repo: "~/example",
    allowlist: new Set(["spa", "hiking"]),
  },
];

test("counts a tagged row whose type IS allowlisted as surfaced", () => {
  const [q] = buildAdoptionQueue([dest("a-tx", [{ name: "Spa", type: "spa", wizards: ["moh"] }])], REGISTRY);
  assert.equal(q.surfaced, 1);
  assert.equal(q.declined, 0);
  assert.deepEqual(q.types, []);
});

test("counts a tagged row whose type is NOT allowlisted as silently dropped", () => {
  const [q] = buildAdoptionQueue(
    [dest("a-tx", [{ name: "Sleigh", type: "sleigh-ride", wizards: ["moh"] }])],
    REGISTRY,
  );
  assert.equal(q.surfaced, 0);
  assert.equal(q.declined, 1);
  assert.equal(q.types.length, 1);
  assert.equal(q.types[0].type, "sleigh-ride");
  assert.equal(q.types[0].rows, 1);
  assert.equal(q.types[0].destinations, 1);
  assert.deepEqual(q.types[0].examples, [{ destination: "a-tx", name: "Sleigh" }]);
});

test("ignores rows not tagged for the wizard at all", () => {
  const [q] = buildAdoptionQueue(
    [dest("a-tx", [{ name: "Poker", type: "poker-night", wizards: ["bestman"] }])],
    REGISTRY,
  );
  assert.equal(q.surfaced, 0);
  assert.equal(q.declined, 0);
});

test("aggregates one type across destinations and caps examples at 3", () => {
  const rows = ["a-tx", "b-tx", "c-tx", "d-tx"].map((id) =>
    dest(id, [{ name: `Yacht ${id}`, type: "yacht-charter", wizards: ["moh"] }]),
  );
  const [q] = buildAdoptionQueue(rows, REGISTRY);
  assert.equal(q.types[0].rows, 4);
  assert.equal(q.types[0].destinations, 4);
  assert.equal(q.types[0].examples.length, 3, "examples are a sample, not the full list");
});

test("sorts types by row count, descending", () => {
  const [q] = buildAdoptionQueue(
    [
      dest("a-tx", [
        { name: "One", type: "rare-type", wizards: ["moh"] },
        { name: "Two", type: "common-type", wizards: ["moh"] },
        { name: "Three", type: "common-type", wizards: ["moh"] },
      ]),
    ],
    REGISTRY,
  );
  assert.deepEqual(
    q.types.map((t) => t.type),
    ["common-type", "rare-type"],
  );
});

test("renders a clean 'nothing pending' report when every type is allowlisted", () => {
  const md = renderMarkdown(buildAdoptionQueue([dest("a-tx", [{ name: "Spa", type: "spa", wizards: ["moh"] }])], REGISTRY));
  assert.match(md, /Nothing pending/);
  assert.doesNotMatch(md, /silently dropped/);
});

test("renders the type, its counts and its examples when something is pending", () => {
  const md = renderMarkdown(
    buildAdoptionQueue([dest("nola-la", [{ name: "Brass Band", type: "parade", wizards: ["moh"] }])], REGISTRY),
  );
  assert.match(md, /`parade`/);
  assert.match(md, /Brass Band \(nola-la\)/);
});

// --- live universe -------------------------------------------------------
//
// Pins the concrete case the script was written for. The New Orleans private
// second line (brass band + NOPD escort) was added 2026-07-22 as a deliberate
// Best Man HQ centerpiece — tags.ts:102-106 records the decision that "the
// EVENT stays Best Man HQ." The row is in the cache and correctly tagged
// ["bestman"], but `second-line-parade` was never added to
// BESTMAN_ACTIVITY_TYPES, so applyBestmanOverlay drops it and it has never
// rendered on the site.
//
// This test asserts the REPORT catches that shape — it does NOT assert the bug
// stays broken. When the type is adopted into the allowlist, the row moves from
// `declined` to `surfaced` and this test still passes.
test("live: the report surfaces tagged-but-unrecognised rows for bestman", () => {
  const queues = buildAdoptionQueue(sharedDestinations);
  const bm = queues.find((q) => q.wizard === "bestman");
  assert.ok(bm, "bestman must appear in the adoption queue");

  const nola = sharedDestinations.find((d) => d.id === "new-orleans-la");
  assert.ok(nola, "new-orleans-la must exist in the universe");
  const parade = nola.activities.find((a) => a.type === "second-line-parade");
  assert.ok(parade, "the NOLA second line row must exist");
  assert.ok(parade.wizards?.includes("bestman"), "it must be tagged for bestman");

  if (BESTMAN_ACTIVITY_TYPES.has("second-line-parade")) {
    // Adopted — it should now be counted as surfaced, not declined.
    assert.ok(
      !bm.types.some((t) => t.type === "second-line-parade"),
      "an adopted type must not still appear in the queue",
    );
  } else {
    assert.ok(
      bm.types.some((t) => t.type === "second-line-parade"),
      "an unrecognised-but-tagged type must appear in the adoption queue",
    );
  }
});
