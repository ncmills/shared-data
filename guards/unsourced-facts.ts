// guards/unsourced-facts.ts — class: ANY unsourced or stale fact in a site's data files.
// SN's guard (site-guards facts.js, GUARDS-ARE-SN), ported into the fleet layer, not rewritten.
// Config: guards.config.json guards["unsourced-facts"] =
//   { datasets: [{ file, row_path, max_age_days, kind? }], exempt: [{ file, reason }],
//     policy?: { forbid: [{ match, reason, source }] } }
// Faults: NO_SOURCE, STALE / NO_DATE (researched_on), UNLISTED (class-glob discovery of
// data/**/*.json, src/data/**, lib/*.json, lib/*.ts catalogs, src/lib/*{data,config,...}*),
// EXEMPT_NO_REASON, FORBIDDEN (policy.forbid), UNMEASURED (rows are read from JSON only).
import { type Guard, fail, pass, cap } from "./lib.ts";
// @ts-ignore -- plain JS port
import { runFacts, classFiles } from "./sn/facts.js";

export const unsourcedFacts: Guard = async (cfg: any, ctx) => {
  const { faults } = runFacts({ root: ctx.repoRoot, now: ctx.now, manifest: cfg }) as { faults: string[] };
  const n = (cfg?.datasets ?? []).length;
  const discovered = (classFiles(ctx.repoRoot) as string[]).length;
  const checked = `${n} dataset(s), ${discovered} class-glob data file(s)`;
  if (!faults.length && n === 0 && discovered === 0) return pass(`n/a: no data files in the class glob (${checked})`);
  return faults.length ? fail(cap(faults, 12), checked) : pass(checked);
};
