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
}

export async function runBackfill(opts: RunBackfillOptions): Promise<RunResult<BackfillTask>> {
  const tasks = opts.tasks ?? buildBackfillQueue().tasks;

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

  // The real researcher is only imported for a live run — a dry run should not
  // need the `claude` CLI present.
  const researcher = dryRun
    ? async () => []
    : (await import("./researcher-claude")).claudeResearcher();

  const q = buildBackfillQueue();
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
  });

  console.log(
    `\nrun-backfill[${label}]: ${res.ingestedRows.length} row(s) ingested, ` +
      `${res.rejectedCandidates} candidate(s) rejected, ` +
      `${res.droppedByCap.length} task(s) trimmed by the cap`,
  );
}
