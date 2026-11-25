import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import type { GapTask } from "./gap-queue";
import { ENABLE_ENV, NOT_RULED_MESSAGE, runGrowthDaily, type GrowthDeps, type GrowthOptions } from "./growth-daily";
import { DAILY_CAP_USD, canSpend, readSpend, spentOn } from "./research-budget";

const NOW = new Date("2026-11-24T06:15:00Z");
const gap = (i: number): GapTask => ({
  id: `golf:cell-${i}`, dataset: "golf", cell: { tier: "budget" }, deficit: 3,
  wizardsServed: ["handicap"], starvedForWizards: ["handicap"], leverageScore: 10 - i,
});
const tmp = () => join(mkdtempSync(join(tmpdir(), "sd-spend-")), "spend.jsonl");
const row = (day: string, actual: number) =>
  JSON.stringify({ ts: `${day}T01:00:00Z`, day, job: "shared_data_research", model: "m", est_usd: actual, actual_usd: actual }) + "\n";

function deps(ledger: string, perCall: number, nTasks: number, logs: string[], router?: GrowthDeps["router"]): { d: GrowthDeps; calls: () => number } {
  let n = 0;
  const d: GrowthDeps = {
    gapQueue: () => Array.from({ length: nTasks }, (_, i) => gap(i)),
    backfillQueue: () => ({ tasks: [], totalRows: 0, totalUnsourced: 0 }) as never,
    queuedRows: () => [],
    pins: () => [{ site: "s", pinSha: "c".repeat(40) }],
    mainSha: () => "c".repeat(40),
    commits: () => [{ sha: "c".repeat(40), date: NOW.toISOString(), parents: [] }],
    mergedRows: () => [],
    adoption: () => [],
    router: router ?? (() => { n++; return { text: "{}", costUsd: perCall, model: "stub-model" }; }),
    spendLedger: ledger,
    log: (m) => logs.push(m),
  };
  return { d, calls: () => n };
}
const opts = (now = NOW): GrowthOptions => ({ paid: true, topK: 50, backfillTopK: 0, ledgerPath: null, days: 14, now });
const ON = { [ENABLE_ENV]: "1" };

test("a call that would cross $1.00 is not made and the run stops", async () => {
  const ledger = tmp();
  writeFileSync(ledger, row("2026-11-24", 0.9)); // 0.9 spent; worst-case estimate 0.168 -> 1.068 > 1.00
  const logs: string[] = [];
  const { d, calls } = deps(ledger, 0.1, 3, logs);
  const r = await runGrowthDaily(opts(), d, ON);
  assert.equal(calls(), 0);
  assert.equal(r.modelCalls, 0);
  assert.ok(logs.some((l) => l === "cap reached: $0.90 of $1.00"), logs.join("\n"));
  assert.equal(readSpend(ledger).length, 1); // nothing appended
});

test("spend is recorded per call, and the run stops once the cap is hit", async () => {
  const ledger = tmp();
  const logs: string[] = [];
  const { d, calls } = deps(ledger, 0.2, 10, logs);
  const r = await runGrowthDaily(opts(), d, ON);
  const rows = readSpend(ledger);
  assert.equal(rows.length, calls());
  assert.equal(r.modelCalls, calls());
  assert.ok(calls() >= 1 && calls() < 10);
  for (const x of rows) {
    assert.equal(x.day, "2026-11-24");
    assert.equal(x.job, "shared_data_research");
    assert.equal(x.model, "stub-model");
    assert.equal(x.actual_usd, 0.2);
    assert.ok(x.est_usd > 0 && x.ts);
  }
  assert.ok(spentOn("2026-11-24", ledger) <= DAILY_CAP_USD);
  assert.ok(logs.some((l) => /^cap reached: \$\d+\.\d\d of \$1\.00$/.test(l)));
});

test("a new UTC day starts at $0: no borrowing from yesterday, no carry of overspend", () => {
  const ledger = tmp();
  writeFileSync(ledger, row("2026-11-23", 0.1) + row("2026-11-22", 5.0)); // unspent yesterday + overspent day before
  assert.equal(spentOn("2026-11-24", ledger), 0);
  assert.equal(canSpend(1.0, "2026-11-24", ledger), true); // full $1 today, not $1.90
  assert.equal(canSpend(1.01, "2026-11-24", ledger), false); // and never more than $1
  writeFileSync(ledger, row("2026-11-24", 0.5));
  assert.equal(canSpend(0.5, "2026-11-24", ledger), true);
  assert.equal(canSpend(0.51, "2026-11-24", ledger), false);
});

test("the lock throws without the env, and calls nothing", async () => {
  const ledger = tmp();
  const { d, calls } = deps(ledger, 0.1, 2, []);
  await assert.rejects(runGrowthDaily(opts(), d, {}), new RegExp(NOT_RULED_MESSAGE));
  await assert.rejects(runGrowthDaily(opts(), d, { [ENABLE_ENV]: "0" }), new RegExp(NOT_RULED_MESSAGE));
  assert.equal(calls(), 0);
  assert.equal(readSpend(ledger).length, 0, "ledger untouched");
});

test("a router error (job type not in SN's policy) stops the run with that message", async () => {
  const ledger = tmp();
  const logs: string[] = [];
  const { d } = deps(ledger, 0, 2, logs, () => { throw new Error("router has no job type 'shared_data_research' (KeyError)"); });
  const r = await runGrowthDaily(opts(), d, ON);
  assert.equal(r.modelCalls, 0);
  assert.ok(logs.some((l) => /router stopped the run: .*KeyError/.test(l)));
});

test("nothing in the repo sets the enable env", () => {
  const out = readFileSync(new URL("./growth-daily.ts", import.meta.url), "utf8");
  assert.ok(!/process\.env\.SHARED_DATA_RESEARCH_ENABLED\s*=/.test(out));
});
