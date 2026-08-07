/**
 * run-expansion.ts — Task 17: the recurring expansion ORCHESTRATOR.
 *
 * Chains the whole Phase-4 loop for the top-K highest-leverage gaps:
 *
 *   docs/gap-queue.json (Task 13)  ──take top-K──▶  buildResearchPrompt (Task 14)
 *        ──researcher──▶  researchGap (validate, Task 14)  ──rowCap──▶
 *        ingestResearched (Task 15 gate)  ──▶  proposePr (Task 16, LOCAL only).
 *
 * ── The seam Task 16 flagged ───────────────────────────────────────────────
 * `IngestResult` only returns a COMBINED `accepted` count — it can't tell you
 * which dataset (golf vs residence) each accepted row belongs to, nor its
 * citations. This orchestrator threads the validated `ResearchedRow[]` through
 * itself, so the PER-DATASET breakdown (rows added per dataset + the citation
 * URLs backing them) is computed from the rows' own `dataset`/`citations`
 * fields, NOT from the opaque `accepted` integer. The `IngestResult.accepted`
 * count is used only as a cross-check.
 *
 * ── rowCap: NO SILENT TRUNCATION ────────────────────────────────────────────
 * A run never ingests more than `rowCap` rows. When the researched batch would
 * exceed the cap, rows are filled in gap-priority order up to the cap and every
 * GapTask that lost one or more rows is recorded in `RunResult.droppedByCap`
 * with an explicit reason (and `log()`'d). The caller can always see exactly
 * what was left on the table and why.
 *
 * ── CONCURRENT RESEARCH (2026-08-06) ───────────────────────────────────────
 * Step 1 used to be a strictly sequential `for…of await`, so a top-K=40 run
 * cost 40 × up-to-180s of wall clock — ~1h52m, of which ~59% was spent inside
 * research calls that timed out and returned nothing. The task loop is now a
 * BOUNDED WORKER POOL (`researchConcurrency`, default 6). Bounded, never
 * `Promise.all` over the whole batch: 40 simultaneous `claude -p` processes
 * would thrash the machine and starve each other.
 *
 * THE CORRECTNESS PROPERTY THIS MUST NOT BREAK: `perTask` is consumed in
 * gap-priority order by the rowCap step below, so which rows survive the cap
 * depends on task ORDER. Results are therefore written into a PRE-SIZED array
 * by index and read back in `tasksConsidered` order — completion order never
 * leaks into the output. `rejections` is flattened in the same task order for
 * the same reason. Only the LOG lines interleave (each carries its task id and
 * `[i/N]` position), because they are emitted as calls finish.
 *
 * A research call that THROWS is contained to its own task: it contributes 0
 * rows, is recorded in `rejections` with `index: -1`, and the run continues.
 * One unlucky task must never abort a 40-task batch.
 *
 * ── dryRun ──────────────────────────────────────────────────────────────────
 * `dryRun:true` runs research + validation + reporting ONLY. It never calls
 * `ingest` and never calls `propose` — no file is written, no branch created.
 *
 * ── GO-LIVE CONSTRAINT (Nick-directed): LOCAL ONLY ──────────────────────────
 * A non-dry run calls `propose({ branch: 'expand/'+label, push:false })`. This
 * module NEVER passes `push:true`. The monthly launchd plist that drives it
 * ships DISARMED (a file in `deploy/`, never `launchctl load`ed).
 *
 * ── URL-liveness gate (arm-time hardening, Item 3) ──────────────────────────
 * The CLI below is the actual unattended entrypoint, so it arms
 * `liveUrlCheck` by default — every researched row's `sourceUrl` must
 * resolve live (2xx/3xx via `src/verify-url.ts`'s `verifyUrlLive`) or it's
 * rejected before ever reaching `ingestResearched`. `runExpansion()` the
 * *library function* still defaults `liveUrlCheck` to `false` (unchanged
 * sync-only behavior every existing test relies on) — pass `--skip-live-check`
 * to the CLI to opt out for a supervised run against candidates already
 * fetched/verified moments earlier in the same session.
 *
 * Run (manual):  npx tsx scripts/run-expansion.ts --top-k=1 --dry-run
 * Test:          npx tsx --test scripts/run-expansion.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { GapTask } from "./gap-queue";
import type { ResearchGapResult } from "./research-gap";
import { researchGap, type Researcher } from "./research-gap";
import { claudeResearcher } from "./researcher-claude";
import { ingestResearched, type IngestResult } from "./ingest-researched";
import { proposePr, type ProposePrOptions, type ProposePrResult } from "./propose-pr";
import type { ResearchedRow } from "../src/research-schema";
import type { UrlLiveResult } from "../src/verify-url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const DEFAULT_GAP_QUEUE_PATH = join(REPO_ROOT, "docs", "gap-queue.json");

// ─── result shapes ──────────────────────────────────────────────────────────

/** Per-dataset roll-up of what this run added — derived from the threaded
 *  `ResearchedRow[]` (the seam Task 16 flagged), not from `IngestResult`. */
