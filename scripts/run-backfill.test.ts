// run-backfill.test.ts — the unattended URL/provenance backfill runner.
//
// Reuses `runExpansion`'s orchestration wholesale (top-K, rowCap with explicit
// drop reporting, ingest through the real gate, propose-PR, the no-silent-
// truncation discipline) and swaps only the two halves that differ: tasks come
// from `buildBackfillQueue` instead of the gap queue, and research goes through
// `researchBackfill` instead of `researchGap`.
//
// Everything is injected here — no network, no writes, no real gates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runBackfill, deriveBackfillCliConfig, runMeasuredNothing } from "./run-backfill";
import type { BackfillTask } from "./backfill-queue";
import type { IngestResult } from "./ingest-researched";

const TASKS: BackfillTask[] = [
  {
    id: "url-backfill:alpha-mn:activity",
    destinationId: "alpha-mn",
    city: "Alpha",
    state: "MN",
    category: "activity",
    venues: ["Alpha One", "Alpha Two"],
    wizardsServed: ["bestman", "moh"],
    leverageScore: 4,
  },
  {
    id: "url-backfill:beta-mn:dining",
    destinationId: "beta-mn",
    city: "Beta",
    state: "MN",
    category: "dining",
    venues: ["Beta One"],
    wizardsServed: ["moh"],
    leverageScore: 1,
  },
];

function patchFor(task: BackfillTask, venue: string) {
  return {
    dataset: "party-venue-patch",
    destinationId: task.destinationId,
    category: task.category,
    name: venue,
    url: `https://www.${venue.toLowerCase().replace(/\s+/g, "-")}.test/`,
    sourceUrl: `https://www.${venue.toLowerCase().replace(/\s+/g, "-")}.test/`,
    citations: [`https://www.${venue.toLowerCase().replace(/\s+/g, "-")}.test/about`],
  };
}

/** A researcher that sources every venue it was asked about. It reads the
 *  venue names back out of the prompt, so it also proves the prompt carries
 *  them. */
const goodResearcher = async (prompt: string) => {
  const task = TASKS.find((t) => prompt.includes(t.destinationId))!;
  return task.venues.map((v) => patchFor(task, v));
};

const okIngest = (rows: unknown[]): IngestResult => ({
  accepted: rows.length,
  rejected: 0,
  reasons: [],
  skippedDuplicates: [],
  acceptedRows: rows as never,
});

const baseOpts = {
  label: "backfill-test",
  // Never touch the real record from a test — a fixture venue written here
  // would be deprioritised in the next PRODUCTION run.
  recordAttempts: false as const,
  topK: 10,
  rowCap: 100,
  tasks: TASKS,
  researcher: goodResearcher,
  ingest: okIngest,
  propose: () => ({ branch: "expand/backfill-test", path: "/tmp/x.md", body: "" }) as never,
  log: () => {},
};

test("researches every considered task and ingests the resulting patches", async () => {
  const res = await runBackfill({ ...baseOpts });

  assert.equal(res.ingestedRows.length, 3, "2 alpha venues + 1 beta venue");
  assert.ok(
    res.ingestedRows.every((r) => r.dataset === "party-venue-patch"),
    "the backfill must emit PATCH rows, not inserts",
  );
});

test("honours topK", async () => {
  const res = await runBackfill({ ...baseOpts, topK: 1 });

  assert.equal(res.tasksConsidered.length, 1);
  assert.equal(res.ingestedRows.length, 2, "only the first task's venues");
});

test("honours rowCap and REPORTS what it dropped", async () => {
  const res = await runBackfill({ ...baseOpts, rowCap: 2 });

  assert.equal(res.ingestedRows.length, 2);
  assert.ok(res.droppedByCap.length > 0, "a cap that trims must say so");
});

