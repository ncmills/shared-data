/**
 * starved-inputs.ts — audit check #3: starved-input enumeration.
 *
 * The complement to `under-tagged.ts` (tag ⟷ rule consistency) and
 * `orphaned.ts` (tag ⟷ engine consistency): this check doesn't look at
 * individual rows at all — it enumerates each wizard's INPUT space (the
 * region/vibe/tier/setting/audience combinations a real user could select,
 * `WIZARD_INPUT_SPACE` in `src/wizard-input-space.ts`) and counts, PER CELL,
 * how many real rows the wizard's engine would actually surface for that
 * combination. A cell under `threshold` is STARVED — a real, reachable user
 * selection that returns too few results to feel like a real product.
 *
 * STARVED = a cell in a wizard's bounded input space whose real matching-row
 * count (counting ONLY rows the wizard's engine actually reads — respecting
 * `ENGINE_READS`, the baked `wizards[]`/`postWizards`, and the brand guards
 * already enforced by `deriveRouting`) is `< threshold` (default 3).
 *
 * This is a DISCOVERY tool, not a consistency guard (unlike Tasks 9/10): it's
 * expected to report real gaps on the current universe, and its output is
 * exactly the expansion queue Task 13 consumes.
 *
 * Reuses `backfillUniverse()` (for wizard eligibility per row — same
 * `postWizards` used by orphaned.ts/under-tagged.ts) and the real source
 * arrays (`sharedDestinations`, `SHARED_GOLF_COURSES` (+HHQ merge),
 * `residencesForSite("offsite")`) for the axis attributes (region, vibe,
 * tier, setting, country) `backfillUniverse()`'s rows don't carry. Does not
 * re-derive any routing/wiring logic.
 *
 * Run:  npx tsx scripts/audit/starved-inputs.ts
 * Test: npx tsx --test scripts/audit/starved-inputs.test.ts
 */

import { fileURLToPath } from "node:url";

import { backfillUniverse, type BackfilledRow } from "../backfill-tags";
import {
  sharedDestinations,
  SHARED_GOLF_COURSES,
  SHARED_GOLF_COURSES_HHQ_MERGE,
  residencesForSite,
} from "../../src/index";
import type { CanonicalDestination } from "../../src/destinations-types";
import type { SharedGolfCourse } from "../../src/golf-courses";
import type { SharedResidence } from "../../src/residences";
import type { WizardTag } from "../../src/tags";
import { WIZARD_INPUT_SPACE, worldRegionForCountry } from "../../src/wizard-input-space";

export interface Starved {
  wizard: WizardTag;
  cell: Record<string, string>;
  count: number;
}

/**
 * Everything `findStarvedIn` needs, bundled so the real run and the test's
 * synthetic run go through the exact same counting logic. `rows` supplies
 * wizard eligibility (`postWizards`); the three source arrays supply the
 * axis attributes (region/vibe/tier/setting/country) that live on the
 * source objects, not on the flattened `BackfilledRow`.
 */
export interface StarvedUniverse {
  rows: BackfilledRow[];
  destinations: CanonicalDestination[];
  golfCourses: SharedGolfCourse[];
  residences: SharedResidence[];
}

/** Same key shape backfill-tags.ts uses for a golf-course row id. */
function golfCourseKey(c: SharedGolfCourse): string {
  return `${c.name}|${c.city},${c.state}`;
}

/** Party-venue row ids are `${destinationId}|${category}|${itemName}` — the
 *  destination id is always the first segment (destination ids are plain
 *  slugs, never containing "|"). */
function destIdOf(rowId: string): string {
  return rowId.split("|")[0];
}

/** Destination ids with ≥1 backfilled party-venue row tagged for `wizard`. */
function eligiblePartyDestIds(rows: BackfilledRow[], wizard: WizardTag): Set<string> {
  const out = new Set<string>();
  for (const r of rows) {
    if (r.dataset !== "party" || r.kind !== "party-venue") continue;
    if (!r.postWizards.includes(wizard)) continue;
    out.add(destIdOf(r.id));
  }
  return out;
}

/** Golf-course keys with a backfilled row tagged for `wizard`. */
function eligibleGolfKeys(rows: BackfilledRow[], wizard: WizardTag): Set<string> {
  const out = new Set<string>();
  for (const r of rows) {
    if (r.dataset !== "golf" || r.kind !== "golf-course") continue;
    if (!r.postWizards.includes(wizard)) continue;
    out.add(r.id);
  }
  return out;
}

/** Residence ids with a backfilled row tagged for `wizard`. */
function eligibleResidenceIds(rows: BackfilledRow[], wizard: WizardTag): Set<string> {
  const out = new Set<string>();
  for (const r of rows) {
    if (r.dataset !== "residence" || r.kind !== "residence") continue;
    if (!r.postWizards.includes(wizard)) continue;
    out.add(r.id);
  }
  return out;
}

