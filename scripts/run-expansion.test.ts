// run-expansion.test.ts — Task 17: the recurring expansion ORCHESTRATOR.
//
// Proves, with a MOCK researcher + a top-K GapTask fixture and INJECTED
// ingest/propose spies (no network, no git, no filesystem writes to real
// files):
//   1. runExpansion produces the correct PER-DATASET breakdown (rows added +
//      citations) — the seam Task 16 flagged (IngestResult's opaque combined
//      `accepted` can't tell golf from residence; the breakdown is derived
//      from the threaded ResearchedRow[]).
//   2. rowCap enforcement REPORTS every dropped GapTask when cap < available
//      (NO silent truncation).
//   3. dryRun:true does NOT ingest and does NOT propose a branch (spies prove
//      zero side effects).
//   4. a non-dry run calls propose with push:false (LOCAL-only go-live gate).
import { test } from "node:test";
import assert from "node:assert/strict";

import { runExpansion, deriveCliConfig } from "./run-expansion";
import type { RunExpansionOptions } from "./run-expansion";
import type { UrlLiveResult } from "../src/verify-url";
import type { GapTask } from "./gap-queue";
import type { ResearchedRow } from "../src/research-schema";
import type { IngestResult } from "./ingest-researched";
import type { ProposePrOptions, ProposePrResult } from "./propose-pr";

// ─── fixtures ───────────────────────────────────────────────────────────────

const GOLF_TASK: GapTask = {
  id: "golf:golfRegion=International;tier=budget",
  dataset: "golf",
  cell: { golfRegion: "International", tier: "budget" },
  deficit: 3,
  wizardsServed: ["bestman", "offsite-retreat", "offsite-outing", "handicap", "tdf"],
  starvedForWizards: ["handicap", "tdf"],
  leverageScore: 15,
};

const RESIDENCE_TASK: GapTask = {
  id: "residence:setting=alpine;worldRegion=Middle East",
  dataset: "residence",
  cell: { setting: "alpine", worldRegion: "Middle East" },
  deficit: 3,
  wizardsServed: ["offsite-retreat", "offsite-outing"],
  starvedForWizards: ["offsite-retreat"],
  leverageScore: 6,
};

function golfRow(name: string, url: string): ResearchedRow {
  return {
    dataset: "golf",
    name,
    city: "Testville",
    state: "Scotland",
    region: "International",
    tier: "budget",
    greenFeeRange: [50, 120],
    style: "links",
    walkable: true,
    driveMinutes: 40,
    highlight: `Real links course fixture: ${name}.`,
    sourceUrl: url,
    citations: [`${url}about`],
  } as ResearchedRow;
}

function residenceRow(id: string, url: string): ResearchedRow {
  return {
    dataset: "residence",
    id,
    name: `Fixture ${id}`,
    setting: "alpine",
    region: "Middle East",
    country: "Lebanon",
    sourceUrl: url,
    citations: [`${url}about`],
  } as ResearchedRow;
}

/** A researcher that returns a canned candidate list per GapTask id. */
function mockResearcher(byTaskId: Record<string, ResearchedRow[]>) {
  return async (prompt: string) => {
    for (const [id, rows] of Object.entries(byTaskId)) {
      if (prompt.includes(id.split(":")[1] ?? id)) return rows;
    }
    // fall back on matching the cell values present in the prompt
    if (prompt.includes("International")) return byTaskId[GOLF_TASK.id] ?? [];
    if (prompt.includes("alpine")) return byTaskId[RESIDENCE_TASK.id] ?? [];
    return [];
  };
}

function spyIngest(): { fn: (rows: ResearchedRow[]) => IngestResult; calls: ResearchedRow[][] } {
  const calls: ResearchedRow[][] = [];
  const fn = (rows: ResearchedRow[]): IngestResult => {
    calls.push(rows);
    return { accepted: rows.length, rejected: 0, reasons: [], acceptedRows: rows };
  };
  return { fn, calls };
}

