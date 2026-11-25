/**
 * automerge-data-prs.ts — merge the scheduled data PRs that are green; raise a
 * RED line the same day for the ones that are not.
 *
 * RULED (CONTROL SWEEP-2057, 2026-11-24): "a url-backfill / expansion PR opened
 * by the scheduled job that is green and touches only data rows + derived slices
 * AUTO-MERGES (same basis as the pin bumps); a red one raises a red line the same
 * day."
 *
 * WHY. Four +120-row url-backfill PRs sat unmerged for up to six weeks: 480
 * vetted rows that never reached a site. The lane opened them correctly and then
 * nobody merged them, and an open PR is silent.
 *
 * WHAT QUALIFIES (all three, or the PR is not this script's business):
 *   - head branch starts `expand/` (propose-pr / run-expansion / run-backfill)
 *   - author is the scheduled job's login (`ncmills`, gh in launchd)
 *   - targets `main`
 * Then, per PR:
 *   - every changed file in the ALLOWLIST, mergeable, every check passed -> MERGE
 *     (`gh pr merge <n> --merge`; never --admin, never force)
 *   - a failed check, a file outside the allowlist, or CONFLICTING -> NOT merged;
 *     a RED line `{date, pr, reason}` goes into the growth ledger and is printed
 *     `RED: shared-data #<n> <reason>`
 *   - checks still running, no checks yet, or mergeability UNKNOWN -> skipped, no red
 * A failed schema check ("COULD-NOT-RUN ... cli_login_postgres", a CI credential)
 * is RED like any other failure: CONTROL must see it, so it is not special-cased.
 *
 * Dry by default; `--apply` merges.
 *   npx tsx scripts/automerge-data-prs.ts [--apply] [--ledger=<path>]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_FILES_TO_COMMIT } from "./propose-pr";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO = "ncmills/shared-data";
/** The login the scheduled job's `gh` runs as (launchd com.ncmills.url-backfill). */
export const JOB_AUTHOR = "ncmills";
export const BRANCH_PREFIX = "expand/";

/**
 * THE ALLOWLIST. Derived from what the scheduled lanes commit, not guessed:
 *   - propose-pr.ts DEFAULT_FILES_TO_COMMIT (the sanctioned ingest targets +
 *     regenerated audit docs; run-backfill and run-expansion both go through it)
 *   - the PR-body artifact propose-pr writes at docs/pending-prs/<branch>.md,
 *     where <branch> is always expand/<...>
 *   - slices/*.json (derived per-wizard slices)
 * Anything else in the diff (code, schema, workflows, package files) is a RED.
 */
export const ALLOWED_FILES: readonly string[] = DEFAULT_FILES_TO_COMMIT;
const ALLOWED_PATTERNS: readonly RegExp[] = [/^docs\/pending-prs\/expand\/[^/]+\.md$/, /^slices\/[^/]+\.json$/];
/** The data files whose array rows count toward rows_added. */
export const DATA_FILES = DEFAULT_FILES_TO_COMMIT.filter((f) => f.startsWith("src/"));

export function isAllowed(path: string): boolean {
  return ALLOWED_FILES.includes(path) || ALLOWED_PATTERNS.some((re) => re.test(path));
}

// ─── shapes ─────────────────────────────────────────────────────────────────
export interface PrInfo {
  number: number;
  headRefName: string;
  baseRefName: string;
  author: { login: string };
  mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN" | string;
  files: { path: string }[];
}
export interface Check {
  name: string;
  /** gh pr checks bucket: pass | fail | pending | skipping | cancel */
  bucket: string;
  state: string;
  description?: string;
}
export interface MergedLine {
  date: string;
  pr: number;
  rows_added: number;
  lane: "backfill" | "expansion";
}
export interface RedLine {
  date: string;
  pr: number;
  reason: string;
}
export interface AutoMergeLedger {
  merged: MergedLine[];
  red: RedLine[];
}

export interface Deps {
  listPrs(): PrInfo[];
  checks(pr: number): Check[];
  /** Rows the PR adds to the data files (head vs merge-base). */
  rowsAdded(pr: PrInfo): number;
  merge(pr: number): void;
  readLedger(): Record<string, unknown> | null;
  writeLedger(ledger: Record<string, unknown>): void;
  log(m: string): void;
}

