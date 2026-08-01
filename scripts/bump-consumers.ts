/**
 * bump-consumers.ts — pins every consumer's `shared-data` dependency to a
 * given release SHA and refreshes its lockfile.
 *
 * shared-data's npm git dependency (`github:ncmills/shared-data`) is the ONE
 * mechanism every consumer (BM, MOH, OO, HHQ) reads shared-data through. Left
 * unpinned it floats `main`, which means (a) builds aren't reproducible and
 * (b) nothing tells you which shared-data commit a consumer is actually
 * running. `bumpConsumers` is the release-time step that pins all consumers
 * to the SAME commit in one pass.
 *
 * Run: npx tsx scripts/bump-consumers.ts <sha> [repo1 repo2 ...]
 * See docs/propagation.md for the full release runbook.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DEP_NAME = "shared-data";
const REPO_SPEC = "github:ncmills/shared-data";

export const DEFAULT_CONSUMER_REPOS = [
  "/Users/bignick/plan-my-party",
  "/Users/bignick/maid-of-honor-hq",
  "/Users/bignick/offsite-outpost",
  "/Users/bignick/handicap-hq",
];

/**
 * Pure transform: rewrite the `shared-data` dependency in a package.json
 * string to `github:ncmills/shared-data#<sha>`, replacing any existing pin
 * (never appending a second `#`). Throws if the dep isn't present at all —
 * a consumer missing the dep entirely is a setup bug, not something to paper
 * over silently.
 */
export function rewriteDep(pkgJsonString: string, sha: string): string {
  const pkg = JSON.parse(pkgJsonString);
  const sections = ["dependencies", "devDependencies"] as const;

  let found = false;
  for (const section of sections) {
    const deps = pkg[section];
    if (deps && Object.prototype.hasOwnProperty.call(deps, DEP_NAME)) {
      deps[DEP_NAME] = `${REPO_SPEC}#${sha}`;
      found = true;
    }
  }

  if (!found) {
    throw new Error(
      `rewriteDep: no "${DEP_NAME}" dependency found in package.json (checked ${sections.join(", ")})`,
    );
  }

  // Preserve trailing newline convention (JSON.stringify + \n is standard for
  // npm-managed package.json files) without assuming the input had one.
  const hadTrailingNewline = pkgJsonString.endsWith("\n");
  const out = JSON.stringify(pkg, null, 2);
  return hadTrailingNewline ? `${out}\n` : out;
}

/**
 * Reads each repo's package.json, pins its shared-data dep to `sha`, writes
 * it back, and refreshes the lockfile (`npm install --package-lock-only`, so
 * this never touches node_modules — just the reproducibility record).
 */
export function bumpConsumers(sha: string, repos: string[] = DEFAULT_CONSUMER_REPOS): void {
  for (const repo of repos) {
    const pkgPath = path.join(repo, "package.json");
    const before = readFileSync(pkgPath, "utf8");
    const after = rewriteDep(before, sha);
    writeFileSync(pkgPath, after, "utf8");
    console.log(`[bump-consumers] ${repo}: pinned ${DEP_NAME} -> #${sha.slice(0, 7)}`);
    // MUST name the dep AND the exact ref. A bare `npm install
    // --package-lock-only` reports "up to date" and leaves the lockfile
    // resolving the PREVIOUS commit, because the existing lock entry still
    // satisfies the range npm is checking.
    //
    // That is not cosmetic: Vercel installs from the LOCKFILE, so a bump whose
    // package.json says the new SHA while the lock still says the old one
    // deploys the OLD data while every file on disk claims otherwise. Observed
    // 2026-08-01 bumping to 46fe9c7 — all three consumers kept 8a69187 in the
    // lock. `verifyPin` below now fails loudly on exactly that mismatch.
    execSync(`npm install "${DEP_NAME}@${REPO_SPEC}#${sha}" --package-lock-only --no-audit --no-fund`, {
      cwd: repo,
      stdio: "inherit",
    });

    verifyPin(repo, sha);
  }
}

/**
 * Assert the LOCKFILE actually resolves the requested commit.
 *
 * The lockfile is what a deploy installs from. A bump that updates
 * package.json but not the lock is not a partial success — it is a silent
 * downgrade that ships stale data while every file on disk claims the new SHA.
 * Fail the bump rather than let it reach a push.
 */
export function verifyPin(repo: string, sha: string): void {
  const lockPath = path.join(repo, "package-lock.json");
  let lock: { packages?: Record<string, { resolved?: string }> };
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf8"));
  } catch (e) {
    throw new Error(`[bump-consumers] ${repo}: cannot read package-lock.json (${String(e)})`);
  }

  const entry = lock.packages?.[`node_modules/${DEP_NAME}`];
  const resolved = entry?.resolved ?? "";
  const lockedSha = resolved.includes("#") ? resolved.split("#")[1]! : "";

  if (!lockedSha.startsWith(sha) && !sha.startsWith(lockedSha.slice(0, 7))) {
    throw new Error(
      `[bump-consumers] ${repo}: LOCKFILE MISMATCH — package.json pins #${sha.slice(0, 7)} but ` +
        `package-lock.json resolves ${lockedSha.slice(0, 7) || "<none>"}. A deploy installs from the ` +
        `lockfile, so pushing this would ship the OLD data. Re-run the install naming the exact ref.`,
    );
  }
  console.log(`[bump-consumers] ${repo}: lockfile verified @ ${lockedSha.slice(0, 7)}`);
}

async function main() {
  const [sha, ...repoArgs] = process.argv.slice(2);
  if (!sha) {
    console.error("Usage: npx tsx scripts/bump-consumers.ts <sha> [repo1 repo2 ...]");
    process.exit(1);
  }
  const repos = repoArgs.length > 0 ? repoArgs : DEFAULT_CONSUMER_REPOS;
  bumpConsumers(sha, repos);
}

// Only run when invoked directly (not when imported by the test file).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