function spyPropose(): { fn: (o: ProposePrOptions) => ProposePrResult; calls: ProposePrOptions[] } {
  const calls: ProposePrOptions[] = [];
  const fn = (o: ProposePrOptions): ProposePrResult => {
    calls.push(o);
    return { branch: o.branch ?? "expand/mock", body: "MOCK BODY", bodyPath: "/tmp/mock-pr.md" };
  };
  return { fn, calls };
}

function baseOpts(over: Partial<RunExpansionOptions>): RunExpansionOptions {
  return {
    topK: 1,
    rowCap: 10,
    label: "test-run",
    researcher: mockResearcher({}),
    log: () => {},
    ...over,
  } as RunExpansionOptions;
}

// ─── 1. per-dataset breakdown (the seam Task 16 flagged) ────────────────────

test("runExpansion produces a correct per-dataset breakdown across golf + residence tasks", async () => {
  const ingest = spyIngest();
  const propose = spyPropose();
  const researcher = mockResearcher({
    [GOLF_TASK.id]: [golfRow("Leven", "https://leven.example/"), golfRow("Crail", "https://crail.example/")],
    [RESIDENCE_TASK.id]: [residenceRow("cedar-lodge", "https://cedar.example/")],
  });

  const res = await runExpansion(
    baseOpts({
      topK: 2,
      rowCap: 10,
      gapQueue: [GOLF_TASK, RESIDENCE_TASK],
      researcher,
      ingest: ingest.fn,
      propose: propose.fn,
    }),
  );

  const golf = res.breakdown.find((b) => b.dataset === "golf");
  const residence = res.breakdown.find((b) => b.dataset === "residence");
  assert.ok(golf, "golf breakdown present");
  assert.ok(residence, "residence breakdown present");
  assert.equal(golf!.rowsAdded, 2);
  assert.equal(residence!.rowsAdded, 1);
  // citations threaded through from the rows themselves, not from IngestResult
  assert.ok(golf!.citations.includes("https://leven.example/about"));
  assert.ok(golf!.citations.includes("https://crail.example/about"));
  assert.ok(residence!.citations.includes("https://cedar.example/about"));
  // ingest + propose both actually ran on a non-dry run
  assert.equal(ingest.calls.length, 1);
  assert.equal(ingest.calls[0].length, 3);
});

// ─── 2. rowCap enforcement REPORTS dropped tasks (no silent truncation) ─────

test("rowCap < available REPORTS the dropped GapTasks with reasons and never over-ingests", async () => {
  const ingest = spyIngest();
  const propose = spyPropose();
  const researcher = mockResearcher({
    [GOLF_TASK.id]: [
      golfRow("A", "https://a.example/"),
      golfRow("B", "https://b.example/"),
      golfRow("C", "https://c.example/"),
    ],
    [RESIDENCE_TASK.id]: [residenceRow("r1", "https://r1.example/"), residenceRow("r2", "https://r2.example/")],
  });

  const res = await runExpansion(
    baseOpts({
      topK: 2,
      rowCap: 2, // only 2 of the 5 available rows may be ingested
      gapQueue: [GOLF_TASK, RESIDENCE_TASK],
      researcher,
      ingest: ingest.fn,
      propose: propose.fn,
    }),
  );

  // exactly the cap was ingested — never more
  assert.equal(res.ingestedRows.length, 2);
  assert.equal(ingest.calls[0].length, 2);

  // the overflow is REPORTED, not silently dropped
  assert.ok(res.droppedByCap.length >= 1, "at least one dropped/capped task reported");
  // the golf task was capped mid-task (kept 2 of 3), the residence task fully dropped (cap already full)
  const golfDrop = res.droppedByCap.find((d) => d.task.id === GOLF_TASK.id);
  const resDrop = res.droppedByCap.find((d) => d.task.id === RESIDENCE_TASK.id);
  assert.ok(golfDrop, "golf task drop reported");
  assert.match(golfDrop!.reason, /rowCap 2/);
  assert.match(golfDrop!.reason, /dropped 1/);
  assert.ok(resDrop, "residence task drop reported");
  assert.match(resDrop!.reason, /already reached/);
});