export interface DatasetBreakdown {
  dataset: string;
  rowsAdded: number;
  citations: string[];
}

/**
 * The minimum a task must expose for this orchestrator to run it.
 *
 * Introduced 2026-07-31 so the SAME orchestration (top-K, rowCap with explicit
 * drop reporting, ingest through the real gate, propose-PR) drives both lanes:
 * `GapTask` (insert new venues into a starved cell) and `BackfillTask` (enrich
 * existing rows with a real source). Only two things differ between them —
 * where the tasks come from and which prompt researches them — and both are
 * injectable below. Defaulting `T` to `GapTask` keeps every existing caller and
 * test unchanged.
 */
export interface ExpansionTask {
  id: string;
  leverageScore: number;
  /** Insert-lane only: how many rows short the cell is. */
  deficit?: number;
}

/** A task that lost one or more researched rows to the row cap. */
export interface DroppedTask<T extends ExpansionTask = GapTask> {
  task: T;
  reason: string;
}

/**
 * A row that passed `validateResearchedRow` (Task 14) and was submitted to
 * `ingestResearched`, but did NOT land — `validateResearchedRow` intentionally
 * requires FEWER fields than `ingestResearched`'s per-row shape-conversion, so
 * a row can be counted as "valid" here and still be shape-rejected at ingest
 * (a normal partial-reject, distinct from an atomic gate rollback, which
 * drops the whole batch and is reported via `ingestResult.accepted === 0`
 * instead). Recorded so the PR-body/commit-message fidelity fix (Task 17)
 * never silently overstates rows added or misattributes a citation to a row
 * that never landed — same "no silent truncation" principle as `droppedByCap`.
 */
export interface DroppedIngestRow {
  row: ResearchedRow;
  reason: string;
}

export interface RunResult<T extends ExpansionTask = GapTask> {
  label: string;
  dryRun: boolean;
  /** The top-K GapTasks this run considered (in gap-queue priority order). */
  tasksConsidered: T[];
  /** GapTasks that actually contributed ≥1 ingested row. */
  tasksAddressed: T[];
  /** Validated rows the researcher produced across all considered tasks. */
  researchedRows: ResearchedRow[];
  /** Rows actually submitted to ingest, after the row cap. */
  ingestedRows: ResearchedRow[];
  /** Per-dataset rows-added + citations (from the threaded rows). */
  breakdown: DatasetBreakdown[];
  /** GapTasks dropped/trimmed by the row cap, with an explicit reason each. */
  droppedByCap: DroppedTask<T>[];
  /** Rows that passed research validation + the row cap but were shape-
   *  rejected inside `ingestResearched` (never landed) — always `[]` on a
   *  dry run or when ingest wasn't reached. See `DroppedIngestRow`. */
  droppedAtIngest: DroppedIngestRow[];
  /** How many research candidates the validator rejected (no fabrication). */
  rejectedCandidates: number;
  /**
   * WHY each candidate was rejected, with the task it came from.
   *
   * A bare count is unreviewable — it cannot distinguish a drifted venue from
   * a dead URL from a fabricated one, and those need different responses. The
   * first real backfill run rejected 1 of 5 candidates and there was no way to
   * see which or why. Same no-silent-truncation principle as `droppedByCap`.
   */
  rejections: { taskId: string; index: number; reasons: string[] }[];
  /** The ingest gate's result — undefined on a dry run (ingest not called). */
  ingestResult?: IngestResult;
  /** The local PR artifact — undefined on a dry run or an empty batch. */
  pr?: ProposePrResult;
  /** Everything the run `log()`'d, captured for the RunResult. */
  logs: string[];
}