test("a dry run researches but never ingests", async () => {
  let ingestCalls = 0;
  const res = await runBackfill({
    ...baseOpts,
    dryRun: true,
    ingest: (rows: unknown[]) => {
      ingestCalls++;
      return okIngest(rows);
    },
  });

  assert.equal(ingestCalls, 0, "dry run must not touch the ingest gate");
  assert.equal(res.ingestResult, undefined);
  assert.ok(res.researchedRows.length > 0, "but it must still do the research");
});

test("counts drift rejections instead of ingesting them", async () => {
  const driftingResearcher = async (prompt: string) => {
    const task = TASKS.find((t) => prompt.includes(t.destinationId))!;
    return [patchFor(task, "A Venue Nobody Asked About")];
  };

  const res = await runBackfill({ ...baseOpts, researcher: driftingResearcher });

  assert.equal(res.ingestedRows.length, 0, "drifted rows must never reach ingest");
  assert.equal(res.rejectedCandidates, 2, "one per task, both reported");
});

test("the prompt sent to the researcher is the BACKFILL prompt, not the gap prompt", async () => {
  const prompts: string[] = [];
  await runBackfill({
    ...baseOpts,
    researcher: async (p: string) => {
      prompts.push(p);
      return [];
    },
  });

  assert.equal(prompts.length, 2);
  assert.ok(
    prompts.every((p) => p.includes("party-venue-patch")),
    "must ask for patches",
  );
  assert.ok(prompts[0].includes("Alpha One"), "must name the venues to source");
  assert.ok(
    !prompts.some((p) => /starved|deficit/i.test(p)),
    "must not be the gap-filling prompt",
  );
});

test("an empty queue is a valid run, not a crash", async () => {
  const res = await runBackfill({ ...baseOpts, tasks: [] });

  assert.equal(res.ingestedRows.length, 0);
  assert.equal(res.ingestResult, undefined, "nothing to ingest → no gate, no branch");
});

test("threads the live-URL check through to research", async () => {
  let verified = 0;
  const res = await runBackfill({
    ...baseOpts,
    liveUrlCheck: true,
    verifyUrl: async () => {
      verified++;
      return { ok: false, status: 404, reason: "dead" };
    },
  });

  assert.ok(verified > 0, "liveUrlCheck must actually reach the verifier");
  assert.equal(res.ingestedRows.length, 0, "dead sources must not land");
});

test("surfaces WHY each candidate was rejected, not just how many", async () => {
  // A bare count is unreviewable: "1 rejected" gives no way to tell a drifted
  // venue from a dead URL from a fabricated one, and those need different
  // responses. Observed on the first real run — 1 of 5 candidates rejected,
  // with no way to see which or why.
  const driftingResearcher = async (prompt: string) => {
    const task = TASKS.find((t) => prompt.includes(t.destinationId))!;
    return [patchFor(task, "A Venue Nobody Asked About")];
  };

  const res = await runBackfill({ ...baseOpts, researcher: driftingResearcher });

  assert.equal(res.rejectedCandidates, 2);
  assert.equal(res.rejections.length, 2, "every rejection must be reportable");
  assert.ok(
    res.rejections.every((r) => r.taskId && r.reasons.length > 0),
    "each carries its task and at least one reason",
  );
  assert.match(res.rejections[0].reasons.join(" "), /drift/i);
});

// ─── --auto / pushPr wiring ─────────────────────────────────────────────────
//
// `pushPr` is the only flag in this lane that can open a real PR against the
// repo, so its derivation is pinned rather than left to a comment. The case
// that matters most is the THIRD one: `--auto --dry-run` is how the schedule is
// smoke-tested, and it must never push.

test("deriveBackfillCliConfig: default mode never pushes", () => {
  const cfg = deriveBackfillCliConfig({});
  assert.equal(cfg.pushPr, false);
  assert.equal(cfg.liveUrlCheck, false);
});

test("deriveBackfillCliConfig: --auto turns on the live-URL gate AND push", () => {
  const cfg = deriveBackfillCliConfig({ auto: true });
  assert.equal(cfg.pushPr, true, "unattended mode opens a real PR");
  assert.equal(cfg.liveUrlCheck, true, "--auto must not ingest dead sources");
});

