// propose-pr.test.ts — Task 16: Propose-PR + coverage-matrix diff.
//
// Two things this suite proves:
//   1. `buildPrBody` (pure) renders the GapTasks addressed, the row count
//      added per dataset, a coverage-matrix before/after diff section, and
//      the citation URLs — via substring assertions on real edge-case data.
//   2. `proposePr`'s go-live constraint holds: with `push` false/omitted (the
//      default), it NEVER calls the command runner with `git push` or `gh` —
//      the CRITICAL SAFETY TEST for this task. A companion test proves the
//      `push:true` gate is a real branch (not dead code) by also asserting it
//      DOES call push/gh — always against an injected spy, never a real
//      shell-out, never a real branch/commit.
//
// All git/gh calls go through an injected `CommandRunner` spy — nothing in
// this file ever shells out, creates a real branch, or touches the real
// `spec/planner-cite-cache-expansion` working tree. File-artifact writes
// (the PR body markdown) point at a scratch temp directory via `docsDir`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildPrBody,
  parseCoverageMatrixMd,
  diffCoverageMatrix,
  deriveBranchName,
  proposePr,
  type CommandRunner,
  type CommandResult,
} from "./propose-pr";
import type { GapTask } from "./gap-queue";

const SAMPLE_GAP_TASK: GapTask = {
  id: "golf:golfRegion=International;tier=budget",
  dataset: "golf",
  cell: { golfRegion: "International", tier: "budget" },
  deficit: 3,
  wizardsServed: ["handicap", "tdf"],
  starvedForWizards: ["handicap"],
  leverageScore: 6,
};

const BEFORE_MATRIX_MD = [
  "# Coverage matrix",
  "",
  "| wizard | party | golf | residence |",
  "| --- | --- | --- | --- |",
  "| bestman | 5128 | 994 | 0 |",
  "| handicap | 0 | 994 | 0 |",
  "",
].join("\n");

const AFTER_MATRIX_MD = [
  "# Coverage matrix",
  "",
  "| wizard | party | golf | residence |",
  "| --- | --- | --- | --- |",
  "| bestman | 5128 | 997 | 0 |",
  "| handicap | 0 | 997 | 0 |",
  "",
].join("\n");

// ─── buildPrBody (pure) ─────────────────────────────────────────────────────

test("buildPrBody embeds dataset, row counts, GapTasks, coverage diff, and citations", () => {
  const body = buildPrBody({
    gapTasks: [SAMPLE_GAP_TASK],
    rowCountsByDataset: { golf: 3 },
    citations: ["https://www.realcourse.example/about", "https://www.realcourse.example/about"],
    beforeMatrixMd: BEFORE_MATRIX_MD,
    afterMatrixMd: AFTER_MATRIX_MD,
  });

  // dataset + row count
  assert.match(body, /\*\*golf\*\*: \+3 row\(s\)/);
  // GapTask addressed
  assert.ok(body.includes(SAMPLE_GAP_TASK.id));
  assert.ok(body.includes("International"));
  // coverage-matrix before/after diff
  assert.ok(body.includes("Coverage matrix diff"));
  assert.match(body, /\| handicap \| golf \| 994 \| 997 \| \+3 \|/);
  // citations (deduped)
  assert.ok(body.includes("https://www.realcourse.example/about"));
  const occurrences = body.split("https://www.realcourse.example/about").length - 1;
  assert.equal(occurrences, 1, "duplicate citation URLs should be deduped");
});

test("buildPrBody handles the empty-batch edge case without throwing", () => {
  const body = buildPrBody({
    gapTasks: [],
    rowCountsByDataset: {},
    citations: [],
    beforeMatrixMd: "",
    afterMatrixMd: "",
  });
  assert.ok(body.includes("No rows added"));
  assert.ok(body.includes("No GapTasks recorded"));
  assert.ok(body.includes("No coverage-matrix cells changed"));
  assert.ok(body.includes("No citations recorded"));
});

// ─── coverage-matrix parse/diff (pure) ─────────────────────────────────────

