/**
 * growth-daily.ts — the WHOLE shared-growth loop, once a day, in DRY RUN.
 *
 * Plan: ~/work/shared-data/2026-11-24-shared-growth-plan.md (T3). Every step of
 * the loop runs here, but NOTHING that costs money or writes to GitHub runs:
 *
 *   1 acquire   today's task list from the gap queue + backfill queue, with the
 *               estimated $ from weekly-queue's COST_BASIS.        [$0, no model]
 *   2 vet       validateResearchedRow over rows already queued for ingest
 *   3 tag       deriveRouting over those rows (which brands would read them)
 *   4 land      what propose-pr WOULD open. Nothing is pushed.
 *   5 pins      each consumer's shared-data pin + lag (consumer-lag logic)
 *   6 consumed  new-data-report: types each site's overlay declines
 *   7 ledger    docs/growth-ledger.json: rows MERGED into main per day, per
 *               brand, per lane; RED on a zero day, RED on a lag over the limit.
 *
 * THE SWITCH. `--paid` is LOCKED: it throws "not ruled: CONTROL reads the dry run
 * first" unless env SHARED_DATA_RESEARCH_ENABLED=1 (set by nothing in the repo).
 * Unlocked, the only call path is spendOnResearch(): estimate -> canSpend ($1/day
 * hard cap, research-budget.ts) -> SN router -> record actual. A day that would
 * cross the cap stops; it never borrows from tomorrow.
 *
 * RED is not amber and is never excused by "no budget": free lanes count, and a
 * day with 0 merged rows from every lane is RED.
 *
 * Run:  npx tsx scripts/growth-daily.ts            (dry run, writes the ledger)
 * Test: npx tsx --test scripts/growth-daily.test.ts
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sharedDestinations } from "../src/index";
import { ENGINE_READS } from "../src/engine-reads";
import { validateResearchedRow } from "../src/research-schema";
import { deriveRouting } from "../src/tagging-rules";
import type { EntityKind } from "../src/tagging-rules";
import { ALL_WIZARD_TAGS, type WizardTag } from "../src/tags";
import { CONSUMER_REPOS } from "./audit/consumer-reach";
import { buildBackfillQueue, type BackfillQueue } from "./backfill-queue";
import { LAG_LIMIT_DAYS, lagReport, readPinFromOrigin, type LagCommit, type LagLine, type LagPin } from "./consumer-lag";
import type { GapTask } from "./gap-queue";
import { buildAdoptionQueue, type WizardAdoptionQueue } from "./new-data-report";
import { deriveBranchName } from "./propose-pr";
import { buildResearchPrompt } from "./research-gap";
import {
  DAILY_CAP_USD,
  RESEARCH_JOB_TYPE,
  callRouter,
  canSpend,
  ledgerPath,
  recordSpend,
  spentOn,
  utcDay,
  type RouterResult,
} from "./research-budget";
import { COST_BASIS, estimateCalls, type CallEstimate } from "./weekly-queue";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DAY_MS = 86_400_000;

/**
 * THE LOCK. `--paid` throws unless the env below is "1". Nothing in the repo or a plist
 * sets it: CONTROL flips it by hand after reading #87's dry-run output.
 */
export const ENABLE_ENV = "SHARED_DATA_RESEARCH_ENABLED";
export const NOT_RULED_MESSAGE = "not ruled: CONTROL reads the dry run first";

export const LANES = ["backfill", "expansion", "site-intake"] as const;
export type Lane = (typeof LANES)[number];

/** Files whose appended rows are "rows merged into main" (the sanctioned ingest targets). */
export const DATA_FILES: { path: string; kind: EntityKind | "proposal-spot" }[] = [
  { path: "src/party-venues-expansion.ts", kind: "party-venue" },
  { path: "src/golf-courses-hhq-merge.ts", kind: "golf-course" },
  { path: "src/residences-expansion.ts", kind: "residence" },
  { path: "src/proposal-spots-ingested.json", kind: "proposal-spot" },
  // The weekly URL-backfill lane lands here (enrichment patches for existing venues).
  { path: "src/party-venue-patches.ts", kind: "party-venue" },
];

