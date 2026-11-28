// guards/coverage.ts — fleet coverage of the shared guards (for SN fleet-truth).
//
//   node --import tsx guards/coverage.ts [--fleet <fleet.json>] [--json]
//
// Fleet source: guards/fleet.json (explicit list of every portfolio site's GitHub repo, plus
// named exclusions that are never read). Each site is read from ORIGIN's default branch
// through an injectable fetcher (default: `gh api repos/<repo>/contents/<path>`), never
// from a local checkout. A site counts as covered for a guard only when ALL hold:
//   1. a workflow under .github/workflows has a live (uncommented) `uses:` line naming
//      ncmills/shared-data/.github/workflows/site-guards.yml;
//   2. package.json's prebuild runs shared-data guards/run.ts (and --only, if any, names it);
//   3. guards.config.json configures the guard (or carries a CONTROL-ruling opt-out).
// Personal sites and sites whose `guards` list omits a guard are not counted for it.
// Exit 1 when any guard is RED (covered < total).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GUARD_IDS } from "./registry.ts";
import type { SiteConfig } from "./lib.ts";

export interface FleetSite { repo: string; site?: string; personal?: boolean; guards?: string[] }
export interface Fleet { sites: FleetSite[]; excluded: { repo: string; reason: string }[] }
/** Returns file text, a JSON array of names for a directory, or null when absent. */
export type Fetcher = (repo: string, path: string) => string | null;

export const DEFAULT_OPT_OUTS = join(dirname(fileURLToPath(import.meta.url)), "opt-outs.json");
export function loadPinned(file = DEFAULT_OPT_OUTS) {
  try { const v = JSON.parse(readFileSync(file, "utf8")); return Array.isArray(v) ? v : []; } catch { return []; }
}
export const DEFAULT_FLEET = join(dirname(fileURLToPath(import.meta.url)), "fleet.json");
const RULING_ID = /^[A-Z][A-Z0-9-]{2,}$/;
const LIVE_USES = /^\s*-?\s*uses:\s*["']?ncmills\/shared-data\/\.github\/workflows\/site-guards\.yml@\S+/m;

export function loadFleet(file = DEFAULT_FLEET): Fleet {
  const f = JSON.parse(readFileSync(file, "utf8")) as Fleet;
  if (!Array.isArray(f.sites) || !Array.isArray(f.excluded)) throw new Error(`${file}: needs sites[] and excluded[]`);
  const banned = f.excluded.map((e) => e.repo.toLowerCase());
  for (const s of f.sites) if (banned.includes(s.repo.toLowerCase())) throw new Error(`${file}: ${s.repo} is both a site and excluded`);
  return f;
}

export const ghFetcher: Fetcher = (repo, path) => {
  try {
    const out = execFileSync("gh", ["api", `repos/${repo}/contents/${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const j = JSON.parse(out);
    if (Array.isArray(j)) return JSON.stringify(j.map((x: { name: string }) => x.name));
    return j.encoding === "base64" ? Buffer.from(j.content, "base64").toString("utf8") : String(j.content ?? "");
  } catch { return null; }
};

export function hasLiveCaller(repo: string, fetch: Fetcher): boolean {
  let names: string[] = ["guards.yml"];
  const dir = fetch(repo, ".github/workflows");
  if (dir) { try { const j = JSON.parse(dir); if (Array.isArray(j)) names = j; } catch { /* not a listing */ } }
  return names.filter((n) => /\.ya?ml$/.test(n)).some((n) => LIVE_USES.test(fetch(repo, `.github/workflows/${n}`) ?? ""));
}

export function prebuildRuns(pkgText: string | null, id: string): boolean {
  let pre = "";
  try { pre = JSON.parse(pkgText ?? "{}")?.scripts?.prebuild ?? ""; } catch { return false; }
  if (!/shared-data\/guards\/run\.ts/.test(pre)) return false;
  const only = pre.match(/--only[ =]([\w,-]+)/);
  return !only || only[1].split(",").includes(id);
}

export function configured(cfg: SiteConfig | undefined, id: string, pinned: { site: string; guard: string; ruling: string; reason: string }[] = loadPinned()): boolean {
  if (!cfg) return false;
  if (cfg.guards?.[id] !== undefined) return true;
  if (id === "shared-data-pin-age" && cfg.sharedData === false) return true;
  // F1 parity with run.ts: an opt-out counts only when pinned in guards/opt-outs.json for this
  // site and guard, with non-empty reasons on both sides. A ruling-shaped string alone is not enough.
  const opt = cfg.optOut?.[id];
  if (!opt || !RULING_ID.test(opt.ruling ?? "")) return false;
  const pin = pinned.find((p) => p.site === cfg.site && p.guard === id && p.ruling === opt.ruling);
  return !!pin && !!String(pin.reason ?? "").trim() && !!String(opt.reason ?? "").trim();
}

export function coverage(fleet: Fleet, fetch: Fetcher = ghFetcher) {
  const banned = new Set(fleet.excluded.map((e) => e.repo.toLowerCase()));
  const per = fleet.sites.filter((s) => !banned.has(s.repo.toLowerCase())).map((s) => {
    const caller = hasLiveCaller(s.repo, fetch);
    const pkg = fetch(s.repo, "package.json");
    let cfg: SiteConfig | undefined;
    try { cfg = JSON.parse(fetch(s.repo, "guards.config.json") ?? ""); } catch { cfg = undefined; }
    return { s, caller, pkg, cfg };
  });
  return GUARD_IDS.map((id) => {
    const inScope = per.filter((p) => !p.s.personal && (!p.s.guards || p.s.guards.includes(id)));
    const missing: string[] = [];
    for (const p of inScope) {
      const why: string[] = [];
      if (!p.caller) why.push("no live uses: line for site-guards.yml");
      if (!prebuildRuns(p.pkg, id)) why.push("no prebuild running shared-data guards/run.ts");
      if (!configured(p.cfg, id)) why.push(p.cfg ? "guard not configured" : "no guards.config.json");
      if (why.length) missing.push(`${p.s.repo} (${why.join("; ")})`);
    }
    return { guard: id, covered: inScope.length - missing.length, total: inScope.length, missing };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--fleet");
  const src = i === -1 ? DEFAULT_FLEET : resolve(args[i + 1]);
  let fleet: Fleet;
  try { fleet = loadFleet(src); } catch (e) { console.log(`COULD-NOT-RUN coverage: fleet ${src} unreadable: ${(e as Error).message}`); process.exit(1); }
  const rows = coverage(fleet);
  if (args.includes("--json")) console.log(JSON.stringify({ fleetSource: src, fleet, rows }, null, 2));
  else {
    console.log(`fleet source: ${src} (${fleet.sites.length} sites; excluded, never read: ${fleet.excluded.map((e) => e.repo).join(", ")})`);
    for (const r of rows) console.log(`${r.covered === r.total ? "GREEN" : "RED  "} ${r.guard}: ${r.covered}/${r.total}${r.missing.length ? ` missing: ${r.missing.join(", ")}` : ""}`);
  }
  process.exit(rows.every((r) => r.covered === r.total) ? 0 : 1);
}
