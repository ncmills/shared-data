/**
 * row-identity-check.ts — the row-identity invariants (CORPUS-M3a), as a pure
 * function so a test can plant a violation and watch it go red.
 * `scripts/verify-universe.ts` runs it over the real universe.
 *
 *   1. every row has an id (canonical party rows, golf courses, every row of
 *      every derived view: MOH / Best Man locals, embedded golf courses)
 *   2. 0 duplicate ids: canonical rows are unique across the whole set; a view's
 *      rows are unique within their destination + array
 *   3. every alias resolves: it is claimed by exactly one row and is not also
 *      some row's id
 *   4. every override key resolves to a row (by id, then alias), except keys
 *      listed as known-dead with a reason
 */
import { legacyKeyToId } from "./row-ids";

export interface IdRow {
  id?: string;
  aliases?: string[];
  name?: string;
}

export interface RowSet {
  label: string;
  /** Rows whose ids must be unique across the whole set. */
  rows: readonly IdRow[];
}

export interface ViewGroup {
  label: string;
  /** Rows whose ids must be unique within this group (one destination array). */
  rows: readonly IdRow[];
}

export interface RowIdentityInput {
  canonical: RowSet[];
  views: ViewGroup[];
  overrideKeys: string[];
  /** Override key → why it may resolve to nothing. */
  knownDeadOverrideKeys: Record<string, string>;
  /** Which canonical set the override keys resolve against. */
  overrideSetLabel: string;
}

export interface RowIdentityResult {
  violations: string[];
  counts: Record<string, number>;
}

export function checkRowIdentity(input: RowIdentityInput): RowIdentityResult {
  const violations: string[] = [];
  const counts: Record<string, number> = {};
  const resolvers = new Map<string, Map<string, IdRow>>();

  for (const set of input.canonical) {
    const ids = new Map<string, IdRow>();
    let missing = 0;
    for (const r of set.rows) {
      if (!r.id) {
        missing++;
        violations.push(`${set.label}: row "${r.name ?? "?"}" has no id`);
        continue;
      }
      if (ids.has(r.id)) violations.push(`${set.label}: duplicate id "${r.id}"`);
      ids.set(r.id, r);
    }
    const byKey = new Map(ids);
    const aliasOwner = new Map<string, IdRow>();
    let aliases = 0;
    for (const r of set.rows) {
      for (const a of r.aliases ?? []) {
        aliases++;
        if (ids.has(a)) violations.push(`${set.label}: alias "${a}" (on "${r.id}") is also a row id`);
        else if (aliasOwner.has(a) && aliasOwner.get(a) !== r)
          violations.push(`${set.label}: alias "${a}" is claimed by two rows`);
        else {
          aliasOwner.set(a, r);
          byKey.set(a, r);
        }
      }
    }
    resolvers.set(set.label, byKey);
    counts[`${set.label}.rows`] = set.rows.length;
    counts[`${set.label}.withoutId`] = missing;
    counts[`${set.label}.aliases`] = aliases;
    // collisions resolved by `-N` (reported, not a violation: see row-ids.ts)
    counts[`${set.label}.disambiguated`] = [...ids.keys()].filter((id) => {
      const m = id.match(/^(.*)-(\d+)$/);
      return !!m && Number(m[2]) >= 2 && ids.has(m[1]);
    }).length;
  }

  let viewRows = 0;
  for (const g of input.views) {
    const seen = new Set<string>();
    for (const r of g.rows) {
      viewRows++;
      if (!r.id) violations.push(`${g.label}: row "${r.name ?? "?"}" has no id`);
      else if (seen.has(r.id)) violations.push(`${g.label}: duplicate id "${r.id}"`);
      else seen.add(r.id);
    }
  }
  counts["views.rows"] = viewRows;

  const resolve = resolvers.get(input.overrideSetLabel);
  if (!resolve) violations.push(`override set "${input.overrideSetLabel}" is not a canonical set`);
  let applied = 0;
  for (const key of input.overrideKeys) {
    if (resolve?.has(legacyKeyToId(key))) applied++;
    else if (!(key in input.knownDeadOverrideKeys))
      violations.push(`override "${key}" resolves to no row (by id or alias)`);
  }
  for (const key of Object.keys(input.knownDeadOverrideKeys))
    if (resolve?.has(legacyKeyToId(key)))
      violations.push(`override "${key}" is listed known-dead but resolves again — take it off the list`);
  counts["overrides.resolved"] = applied;
  counts["overrides.knownDead"] = Object.keys(input.knownDeadOverrideKeys).length;

  return { violations, counts };
}
