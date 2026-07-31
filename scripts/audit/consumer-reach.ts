/**
 * consumer-reach.ts — audit check #4: does the DATA actually reach the SITES?
 *
 * The other four checks (`under-tagged`, `orphaned`, `starved-inputs`, plus
 * `verify-universe`) all reason about tags and engines INSIDE this repo. None
 * of them can see the thing that actually decides whether a row reaches a user:
 * the consuming repo's import, and the commit of shared-data it installs.
 *
 * That blind spot is not theoretical. Both of these shipped:
 *
 *   1. Researched golf rows landed in the sanctioned ingest file, were merged
 *      only into `ALL_GOLF_COURSES` — an export no consumer imported — and the
 *      audit in this repo counted them and reported the gap CLOSED while zero
 *      users could see them. (Fixed 2026-07-31: `src/golf.ts`.)
 *   2. Handicap HQ and Offsite Outpost both had a `package.json` pin that did
 *      NOT match their `package-lock.json`. npm installs the LOCKFILE, so they
 *      shipped commits ~7 weeks older than their pin implied — invisible to
 *      anyone reading package.json. OO was shipping zero ingested residences
 *      as a result.
 *
 * So this check leaves the repo and looks at the consumers:
 *   A. PIN INTEGRITY   — package.json pin vs package-lock resolved SHA vs main
 *   B. WIZARD REACH    — for each ENGINE_READS kind, does that wizard's repo
 *                        import an export that actually provides it?
 *   C. DEAD DROPS      — data exports no consumer imports at all
 *
 * LOCAL-ONLY by nature: it needs sibling checkouts, so it SKIPS (exit 0) any
 * repo it can't find rather than failing CI. Run it before bumping consumers.
 *
 * Run: npx tsx scripts/audit/consumer-reach.ts [--json]
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ENGINE_READS } from "../../src/engine-reads";
import { ALL_WIZARD_TAGS, type WizardTag } from "../../src/tags";
import type { EntityKind } from "../../src/tagging-rules";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const SIBLING_ROOT = process.env.CONSUMER_ROOT ?? join(REPO_ROOT, "..");

/** Which repo hosts which wizard(s). One repo can host two wizards (Offsite). */
export const CONSUMER_REPOS: { repo: string; wizards: WizardTag[]; note?: string }[] = [
  { repo: "plan-my-party", wizards: ["bestman"] },
  { repo: "maid-of-honor-hq", wizards: ["moh"] },
  { repo: "handicap-hq", wizards: ["handicap"] },
  { repo: "offsite-outpost", wizards: ["offsite-retreat", "offsite-outing"] },
  // tour-de-fore is deliberately ABSENT. It became a personal golf site + pro
  // shop in the 2026-07-02 split and imports nothing from this package; the
  // `tdf` wizard it hosted was retired 2026-07-31 and all golf routes to
  // Handicap HQ. Re-adding it would re-create the phantom consumer this audit
  // was written to expose. If TDF ever consumes shared-data again, add it with
  // the wizard it actually hosts.
];

/**
 * Which public exports genuinely PROVIDE each EntityKind. A consumer importing
 * any one of these can reach that kind; importing none of them means the data
 * cannot reach that site no matter how it is tagged.
 */
export const PROVIDERS: Record<EntityKind, string[]> = {
  "party-venue": ["sharedDestinations", "applyMohOverlay", "applyBestmanOverlay", "applyOutpostOverlay"],
  // `tdfDestinations` counts as a golf-course provider since 2026-07-31: a
  // catalog course carrying a `destinationId` is ATTACHED into that
  // destination's embedded `courses[]` (see src/tdf-destinations.ts), so it
  // reaches a consumer that never imports the flat list. Handicap HQ consumes
  // golf exclusively this way — it renders courses from destinations, and the
  // flat-catalog adapter it used to hold was dead code and has been deleted.
  "golf-course": ["SHARED_GOLF_COURSES", "ALL_GOLF_COURSES", "coursesForCity", "tdfDestinations"],
  "golf-destination": ["tdfDestinations", "SHARED_TDF_DESTINATIONS"],
  residence: ["residencesForSite", "ALL_RESIDENCES", "SHARED_RESIDENCES"],
  experience: ["ooExperiences", "ooHeroExpAir", "ooPoolExpAir", "ooHeroExpWater", "ooPoolExpWater", "ooHeroExpWinter", "ooPoolExpWinter"],
  "outing-template": ["ooSignatureOutings", "ooHeroOutingsUrban", "ooPoolOutingsUrban"],
};

// ─── import extraction ──────────────────────────────────────────────────────

const SOURCE_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) sourceFiles(full, out);
    else if (SOURCE_RE.test(e.name)) out.push(full);
  }
  return out;
}

export interface ImportSite {
  symbol: string;
  files: string[];
  productionFiles: string[];
}

/**
 * Every symbol a repo imports from "shared-data", with the files that import
 * it. Test-only imports are tracked separately — a symbol imported ONLY by a
 * test is not reaching users, which is exactly how Handicap HQ's `hhqCourses()`
 * stayed dead while looking wired.
 */