test("parseCoverageMatrixMd extracts wizard x dataset cells from the real table shape", () => {
  const parsed = parseCoverageMatrixMd(AFTER_MATRIX_MD);
  assert.deepEqual(parsed.datasets, ["party", "golf", "residence"]);
  assert.deepEqual(parsed.wizards, ["bestman", "handicap"]);
  assert.equal(parsed.cells.handicap.golf, 997);
  assert.equal(parsed.cells.bestman.party, 5128);
});

test("parseCoverageMatrixMd returns empty structures for a missing table (first-ever run)", () => {
  const parsed = parseCoverageMatrixMd("");
  assert.deepEqual(parsed.wizards, []);
  assert.deepEqual(parsed.datasets, []);
});

test("diffCoverageMatrix only reports cells whose count actually changed", () => {
  const diffs = diffCoverageMatrix(BEFORE_MATRIX_MD, AFTER_MATRIX_MD);
  assert.equal(diffs.length, 2); // bestman/golf and handicap/golf changed; party/residence did not
  const golfDiffs = diffs.filter((d) => d.dataset === "golf");
  assert.equal(golfDiffs.length, 2);
  assert.ok(diffs.every((d) => d.dataset === "golf"));
});

// ─── deriveBranchName (pure, deterministic — no Date.now()) ────────────────

test("deriveBranchName is deterministic and slugifies dataset + label", () => {
  const a = deriveBranchName("golf", "International Budget Batch");
  const b = deriveBranchName("golf", "International Budget Batch");
  assert.equal(a, b);
  assert.equal(a, "expand/golf-international-budget-batch");
});

// ─── proposePr: the go-live safety gate ────────────────────────────────────

function makeSpyRunner(): { run: CommandRunner; calls: { cmd: string; args: string[] }[] } {
  const calls: { cmd: string; args: string[] }[] = [];
  const run: CommandRunner = (cmd, args): CommandResult => {
    calls.push({ cmd, args });
    return { status: 0, stdout: "", stderr: "" };
  };
  return { run, calls };
}

function withTempDocsDir<T>(fn: (docsDir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "propose-pr-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("proposePr with push omitted (default) NEVER invokes git push or gh — critical safety test", () => {
  withTempDocsDir((docsDir) => {
    const { run, calls } = makeSpyRunner();

    const result = proposePr({
      label: "safety-test-default",
      dataset: "golf",
      gapTasks: [SAMPLE_GAP_TASK],
      rowCountsByDataset: { golf: 3 },
      citations: ["https://www.realcourse.example/about"],
      beforeMatrixMd: BEFORE_MATRIX_MD,
      afterMatrixMd: AFTER_MATRIX_MD,
      docsDir,
      repoRoot: docsDir,
      run,
    });

    assert.equal(result.branch, "expand/golf-safety-test-default");
    const pushOrGhCalls = calls.filter((c) => c.cmd === "gh" || c.args.includes("push"));
    assert.equal(pushOrGhCalls.length, 0, `expected no push/gh calls, got: ${JSON.stringify(pushOrGhCalls)}`);

    // sanity: local git ops (branch + add + commit) DID happen via the spy
    assert.ok(calls.some((c) => c.cmd === "git" && c.args[0] === "checkout"));
    assert.ok(calls.some((c) => c.cmd === "git" && c.args[0] === "commit"));
  });
});

test("proposePr with push:false explicitly ALSO never invokes git push or gh", () => {
  withTempDocsDir((docsDir) => {
    const { run, calls } = makeSpyRunner();
    proposePr({
      label: "safety-test-explicit-false",
      dataset: "golf",
      rowCountsByDataset: { golf: 1 },
      beforeMatrixMd: BEFORE_MATRIX_MD,
      afterMatrixMd: AFTER_MATRIX_MD,
      docsDir,
      repoRoot: docsDir,
      run,
      push: false,
    });
    const pushOrGhCalls = calls.filter((c) => c.cmd === "gh" || c.args.includes("push"));
    assert.equal(pushOrGhCalls.length, 0);
  });
});

