/**
 * run-backfill.ts — the unattended URL/provenance backfill (plan item 2B.2).
 *
 * The ENRICH-lane entrypoint, and a thin one on purpose. `runExpansion` already
 * owns everything that is hard and already tested: top-K selection, the row cap
 * with explicit drop reporting, ingest through the real gate (verify +
 * check-brand-rules + audit) with transactional rollback, the accepted-vs-
 * submitted cross-check, and propose-PR. Only two things differ between the
 * lanes, and both are injection seams:
 *
 *   tasks    buildBackfillQueue()  instead of the gap queue
 *   research researchBackfill()    instead of researchGap()
 *
 * WHAT IT IS FOR. Measured 2026-07-31: 6,178 of 6,225 party rows carry no
 * followable source, and ZERO carry a `sourceUrl`. That is invisible to every
 * existing gate, because a source-less row is structurally valid — it renders,
 * and the audit passes. Golf sits at 877/999 because it goes through this
 * harness; the party universe never had an enrich path until now.
 *
 * Run (dry, safe, no writes):
 *   npx tsx scripts/run-backfill.ts --label=backfill-0731 --top-k=5 --row-cap=25 --dry-run
 * Run for real (local PR artifact, live-URL checked):
 *   npx tsx scripts/run-backfill.ts --label=backfill-0731 --top-k=5 --row-cap=25 --live-url-check
 * Run UNATTENDED (live-URL gate ON, opens a REAL PR — never merges):
 *   npx tsx scripts/run-backfill.ts --auto --top-k=5 --row-cap=25
 *
 * The `--auto` path is what `com.ncmills.url-backfill` (launchd) drives. Before
 * it existed this lane could only ever produce a LOCAL branch, so every batch
 * needed a human at a terminal — which is why the queue sat at 342 of 6,225
 * rows sourced, two batches in, with no third batch coming.
 */
import { buildBackfillQueue, loadAttempts, recordAttempts, type BackfillTask } from "./backfill-queue";
import { researchBackfill } from "./research-backfill";
import { runExpansion, type RunExpansionOptions, type RunResult } from "./run-expansion";

export interface RunBackfillOptions
  extends Omit<RunExpansionOptions<BackfillTask>, "research" | "gapQueue" | "gapQueuePath"> {
  /** Task list. Defaults to the live queue built from the real universe. */
  tasks?: BackfillTask[];
  /** Venues per research call. See `BackfillQueueOptions.maxVenuesPerTask` —
   *  an unbounded task times the researcher out and the fail-safe hides it. */
  maxVenuesPerTask?: number;
  /** Set false to leave the persisted attempt record alone. */
  recordAttempts?: boolean;
  /** Override the attempt-record path. Tests MUST set this — otherwise a test
   *  run writes fixture venues into the real record and silently sinks them in
   *  the next production run. (Happened once; hence this seam.) */
  attemptsPath?: string;
}

export async function runBackfill(opts: RunBackfillOptions): Promise<RunResult<BackfillTask>> {
  const tasks =
    opts.tasks ??
    buildBackfillQueue(undefined, {
      maxVenuesPerTask: opts.maxVenuesPerTask ?? 8,
      // Deprioritise venues previous runs already failed to source, so the
      // queue head does not silt up with residue (yield fell 22 -> 3 per batch
      // across the 31-batch run for exactly this reason).
      attempts: opts.recordAttempts === false ? {} : loadAttempts(opts.attemptsPath),
    }).tasks;

  const result = await runExpansion<BackfillTask>({
    ...opts,
    tasks,
    taskNoun: "backfill",
    // The whole substitution: same orchestration, different prompt + the
    // drift guard that the insert lane does not need (the patch key IS the
    // venue name, so an unasked-for venue can never resolve).
    research: (task) =>
      researchBackfill(task, opts.researcher, {
        liveUrlCheck: opts.liveUrlCheck,
        verifyUrl: opts.verifyUrl,
      }),
  });

  // Record which asked-about venues did NOT come back sourced, so the next run
  // sinks them instead of re-asking forever. Venues that DID land have their
  // record cleared.
  //
  // ONLY the venues this run actually ASKED ABOUT, and only on a real run.
  // `tasks` is the WHOLE queue — 1,350 tasks / 5,836 venues — while a run only
  // ever processes the top-K of it (`result.tasksConsidered`). Recording against
  // `tasks` marked every unsourced venue in the universe as failed on every run:
  // a run that sourced 20 rows retired the other ~5,816, and three runs took the
  // entire queue past maxAttempts. The lane would then report nothing left to
  // offer — indistinguishable from "the backfill is finished" — with 5,836 rows
  // still unsourced. Measured, not theorised: one dry run wrote 5,836 entries.
  //
  // A dry run attempts NOTHING, so it has nothing to record. Without this guard
  // the documented safe smoke path (`--auto --dry-run`) was the single most
  // destructive command in the lane.
  if (opts.recordAttempts !== false && !opts.dryRun) {
    const asked = result.tasksConsidered.flatMap((t) =>
      t.venues.map((name) => ({ destinationId: t.destinationId, category: t.category, name })),
    );
    const sourced = new Set(
      result.ingestedRows.map((r) => {
        const row = r as unknown as Record<string, unknown>;
        return `${row.destinationId}|${row.category}|${String(row.name ?? "").trim().toLowerCase()}`;
      }),
    );
    recordAttempts(asked, sourced, opts.attemptsPath);
  }

  return result;
}

