/**
 * weekly-queue.ts — G351 CORPUS M8 part 2: ONE entry point for the weekly
 * corpus expansion run. Glue only: every stage it runs already exists.
 *
 *   1. pick       this week's work: top-K of docs/gap-queue.json (insert lane)
 *                 + top-K of buildBackfillQueue (enrich lane)          [$0]
 *   2. expansion  scripts/run-expansion.ts --auto (claude researcher)    [PAID]
 *   3. backfill   scripts/weekly-url-backfill.sh (run-backfill --auto)   [PAID]
 *   4. freshness  row coverage: sourced url + checkedAt (local, no model) [$0]
 *      link       audit-url-subject auditSubjects (plain fetch, no model) [$0, network]
 *   5. gate       verify-universe + check-brand-rules on the base, before any
 *                 spend. The per-row ingest gate itself runs inside steps 2–3
 *                 (ingestResearched: verify-universe + brand rules + audit,
 *                 rollback on failure).                                  [$0]
 *   6. PR         proposePr inside steps 2–3 opens one PR per lane. Never merges.
 *
 * ── THE $0 BOUNDARY ──────────────────────────────────────────────────────────
 * DRY RUN IS THE DEFAULT. There is exactly ONE switch, `--paid`, and exactly ONE
 * place that reads it: `spend()`. Every step that could cost money (a model call,
 * web search, Places/image API) is handed to `spend()`; in dry-run mode `spend()`
 * prints what it WOULD call (task count, model, est. tokens/searches, est. $) and
 * calls nothing. `weekly-queue.test.ts` stubs every paid client to throw and
 * proves a default run completes without touching one.
 *
 * NOTE how this differs from the existing lanes' `--dry-run`: run-backfill's and
 * run-expansion's dry runs STILL RESEARCH (they skip ingest + PR, not the model
 * call — see run-backfill.ts "A DRY RUN STILL RESEARCHES"). This entry point's
 * dry run never reaches them at all.
 *
 * Run (dry, $0):   npx tsx scripts/weekly-queue.ts
 * Run (PAID):      npx tsx scripts/weekly-queue.ts --paid      (CONTROL first)
 * Test:            npx tsx --test scripts/weekly-queue.test.ts
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sharedDestinations } from "../src/index";
import { buildBackfillQueue, loadAttempts, type BackfillQueue } from "./backfill-queue";
import type { GapTask } from "./gap-queue";
import { loadPendingKeys } from "./open-pr-rows";
import { deriveBranchName } from "./propose-pr";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// ─── cost basis (ESTIMATED) ─────────────────────────────────────────────────
/**
 * Per research call, from ~/work/shared-data/2026-10-08-corpus-api-cost-table.md
 * (the table CONTROL asked for before the loop is switched on). Every number
 * here is ESTIMATED there: no per-call token usage has ever been captured
 * (researcher-claude.ts logs candidate counts only). Prices are list prices
 * flagged "verify" in that table. One task = one `claude -p` research call in
 * both lanes (research-gap.ts / research-backfill.ts).
 */
export const COST_BASIS = {
  source: "~/work/shared-data/2026-10-08-corpus-api-cost-table.md",
  model: "Sonnet 5",
  todayPath: "claude -p (subscription quota)",
  proposedPath: "Anthropic API, plain (10-08 ruling)",
  inTokens: [8_000, 30_000] as const,
  outTokens: [300, 1_200] as const,
  searches: [2, 6] as const,
  usdPerMTokIn: 3,
  usdPerMTokOut: 15,
  usdPerSearch: 0.01,
  weeksPerMonth: 4.33,
};

export interface CallEstimate {
  calls: number;
  tokensIn: [number, number];
  tokensOut: [number, number];
  searches: [number, number];
  usdPerRun: [number, number];
  usdPerMonth: [number, number];
}

export function estimateCalls(calls: number, b = COST_BASIS): CallEstimate {
  const per = (i: 0 | 1) =>
    (b.inTokens[i] * b.usdPerMTokIn) / 1e6 +
    (b.outTokens[i] * b.usdPerMTokOut) / 1e6 +
    b.searches[i] * b.usdPerSearch;
  const run: [number, number] = [calls * per(0), calls * per(1)];
  return {
    calls,
    tokensIn: [calls * b.inTokens[0], calls * b.inTokens[1]],
    tokensOut: [calls * b.outTokens[0], calls * b.outTokens[1]],
    searches: [calls * b.searches[0], calls * b.searches[1]],
    usdPerRun: run,
    usdPerMonth: [run[0] * b.weeksPerMonth, run[1] * b.weeksPerMonth],
  };
}