export function importsFromSharedData(repoRoot: string): Map<string, ImportSite> {
  const found = new Map<string, ImportSite>();
  // Braces with no nested braces, so the match can't run across two statements.
  const re = /import\s+(?:type\s+)?(?:(\*\s+as\s+\w+)|(\{[^{}]*\}))\s*from\s*["']shared-data["']/g;

  for (const dir of ["src", "app", "lib", "scripts", "pages"]) {
    for (const file of sourceFiles(join(repoRoot, dir))) {
      const src = readFileSync(file, "utf-8");
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const rel = file.slice(repoRoot.length + 1);
        const isTest = /\.(test|spec)\.|__tests__|\/tests?\//.test(rel);
        const symbols = m[1]
          ? ["* (namespace)"]
          : m[2]!
              .replace(/[{}]/g, "")
              .split(",")
              .map((s) => s.replace(/\btype\b/, "").trim().split(/\s+as\s+/)[0]!.trim())
              .filter(Boolean);
        for (const s of symbols) {
          const rec = found.get(s) ?? { symbol: s, files: [], productionFiles: [] };
          rec.files.push(rel);
          if (!isTest) rec.productionFiles.push(rel);
          found.set(s, rec);
        }
      }
    }
  }
  return found;
}

// ─── is the wrapper actually consumed? ──────────────────────────────────────

/** Value exports (not types) declared by a file — the surface other code calls. */
function valueExportsOf(src: string): string[] {
  const names = new Set<string>();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:const|function|class)\s+(\w+)/g)) names.add(m[1]!);
  // `export { a, b }` — but NOT `export { a } from "..."`, which is a re-export
  // shim rather than a definition.
  for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*(?!from)/g)) {
    for (const raw of m[1]!.split(",")) {
      const n = raw.replace(/\btype\b/, "").trim().split(/\s+as\s+/).pop()?.trim();
      if (n) names.add(n);
    }
  }
  return [...names];
}

/**
 * A provider import in a production file still reaches nobody if the wrapper it
 * feeds is never called. Handicap HQ's `hhqCourses()` is the case in point: it
 * imports `SHARED_GOLF_COURSES` in real source, is re-exported from the data
 * barrel — and is referenced by nothing except its own test. "Imported" is not
 * "reaching users"; only a live call path is.
 *
 * Counts references to the file's value exports elsewhere in the repo,
 * ignoring the defining file, test files, and pure `export … from` shims.
 */
function wrapperIsConsumed(repoRoot: string, importingFile: string, files: string[]): boolean {
  const abs = join(repoRoot, importingFile);
  let src: string;
  try {
    src = readFileSync(abs, "utf-8");
  } catch {
    return true; // can't tell — don't cry wolf
  }
  const exports = valueExportsOf(src);
  if (exports.length === 0) return true; // side-effect module; nothing to call

  for (const other of files) {
    if (other === abs) continue;
    const rel = other.slice(repoRoot.length + 1);
    if (/\.(test|spec)\.|__tests__|\/tests?\//.test(rel)) continue;
    let text: string;
    try {
      text = readFileSync(other, "utf-8");
    } catch {
      continue;
    }
    // Drop re-export lines so a barrel forwarding the symbol doesn't count as use.
    const meaningful = text
      .split("\n")
      .filter((l) => !/export\s*(\{[^}]*\}|\*)\s*from/.test(l))
      .join("\n");
    for (const name of exports) {
      if (new RegExp(`\\b${name}\\b`).test(meaningful)) return true;
    }
  }
  return false;
}

// ─── pin integrity ──────────────────────────────────────────────────────────

export interface PinState {
  declared: string | null;
  locked: string | null;
  drift: boolean;
}

export function readPinState(repoRoot: string): PinState {
  const read = (p: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(readFileSync(join(repoRoot, p), "utf-8"));
    } catch {
      return null;
    }
  };
  const pkg = read("package.json");
  const lock = read("package-lock.json");

  const dep =
    ((pkg?.dependencies as Record<string, string>) ?? {})["shared-data"] ??
    ((pkg?.devDependencies as Record<string, string>) ?? {})["shared-data"] ??
    null;
  const declared = dep?.includes("#") ? dep.split("#")[1]! : dep ? "(unpinned — tracks default branch)" : null;

  const entry = (lock?.packages as Record<string, { resolved?: string }> | undefined)?.["node_modules/shared-data"];
  const locked = entry?.resolved?.includes("#") ? entry.resolved.split("#")[1]! : null;

  const comparable = declared && locked && !declared.startsWith("(");
  const drift = !!comparable && !locked.startsWith(declared) && !declared.startsWith(locked.slice(0, 7));
  return { declared, locked, drift };
}

