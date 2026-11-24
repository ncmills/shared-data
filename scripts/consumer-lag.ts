/**
 * consumer-lag.ts — daily consumer-lag guard (G808 part 2).
 *
 * RED when a consumer's `shared-data` pin is missing a shared-data main commit
 * that is more than LAG_LIMIT_DAYS old. "Lag" for a site = age in days of the
 * OLDEST commit on main that is NOT in the pin's history (0 if the pin is main
 * or ahead). A pin that is not in shared-data's history at all is RED
 * ("unknown sha"), never green — an unmeasurable pin is not a fresh one.
 *
 * The roster is `CONSUMER_REPOS` from scripts/audit/consumer-reach.ts — the one
 * consumer list; there is no second one here. Pins are read from ORIGIN
 * (`gh api .../contents/package.json`), never from local checkouts, which lag.
 *
 * Complements (does not duplicate) second-nick's weekly pin_parity_steward:
 * that one catalogues + drafts bumps; this is the shared-data-owned red/green.
 *
 * Run: npm run lag        (exit 1 if any site is RED)
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CONSUMER_REPOS } from "./audit/consumer-reach";

export const LAG_LIMIT_DAYS = 7;
const DAY_MS = 86_400_000;
const DEP_NAME = "shared-data";

export interface LagCommit {
  sha: string;
  /** ISO-8601 commit date. */
  date: string;
  parents: string[];
}
export interface LagPin {
  site: string;
  /** sha (full or abbreviated) from the package.json spec; null = no `#sha`. */
  pinSha: string | null;
}
export interface LagLine {
  site: string;
  status: "GREEN" | "RED";
  pinSha: string | null;
  mainSha: string;
  lagDays: number | null;
  message: string;
}

export function parsePinSha(spec: string | undefined): string | null {
  if (!spec) return null;
  const m = /#([0-9a-f]{7,40})$/i.exec(spec.trim());
  return m ? m[1].toLowerCase() : null;
}

export function lagReport(
  input: { mainSha: string; pins: LagPin[]; commits: LagCommit[] },
  now: Date,
): LagLine[] {
  const { mainSha, pins, commits } = input;
  const bySha = new Map(commits.map((c) => [c.sha, c]));
  const short = (s: string | null) => (s ? s.slice(0, 7) : "none");
  const main7 = short(mainSha);

  const resolve = (pin: string): string | null => {
    if (bySha.has(pin)) return pin;
    const hits = commits.filter((c) => c.sha.startsWith(pin));
    return hits.length === 1 ? hits[0].sha : null;
  };
  const ancestors = (tip: string): Set<string> => {
    const seen = new Set<string>();
    const stack = [tip];
    while (stack.length) {
      const s = stack.pop()!;
      if (seen.has(s)) continue;
      seen.add(s);
      for (const p of bySha.get(s)?.parents ?? []) stack.push(p);
    }
    return seen;
  };

  return pins.map((p): LagLine => {
    const base = { site: p.site, pinSha: p.pinSha, mainSha };
    if (!p.pinSha) {
      return { ...base, status: "RED", lagDays: null,
        message: `${p.site}: RED unpinned (no #sha in the ${DEP_NAME} spec) — main is ${main7}` };
    }
    const full = resolve(p.pinSha);
    if (!full) {
      return { ...base, status: "RED", lagDays: null,
        message: `${p.site}: RED unknown sha — pin ${short(p.pinSha)} is not in ${DEP_NAME} history (main ${main7})` };
    }
    const have = ancestors(full);
    let oldest: number | null = null;
    for (const c of commits) {
      if (have.has(c.sha)) continue;
      const t = Date.parse(c.date);
      if (oldest === null || t < oldest) oldest = t;
    }
    const lagDays = oldest === null ? 0 : Math.max(0, (now.getTime() - oldest) / DAY_MS);
    const red = lagDays > LAG_LIMIT_DAYS;
    const d = Math.round(lagDays * 10) / 10;
    return { ...base, status: red ? "RED" : "GREEN", lagDays,
      message: `${p.site}: ${red ? "RED" : "GREEN"} pin ${short(p.pinSha)} main ${main7} lag ${d}d (limit ${LAG_LIMIT_DAYS}d)` };
  });
}

// ── CLI ────────────────────────────────────────────────────────────────────
function readPinFromOrigin(repo: string): string | null {
  const out = execFileSync(
    "gh",
    ["api", `repos/ncmills/${repo}/contents/package.json`, "--jq", ".content"],
    { encoding: "utf8" },
  );
  const pkg = JSON.parse(Buffer.from(out.replace(/\s/g, ""), "base64").toString("utf8"));
  const spec = pkg.dependencies?.[DEP_NAME] ?? pkg.devDependencies?.[DEP_NAME];
  return parsePinSha(spec);
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, "..");
  const git = (...a: string[]) => execFileSync("git", ["-C", root, ...a], { encoding: "utf8" }).trim();
  git("fetch", "origin", "-q");
  const mainSha = git("rev-parse", "origin/main");
  const commits: LagCommit[] = git("log", "origin/main", "--format=%H|%cI|%P")
    .split("\n").filter(Boolean).map((l) => {
      const [sha, date, parents] = l.split("|");
      return { sha, date, parents: parents ? parents.split(" ") : [] };
    });
  const pins: LagPin[] = CONSUMER_REPOS.map((c) => ({ site: c.repo, pinSha: readPinFromOrigin(c.repo) }));
  const lines = lagReport({ mainSha, pins, commits }, new Date());
  for (const l of lines) console.log(l.message);
  process.exit(lines.some((l) => l.status === "RED") ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
