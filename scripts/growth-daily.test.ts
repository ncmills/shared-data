import { strict as assert } from "node:assert";
import { test } from "node:test";

import type { BackfillQueue } from "./backfill-queue";
import type { GapTask } from "./gap-queue";
import {
  NOT_RULED_MESSAGE,
  buildLedger,
  dayStatus,
  laneOf,
  parseRows,
  runGrowthDaily,
  type GrowthDeps,
  type GrowthOptions,
  type MergedEvent,
} from "./growth-daily";

const NOW = new Date("2026-11-24T06:15:00Z");
const gap = (i: number): GapTask => ({
  id: `golf:cell-${i}`, dataset: "golf", cell: { tier: "budget" }, deficit: 3,
  wizardsServed: ["handicap"], starvedForWizards: ["handicap"], leverageScore: 10 - i,
});
const bq: BackfillQueue = { tasks: [], totalRows: 10, totalUnsourced: 0 } as unknown as BackfillQueue;

function deps(events: MergedEvent[], researcher: GrowthDeps["researcher"], logs: string[] = []): GrowthDeps {
  return {
    gapQueue: () => [gap(1), gap(2)],
    backfillQueue: () => bq,
    queuedRows: () => [],
    pins: () => [{ site: "siteX", pinSha: "c".repeat(40) }],
    mainSha: () => "c".repeat(40),
    commits: () => [{ sha: "c".repeat(40), date: NOW.toISOString(), parents: [] }],
    mergedRows: () => events,
    adoption: () => [],
    researcher,
    log: (m) => logs.push(m),
  };
}
const opts = (o: Partial<GrowthOptions> = {}): GrowthOptions => ({
  paid: false, topK: 3, backfillTopK: 40, ledgerPath: null, days: 14, now: NOW, ...o,
});

test("dry run makes zero model calls: the stubbed researcher is never invoked", async () => {
  let calls = 0;
  const r = await runGrowthDaily(opts(), deps([], async () => { calls++; }));
  assert.equal(calls, 0);
  assert.equal(r.modelCalls, 0);
  assert.equal(r.est.calls, 2); // tasks were listed and priced, not run
});

test("--paid throws 'not ruled' even with the budget env set, and calls nothing", async () => {
  let calls = 0;
  await assert.rejects(
    runGrowthDaily(opts({ paid: true }), deps([], async () => { calls++; }), { GROWTH_DAILY_BUDGET_USD: "5" }),
    new RegExp(NOT_RULED_MESSAGE),
  );
  assert.equal(calls, 0);
});

test("ledger is RED on a zero day", () => {
  const l = buildLedger([], [], NOW, 14);
  assert.equal(l.judgedDay, "2026-11-23");
  assert.equal(l.status, "RED");
  assert.match(l.reasons[0], /0 merged rows from every lane/);
  assert.equal(l.days.at(-1)!.status, null); // today is still open
});

test("ledger is not RED when one free lane added a row on the judged day", () => {
  const ev: MergedEvent[] = [{ date: "2026-11-23", lane: "site-intake", brands: ["bestman"], rows: 1 }];
  const l = buildLedger(ev, [], NOW, 14);
  assert.equal(l.status, "GREEN");
  assert.equal(l.days.find((d) => d.date === "2026-11-23")!.brands.bestman["site-intake"], 1);
});

test("ledger goes RED when a lag exceeds the limit, even on a row-adding day", () => {
  const ev: MergedEvent[] = [{ date: "2026-11-23", lane: "backfill", brands: ["moh"], rows: 3 }];
  const old = new Date(NOW.getTime() - 9 * 86_400_000).toISOString();
  const a = "a".repeat(40), c = "c".repeat(40);
  const lag = [{ site: "siteX", status: "RED" as const, pinSha: a, mainSha: c, lagDays: 9, message: `siteX: RED lag 9d ${old}` }];
  const l = buildLedger(ev, lag, NOW, 14);
  assert.equal(l.status, "RED");
  assert.equal(l.reasons.length, 1);
});

test("dayStatus and lane/row parsing", () => {
  assert.equal(dayStatus({ backfill: 0, expansion: 0, "site-intake": 0 }), "RED");
  assert.equal(dayStatus({ backfill: 0, expansion: 0, "site-intake": 1 }), "GREEN");
  assert.equal(laneOf("Merge pull request #9 from ncmills/expand/party-url-backfill-1"), "backfill");
  assert.equal(laneOf("Merge pull request #9 from ncmills/expand/golf-gap"), "expansion");
  assert.equal(laneOf("Three northeast towns"), "site-intake");
  assert.equal(parseRows("x.ts", `export const A: T[] = [{"name":"a"},{"name":"b"}];\n`)!.length, 2);
  assert.equal(parseRows("x.ts", "garbage"), null);
});
