import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import type { BackfillQueue, BackfillTask } from "./backfill-queue";
import type { GapTask } from "./gap-queue";
import {
  estimateCalls,
  parseWeeklyArgs,
  partyFreshness,
  runWeeklyQueue,
  type WeeklyQueueDeps,
} from "./weekly-queue";

const gap = (i: number): GapTask => ({
  id: `golf:cell-${i}`,
  dataset: "golf",
  cell: { tier: "budget" },
  deficit: 3,
  wizardsServed: ["handicap"],
  starvedForWizards: ["handicap"],
  leverageScore: 10 - i,
});
const bf = (i: number): BackfillTask => ({
  id: `bf-${i}`,
  destinationId: "austin",
  city: "Austin",
  state: "TX",
  category: "dining",
  venues: ["A", "B"],
  wizardsServed: ["bestman"],
  leverageScore: 1,
});
const queue: BackfillQueue = {
  tasks: Array.from({ length: 50 }, (_, i) => bf(i)),
  totalRows: 1000,
  totalUnsourced: 800,
  droppedTasks: 0,
  exhausted: 0,
  exhaustedVenues: [],
  pendingSkipped: 0,
  pendingVenues: [],
};

/** Every PAID client throws, so any paid call fails the run loudly; each hit is counted. */
function tripwireDeps(hits: string[], gateRc = 0): WeeklyQueueDeps {
  return {
    runPaidLane: (step) => {
      hits.push(`paid:${step}`);
      throw new Error(`PAID CLIENT HIT on a dry run: ${step}`);
    },
    linkCheck: async () => {
      hits.push("network:link-check");
      throw new Error("NETWORK CLIENT HIT on a default dry run");
    },
    runLocal: () => gateRc,
    gapQueue: () => Array.from({ length: 10 }, (_, i) => gap(i)),
    backfillQueue: () => queue,
    freshness: () => ({ scope: "t", rows: 10, sourced: 2, checkedAt: 0, sourcedAndChecked: 0 }),
    log: () => {},
  };
}

test("dry run is the DEFAULT and spends $0: completes, no paid or network client is touched", async () => {
  const opts = parseWeeklyArgs([]);
  assert.equal(opts.paid, false, "no flag must mean dry run");
  assert.equal(opts.linkCheck, false);
  const hits: string[] = [];
  const res = await runWeeklyQueue(opts, tripwireDeps(hits));
  assert.deepEqual(hits, [], `stubs were hit: ${hits.join(", ")}`);
  assert.equal(res.ok, true);
  assert.equal(res.mode, "dry-run");
  for (const s of res.steps) assert.equal(s.paid && s.called, false, `${s.step} was called`);
  // The dry run still REPORTS the work it would pay for.
  const exp = res.steps.find((s) => s.step === "expansion")!;
  const back = res.steps.find((s) => s.step === "url-backfill")!;
  assert.equal(exp.tasks, 3);
  assert.equal(back.tasks, 40);
  assert.ok(res.totalPerRun[1] > 0, "a dry run must print a non-zero estimate");
});

test("--dry-run style flags cannot arm anything; only --paid does", () => {
  assert.equal(parseWeeklyArgs(["--dry-run"]).paid, false);
  assert.equal(parseWeeklyArgs(["--paid=false"]).paid, false);
  assert.equal(parseWeeklyArgs(["--paid"]).paid, true);
});

test("control: --paid DOES reach the paid clients (the tripwire is live, not inert)", async () => {
  const hits: string[] = [];
  const deps = tripwireDeps(hits);
  deps.runPaidLane = (step) => {
    hits.push(`paid:${step}`);
    return 0;
  };
  deps.linkCheck = async () => [{ verdict: "DEAD" }];
  const res = await runWeeklyQueue(parseWeeklyArgs(["--paid"]), deps);
  assert.deepEqual(hits, ["paid:expansion", "paid:url-backfill"]);
  assert.equal(res.ok, true);
});

test("a red gate on the base stops the run before any lane, even when paid", async () => {
  const hits: string[] = [];
  const deps = tripwireDeps(hits, 1);
  deps.linkCheck = async () => []; // free, still allowed
  const res = await runWeeklyQueue(parseWeeklyArgs(["--paid"]), deps);
  assert.deepEqual(hits, []);
  assert.equal(res.ok, false);
});

test("every paid lane call in the source sits inside a spend() callback", () => {
  // Structural guard alongside the behavioural one: count runPaidLane call
  // sites vs spend( call sites in runWeeklyQueue's body.
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "weekly-queue.ts"), "utf-8");
  const body = src.slice(src.indexOf("export async function runWeeklyQueue"), src.indexOf("// ─── real (default) deps"));
  const lanes = body.match(/deps\.runPaidLane\(/g)?.length ?? 0;
  const spends = body.match(/spend\(opts, deps,/g)?.length ?? 0;
  assert.equal(lanes, 2);
  assert.equal(spends, lanes);
});

test("estimateCalls reproduces the 10-08 cost table's per-call basis", () => {
  // 173 calls/mo -> $8–29/mo in the table.
  const e = estimateCalls(173);
  assert.ok(e.usdPerRun[0] > 8 && e.usdPerRun[0] < 9, String(e.usdPerRun[0]));
  assert.ok(e.usdPerRun[1] > 28 && e.usdPerRun[1] < 30, String(e.usdPerRun[1]));
  assert.deepEqual(estimateCalls(0).usdPerRun, [0, 0]);
});

test("partyFreshness counts sourced url and checkedAt per party row", () => {
  const s = partyFreshness([
    { dining: [{ name: "a", url: "https://a" }, { name: "b", url: "https://b", checkedAt: "2026-11-01" }, { name: "c" }] },
  ] as never);
  assert.deepEqual(
    { rows: s.rows, sourced: s.sourced, checkedAt: s.checkedAt, both: s.sourcedAndChecked },
    { rows: 3, sourced: 2, checkedAt: 1, both: 1 },
  );
});