export type Verdict =
  | { kind: "ignore" }
  | { kind: "skip"; reason: string }
  | { kind: "red"; reason: string }
  | { kind: "merge" };

// ─── the decision (pure) ────────────────────────────────────────────────────
export function qualifies(pr: PrInfo): boolean {
  return pr.headRefName.startsWith(BRANCH_PREFIX) && pr.author?.login === JOB_AUTHOR && pr.baseRefName === "main";
}

export function decide(pr: PrInfo, checks: Check[]): Verdict {
  if (!qualifies(pr)) return { kind: "ignore" };
  const outside = pr.files.map((f) => f.path).filter((p) => !isAllowed(p));
  if (outside.length) return { kind: "red", reason: `file(s) outside the data allowlist: ${outside.join(", ")}` };
  if (pr.mergeable === "CONFLICTING") return { kind: "red", reason: "CONFLICTING with main" };
  const failed = checks.filter((c) => c.bucket === "fail" || c.bucket === "cancel");
  if (failed.length) {
    const why = failed.map((c) => `${c.name} ${c.state}${c.description ? ` (${c.description})` : ""}`);
    return { kind: "red", reason: `check failed: ${[...new Set(why)].join("; ")}` };
  }
  if (!checks.length) return { kind: "skip", reason: "no checks reported yet" };
  if (checks.some((c) => c.bucket === "pending")) return { kind: "skip", reason: "checks pending" };
  if (pr.mergeable !== "MERGEABLE") return { kind: "skip", reason: `mergeable=${pr.mergeable}` };
  // Everything left is pass or skipping (a job whose `if:` did not fire).
  return { kind: "merge" };
}

export function laneOfBranch(branch: string): MergedLine["lane"] {
  return /backfill/i.test(branch) ? "backfill" : "expansion";
}