// ─── options + injectable clients ───────────────────────────────────────────
export interface WeeklyQueueOptions {
  /** THE switch. false (default) = dry run, $0. */
  paid: boolean;
  label: string;
  expansionTopK: number;
  expansionRowCap: number;
  backfillTopK: number;
  backfillRowCap: number;
  maxVenuesPerTask: number;
  /** Run the (free, no-model) link check over the network. Default: only on a paid run. */
  linkCheck: boolean;
  /** Read-only inputs for an accurate backfill pick (both optional). */
  attemptsPath?: string;
  pendingKeysPath?: string;
}

export type PaidStep = "expansion" | "url-backfill";

export interface WeeklyQueueDeps {
  /** PAID. Spawns an existing lane CLI that calls the model. Reached ONLY via spend(). */
  runPaidLane: (step: PaidStep, cmd: string, args: string[], env: Record<string, string>) => number;
  /** Free (plain HTTP fetch, no model) but networked. */
  linkCheck: () => Promise<{ verdict: string }[]>;
  /** Local, $0: a gate script, exit code back. */
  runLocal: (cmd: string, args: string[]) => number;
  gapQueue: () => GapTask[];
  backfillQueue: (o: WeeklyQueueOptions) => BackfillQueue;
  freshness: () => FreshnessStats;
  log: (m: string) => void;
}

export interface FreshnessStats {
  scope: string;
  rows: number;
  sourced: number;
  checkedAt: number;
  sourcedAndChecked: number;
}

export interface StepReport {
  step: string;
  tasks: number;
  paid: boolean;
  called: boolean;
  estimate?: CallEstimate;
  note: string;
}

export interface WeeklyQueueResult {
  mode: "dry-run" | "paid";
  steps: StepReport[];
  totalPerRun: [number, number];
  totalPerMonth: [number, number];
  ok: boolean;
}

// ─── THE single $0 boundary ─────────────────────────────────────────────────
/**
 * The only place that decides whether a paid call is MADE. A paid step hands its
 * call here; on a dry run the call is described and never made. Never call a
 * `runPaidLane` outside a `spend()` callback — that is how one step ends up
 * bypassing the switch (the mutant in weekly-queue.test.ts does exactly this).
 */
function spend(
  opts: WeeklyQueueOptions,
  deps: WeeklyQueueDeps,
  step: PaidStep,
  est: CallEstimate,
  call: () => number,
): { called: boolean; rc: number } {
  const usd = `$${est.usdPerRun[0].toFixed(2)}–$${est.usdPerRun[1].toFixed(2)}/run`;
  if (!opts.paid) {
    deps.log(
      `  DRY RUN — WOULD CALL: ${est.calls} research call(s), ${COST_BASIS.model} ` +
        `[today ${COST_BASIS.todayPath}; proposed ${COST_BASIS.proposedPath}], ` +
        `~${fmtK(est.tokensIn)} in / ${fmtK(est.tokensOut)} out tokens, ` +
        `${est.searches[0]}–${est.searches[1]} web searches, ${usd} (ESTIMATED). Called nothing.`,
    );
    return { called: false, rc: 0 };
  }
  deps.log(`  PAID — calling ${step}: ${est.calls} call(s), ${usd} (ESTIMATED)`);
  return { called: true, rc: call() };
}

const fmtK = (r: readonly [number, number]) => `${Math.round(r[0] / 1000)}k–${Math.round(r[1] / 1000)}k`;

