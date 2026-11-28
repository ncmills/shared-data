// guards/shared-data-pin-age.ts — class: stale shared-data pin.
// FAIL if the site's shared-data pin is more than maxDays (default 7) behind
// shared-data main by COMMIT DATE. Needs a shared-data git clone with history
// (CI: actions/checkout fetch-depth 0; locally: this repo). Cannot resolve = COULD-NOT-RUN.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Guard, fail, pass, cnr } from "./lib.ts";

export interface PinAgeConfig { maxDays?: number; mainRef?: string }
const DAY = 86_400_000;

const git = (dir: string, ...args: string[]) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

export function readPin(repoRoot: string): { pin?: string; problem?: string } {
  let pkg: Record<string, Record<string, string> | undefined>;
  try { pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")); } catch { return { problem: "no readable package.json" }; }
  const spec = pkg.dependencies?.["shared-data"] ?? pkg.devDependencies?.["shared-data"];
  if (!spec) return { problem: 'package.json has no shared-data dependency (declare "sharedData": false if this repo does not consume it)' };
  const i = spec.indexOf("#");
  if (i === -1) return { problem: `shared-data dependency is UNPINNED (${spec}): builds are not reproducible` };
  return { pin: spec.slice(i + 1) };
}

export const sharedDataPinAge: Guard = async (cfg: PinAgeConfig, ctx) => {
  if (ctx.config.sharedData === false) return pass('n/a: "sharedData": false (repo does not consume shared-data)');
  const max = cfg?.maxDays ?? 7;
  const { pin, problem } = readPin(ctx.repoRoot);
  if (!pin) return fail([problem!]);
  const refs = [process.env.SHARED_DATA_REF, cfg?.mainRef, "origin/main", "HEAD"].filter(Boolean) as string[];
  let mainSha = "", mainRef = "";
  for (const r of refs) { try { mainSha = git(ctx.sharedDataDir, "rev-parse", "--verify", `${r}^{commit}`); mainRef = r; break; } catch { /* next */ } }
  if (!mainSha) return cnr(`no shared-data main ref resolvable in ${ctx.sharedDataDir} (tried ${refs.join(", ")})`);
  let pinSha: string;
  try { pinSha = git(ctx.sharedDataDir, "rev-parse", "--verify", `${pin}^{commit}`); }
  catch { return cnr(`pinned commit ${pin} not found in ${ctx.sharedDataDir} (shallow clone, force-push, or wrong repo)`); }
  if (pinSha === mainSha) return pass(`pin ${pin.slice(0, 12)} == shared-data ${mainRef}`);
  const pinT = Date.parse(git(ctx.sharedDataDir, "log", "-1", "--format=%cI", pinSha));
  const mainT = Date.parse(git(ctx.sharedDataDir, "log", "-1", "--format=%cI", mainSha));
  const behind = (mainT - pinT) / DAY;
  let count = "?";
  try { count = git(ctx.sharedDataDir, "rev-list", "--count", `${pinSha}..${mainSha}`); } catch { /* keep ? */ }
  const msg = `pin ${pin.slice(0, 12)} is ${behind.toFixed(1)}d / ${count} commit(s) behind shared-data ${mainRef} ${mainSha.slice(0, 12)}`;
  return behind > max ? fail([`${msg} (max ${max}d)`]) : pass(msg);
};