test("proposePr with push:true DOES invoke git push and gh (proves the gate is a real branch, still fully injected)", () => {
  withTempDocsDir((docsDir) => {
    const { run, calls } = makeSpyRunner();
    proposePr({
      label: "push-gate-test",
      dataset: "golf",
      rowCountsByDataset: { golf: 1 },
      beforeMatrixMd: BEFORE_MATRIX_MD,
      afterMatrixMd: AFTER_MATRIX_MD,
      docsDir,
      repoRoot: docsDir,
      run,
      push: true,
    });
    assert.ok(calls.some((c) => c.cmd === "git" && c.args[0] === "push"));
    assert.ok(calls.some((c) => c.cmd === "gh"));
  });
});

test("proposePr writes the PR body artifact to docs/pending-prs/<branch>.md", () => {
  withTempDocsDir((docsDir) => {
    const { run } = makeSpyRunner();
    const result = proposePr({
      branch: "expand/golf-artifact-path-test",
      rowCountsByDataset: { golf: 2 },
      gapTasks: [SAMPLE_GAP_TASK],
      citations: ["https://www.realcourse.example/about"],
      beforeMatrixMd: BEFORE_MATRIX_MD,
      afterMatrixMd: AFTER_MATRIX_MD,
      docsDir,
      repoRoot: docsDir,
      run,
    });

    const expectedPath = join(docsDir, "pending-prs", "expand", "golf-artifact-path-test.md");
    assert.equal(result.bodyPath, expectedPath);
    const onDisk = readFileSync(expectedPath, "utf-8");
    assert.equal(onDisk, result.body);
    assert.ok(onDisk.includes("golf"));
  });
});

test("proposePr stages the PR-body artifact itself so it persists ON the branch, not as a loose untracked file", () => {
  withTempDocsDir((docsDir) => {
    const { run, calls } = makeSpyRunner();
    const result = proposePr({
      branch: "expand/golf-artifact-commit-test",
      rowCountsByDataset: { golf: 1 },
      gapTasks: [SAMPLE_GAP_TASK],
      citations: ["https://www.realcourse.example/about"],
      beforeMatrixMd: BEFORE_MATRIX_MD,
      afterMatrixMd: AFTER_MATRIX_MD,
      docsDir,
      repoRoot: docsDir,
      run,
    });

    const expectedRelativeBodyPath = "pending-prs/expand/golf-artifact-commit-test.md";
    assert.ok(
      calls.some((c) => c.cmd === "git" && c.args[0] === "add" && c.args.includes(expectedRelativeBodyPath)),
      `expected a "git add -- ${expectedRelativeBodyPath}" call, got: ${JSON.stringify(calls)}`,
    );
    // the add for the PR-body artifact must happen before the commit, and
    // after the branch checkout (so it lands ON the new branch's commit).
    const checkoutIdx = calls.findIndex((c) => c.cmd === "git" && c.args[0] === "checkout");
    const addBodyIdx = calls.findIndex(
      (c) => c.cmd === "git" && c.args[0] === "add" && c.args.includes(expectedRelativeBodyPath),
    );
    const commitIdx = calls.findIndex((c) => c.cmd === "git" && c.args[0] === "commit");
    assert.ok(checkoutIdx < addBodyIdx, "checkout must happen before staging the PR-body artifact");
    assert.ok(addBodyIdx < commitIdx, "the PR-body artifact must be staged before the commit");
    assert.ok(result.bodyPath.endsWith(expectedRelativeBodyPath));
  });
});

test("proposePr uses an explicit branch name verbatim when provided (does not re-derive)", () => {
  withTempDocsDir((docsDir) => {
    const { run } = makeSpyRunner();
    const result = proposePr({
      branch: "expand/my-explicit-branch",
      rowCountsByDataset: { residence: 1 },
      beforeMatrixMd: "",
      afterMatrixMd: "",
      docsDir,
      repoRoot: docsDir,
      run,
    });
    assert.equal(result.branch, "expand/my-explicit-branch");
  });
});
