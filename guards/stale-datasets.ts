// guards/stale-datasets.ts — class: ANY stale dataset (judges, offices, rosters, prices...).
// Every row of every configured dataset must carry a researched-on / as-of date no older
// than that dataset's maxAgeDays. Missing or unparseable date = FAIL.
// Today's fault (2026-11-27): idonthaveawill had 47 rows researched 2026-03-24.
import { type Guard, type DataSource, fail, pass, loadRows, getPath, label, cap } from "./lib.ts";

export interface Dataset extends DataSource { dateField?: string; maxAgeDays: number; idField?: string }
export interface StaleDatasetsConfig { datasets?: Dataset[] }
const DAY = 86_400_000;

export const staleDatasets: Guard = async (cfg: StaleDatasetsConfig, ctx) => {
  if (!cfg.datasets?.length) return fail(["config names no datasets: nothing would be checked"]);
  const reasons: string[] = [];
  let total = 0;
  for (const ds of cfg.datasets) {
    const field = ds.dateField ?? "researchedOn";
    if (!(ds.maxAgeDays > 0)) { reasons.push(`${label(ds)}: maxAgeDays missing or not positive`); continue; }
    let rows: unknown[];
    try { rows = await loadRows(ctx.repoRoot, ds); } catch (e) { reasons.push(`could not load ${label(ds)}: ${(e as Error).message}`); continue; }
    if (!rows.length) { reasons.push(`${label(ds)}: 0 rows (an empty dataset is not a fresh one)`); continue; }
    const missing: string[] = [];
    const old = new Map<string, number>(); // date -> count
    rows.forEach((r, i) => {
      total++;
      const id = String(getPath(r, ds.idField ?? "id") ?? `#${i}`);
      const raw = getPath(r, field);
      const t = typeof raw === "string" || typeof raw === "number" ? Date.parse(String(raw)) : NaN;
      if (Number.isNaN(t)) { missing.push(id); return; }
      if ((ctx.now.getTime() - t) / DAY > ds.maxAgeDays) old.set(String(raw), (old.get(String(raw)) ?? 0) + 1);
    });
    if (missing.length) reasons.push(`${label(ds)}: ${missing.length} row(s) with no valid ${field}: ${cap(missing, 5).join(", ")}`);
    if (old.size) {
      const n = [...old.values()].reduce((a, b) => a + b, 0);
      const dates = [...old.keys()].sort();
      reasons.push(`${label(ds)}: ${n} row(s) older than ${ds.maxAgeDays}d (oldest ${dates[0]}; ${cap(dates.map((d) => `${d} x${old.get(d)}`), 4).join(", ")})`);
    }
  }
  return reasons.length ? fail(reasons, `${total} rows`) : pass(`${total} rows in ${cfg.datasets.length} dataset(s)`);
};
