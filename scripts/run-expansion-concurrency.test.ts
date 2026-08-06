// run-expansion-concurrency.test.ts — the bounded, ORDER-PRESERVING research pool.
//
// Step 1 of `runExpansion` used to be a strictly sequential `for…of await`: a
// top-K=40 backfill run cost 40 × up-to-180s of wall clock and spent ~59% of it
// inside calls that timed out and returned nothing. It is now a bounded worker
// pool, and that change puts one correctness property at risk above all others:
//
//   perTask is consumed in GAP-PRIORITY ORDER by the rowCap step, so if
//   completion order leaked into the results, a fast low-priority task would
//   silently steal cap headroom from a slow high-priority one. Nothing
//   downstream would notice — the run would just quietly ingest the wrong rows.
//
// So these tests pin, in order of importance:
//   1. results are in INPUT order even when tasks finish in reverse
//   2. rowCap therefore still trims the LAST tasks, not the slowest ones
//   3. in-flight research calls never exceed the configured limit
//   4. a THROWING task is contained: 0 rows, run continues, failure recorded
//      in `rejections`, siblings' rejections still land
//   5. the counters (`rejectedCandidates`, `rejections` with taskId + index)
//      survive the rewrite unchanged
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_RESEARCH_CONCURRENCY,
  deriveCliConfig,
  mapWithConcurrency,
  runExpansion,
  type ExpansionTask,
  type RunExpansionOptions,
} from "./run-expansion";
import type { ResearchGapResult } from "./research-gap";
import type { ResearchedRow } from "../src/research-schema";
import type { IngestResult } from "./ingest-researched";

// ─── fixtures ───────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface FakeTask extends ExpansionTask {
  id: string;
  leverageScore: number;
}

function tasks(n: number): FakeTask[] {
  return Array.from({ length: n }, (_, i) => ({ id: `task-${i}`, leverageScore: n - i }));
}

/** A patch-shaped row tagged with its owning task, so order is assertable. */
function rowFor(taskId: string, k: number): ResearchedRow {
  return {
    dataset: "party-venue-patch",
    destinationId: taskId,
    category: "activity",
    name: `${taskId}-row-${k}`,
    url: `https://${taskId}-${k}.test/`,
    sourceUrl: `https://${taskId}-${k}.test/`,
    citations: [`https://${taskId}-${k}.test/about`],
  } as unknown as ResearchedRow;
}

const okIngest = (rows: ResearchedRow[]): IngestResult => ({
  accepted: rows.length,
  rejected: 0,
  reasons: [],
  acceptedRows: rows,
  skippedDuplicates: [],
});

function baseOpts(over: Partial<RunExpansionOptions<FakeTask>>): RunExpansionOptions<FakeTask> {
  return {
    topK: 100,
    rowCap: 1000,
    label: "concurrency-test",
    researcher: async () => [], // unused: every test injects `research`
    ingest: okIngest,
    propose: (o) => ({ branch: o.branch ?? "expand/x", body: "", bodyPath: "/tmp/x.md" }),
    log: () => {},
    ...over,
  } as RunExpansionOptions<FakeTask>;
}

const namesOf = (rows: ResearchedRow[]) => rows.map((r) => (r as unknown as { name: string }).name);

// ─── 1. ORDER IS PRESERVED WHEN TASKS FINISH OUT OF ORDER ───────────────────

test("results are in QUEUE order even when the LAST task finishes FIRST", async () => {
  const queue = tasks(6);
  const completed: string[] = [];

  // Task 0 sleeps longest, task 5 returns immediately → completion order is the
  // exact REVERSE of queue order.
  const research = async (task: FakeTask): Promise<ResearchGapResult> => {
    const i = Number(task.id.split("-")[1]);
    await sleep((queue.length - i) * 12);
    completed.push(task.id);
    return { rows: [rowFor(task.id, 0)], rejected: 0, rejections: [] };
  };

  const res = await runExpansion<FakeTask>(
    baseOpts({ tasks: queue, research, researchConcurrency: 6 }),
  );

  // the premise: they really did finish backwards
  assert.deepEqual(
    completed,
    ["task-5", "task-4", "task-3", "task-2", "task-1", "task-0"],
    "precondition: later tasks must have resolved first",
  );

  // ...and the output is nonetheless in queue order
  assert.deepEqual(namesOf(res.researchedRows), [
    "task-0-row-0",
    "task-1-row-0",
    "task-2-row-0",
    "task-3-row-0",
    "task-4-row-0",
    "task-5-row-0",
  ]);
  assert.deepEqual(namesOf(res.ingestedRows), namesOf(res.researchedRows));
  assert.deepEqual(
    res.tasksAddressed.map((t) => t.id),
    queue.map((t) => t.id),
  );
});

