/**
 * The monthly gap scan must never move a branch a human left checked out.
 *
 * Until 2026-08-27 `monthly-gap-report.sh` ran `git pull --quiet origin main 2>/dev/null || true`
 * inside `~/shared-data`, and what that did depended on which branch someone happened to leave
 * checked out. Measured on git 2.50.1 with `pull.rebase` unset:
 *
 *   parked branch strictly BEHIND main  ->  FAST-FORWARDED to main's tip, exit 0, silently.
 *                                           A human's branch is rewritten and nothing says so.
 *   parked branch with ANY local commit ->  "fatal: Need to specify how to reconcile divergent
 *                                           branches", exit 128 — swallowed by `|| true`, and
 *                                           the scan then runs on the STALE parked tree and
 *                                           produces a monthly report that looks exactly like
 *                                           a good one.
 *
 * Both states are covered below, because the first is the one that writes and the second is the
 * one that lies, and which you get depends only on whether you had committed anything yet.
 *
 * These tests run the REAL script against a fixture $HOME, so what they exercise is the file
 * launchd executes — not a re-implementation of it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO_ROOT, "scripts", "monthly-gap-report.sh");

const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** A fixture $HOME holding an `origin` and a `shared-data` clone parked on a branch. */
function fixtureHome(parked: "divergent" | "behind" = "divergent") {
  const home = mkdtempSync(join(tmpdir(), "gap-scan-home-"));
  const origin = join(home, "origin.git");
  const repo = join(home, "shared-data");
  const seed = join(home, "seed");

  execFileSync("git", ["init", "--bare", "-b", "main", origin]);
  execFileSync("git", ["init", "-b", "main", seed]);
  mkdirSync(join(seed, "scripts"), { recursive: true });
  writeFileSync(join(seed, "scripts", "scan-gaps.ts"),
    'process.stdout.write("FIXTURE-SCAN-OUTPUT\\n");\n');
  // Ignored in the fixture exactly as it is in the real repo, so the symlink the script needs
  // never shows up as a dirty file — and never gets swept into the parked branch's commit,
  // which is what made the divergent case pass for the wrong reason.
  writeFileSync(join(seed, ".gitignore"), "node_modules\n");
  for (const [k, v] of [["user.email", "t@t"], ["user.name", "t"]]) git(seed, "config", k, v);
  git(seed, "add", "-A");
  git(seed, "commit", "-qm", "seed");
  git(seed, "remote", "add", "origin", origin);
  git(seed, "push", "-q", "origin", "main");

  execFileSync("git", ["clone", "-q", origin, repo]);
  for (const [k, v] of [["user.email", "t@t"], ["user.name", "t"]]) git(repo, "config", k, v);
  // tsx resolves from the checkout's node_modules — the script symlinks it into its worktree.
  symlinkSync(join(REPO_ROOT, "node_modules"), join(repo, "node_modules"));

  // A human's work, parked. "divergent" carries a local commit; "behind" is a branch someone
  // checked out and has not committed to yet — the state git will silently fast-forward.
  git(repo, "checkout", "-qb", "chore/somebody-elses-work");
  if (parked === "divergent") {
    writeFileSync(join(repo, "NOTES.md"), "in flight\n");
    git(repo, "add", "-A");
    git(repo, "commit", "-qm", "a human's uncommitted-to-main work");
  }

  // main moves on, so a `pull` would have something to merge.
  writeFileSync(join(seed, "NEW.md"), "landed on main\n");
  git(seed, "add", "-A");
  git(seed, "commit", "-qm", "moved main");
  git(seed, "push", "-q", "origin", "main");

  return { home, repo, cleanup: () => rmSync(home, { recursive: true, force: true }) };
}

// TZ IS PINNED, and both sides of the comparison are pinned to the SAME clock. The script
// names its report with LOCAL `date +%F`; the assertions below derive the name from
// `toISOString()`, which is always UTC. Those two strings agree until 20:00 EDT and disagree
// after it, so without this the suite would go red every evening and read as a flake (rule 7:
// the second instrument must not quietly share — or quietly differ from — the first's clock).
const run = (home: string) =>
  spawnSync("bash", [SCRIPT], { env: { ...process.env, HOME: home, TZ: "UTC" }, encoding: "utf8" });

/** The report name the script will produce, on the same UTC clock `run()` pins it to. */
const reportPath = (home: string) =>
  join(home, "work", "notes", `${new Date().toISOString().slice(0, 10)}-universe-gap-scan.md`);

