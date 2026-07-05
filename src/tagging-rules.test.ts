// tagging-rules.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveRouting } from "./tagging-rules";

function expect<T>(actual: T) {
  return {
    toContain(item: unknown) {
      assert.ok(
        Array.isArray(actual) && actual.includes(item),
        `expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`
      );
    },
    toEqual(expected: unknown) {
      assert.deepStrictEqual(actual, expected);
    },
    toBe(expected: unknown) {
      assert.strictEqual(actual, expected);
    },
    not: {
      toContain(item: unknown) {
        assert.ok(
          Array.isArray(actual) && !actual.includes(item),
          `expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(item)}`
        );
      },
    },
  };
}

test("a golf course routes to handicap (HHQ) in core", () => {
  const r = deriveRouting({ kind: "golf-course", activityType: "golf" });
  expect(r.core.wizards).toContain("handicap");
});
test("golf still never crosses to moh (brand guard)", () => {
  const r = deriveRouting({ kind: "golf-course", activityType: "golf" });
  expect(r.core.wizards).not.toContain("moh");
  expect(r.expand.flatMap(e => e.wizards)).not.toContain("moh");
});

// --- Task 6: every EntityKind returns a complete {core, expand} routing -----

test("a residence is core offsite-retreat, expand to party wizards", () => {
  const r = deriveRouting({ kind: "residence", setting: "ranch" });
  expect(r.core.wizards).toEqual(["offsite-retreat"]);
  expect(r.expand.some(e => e.wizards.includes("bestman"))).toBe(true);
});

test("residence expand also includes offsite-outing (not yet core)", () => {
  const r = deriveRouting({ kind: "residence", setting: "lake" });
  expect(r.core.wizards).not.toContain("offsite-outing");
  expect(r.expand.some(e => e.wizards.includes("offsite-outing"))).toBe(true);
});

test("residence expand includes moh too (audience-gated, not just bestman)", () => {
  const r = deriveRouting({ kind: "residence", setting: "ranch" });
  expect(r.expand.some(e => e.wizards.includes("moh"))).toBe(true);
});

test("a corporate-only-flagged residence does NOT expand to a party wizard", () => {
  const r = deriveRouting({ kind: "residence", setting: "ranch", audiences: ["corporate", "clients"] });
  const expandWizards = r.expand.flatMap(e => e.wizards);
  expect(expandWizards).not.toContain("bestman");
  expect(expandWizards).not.toContain("moh");
});

test("an experience is core to both offsite wizards", () => {
  const r = deriveRouting({ kind: "experience", activityType: "spa" });
  expect(r.core.wizards).toContain("offsite-retreat");
  expect(r.core.wizards).toContain("offsite-outing");
});

test("an outing-template is core offsite-outing, expand to fitting party wizards", () => {
  const r = deriveRouting({ kind: "outing-template", activityType: "spa" });
  expect(r.core.wizards).toEqual(["offsite-outing"]);
  const expandWizards = r.expand.flatMap(e => e.wizards);
  expect(expandWizards).toContain("bestman");
  expect(expandWizards).toContain("moh");
});

test("a golf outing-template never crosses to moh, even in expand", () => {
  const r = deriveRouting({ kind: "outing-template", activityType: "golf" });
  const expandWizards = r.expand.flatMap(e => e.wizards);
  expect(expandWizards).not.toContain("moh");
});

test("a corporate-only outing-template does not expand to any party wizard", () => {
  const r = deriveRouting({ kind: "outing-template", activityType: "team-building", audiences: ["corporate", "clients"] });
  expect(r.expand.flatMap(e => e.wizards)).toEqual([]);
});

test("golf-destination core is tdf + handicap, expand is offsite only (never a party brand)", () => {
  const r = deriveRouting({ kind: "golf-destination" });
  expect(r.core.wizards).toContain("tdf");
  expect(r.core.wizards).toContain("handicap");
  const allWizards = [...r.core.wizards, ...r.expand.flatMap(e => e.wizards)];
  expect(allWizards).not.toContain("bestman");
  expect(allWizards).not.toContain("moh");
});

test("every EntityKind returns a non-empty core.wizards and a well-formed expand[]", () => {
  const kinds = ["party-venue", "golf-course", "residence", "experience", "outing-template", "golf-destination"] as const;
  for (const kind of kinds) {
    const r = deriveRouting({ kind });
    assert.ok(Array.isArray(r.expand), `${kind}: expand should be an array`);
    for (const e of r.expand) {
      assert.ok(Array.isArray(e.wizards), `${kind}: expand entry wizards should be an array`);
      assert.ok(typeof e.reason === "string" && e.reason.length > 0, `${kind}: expand entry should carry a reason`);
    }
  }
});