/** Rows in `head` that are not in `base`, as a multiset of the row's JSON. */
export function countNewRows(base: unknown[] | null, head: unknown[] | null): number {
  const seen = new Map<string, number>();
  for (const r of base ?? []) {
    const k = JSON.stringify(r);
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  let n = 0;
  for (const r of head ?? []) {
    const k = JSON.stringify(r);
    const c = seen.get(k) ?? 0;
    if (c > 0) seen.set(k, c - 1);
    else n++;
  }
  return n;
}

/** The JSON array out of a machine-appended `export const X: T[] = [ ... ];` file. */
export function parseArrayExport(text: string): unknown[] | null {
  if (!text) return [];
  try {
    const start = text.indexOf("= [", text.indexOf("export const"));
    const end = text.lastIndexOf("]");
    if (start < 0 || end < start) return null;
    return JSON.parse(text.slice(start + 2, end + 1));
  } catch {
    return null;
  }
}

// ─── the run ────────────────────────────────────────────────────────────────
export interface RunResult {
  merged: MergedLine[];
  red: RedLine[];
  skipped: { pr: number; reason: string }[];
}

export function runAutomerge(opts: { apply: boolean; now: Date }, deps: Deps): RunResult {
  const date = opts.now.toISOString().slice(0, 10);
  const out: RunResult = { merged: [], red: [], skipped: [] };
  deps.log(`automerge-data-prs: ${opts.apply ? "APPLY" : "DRY RUN (no merge)"}`);
  for (const pr of deps.listPrs()) {
    if (!qualifies(pr)) continue;
    const v = decide(pr, deps.checks(pr.number));
    if (v.kind === "skip") {
      out.skipped.push({ pr: pr.number, reason: v.reason });
      deps.log(`skip: shared-data #${pr.number} ${v.reason}`);
    } else if (v.kind === "red") {
      out.red.push({ date, pr: pr.number, reason: v.reason });
      deps.log(`RED: shared-data #${pr.number} ${v.reason}`);
    } else if (v.kind === "merge") {
      const rows = deps.rowsAdded(pr);
      const line: MergedLine = { date, pr: pr.number, rows_added: rows, lane: laneOfBranch(pr.headRefName) };
      if (!opts.apply) {
        deps.log(`would merge: shared-data #${pr.number} (+${rows} rows, ${line.lane})`);
        continue;
      }
      try {
        deps.merge(pr.number);
      } catch (e) {
        const reason = `merge failed: ${e instanceof Error ? e.message : String(e)}`.slice(0, 300);
        out.red.push({ date, pr: pr.number, reason });
        deps.log(`RED: shared-data #${pr.number} ${reason}`);
        continue;
      }
      out.merged.push(line);
      deps.log(`merged: shared-data #${pr.number} (+${rows} rows, ${line.lane})`);
    }
  }
  if (opts.apply && (out.merged.length || out.red.length)) {
    const ledger = deps.readLedger() ?? {};
    const prev = (ledger.autoMerge as AutoMergeLedger | undefined) ?? { merged: [], red: [] };
    const merged = [...prev.merged];
    for (const m of out.merged) if (!merged.some((x) => x.pr === m.pr)) merged.push(m);
    // Twice a day plus the backfill hook: do not repeat an identical line the same day.
    const red = [...prev.red];
    for (const r of out.red) if (!red.some((x) => x.date === r.date && x.pr === r.pr && x.reason === r.reason)) red.push(r);
    deps.writeLedger({ ...ledger, autoMerge: { merged, red } });
  }
  deps.log(`automerge-data-prs: ${out.merged.length} merged, ${out.red.length} red, ${out.skipped.length} skipped`);
  return out;
}

// ─── real deps ──────────────────────────────────────────────────────────────
function sh(cmd: string, args: string[]): { status: number; out: string; err: string } {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return { status: r.status ?? 1, out: r.stdout ?? "", err: r.stderr ?? "" };
}
function must(cmd: string, args: string[]): string {
  const r = sh(cmd, args);
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} failed: ${r.err.trim().slice(0, 200)}`);
  return r.out;
}

export function realDeps(ledgerPath: string): Deps {
  return {
    listPrs: () =>
      JSON.parse(
        must("gh", [
          "pr", "list", "-R", REPO, "--state", "open", "--limit", "200",
          "--json", "number,headRefName,baseRefName,author,mergeable,files",
        ]),
      ),
    checks: (n) => {
      // gh exits 8 while checks are pending and 1 when one failed: read stdout, not the code.
      const r = sh("gh", ["pr", "checks", String(n), "-R", REPO, "--json", "name,state,bucket,description"]);
      if (!r.out.trim()) {
        if (/no checks reported/i.test(r.err)) return [];
        throw new Error(`gh pr checks ${n} failed: ${r.err.trim().slice(0, 200)}`);
      }
      return JSON.parse(r.out);
    },
    rowsAdded: (pr) => {
      must("git", ["fetch", "-q", "origin", pr.baseRefName, `+refs/pull/${pr.number}/head:refs/automerge/pr-${pr.number}`]);
      const head = `refs/automerge/pr-${pr.number}`;
      const base = must("git", ["merge-base", `origin/${pr.baseRefName}`, head]).trim();
      const show = (ref: string, p: string) => {
        const r = sh("git", ["show", `${ref}:${p}`]);
        return r.status === 0 ? r.out : "";
      };
      let n = 0;
      for (const f of DATA_FILES) {
        if (!pr.files.some((x) => x.path === f)) continue;
        n += countNewRows(parseArrayExport(show(base, f)), parseArrayExport(show(head, f)));
      }
      return n;
    },
    merge: (n) => {
      must("gh", ["pr", "merge", String(n), "-R", REPO, "--merge"]);
    },
    readLedger: () => (existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, "utf8")) : null),
    writeLedger: (l) => writeFileSync(ledgerPath, JSON.stringify(l, null, 2) + "\n"),
    log: (m) => console.log(m),
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const ledgerArg = argv.find((a) => a.startsWith("--ledger="));
  const ledgerPath = ledgerArg ? ledgerArg.slice("--ledger=".length) : join(ROOT, "docs", "growth-ledger.json");
  try {
    const r = runAutomerge({ apply: argv.includes("--apply"), now: new Date() }, realDeps(ledgerPath));
    if (r.red.length) process.exitCode = 1;
  } catch (e) {
    console.error("automerge-data-prs FAILED:", e instanceof Error ? e.message : e);
    process.exit(2);
  }
}
