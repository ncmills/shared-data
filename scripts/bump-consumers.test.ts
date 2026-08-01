// bump-consumers.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rewriteDep, verifyPin } from "./bump-consumers";

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

// ─── verifyPin (2026-08-01) ─────────────────────────────────────────────────
//
// Bumping the three party consumers to 46fe9c7 rewrote every package.json but
// left all three LOCKFILES resolving 8a69187 — `npm install --package-lock-only`
// reported "up to date" and re-resolved nothing. A deploy installs from the
// lockfile, so pushing that would have shipped the OLD data while every file on
// disk claimed the new SHA. Caught by hand; now caught by code.
test("verifyPin ACCEPTS a lockfile resolving the requested sha", () => {
  const dir = mkdtempSync(join(tmpdir(), "verify-pin-ok-"));
  writeFileSync(
    join(dir, "package-lock.json"),
    JSON.stringify({
      packages: {
        "node_modules/shared-data": {
          resolved: "git+ssh://git@github.com/ncmills/shared-data.git#46fe9c7b1ea14a7a3eab414101aed89f2ac9afa9",
        },
      },
    }),
  );
  try {
    verifyPin(dir, "46fe9c7");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyPin THROWS when the lockfile still resolves the previous sha", () => {
  const dir = mkdtempSync(join(tmpdir(), "verify-pin-bad-"));
  writeFileSync(
    join(dir, "package-lock.json"),
    JSON.stringify({
      packages: {
        "node_modules/shared-data": {
          resolved: "git+ssh://git@github.com/ncmills/shared-data.git#8a6918792604c03a1dd9b37abbffcc679732094e",
        },
      },
    }),
  );
  try {
    assert.throws(() => verifyPin(dir, "46fe9c7"), /LOCKFILE MISMATCH/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
