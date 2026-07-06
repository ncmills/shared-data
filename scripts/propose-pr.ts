/**
 * propose-pr.ts — Task 16: Propose-PR + coverage-matrix diff.
 *
 * The LAST step of the expansion engine (scan-gaps -> research -> ingest ->
 * propose-pr). Takes an already-ingested batch (Task 15 has already written
 * the sanctioned expansion file(s) and re-run `npm run audit`, so
 * `docs/coverage-matrix.md` / `docs/audit-report.json` already reflect the
 * AFTER state on disk) and produces a review-ready PR artifact:
 *
 *   1. a git branch `expand/<dataset>-<label>` off the current HEAD,
 *   2. a commit of the sanctioned expansion files + regenerated audit docs
 *      on that branch,
 *   3. a markdown PR BODY — GapTasks addressed, rows added per dataset, a
 *      coverage-matrix before/after diff, and the citation URLs of the
 *      added rows — written to `docs/pending-prs/<branch>.md` (the
 *      "ready-to-open PR artifact").
 *
 * ── GO-LIVE CONSTRAINT (Nick-directed): LOCAL ONLY BY DEFAULT ──────────────
 * This module NEVER pushes and NEVER calls `gh` unless the caller passes
 * `push: true` explicitly (default `false`, opt-in, not exercised by Task
 * 16). Every git/gh invocation goes through one injectable `run` command
 * runner so callers (and tests) can prove the gate holds: with `push`
 * false/omitted, `run` is never called with `git push` or `gh` args.
 *
 * `buildPrBody` is a pure function (dataset counts, GapTasks, citations,
 * before/after coverage-matrix markdown in -> markdown body out) so the PR
 * body's shape is unit-testable without any git/filesystem/process I/O.
 *
 * Run:  (library — no CLI entrypoint; called by the Task 17 recurring runner)
 * Test: npx tsx --test scripts/propose-pr.test.ts
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { GapTask } from "./gap-queue";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

// ─── injectable command runner ─────────────────────────────────────────────

export interface CommandResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** A command runner: (cmd, args, { cwd }) -> result. Default shells out via
 *  `spawnSync`; tests inject a spy/fake so nothing is ever actually run. */
export type CommandRunner = (cmd: string, args: string[], opts?: { cwd?: string }) => CommandResult;

function defaultRunner(cmd: string, args: string[], opts?: { cwd?: string }): CommandResult {
  const res = spawnSync(cmd, args, { cwd: opts?.cwd, encoding: "utf-8" });
  return {
    status: res.status ?? (res.error ? 1 : 0),
    stdout: res.stdout ?? "",
    stderr: res.error ? String(res.error.message) : res.stderr ?? "",
  };
}

// ─── coverage-matrix.md parsing + diff (pure) ──────────────────────────────

export interface CoverageCellDiff {
  wizard: string;
  dataset: string;
  before: number;
  after: number;
}

/** Parses the `docs/coverage-matrix.md` table (see `scripts/audit/index.ts`'s
 *  `renderCoverageMatrixMd`) into `{ wizard: { dataset: count } }`. Returns
 *  empty structures for a missing/empty/malformed table (e.g. the very first
 *  run, before any coverage-matrix.md has ever been committed) rather than
 *  throwing — a diff against "nothing existed yet" is still a valid diff. */
export function parseCoverageMatrixMd(md: string): {
  wizards: string[];
  datasets: string[];
  cells: Record<string, Record<string, number>>;
} {
  const lines = md.split("\n");
  const headerIdx = lines.findIndex((l) => l.trim().toLowerCase().startsWith("| wizard |"));
  if (headerIdx === -1) return { wizards: [], datasets: [], cells: {} };

  const headerCells = lines[headerIdx]
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const datasets = headerCells.slice(1);

  const wizards: string[] = [];
  const cells: Record<string, Record<string, number>> = {};

  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break;
    const parts = line
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length < 2) break;
    const [wizard, ...vals] = parts;
    wizards.push(wizard);
    cells[wizard] = {};
    datasets.forEach((d, idx) => {
      const n = Number(vals[idx]);
      cells[wizard][d] = Number.isFinite(n) ? n : 0;
    });
  }

  return { wizards, datasets, cells };
}

/** Diffs two coverage-matrix.md snapshots, returning only the cells whose
 *  count actually changed (a missing cell on either side counts as 0). */
export function diffCoverageMatrix(beforeMd: string, afterMd: string): CoverageCellDiff[] {
  const before = parseCoverageMatrixMd(beforeMd);
  const after = parseCoverageMatrixMd(afterMd);

  const wizards = after.wizards.length > 0 ? after.wizards : before.wizards;
  const datasets = after.datasets.length > 0 ? after.datasets : before.datasets;

  const diffs: CoverageCellDiff[] = [];
  for (const w of wizards) {
    for (const d of datasets) {
      const b = before.cells[w]?.[d] ?? 0;
      const a = after.cells[w]?.[d] ?? 0;
      if (a !== b) diffs.push({ wizard: w, dataset: d, before: b, after: a });
    }
  }
  return diffs;
}