/**
 * Core enumerator, parameterized on a `StarvedUniverse` so it's independently
 * testable with a synthetic/stripped universe (see starved-inputs.test.ts)
 * without touching the real data files.
 */
export function findStarvedIn(universe: StarvedUniverse, threshold = 3): Starved[] {
  const { rows, destinations, golfCourses, residences } = universe;
  const out: Starved[] = [];

  const wizards = Object.keys(WIZARD_INPUT_SPACE) as WizardTag[];

  for (const wizard of wizards) {
    const axes = WIZARD_INPUT_SPACE[wizard];
    const [axisA, axisB] = axes;

    if (wizard === "bestman" || wizard === "moh") {
      // region × partyVibe — count = destinations in the region, tagged for
      // this wizard, whose `vibes` include the axis vibe.
      const eligible = eligiblePartyDestIds(rows, wizard);
      for (const region of axisA.values) {
        for (const vibe of axisB.values) {
          const count = destinations.filter(
            (d) => d.region === region && d.vibes.includes(vibe as CanonicalDestination["vibes"][number]) && eligible.has(d.id),
          ).length;
          if (count < threshold) out.push({ wizard, cell: { region, partyVibe: vibe }, count });
        }
      }
    } else if (wizard === "handicap" || wizard === "tdf") {
      // golfRegion × tier — count = golf courses in the region+tier, tagged
      // for this wizard.
      const eligible = eligibleGolfKeys(rows, wizard);
      for (const golfRegion of axisA.values) {
        for (const tier of axisB.values) {
          const count = golfCourses.filter(
            (c) => c.region === golfRegion && c.tier === tier && eligible.has(golfCourseKey(c)),
          ).length;
          if (count < threshold) out.push({ wizard, cell: { golfRegion, tier }, count });
        }
      }
    } else if (wizard === "offsite-retreat") {
      // setting × worldRegion — count = residences matching, tagged for
      // this wizard.
      const eligible = eligibleResidenceIds(rows, wizard);
      for (const setting of axisA.values) {
        for (const worldRegion of axisB.values) {
          const count = residences.filter(
            (res) => res.setting === setting && worldRegionForCountry(res.country) === worldRegion && eligible.has(res.id),
          ).length;
          if (count < threshold) out.push({ wizard, cell: { setting, worldRegion }, count });
        }
      }
    } else {
      // offsite-outing: region × audience — count = corporate-eligible
      // party-venue ROWS (not destinations) in the region, tagged for this
      // wizard, whose audiences include the axis audience. OO's other
      // ENGINE_READS kinds (experience/outing-template/residence/golf-course)
      // carry no structured region field in the shared schema, so this cell
      // is scoped to the one region-keyed kind (see wizard-input-space.ts).
      const destRegion = new Map<string, string>(destinations.map((d) => [d.id, d.region]));
      for (const region of axisA.values) {
        for (const audience of axisB.values) {
          let count = 0;
          for (const r of rows) {
            if (r.dataset !== "party" || r.kind !== "party-venue") continue;
            if (!r.postWizards.includes("offsite-outing")) continue;
            if (!r.audiences.includes(audience as (typeof r.audiences)[number])) continue;
            if (destRegion.get(destIdOf(r.id)) !== region) continue;
            count++;
          }
          if (count < threshold) out.push({ wizard, cell: { region, audience }, count });
        }
      }
    }
  }

  return out;
}

/** Full run against the canonical real universe. */
export function findStarved(threshold = 3): Starved[] {
  return findStarvedIn(
    {
      rows: backfillUniverse(),
      destinations: sharedDestinations,
      golfCourses: [...SHARED_GOLF_COURSES, ...SHARED_GOLF_COURSES_HHQ_MERGE],
      residences: residencesForSite("offsite"),
    },
    threshold,
  );
}

// ESM "run as script" guard
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const threshold = 3;
  const starved = findStarved(threshold);
  const byWizard = new Map<WizardTag, Starved[]>();
  for (const s of starved) {
    if (!byWizard.has(s.wizard)) byWizard.set(s.wizard, []);
    byWizard.get(s.wizard)!.push(s);
  }
  console.log(`starved-inputs: ${starved.length} cell(s) below threshold=${threshold} across ${byWizard.size} wizard(s)`);
  for (const [wizard, cells] of byWizard) {
    console.log(`  ${wizard}: ${cells.length} starved cell(s)`);
    for (const c of cells.slice(0, 40)) {
      console.log(`    ✗ ${JSON.stringify(c.cell)} → ${c.count}`);
    }
    if (cells.length > 40) console.log(`    ... and ${cells.length - 40} more`);
  }
}
