/**
 * orphaned.ts — audit check #2: orphaned-cite (dead/cosmetic tag) check.
 *
 * Task 9 (`under-tagged.ts`) guards TAG ⟷ RULE consistency (does the baked
 * `wizards[]` match what `deriveRouting` says it should). This check is the
 * complementary TAG ⟷ ENGINE consistency guard: even a rule-consistent tag is
 * cosmetic — dead — if the tagged wizard's engine never actually reads the
 * row's `EntityKind`. `ENGINE_READS` (`src/engine-reads.ts`) is the ground
 * truth for "what does each wizard's engine actually consume," sourced from
 * the Phase-1 wiring audit + verification against the live consuming repos.
 *
 * ORPHANED = a row in the canonical baked view (`backfillUniverse()`) whose
 * materialized `postWizards` includes a wizard `w` such that
 * `ENGINE_READS[w]` does NOT include the row's `kind`.
 *
 * Self-consistency: core reach is DEFINED as "reachability engines already
 * honor" (`tagging-rules.ts`), so every `(kind, coreWizard)` pair
 * `deriveRouting` produces MUST be covered by `ENGINE_READS[coreWizard]` — a
 * full run over the BAKED CORE tags (substituting `coreWizards` for
 * `postWizards`) should report ~ZERO. See `orphaned.test.ts`'s CROSS-CHECK
 * test. (This is exactly what surfaced that the initial ENGINE_READS draft
 * omitted `golf-course` for `offsite-retreat` / `offsite-outing` — corrected
 * in `src/engine-reads.ts` after verifying both engines actually read golf
 * courses in `offsite-outpost/src/lib/engine/generate.ts`.)
 *
 * Locals (`moh-local` / `bestman-local`) are brand-scoped, never routed
 * through `deriveRouting`, and aren't real `EntityKind` values — excluded
 * here the same way `under-tagged.ts` excludes them (Task 9 precedent),
 * rather than force-fit them into `ENGINE_READS`.
 *
 * Reuses `backfillUniverse()` (and, transitively, `deriveRouting`) — does not
 * re-derive any routing or wiring logic.
 *
 * Run:  npx tsx scripts/audit/orphaned.ts
 * Test: npx tsx --test scripts/audit/orphaned.test.ts
 */

import { fileURLToPath } from "node:url";

import { backfillUniverse, type BackfilledRow } from "../backfill-tags";
import type { EntityKind } from "../../src/tagging-rules";
import type { WizardTag } from "../../src/tags";
import { ENGINE_READS } from "../../src/engine-reads";

export { ENGINE_READS };

export interface Orphaned {
  itemId: string;
  kind: EntityKind;
  wizard: WizardTag;
}

/** See under-tagged.ts's NON_ENTITY_KIND_ROWS — same locals-exclusion precedent. */
const NON_ENTITY_KIND_ROWS = new Set(["moh-local", "bestman-local"]);

/**
 * Core comparison, parameterized on rows so it's independently testable with
 * synthetic/stripped items (see orphaned.test.ts) without touching the real
 * universe. Also reused by the test's CROSS-CHECK (substituting `coreWizards`
 * for `postWizards` on the real rows).
 */
export function findOrphanedIn(rows: BackfilledRow[]): Orphaned[] {
  const out: Orphaned[] = [];
  for (const r of rows) {
    if (NON_ENTITY_KIND_ROWS.has(r.kind as string)) continue;
    const kind = r.kind as EntityKind;
    for (const wizard of r.postWizards) {
      const reads = ENGINE_READS[wizard] ?? [];
      if (!reads.includes(kind)) {
        out.push({ itemId: r.id, kind, wizard });
      }
    }
  }
  return out;
}

/** Full run against the canonical baked universe. */
export function findOrphaned(): Orphaned[] {
  return findOrphanedIn(backfillUniverse());
}

// ESM "run as script" guard
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const orphaned = findOrphaned();
  console.log(`orphaned: ${orphaned.length} row(s) tagged for a wizard whose engine never reads that kind (dead cite)`);
  for (const o of orphaned.slice(0, 40)) {
    console.log(`  ✗ ${o.kind}/${o.itemId} → ${o.wizard}`);
  }
  if (orphaned.length > 40) console.log(`  ... and ${orphaned.length - 40} more`);
}