test("deriveBackfillCliConfig: --auto --dry-run researches but NEVER pushes", () => {
  const cfg = deriveBackfillCliConfig({ auto: true, dryRun: true });
  assert.equal(cfg.pushPr, false, "a dry run must never open a PR");
  assert.equal(cfg.liveUrlCheck, true, "the gate still reports honestly");
});

test("deriveBackfillCliConfig: --dry-run alone cannot push either", () => {
  assert.equal(deriveBackfillCliConfig({ dryRun: true }).pushPr, false);
});

test("deriveBackfillCliConfig: --live-url-check without --auto still never pushes", () => {
  const cfg = deriveBackfillCliConfig({ liveUrlCheck: true });
  assert.equal(cfg.liveUrlCheck, true);
  assert.equal(cfg.pushPr, false, "only --auto may push");
});

test("records a failed venue so the next run sinks it, and clears one that landed", async () => {
  const dir = mkdtempSync(join(tmpdir(), "attempts-"));
  const path = join(dir, "backfill-attempts.json");
  try {
    // The researcher sources only the FIRST venue of the alpha task.
    const partial = async (prompt: string) => {
      const task = TASKS.find((t) => prompt.includes(t.destinationId))!;
      return task.destinationId === "alpha-mn" ? [patchFor(task, task.venues[0])] : [];
    };

    await runBackfill({ ...baseOpts, recordAttempts: true, attemptsPath: path, researcher: partial });

    const rec = JSON.parse(readFileSync(path, "utf-8")) as Record<string, number>;
    assert.equal(rec["alpha-mn|activity|alpha one"], undefined, "a venue that landed carries no failure");
    assert.equal(rec["alpha-mn|activity|alpha two"], 1, "the one that did not is counted");
    assert.equal(rec["beta-mn|dining|beta one"], 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── attempt-record blast radius (2026-08-02) ───────────────────────────────
//
// The attempt record is what retires a venue from the queue after maxAttempts.
// Two ways it was over-recording, both measured, both silent:
//   • it recorded against the WHOLE queue rather than the top-K actually asked
//     about — one run retired every unsourced venue in the universe (a dry run
//     against the real queue wrote 5,836 entries);
//   • a DRY RUN recorded too, though it attempts nothing — so the documented
//     safe smoke command was the most destructive one in the lane.
// The failure mode is the dangerous kind: the queue reports nothing left to
// offer, which reads exactly like "the backfill finished".

/** Ten tasks, so a top-K of 2 leaves 8 that must NOT be recorded. */
const TEN_TASKS: BackfillTask[] = Array.from({ length: 10 }, (_, i) => ({
  ...TASKS[0],
  id: `url-backfill:city-${i}:activity`,
  destinationId: `city-${i}`,
  venues: [`Venue ${i}`],
}));

test("attempts are recorded ONLY for the top-K tasks a run actually considered", async () => {
  const dir = mkdtempSync(join(tmpdir(), "attempts-topk-"));
  const path = join(dir, "backfill-attempts.json");
  try {
    const res = await runBackfill({
      ...baseOpts,
      tasks: TEN_TASKS,
      topK: 2,
      recordAttempts: true,
      attemptsPath: path,
      researcher: async () => [],
    });

    assert.equal(res.tasksConsidered.length, 2, "only top-K is processed");
    const rec = JSON.parse(readFileSync(path, "utf-8")) as Record<string, number>;
    assert.equal(
      Object.keys(rec).length,
      2,
      `a run considering 2 of 10 tasks must not retire all 10 — wrote ${Object.keys(rec).length}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a DRY RUN records no attempts at all — it attempted nothing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "attempts-dry-"));
  const path = join(dir, "backfill-attempts.json");
  try {
    await runBackfill({
      ...baseOpts,
      tasks: TASKS,
      dryRun: true,
      recordAttempts: true,
      attemptsPath: path,
      researcher: async () => [],
    });
    assert.equal(
      existsSync(path),
      false,
      "a dry run must not retire venues it never tried to ingest",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// A run during which the host SLEPT looks exactly like a run of total research
// failure — every call returns []. It is not one. The 2026-08-04 run recorded
// 110 attempts of which ~88 were venues killed mid-DarkWake, never researched.
test("a run where the HOST SLEPT records no attempts — those venues were never asked", async () => {
  const dir = mkdtempSync(join(tmpdir(), "attempts-suspended-"));
  const path = join(dir, "backfill-attempts.json");
  try {
    await runBackfill({
      ...baseOpts,
      tasks: TASKS,
      recordAttempts: true,
      attemptsPath: path,
      // Same observable behaviour as a genuine research failure...
      researcher: async () => [],
      // ...but the host went to sleep, so it is not evidence about any venue.
      hostSuspended: () => true,
    });
    assert.equal(
      existsSync(path),
      false,
      "a sleeping host must not retire venues it never actually researched",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("without a sleeping host, the SAME empty run still records attempts", async () => {
  const dir = mkdtempSync(join(tmpdir(), "attempts-awake-"));
  const path = join(dir, "backfill-attempts.json");
  try {
    await runBackfill({
      ...baseOpts,
      tasks: TASKS,
      recordAttempts: true,
      attemptsPath: path,
      researcher: async () => [],
      hostSuspended: () => false,
    });
    assert.equal(
      existsSync(path),
      true,
      "a genuine failure while awake IS evidence and must still be recorded",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── timeouts are not verdicts (2026-08-06) ──────────────────────────────────
// Measured on the TOP_K=40 run: 14 of 28 research calls hit the 180s timeout.
// Each asked about 8 venues, so recording that run's attempts would have struck
// ~112 venues the researcher never actually looked at — against an attempts file
// already holding 62 venues one strike from permanent retirement (maxAttempts=3).
// `hostSuspended` already had this seam; timeout and non-zero exit did not.
test("a run with TIMED-OUT research calls records no attempts — those venues were never asked", async () => {
  const dir = mkdtempSync(join(tmpdir(), "attempts-unmeasured-"));
  const path = join(dir, "backfill-attempts.json");
  try {
    await runBackfill({
      ...baseOpts,
      tasks: TASKS,
      recordAttempts: true,
      attemptsPath: path,
      // Indistinguishable from a genuine "found nothing" at this seam...
      researcher: async () => [],
      hostSuspended: () => false,
      // ...but the calls timed out, so they measured nothing.
      unmeasuredCalls: () => 3,
    });
    assert.equal(
      existsSync(path),
      false,
      "a timed-out call must not retire venues it never actually researched",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("with ZERO unmeasured calls, the same empty run still records attempts", async () => {
  const dir = mkdtempSync(join(tmpdir(), "attempts-measured-"));
  const path = join(dir, "backfill-attempts.json");
  try {
    await runBackfill({
      ...baseOpts,
      tasks: TASKS,
      recordAttempts: true,
      attemptsPath: path,
      researcher: async () => [],
      hostSuspended: () => false,
      unmeasuredCalls: () => 0,
    });
    assert.equal(
      existsSync(path),
      true,
      "a clean call that genuinely found nothing IS evidence and must still count",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── a run that measured nothing is not a successful run (2026-08-06) ───────
test("runMeasuredNothing: every call unmeasured ⇒ the run failed", () => {
  assert.equal(runMeasuredNothing(40, 40), true);
  assert.equal(runMeasuredNothing(1, 1), true);
});

test("runMeasuredNothing: a PARTIAL failure is still a real run", () => {
  // ~42% of calls time out normally. That must not fail the job.
  assert.equal(runMeasuredNothing(40, 17), false);
  assert.equal(runMeasuredNothing(40, 39), false);
});

test("runMeasuredNothing: an EMPTY QUEUE makes no calls and is a success", () => {
  // The drain's terminal state. Failing here would turn "done" into an alarm.
  assert.equal(runMeasuredNothing(0, 0), false);
});
