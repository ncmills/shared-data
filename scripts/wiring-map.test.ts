// wiring-map.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyRepo, runOrEmpty } from "./wiring-map";

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

test("runOrEmpty does not silently swallow a genuine failure (missing cwd) into []", () => {
  assert.throws(() => {
    runOrEmpty("grep -rn -E 'foo' src", "/Users/bignick/this-repo-does-not-exist-xyz");
  });
});

test("runOrEmpty does not silently swallow a non-1 exit code (bad invocation) into []", () => {
  assert.throws(() => {
    // grep exits 2 on a malformed invocation — distinct from exit 1's "no matches."
    runOrEmpty("grep --this-flag-does-not-exist foo src", "/Users/bignick/shared-data");
  });
});