test("rowCap >= available drops nothing", async () => {
  const researcher = mockResearcher({
    [GOLF_TASK.id]: [golfRow("A", "https://a.example/"), golfRow("B", "https://b.example/")],
  });
  const res = await runExpansion(
    baseOpts({
      topK: 1,
      rowCap: 10,
      gapQueue: [GOLF_TASK],
      researcher,
      ingest: spyIngest().fn,
      propose: spyPropose().fn,
    }),
  );
  assert.equal(res.droppedByCap.length, 0);
  assert.equal(res.ingestedRows.length, 2);
});

// ─── 3. dryRun does NOT ingest or branch ────────────────────────────────────

test("dryRun:true never calls ingest and never calls propose (zero side effects)", async () => {
  const ingest = spyIngest();
  const propose = spyPropose();
  const researcher = mockResearcher({
    [GOLF_TASK.id]: [golfRow("Leven", "https://leven.example/"), golfRow("Crail", "https://crail.example/")],
  });

  const res = await runExpansion(
    baseOpts({
      topK: 1,
      rowCap: 10,
      dryRun: true,
      gapQueue: [GOLF_TASK],
      researcher,
      ingest: ingest.fn,
      propose: propose.fn,
    }),
  );

  assert.equal(res.dryRun, true);
  assert.equal(ingest.calls.length, 0, "ingest MUST NOT be called on a dry run");
  assert.equal(propose.calls.length, 0, "propose MUST NOT be called on a dry run");
  assert.equal(res.ingestResult, undefined);
  assert.equal(res.pr, undefined);
  // but it still researched + reported the would-be breakdown
  assert.equal(res.researchedRows.length, 2);
  assert.equal(res.breakdown.find((b) => b.dataset === "golf")?.rowsAdded, 2);
});

// ─── 4. non-dry run proposes a LOCAL PR (push:false) ────────────────────────

test("non-dry run proposes a LOCAL PR on expand/<label> with push:false", async () => {
  const propose = spyPropose();
  const researcher = mockResearcher({ [GOLF_TASK.id]: [golfRow("Leven", "https://leven.example/")] });

  const res = await runExpansion(
    baseOpts({
      topK: 1,
      rowCap: 10,
      label: "golf-intl-budget-test",
      gapQueue: [GOLF_TASK],
      researcher,
      ingest: spyIngest().fn,
      propose: propose.fn,
    }),
  );

  assert.equal(propose.calls.length, 1);
  const call = propose.calls[0];
  assert.equal(call.branch, "expand/golf-intl-budget-test");
  assert.equal(call.push, false, "push MUST be false (LOCAL-only go-live constraint)");
  assert.deepEqual(call.rowCountsByDataset, { golf: 1 });
  assert.ok(call.citations?.includes("https://leven.example/about"));
  assert.equal(res.pr?.branch, "expand/golf-intl-budget-test");
});

// ─── 5. ingest rejecting the whole batch → no PR ────────────────────────────

test("when the ingest gate accepts 0 rows, no PR is proposed", async () => {
  const propose = spyPropose();
  const researcher = mockResearcher({ [GOLF_TASK.id]: [golfRow("Leven", "https://leven.example/")] });

  const res = await runExpansion(
    baseOpts({
      topK: 1,
      gapQueue: [GOLF_TASK],
      researcher,
      ingest: () => ({
        accepted: 0,
        rejected: 1,
        reasons: ["batch rejected + rolled back: gate failed"],
        acceptedRows: [],
      }),
      propose: propose.fn,
    }),
  );

  assert.equal(propose.calls.length, 0, "no PR when nothing landed");
  assert.equal(res.pr, undefined);
  assert.equal(res.ingestResult?.accepted, 0);
});