// ─── options ────────────────────────────────────────────────────────────────

export interface RunExpansionOptions<T extends ExpansionTask = GapTask> {
  /** How many top gap-queue tasks to attempt this run. */
  topK: number;
  /** Hard ceiling on rows ingested this run (no silent truncation past it). */
  rowCap: number;
  /** Research + validate + report only; never ingest, never branch. */
  dryRun?: boolean;
  /** The web-research agent (real) or a mock (tests). */
  researcher: Researcher;
  /** Deterministic label → branch name `expand/<label>` + PR artifact path. */
  label: string;
  /**
   * Item 3 of the arm-time hardening: when true, every researched row is
   * additionally required to have a LIVE (2xx/3xx) `sourceUrl` before it's
   * counted as valid — threaded straight to `researchGap`'s `liveUrlCheck`.
   * Defaults to `false` (unchanged sync-only behavior every existing test
   * relies on). The CLI's real unattended entrypoint below sets this `true`.
   */
  liveUrlCheck?: boolean;
  /** Injected live-URL verifier for tests / a custom fetch policy. Ignored
   *  when `liveUrlCheck` is falsy. */
  verifyUrl?: (url: string) => Promise<UrlLiveResult>;
  /**
   * When true, a non-dry run proposes a REAL PR (`proposePr({push:true})` —
   * `git push` + `gh pr create`). Defaults to `false` (LOCAL-only, the
   * historical go-live constraint every existing test relies on). ONLY the
   * `--auto` CLI path sets this `true`, and only on a non-dry run. `--auto
   * --dry-run` never reaches propose at all, so no PR is ever pushed on a dry
   * run regardless of this flag. */
  pushPr?: boolean;

