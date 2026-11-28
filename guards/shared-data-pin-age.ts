// guards/shared-data-pin-age.ts — class: stale shared-data pin.
// FAIL if the site's shared-data pin is not a 40-hex sha, is not an ancestor of shared-data
// main, or is more than maxDays (default 7) behind by COMMIT DATE OR more than maxCommits
// (default 30) commits behind. "sharedData": false is honoured only when package.json does
// not depend on shared-data (F3). Needs a shared-data git clone with history
// (CI: actions/checkout fetch-depth 0; locally: this repo). Cannot resolve = COULD-NOT-RUN.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Guard, fail, pass, cnr } from "./lib.ts";

export interface PinAgeConfig { maxDays?: number; maxCommits?: number; mainRef?: string }
const SHA40 = /^[0-9a-f]{40}$/;
const DAY = 86_400_000;

const git = (dir: string, ...args: string[]) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

export function readPin(repoRoot: string): { pin?: string; problem?: string } {
  const { pin, problem } = readPinFull(repoRoot); return { pin, problem };
}

function readPinFull(repoRoot: string): { pin?: string; problem?: string; depends?: boolean } {
  let pkg: Record<string, Record<string, string> | undefined>;
  try { pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")); } catch { return { problem: "no readable package.json" }; }
  const spec = pkg.dependencies?.["shared-data"] ?? pkg.devDependencies?.["shared-data"];
  if (!spec) return { problem: 'package.json has no shared-data dependency (declare "sharedData": false if this repo does not consume it)' };
  const i = spec.indexOf("#");
  if (i === -1) return { depends: true, problem: `shared-data dependency is UNPINNED (${spec}): builds are not reproducible` };
  return { depends: true, pin: spec.slice(i + 1) };
}

export const sharedDataPinAge: Guard = async (cfg: PinAgeConfig, ctx) => {
  const max = cfg?.maxDays ?? 7;
  const maxCommits = cfg?.maxCommits ?? 30;
  const { pin, problem, depends } = readPinFull(ctx.repoRoot);
  if (ctx.config.sharedData === false) {
    if (depends) return fail(['"sharedData": false but package.json depends on shared-data: remove the flag or the dependency']);
    return pass('n/a: "sharedData": false (repo does not consume shared-data)');
  }
  if (!pin) return fail([problem!]);
  if (!SHA40.test(pin)) return fail([`shared-data pin "${pin}" is not a 40-hex commit sha (branch/tag/short pins are not reproducible)`]);
  const refs = [process.env.SHARED_DATA_REF, cfg?.mainRef, "origin/main", "HEAD"].filter(Boolean) as string[];
  let mainSha = "", mainRef = "";
  for (const r of refs) { try { mainSha = git(ctx.sharedDataDir, "rev-parse", "--verify", `${r}^{commit}`); mainRef = r; break; } catch { /* next */ } }
  if (!mainSha) return cnr(`no shared-data main ref resolvable in ${ctx.sharedDataDir} (tried ${refs.join(", ")})`);
  let pinSha: string;
  try { pinSha = git(ctx.sharedDataDir, "rev-parse", "--verify", `${pin}^{commit}`); }
  catch { return cnr(`pinned commit ${pin} not found in ${ctx.sharedDataDir} (shallow clone, force-push, or wrong repo)`); }
  if (pinSha === mainSha) return pass(`pin ${pin.slice(0, 12)} == shared-data ${mainRef}`);
  try { execFileSync("git", ["-C", ctx.sharedDataDir, "merge-base", "--is-ancestor", pinSha, mainSha], { stdio: "ignore" }); }
  catch { return fail([`pin ${pin.slice(0, 12)} is not an ancestor of shared-data ${mainRef} ${mainSha.slice(0, 12)} (off-main or force-pushed commit)`]); }
  const pinT = Date.parse(git(ctx.sharedDataDir, "log", "-1", "--format=%cI", pinSha));
  const mainT = Date.parse(git(ctx.sharedDataDir, "log", "-1", "--format=%cI", mainSha));
  const behind = (mainT - pinT) / DAY;
  let count: number;
  try { count = Number(git(ctx.sharedDataDir, "rev-list", "--count", `${pinSha}..${mainSha}`)); }
  catch { return cnr(`could not count commits ${pinSha.slice(0, 12)}..${mainSha.slice(0, 12)} in ${ctx.sharedDataDir}`); }
  const msg = `pin ${pin.slice(0, 12)} is ${behind.toFixed(1)}d / ${count} commit(s) behind shared-data ${mainRef} ${mainSha.slice(0, 12)}`;
  const over = behind > max || count > maxCommits;
  return over ? fail([`${msg} (max ${max}d / max ${maxCommits} commits)`]) : pass(msg);
};