// ─── 2. rowCap still trims the LAST tasks, not the FASTEST ones ─────────────
//
// This is the failure the order guarantee exists to prevent: with a cap of 3
// and 3 tasks × 2 rows, the cap must keep task-0's two rows + one of task-1's
// and drop task-2 entirely — even though task-2 finished first.

test("rowCap trims in QUEUE priority order regardless of completion order", async () => {
  const queue = tasks(3);
  const research = async (task: FakeTask): Promise<ResearchGapResult> => {
    const i = Number(task.id.split("-")[1]);
    await sleep((queue.length - i) * 15);
    return { rows: [rowFor(task.id, 0), rowFor(task.id, 1)], rejected: 0, rejections: [] };
  };

  const res = await runExpansion<FakeTask>(
    baseOpts({ tasks: queue, rowCap: 3, research, researchConcurrency: 3 }),
  );

  assert.deepEqual(
    namesOf(res.ingestedRows),
    ["task-0-row-0", "task-0-row-1", "task-1-row-0"],
    "the cap must keep the HIGHEST-priority rows, not the first ones to arrive",
  );
  const capped = res.droppedByCap.find((d) => d.task.id === "task-1");
  const dropped = res.droppedByCap.find((d) => d.task.id === "task-2");
  assert.ok(capped, "task-1 was trimmed mid-task");
  assert.match(capped!.reason, /reached mid-task/);
  assert.ok(dropped, "task-2 was dropped whole");
  assert.match(dropped!.reason, /already reached/);
});

// ─── 3. THE POOL IS BOUNDED ─────────────────────────────────────────────────

test("never more than `researchConcurrency` research calls are in flight", async () => {
  const queue = tasks(12);
  let inFlight = 0;
  let maxInFlight = 0;

  const research = async (task: FakeTask): Promise<ResearchGapResult> => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await sleep(10);
    inFlight--;
    return { rows: [rowFor(task.id, 0)], rejected: 0, rejections: [] };
  };

  const res = await runExpansion<FakeTask>(
    baseOpts({ tasks: queue, research, researchConcurrency: 3 }),
  );

  assert.equal(maxInFlight, 3, `pool width must be exactly 3, saw ${maxInFlight}`);
  assert.equal(inFlight, 0, "every call settled");
  assert.equal(res.researchedRows.length, 12, "all 12 tasks still ran");
});

test("researchConcurrency:1 is still correct (the old sequential behaviour)", async () => {
  const queue = tasks(4);
  let inFlight = 0;
  let maxInFlight = 0;
  const research = async (task: FakeTask): Promise<ResearchGapResult> => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await sleep(5);
    inFlight--;
    return { rows: [rowFor(task.id, 0)], rejected: 0, rejections: [] };
  };

  const res = await runExpansion<FakeTask>(
    baseOpts({ tasks: queue, research, researchConcurrency: 1 }),
  );

  assert.equal(maxInFlight, 1);
  assert.deepEqual(namesOf(res.researchedRows), [
    "task-0-row-0",
    "task-1-row-0",
    "task-2-row-0",
    "task-3-row-0",
  ]);
});

test("the default pool width is DEFAULT_RESEARCH_CONCURRENCY (6), not unbounded", async () => {
  assert.equal(DEFAULT_RESEARCH_CONCURRENCY, 6);

  const queue = tasks(20);
  let inFlight = 0;
  let maxInFlight = 0;
  const research = async (task: FakeTask): Promise<ResearchGapResult> => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await sleep(8);
    inFlight--;
    return { rows: [], rejected: 0, rejections: [] };
  };

  await runExpansion<FakeTask>(baseOpts({ tasks: queue, research })); // no override

  assert.equal(
    maxInFlight,
    DEFAULT_RESEARCH_CONCURRENCY,
    `20 tasks must not launch 20 researchers at once, saw ${maxInFlight}`,
  );
});

// ─── 4. A THROWING TASK IS CONTAINED ────────────────────────────────────────

test("a research call that THROWS does not abort the run, and is recorded", async () => {
  const queue = tasks(4);
  const research = async (task: FakeTask): Promise<ResearchGapResult> => {
    if (task.id === "task-1") throw new Error("boom: researcher blew up");
    if (task.id === "task-2") {
      // a sibling with REAL rejections — these must survive the failure
      return {
        rows: [rowFor(task.id, 0)],
        rejected: 2,
        rejections: [
          { index: 0, reasons: ["researcher drift: not asked about"] },
          { index: 3, reasons: ["dead sourceUrl (404)"] },
        ],
      };
    }
    return { rows: [rowFor(task.id, 0)], rejected: 0, rejections: [] };
  };

  const res = await runExpansion<FakeTask>(
    baseOpts({ tasks: queue, research, researchConcurrency: 4 }),
  );

  // the run completed and the other three tasks landed, in order
  assert.deepEqual(namesOf(res.ingestedRows), ["task-0-row-0", "task-2-row-0", "task-3-row-0"]);

  // the throw is VISIBLE, not swallowed into a silent zero
  const failure = res.rejections.find((r) => r.taskId === "task-1");
  assert.ok(failure, "the failed task must be reported");
  assert.equal(failure!.index, -1, "index -1 marks a task-level failure, not a rejected candidate");
  assert.match(failure!.reasons.join(" "), /boom: researcher blew up/);

  // ...but it did not inflate the candidate-rejection counter — no candidate
  // was ever produced to reject.
  assert.equal(res.rejectedCandidates, 2, "only task-2's two real rejects count");

  // the sibling's rejections still land, with their taskId + index intact
  const sibling = res.rejections.filter((r) => r.taskId === "task-2");
  assert.equal(sibling.length, 2);
  assert.deepEqual(
    sibling.map((r) => r.index),
    [0, 3],
  );
  assert.match(sibling[0].reasons.join(" "), /drift/);
});

