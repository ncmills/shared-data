// wiring-map.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyRepo } from "./wiring-map";

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      assert.strictEqual(actual, expected);
    },
    toContain(item: unknown) {
      assert.ok(
        Array.isArray(actual) && actual.includes(item),
        `expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`
      );
    },
  };
}

test("classifies a repo that imports sharedDestinations as wired", () => {
  const row = classifyRepo("bestman", "/Users/bignick/plan-my-party", [
    "src/data/index.ts: import { sharedDestinations } from '@/lib/shared-data'",
  ]);
  expect(row.readsShared).toBe(true);
});

test("classifies HHQ golf-atlas as a local fork", () => {
  const row = classifyRepo("handicap", "/Users/bignick/handicap-hq", [
    "src/data/golf-atlas.ts: export const GOLF_ATLAS",
  ]);
  expect(row.localForks).toContain("src/data/golf-atlas.ts");
});