export interface GrowthOptions {
  paid: boolean;
  topK: number;
  backfillTopK: number;
  ledgerPath: string | null;
  /** Days of history in the ledger. */
  days: number;
  now: Date;
}

/** One merged-row event: `rows` rows landed in main on `date` via `lane`, readable by `brands`. */
export interface MergedEvent {
  date: string; // YYYY-MM-DD (UTC)
  lane: Lane;
  brands: string[];
  rows: number;
}

export interface GrowthDeps {
  gapQueue: () => GapTask[];
  backfillQueue: () => BackfillQueue;
  /** Rows already queued for ingest (none is fine). */
  queuedRows: () => unknown[];
  pins: () => LagPin[];
  mainSha: () => string;
  commits: () => LagCommit[];
  mergedRows: (days: number, now: Date) => MergedEvent[];
  adoption: () => WizardAdoptionQueue[];
  /** PAID. The SN-router adapter. Reached only through spendOnResearch(), behind the lock and the $1/day cap. */
  router: (jobType: string, prompt: string) => RouterResult;
  /** Spend ledger path (outside the repo; tests pass a temp file). */
  spendLedger: string;
  log: (m: string) => void;
}

// ─── the ledger ─────────────────────────────────────────────────────────────
export interface LedgerDay {
  date: string;
  /** null for today: the day is still open, so it cannot be judged yet. */
  status: "RED" | "GREEN" | null;
  total: number;
  lanes: Record<Lane, number>;
  brands: Record<string, Record<Lane, number>>;
}
export interface Ledger {
  generatedAt: string;
  /** The last COMPLETED day, the one the top-level status judges. */
  judgedDay: string;
  status: "RED" | "GREEN";
  reasons: string[];
  lagLimitDays: number;
  lag: { site: string; status: "GREEN" | "RED"; lagDays: number | null; pinSha: string | null }[];
  days: LedgerDay[];
}

const emptyLanes = (): Record<Lane, number> => ({ backfill: 0, expansion: 0, "site-intake": 0 });
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/**
 * THE ZERO-DAY RULE. A completed day is RED when every lane added 0 merged rows.
 * Free lanes count; there is no amber. (The mutant in growth-daily.test.ts
 * flips this to green and the test must go red.)
 */
export function dayStatus(lanes: Record<Lane, number>): "RED" | "GREEN" {
  const total = LANES.reduce((n, l) => n + lanes[l], 0);
  return total === 0 ? "RED" : "GREEN";
}

export function buildLedger(events: MergedEvent[], lag: LagLine[], now: Date, days: number): Ledger {
  const today = isoDay(now);
  const dates: string[] = [];
  for (let i = days; i >= 0; i--) dates.push(isoDay(new Date(now.getTime() - i * DAY_MS)));
  const out: LedgerDay[] = dates.map((date) => {
    const lanes = emptyLanes();
    const brands: Record<string, Record<Lane, number>> = {};
    for (const e of events.filter((x) => x.date === date)) {
      lanes[e.lane] += e.rows;
      for (const b of e.brands) (brands[b] ??= emptyLanes())[e.lane] += e.rows;
    }
    const total = LANES.reduce((n, l) => n + lanes[l], 0);
    return { date, status: date === today ? null : dayStatus(lanes), total, lanes, brands };
  });
  const judged = out.filter((d) => d.status !== null).at(-1)!;
  const reasons: string[] = [];
  if (judged.status === "RED") reasons.push(`${judged.date}: 0 merged rows from every lane (backfill, expansion, site-intake)`);
  for (const l of lag) if (l.status === "RED") reasons.push(l.message);
  return {
    generatedAt: now.toISOString(),
    judgedDay: judged.date,
    status: reasons.length ? "RED" : "GREEN",
    reasons,
    lagLimitDays: LAG_LIMIT_DAYS,
    lag: lag.map((l) => ({ site: l.site, status: l.status, lagDays: l.lagDays, pinSha: l.pinSha })),
    days: out,
  };
}

