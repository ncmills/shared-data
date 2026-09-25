/**
 * locals-views.ts — derive the MOH / Best Man "locals" copies from the
 * canonical catalog (CORPUS-M3a, 2026-09-24).
 *
 * The locals were full copies of 50 (MOH) and 91 (Best Man) destinations with
 * 4,676 nested rows and no url or provenance. Most of those rows ARE canonical
 * rows of `sharedDestinations` with a brand-specific highlight or flag. Each
 * nested row is now stored one of two ways:
 *
 *   1. a reference `{"ref": "<canonical row id>", "set"?, "omit"?, "keys"?}`
 *      (src/row-views.ts) — when a canonical row in the SAME destination and
 *      category has the same name (exact, else the same id slug). Where the copy
 *      and the canonical row disagree, the COPY's value is kept in `set`: the
 *      site renders the locals row as-is, so its value is the one users see.
 *   2. a full row, for a venue with no canonical match (a local-only venue, or
 *      a second copy of a venue already referenced in the same array). Its id
 *      is computed like any other (src/row-ids.ts), disambiguated `-2`, `-3`…
 *      against the ids already used in that array.
 *
 * Each nested array has a fixed field list (`*_LOCALS_VIEW_ORDER`) taken from
 * what the copies carried. `url` / `sourceUrl` / `citations` are deliberately
 * NOT in it: the locals have never exposed canonical provenance, and turning
 * that on is a product decision for a site, not a side effect of this refactor.
 * Every other field a reference does not override follows the canonical row.
 */
import type { CanonicalDestination } from "./destinations-types";
import { assignIds, partyRowIdBase, ROW_ARRAY_KEYS, ROW_CATEGORY_OF_ARRAY, type RowArrayKey } from "./row-ids";
import { deriveRow, isRowRef, resolveRef } from "./row-views";

type Row = Record<string, unknown> & { id?: string; aliases?: string[]; name?: string };

/** `${destId}|${arrayKey}` → (id and alias → canonical row) */
function indexCanonical(dests: readonly CanonicalDestination[]): Map<string, Map<string, Row>> {
  const out = new Map<string, Map<string, Row>>();
  for (const d of dests) {
    for (const arr of ROW_ARRAY_KEYS) {
      const m = new Map<string, Row>();
      for (const r of (d[arr] as unknown as Row[]) ?? []) {
        if (r.id) m.set(r.id, r);
        for (const a of r.aliases ?? []) m.set(a, r);
      }
      out.set(`${d.id}|${arr}`, m);
    }
  }
  return out;
}

export function deriveLocals(
  source: readonly Record<string, unknown>[],
  viewOrder: Record<string, readonly string[]>,
  canonical: readonly CanonicalDestination[],
  label: string,
): Record<string, unknown>[] {
  const index = indexCanonical(canonical);
  const empty = new Map<string, Row>();
  return source.map((dest) => {
    const destId = dest.id as string;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dest)) {
      if (!(ROW_ARRAY_KEYS as string[]).includes(key) || !Array.isArray(value)) {
        out[key] = value;
        continue;
      }
      const arr = key as RowArrayKey;
      const order = viewOrder[arr];
      if (!order) throw new Error(`${label}: no view order for "${arr}"`);
      const canon = index.get(`${destId}|${arr}`) ?? empty;
      const rows = value as Row[];
      const taken = new Set<string>();
      for (const r of rows) if (isRowRef(r)) taken.add(r.ref);
      const localOnly = rows.filter((r) => !isRowRef(r));
      const ids = assignIds(
        localOnly,
        (r) => partyRowIdBase(destId, ROW_CATEGORY_OF_ARRAY[arr], String(r.name)),
        taken,
      );
      let n = 0;
      out[key] = rows.map((r) => {
        if (isRowRef(r)) return deriveRow(r, resolveRef(canon, r.ref, `${label} ${destId}/${arr}`), order);
        return { id: ids[n++], ...r };
      });
    }
    return out;
  });
}
