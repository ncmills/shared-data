/**
 * scope.ts — which rows a CORPUS-M5 scoring run covers (DRV ruling on R1 F4).
 *
 * Score only the rows whose visibility changes once a site reads suitability/<site>.json
 * instead of its legacy tag (M7). The rest stay `unreviewed`. Derived from how each site
 * filters today:
 *   - MOH and BMHQ show a nested party row only when its baked `wizards` includes the
 *     site's wizard (src/destinations-overlay.ts:98 `forWizard`, applied to all five party
 *     categories by applyMohOverlay / applyBestmanOverlay), plus the activity-type
 *     allowlist and MOH's international drop — both already hard-exclude rules.
 *   - So a row changes visibility at M7 exactly when the rules leave it for scoring
 *     (eligible ≠ "no") and today's tag withholds it (D2 in the M4 G-diff, wizards axis).
 *     Rows the rules mark "no" that the tag shows today (D1) change too, but a rule
 *     decides them — they are never scored.
 *   - Golf courses: MOH never shows them (moh-golf marks every course "no"). BMHQ reads
 *     them through coursesForCity with no tag filter (plan-my-party src/data/query.ts:200-202,
 *     gated only by GOLF_FITS_BESTMAN), so their visibility does not change: out of scope.
 */
import { buildSuitability } from "./suitability.ts";
import { factsRows, type FactsRow } from "./facts.ts";

const WIZARD: Record<string, string> = { moh: "moh", bestman: "bestman" };

export function inScope(site: string, row: FactsRow, eligible: string): boolean {
  if (!WIZARD[site]) throw new Error(`scope: no wizard for site ${site}`);
  if (eligible === "no") return false;
  if (row.kind === "golf-course") return false;
  return !(row.legacy.wizards ?? []).includes(WIZARD[site]);
}

export function scopeIds(site: string): string[] {
  const facts = new Map(factsRows().map((r) => [r.id, r]));
  return buildSuitability(site)
    .rows.filter((r) => inScope(site, facts.get(r.id)!, r.eligible))
    .map((r) => r.id);
}