  // ── injection seams (default to the real impls / real gap-queue.json) ─────
  /** Override the gap queue directly (tests). Defaults to reading
   *  `docs/gap-queue.json`. */
  gapQueue?: T[];
  /** Task list for a non-gap lane (e.g. the URL backfill). Takes precedence
   *  over `gapQueue` and the gap-queue file. */
  tasks?: T[];
  /** Override how ONE task is researched. Defaults to `researchGap` — the
   *  insert lane. The backfill lane injects `researchBackfill`. */
  research?: (task: T) => Promise<ResearchGapResult>;
  /** What to call a task in the log. Defaults to `"gap"`; the enrich lane
   *  passes `"backfill"` so a run's output does not claim to be filling gaps
   *  when it is sourcing existing rows. */
  taskNoun?: string;
  /** Override the gap-queue file path (defaults to docs/gap-queue.json). */
  gapQueuePath?: string;
  /** Injected ingest gate (tests inject a spy). Defaults to `ingestResearched`. */
  ingest?: (rows: ResearchedRow[]) => IngestResult;
  /** Injected PR proposer (tests inject a spy). Defaults to `proposePr`. */
  propose?: (opts: ProposePrOptions) => ProposePrResult;
  /** Injected logger (tests capture). Defaults to `console.log`. */
  log?: (msg: string) => void;
  /**
   * How many research calls may be in flight at once. Default
   * `DEFAULT_RESEARCH_CONCURRENCY` (6). Clamped to >= 1 and to the number of
   * tasks. This is a POOL WIDTH, not a batch size — results are still
   * assembled in `tasksConsidered` order (see the header note).
   */
  researchConcurrency?: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Default research pool width. 6 is deliberately modest: each slot is a whole
 * `claude -p` process doing sequential WebSearch/WebFetch round-trips, and the
 * machine also has to stay usable while an unattended run is in flight.
 */
export const DEFAULT_RESEARCH_CONCURRENCY = 6;

/**
 * Run `worker` over `items` with at most `limit` invocations in flight, and
 * return the results in INPUT ORDER regardless of completion order.
 *
 * Order is preserved structurally, not by sorting afterwards: the output array
 * is pre-sized and each worker writes to its own index. There is no path by
 * which a fast task can displace a slow one.
 *
 * Exactly `width` runners are started and each awaits ONE worker at a time, so
 * in-flight count is bounded by construction (not by a counter that could
 * drift). `worker` must not reject — callers wrap their own try/catch — but a
 * rejection here would still propagate rather than be swallowed.
 */
export async function mapWithConcurrency<A, B>(
  items: readonly A[],
  limit: number,
  worker: (item: A, index: number) => Promise<B>,
): Promise<B[]> {
  const out = new Array<B>(items.length);
  if (items.length === 0) return out;
  const requested = Math.floor(limit);
  const width = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 1, items.length));

  let next = 0;
  const runners = Array.from({ length: width }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return out;
}

function loadGapQueue<T extends ExpansionTask>(opts: RunExpansionOptions<T>): T[] {
  if (opts.tasks) return opts.tasks;
  if (opts.gapQueue) return opts.gapQueue;
  const path = opts.gapQueuePath ?? DEFAULT_GAP_QUEUE_PATH;
  const parsed = JSON.parse(readFileSync(path, "utf-8"));
  if (!Array.isArray(parsed)) throw new Error(`run-expansion: gap queue at ${path} is not an array`);
  return parsed as T[];
}

/** Group the threaded rows by dataset, counting rows + collecting (deduped)
 *  citations — the per-dataset breakdown the seam Task 16 flagged. */
function breakdownFor(rows: ResearchedRow[]): DatasetBreakdown[] {
  const byDataset = new Map<string, { count: number; citations: Set<string> }>();
  for (const row of rows) {
    const entry = byDataset.get(row.dataset) ?? { count: 0, citations: new Set<string>() };
    entry.count += 1;
    for (const c of row.citations ?? []) if (c) entry.citations.add(c);
    byDataset.set(row.dataset, entry);
  }
  return Array.from(byDataset.entries()).map(([dataset, e]) => ({
    dataset,
    rowsAdded: e.count,
    citations: Array.from(e.citations),
  }));
}

// ─── the orchestrator ───────────────────────────────────────────────────────

