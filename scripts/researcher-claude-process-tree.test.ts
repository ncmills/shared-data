// researcher-claude-process-tree.test.ts — the ONE test that spawns real
// processes, kept out of researcher-claude.test.ts so that file's "no process
// is ever spawned" invariant stays true.
//
// WHAT IT PINS. `defaultClaudeRunner` is about to run unattended on a schedule.
// The failure mode it must not have: `claude` forks helpers that inherit its
// stdout pipe, so SIGKILLing only the direct child leaves the pipe open,
// `'close'` never fires, and the promise hangs forever. That exact bug parked a
// second-nick daemon for ~2h45m (fixed there 2026-07-28, a710ba6). A stand-in
// "claude" here forks precisely such a helper.
//
// Guard against a VACUOUS pass: the stand-in is asserted to actually leak a
// helper, so this test cannot quietly stop exercising the thing it pins.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { defaultClaudeRunner } from "./researcher-claude";

/** Unique-enough sleep duration so pgrep matches ONLY this test's processes. */
const MARKER = "913.517";

/** PIDs of any surviving stand-in processes, via their marker sleep duration. */
function survivors(): string[] {
  try {
    return execFileSync("pgrep", ["-f", MARKER], { encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return []; // pgrep exits 1 when nothing matches
  }
}

test("defaultClaudeRunner: a timeout kills the whole process GROUP and settles promptly", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "claude-tree-"));
  const bin = path.join(dir, "fake-claude.sh");

  // A parent that forks a helper INHERITING stdout, then blocks. Killing the
  // parent alone leaves the helper holding the pipe — the hang this fix targets.
  writeFileSync(bin, `#!/bin/sh\nsleep ${MARKER} &\nsleep ${MARKER}\n`);
  chmodSync(bin, 0o755);

  try {
    assert.equal(survivors().length, 0, "stale marker processes before the test");

    const started = Date.now();
    const res = await defaultClaudeRunner({ claudeBin: bin, timeoutMs: 700 })("prompt");
    const elapsed = Date.now() - started;

    assert.equal(res.timedOut, true, "should report a timeout");
    // Generous ceiling: the real bug hangs for HOURS, so anything bounded proves
    // the group kill landed. Well under the 2s stdio-flush grace + slack.
    assert.ok(elapsed < 6_000, `should settle promptly, took ${elapsed}ms`);

    // The helper must be dead too — the whole point of the process group.
    // Give the kernel a beat to reap.
    await new Promise((r) => setTimeout(r, 300));
    assert.deepEqual(survivors(), [], "a helper process outlived the group kill");
  } finally {
    for (const pid of survivors()) {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
        /* already gone */
      }
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the stand-in genuinely leaks a helper when only the direct child is killed", async () => {
  // Proves the test above is not vacuous: with the OLD behaviour (kill just the
  // child, no process group) the helper survives. If this ever stops holding,
  // the test above would pass for the wrong reason.
  const { spawn } = await import("node:child_process");
  const dir = mkdtempSync(path.join(tmpdir(), "claude-tree-ctl-"));
  const bin = path.join(dir, "fake-claude.sh");
  writeFileSync(bin, `#!/bin/sh\nsleep ${MARKER} &\nsleep ${MARKER}\n`);
  chmodSync(bin, 0o755);

  try {
    const child = spawn(bin, [], { stdio: ["pipe", "pipe", "pipe"] }); // NOT detached
    await new Promise((r) => setTimeout(r, 600)); // let the helper start
    child.kill("SIGKILL"); // old behaviour: direct child only
    await new Promise((r) => setTimeout(r, 600));

    assert.ok(survivors().length > 0, "stand-in should leak a helper without a group kill");
  } finally {
    for (const pid of survivors()) {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
        /* already gone */
      }
    }
    rmSync(dir, { recursive: true, force: true });
  }
});
