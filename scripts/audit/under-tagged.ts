/**
 * under-tagged.ts — audit check #1: rules ↔ backfill CONSISTENCY GUARD.
 *
 * Task 7 (`scripts/backfill-tags.ts`) produced a DERIVED baked view
 * (`backfillUniverse()`) that unions `deriveRouting().core.wizards` onto every
 * row WITHOUT mutating regen-only source data. `postWizards` is the row's
 * materialized/baked `wizards` set; `coreWizards` is what the rules
 * (`deriveRouting`, `src/tagging-rules.ts`) say the row's wizard reach SHOULD
 * include.
 *
 * UNDER-TAGGED = a row in the canonical baked view whose materialized
 * `postWizards` does NOT contain a wizard that the rules say it should carry,
 * i.e. `coreWizards ⊄ postWizards`.
 *
 * On the canonical baked view a FULL run should report ~ZERO — the backfill
 * unions core by construction (`postWizards = union(preWizards, coreWizards)`
 * in `backfill-tags.ts`), so `coreWizards ⊆ postWizards` trivially holds today.
 * That's expected and correct, NOT a bug in this checker.
 *
 * The value of this check is as a CONSISTENCY GUARD, not a discovery tool: if
 * a future rule change (`deriveRouting`) or a backfill bug (e.g. someone edits
 * `push()` in `backfill-tags.ts` to stop unioning correctly) makes core reach
 * exceed what actually got baked, this check catches the drift the next time
 * `npm run audit` runs.
 *
 * NOT in scope here: whether a row is actually *surfaced* to a wizard's engine
 * (dead-tag / orphaned-tag check — that's the next audit task, keyed off
 * `ENGINE_READS`). This check stays scoped to tag-vs-rule consistency.
 *
 * Reuses `deriveRouting` (transitively, via `backfillUniverse()`'s own
 * `coreWizards` field) and the baked-view producer from `backfill-tags.ts` —
 * it does not re-derive any routing logic.
 *
 * Run:  npx tsx scripts/audit/under-tagged.ts
 * Test: npx tsx --test scripts/audit/under-tagged.test.ts
 */

import { fileURLToPath } from "node:url";

import { backfillUniverse, type BackfilledRow } from "../backfill-tags";
import type { EntityKind } from "../../src/tagging-rules";
import type { WizardTag } from "../../src/tags";

export interface UnderTagged {
  itemId: string;
  kind: EntityKind;
  missingWizards: WizardTag[];
}

/**
 * Locals (`moh-local` / `bestman-local`) are brand-scoped and never routed
 * through `deriveRouting` in `backfill-tags.ts` — their `core` is set equal to
 * `pre` directly (single-brand, no cross-tag). They can never go under-tagged
 * by definition, so they're excluded from the `EntityKind`-typed report rather
 * than force-cast into a kind `deriveRouting` never actually assigned them.
 */
const NON_ENTITY_KIND_ROWS = new Set(["moh-local", "bestman-local"]);

/**
 * Core comparison, parameterized on rows so it's independently testable with
 * synthetic/stripped items (see under-tagged.test.ts) without touching the
 * real universe.
 */
export function findUnderTaggedIn(rows: BackfilledRow[]): UnderTagged[] {
  const out: UnderTagged[] = [];
  for (const r of rows) {
    if (NON_ENTITY_KIND_ROWS.has(r.kind as string)) continue;
    const missingWizards = r.coreWizards.filter((w) => !r.postWizards.includes(w));
    if (missingWizards.length > 0) {
      out.push({ itemId: r.id, kind: r.kind as EntityKind, missingWizards });
    }
  }
  return out;
}

/** Full run against the canonical baked universe. */
export function findUnderTagged(): UnderTagged[] {
  return findUnderTaggedIn(backfillUniverse());
}

// ESM "run as script" guard
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const under = findUnderTagged();
  console.log(`under-tagged: ${under.length} row(s) whose baked wizards drift from what the rules say`);
  for (const u of under.slice(0, 40)) {
    console.log(`  ✗ ${u.kind}/${u.itemId}: missing ${JSON.stringify(u.missingWizards)}`);
  }
  if (under.length > 40) console.log(`  ... and ${under.length - 40} more`);
}
