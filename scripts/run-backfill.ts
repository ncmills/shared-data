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
 */
import { buildBackfillQueue, type BackfillTask } from "./backfill-queue";
import { researchBackfill } from "./research-backfill";
import { runExpansion, type RunExpansionOptions, type RunResult } from "./run-expansion";

export interface RunBackfillOptions
  extends Omit<RunExpansionOptions<BackfillTask>, "research" | "gapQueue" | "gapQueuePath"> {
  /** Task list. Defaults to the live queue built from the real universe. */
  tasks?: BackfillTask[];
  /** Venues per research call. See `BackfillQueueOptions.maxVenuesPerTask` —
   *  an unbounded task times the researcher out and the fail-safe hides it. */
  maxVenuesPerTask?: number;
}

export async function runBackfill(opts: RunBackfillOptions): Promise<RunResult<BackfillTask>> {
  const tasks =
    opts.tasks ?? buildBackfillQueue(undefined, { maxVenuesPerTask: opts.maxVenuesPerTask ?? 8 }).tasks;

  return runExpansion<BackfillTask>({
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
  const liveUrlCheck = args.get("live-url-check") === "true";

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
