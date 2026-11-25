import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  type Check,
  type Deps,
  type PrInfo,
  countNewRows,
  decide,
  isAllowed,
  parseArrayExport,
  runAutomerge,
} from "./automerge-data-prs";
import { buildLedger } from "./growth-daily";

const NOW = new Date("2026-11-24T09:00:00Z");
const GREEN: Check[] = [
  { name: "Coverage audit", bucket: "pass", state: "SUCCESS" },
  { name: "Schema snapshot matches the live database", bucket: "pass", state: "SUCCESS" },
];

function pr(over: Partial<PrInfo> = {}): PrInfo {
  return {
    number: 78,
    headRefName: "expand/url-backfill-20261013-030004",
    baseRefName: "main",
    author: { login: "ncmills" },
    mergeable: "MERGEABLE",
    files: [{ path: "src/party-venue-patches.ts" }, { path: "docs/pending-prs/expand/url-backfill-20261013-030004.md" }],
    ...over,
  };
}

function stub(prs: PrInfo[], checks: Record<number, Check[]>, ledger: Record<string, unknown> | null = null) {
  const calls = { merge: [] as number[], writes: [] as Record<string, unknown>[], logs: [] as string[] };
  const deps: Deps = {
    listPrs: () => prs,
    checks: (n) => checks[n] ?? [],
    rowsAdded: () => 120,
    merge: (n) => void calls.merge.push(n),
    readLedger: () => ledger,
    writeLedger: (l) => void calls.writes.push(l),
    log: (m) => void calls.logs.push(m),
  };
  return { deps, calls };
}

test("green + allowlisted -> merge called once, merged line in the ledger", () => {
  const { deps, calls } = stub([pr()], { 78: GREEN }, { status: "GREEN" });
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.deepEqual(calls.merge, [78]);
  assert.deepEqual(r.merged, [{ date: "2026-11-24", pr: 78, rows_added: 120, lane: "backfill" }]);
  assert.equal(r.red.length, 0);
  const am = calls.writes[0].autoMerge as { merged: unknown[] };
  assert.equal(calls.writes[0].status, "GREEN", "other ledger fields are kept");
  assert.equal(am.merged.length, 1);
});

test("expansion branch is lane expansion; derived slices + audit docs are allowed", () => {
  const p = pr({
    number: 90,
    headRefName: "expand/party-venue-growth-2026-11-24-expansion",
    files: ["src/party-venues-expansion.ts", "docs/coverage-matrix.md", "docs/audit-report.json", "slices/moh.json"].map((path) => ({ path })),
  });
  const { deps, calls } = stub([p], { 90: GREEN });
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.deepEqual(calls.merge, [90]);
  assert.equal(r.merged[0].lane, "expansion");
});

test("red check -> no merge + RED line with the check's reason (COULD-NOT-RUN is not excused)", () => {
  const bad: Check[] = [
    GREEN[0],
    { name: "Schema snapshot matches the live database", bucket: "fail", state: "FAILURE", description: "COULD-NOT-RUN cli_login_postgres" },
  ];
  const { deps, calls } = stub([pr()], { 78: bad });
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.deepEqual(calls.merge, []);
  assert.equal(r.red.length, 1);
  assert.match(r.red[0].reason, /COULD-NOT-RUN cli_login_postgres/);
  assert.ok(calls.logs.some((l) => l.startsWith("RED: shared-data #78 check failed")));
  assert.equal((calls.writes[0].autoMerge as { red: unknown[] }).red.length, 1);
});

test("file outside the allowlist -> no merge + RED", () => {
  const p = pr({ files: [{ path: "src/party-venue-patches.ts" }, { path: "scripts/run-backfill.ts" }] });
  const { deps, calls } = stub([p], { 78: GREEN });
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.deepEqual(calls.merge, []);
  assert.match(r.red[0].reason, /outside the data allowlist: scripts\/run-backfill\.ts/);
});

test("CONFLICTING -> no merge + RED", () => {
  const { deps, calls } = stub([pr({ mergeable: "CONFLICTING" })], { 78: GREEN });
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.deepEqual(calls.merge, []);
  assert.match(r.red[0].reason, /CONFLICTING/);
});