// ─── the run ────────────────────────────────────────────────────────────────
export async function runWeeklyQueue(
  opts: WeeklyQueueOptions,
  deps: WeeklyQueueDeps,
): Promise<WeeklyQueueResult> {
  const log = deps.log;
  const steps: StepReport[] = [];
  let ok = true;
  log(`weekly-queue[${opts.label}]: ${opts.paid ? "PAID RUN" : "DRY RUN ($0 — nothing paid is called)"}`);

  // 1. pick ------------------------------------------------------------------
  const gaps = deps.gapQueue();
  const gapPick = gaps.slice(0, Math.max(0, opts.expansionTopK));
  const bq = deps.backfillQueue(opts);
  const bfPick = bq.tasks.slice(0, Math.max(0, opts.backfillTopK));
  const bfVenues = bfPick.reduce((n, t) => n + t.venues.length, 0);
  log(
    `\n[1/6] pick (MEASURED): gap queue ${gaps.length} task(s) -> top ${gapPick.length}; ` +
      `backfill queue ${bq.tasks.length} task(s) / ${bq.totalUnsourced} unsourced of ${bq.totalRows} party rows ` +
      `-> top ${bfPick.length} (${bfVenues} venue(s)); ${bq.pendingSkipped} skipped as already in open PRs`,
  );
  for (const t of gapPick) log(`    gap  ${t.id}  deficit=${t.deficit} leverage=${t.leverageScore}`);
  steps.push({ step: "pick", tasks: gapPick.length + bfPick.length, paid: false, called: false, note: "local queues" });

  // 5 (run first). gate precheck — $0, before anything is spent --------------
  log(`\n[5/6] ingest gate precheck on the base (local, $0)`);
  const gateCmds: [string, string[]][] = [
    ["npx", ["tsx", "scripts/verify-universe.ts"]],
    ["npx", ["tsx", "scripts/check-brand-rules.ts"]],
  ];
  let gateRed = 0;
  for (const [cmd, args] of gateCmds) {
    const rc = deps.runLocal(cmd, args);
    log(`    ${args[1]}: ${rc === 0 ? "PASS" : `FAIL exit=${rc}`}`);
    if (rc !== 0) gateRed++;
  }
  steps.push({ step: "gate", tasks: gateCmds.length, paid: false, called: true, note: gateRed ? `${gateRed} red` : "green" });
  if (gateRed) {
    ok = false;
    log(`    STOP: the base fails the ingest gate — no lane runs (nothing paid, nothing proposed).`);
  }

  // 2. expansion -------------------------------------------------------------
  const expEst = estimateCalls(gapPick.length);
  log(`\n[2/6] expansion (insert lane, run-expansion.ts --auto): ${gapPick.length} task(s)`);
  let expCalled = false;
  if (ok && gapPick.length > 0) {
    const r = spend(opts, deps, "expansion", expEst, () =>
      deps.runPaidLane(
        "expansion",
        "npx",
        [
          "tsx",
          "scripts/run-expansion.ts",
          "--auto",
          `--top-k=${opts.expansionTopK}`,
          `--row-cap=${opts.expansionRowCap}`,
          `--label=${opts.label}-expansion`,
        ],
        {},
      ),
    );
    expCalled = r.called;
    if (r.rc !== 0) ok = false;
  }
  steps.push({ step: "expansion", tasks: gapPick.length, paid: true, called: expCalled, estimate: expEst, note: "1 call/task" });

  // 3. url-backfill ----------------------------------------------------------
  const bfEst = estimateCalls(bfPick.length);
  log(`\n[3/6] url-backfill (enrich lane, weekly-url-backfill.sh): ${bfPick.length} task(s), ${bfVenues} venue(s)`);
  let bfCalled = false;
  if (ok && bfPick.length > 0) {
    const r = spend(opts, deps, "url-backfill", bfEst, () =>
      deps.runPaidLane("url-backfill", "bash", ["scripts/weekly-url-backfill.sh"], {
        TOP_K: String(opts.backfillTopK),
        ROW_CAP: String(opts.backfillRowCap),
      }),
    );
    bfCalled = r.called;
    if (r.rc !== 0) ok = false;
  }
  steps.push({ step: "url-backfill", tasks: bfPick.length, paid: true, called: bfCalled, estimate: bfEst, note: "1 call/task" });

  // 4. freshness + link check (no model) -------------------------------------
  const f = deps.freshness();
  const pct = (n: number) => (f.rows ? ((100 * n) / f.rows).toFixed(1) : "0.0");
  log(
    `\n[4/6] freshness (MEASURED, ${f.scope}): ${f.rows} rows; sourced url ${f.sourced} (${pct(f.sourced)}%); ` +
      `checkedAt ${f.checkedAt} (${pct(f.checkedAt)}%); both ${f.sourcedAndChecked} (${pct(f.sourcedAndChecked)}%) ` +
      `vs target >=95% both`,
  );
  let linkNote = "skipped (dry run; pass --link-check to fetch, $0)";
  if (opts.linkCheck) {
    const res = await deps.linkCheck();
    const by = (v: string) => res.filter((r) => r.verdict === v).length;
    linkNote = `${res.length} url(s): DEAD ${by("DEAD")}, UNREACHABLE ${by("UNREACHABLE")}, UNCONFIRMED ${by("UNCONFIRMED")}`;
  }
  log(`    link check (plain fetch, no model): ${linkNote}`);
  steps.push({ step: "freshness+link", tasks: f.sourced, paid: false, called: opts.linkCheck, note: linkNote });

  // 6. PR proposal -----------------------------------------------------------
  const branches = [
    ...new Set(gapPick.map((t) => deriveBranchName(t.dataset, `${opts.label}-expansion`))),
    ...(bfPick.length ? ["expand/party-url-backfill-<timestamp> (weekly-url-backfill.sh names it)"] : []),
  ];
  log(`\n[6/6] PR proposal (inside the lanes; never merges): ${opts.paid ? "proposed by the lanes above" : "WOULD propose"}`);
  for (const b of branches) log(`    ${b}`);
  steps.push({ step: "pr", tasks: branches.length, paid: false, called: false, note: "proposePr inside each lane" });

  const totalPerRun: [number, number] = [
    expEst.usdPerRun[0] + bfEst.usdPerRun[0],
    expEst.usdPerRun[1] + bfEst.usdPerRun[1],
  ];
  const totalPerMonth: [number, number] = [
    totalPerRun[0] * COST_BASIS.weeksPerMonth,
    totalPerRun[1] * COST_BASIS.weeksPerMonth,
  ];
  log(
    `\nTOTAL (ESTIMATED, API path): ${expEst.calls + bfEst.calls} call(s)/run, ` +
      `$${totalPerRun[0].toFixed(2)}–$${totalPerRun[1].toFixed(2)}/run, ` +
      `$${totalPerMonth[0].toFixed(2)}–$${totalPerMonth[1].toFixed(2)}/month (x${COST_BASIS.weeksPerMonth} wk). ` +
      `Basis: ${COST_BASIS.source}`,
  );
  log(`weekly-queue[${opts.label}]: ${ok ? "OK" : "FAILED"} (${opts.paid ? "paid" : "dry run, $0 spent"})`);
  return { mode: opts.paid ? "paid" : "dry-run", steps, totalPerRun, totalPerMonth, ok };
}

