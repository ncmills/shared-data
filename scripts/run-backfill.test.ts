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
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runBackfill, deriveBackfillCliConfig } from "./run-backfill";
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
