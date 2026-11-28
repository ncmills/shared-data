// guards/run.ts — fleet guard runner (GUARDS-FLEET-WIDE, rulings.md:444).
//
//   node --import tsx guards/run.ts <repoRoot> [--only a,b] [--strict] [--shared-data <dir>]
//
// Reads <repoRoot>/guards.config.json and runs EVERY registered guard. One line per guard:
// PASS / FAIL (reasons) / COULD-NOT-RUN (named reason). A guard missing from the config is
// a FAIL unless optOut[guard].ruling names a CONTROL ruling.
// Exit: 1 on any FAIL; COULD-NOT-RUN alone exits 0 (printed as NOT a pass) unless --strict,
// because a Vercel prebuild has no shared-data clone and must not fail on that alone.
import { readFileSync, appendFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type GuardResult, type SiteConfig, fail } from "./lib.ts";
import { GUARDS, GUARD_IDS } from "./registry.ts";

const RULING_ID = /^[A-Z][A-Z0-9-]{2,}$/; // e.g. GUARDS-FLEET-WIDE

export async function runGuards(repoRoot: string, opts: { only?: string[]; now?: Date; sharedDataDir?: string } = {}) {
  const root = resolve(repoRoot);
  let config: SiteConfig;
  try { config = JSON.parse(readFileSync(join(root, "guards.config.json"), "utf8")); }
  catch (e) {
    return GUARD_IDS.filter((id) => !opts.only || opts.only.includes(id)).map((id) => ({ id, r: fail([`no readable guards.config.json at ${root}: ${(e as Error).message}`]) }));
  }
  const ctx = {
    repoRoot: root, config,
    now: opts.now ?? (process.env.GUARDS_NOW ? new Date(process.env.GUARDS_NOW) : new Date()),
    sharedDataDir: opts.sharedDataDir ?? process.env.SHARED_DATA_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  };
  const out: { id: string; r: GuardResult }[] = [];
  for (const id of GUARD_IDS) {
    if (opts.only && !opts.only.includes(id)) continue;
    const g = config.guards?.[id];
    const opt = config.optOut?.[id];
    const implicit = id === "shared-data-pin-age" && config.sharedData === false;
    if (g === undefined && !implicit) {
      if (opt && RULING_ID.test(opt.ruling ?? "")) out.push({ id, r: { status: "PASS", reasons: [], checked: `OPTED OUT by CONTROL ruling ${opt.ruling}: ${opt.reason ?? "(no reason given)"}` } });
      else out.push({ id, r: fail([opt ? `opt-out has no CONTROL ruling id (got ${JSON.stringify(opt.ruling)})` : `guard ${id} not configured`]) });
      continue;
    }
    try { out.push({ id, r: await GUARDS[id](g ?? {}, ctx) }); }
    catch (e) { out.push({ id, r: fail([`guard crashed: ${(e as Error).message}`]) }); }
  }
  return out;
}

export function format(id: string, r: GuardResult): string {
  const head = `${r.status.padEnd(13)} ${id}`;
  if (r.status === "PASS") return `${head} (${r.checked ?? "ok"})`;
  if (r.status === "COULD-NOT-RUN") return `${head}: ${r.reasons[0]} -- 0 checks executed, NOT a pass`;
  return [`${head}${r.checked ? ` (${r.checked})` : ""}`, ...r.reasons.map((x) => `    - ${x}`)].join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (n: string) => { const i = args.indexOf(n); return i === -1 ? undefined : args.splice(i, 2)[1]; };
  const strict = args.includes("--strict") ? (args.splice(args.indexOf("--strict"), 1), true) : false;
  const only = flag("--only")?.split(",");
  const sharedDataDir = flag("--shared-data");
  const repo = args[0];
  if (!repo) { console.error("usage: node --import tsx guards/run.ts <repoRoot> [--only a,b] [--strict] [--shared-data dir]"); process.exit(2); }
  const results = await runGuards(repo, { only, sharedDataDir });
  const lines = results.map(({ id, r }) => format(id, r));
  console.log(lines.join("\n"));
  const n = (s: string) => results.filter((x) => x.r.status === s).length;
  const summary = `guards: ${n("PASS")} PASS, ${n("FAIL")} FAIL, ${n("COULD-NOT-RUN")} COULD-NOT-RUN of ${results.length}`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Fleet guards\n\n${summary}\n\n\`\`\`\n${lines.join("\n")}\n\`\`\`\n`); } catch { /* summary is best-effort */ }
  }
  process.exit(n("FAIL") || (strict && n("COULD-NOT-RUN")) ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
