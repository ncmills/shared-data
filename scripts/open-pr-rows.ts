/**
 * open-pr-rows.ts — which party-venue patches are ALREADY PROPOSED in an open
 * `expand/*` PR, so the weekly url-backfill lane does not propose them again.
 *
 * WHY. The lane resets its worktree to origin/main and builds its queue from
 * "still unsourced on main". A row sitting in an open PR is not on main, so the
 * next Tuesday researched and proposed it again. Measured 2026-09-24: five open
 * url-backfill PRs held 565 rows between them, 189 distinct.
 *
 * FAIL CLOSED. If `gh` or `git` cannot answer, this exits non-zero and writes
 * NOTHING, and weekly-url-backfill.sh stops without opening a PR. The fail-open
 * version ("no open PRs found") is exactly the bug this exists to fix, and it
 * would look like a clean run.
 *
 *   npx tsx scripts/open-pr-rows.ts --out=<path>      (after `git fetch origin`)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { venueKey } from "./backfill-queue";

export const PATCH_FILE = "src/party-venue-patches.ts";

export interface PendingFile {
  generatedAt: string;
  branches: { branch: string; keys: string[] }[];
  keys: string[];
}

/** The rows of the patch file's single array export, as parsed JSON. */
export function parsePatchRows(fileText: string): { destinationId: string; category: string; name: string }[] {
  const m = fileText.match(/export const \w+\s*:\s*[^=\n]+=\s*(\[[\s\S]*\]);?\s*$/);
  if (!m) throw new Error(`open-pr-rows: could not locate the array export in ${PATCH_FILE}`);
  const arr = JSON.parse(m[1]);
  if (!Array.isArray(arr)) throw new Error(`open-pr-rows: ${PATCH_FILE} array export did not parse to an array`);
  return arr;
}

/** Keys a branch's patch file carries that main's does not. */
export function addedPatchKeys(branchText: string, mainText: string): string[] {
  const k = (r: { destinationId: string; category: string; name: string }) =>
    venueKey(r.destinationId, r.category, r.name);
  const onMain = new Set(parsePatchRows(mainText).map(k));
  return [...new Set(parsePatchRows(branchText).map(k))].filter((key) => !onMain.has(key));
}

export interface CollectDeps {
  /** Head branch names of OPEN PRs. Must THROW when it cannot answer. */
  listOpenPrBranches: () => string[];
  /** `git show <ref>:<path>`. Must THROW when it cannot answer. */
  readAtRef: (ref: string, path: string) => string;
}

export function collectPendingKeys(deps: CollectDeps, now = new Date()): PendingFile {
  const branches = deps.listOpenPrBranches().filter((b) => b.startsWith("expand/")).sort();
  const mainText = deps.readAtRef("origin/main", PATCH_FILE);
  const per = branches.map((branch) => ({
    branch,
    keys: addedPatchKeys(deps.readAtRef(`origin/${branch}`, PATCH_FILE), mainText),
  }));
  return {
    generatedAt: now.toISOString(),
    branches: per,
    keys: [...new Set(per.flatMap((p) => p.keys))].sort(),
  };
}

/**
 * Read the file this script wrote. `required` is true for an unattended run:
 * a missing or malformed file THROWS rather than reading as "nothing pending".
 */
export function loadPendingKeys(path: string | undefined, required: boolean): Set<string> {
  if (!path) {
    if (required) {
      throw new Error(
        "run-backfill: --auto needs --pending-keys=<file from scripts/open-pr-rows.ts>. " +
          "Without it the lane re-proposes rows already under review in open PRs.",
      );
    }
    return new Set();
  }
  if (!existsSync(path)) throw new Error(`run-backfill: pending-keys file ${path} does not exist`);
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as Partial<PendingFile>;
  if (!parsed || !Array.isArray(parsed.keys) || parsed.keys.some((k) => typeof k !== "string")) {
    throw new Error(`run-backfill: pending-keys file ${path} is malformed (no string array "keys")`);
  }
  return new Set(parsed.keys);
}

// ─── CLI ────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv.slice(2).find((a) => a.startsWith("--out="))?.slice("--out=".length);
  if (!out) {
    console.error("open-pr-rows: --out=<path> is required");
    process.exit(2);
  }
  try {
    const result = collectPendingKeys({
      listOpenPrBranches: () => {
        // --limit well above any real count; a truncated list would fail open.
        const json = execFileSync(
          "gh",
          ["pr", "list", "--state", "open", "--limit", "500", "--json", "headRefName"],
          { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
        );
        const rows = JSON.parse(json) as { headRefName: string }[];
        if (!Array.isArray(rows)) throw new Error("gh pr list did not return an array");
        return rows.map((r) => r.headRefName);
      },
      readAtRef: (ref, path) =>
        execFileSync("git", ["show", `${ref}:${path}`], {
          encoding: "utf-8",
          maxBuffer: 64 * 1024 * 1024,
          stdio: ["ignore", "pipe", "pipe"],
        }),
    });
    writeFileSync(out, JSON.stringify(result, null, 1) + "\n");
    console.log(
      `open-pr-rows: ${result.branches.length} open expand/* PR(s), ` +
        `${result.keys.length} distinct row(s) already proposed -> ${out}`,
    );
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    const why = (err.stderr || err.message || String(e)).toString().trim().split("\n").slice(-2).join(" ");
    console.error(`open-pr-rows: FAILED, wrote nothing: ${why}`);
    process.exit(1);
  }
}