/**
 * The backfill CLI's two-mode contract, pure + exported so the wiring — above
 * all `pushPr`, the one flag that can open a real PR — is unit-tested rather
 * than asserted in a comment. Mirrors `deriveCliConfig` in run-expansion.ts.
 *
 *   DEFAULT — researches and proposes a LOCAL branch only. Never pushes.
 *   `--auto` — unattended: live-URL gate ON + push ON (a real PR, never merged).
 *   `--auto --dry-run` — researches and reports, ingests nothing, pushes
 *      nothing. The safe way to smoke the real researcher on a schedule.
 */
export interface BackfillCliConfig {
  liveUrlCheck: boolean;
  /** Real PR push — true ONLY when `--auto` AND not a dry run. */
  pushPr: boolean;
}

export function deriveBackfillCliConfig(args: {
  auto?: boolean;
  dryRun?: boolean;
  liveUrlCheck?: boolean;
}): BackfillCliConfig {
  const auto = args.auto === true;
  const dryRun = args.dryRun === true;
  return {
    liveUrlCheck: auto || args.liveUrlCheck === true,
    pushPr: auto && !dryRun,
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Map(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? "true"] as const;
    }),
  );
  const num = (k: string, d: number) => {
    const v = args.get(k);
    const n = v === undefined ? NaN : Number(v);
    return Number.isFinite(n) ? n : d;
  };

  const label = args.get("label") ?? "url-backfill";
  const dryRun = args.get("dry-run") === "true";

  // `--auto` — the UNATTENDED mode the launchd job runs, same contract as
  // run-expansion's: live-URL gate ON + push ON (a REAL PR via
  // `proposePr({push:true})`). It never merges and never deploys; a human
  // reviews the PR. `--auto --dry-run` still researches and reports but
  // short-circuits before ingest, so it opens nothing — the safe smoke test.
  //
  // Without this flag the backfill lane could only ever produce a LOCAL branch,
  // which is why it had no way to run unattended: every batch needed a human at
  // a terminal to push it. That is the whole reason 5,836 of 6,225 rows were
  // still unsourced two batches in.
  const { liveUrlCheck, pushPr } = deriveBackfillCliConfig({
    auto: args.get("auto") === "true",
    dryRun,
    liveUrlCheck: args.get("live-url-check") === "true",
  });

  // A DRY RUN STILL RESEARCHES. That is the whole point of it: you want to see
  // what the researcher actually returns, and how much of it survives the
  // honesty firewall + drift guard, BEFORE anything touches a file. `dryRun`
  // skips ingest and the branch, not the research.
  //
  // `--no-research` is the separate, cheaper switch for exercising only the
  // plumbing (and it does not need the `claude` CLI present).
  const noResearch = args.get("no-research") === "true";
  const researcher = noResearch
    ? async () => []
    : (await import("./researcher-claude")).claudeResearcher({
        // WIRE THE DIAGNOSTIC LOG. `claudeResearcher` is fail-safe by design —
        // it returns [] on a timeout, a non-zero exit, or a parse failure — so
        // without this a silent failure and a genuine "found nothing" are
        // indistinguishable, and the run reports "0 researched, 0 rejected"
        // either way. Absence of a measurement is not a passing measurement.
        log: (m: string) => console.log(`  ${m}`),
        timeoutMs: num("researcher-timeout-ms", 180_000),
      });

  const maxVenuesPerTask = num("max-venues-per-task", 8);
  const q = buildBackfillQueue(undefined, { maxVenuesPerTask });
  console.log(
    `run-backfill: ${q.totalUnsourced} of ${q.totalRows} party rows unsourced ` +
      `across ${q.tasks.length} task(s)\n`,
  );

  const res = await runBackfill({
    label,
    topK: num("top-k", 5),
    rowCap: num("row-cap", 25),
    dryRun,
    liveUrlCheck,
    pushPr,
    researcher,
    maxVenuesPerTask,
  });

  // Print what was actually sourced. On a dry run this IS the deliverable —
  // a summary line alone cannot be reviewed, and "n rows sourced" is exactly
  // the kind of number this repo has learned not to trust without seeing the
  // rows behind it.
  if (res.researchedRows.length > 0) {
    console.log(`\nrows that survived research (${res.researchedRows.length}):`);
    for (const r of res.researchedRows) {
      const row = r as unknown as Record<string, unknown>;
      console.log(`  ${row.destinationId}/${row.category}  ${row.name}`);
      console.log(`      -> ${row.url ?? row.sourceUrl}`);
    }
  }

  if (res.rejections.length > 0) {
    console.log(`\nrejected candidates (${res.rejections.length}):`);
    for (const r of res.rejections) {
      console.log(`  ${r.taskId} [#${r.index}]`);
      for (const reason of r.reasons) console.log(`      ${reason}`);
    }
  }

  console.log(
    `\nrun-backfill[${label}]: ${res.researchedRows.length} researched, ` +
      `${dryRun ? "0 ingested (DRY RUN)" : `${res.ingestedRows.length} row(s) ingested`}, ` +
      `${res.rejectedCandidates} candidate(s) rejected, ` +
      `${res.droppedByCap.length} task(s) trimmed by the cap`,
  );
}
