// overlay-type-allowlist.test.ts — a row tagged for a wizard must be able to REACH it.
//
// Each party overlay applies TWO gates in sequence: the wizard tag
// (`forWizard(a, "bestman")`) and then a hardcoded type allowlist
// (`BESTMAN_ACTIVITY_TYPES.has(a.type)`). The tags are generated from the
// authored data; the allowlists are hand-maintained. So the allowlist lags, and
// when it does the drop is SILENT — the row is tagged, ships in the cache,
// passes every count test, and renders nowhere.
//
// That has now happened twice:
//   2026-07-31  "second-line-parade" — the New Orleans private second line was
//               authored 2026-07-22 as a deliberate BMHQ centerpiece and had
//               NEVER rendered.
//   2026-08-06  "luxe-picnic" (2 rows) + "photoshoot" (1) — all authored
//               `brands: ["both"]` with both bachelor and bachelorette
//               audiences, all already present in MOH_ACTIVITY_TYPES.
//
// Same family as golf-attach.test.ts: the data reaching a consumer's IMPORT is
// not the data reaching a USER. This test closes the gap in the other
// direction — it fails the moment a tag promises a surface the allowlist denies.
import { test } from "node:test";
import assert from "node:assert/strict";

import { sharedDestinations } from "./index";
import { BESTMAN_ACTIVITY_TYPES, MOH_ACTIVITY_TYPES } from "./destinations-overlay";

type Activity = { type: string; name?: string; wizards?: string[] };
type Dest = { city: string; activities?: Activity[] };

/** Rows tagged for `wizard` whose type the overlay allowlist would drop. */
function unreachable(wizard: string, allow: Set<string>) {
  const out: { city: string; type: string; name: string }[] = [];
  for (const d of sharedDestinations as unknown as Dest[]) {
    for (const a of d.activities ?? []) {
      if (a.wizards?.includes(wizard) && !allow.has(a.type)) {
        out.push({ city: d.city, type: a.type, name: a.name ?? "(unnamed)" });
      }
    }
  }
  return out;
}

/** Guard the guard: a typo'd wizard key would make `unreachable` vacuously pass. */
function taggedCount(wizard: string) {
  let n = 0;
  for (const d of sharedDestinations as unknown as Dest[]) {
    for (const a of d.activities ?? []) if (a.wizards?.includes(wizard)) n++;
  }
  return n;
}

for (const [wizard, allow] of [
  ["bestman", BESTMAN_ACTIVITY_TYPES],
  ["moh", MOH_ACTIVITY_TYPES],
] as const) {
  test(`${wizard}: every tagged activity type is in the overlay allowlist`, () => {
    // Denominator first — an empty tagged set must never read as a pass.
    const tagged = taggedCount(wizard);
    assert.ok(
      tagged > 100,
      `only ${tagged} activities tagged "${wizard}" — the tag key is probably wrong, ` +
        `so this test would pass without checking anything`
    );

    const dropped = unreachable(wizard, allow as Set<string>);
    const byType = [...new Set(dropped.map((r) => r.type))].sort();
    assert.deepEqual(
      byType,
      [],
      `${dropped.length} activity row(s) tagged "${wizard}" can never render — their type is ` +
        `missing from the overlay allowlist.\n` +
        `Missing types: ${byType.join(", ")}\n` +
        dropped.map((r) => `  - ${r.city}: ${r.name} (${r.type})`).join("\n") +
        `\n\nFix ONE of the two gates deliberately:\n` +
        `  • the row really is for this wizard → add the type to the allowlist in destinations-overlay.ts\n` +
        `  • it is not                        → fix the tag at its source (tagging-rules.ts / the authored row)\n` +
        `Do not "fix" it by deleting the row.`
    );
  });
}
