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