// ─── 6. PR-body fidelity: a row shape-rejected INSIDE ingest (a normal ─────
// partial-reject, distinct from the whole-batch gate rollback above) must
// never inflate the PR body / commit message — see DroppedIngestRow.

test("PR body reflects only rows that ACTUALLY landed at ingest, not the pre-ingest submitted batch", async () => {
  const propose = spyPropose();
  const goodRow = golfRow("Leven", "https://leven.example/");
  // Passes validateResearchedRow (has every REQUIRED_FIELDS.golf field —
  // name/city/state/region/tier/highlight — plus sourceUrl/citations) but is
  // missing `style`, which `toGolfCourse()` requires and
  // `validateResearchedRow` does NOT. This is the exact seam the fix closes:
  // research-schema validation is intentionally looser than ingest's
  // per-row shape-conversion, so a row can be counted as "valid" upstream and
  // still be shape-rejected at ingest.
  const shapeRejectedRow: ResearchedRow = (() => {
    const { style: _drop, ...rest } = golfRow("Crail", "https://crail.example/") as unknown as Record<
      string,
      unknown
    >;
    return rest as unknown as ResearchedRow;
  })();

  const researcher = mockResearcher({ [GOLF_TASK.id]: [goodRow, shapeRejectedRow] });

  // A fake ingest that mimics ingestResearched's REAL partial-reject
  // behavior: rows missing `style` are shape-rejected and excluded from
  // `acceptedRows`, exactly like the real toGolfCourse()/ingestResearched
  // would do (see scripts/ingest-researched.ts's toGolfCourse + Step 1/2).
  const fakeIngest = (rows: ResearchedRow[]): IngestResult => {
    const accepted = rows.filter((r) => (r as { style?: string }).style !== undefined);
    const droppedRows = rows.filter((r) => (r as { style?: string }).style === undefined);
    const reasons = droppedRows.map(
      (r) =>
        `rejected (shape): golf row "${(r as { name: string }).name}" is missing required shape field(s) ` +
        `for SharedGolfCourse: style`,
    );
    return { accepted: accepted.length, rejected: droppedRows.length, reasons, acceptedRows: accepted };
  };

  const res = await runExpansion(
    baseOpts({
      topK: 1,
      gapQueue: [GOLF_TASK],
      researcher,
      ingest: fakeIngest,
      propose: propose.fn,
    }),
  );

  // both rows were submitted to ingest (passed research validation + the row cap) ...
  assert.equal(res.ingestedRows.length, 2);
  // ... but only 1 actually landed.
  assert.equal(res.ingestResult?.accepted, 1);

  // the dropped row is REPORTED on RunResult — no silent truncation
  assert.equal(res.droppedAtIngest.length, 1);
  assert.equal(res.droppedAtIngest[0].row.name, "Crail");
  assert.match(res.droppedAtIngest[0].reason, /Crail/);

  // the PR body / breakdown reflects ONLY the row that landed
  assert.equal(propose.calls.length, 1);
  const call = propose.calls[0];
  assert.deepEqual(call.rowCountsByDataset, { golf: 1 }, "PR row count must reflect only the row that landed");
  assert.ok(call.citations?.includes("https://leven.example/about"), "accepted row's citation must be present");
  assert.ok(
    !call.citations?.includes("https://crail.example/about"),
    "dropped row's citation must NOT appear in the PR body",
  );
});

// ─── 7. --auto mode wiring (ARM-B): real researcher + live-URL ON + push ON ──

test("deriveCliConfig(--auto) implies real researcher + live-URL gate + push ON", () => {
  const cfg = deriveCliConfig({ auto: true, "top-k": "3", "row-cap": "15" });
  assert.equal(cfg.auto, true);
  assert.equal(cfg.useClaudeResearcher, true, "--auto uses the real claude researcher");
  assert.equal(cfg.liveUrlCheck, true, "--auto arms the live-URL gate");
  assert.equal(cfg.pushPr, true, "--auto (non-dry) pushes a real PR");
  assert.equal(cfg.topK, 3);
  assert.equal(cfg.rowCap, 15);
});

