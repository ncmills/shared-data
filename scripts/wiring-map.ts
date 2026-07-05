/**
 * wiring-map.ts — audits which wizards read shared-data vs. their own local
 * forked datasets, so later reconciliation tasks (Task 3/4) know which
 * consumer repos still need wiring.
 *
 * Pure classifier (`classifyRepo`) + a grep-driven runner (`wiringMap`) that
 * inspects the 4 consumer repos on disk and writes docs/wiring-map.json.
 *
 * Run: npx tsx scripts/wiring-map.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WizardTag } from "../src/tags";

export interface WiringRow {
  wizard: WizardTag | string;
  repo: string;
  readsShared: boolean;
  localForks: string[];
  entityKinds: string[];
}

/** Marks a grep hit as evidence the repo pulls from the shared cache. */
const SHARED_RE = /sharedDestinations|shared-data|jsdelivr.*shared-data/;

/** Marks a grep hit's file path as a known local-fork dataset. */
const LOCAL_FORK_RE = /(golf-atlas|destinations-.*\.ts|lib\/atlas)/;

function entityKindOf(file: string): string {
  if (/golf-atlas/.test(file)) return "golf";
  if (/destinations-.*\.ts/.test(file)) return "destinations";
  if (/lib\/atlas/.test(file)) return "atlas";
  return "unknown";
}

/**
 * Pure classifier: given a wizard tag, a repo path, and a set of grep hit
 * lines (each "path: matched content"), decide whether the repo reads the
 * shared cache and/or holds known local-fork datasets.
 */
export function classifyRepo(
  wizard: WizardTag | string,
  repoPath: string,
  grepHits: string[]
): WiringRow {
  const readsShared = grepHits.some((h) => SHARED_RE.test(h));

  const localForkFiles = grepHits
    .filter((h) => LOCAL_FORK_RE.test(h.split(":")[0]))
    .map((h) => h.split(":")[0]);
  const localForks = [...new Set(localForkFiles)];

  const entityKinds = [...new Set(localForks.map(entityKindOf))];

  return { wizard, repo: repoPath, readsShared, localForks, entityKinds };
}

/** The 4 consumer repos + their wizard tag(s). Offsite is one repo, two wizards. */
const REPOS: { wizard: WizardTag | string; repoPath: string }[] = [
  { wizard: "bestman", repoPath: "/Users/bignick/plan-my-party" },
  { wizard: "moh", repoPath: "/Users/bignick/maid-of-honor-hq" },
  { wizard: "handicap", repoPath: "/Users/bignick/handicap-hq" },
  { wizard: "offsite-retreat", repoPath: "/Users/bignick/offsite-outpost" },
  { wizard: "offsite-outing", repoPath: "/Users/bignick/offsite-outpost" },
];

/** Content grep pattern: catches shared-cache reads wherever they're imported. */
const GREP_PATTERN = "sharedDestinations|shared-data";

/** Filename/path pattern: catches local-fork dataset FILES even when their own
 *  content has no textual match (e.g. golf-atlas.ts defines GOLF_ATLAS but
 *  never spells "golf-atlas" or "shared-data" inside itself). */
const FORK_FIND_EXPR =
  `\\( -iname 'golf-atlas.ts' -o -iname 'destinations-*.ts' -o -path '*/lib/atlas/*' \\)`;

function runOrEmpty(cmd: string, cwd: string): string[] {
  try {
    const out = execSync(cmd, { cwd, encoding: "utf8" });
    return out.split("\n").filter(Boolean);
  } catch (err) {
    const e = err as { stdout?: string };
    // grep/find exit non-zero on "no matches" — a valid empty result, not a failure.
    if (typeof e.stdout === "string") return e.stdout.split("\n").filter(Boolean);
    return [];
  }
}

function grepRepo(repoPath: string): string[] {
  const contentHits = runOrEmpty(
    `grep -rn -E '${GREP_PATTERN}' --include='*.ts' --include='*.tsx' src`,
    repoPath
  );

  // Local-fork files, found by path/name rather than content, synthesized into
  // the same "path: note" hit shape classifyRepo expects.
  const forkFiles = runOrEmpty(`find src -type f ${FORK_FIND_EXPR}`, repoPath);
  const forkHits = forkFiles.map((f) => `${f}: (local-fork dataset file)`);

  return [...contentHits, ...forkHits];
}

/** Runs the greps across the 4 consumer repos and writes docs/wiring-map.json. */
export function wiringMap(): WiringRow[] {
  const rows = REPOS.map(({ wizard, repoPath }) =>
    classifyRepo(wizard, repoPath, grepRepo(repoPath))
  );

  const outDir = path.resolve(import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url)), "..", "docs");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "wiring-map.json"), JSON.stringify(rows, null, 2) + "\n");

  return rows;
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const rows = wiringMap();
  for (const r of rows) {
    const status = r.readsShared ? "reads-shared" : "NOT wired";
    const forks = r.localForks.length ? ` — local forks: ${r.localForks.join(", ")}` : "";
    console.log(`${r.wizard} (${r.repo}): ${status}${forks}`);
  }
  console.log(`\nWrote docs/wiring-map.json (${rows.length} rows)`);
}