export async function runExpansion<T extends ExpansionTask = GapTask>(
  opts: RunExpansionOptions<T>,
): Promise<RunResult<T>> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const logs: string[] = [];
  const say = (m: string) => {
    logs.push(m);
    log(m);
  };

  const ingest = opts.ingest ?? ((rows: ResearchedRow[]) => ingestResearched(rows));
  const propose = opts.propose ?? ((o: ProposePrOptions) => proposePr(o));
  const dryRun = opts.dryRun === true;

  const queue = loadGapQueue(opts);
  const tasksConsidered = queue.slice(0, Math.max(0, opts.topK));
  say(
    `run-expansion[${opts.label}]: ${dryRun ? "DRY RUN, " : ""}top-K=${opts.topK} rowCap=${opts.rowCap} — ` +
      `${tasksConsidered.length} task(s) from a ${queue.length}-task queue`,
  );

  // ── Step 1: research each considered task (validated survivors only) ──────
  //
  // Concurrent, bounded, ORDER-PRESERVING — see the header note. Completion
  // order affects only when a log line is printed, never what the run ingests.
  const noun = opts.taskNoun ?? "gap";
  const concurrency = opts.researchConcurrency ?? DEFAULT_RESEARCH_CONCURRENCY;
  const total = tasksConsidered.length;
  if (total > 1) {
    say(
      `  researching ${total} task(s) with up to ${Math.min(Math.max(1, Math.floor(concurrency) || 1), total)} ` +
        `concurrent research call(s); results are assembled in queue order`,
    );
  }

  const outcomes = await mapWithConcurrency(tasksConsidered, concurrency, async (task, i) => {
    const at = `[${i + 1}/${total}]`;
    const meta = `${task.deficit === undefined ? "" : `deficit=${task.deficit}, `}leverage=${task.leverageScore}`;
    try {
      const res = opts.research
        ? await opts.research(task)
        : await researchGap(task as unknown as GapTask, opts.researcher, {
            liveUrlCheck: opts.liveUrlCheck,
            verifyUrl: opts.verifyUrl,
          });
      say(
        `  ${at} ${noun} ${task.id}: ${res.rows.length} valid row(s), ${res.rejected} rejected (${meta})`,
      );
      return {
        task,
        rows: res.rows,
        rejected: res.rejected,
        rejections: (res.rejections ?? []).map((r) => ({
          taskId: task.id,
          index: r.index,
          reasons: r.reasons,
        })),
      };
    } catch (e) {
      // CONTAINED, NOT FATAL. `claudeResearcher` is already fail-safe, but
      // `research` is an injection seam and anything upstream of the researcher
      // (prompt building, a live-URL verifier, an injected mock) can still
      // throw. One task must not take a 40-task run down — and the failure must
      // be VISIBLE, not swallowed into a silent zero. `index: -1` marks it as a
      // task-level failure rather than a rejected candidate; `rejectedCandidates`
      // deliberately does NOT move, because no candidate was ever produced.
      const reason = `research threw for task ${task.id}: ${e instanceof Error ? e.message : String(e)}`;
      say(`  ${at} ${noun} ${task.id}: RESEARCH FAILED — ${reason} (${meta}); run continues`);
      return {
        task,
        rows: [] as ResearchedRow[],
        rejected: 0,
        rejections: [{ taskId: task.id, index: -1, reasons: [reason] }],
      };
    }
  });

  // Assemble in QUEUE ORDER — `outcomes` is index-aligned to `tasksConsidered`.
  const perTask: { task: T; rows: ResearchedRow[] }[] = [];
  let rejectedCandidates = 0;
  const rejections: { taskId: string; index: number; reasons: string[] }[] = [];
  for (const o of outcomes) {
    rejectedCandidates += o.rejected;
    rejections.push(...o.rejections);
    perTask.push({ task: o.task, rows: o.rows });
  }
  const researchedRows = perTask.flatMap((p) => p.rows);

  // ── Step 2: enforce rowCap in gap-priority order — NO SILENT TRUNCATION ───
  const ingestedRows: ResearchedRow[] = [];
  const droppedByCap: DroppedTask<T>[] = [];
  const tasksAddressed: T[] = [];
  for (const { task, rows } of perTask) {
    const remaining = opts.rowCap - ingestedRows.length;
    if (rows.length === 0) continue;
    if (remaining <= 0) {
      const reason = `rowCap ${opts.rowCap} already reached before this task; dropped all ${rows.length} researched row(s)`;
      droppedByCap.push({ task, reason });
      say(`  DROPPED ${task.id}: ${reason}`);
      continue;
    }
    if (rows.length <= remaining) {
      ingestedRows.push(...rows);
      tasksAddressed.push(task);
    } else {
      ingestedRows.push(...rows.slice(0, remaining));
      tasksAddressed.push(task);
      const dropped = rows.length - remaining;
      const reason = `rowCap ${opts.rowCap} reached mid-task; kept ${remaining} row(s), dropped ${dropped} researched row(s)`;
      droppedByCap.push({ task, reason });
      say(`  CAPPED ${task.id}: ${reason}`);
    }
  }

  const breakdown = breakdownFor(ingestedRows);

  // ── Step 3a: DRY RUN — report only, never ingest, never branch ────────────
  if (dryRun) {
    say(
      `  DRY RUN complete: would ingest ${ingestedRows.length} row(s) across ` +
        `${breakdown.map((b) => `${b.dataset}+${b.rowsAdded}`).join(", ") || "none"}; ` +
        `no ingest, no branch.`,
    );
    return {
      label: opts.label,
      dryRun,
      tasksConsidered,
      tasksAddressed,
      researchedRows,
      ingestedRows,
      breakdown,
      droppedByCap,
      droppedAtIngest: [],
      rejectedCandidates,
      rejections,
      logs,
    };
  }

  // ── Step 3b: nothing to ingest → no branch (still a valid, reported run) ──
  if (ingestedRows.length === 0) {
    say(`  no rows to ingest (0 valid researched rows within the cap); no branch created.`);
    return {
      label: opts.label,
      dryRun,
      tasksConsidered,
      tasksAddressed,
      researchedRows,
      ingestedRows,
      breakdown,
      droppedByCap,
      droppedAtIngest: [],
      rejectedCandidates,
      rejections,
      logs,
    };
  }

  // ── Step 4: ingest through the real gate (verify + brand + audit) ─────────
  const ingestResult = ingest(ingestedRows);
  say(`  ingest: accepted=${ingestResult.accepted}, rejected=${ingestResult.rejected}`);
  if (ingestResult.reasons.length > 0) {
    for (const r of ingestResult.reasons) say(`    ingest note: ${r}`);
  }
  // cross-check the threaded breakdown against the opaque accepted count
  if (ingestResult.accepted !== ingestedRows.length) {
    say(
      `  WARNING: ingest accepted ${ingestResult.accepted} of ${ingestedRows.length} submitted row(s) — ` +
        `per-dataset breakdown reflects the SUBMITTED rows; some were rejected/rolled back at the gate.`,
    );
  }

  // ── PR-fidelity fix: the PR body must reflect ONLY rows that ACTUALLY
  // landed. `validateResearchedRow` requires fewer fields than ingest's
  // per-row shape-conversion, so a row can pass the row cap above and still
  // be shape-rejected inside `ingestResearched` (a normal partial-reject,
  // not the atomic gate rollback `accepted<=0` below). Identify the
  // submitted rows missing from `ingestResult.acceptedRows` by reference
  // equality (`ingestResearched` never clones a validated row) and report
  // them — same "no silent truncation" principle as `droppedByCap` — instead
  // of silently letting the PR overstate rows added / misattribute a
  // citation to a row that never landed.
  const acceptedRows = ingestResult.acceptedRows ?? [];
  const acceptedSet = new Set(acceptedRows);
  const droppedAtIngest: DroppedIngestRow[] = ingestedRows
    .filter((row) => !acceptedSet.has(row))
    .map((row) => {
      const needle = (row as { name?: string; id?: string }).name ?? (row as { name?: string; id?: string }).id;
      const matched = needle ? ingestResult.reasons.find((r) => r.includes(needle)) : undefined;
      return {
        row,
        reason:
          matched ??
          `dropped at ingest: row passed research validation + the row cap but did not land ` +
            `(see ingestResult.reasons for the gate's own accounting)`,
      };
    });
  if (droppedAtIngest.length > 0) {
    say(
      `  WARNING: ${droppedAtIngest.length} row(s) passed validation but were shape-rejected at ingest — ` +
        `excluded from the PR body: ${droppedAtIngest.map((d) => d.reason).join(" | ")}`,
    );
  }
  // the PR-body breakdown is derived from ACCEPTED rows only — never from the
  // pre-ingest submitted batch (`breakdown`, computed above, still reflects
  // the submitted batch and is returned as-is for dry-run/reporting purposes).
  const acceptedBreakdown = breakdownFor(acceptedRows);

  // ── Step 5: nothing landed → no PR (a rolled-back gate leaves no change) ──
  if (ingestResult.accepted <= 0) {
    say(`  ingest accepted 0 rows (gate rejected the batch); no branch/PR created.`);
    return {
      label: opts.label,
      dryRun,
      tasksConsidered,
      tasksAddressed,
      researchedRows,
      ingestedRows,
      breakdown,
      droppedByCap,
      droppedAtIngest,
      rejectedCandidates,
      rejections,
      ingestResult,
      logs,
    };
  }

  // ── Step 6: propose the LOCAL PR (push:false — go-live constraint) ────────
  const rowCountsByDataset: Record<string, number> = {};
  const citations: string[] = [];
  for (const b of acceptedBreakdown) {
    rowCountsByDataset[b.dataset] = b.rowsAdded;
    citations.push(...b.citations);
  }
  const dataset = acceptedBreakdown[0]?.dataset ?? "batch";
  const pr = propose({
    branch: `expand/${opts.label}`,
    label: opts.label,
    dataset,
    gapTasks: tasksAddressed,
    rowCountsByDataset,
    citations,
    push: opts.pushPr === true,
  });
  say(
    `  proposed ${opts.pushPr === true ? "PUSHED" : "LOCAL"} PR on branch ${pr.branch} → ` +
      `artifact ${pr.bodyPath} (push:${opts.pushPr === true})`,
  );

  return {
    label: opts.label,
    dryRun,
    tasksConsidered,
    tasksAddressed,
    researchedRows,
    ingestedRows,
    breakdown,
    droppedByCap,
    droppedAtIngest,
    rejectedCandidates,
    rejections,
    ingestResult,
    pr,
    logs,
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

/**
 * A fixed researcher for the CLI: returns the parsed candidates from a
 * `--candidates=<file>` JSON array, ignoring the prompt. This is how the
 * supervised first run feeds already-web-verified rows through the real
 * pipeline. Without `--candidates`, the CLI has NO researcher wired (the
 * monthly daemon ships disarmed) and exits without ingesting.
 */
function fixedResearcherFromFile(path: string): Researcher {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const candidates = Array.isArray(raw) ? raw : [raw];
  return async () => candidates;
}

// ─── CLI config derivation (pure + exported so the wiring is unit-tested) ────

/**
 * The two-mode contract of the CLI:
 *
 *   DEFAULT (no `--auto`) — local-only / researcher-required. No live web
 *     research agent is wired: you MUST supply `--candidates=<file>` of already
 *     web-verified rows. The live-URL gate is armed by default (opt out with
 *     `--skip-live-check`). Never pushes — proposes a LOCAL PR (`push:false`).
 *
 *   `--auto` — the UNATTENDED autonomy mode the monthly launchd job runs.
 *     Implies ALL of: real researcher (`claudeResearcher`) + live-URL gate ON
 *     + push ON (`proposePr({push:true})` opens a real PR). `--auto --dry-run`
 *     still does the research + validate + report but NEVER ingests, branches,
 *     or pushes (dryRun short-circuits before ingest), so it is the safe way to
 *     smoke the real researcher without opening a PR.
 */
export interface CliConfig {
  topK: number;
  rowCap: number;
  dryRun: boolean;
  label: string;
  auto: boolean;
  /** Real PR push — true ONLY when `--auto` AND not a dry run. */
  pushPr: boolean;
  /** Live-URL liveness gate — on in `--auto`, and on by default otherwise
   *  (unless `--skip-live-check`). */
  liveUrlCheck: boolean;
  /** Use the real headless-claude researcher (true in `--auto`). */
  useClaudeResearcher: boolean;
  /** Research pool width (`--research-concurrency`). */
  researchConcurrency: number;
  /** Supervised path: JSON file of pre-verified candidate rows (non-auto). */
  candidatesPath?: string;
}

export function deriveCliConfig(args: Record<string, string | boolean>): CliConfig {
  const topK = Number(args["top-k"] ?? 1);
  const rowCap = Number(args["row-cap"] ?? 10);
  const dryRun = args["dry-run"] === true;
  const auto = args["auto"] === true;
  const label = String(args["label"] ?? `expansion-${new Date().toISOString().slice(0, 10)}`);
  const candidatesPath = typeof args["candidates"] === "string" ? args["candidates"] : undefined;
  const rawConcurrency = Number(args["research-concurrency"]);
  const researchConcurrency = Number.isFinite(rawConcurrency)
    ? Math.max(1, Math.floor(rawConcurrency))
    : DEFAULT_RESEARCH_CONCURRENCY;

  if (auto) {
    // --auto implies: real researcher + live-URL gate ON + push ON.
    // A dry run overrides push (research+report only, no ingest/branch/PR).
    return {
      topK,
      rowCap,
      dryRun,
      label,
      auto: true,
      pushPr: !dryRun,
      liveUrlCheck: true,
      useClaudeResearcher: true,
      researchConcurrency,
      candidatesPath,
    };
  }

  // Default (local-only): live-URL gate armed unless explicitly skipped, never
  // pushes, requires a --candidates file (no live researcher wired).
  return {
    topK,
    rowCap,
    dryRun,
    label,
    auto: false,
    pushPr: false,
    liveUrlCheck: args["skip-live-check"] !== true,
    useClaudeResearcher: false,
    researchConcurrency,
    candidatesPath,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const cfg = deriveCliConfig(parseArgs(process.argv.slice(2)));

  // Resolve the researcher for the chosen mode.
  let researcher: Researcher;
  if (cfg.useClaudeResearcher) {
    // --auto: the real, unattended web-research backend.
    console.error(
      `run-expansion --auto: real headless-claude researcher, live-URL gate ON, ` +
        `push ${cfg.pushPr ? "ON (opens a real PR)" : "OFF (dry run)"}.`,
    );
    researcher = claudeResearcher({ log: (m) => console.error(m) });
  } else if (cfg.candidatesPath) {
    researcher = fixedResearcherFromFile(cfg.candidatesPath);
  } else {
    console.error(
      "run-expansion: no --auto and no --candidates=<file> given — no researcher is wired.\n" +
        "  Run UNATTENDED for real:  npx tsx scripts/run-expansion.ts --auto --top-k=3 --row-cap=15\n" +
        "  Or supply web-verified rows: npx tsx scripts/run-expansion.ts --top-k=1 --candidates=path.json\n" +
        "  Or smoke the real researcher safely: npx tsx scripts/run-expansion.ts --auto --dry-run --top-k=1\n" +
        "  Exiting without ingesting.",
    );
    process.exit(cfg.dryRun ? 0 : 1);
  }

  runExpansion({
    topK: cfg.topK,
    rowCap: cfg.rowCap,
    dryRun: cfg.dryRun,
    label: cfg.label,
    liveUrlCheck: cfg.liveUrlCheck,
    pushPr: cfg.pushPr,
    researchConcurrency: cfg.researchConcurrency,
    researcher,
  })
    .then((res) => {
      console.log(
        `\nrun-expansion done: label=${res.label} dryRun=${res.dryRun} ` +
          `ingested=${res.ingestedRows.length} dropped=${res.droppedByCap.length}` +
          (res.pr ? ` branch=${res.pr.branch}` : ""),
      );
    })
    .catch((e) => {
      console.error("run-expansion FAILED:", e);
      process.exit(1);
    });
}
