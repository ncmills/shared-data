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
 * ── dryRun ──────────────────────────────────────────────────────────────────
 * `dryRun:true` runs research + validation + reporting ONLY. It never calls
 * `ingest` and never calls `propose` — no file is written, no branch created.
 *
 * ── GO-LIVE CONSTRAINT (Nick-directed): LOCAL ONLY ──────────────────────────
 * A non-dry run calls `propose({ branch: 'expand/'+label, push:false })`. This
 * module NEVER passes `push:true`. The monthly launchd plist that drives it
 * ships DISARMED (a file in `deploy/`, never `launchctl load`ed).
 *
 * Run (manual):  npx tsx scripts/run-expansion.ts --top-k=1 --dry-run
 * Test:          npx tsx --test scripts/run-expansion.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { GapTask } from "./gap-queue";
import { researchGap, type Researcher } from "./research-gap";
import { ingestResearched, type IngestResult } from "./ingest-researched";
import { proposePr, type ProposePrOptions, type ProposePrResult } from "./propose-pr";
import type { ResearchedRow } from "../src/research-schema";

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

/** A GapTask that lost one or more researched rows to the row cap. */
export interface DroppedTask {
  task: GapTask;
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

export interface RunResult {
  label: string;
  dryRun: boolean;
  /** The top-K GapTasks this run considered (in gap-queue priority order). */
  tasksConsidered: GapTask[];
  /** GapTasks that actually contributed ≥1 ingested row. */
  tasksAddressed: GapTask[];
  /** Validated rows the researcher produced across all considered tasks. */
  researchedRows: ResearchedRow[];
  /** Rows actually submitted to ingest, after the row cap. */
  ingestedRows: ResearchedRow[];
  /** Per-dataset rows-added + citations (from the threaded rows). */
  breakdown: DatasetBreakdown[];
  /** GapTasks dropped/trimmed by the row cap, with an explicit reason each. */
  droppedByCap: DroppedTask[];
  /** Rows that passed research validation + the row cap but were shape-
   *  rejected inside `ingestResearched` (never landed) — always `[]` on a
   *  dry run or when ingest wasn't reached. See `DroppedIngestRow`. */
  droppedAtIngest: DroppedIngestRow[];
  /** How many research candidates the validator rejected (no fabrication). */
  rejectedCandidates: number;
  /** The ingest gate's result — undefined on a dry run (ingest not called). */
  ingestResult?: IngestResult;
  /** The local PR artifact — undefined on a dry run or an empty batch. */
  pr?: ProposePrResult;
  /** Everything the run `log()`'d, captured for the RunResult. */
  logs: string[];
}

// ─── options ────────────────────────────────────────────────────────────────

export interface RunExpansionOptions {
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

  // ── injection seams (default to the real impls / real gap-queue.json) ─────
  /** Override the gap queue directly (tests). Defaults to reading
   *  `docs/gap-queue.json`. */
  gapQueue?: GapTask[];
  /** Override the gap-queue file path (defaults to docs/gap-queue.json). */
  gapQueuePath?: string;
  /** Injected ingest gate (tests inject a spy). Defaults to `ingestResearched`. */
  ingest?: (rows: ResearchedRow[]) => IngestResult;
  /** Injected PR proposer (tests inject a spy). Defaults to `proposePr`. */
  propose?: (opts: ProposePrOptions) => ProposePrResult;
  /** Injected logger (tests capture). Defaults to `console.log`. */
  log?: (msg: string) => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function loadGapQueue(opts: RunExpansionOptions): GapTask[] {
  if (opts.gapQueue) return opts.gapQueue;
  const path = opts.gapQueuePath ?? DEFAULT_GAP_QUEUE_PATH;
  const parsed = JSON.parse(readFileSync(path, "utf-8"));
  if (!Array.isArray(parsed)) throw new Error(`run-expansion: gap queue at ${path} is not an array`);
  return parsed as GapTask[];
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

export async function runExpansion(opts: RunExpansionOptions): Promise<RunResult> {
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
  const perTask: { task: GapTask; rows: ResearchedRow[] }[] = [];
  let rejectedCandidates = 0;
  for (const task of tasksConsidered) {
    const res = await researchGap(task, opts.researcher);
    rejectedCandidates += res.rejected;
    say(
      `  gap ${task.id}: ${res.rows.length} valid row(s), ${res.rejected} rejected ` +
        `(deficit=${task.deficit}, leverage=${task.leverageScore})`,
    );
    perTask.push({ task, rows: res.rows });
  }
  const researchedRows = perTask.flatMap((p) => p.rows);

  // ── Step 2: enforce rowCap in gap-priority order — NO SILENT TRUNCATION ───
  const ingestedRows: ResearchedRow[] = [];
  const droppedByCap: DroppedTask[] = [];
  const tasksAddressed: GapTask[] = [];
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
    push: false,
  });
  say(`  proposed LOCAL PR on branch ${pr.branch} → artifact ${pr.bodyPath} (push:false)`);

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

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const topK = Number(args["top-k"] ?? 1);
  const rowCap = Number(args["row-cap"] ?? 10);
  const dryRun = args["dry-run"] === true;
  const label = String(args["label"] ?? `expansion-${new Date().toISOString().slice(0, 10)}`);
  const candidatesPath = typeof args["candidates"] === "string" ? args["candidates"] : undefined;

  if (!candidatesPath) {
    console.error(
      "run-expansion: no --candidates=<file> given and no live web-research agent is wired into the CLI.\n" +
        "  This is BY DESIGN — the monthly launchd job ships DISARMED. To run for real, either:\n" +
        "    1. supply web-verified rows: npx tsx scripts/run-expansion.ts --top-k=1 --candidates=path.json\n" +
        "    2. or drive runExpansion() from a session that wires a real researcher (see docs/expansion-engine.md).\n" +
        "  Exiting without ingesting.",
    );
    process.exit(dryRun ? 0 : 1);
  }

  runExpansion({
    topK,
    rowCap,
    dryRun,
    label,
    researcher: fixedResearcherFromFile(candidatesPath),
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