for (const parked of ["behind", "divergent"] as const) {
test(`the scan leaves a parked branch's HEAD exactly where it found it (${parked})`, () => {
  const { home, repo, cleanup } = fixtureHome(parked);
  try {
    const before = git(repo, "rev-parse", "HEAD");
    const branchBefore = git(repo, "rev-parse", "--abbrev-ref", "HEAD");
    const r = run(home);
    assert.equal(r.status, 0, `script failed: ${r.stderr}`);
    assert.equal(git(repo, "rev-parse", "HEAD"), before, "the scan moved the parked branch");
    assert.equal(git(repo, "rev-parse", "--abbrev-ref", "HEAD"), branchBefore,
      "the scan switched branches under a human");
    assert.equal(git(repo, "status", "--porcelain"), "", "the scan dirtied the checkout");
  } finally { cleanup(); }
});
}

test("it scans origin/main, not the parked branch, and says which ref it read", () => {
  const { home, repo, cleanup } = fixtureHome();
  try {
    const r = run(home);
    assert.equal(r.status, 0, `script failed: ${r.stderr}`);
    const out = reportPath(home);
    assert.ok(existsSync(out), "no report was written");
    const body = readFileSync(out, "utf8");
    assert.match(body, /FIXTURE-SCAN-OUTPUT/, "the scan did not run");
    const mainSha = git(repo, "rev-parse", "--short", "origin/main");
    assert.match(body, new RegExp(`source=origin/main@${mainSha}`),
      "the report does not name the ref it was produced from");
  } finally { cleanup(); }
});

test("it leaves no worktree behind", () => {
  const { home, repo, cleanup } = fixtureHome();
  try {
    assert.equal(run(home).status, 0);
    const list = git(repo, "worktree", "list");
    assert.equal(list.split("\n").length, 1, `a worktree was left registered:\n${list}`);
  } finally { cleanup(); }
});

test("a fetch that cannot reach its remote fails loudly and writes NO report", () => {
  // The old script's `|| true` made an unreachable remote indistinguishable from a clean pull,
  // and `> "$OUT"` then truncated the report to zero bytes — which reads as "no gaps found".
  //
  // AN ABSENCE ASSERTION IS SATISFIED BY EVERY WAY OF NEVER GETTING THERE. This test passed
  // twice today against a broken script: once on Linux CI, where the run died four lines later
  // at a BSD-only `mktemp -t` and therefore also wrote no report; and once under a skewed TZ,
  // where the report existed under a name this test was not looking at. Both times "no report"
  // was true and meant nothing. Its companion below asserts the healthy path REACHES the same
  // point — same fixture, same script, working remote, and a report that is really there.
  const { home, repo, cleanup } = fixtureHome();
  try {
    git(repo, "remote", "set-url", "origin", join(home, "does-not-exist.git"));
    const r = run(home);
    assert.notEqual(r.status, 0, "an unreachable remote must not exit 0");
    assert.match(r.stderr, /could not fetch origin\/main/);
    const out = reportPath(home);
    assert.equal(existsSync(out), false, "a failed run must not leave a report file at all");
  } finally { cleanup(); }
});


test("...and the same script on a REACHABLE remote gets all the way to a written report", () => {
  // The companion. Without it, every assertion in the test above is also satisfied by a script
  // that cannot start at all — which is exactly the state CI caught and this suite did not.
  const { home, cleanup } = fixtureHome();
  try {
    const r = run(home);
    assert.equal(r.status, 0, `the healthy path must reach the end: ${r.stderr}`);
    const out = reportPath(home);
    assert.ok(existsSync(out), "the healthy path wrote no report — the absence test above is vacuous");
    assert.ok(readFileSync(out, "utf8").length > 0, "the report is empty; a zero-byte scan reads as 'no gaps'");
    const log = join(home, "work", "logs", "universe-gap-scan.log");
    assert.ok(existsSync(log) && /source=origin\/main@/.test(readFileSync(log, "utf8")),
      "the run logged no completion line, so it did not reach the end of the script");
  } finally { cleanup(); }
});


test("a divergent parked branch does not turn into a stale report that reads as a good one", () => {
  // The old script's `|| true` turned git's exit-128 refusal into silence, and the scan then
  // measured the parked tree. The report was a month old in content and current in filename.
  const { home, repo, cleanup } = fixtureHome("divergent");
  try {
    const r = run(home);
    assert.equal(r.status, 0, `script failed: ${r.stderr}`);
    const out = reportPath(home);
    const mainSha = git(repo, "rev-parse", "--short", "origin/main");
    assert.match(readFileSync(out, "utf8"), new RegExp(`source=origin/main@${mainSha}`),
      "the report was not produced from origin/main");
  } finally { cleanup(); }
});
