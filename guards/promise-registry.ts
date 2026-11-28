// guards/promise-registry.ts — class: ANY user-facing promise ("delete your data at any time",
// "full refund") that is not registered with a test, runbook or reason.
// SN's guard (site-guards claims.js, GUARDS-ARE-SN): Babel finder over JSX/TS/MD copy +
// the claims.yml registry. Config: guards.config.json guards["promise-registry"] =
//   { roots?: string[] (default src, app, components, content, pages, lib, public),
//     registry?: string (default guards/claims.yml) }
// Faults: UNREGISTERED, ORPHAN, NO_TEST/TEST_MISSING, NO_RUNBOOK/MANUAL_STALE, NO_REASON,
// NOT_A_PROMISE_ON_LEGAL_PAGE, UNPARSEABLE (a file the finder cannot read never passes).
import { type Guard, fail, pass, cap } from "./lib.ts";
// @ts-ignore -- plain JS port
import { runClaims, copyFiles } from "./sn/claims.js";

export const promiseRegistry: Guard = async (cfg: any, ctx) => {
  const roots = Array.isArray(cfg?.roots) ? cfg.roots : undefined;
  const files = (copyFiles(ctx.repoRoot, roots) as string[]).length;
  if (files === 0) return fail([`roots ${JSON.stringify(roots ?? "default")} match 0 copy files: nothing would be checked`]);
  const { hits, faults } = runClaims({ root: ctx.repoRoot, now: ctx.now, settings: cfg ?? {} }) as { hits: unknown[]; faults: string[] };
  const checked = `${files} copy file(s), ${hits.length} promise sentence(s)`;
  return faults.length ? fail(cap(faults, 12), checked) : pass(checked);
};
