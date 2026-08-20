/**
 * verify-trips.ts — permanent integrity guard for composed trips.
 *
 * Composed trips are curated bundles of REAL catalog rows referenced by the
 * composite key `${destinationId}|${category}|${name}` (singular category —
 * the TAG_OVERRIDES formation), with authored prose around them. This gate
 * asserts the references and shapes hold:
 *   1. non-empty — zero composed trips is a FAILURE, not a pass: once a trips
 *      module exists, absence of a measurement is not a passing measurement
 *   2. id + slug uniqueness across all composed trips
 *   3. every destinationId resolves in sharedDestinations
 *   4. every lodging/activity/dining/nightlife key resolves against the baked
 *      catalog — a dangling key is a build failure, reported with the key AND
 *      the nearest same-city same-category names to aid fixing
 *   5. arity — activities 3-5, dining 2-3, nights ≥ 2, groupRange [2, ≥2],
 *      season non-empty ⊆ 1..12, narrative non-empty, faqs ≥ 2
 *   6. capstoneSpotId — null OR resolves in PROPOSAL_SPOTS_DATA with matching
 *      destinationId and capstoneEligible !== false
 *   7. planner-tag coverage (WARN only) — referenced rows whose baked wizard
 *      tags do not include the trip's planner are printed as `catalog-tags
 *      draft:` lines for the existing catalog-tags lane; never auto-applied,
 *      never a build failure
 *   8. derivation sanity — estPerPerson lo ≤ hi and lo > 0 for every trip
 *
 * Run: npx tsx scripts/verify-trips.ts  (exits non-zero on any violation).
 * NOTE: `EM_COMPOSED_TRIPS` is composed eagerly in src/index.ts, so a dangling
 * key also throws at import — deriveEstPerPerson names the exact key there.
 * This script's check 4 is the readable version (with nearest-name help); the
 * import-time throw is the fail-closed backstop for consumers that skip CI.
 */
import {
  sharedDestinations,
  EM_COMPOSED_TRIPS,
  PROPOSAL_SPOTS_DATA,
  rowKey,
  type ComposedTrip,
  type RowCategory,
  type TripPlanner,
  type WizardTag,
} from "../src/index";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  if (failures <= 40) console.error("  ✗ " + msg);
};

const trips: ComposedTrip[] = [...EM_COMPOSED_TRIPS];

// Resolvable key set + per-(dest,category) name lists, built from the baked
// catalog with the SAME composite formation trips are authored in (rowKey).
const CAT_FIELD: [RowCategory, string][] = [
  ["activity", "activities"],
  ["dining", "dining"],
  ["nightlife", "nightlife"],
  ["lodging", "lodging"],
  ["transport", "transport"],
];
const keySet = new Set<string>();
const namesByDestCat = new Map<string, string[]>();
const wizardsByKey = new Map<string, WizardTag[]>();
for (const d of sharedDestinations) {
  for (const [cat, field] of CAT_FIELD) {
    const rows = ((d as Record<string, any>)[field] ?? []) as { name: string; wizards?: WizardTag[] }[];
    namesByDestCat.set(
      `${d.id}|${cat}`,
      rows.map((r) => r.name),
    );
    for (const r of rows) {
      const k = rowKey(d.id, cat, r.name);
      keySet.add(k);
      wizardsByKey.set(k, r.wizards ?? []);
    }
  }
}

const destIds = new Set(sharedDestinations.map((d) => d.id));