// ─── the paid door (shut) ───────────────────────────────────────────────────
export interface SpendOutcome {
  calls: number;
  spentUsd: number;
  stopped: string | null;
}

/**
 * The ONLY path to a model call: estimate -> canSpend -> call -> record the actual.
 * A call that would cross the daily cap is not made and the run STOPS (no borrowing
 * from tomorrow). A router error (e.g. KeyError: job type not in SN's policy) stops too.
 */
export async function spendOnResearch(
  opts: GrowthOptions,
  deps: GrowthDeps,
  tasks: GapTask[],
  env: NodeJS.ProcessEnv,
): Promise<SpendOutcome> {
  const out: SpendOutcome = { calls: 0, spentUsd: 0, stopped: null };
  if (!opts.paid) return out;
  if (env[ENABLE_ENV] !== "1") throw new Error(NOT_RULED_MESSAGE);
  const day = utcDay(opts.now);
  const estUsd = estimateCalls(1).usdPerRun[1]; // worst case per call
  for (const t of tasks) {
    if (!canSpend(estUsd, day, deps.spendLedger)) {
      out.stopped = `cap reached: $${spentOn(day, deps.spendLedger).toFixed(2)} of $${DAILY_CAP_USD.toFixed(2)}`;
      deps.log(out.stopped);
      return out;
    }
    let r: RouterResult;
    try {
      r = deps.router(RESEARCH_JOB_TYPE, buildResearchPrompt(t));
    } catch (e) {
      out.stopped = `router stopped the run: ${e instanceof Error ? e.message : e}`;
      deps.log(out.stopped);
      return out;
    }
    recordSpend(
      { ts: opts.now.toISOString(), day, job: RESEARCH_JOB_TYPE, model: r.model, est_usd: estUsd, actual_usd: r.costUsd },
      deps.spendLedger,
    );
    out.calls++;
    out.spentUsd += r.costUsd;
  }
  return out;
}

// ─── the run ────────────────────────────────────────────────────────────────
export interface GrowthResult {
  ledger: Ledger;
  est: CallEstimate;
  modelCalls: number;
}