// ─── PR body (pure) ─────────────────────────────────────────────────────────

export interface PrBodyInput {
  /** GapTasks (Task 13) this batch addressed. */
  gapTasks: GapTask[];
  /** Rows accepted this batch, per dataset (e.g. { golf: 3, residence: 1 }). */
  rowCountsByDataset: Record<string, number>;
  /** Citation / primary-source URLs backing the added rows. */
  citations: string[];
  /** `docs/coverage-matrix.md` content BEFORE this batch (the last committed
   *  version — empty string if none has ever been committed). */
  beforeMatrixMd: string;
  /** `docs/coverage-matrix.md` content AFTER this batch (the regenerated
   *  file currently on disk, written by the ingest step's `npm run audit`). */
  afterMatrixMd: string;
}

/** Pure markdown-body builder — no I/O. Embeds the GapTasks addressed, the
 *  row count added per dataset, the coverage-matrix before/after diff, and
 *  the citation URLs of the added rows. */
export function buildPrBody(input: PrBodyInput): string {
  const { gapTasks, rowCountsByDataset, citations, beforeMatrixMd, afterMatrixMd } = input;
  const lines: string[] = [];

  lines.push("# Expansion batch: cite-cache growth");
  lines.push("");

  lines.push("## Rows added");
  lines.push("");
  const datasetEntries = Object.entries(rowCountsByDataset);
  if (datasetEntries.length === 0) {
    lines.push("_No rows added in this batch._");
  } else {
    for (const [dataset, count] of datasetEntries) {
      lines.push(`- **${dataset}**: +${count} row(s)`);
    }
  }
  lines.push("");

  lines.push("## GapTasks addressed");
  lines.push("");
  if (gapTasks.length === 0) {
    lines.push("_No GapTasks recorded for this batch._");
  } else {
    for (const t of gapTasks) {
      lines.push(
        `- \`${t.id}\` — dataset=${t.dataset}, cell=${JSON.stringify(t.cell)}, deficit=${t.deficit}, ` +
          `leverageScore=${t.leverageScore.toFixed(1)}, servedBy=[${t.wizardsServed.join(", ")}]` +
          (t.starvedForWizards.length > 0 ? `, starvedFor=[${t.starvedForWizards.join(", ")}]` : ""),
      );
    }
  }
  lines.push("");

  lines.push("## Coverage matrix diff (before -> after)");
  lines.push("");
  const diffs = diffCoverageMatrix(beforeMatrixMd, afterMatrixMd);
  if (diffs.length === 0) {
    lines.push("_No coverage-matrix cells changed._");
  } else {
    lines.push("| wizard | dataset | before | after | delta |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const d of diffs) {
      const delta = d.after - d.before;
      lines.push(`| ${d.wizard} | ${d.dataset} | ${d.before} | ${d.after} | ${delta >= 0 ? "+" : ""}${delta} |`);
    }
  }
  lines.push("");

  lines.push("## Citations");
  lines.push("");
  const uniqueCitations = Array.from(new Set(citations));
  if (uniqueCitations.length === 0) {
    lines.push("_No citations recorded for this batch._");
  } else {
    for (const c of uniqueCitations) lines.push(`- ${c}`);
  }
  lines.push("");

  return lines.join("\n");
}

// ─── branch naming (deterministic — no Date.now(); caller supplies label) ──

function sanitizeSlug(s: string): string {
  const slug = s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "batch";
}

/** `expand/<dataset>-<label>` — deterministic given caller-supplied inputs
 *  (the Task 17 recurring runner passes a stable label, e.g. a GapTask id or
 *  run date it already computed; this module never calls `Date.now()`). */
export function deriveBranchName(dataset: string, label: string): string {
  return `expand/${sanitizeSlug(dataset)}-${sanitizeSlug(label)}`;
}

// ─── sanctioned files this step commits (mirrors Task 15's write targets +
//     the audit artifacts its gate run regenerates) ────────────────────────

export const DEFAULT_FILES_TO_COMMIT = [
  "src/golf-courses-hhq-merge.ts",
  "src/residences-expansion.ts",
  "docs/coverage-matrix.md",
  "docs/audit-report.json",
];

function defaultCommitMessage(rowCountsByDataset: Record<string, number>, branch: string): string {
  const total = Object.values(rowCountsByDataset).reduce((a, b) => a + b, 0);
  const perDataset = Object.entries(rowCountsByDataset)
    .map(([d, c]) => `${d}+${c}`)
    .join(", ");
  return `expand: +${total} row(s) (${perDataset || "none"}) [${branch}]`;
}

// ─── proposePr ──────────────────────────────────────────────────────────────

