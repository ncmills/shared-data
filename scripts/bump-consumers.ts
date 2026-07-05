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
    execSync("npm install --package-lock-only", { cwd: repo, stdio: "inherit" });
  }
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