export async function runGrowthDaily(
  opts: GrowthOptions,
  deps: GrowthDeps,
  env: NodeJS.ProcessEnv = process.env,
): Promise<GrowthResult> {
  const log = deps.log;
  // `--paid` is refused up front (before any step runs) unless the lock env is set.
  if (opts.paid && env[ENABLE_ENV] !== "1") throw new Error(NOT_RULED_MESSAGE);
  log(opts.paid ? `growth-daily: PAID (cap $${DAILY_CAP_USD.toFixed(2)}/day, via SN router)` : `growth-daily: DRY RUN (zero model calls)`);

  // 1 acquire
  const gaps = deps.gapQueue().slice(0, Math.max(0, opts.topK));
  const bq = deps.backfillQueue();
  const bf = bq.tasks.slice(0, Math.max(0, opts.backfillTopK));
  const est = estimateCalls(gaps.length + bf.length);
  log(`[1 acquire] ${gaps.length} expansion task(s) + ${bf.length} backfill task(s) = ${est.calls} call(s) WOULD run`);
  for (const t of gaps) log(`    gap ${t.id} deficit=${t.deficit}`);
  log(
    `    est $${est.usdPerRun[0].toFixed(2)}-$${est.usdPerRun[1].toFixed(2)}/day (ESTIMATED, ${COST_BASIS.model}; basis ${COST_BASIS.source}). Called nothing.`,
  );
  const spent = await spendOnResearch(opts, deps, gaps, env); // no-op in dry run

  // 2 vet + 3 tag
  const queued = deps.queuedRows();
  let ok = 0;
  const bad: string[] = [];
  const byBrand = new Map<string, number>();
  for (const r of queued) {
    const v = validateResearchedRow(r);
    if (!v.ok) {
      bad.push(v.reasons.join("; "));
      continue;
    }
    ok++;
    for (const b of brandsForRow(v.row as unknown as Record<string, unknown>)) byBrand.set(b, (byBrand.get(b) ?? 0) + 1);
  }
  log(`[2 vet] ${queued.length} queued row(s): ${ok} pass, ${bad.length} fail${bad.length ? ` (first: ${bad[0]})` : ""}`);
  log(`[3 tag] brands that would read the passing rows: ${byBrand.size ? [...byBrand].map(([b, n]) => `${b}=${n}`).join(", ") : "none queued"}`);

  // 4 land
  const label = `growth-${isoDay(opts.now)}`;
  const branches = [...new Set(gaps.map((t) => deriveBranchName(t.dataset, `${label}-expansion`)))];
  if (bf.length) branches.push("expand/party-url-backfill-<timestamp>");
  log(`[4 land] propose-pr WOULD open ${branches.length} branch(es); pushed: none`);
  for (const b of branches) log(`    ${b}`);

  // 5 pins
  const commits = deps.commits();
  const lag = lagReport({ mainSha: deps.mainSha(), pins: deps.pins(), commits }, opts.now);
  log(`[5 pins] ${lag.length} consumer(s), limit ${LAG_LIMIT_DAYS}d`);
  for (const l of lag) log(`    ${l.message}`);

  // 6 consumed
  const adoption = deps.adoption();
  log(`[6 consumed] declined types per site (silently dropped by the overlay allowlist)`);
  for (const q of adoption) {
    log(`    ${q.site}: surfaced ${q.surfaced}, declined ${q.declined}${q.types.length ? ` (${q.types.map((t) => `${t.type}=${t.rows}`).join(", ")})` : ""}`);
  }

  // 7 ledger
  const ledger = buildLedger(deps.mergedRows(opts.days, opts.now), lag, opts.now, opts.days);
  if (opts.ledgerPath) writeFileSync(opts.ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  const j = ledger.days.find((d) => d.date === ledger.judgedDay)!;
  log(
    `[7 ledger] ${ledger.status}: judged ${ledger.judgedDay} merged rows ${j.total} ` +
      `(backfill ${j.lanes.backfill}, expansion ${j.lanes.expansion}, site-intake ${j.lanes["site-intake"]})` +
      `${opts.ledgerPath ? `; wrote ${opts.ledgerPath}` : ""}`,
  );
  for (const r of ledger.reasons) log(`    RED: ${r}`);
  return { ledger, est, modelCalls: spent.calls };
}

function brandsForRow(row: Record<string, unknown>): string[] {
  const dataset = String(row.dataset ?? "");
  if (dataset === "party-venue") {
    const cat = String(row.category ?? "") as "activity" | "dining" | "nightlife" | "lodging" | "transport";
    return deriveRouting({ kind: "party-venue", venueType: cat }).core.wizards;
  }
  const kind = (dataset === "golf" ? "golf-course" : dataset) as EntityKind;
  return readersOf(kind);
}

export function readersOf(kind: EntityKind): WizardTag[] {
  return ALL_WIZARD_TAGS.filter((w) => ENGINE_READS[w].includes(kind));
}

// ─── real deps ──────────────────────────────────────────────────────────────
const git = (...a: string[]) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

/** Parse the JSON array out of a machine-appended `export const X = [ ... ];` file (or a .json file). */
export function parseRows(path: string, text: string): Record<string, unknown>[] | null {
  try {
    if (path.endsWith(".json")) return JSON.parse(text);
    const start = text.indexOf("= [", text.indexOf("export const"));
    const end = text.lastIndexOf("]");
    if (start < 0 || end < start) return null;
    return JSON.parse(text.slice(start + 2, end + 1));
  } catch {
    return null;
  }
}

export function laneOf(subject: string): Lane {
  if (/backfill/i.test(subject)) return "backfill";
  if (/expan|gap|research|drain/i.test(subject)) return "expansion";
  return "site-intake";
}

function rowKey(r: Record<string, unknown>): string {
  return JSON.stringify([r.destinationId ?? r.id ?? "", r.category ?? "", r.name ?? "", r.id ?? ""]);
}

function showAt(ref: string, path: string): string {
  try {
    return git("show", `${ref}:${path}`);
  } catch {
    return "";
  }
}

/** Rows merged into origin/main per first-parent commit, from the data files' git history. */
export function realMergedRows(days: number, now: Date): MergedEvent[] {
  const since = new Date(now.getTime() - (days + 1) * DAY_MS).toISOString();
  const lines = git("log", "origin/main", "--first-parent", `--since=${since}`, "--format=%H|%cI|%s").split("\n").filter(Boolean);
  const events: MergedEvent[] = [];
  for (const line of lines) {
    const [sha, iso, ...rest] = line.split("|");
    const subject = rest.join("|");
    for (const f of DATA_FILES) {
      const after = parseRows(f.path, showAt(sha, f.path));
      if (!after) continue;
      const beforeText = showAt(`${sha}^1`, f.path);
      const before = beforeText ? parseRows(f.path, beforeText) ?? [] : [];
      const had = new Set(before.map(rowKey));
      const added = after.filter((r) => !had.has(rowKey(r)));
      if (!added.length) continue;
      const brands = f.kind === "proposal-spot" ? ["engagedmoon"] : f.kind === "party-venue"
        ? [...new Set(added.flatMap((r) => brandsForRow({ dataset: "party-venue", category: r.category })))]
        : readersOf(f.kind);
      events.push({ date: iso.slice(0, 10), lane: laneOf(subject), brands, rows: added.length });
    }
  }
  return events;
}

export function realDeps(log: (m: string) => void = console.log): GrowthDeps {
  return {
    gapQueue: () => JSON.parse(readFileSync(join(ROOT, "docs", "gap-queue.json"), "utf-8")) as GapTask[],
    backfillQueue: () => buildBackfillQueue(undefined, { maxVenuesPerTask: 8 }),
    queuedRows: () => {
      const p = join(ROOT, "docs", "growth-queue.json");
      return existsSync(p) ? (JSON.parse(readFileSync(p, "utf-8")) as unknown[]) : [];
    },
    pins: () =>
      CONSUMER_REPOS.map((c) => {
        try {
          return { site: c.repo, pinSha: readPinFromOrigin(c.repo) };
        } catch {
          return { site: c.repo, pinSha: null }; // unreadable pin is RED, never green
        }
      }),
    mainSha: () => git("rev-parse", "origin/main").trim(),
    commits: () =>
      git("log", "origin/main", "--format=%H|%cI|%P").split("\n").filter(Boolean).map((l) => {
        const [sha, date, parents] = l.split("|");
        return { sha, date, parents: parents ? parents.split(" ") : [] };
      }),
    mergedRows: realMergedRows,
    adoption: () => buildAdoptionQueue(sharedDestinations),
    router: callRouter,
    spendLedger: ledgerPath(),
    log,
  };
}

export function parseGrowthArgs(argv: string[], now = new Date()): GrowthOptions {
  const has = (f: string) => argv.includes(f);
  return {
    paid: has("--paid"),
    topK: 3,
    backfillTopK: 40,
    ledgerPath: has("--no-write") ? null : join(ROOT, "docs", "growth-ledger.json"),
    days: 14,
    now,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const opts = parseGrowthArgs(process.argv.slice(2));
  try {
    git("fetch", "origin", "-q");
  } catch {
    console.log("(git fetch failed; using local origin/main)");
  }
  runGrowthDaily(opts, realDeps())
    .then((r) => {
      if (r.ledger.status === "RED") process.exitCode = 1;
    })
    .catch((e) => {
      console.error("growth-daily FAILED:", e instanceof Error ? e.message : e);
      process.exit(2);
    });
}