test("deriveCliConfig(--auto --dry-run) researches but NEVER pushes", () => {
  const cfg = deriveCliConfig({ auto: true, "dry-run": true });
  assert.equal(cfg.dryRun, true);
  assert.equal(cfg.useClaudeResearcher, true, "still uses the real researcher to smoke it");
  assert.equal(cfg.liveUrlCheck, true);
  assert.equal(cfg.pushPr, false, "a dry run MUST NOT push a PR");
});

test("deriveCliConfig(default, no --auto) is local-only: no researcher, no push, live-URL still armed", () => {
  const cfg = deriveCliConfig({ "top-k": "1" });
  assert.equal(cfg.auto, false);
  assert.equal(cfg.useClaudeResearcher, false, "default mode wires NO live researcher");
  assert.equal(cfg.pushPr, false, "default mode is LOCAL-only (never pushes)");
  assert.equal(cfg.liveUrlCheck, true, "live-URL gate armed by default");
});

test("deriveCliConfig(--skip-live-check) opts out of the live-URL gate (non-auto only)", () => {
  const cfg = deriveCliConfig({ "skip-live-check": true });
  assert.equal(cfg.liveUrlCheck, false);
});

test("runExpansion(pushPr:true) threads push:true into propose (the --auto real-PR path)", async () => {
  const propose = spyPropose();
  const researcher = mockResearcher({ [GOLF_TASK.id]: [golfRow("Leven", "https://leven.example/")] });

  await runExpansion(
    baseOpts({
      topK: 1,
      label: "auto-run",
      gapQueue: [GOLF_TASK],
      researcher,
      pushPr: true,
      ingest: spyIngest().fn,
      propose: propose.fn,
    }),
  );

  assert.equal(propose.calls.length, 1);
  assert.equal(propose.calls[0].push, true, "--auto must push a real PR (push:true)");
});

test("runExpansion(--auto --dry-run equivalent) never ingests/proposes even with pushPr wiring", async () => {
  const ingest = spyIngest();
  const propose = spyPropose();
  const researcher = mockResearcher({ [GOLF_TASK.id]: [golfRow("Leven", "https://leven.example/")] });

  const res = await runExpansion(
    baseOpts({
      topK: 1,
      dryRun: true, // deriveCliConfig sets pushPr:false when dry, but prove the guard regardless
      pushPr: false,
      gapQueue: [GOLF_TASK],
      researcher,
      ingest: ingest.fn,
      propose: propose.fn,
    }),
  );

  assert.equal(ingest.calls.length, 0, "no ingest on --auto --dry-run");
  assert.equal(propose.calls.length, 0, "no branch/PR on --auto --dry-run");
  assert.equal(res.pr, undefined);
  assert.equal(res.researchedRows.length, 1, "but it still researched + reported");
});

test("runExpansion(liveUrlCheck:true) drives the injected live-URL verifier (the --auto gate)", async () => {
  const checked: string[] = [];
  const verifyUrl = async (url: string): Promise<UrlLiveResult> => {
    checked.push(url);
    return { ok: true, status: 200 };
  };
  const researcher = mockResearcher({ [GOLF_TASK.id]: [golfRow("Leven", "https://leven.example/")] });

  const res = await runExpansion(
    baseOpts({
      topK: 1,
      gapQueue: [GOLF_TASK],
      researcher,
      liveUrlCheck: true,
      verifyUrl,
      ingest: spyIngest().fn,
      propose: spyPropose().fn,
    }),
  );

  assert.ok(checked.includes("https://leven.example/"), "the live-URL gate actually fetched the row's sourceUrl");
  assert.equal(res.ingestedRows.length, 1, "a live row survives the gate");
});