test("wrong author / non-expand branch / non-main base -> ignored entirely", () => {
  const prs = [
    pr({ number: 1, author: { login: "someone-else" } }),
    pr({ number: 2, headRefName: "drv/growth-daily-dryrun" }),
    pr({ number: 3, baseRefName: "drv/growth-daily-dryrun" }),
  ];
  const { deps, calls } = stub(prs, { 1: GREEN, 2: GREEN, 3: GREEN });
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.deepEqual(calls.merge, []);
  assert.deepEqual([r.red.length, r.skipped.length, calls.writes.length], [0, 0, 0]);
});

test("pending -> skipped, no red; no checks yet -> skipped", () => {
  const pend: Check[] = [GREEN[0], { name: "Schema", bucket: "pending", state: "IN_PROGRESS" }];
  const { deps, calls } = stub([pr(), pr({ number: 79 })], { 78: pend });
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.deepEqual(calls.merge, []);
  assert.equal(r.red.length, 0);
  assert.deepEqual(r.skipped.map((s) => s.pr), [78, 79]);
  assert.equal(calls.writes.length, 0);
});

test("dry run never calls merge and never writes the ledger", () => {
  const { deps, calls } = stub([pr(), pr({ number: 79, mergeable: "CONFLICTING" })], { 78: GREEN, 79: GREEN });
  runAutomerge({ apply: false, now: NOW }, deps);
  assert.deepEqual(calls.merge, []);
  assert.equal(calls.writes.length, 0);
  assert.ok(calls.logs.some((l) => l.startsWith("would merge: shared-data #78")));
});

test("a refused merge is a RED, not a merged line", () => {
  const { deps, calls } = stub([pr()], { 78: GREEN });
  deps.merge = () => {
    throw new Error("Pull request is not mergeable");
  };
  const r = runAutomerge({ apply: true, now: NOW }, deps);
  assert.equal(r.merged.length, 0);
  assert.match(r.red[0].reason, /merge failed/);
  assert.equal(calls.merge.length, 0);
});

test("same red line is not appended twice in a day", () => {
  const bad: Check[] = [{ name: "x", bucket: "fail", state: "FAILURE" }];
  const prior = { autoMerge: { merged: [], red: [{ date: "2026-11-24", pr: 78, reason: "check failed: x FAILURE" }] } };
  const { deps, calls } = stub([pr()], { 78: bad }, prior);
  runAutomerge({ apply: true, now: NOW }, deps);
  assert.equal((calls.writes[0].autoMerge as { red: unknown[] }).red.length, 1);
});

test("allowlist: data + derived only", () => {
  for (const ok of ["src/party-venue-patches.ts", "src/golf-courses-hhq-merge.ts", "slices/bestman.json", "docs/pending-prs/expand/x.md"])
    assert.ok(isAllowed(ok), ok);
  for (const no of ["src/index.ts", "package.json", ".github/workflows/ci.yml", "docs/pending-prs/other/x.md", "slices/sub/x.json", "docs/growth-ledger.json"])
    assert.ok(!isAllowed(no), no);
});

test("rows_added counts new array entries vs base, not edits elsewhere", () => {
  const base = `// c\nexport const P: X[] = [{"a":1},{"a":2}];\n`;
  const head = `// c\nexport const P: X[] = [{"a":1},{"a":2},{"a":3},{"a":4}];\n`;
  assert.equal(countNewRows(parseArrayExport(base), parseArrayExport(head)), 2);
  assert.equal(countNewRows(parseArrayExport(""), parseArrayExport(head)), 4);
});

test("growth-daily: an auto-merge red today is a ledger RED reason, and the lists are carried forward", () => {
  const am = { merged: [], red: [{ date: "2026-11-24", pr: 78, reason: "CONFLICTING with main" }] };
  const l = buildLedger([], [], NOW, 14, am);
  assert.ok(l.reasons.some((r) => r.includes("shared-data #78 not auto-merged: CONFLICTING")));
  assert.deepEqual(l.autoMerge, am);
  const old = buildLedger([], [], NOW, 14, { merged: [], red: [{ date: "2026-11-01", pr: 5, reason: "x" }] });
  assert.ok(!old.reasons.some((r) => r.includes("#5")));
});

test("decide: skipping-bucket checks do not block a merge", () => {
  assert.equal(decide(pr(), [...GREEN, { name: "opt", bucket: "skipping", state: "SKIPPED" }]).kind, "merge");
});
