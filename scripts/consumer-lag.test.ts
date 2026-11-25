// consumer-lag.test.ts — the daily lag guard must go RED on stale pins and
// must never go green on a pin it cannot measure.
import { test } from "node:test";
import assert from "node:assert/strict";

import { lagReport, parsePinSha, type LagCommit } from "./consumer-lag";

const NOW = new Date("2026-11-24T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const A = "a".repeat(40), B = "b".repeat(40), C = "c".repeat(40);

// linear history: A (old) <- B <- C (main)
const history = (bAge: number): LagCommit[] => [
  { sha: C, date: daysAgo(0), parents: [B] },
  { sha: B, date: daysAgo(bAge), parents: [A] },
  { sha: A, date: daysAgo(30), parents: [] },
];
const run = (pinSha: string | null, bAge: number) =>
  lagReport({ mainSha: C, pins: [{ site: "siteX", pinSha }], commits: history(bAge) }, NOW)[0];

test("green when pin is main", () => {
  const r = run(C, 20);
  assert.equal(r.status, "GREEN");
  assert.equal(r.lagDays, 0);
});

test("green when 6 days behind", () => assert.equal(run(A, 6).status, "GREEN"));

test("red when 8 days behind, naming site, both shas and lag", () => {
  const r = run(A, 8);
  assert.equal(r.status, "RED");
  assert.match(r.message, /siteX/);
  assert.match(r.message, /aaaaaaa/);
  assert.match(r.message, /ccccccc/);
  assert.match(r.message, /8(\.0)?d/);
});

test("exactly 7 days behind is green (boundary)", () => assert.equal(run(A, 7).status, "GREEN"));

test("unknown sha is red, never green", () => {
  const r = run("d".repeat(40), 1);
  assert.equal(r.status, "RED");
  assert.match(r.message, /unknown sha/);
});

test("abbreviated pin sha resolves", () => assert.equal(run("aaaaaaa", 2).status, "GREEN"));

test("missing pin is red", () => assert.equal(run(null, 1).status, "RED"));

test("lag is the OLDEST missing commit, not the newest", () => {
  // B is 9d old, C is today; pin at A -> lag 9d -> red even though C is fresh
  assert.equal(run(A, 9).status, "RED");
});

test("parsePinSha", () => {
  assert.equal(parsePinSha("github:ncmills/shared-data#DDE2CB7"), "dde2cb7");
  assert.equal(parsePinSha("github:ncmills/shared-data"), null);
  assert.equal(parsePinSha(undefined), null);
});
