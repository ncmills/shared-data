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
  residencesForSite,
} from "../../src/index";
import type { CanonicalDestination } from "../../src/destinations-types";
import type { SharedGolfCourse } from "../../src/golf-courses";
import type { SharedResidence } from "../../src/residences";
import { ALL_WIZARD_TAGS, type WizardTag } from "../../src/tags";
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
 * How one wizard's cells are counted. A factory (rather than a plain
 * per-cell function) so the per-wizard eligibility set is computed ONCE and
 * reused across that wizard's whole cross product, exactly as the original
 * loop did.
 *
 * Every counter takes the `wizard` it is counting FOR and must use it — none
 * may close over a hardcoded wizard name (see `STARVED_CELL_COUNTERS`).
 */
type CellCounterFactory = (
  universe: StarvedUniverse,
  wizard: WizardTag,
) => (axisAValue: string, axisBValue: string) => number;

/** region × partyVibe — destinations in the region, tagged for this wizard,
 *  whose `vibes` include the axis vibe. */
const countPartyDestinations: CellCounterFactory = ({ rows, destinations }, wizard) => {
  const eligible = eligiblePartyDestIds(rows, wizard);
  return (region, vibe) =>
    destinations.filter(
      (d) =>
        d.region === region &&
        d.vibes.includes(vibe as CanonicalDestination["vibes"][number]) &&
        eligible.has(d.id),
    ).length;
};

/** golfRegion × tier — golf courses in the region+tier, tagged for this wizard. */
const countGolfCourses: CellCounterFactory = ({ rows, golfCourses }, wizard) => {
  const eligible = eligibleGolfKeys(rows, wizard);
  return (golfRegion, tier) =>
    golfCourses.filter(
      (c) => c.region === golfRegion && c.tier === tier && eligible.has(golfCourseKey(c)),
    ).length;
};

/** setting × worldRegion — residences matching, tagged for this wizard. */
const countResidences: CellCounterFactory = ({ rows, residences }, wizard) => {
  const eligible = eligibleResidenceIds(rows, wizard);
  return (setting, worldRegion) =>
    residences.filter(
      (res) =>
        res.setting === setting &&
        worldRegionForCountry(res.country) === worldRegion &&
        eligible.has(res.id),
    ).length;
};

/**
 * region × audience — corporate-eligible party-venue ROWS (not destinations)
 * in the region, tagged for this wizard, whose audiences include the axis
 * audience. The wizard's other ENGINE_READS kinds (experience/outing-template/
 * residence/golf-course) carry no structured region field in the shared
 * schema, so this cell is scoped to the one region-keyed kind (see
 * wizard-input-space.ts).
 */
const countCorporatePartyRows: CellCounterFactory = ({ rows, destinations }, wizard) => {
  const destRegion = new Map<string, string>(destinations.map((d) => [d.id, d.region]));
  return (region, audience) => {
    let count = 0;
    for (const r of rows) {
      if (r.dataset !== "party" || r.kind !== "party-venue") continue;
      if (!r.postWizards.includes(wizard)) continue;
      if (!r.audiences.includes(audience as (typeof r.audiences)[number])) continue;
      if (destRegion.get(destIdOf(r.id)) !== region) continue;
      count++;
    }
    return count;
  };
};

/**
 * Which counter each wizard uses. `Record<WizardTag, …>` + the typecheck gate
 * (`npm run typecheck`, run in CI) makes a NEW wizard a compile error here.
 *
 * This replaced an if/else chain whose trailing `else` hardcoded
 * "offsite-outing": a seventh wizard fell into it silently, was counted
 * against corporate party rows, and was reported under its own name — a
 * wrong answer that looked like a real one. There is no `else` to fall into
 * now, and no counter may hardcode a wizard name (each receives the wizard it
 * is counting for and filters on THAT).
 */
export const STARVED_CELL_COUNTERS: Record<WizardTag, CellCounterFactory> = {
  bestman: countPartyDestinations,
  moh: countPartyDestinations,
  handicap: countGolfCourses,
  "offsite-retreat": countResidences,
  "offsite-outing": countCorporatePartyRows,
  // Both read party destinations and are tagged on the same per-item bake as
  // bestman/moh, so they share the party counter — which filters on the wizard
  // it is handed, never on a hardcoded name.
  friendsmoon: countPartyDestinations,
  engagedmoon: countPartyDestinations,
};

/**
 * Core enumerator, parameterized on a `StarvedUniverse` so it's independently
 * testable with a synthetic/stripped universe (see starved-inputs.test.ts)
 * without touching the real data files.
 */
export function findStarvedIn(universe: StarvedUniverse, threshold = 3): Starved[] {
  const out: Starved[] = [];

  // Iterate the tag vocabulary, NOT `Object.keys(WIZARD_INPUT_SPACE)`: keying
  // off the map means a wizard missing from the map is silently never
  // audited. Iterating the vocabulary turns that into a loud failure.
  for (const wizard of ALL_WIZARD_TAGS) {
    const axes = WIZARD_INPUT_SPACE[wizard];
    const [axisA, axisB] = axes ?? [];
    if (!axisA || !axisB) {
      throw new Error(
        `starved-inputs: wizard "${wizard}" has no two-axis entry in WIZARD_INPUT_SPACE — ` +
          `add one (src/wizard-input-space.ts) so its input space is actually audited.`,
      );
    }

    // Runtime twin of the compile-time exhaustiveness above: `tsx` strips
    // types, so scripts and tests run with no compiler in the loop.
    const makeCounter = STARVED_CELL_COUNTERS[wizard];
    if (!makeCounter) {
      throw new Error(
        `starved-inputs: no cell counter registered for wizard "${wizard}" — ` +
          `add one to STARVED_CELL_COUNTERS rather than letting it fall through to another wizard's counter.`,
      );
    }
    const count = makeCounter(universe, wizard);

    for (const a of axisA.values) {
      for (const b of axisB.values) {
        const n = count(a, b);
        // Cell keys come from the axis names themselves, so a cell can never
        // be labeled with another wizard's axis names.
        if (n < threshold) out.push({ wizard, cell: { [axisA.name]: a, [axisB.name]: b }, count: n });
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
      // Already the merged set (base + sanctioned ingest) — see src/golf.ts.
      // Do NOT re-spread the merge overlay here; that double-counts it.
      golfCourses: SHARED_GOLF_COURSES,
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