function gitInfo(sha: string): { date: string; behind: string } | null {
  try {
    const date = execFileSync("git", ["show", "-s", "--format=%cs", sha], { cwd: REPO_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const behind = execFileSync("git", ["rev-list", "--count", `${sha}..origin/main`], { cwd: REPO_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return { date, behind };
  } catch {
    return null;
  }
}

// ─── the run ────────────────────────────────────────────────────────────────

export interface ReachFinding {
  severity: "critical" | "warning" | "info";
  repo: string;
  detail: string;
}

export function runConsumerReach(): { findings: ReachFinding[]; skipped: string[] } {
  const findings: ReachFinding[] = [];
  const skipped: string[] = [];
  const allImported = new Set<string>();

  for (const { repo, wizards, note } of CONSUMER_REPOS) {
    const root = join(SIBLING_ROOT, repo);
    if (!existsSync(root)) {
      skipped.push(repo);
      continue;
    }

    // A. pin integrity
    const pin = readPinState(root);
    if (pin.drift) {
      const lockInfo = pin.locked ? gitInfo(pin.locked) : null;
      const declInfo = pin.declared ? gitInfo(pin.declared) : null;
      findings.push({
        severity: "critical",
        repo,
        detail:
          `package.json pins #${pin.declared}${declInfo ? ` (${declInfo.date}, ${declInfo.behind} behind main)` : ""} ` +
          `but package-lock.json resolves ${pin.locked?.slice(0, 7)}${lockInfo ? ` (${lockInfo.date}, ${lockInfo.behind} behind main)` : ""}. ` +
          `npm installs the LOCKFILE — this repo ships the older tree. Run \`npm install shared-data@github:ncmills/shared-data#<sha>\` to resync.`,
      });
    } else if (pin.locked) {
      const info = gitInfo(pin.locked);
      if (info && Number(info.behind) > 0) {
        findings.push({
          severity: Number(info.behind) > 20 ? "warning" : "info",
          repo,
          detail: `ships ${pin.locked.slice(0, 7)} (${info.date}) — ${info.behind} commit(s) behind main.`,
        });
      }
    }

    // B. wizard reach
    const imports = importsFromSharedData(root);
    const repoFiles = ["src", "app", "lib", "scripts", "pages"].flatMap((d) => sourceFiles(join(root, d)));
    for (const s of imports.keys()) allImported.add(s);

    for (const wizard of wizards) {
      for (const kind of ENGINE_READS[wizard]) {
        const providers = PROVIDERS[kind] ?? [];
        const hits = providers.filter((p) => imports.has(p));
        const live = hits.filter((p) => (imports.get(p)?.productionFiles.length ?? 0) > 0);

        if (hits.length === 0) {
          findings.push({
            severity: "critical",
            repo,
            detail: `${wizard} declares it reads "${kind}" but ${repo} imports NONE of its providers (${providers.join(", ")}) — that data cannot reach this site.`,
          });
        } else if (live.length === 0) {
          findings.push({
            severity: "critical",
            repo,
            detail: `${wizard}'s "${kind}" reaches ${repo} ONLY through test files (${hits.join(", ")}) — no production code path consumes it.`,
          });
        } else {
          // Imported by real source — but is the wrapper it feeds ever called?
          const orphanWrappers = live
            .flatMap((p) => imports.get(p)!.productionFiles)
            .filter((f, i, a) => a.indexOf(f) === i)
            .filter((f) => !wrapperIsConsumed(root, f, repoFiles));
          if (orphanWrappers.length === live.flatMap((p) => imports.get(p)!.productionFiles).filter((f, i, a) => a.indexOf(f) === i).length) {
            findings.push({
              severity: "critical",
              repo,
              detail:
                `${wizard}'s "${kind}" is imported by ${orphanWrappers.join(", ")}, but nothing in ${repo} calls what that module exports ` +
                `(re-exports and tests don't count) — the data is wired but DEAD, so it reaches no user.`,
            });
          }
        }
      }
    }

    if (note) findings.push({ severity: "info", repo, detail: note });
  }

  // C. dead drops — data exports nobody imports
  if (skipped.length < CONSUMER_REPOS.length) {
    const dataExports = new Set(Object.values(PROVIDERS).flat());
    for (const exp of [...dataExports].sort()) {
      if (!allImported.has(exp)) {
        findings.push({
          severity: "info",
          repo: "(shared-data)",
          detail: `export "${exp}" is imported by NO consumer repo — confirm it isn't the only route to some dataset.`,
        });
      }
    }
  }

  return { findings, skipped };
}

// ESM "run as script" guard
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { findings, skipped } = runConsumerReach();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ findings, skipped }, null, 2));
  } else {
    const icon = { critical: "❌", warning: "⚠️ ", info: "· " } as const;
    console.log("consumer-reach — does shared-data actually reach the sites?\n");
    for (const sev of ["critical", "warning", "info"] as const) {
      for (const f of findings.filter((x) => x.severity === sev)) {
        console.log(`${icon[sev]} [${f.repo}] ${f.detail}`);
      }
    }
    if (skipped.length) console.log(`\n(skipped — no local checkout: ${skipped.join(", ")})`);
    const criticals = findings.filter((f) => f.severity === "critical").length;
    console.log(`\n${criticals} critical, ${findings.filter((f) => f.severity === "warning").length} warning`);
  }
  // Local tool: never fail a CI run just because siblings aren't checked out.
  process.exit(0);
}
