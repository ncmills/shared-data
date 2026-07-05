/**
 * release.ts — prints the shared-data commit SHA to release.
 *
 * A "release" is nothing more than a commit on `main` — there's no build
 * step, no npm publish (shared-data ships as raw TS via the npm git dep).
 * This script exists so the propagation runbook (docs/propagation.md) has a
 * single, scriptable step 2: run this AFTER merging your feature branch to
 * `main` (and pushing), then feed its output straight into
 * `bump-consumers.ts <sha>`.
 *
 * Run: npx tsx scripts/release.ts
 */
import { execSync } from "node:child_process";

export function currentSha(): string {
  return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
}

function main() {
  const sha = currentSha();
  console.log(sha);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