test("every task throwing is still a valid, reported run (not a crash)", async () => {
  const queue = tasks(3);
  const res = await runExpansion<FakeTask>(
    baseOpts({
      tasks: queue,
      researchConcurrency: 2,
      research: async () => {
        throw new Error("total outage");
      },
    }),
  );

  assert.equal(res.researchedRows.length, 0);
  assert.equal(res.ingestedRows.length, 0);
  assert.equal(res.rejections.length, 3, "one task-level failure per task");
  assert.equal(res.pr, undefined, "nothing landed → no branch");
});

// ─── 5. rejections stay in QUEUE order (they are reviewed as a list) ─────────

test("rejections are flattened in QUEUE order, not completion order", async () => {
  const queue = tasks(4);
  const research = async (task: FakeTask): Promise<ResearchGapResult> => {
    const i = Number(task.id.split("-")[1]);
    await sleep((queue.length - i) * 12); // reverse completion again
    return {
      rows: [],
      rejected: 1,
      rejections: [{ index: 0, reasons: [`bad candidate from ${task.id}`] }],
    };
  };

  const res = await runExpansion<FakeTask>(
    baseOpts({ tasks: queue, research, researchConcurrency: 4 }),
  );

  assert.deepEqual(
    res.rejections.map((r) => r.taskId),
    ["task-0", "task-1", "task-2", "task-3"],
  );
  assert.equal(res.rejectedCandidates, 4);
});

// ─── 6. per-task logging still names its task (lines now interleave) ────────

test("each per-task log line carries its own task id and position", async () => {
  const queue = tasks(3);
  const res = await runExpansion<FakeTask>(
    baseOpts({
      tasks: queue,
      taskNoun: "backfill",
      researchConcurrency: 3,
      research: async (task) => {
        const i = Number(task.id.split("-")[1]);
        await sleep((queue.length - i) * 10);
        return { rows: [rowFor(task.id, 0)], rejected: 0, rejections: [] };
      },
    }),
  );

  for (const t of queue) {
    const line = res.logs.find((l) => l.includes(`backfill ${t.id}:`));
    assert.ok(line, `a log line must name ${t.id}`);
    assert.match(line!, /\[\d+\/3\]/, "and carry its queue position, since lines interleave");
  }
});

// ─── 7. the pool primitive itself ───────────────────────────────────────────

test("mapWithConcurrency preserves input order and clamps the width", async () => {
  const items = [50, 10, 30, 0, 20];
  const out = await mapWithConcurrency(items, 3, async (ms, i) => {
    await sleep(ms);
    return `${i}:${ms}`;
  });
  assert.deepEqual(out, ["0:50", "1:10", "2:30", "3:0", "4:20"]);

  // degenerate widths must not hang or over-run
  assert.deepEqual(await mapWithConcurrency([1, 2], 0, async (x) => x * 2), [2, 4]);
  assert.deepEqual(await mapWithConcurrency([1, 2], -5, async (x) => x * 2), [2, 4]);
  assert.deepEqual(await mapWithConcurrency([1, 2], 99, async (x) => x * 2), [2, 4]);
  assert.deepEqual(await mapWithConcurrency([], 4, async (x) => x), []);
});

// ─── 8. CLI wiring ──────────────────────────────────────────────────────────

test("deriveCliConfig reads --research-concurrency and defaults to 6", () => {
  assert.equal(deriveCliConfig({}).researchConcurrency, DEFAULT_RESEARCH_CONCURRENCY);
  assert.equal(deriveCliConfig({ "research-concurrency": "4" }).researchConcurrency, 4);
  assert.equal(deriveCliConfig({ auto: true, "research-concurrency": "8" }).researchConcurrency, 8);
  assert.equal(
    deriveCliConfig({ "research-concurrency": "0" }).researchConcurrency,
    1,
    "0 would deadlock a pool — clamp to 1",
  );
  assert.equal(
    deriveCliConfig({ "research-concurrency": "not-a-number" }).researchConcurrency,
    DEFAULT_RESEARCH_CONCURRENCY,
  );
});
