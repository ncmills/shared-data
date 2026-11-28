// guards/coverage.ts — fleet coverage of the shared guards (for SN fleet-truth).
//
//   node --import tsx guards/coverage.ts [--fleet <file>] [--json]
//
// For each guard: how many fleet repos have BOTH the caller workflow (any
// .github/workflows/*.yml that uses shared-data site-guards.yml) AND that guard configured
// in guards.config.json (or a CONTROL-ruling opt-out). N of total; every repo missing it by
// name. Anything under all = RED. Read-only over local checkouts; exit 1 when any is RED.
//
// Fleet source: shared-data has no whole-fleet site list (consumer-reach.ts lists only
// shared-data CONSUMERS), so the default is the SITES array in
// ~/ops/ctl-in/set-signal-secret.sh (text-parsed, never executed). --fleet <file> overrides
// it with one repo path per line.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GUARD_IDS } from "./registry.ts";
import type { SiteConfig } from "./lib.ts";

export const DEFAULT_FLEET_SOURCE = join(homedir(), "ops/ctl-in/set-signal-secret.sh");
const RULING_ID = /^[A-Z][A-Z0-9-]{2,}$/;

export function parseFleet(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const m = text.match(/^SITES=\(([\s\S]*?)^\)/m);
  const body = m ? m[1] : text; // plain list file: one path per line
  return body.split("\n").map((l) => l.trim().replace(/^"|"$/g, "").split(":")[0].replace(/^\$HOME|^~/, homedir()))
    .filter((l) => l && !l.startsWith("#"));
}

export function hasCaller(repo: string): boolean {
  const dir = join(repo, ".github/workflows");
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some((f) => /\.ya?ml$/.test(f) && /shared-data\/\.github\/workflows\/site-guards\.yml/.test(readFileSync(join(dir, f), "utf8")));
}

export function configured(cfg: SiteConfig | undefined, id: string): boolean {
  if (!cfg) return false;
  if (cfg.guards?.[id] !== undefined) return true;
  if (id === "shared-data-pin-age" && cfg.sharedData === false) return true;
  return RULING_ID.test(cfg.optOut?.[id]?.ruling ?? "");
}

export function coverage(repos: string[]) {
  const per = repos.map((repo) => {
    let cfg: SiteConfig | undefined;
    try { cfg = JSON.parse(readFileSync(join(repo, "guards.config.json"), "utf8")); } catch { cfg = undefined; }
    return { repo, exists: existsSync(repo), caller: hasCaller(repo), cfg };
  });
  return GUARD_IDS.map((id) => {
    const missing = per.filter((p) => !(p.caller && configured(p.cfg, id))).map((p) =>
      `${p.repo.replace(homedir() + "/", "")}${!p.exists ? " (no local checkout)" : !p.caller ? " (no caller workflow)" : !p.cfg ? " (no guards.config.json)" : " (guard not configured)"}`);
    return { guard: id, covered: repos.length - missing.length, total: repos.length, missing };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--fleet");
  const src = i === -1 ? DEFAULT_FLEET_SOURCE : resolve(args[i + 1]);
  let repos: string[];
  try { repos = parseFleet(src); } catch (e) { console.log(`COULD-NOT-RUN coverage: fleet list ${src} unreadable: ${(e as Error).message}`); process.exit(1); }
  const rows = coverage(repos);
  if (args.includes("--json")) console.log(JSON.stringify({ fleetSource: src, repos, rows }, null, 2));
  else {
    console.log(`fleet source: ${src} (${repos.length} repos)`);
    for (const r of rows) console.log(`${r.covered === r.total ? "GREEN" : "RED  "} ${r.guard}: ${r.covered}/${r.total}${r.missing.length ? ` missing: ${r.missing.join(", ")}` : ""}`);
  }
  process.exit(rows.every((r) => r.covered === r.total) ? 0 : 1);
}
