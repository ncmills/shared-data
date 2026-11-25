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
 *   D. FIELD REACH     — a row the consumer DOES surface, but stripped of the
 *                        data that made it worth researching
 *
 * LOCAL-ONLY by nature: it needs sibling checkouts, so it SKIPS (exit 0) any
 * repo it can't find rather than failing CI. Run it before bumping consumers.
 *
 * Run: npx tsx scripts/audit/consumer-reach.ts [--json]
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ENGINE_READS } from "../../src/engine-reads";
import { ALL_WIZARD_TAGS, type WizardTag } from "../../src/tags";
import type { EntityKind } from "../../src/tagging-rules";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
export const SIBLING_ROOT = process.env.CONSUMER_ROOT ?? join(REPO_ROOT, "..");

/** Which repo hosts which wizard(s). One repo can host two wizards (Offsite). */
export const CONSUMER_REPOS: { repo: string; wizards: WizardTag[]; note?: string }[] = [
  { repo: "plan-my-party", wizards: ["bestman"] },
  { repo: "maid-of-honor-hq", wizards: ["moh"] },
  { repo: "handicap-hq", wizards: ["handicap"] },
  { repo: "offsite-outpost", wizards: ["offsite-retreat", "offsite-outing"] },
  // Added 2026-08-21. Both were tagged ahead of their consumers (see the note in
  // src/tags.ts) and both have since REACHED them: engagedmoon on 2026-08-06,
  // friendsmoon by 2026-08-20. Each imports `sharedDestinations` — engagedmoon
  // across src/lib/{trip-context,refine-plan,proposal-spots,trip}.ts, friendsmoon
  // in src/lib/catalog.ts — and each pins a real SHA. Until now neither was
  // listed here, so 5,878 tagged rows apiece were reaching production with the
  // pin-integrity and field-reach checks never once run against them. That is
  // the same blind spot this file was written to close, arrived at from the
  // opposite direction: not a phantom consumer counted as real, but a real
  // consumer counted as nothing.
  { repo: "friendsmoon", wizards: ["friendsmoon"] },
  { repo: "engagedmoon", wizards: ["engagedmoon"] },
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
  // `golfDestinations` counts as a golf-course provider since 2026-07-31: a
  // catalog course carrying a `destinationId` is ATTACHED into that
  // destination's embedded `courses[]` (see src/golf-destinations.ts), so it
  // reaches a consumer that never imports the flat list. Handicap HQ consumes
  // golf exclusively this way — it renders courses from destinations, and the
  // flat-catalog adapter it used to hold was dead code and has been deleted.
  "golf-course": ["SHARED_GOLF_COURSES", "ALL_GOLF_COURSES", "coursesForCity", "golfDestinations"],
  "golf-destination": ["golfDestinations", "SHARED_GOLF_DESTINATIONS"],
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

/**
 * CHECK D — SHADOWED PROVENANCE.
 *
 * Added 2026-08-01 after the third instance of the same failure. Checks A-C ask
 * "does the row reach the site". This asks "does the row arrive INTACT".
 *
 * The URL backfill sourced 389 venues in shared-data and only ~102 reached the
 * wizard. Both party consumers union-merge their own local destination files
 * over shared-data, and for the ~90 cities they carry locally the LOCAL twin
 * wins — carrying no url — while the shared twin holding the researched url is
 * dropped as a duplicate. Every existing gate passed: the row was present, the
 * count was right, the audit was green. A live plan on prod rendered a GUESSED
 * url next to a catalog that held the real one.
 *
 * The check is exact rather than a threshold, because brand filtering
 * legitimately removes venues: a venue the consumer does not surface AT ALL is
 * fine (MOH should not show a bachelor-coded bar). A venue the consumer DOES
 * surface, whose shared twin has provenance and whose merged copy does not, is
 * always a bug.
 *
 * Runs inside the consumer against the shared-data IT ACTUALLY INSTALLS, not
 * this working tree — that is the version its users get.
 */
const FIELD_REACH_PROBE = `
import { allDestinations } from "./src/data/index";
import { sharedDestinations } from "shared-data";
const CATS = ["activities","dining","nightlife","lodging","transport"];
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, " ").trim();
const merged = new Map();
for (const d of allDestinations) {
  for (const c of CATS) for (const v of d[c] ?? []) merged.set(d.id + "|" + c + "|" + norm(v.name), v);
}
let sourced = 0, surfaced = 0, shadowed = 0;
const examples = [];
for (const d of sharedDestinations) {
  for (const c of CATS) for (const v of d[c] ?? []) {
    if (!v.url) continue;
    sourced++;
    const m = merged.get(d.id + "|" + c + "|" + norm(v.name));
    if (!m) continue;            // filtered out entirely — legitimate
    surfaced++;
    if (!m.url) { shadowed++; if (examples.length < 5) examples.push(d.id + "/" + c + ": " + v.name); }
  }
}
console.log("__FIELD_REACH__" + JSON.stringify({ sourced, surfaced, shadowed, examples }));
`;

export type FieldReach =
  | { kind: "measured"; sourced: number; surfaced: number; shadowed: number; examples: string[] }
  /** No local destination catalog, so there is no twin that could shadow —
   *  structurally clean rather than merely unobserved. */
  | { kind: "not-applicable"; reason: string }
  /** Could not be observed. NOT a pass. */
  | { kind: "unmeasured" };

/**
 * Run the probe inside a consumer checkout.
 *
 * Three outcomes, deliberately distinct. "could not measure" must never be
 * reported as "clean" — that conflation is exactly how this class of bug
 * survived. But neither should a repo be held permanently red for a check that
 * cannot apply to it: Offsite Outpost has no local destination catalog at all
 * (it reads `sharedDestinations` + `applyOutpostOverlay` directly), so there is
 * no local twin to shadow anything. That is a real answer, not a missing one.
 */
export function checkFieldReach(repoRoot: string, readsPartyVenue: boolean): FieldReach {
  // Check D is about PARTY-VENUE provenance specifically. A consumer whose
  // engine does not read party-venue builds its catalog from a different
  // dataset, and comparing the two produces nonsense.
  //
  // It produced exactly that on its first run: Handicap HQ was reported
  // "3 of 3 shadowed (100%)" for Birmingham/Mobile dining. HHQ reads
  // `golfDestinations()`, a SEPARATE dataset that happens to share destination
  // ids and venue names with the party catalog. The party row for Automatic
  // Seafood carries automaticseafood.com; the golf row is a different object
  // that never had one. Nothing was being shadowed.
  //
  // (There IS a real finding underneath: the same restaurant is sourced in the
  // party dataset and unsourced in the golf one, so the backfill never benefits
  // HHQ even for identical venues. That is cross-dataset DUPLICATION, not
  // shadowing. It is deliberately NOT reported by this check — it needs its own
  // check against the golf dataset, which does not exist yet.)
  if (!readsPartyVenue) {
    return {
      kind: "not-applicable",
      reason: "engine does not read party-venue — its catalog comes from another dataset entirely",
    };
  }
  if (!existsSync(join(repoRoot, "src", "data", "index.ts"))) {
    return {
      kind: "not-applicable",
      reason: "no local destination catalog (src/data/index.ts) — reads shared-data directly, so no local twin can shadow it",
    };
  }
  try {
    const out = execFileSync("npx", ["tsx", "--eval", FIELD_REACH_PROBE], {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 180_000,
    });
    const line = out.split("\n").find((l) => l.includes("__FIELD_REACH__"));
    if (!line) return { kind: "unmeasured" };
    const parsed = JSON.parse(line.slice(line.indexOf("__FIELD_REACH__") + "__FIELD_REACH__".length));
    return { kind: "measured", ...parsed };
  } catch {
    return { kind: "unmeasured" };
  }
}

export interface ReachFinding {
  severity: "critical" | "warning" | "info";
  repo: string;
  detail: string;
}

/**
 * Every sibling checkout that declares a `shared-data` dependency. The roster
 * above is hand-maintained, and a consumer missing from it is invisible to
 * every check in this file — which is strictly worse than a failing check,
 * because the report still says PASS. friendsmoon and engagedmoon each shipped
 * ~5,878 tagged rows to production this way, unaudited, until 2026-08-21.
 *
 * So: derive the truth from the filesystem and compare. A repo that installs
 * this package is a consumer whether or not anyone wrote it down.
 */
export function declaredConsumers(): string[] {
  let entries;
  try {
    entries = readdirSync(SIBLING_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;

    // Skip git WORKTREES. A worktree of plan-my-party is a second checkout of a
    // consumer already on the roster, not a seventh consumer — flagging it would
    // fail this check on a correct tree, and a guard that fires on correct state
    // is a guard people learn to ignore. A worktree's `.git` is a FILE pointing
    // at the parent's gitdir; a real clone's is a directory. Three of these
    // (bmhq-og-sweep, moh-og-sweep, friendsmoon-atlasfix) sat in the sibling
    // root the day this check was written.
    try {
      if (statSync(join(SIBLING_ROOT, e.name, ".git")).isFile()) continue;
    } catch {
      // no .git at all — not a checkout; the package.json test below decides
    }

    try {
      const pkg = JSON.parse(readFileSync(join(SIBLING_ROOT, e.name, "package.json"), "utf8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["shared-data"]) found.push(e.name);
    } catch {
      // no package.json, or unreadable — not a consumer as far as we can tell
    }
  }
  return found.sort();
}

export function runConsumerReach(): { findings: ReachFinding[]; skipped: string[] } {
  const findings: ReachFinding[] = [];
  const skipped: string[] = [];
  const allImported = new Set<string>();

  // 0. roster integrity — a consumer nobody registered is a consumer nobody checks
  const registered = new Set(CONSUMER_REPOS.map((c) => c.repo));
  for (const repo of declaredConsumers()) {
    if (registered.has(repo)) continue;
    findings.push({
      severity: "critical",
      repo,
      detail:
        `depends on shared-data but is NOT in CONSUMER_REPOS — so its pin integrity, wizard ` +
        `reach and field reach have never been checked, and \`bump-consumers\` skips it on every ` +
        `release. Add it to CONSUMER_REPOS (scripts/audit/consumer-reach.ts) with the wizard(s) it hosts.`,
    });
  }

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

    // D. field reach — surfaced but stripped of its provenance
    const readsPartyVenue = wizards.some((w) =>
      ((ENGINE_READS as Record<string, readonly string[]>)[w] ?? []).includes("party-venue"),
    );
    const fr = checkFieldReach(root, readsPartyVenue);
    if (fr.kind === "not-applicable") {
      findings.push({ severity: "info", repo, detail: `field reach N/A — ${fr.reason}.` });
    } else if (fr.kind === "unmeasured") {
      // A probe that could not run is NOT a pass. Say so rather than stay
      // silent — absence of a measurement is not a passing measurement.
      findings.push({
        severity: "warning",
        repo,
        detail:
          `field-reach probe did not run (tsx/import failure or timeout) — shadowed provenance is ` +
          `UNMEASURED here, not clean.`,
      });
    } else if (fr.shadowed > 0) {
      const pct = fr.surfaced > 0 ? Math.round((fr.shadowed / fr.surfaced) * 100) : 0;
      findings.push({
        severity: "critical",
        repo,
        detail:
          `${fr.shadowed} of ${fr.surfaced} surfaced venues (${pct}%) carry a url in shared-data but ` +
          `NOT in this repo's merged catalog — the local twin is shadowing researched provenance. ` +
          `e.g. ${fr.examples.slice(0, 3).join("; ")}`,
      });
    } else if (fr.sourced > 0) {
      findings.push({
        severity: "info",
        repo,
        detail: `field reach OK — ${fr.surfaced} of ${fr.sourced} sourced venues surface, none stripped.`,
      });
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
