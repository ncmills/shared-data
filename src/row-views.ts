/**
 * row-views.ts — a COPY of a canonical row, stored as a reference (CORPUS-M3a).
 *
 * The MOH and Best Man locals and the golf-destination `courses[]` used to hold
 * full copies of rows that already exist canonically (party venues in
 * `sharedDestinations`, courses in `golf-courses.ts`). They are now stored as
 *
 *     { "ref": "<canonical id>", "set"?: {…}, "omit"?: […], "keys"?: […] }
 *
 * and the row a consumer reads is DERIVED here at module load:
 *
 *   - start from the canonical row, but only the fields in the view's `order`
 *     (a view's field list is fixed, so a field later added to the canonical
 *     row — `checkedAt`, tags — does NOT leak into a brand copy; the locals
 *     views also leave out `url`/`sourceUrl`/`citations`, see moh-locals.ts);
 *   - `set`  — values this copy holds that differ from canonical. The copy's
 *              value wins, because it is the one the site has always rendered
 *              (brand-specific `highlight`, `bacheloretteFriendly`, …);
 *   - `omit` — view fields the canonical row has and this copy never did;
 *   - `keys` — explicit key order, only for the few rows whose original order
 *              the view's `order` cannot reproduce;
 *   - `id` (and `aliases`, if the canonical row has any) are put first.
 *
 * What changes with a reference: an edit to a canonical field this copy does
 * NOT override now reaches the copy too. That is the point of collapsing it.
 *
 * Values are cloned, so a consumer that mutates a derived row cannot reach
 * back into the canonical row (they were separate objects before this).
 */

export interface RowRef {
  ref: string;
  set?: Record<string, unknown>;
  omit?: string[];
  keys?: string[];
}

export function isRowRef(row: unknown): row is RowRef {
  return !!row && typeof row === "object" && typeof (row as RowRef).ref === "string";
}

const clone = <T>(v: T): T => (v !== null && typeof v === "object" ? structuredClone(v) : v);

export function deriveRow(
  ref: RowRef,
  canonicalRow: { id?: string; aliases?: string[] },
  order: readonly string[],
): Record<string, unknown> {
  const canonical = canonicalRow as { id?: string; aliases?: string[] } & Record<string, unknown>;
  const set = ref.set ?? {};
  const omit = new Set(ref.omit ?? []);
  const allowed = new Set(order);
  const keys = ref.keys ?? [
    ...order.filter((k) => k in set || (k in canonical && !omit.has(k))),
    // a `set` field outside the view's list (e.g. a copy's own `url`) comes last
    ...Object.keys(set).filter((k) => !allowed.has(k)),
  ];
  const out: Record<string, unknown> = { id: canonical.id };
  if (canonical.aliases?.length) out.aliases = [...canonical.aliases];
  for (const k of keys) out[k] = clone(k in set ? set[k] : canonical[k]);
  return out;
}

/** Resolve `ref` through an id+alias index; a miss names the fix. */
export function resolveRef<T>(index: ReadonlyMap<string, T>, ref: string, where: string): T {
  const hit = index.get(ref);
  if (!hit) {
    throw new Error(
      `${where}: reference "${ref}" resolves to no canonical row. If the row was renamed, ` +
        `add aliases: ["${ref}"] to it (src/row-ids.ts).`,
    );
  }
  return hit;
}