// Cheap edit distance for nearest-name suggestions on dangling keys.
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[n]!;
}
function nearestNames(destId: string, cat: string, name: string): string {
  const pool = namesByDestCat.get(`${destId}|${cat}`) ?? [];
  if (pool.length === 0) return "(no rows in that city+category)";
  return pool
    .map((n) => ({ n, d: editDistance(name.toLowerCase(), n.toLowerCase()) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => `"${x.n}"`)
    .join(" · ");
}

// The wizard tag(s) that satisfy each planner. OO is satisfied by either
// offsite tag — both are the same site's wizards.
const PLANNER_TAGS: Record<TripPlanner, WizardTag[]> = {
  bestman: ["bestman"],
  moh: ["moh"],
  hhq: ["handicap"],
  oo: ["offsite-outing", "offsite-retreat"],
  friendsmoon: ["friendsmoon"],
  engagedmoon: ["engagedmoon"],
};

// 1: non-empty — a trips module with zero trips is a failed measurement.
console.log(`  composed trips: ${trips.length}`);
if (trips.length < 1) fail("zero composed trips — the trips module exists, so emptiness is a failure, not a pass");

// 2: id + slug uniqueness
const seenIds = new Set<string>();
const seenSlugs = new Set<string>();
for (const t of trips) {
  if (seenIds.has(t.id)) fail(`trip ${t.id}: duplicate id`);
  seenIds.add(t.id);
  if (seenSlugs.has(t.slug)) fail(`trip ${t.id}: duplicate slug "${t.slug}"`);
  seenSlugs.add(t.slug);
}

// 3: destinationId resolves
for (const t of trips) {
  if (!destIds.has(t.destinationId)) fail(`trip ${t.id}: destinationId "${t.destinationId}" not in sharedDestinations`);
}

// 4: every referenced row key resolves against the baked catalog
for (const t of trips) {
  const refs: string[] = [t.lodgingId, ...t.activityIds, ...t.diningIds, ...(t.nightlifeIds ?? [])];
  for (const k of refs) {
    if (keySet.has(k)) continue;
    const [destId = "", cat = "", ...rest] = k.split("|");
    fail(`trip ${t.id}: dangling row key "${k}" — nearest ${cat} in ${destId}: ${nearestNames(destId, cat, rest.join("|"))}`);
  }
}

// 5: arity + shape
for (const t of trips) {
  if (t.activityIds.length < 3 || t.activityIds.length > 5)
    fail(`trip ${t.id}: activities must be 3-5 (got ${t.activityIds.length})`);
  if (t.diningIds.length < 2 || t.diningIds.length > 3)
    fail(`trip ${t.id}: dining must be 2-3 (got ${t.diningIds.length})`);
  if (t.nights < 2) fail(`trip ${t.id}: nights must be ≥ 2 (got ${t.nights})`);
  if (t.groupRange[0] !== 2 || t.groupRange[1] < 2)
    fail(`trip ${t.id}: groupRange must be [2, ≥2] (got [${t.groupRange}])`);
  if (t.season.length === 0 || t.season.some((m) => !Number.isInteger(m) || m < 1 || m > 12))
    fail(`trip ${t.id}: season must be non-empty ⊆ 1..12 (got [${t.season}])`);
  if (t.narrative.trim().length === 0) fail(`trip ${t.id}: empty narrative`);
  if (t.faqs.length < 2) fail(`trip ${t.id}: faqs must be ≥ 2 (got ${t.faqs.length})`);
}

// 6: capstoneSpotId — null or a matching, eligible proposal spot
const spotsById = new Map(PROPOSAL_SPOTS_DATA.map((s) => [s.id, s]));
for (const t of trips) {
  if (t.capstoneSpotId === null) continue;
  const spot = spotsById.get(t.capstoneSpotId);
  if (!spot) {
    fail(`trip ${t.id}: capstoneSpotId "${t.capstoneSpotId}" not in PROPOSAL_SPOTS_DATA`);
    continue;
  }
  if (spot.destinationId !== t.destinationId)
    fail(`trip ${t.id}: capstone spot "${spot.id}" is in ${spot.destinationId}, trip is in ${t.destinationId}`);
  if (spot.capstoneEligible === false)
    fail(`trip ${t.id}: capstone spot "${spot.id}" is capstoneEligible:false (${spot.ineligibleReason ?? "no reason recorded"})`);
}

// 7: planner-tag coverage — WARN only. A referenced row the planner's baked
// wizard tags don't cover is a DRAFT for the catalog-tags lane, printed here
// and never silently applied. Not a build failure.
let tagDrafts = 0;
for (const t of trips) {
  const want = PLANNER_TAGS[t.planner];
  const refs: string[] = [t.lodgingId, ...t.activityIds, ...t.diningIds, ...(t.nightlifeIds ?? [])];
  for (const k of refs) {
    if (!keySet.has(k)) continue; // dangling keys already failed in check 4
    const w = wizardsByKey.get(k) ?? [];
    if (!want.some((tag) => w.includes(tag))) {
      tagDrafts++;
      console.warn(`  catalog-tags draft: ${k} lacks planner "${t.planner}" (baked wizards: [${w}])`);
    }
  }
}
if (tagDrafts) console.warn(`  (${tagDrafts} catalog-tags draft(s) above — warnings for the catalog-tags lane, not failures)`);

// 8: derivation sanity — the derived estimate must be a usable range
for (const t of trips) {
  const [lo, hi] = t.estPerPerson;
  if (lo > hi) fail(`trip ${t.id}: estPerPerson lo ${lo} > hi ${hi}`);
  if (lo <= 0) fail(`trip ${t.id}: estPerPerson lo ${lo} must be > 0`);
}

console.log(
  `trips: ${trips.length} composed · ${keySet.size} resolvable catalog keys · ` +
    `${PROPOSAL_SPOTS_DATA.length} proposal spots · ${tagDrafts} tag draft(s)`,
);
if (failures) {
  console.error(`\n❌ verify-trips: ${failures} violation(s)`);
  process.exit(1);
}
console.log("✅ verify-trips: all composed-trip invariants hold");