export interface ProposePrOptions {
  /** Explicit branch name. If omitted, derived as `expand/<dataset>-<label>`. */
  branch?: string;
  /** Caller-supplied, deterministic label for the derived branch name (e.g.
   *  a GapTask id or a run identifier the Task 17 runner already computed).
   *  Never `Date.now()` — this module stays deterministic. */
  label?: string;
  /** Primary dataset name for the derived branch name (ignored if `branch`
   *  is given directly). Defaults to the first key of `rowCountsByDataset`. */
  dataset?: string;
  /** GapTasks (Task 13) this batch addressed. */
  gapTasks?: GapTask[];
  /** Rows accepted this batch, per dataset. */
  rowCountsByDataset?: Record<string, number>;
  /** Citation / primary-source URLs backing the added rows. */
  citations?: string[];
  /** Override for the BEFORE coverage-matrix.md content (tests). Defaults to
   *  `git show HEAD:docs/coverage-matrix.md` via the injected `run`. */
  beforeMatrixMd?: string;
  /** Override for the AFTER coverage-matrix.md content (tests). Defaults to
   *  reading the current on-disk `docs/coverage-matrix.md`. */
  afterMatrixMd?: string;
  /** Override the commit message. */
  commitMessage?: string;
  /** Sanctioned files to stage + commit on the branch. */
  filesToCommit?: string[];
  /** Repo root (tests point this at a scratch/temp repo). */
  repoRoot?: string;
  /** Directory containing `coverage-matrix.md` and where `pending-prs/` is
   *  written (tests point this at a scratch temp dir). Defaults to `docs/`
   *  under `repoRoot`. */
  docsDir?: string;
  /** Injected command runner for every git/gh invocation. Defaults to a real
   *  `spawnSync`-backed runner. Tests MUST inject a fake/spy here — this is
   *  the seam that keeps unit tests from ever shelling out or touching git. */
  run?: CommandRunner;
  /** Only when `true` does this function push + open a PR (`git push` +
   *  `gh pr create`). Defaults to `false` (LOCAL ONLY — the go-live
   *  constraint for this task). NOT exercised in Task 16. */
  push?: boolean;
}

export interface ProposePrResult {
  branch: string;
  body: string;
  bodyPath: string;
}

function readBeforeMatrix(run: CommandRunner, repoRoot: string): string {
  const res = run("git", ["show", "HEAD:docs/coverage-matrix.md"], { cwd: repoRoot });
  return res.status === 0 ? res.stdout : "";
}

function readAfterMatrix(docsDir: string): string {
  const p = join(docsDir, "coverage-matrix.md");
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

/**
 * Produces a LOCAL, ready-to-open PR: a branch + a commit of the sanctioned
 * expansion files + a PR-body markdown artifact under `docs/pending-prs/`.
 * Never pushes and never calls `gh` unless `opts.push === true` (opt-in,
 * default off, not exercised by Task 16) — every git/gh call goes through
 * the injectable `run` command runner.
 */
export function proposePr(opts: ProposePrOptions): ProposePrResult {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const run = opts.run ?? defaultRunner;
  const docsDir = opts.docsDir ?? join(repoRoot, "docs");

  const gapTasks = opts.gapTasks ?? [];
  const rowCountsByDataset = opts.rowCountsByDataset ?? {};
  const citations = opts.citations ?? [];

  const dataset = opts.dataset ?? Object.keys(rowCountsByDataset)[0] ?? "batch";
  const label = opts.label ?? "expansion";
  const branch = opts.branch ?? deriveBranchName(dataset, label);

  const beforeMatrixMd = opts.beforeMatrixMd ?? readBeforeMatrix(run, repoRoot);
  const afterMatrixMd = opts.afterMatrixMd ?? readAfterMatrix(docsDir);

  const body = buildPrBody({ gapTasks, rowCountsByDataset, citations, beforeMatrixMd, afterMatrixMd });

  const bodyPath = join(docsDir, "pending-prs", `${branch}.md`);
  mkdirSync(dirname(bodyPath), { recursive: true });
  writeFileSync(bodyPath, body);

  // ── Step 1: branch off current HEAD ──────────────────────────────────────
  run("git", ["checkout", "-b", branch], { cwd: repoRoot });

  // ── Step 2: stage + commit whatever changed in the sanctioned files ──────
  const filesToCommit = opts.filesToCommit ?? DEFAULT_FILES_TO_COMMIT;
  for (const f of filesToCommit) {
    run("git", ["add", "--", f], { cwd: repoRoot });
  }
  const commitMessage = opts.commitMessage ?? defaultCommitMessage(rowCountsByDataset, branch);
  run("git", ["commit", "-m", commitMessage], { cwd: repoRoot });

  // ── Step 3 (opt-in ONLY): push + open the PR for real. Default false — the
  // go-live constraint for this task keeps everything local. NOT exercised
  // by Task 16 (no test sets push:true against a real repo/gh). ────────────
  if (opts.push === true) {
    run("git", ["push", "-u", "origin", branch], { cwd: repoRoot });
    run("gh", ["pr", "create", "--title", commitMessage, "--body-file", bodyPath], { cwd: repoRoot });
  }

  return { branch, body, bodyPath };
}
