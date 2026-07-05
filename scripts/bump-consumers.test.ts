// bump-consumers.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteDep } from "./bump-consumers";

const DEP = "shared-data";
const REPO = "github:ncmills/shared-data";

function pkgJson(depValue: string): string {
  return JSON.stringify(
    {
      name: "some-consumer",
      version: "0.1.0",
      dependencies: {
        next: "16.1.7",
        [DEP]: depValue,
      },
    },
    null,
    2,
  );
}

test("rewriteDep pins an unpinned (floating main) dep to the given SHA", () => {
  const before = pkgJson(REPO);
  const after = rewriteDep(before, "abc123");
  const parsed = JSON.parse(after);
  assert.strictEqual(parsed.dependencies[DEP], `${REPO}#abc123`);
});

test("rewriteDep is idempotent — re-pinning an already-pinned dep REPLACES the SHA, does not append a second #", () => {
  const oncePinned = rewriteDep(pkgJson(REPO), "abc123");
  const rePinned = rewriteDep(oncePinned, "def456");
  const parsed = JSON.parse(rePinned);
  assert.strictEqual(parsed.dependencies[DEP], `${REPO}#def456`);
  // Guard against a naive string-append bug: exactly one '#' in the value.
  assert.strictEqual((parsed.dependencies[DEP].match(/#/g) ?? []).length, 1);
});

test("rewriteDep pinning to the same SHA it already has is a no-op value", () => {
  const pinned = rewriteDep(pkgJson(REPO), "abc123");
  const rePinned = rewriteDep(pinned, "abc123");
  assert.strictEqual(JSON.parse(rePinned).dependencies[DEP], `${REPO}#abc123`);
});

test("rewriteDep leaves the rest of package.json untouched", () => {
  const before = pkgJson(REPO);
  const after = rewriteDep(before, "abc123");
  const parsedBefore = JSON.parse(before);
  const parsedAfter = JSON.parse(after);
  assert.strictEqual(parsedAfter.name, parsedBefore.name);
  assert.strictEqual(parsedAfter.dependencies.next, parsedBefore.dependencies.next);
});

test("rewriteDep throws a clear error when the dep is missing entirely", () => {
  const noDepJson = JSON.stringify({ name: "no-dep", dependencies: { next: "16.1.7" } });
  assert.throws(() => rewriteDep(noDepJson, "abc123"), /shared-data/);
});
