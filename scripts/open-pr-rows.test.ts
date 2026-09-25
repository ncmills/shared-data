// open-pr-rows.test.ts — the url-backfill lane must not re-propose rows that an
// open expand/* PR already carries, and must STOP rather than guess when it
// cannot find out which rows those are.
//
// Measured 2026-09-24: the lane reset to main every Tuesday and could not see
// its own open PRs, so five of them held 565 rows between them, 189 distinct.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildBackfillQueue, venueKey } from "./backfill-queue";
import { addedPatchKeys, collectPendingKeys, loadPendingKeys, PATCH_FILE } from "./open-pr-rows";
import type { CanonicalDestination } from "../src/destinations-types";

function dest(id: string, over: Partial<CanonicalDestination> = {}): CanonicalDestination {
  return {
    id,
    city: "Queue City",
    state: "MN",
    region: "midwest",
    nearestAirport: { code: "QUE", name: "Queue Intl", driveMinutes: 20 },
    bestMonths: [6],
    vibes: ["balanced"],
    score: 7,
    nightlife: [],
    dining: [],
    activities: [],
    lodging: [],
    transport: [],
    presentation: { moh: { tagline: "t", description: "d" }, bestman: { tagline: "t", description: "d" } },
    ...over,
  } as CanonicalDestination;
}

const activity = (name: string) =>
  ({
    name,
    type: "tour",
    duration: "2h",
    pricePerPerson: [10, 20],
    groupMin: 2,
    groupMax: 8,
    highlight: "h",
    bestFor: "b",
    brands: ["both"],
    wizards: ["moh", "bestman"],
  }) as never;

const patchFile = (rows: { destinationId: string; category: string; name: string }[]) =>
  `/** header */\nimport type { X } from "y";\nexport const PARTY_VENUE_PATCHES: PartyVenuePatch[] = ${JSON.stringify(
    rows.map((r) => ({ ...r, url: "https://x.test/", sourceUrl: "https://x.test/", citations: [] })),
  )};\n`;

test("a venue already proposed in an open PR is not offered again, and the skip is reported", () => {
  const d = dest("a-mn", { activities: [activity("In Open PR"), activity("Fresh Venue")] });
  const pending = new Set([venueKey("a-mn", "activity", "  in open pr ")]);

  const q = buildBackfillQueue([d], { pending });

  assert.deepEqual(q.tasks.flatMap((t) => t.venues), ["Fresh Venue"]);
  assert.equal(q.pendingSkipped, 1);
  assert.deepEqual(q.pendingVenues, ["a-mn/activity: In Open PR"]);
  // skipped, not forgotten: the row still counts as unsourced
  assert.equal(q.totalUnsourced, 2);
});

test("with no pending set the queue is unchanged (control)", () => {
  const d = dest("a-mn", { activities: [activity("In Open PR"), activity("Fresh Venue")] });
  const q = buildBackfillQueue([d]);
  assert.deepEqual(q.tasks.flatMap((t) => t.venues), ["In Open PR", "Fresh Venue"]);
  assert.equal(q.pendingSkipped, 0);
});

test("addedPatchKeys returns only the rows a branch adds over main", () => {
  const main = patchFile([{ destinationId: "a-mn", category: "dining", name: "Old" }]);
  const branch = patchFile([
    { destinationId: "a-mn", category: "dining", name: "Old" },
    { destinationId: "a-mn", category: "dining", name: "New One" },
  ]);
  assert.deepEqual(addedPatchKeys(branch, main), ["a-mn|dining|new one"]);
});

test("collectPendingKeys unions the rows of every open expand/* PR and ignores other branches", () => {
  const main = patchFile([]);
  const files: Record<string, string> = {
    [`origin/main:${PATCH_FILE}`]: main,
    [`origin/expand/url-backfill-1:${PATCH_FILE}`]: patchFile([
      { destinationId: "a-mn", category: "dining", name: "A" },
      { destinationId: "a-mn", category: "dining", name: "B" },
    ]),
    [`origin/expand/url-backfill-2:${PATCH_FILE}`]: patchFile([
      { destinationId: "a-mn", category: "dining", name: "B" },
      { destinationId: "a-mn", category: "nightlife", name: "C" },
    ]),
  };
  const res = collectPendingKeys({
    listOpenPrBranches: () => ["expand/url-backfill-2", "sn/closer-ct-x", "expand/url-backfill-1"],
    readAtRef: (ref, path) => {
      const f = files[`${ref}:${path}`];
      if (f === undefined) throw new Error(`unexpected read ${ref}`);
      return f;
    },
  });
  assert.deepEqual(res.branches.map((b) => b.branch), ["expand/url-backfill-1", "expand/url-backfill-2"]);
  assert.deepEqual(res.keys, ["a-mn|dining|a", "a-mn|dining|b", "a-mn|nightlife|c"]);
});

test("collectPendingKeys throws when the PR list cannot be read (never 'no open PRs')", () => {
  assert.throws(
    () =>
      collectPendingKeys({
        listOpenPrBranches: () => {
          throw new Error("gh: could not resolve to a Repository");
        },
        readAtRef: () => patchFile([]),
      }),
    /could not resolve/,
  );
});

test("loadPendingKeys: --auto without a file refuses; a malformed file refuses; a good file loads", () => {
  assert.throws(() => loadPendingKeys(undefined, true), /--auto needs --pending-keys/);
  assert.equal(loadPendingKeys(undefined, false).size, 0);

  const dir = mkdtempSync(join(tmpdir(), "open-pr-rows-"));
  assert.throws(() => loadPendingKeys(join(dir, "absent.json"), true), /does not exist/);
  const bad = join(dir, "bad.json");
  writeFileSync(bad, JSON.stringify({ branches: [] }));
  assert.throws(() => loadPendingKeys(bad, true), /malformed/);
  const good = join(dir, "good.json");
  writeFileSync(good, JSON.stringify({ generatedAt: "x", branches: [], keys: ["a|b|c"] }));
  assert.deepEqual([...loadPendingKeys(good, true)], ["a|b|c"]);
});

test("the CLI exits non-zero and writes NOTHING when gh fails", () => {
  const dir = mkdtempSync(join(tmpdir(), "open-pr-rows-cli-"));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const fakeGh = join(bin, "gh");
  writeFileSync(fakeGh, "#!/bin/sh\necho 'gh: authentication required' >&2\nexit 1\n");
  chmodSync(fakeGh, 0o755);
  const out = join(dir, "pending.json");
  const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

  let status = 0;
  let stderr = "";
  try {
    execFileSync(process.execPath, ["--import", "tsx", "scripts/open-pr-rows.ts", `--out=${out}`], {
      cwd: repo,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    });
  } catch (e) {
    const err = e as { status: number; stderr: string };
    status = err.status;
    stderr = err.stderr;
  }
  assert.equal(status, 1);
  assert.match(stderr, /FAILED, wrote nothing: gh: authentication required/);
  assert.equal(existsSync(out), false);
});