// ─── real (default) deps ────────────────────────────────────────────────────
export function partyFreshness(destinations = sharedDestinations): FreshnessStats {
  const fields = ["activities", "dining", "nightlife", "lodging", "transport"] as const;
  const s: FreshnessStats = { scope: "party-venue rows", rows: 0, sourced: 0, checkedAt: 0, sourcedAndChecked: 0 };
  for (const d of destinations as unknown as Record<string, unknown>[]) {
    for (const k of fields) {
      for (const r of (d[k] as Record<string, unknown>[] | undefined) ?? []) {
        s.rows++;
        const src = typeof r.url === "string" && r.url.trim().length > 0;
        const chk = typeof r.checkedAt === "string" && r.checkedAt.trim().length > 0;
        if (src) s.sourced++;
        if (chk) s.checkedAt++;
        if (src && chk) s.sourcedAndChecked++;
      }
    }
  }
  return s;
}

export function realDeps(log: (m: string) => void = console.log): WeeklyQueueDeps {
  return {
    runPaidLane: (_step, cmd, args, env) =>
      spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } }).status ?? 1,
    linkCheck: async () => (await import("./audit-url-subject")).auditSubjects(),
    runLocal: (cmd, args) => {
      const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf-8" });
      return r.status ?? 1;
    },
    gapQueue: () => JSON.parse(readFileSync(join(ROOT, "docs", "gap-queue.json"), "utf-8")) as GapTask[],
    backfillQueue: (o) =>
      buildBackfillQueue(undefined, {
        maxVenuesPerTask: o.maxVenuesPerTask,
        attempts: o.attemptsPath ? loadAttempts(o.attemptsPath) : {},
        pending: loadPendingKeys(o.pendingKeysPath, false),
      }),
    freshness: () => partyFreshness(),
    log,
  };
}

export function parseWeeklyArgs(argv: string[]): WeeklyQueueOptions {
  const a = new Map(
    argv.map((s) => {
      const [k, v] = s.replace(/^--/, "").split("=");
      return [k, v ?? "true"] as const;
    }),
  );
  const num = (k: string, d: number) => {
    const n = Number(a.get(k));
    return a.has(k) && Number.isFinite(n) ? n : d;
  };
  const paid = a.get("paid") === "true";
  return {
    paid,
    label: a.get("label") ?? `weekly-${new Date().toISOString().slice(0, 10)}`,
    // Expansion: the disarmed plist's own numbers (deploy/com.secondnick.cite-cache-expansion.plist).
    expansionTopK: num("expansion-top-k", 3),
    expansionRowCap: num("expansion-row-cap", 15),
    // Backfill: weekly-url-backfill.sh's own defaults.
    backfillTopK: num("backfill-top-k", 40),
    backfillRowCap: num("backfill-row-cap", 120),
    maxVenuesPerTask: num("max-venues-per-task", 8),
    linkCheck: a.get("link-check") === "true" || paid,
    attemptsPath: a.get("attempts"),
    pendingKeysPath: a.get("pending-keys"),
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runWeeklyQueue(parseWeeklyArgs(process.argv.slice(2)), realDeps())
    .then((r) => {
      if (!r.ok) process.exitCode = 1;
    })
    .catch((e) => {
      console.error("weekly-queue FAILED:", e);
      process.exit(1);
    });
}
