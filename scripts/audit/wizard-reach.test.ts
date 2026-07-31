// wizard-reach.test.ts — the two-directional guard the audit was missing.
//
// The existing checks cover three of the four quadrants:
//   under-tagged.ts  — tag ⟷ rule consistency
//   orphaned.ts      — TAGGED but the engine never reads that kind
//   starved-inputs.ts— a reachable user selection with too few rows
//
// The missing quadrant is the inverse of `orphaned`: a kind an engine DECLARES
// it reads for which ZERO rows are tagged. That reads as "no findings," which
// is indistinguishable from full coverage — it is how `offsite-retreat` came to
// declare a read of `outing-template` that no row could ever satisfy
// (verify-universe asserts outings are `["offsite-outing"]` exactly).
//
// The second half guards PRECISION — "each wizard pulls ONLY its data" — by
// asserting each overlay emits nothing that isn't tagged for that wizard, in
// EVERY category. Note `lodging`/`transport` are deliberately passed through
// unfiltered by the party overlays (they're cross-tagged via HOUSING_WIZARDS),
// so nothing was checking them; this makes that safe-by-assertion rather than
// safe-by-coincidence.
import { test } from "node:test";
import assert from "node:assert/strict";

import { backfillUniverse } from "../backfill-tags";
import { ENGINE_READS } from "../../src/engine-reads";
import { ALL_WIZARD_TAGS, type WizardTag } from "../../src/tags";
import type { CanonicalDestination } from "../../src/destinations-types";
import {
  sharedDestinations,
  applyMohOverlay,
  applyBestmanOverlay,
  applyOutpostOverlay,
} from "../../src/index";

const ITEM_CATS = ["nightlife", "dining", "activities", "lodging", "transport"] as const;

interface TaggedItem {
  name: string;
  wizards?: string[];
}

test("COMPLETENESS: every kind an engine declares it reads has at least one tagged row", () => {
  const rows = backfillUniverse();
  const tagged = new Set<string>();
  for (const r of rows) for (const w of r.postWizards) tagged.add(`${w}::${r.kind}`);

  const empty: string[] = [];
  for (const wizard of ALL_WIZARD_TAGS) {
    for (const kind of ENGINE_READS[wizard]) {
      if (!tagged.has(`${wizard}::${kind}`)) empty.push(`${wizard} declares it reads "${kind}" but 0 rows are tagged`);
    }
  }
  assert.deepEqual(
    empty,
    [],
    `ENGINE_READS declares reads that no row can satisfy. Either the declaration is wrong ` +
      `(remove the kind) or the data is untagged (tag it) — a declared-but-empty read reports ` +
      `zero findings, which looks exactly like full coverage:\n  ${empty.join("\n  ")}`,
  );
});

test("PRECISION: each party/corporate overlay emits ONLY items tagged for that wizard", () => {
  const overlays: [WizardTag, (d: CanonicalDestination) => unknown][] = [
    ["moh", applyMohOverlay],
    ["bestman", applyBestmanOverlay],
    ["offsite-outing", applyOutpostOverlay],
  ];

  for (const [wizard, overlay] of overlays) {
    const leaks: string[] = [];
    for (const dest of sharedDestinations) {
      const out = overlay(dest) as Record<string, TaggedItem[] | undefined>;
      for (const cat of ITEM_CATS) {
        const emitted = out[cat];
        if (!emitted) continue;
        // Look the emitted item back up in the canonical destination to read the
        // tags the overlay stripped off on the way out.
        const canonical = new Map<string, TaggedItem>(
          (((dest as unknown as Record<string, TaggedItem[]>)[cat] ?? []) as TaggedItem[]).map((i) => [i.name, i]),
        );
        for (const item of emitted) {
          const src = canonical.get(item.name);
          if (src && !(src.wizards ?? []).includes(wizard)) {
            leaks.push(`${wizard} overlay emitted ${dest.id}/${cat}/${item.name} (tagged: ${JSON.stringify(src.wizards ?? [])})`);
          }
        }
      }
    }
    assert.deepEqual(
      leaks.slice(0, 10),
      [],
      `${wizard}'s overlay emitted ${leaks.length} item(s) NOT tagged for it — the overlay must be a pure tag filter:\n  ${leaks.slice(0, 10).join("\n  ")}`,
    );
  }
});

test("PRECISION: the corporate overlay emits only corporate-audience items in every filtered category", () => {
  // Companion to verify-universe's leak check, kept here so the overlay's own
  // contract is asserted by the test suite too. `dining` was unfiltered until
  // 2026-07-31 and passed only because every dining row happened to be
  // corporate-tagged.
  const leaks: string[] = [];
  for (const dest of sharedDestinations) {
    const oo = applyOutpostOverlay(dest) as Record<string, { name: string; audiences?: string[] }[] | undefined>;
    for (const cat of ["activities", "nightlife", "dining"] as const) {
      for (const item of oo[cat] ?? []) {
        if (!(item.audiences ?? []).includes("corporate")) {
          leaks.push(`${dest.id}/${cat}/${item.name}`);
        }
      }
    }
  }
  assert.deepEqual(leaks.slice(0, 10), [], `corporate overlay leaked ${leaks.length} non-corporate item(s)`);
});
