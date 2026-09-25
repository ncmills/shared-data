/**
 * verify-universe.ts — permanent integrity guard for the shared universe.
 *
 * Asserts the tag invariants that keep every wizard pulling the right data:
 *   1. tag-completeness — every plan-driving item carries non-empty routing tags
 *   2. tag-vocabulary    — wizards/audiences are drawn only from the known vocab
 *   3. denylist integrity — corporate-eligible (offsite-outing) iff audiences⊇corporate
 *   4. forbidden-leak    — the Offsite overlay emits ZERO non-corporate items
 *   5. per-entity routing — golf→sites⊆{handicap,offsite}; residences→offsite;
 *                           golf-dests→[handicap]; moh/bestman locals→their wizard
 *   7. row identity (CORPUS-M3a) — every nested row and golf course has an id,
 *                           0 duplicate ids, every alias resolves, every override
 *                           key resolves (src/row-identity-check.ts)
 *
 * Run: npx tsx scripts/verify-universe.ts  (exits non-zero on any violation).
 * This is the gate the monthly growth agents must pass before any auto-commit,
 * and is intended to be wired into CI / pre-commit. It does NOT cover
 * no-empty-results — that lives with each consumer's wizard snapshot harness.
 */
import {
  sharedDestinations,
  applyOutpostOverlay,
  applyMohOverlay,
  SHARED_GOLF_COURSES,
  ALL_GOLF_COURSES,
  ALL_RESIDENCES,
  SHARED_GOLF_DESTINATIONS,
  residencesForSite,
  mohLocals,
  bestmanLocals,
  ooExperiences,
  ooHeroExpAir,
  ooPoolExpAir,
  ooHeroExpWater,
  ooPoolExpWater,
  ooHeroExpWinter,
  ooPoolExpWinter,
  ooSignatureOutings,
  ooHeroOutingsUrban,
  ooPoolOutingsUrban,
  ALL_WIZARD_TAGS,
  ALL_AUDIENCE_TAGS,
  GOLF_COURSES_CANONICAL,
  golfDestinations,
  SHARED_MOH_LOCALS,
  SHARED_BESTMAN_LOCALS,
} from "../src/index";
import { TAG_OVERRIDES } from "../src/destinations-bake";
import { checkRowIdentity, type IdRow, type ViewGroup } from "../src/row-identity-check";

// Derived from the tag vocabulary, never hand-copied. These were hardcoded
// literals and the wizard set had already drifted — it was missing "handicap",
// so a legitimately handicap-tagged party item would have been reported as a
// bad wizard by the very guard meant to protect the vocabulary.
const WIZARDS: Set<string> = new Set(ALL_WIZARD_TAGS);
const AUDIENCES: Set<string> = new Set(ALL_AUDIENCE_TAGS);

let failures = 0;
const fail = (msg: string) => {
  failures++;
  if (failures <= 40) console.error("  ✗ " + msg);
};

const ITEM_CATS = ["nightlife", "dining", "activities", "lodging", "transport"] as const;

// 1-3: party-destination items
let itemCount = 0;
for (const d of sharedDestinations) {
  for (const cat of ITEM_CATS) {
    for (const it of (d as Record<string, any>)[cat] ?? []) {
      itemCount++;
      const w: string[] = it.wizards ?? [];
      const a: string[] = it.audiences ?? [];
      if (w.length === 0) fail(`${d.id}/${cat}/${it.name}: empty wizards`);
      if (a.length === 0) fail(`${d.id}/${cat}/${it.name}: empty audiences`);
      for (const x of w) if (!WIZARDS.has(x)) fail(`${d.id}/${cat}/${it.name}: bad wizard "${x}"`);
      for (const x of a) if (!AUDIENCES.has(x)) fail(`${d.id}/${cat}/${it.name}: bad audience "${x}"`);
      const corp = a.includes("corporate");
      const oo = w.includes("offsite-outing");
      if (corp !== oo) fail(`${d.id}/${cat}/${it.name}: offsite-outing(${oo}) must equal corporate-audience(${corp})`);
    }
  }
}

// 4: forbidden-leak — Offsite overlay must emit only corporate-audience items
let ooItems = 0;
for (const d of sharedDestinations) {
  const oo = applyOutpostOverlay(d) as Record<string, any>;
  for (const cat of ["activities", "nightlife", "dining"] as const) {
    for (const it of oo[cat] ?? []) {
      ooItems++;
      if (!(it.audiences ?? []).includes("corporate"))
        fail(`OO overlay leak: ${d.id}/${cat}/${it.name} not corporate`);
    }
  }
}

// 4b: brand-protection — the MOH overlay (MOH's REAL consumption path) must emit
// ZERO golf activities. The bake's brands→wizards path has no isGolf guard, so a
// golf activity tagged brands:["both"] would otherwise carry the `moh` wizard and
// surface in bachelorette plans (caught 2026-06-30: Tunica round + 3 TopGolf).
// deriveRouting already excludes golf→moh; this guards the overlay path it doesn't cover.
let mohActs = 0;
for (const d of sharedDestinations) {
  const moh = applyMohOverlay(d) as Record<string, any>;
  for (const it of moh.activities ?? []) {
    mohActs++;
    if (it.type === "golf") fail(`MOH overlay golf leak: ${d.id}/${it.name} (golf must never reach MOH)`);
  }
}

// 5: per-entity routing
for (const c of ALL_GOLF_COURSES) {
  if (!c.sites?.length) fail(`golf ${c.name}: empty sites`);
  for (const s of c.sites ?? []) if (s !== "offsite" && s !== "handicap") fail(`golf ${c.name}: bad site "${s}"`);
}
// ALL_RESIDENCES = SHARED_RESIDENCES (regen-only) + the Task 15 sanctioned
// expansion file, so ingested rows get the same "non-empty sites" guard.
for (const r of ALL_RESIDENCES) {
  if (!r.sites?.length) fail(`residence ${r.id}: empty sites`);
}
// residencesForSite attaches wizard routing (offsite-retreat / offsite-outing)
for (const r of residencesForSite("offsite")) {
  if (!r.wizards?.length) fail(`residence ${r.id}: empty wizards`);
  for (const w of r.wizards ?? [])
    if (w !== "offsite-retreat" && w !== "offsite-outing") fail(`residence ${r.id}: bad wizard "${w}"`);
}
for (const t of SHARED_GOLF_DESTINATIONS) {
  if (JSON.stringify(t.wizards) !== JSON.stringify(["handicap"]))
    fail(`golf-dest ${t.id}: wizards != [handicap] (got ${JSON.stringify(t.wizards)})`);
}
for (const m of mohLocals()) if (!(m.wizards ?? []).includes("moh")) fail(`moh-local ${m.id}: missing moh wizard`);
// moh-locals bypass applyMohOverlay's golf filter (they merge straight into MOH's
// catalog), so guard the locals directly: no golf activity may live in moh-locals.
for (const m of mohLocals())
  for (const a of (((m as Record<string, any>).activities ?? []) as { type?: string; name?: string }[]))
    if (a.type === "golf") fail(`moh-local golf leak: ${m.id}/${a.name} (golf must never reach MOH)`);
for (const b of bestmanLocals()) if (!(b.wizards ?? []).includes("bestman")) fail(`bestman-local ${b.id}: missing bestman wizard`);

// 6: OO atlas rows (experiences + outings). These feed the two Offsite wizards.
// They were previously unchecked; guard their routing so new data can't drift:
//   - corporate-coded → NEVER a party wizard/audience (brand protection)
//   - experiences → both offsite wizards; outings → offsite-outing only
//   - enum-valid kind/focus; unique ids; outing.experienceId resolves.
const OO_KINDS = new Set([
  "golf","wrangling","field-sports","water","motorsport","wilderness","culinary",
  "highland-games","service","winter","air","equestrian","cycling","amazing-race",
  "wildlife","wellness","hospitality","nightlife","spirits",
]);
const PARTY_W = new Set(["bestman","moh"]);
const PARTY_A = new Set(["bachelor","bachelorette"]);
const allOoExp = [
  ...ooExperiences, ...ooHeroExpAir, ...ooPoolExpAir, ...ooHeroExpWater,
  ...ooPoolExpWater, ...ooHeroExpWinter, ...ooPoolExpWinter,
] as Record<string, any>[];
const allOoOut = [...ooSignatureOutings, ...ooHeroOutingsUrban, ...ooPoolOutingsUrban] as Record<string, any>[];
const expIds = new Set(allOoExp.map((e) => e.id));
const ooSeen = new Set<string>();
for (const e of allOoExp) {
  if (!e.id) { fail(`oo-exp: row missing id`); continue; }
  if (ooSeen.has(e.id)) fail(`oo-exp ${e.id}: duplicate id`);
  ooSeen.add(e.id);
  if (!OO_KINDS.has(e.kind)) fail(`oo-exp ${e.id}: bad kind "${e.kind}"`);
  for (const w of e.wizards ?? []) if (PARTY_W.has(w)) fail(`oo-exp ${e.id}: party wizard "${w}" (corporate-coded, brand leak)`);
  for (const a of e.audiences ?? []) if (PARTY_A.has(a)) fail(`oo-exp ${e.id}: party audience "${a}" (brand leak)`);
}
const ooSeenO = new Set<string>();
for (const o of allOoOut) {
  if (!o.id) { fail(`oo-outing: row missing id`); continue; }
  if (ooSeenO.has(o.id)) fail(`oo-outing ${o.id}: duplicate id`);
  ooSeenO.add(o.id);
  if (!OO_KINDS.has(o.focus)) fail(`oo-outing ${o.id}: bad focus "${o.focus}"`);
  const w = o.wizards ?? [];
  if (JSON.stringify(w) !== JSON.stringify(["offsite-outing"])) fail(`oo-outing ${o.id}: wizards != [offsite-outing] (got ${JSON.stringify(w)})`);
  for (const a of o.audiences ?? []) if (PARTY_A.has(a)) fail(`oo-outing ${o.id}: party audience "${a}" (brand leak)`);
  if (o.experienceId && !expIds.has(o.experienceId)) fail(`oo-outing ${o.id}: experienceId "${o.experienceId}" does not resolve`);
}
console.log(`  oo-atlas: ${allOoExp.length} experiences · ${allOoOut.length} outings checked`);

// 7: row identity (CORPUS-M3a). Canonical party rows are unique across the
// whole catalog; golf courses across all courses; a derived view's rows within
// their destination + array.
const idViews: ViewGroup[] = [];
for (const [label, dests, arrays] of [
  ["moh-locals", SHARED_MOH_LOCALS, ITEM_CATS],
  ["bestman-locals", SHARED_BESTMAN_LOCALS, ITEM_CATS],
  ["golf-dest courses", golfDestinations(), ["courses"]],
] as const)
  for (const d of dests as Record<string, unknown>[])
    for (const arr of arrays) idViews.push({ label: `${label} ${d.id}/${arr}`, rows: (d[arr] as IdRow[]) ?? [] });
const identity = checkRowIdentity({
  canonical: [
    { label: "party rows", rows: sharedDestinations.flatMap((d) => ITEM_CATS.flatMap((c) => d[c] as IdRow[])) },
    { label: "golf courses", rows: GOLF_COURSES_CANONICAL },
    { label: "golf catalog (flat)", rows: SHARED_GOLF_COURSES as IdRow[] },
  ],
  views: idViews,
  overrideKeys: Object.keys(TAG_OVERRIDES),
  overrideSetLabel: "party rows",
  // Measured 2026-09-24: both rows were retired from the canonical catalog by
  // #41 (marketplace-placeholder lodging names) and survive only inside the
  // Best Man locals copy, which overrides never touched. Dead before M3a too.
  knownDeadOverrideKeys: {
    "hilton-head-sc|lodging|Palmetto Dunes Airbnb Villas": "row retired in #41",
    "myrtle-beach-sc|lodging|Airbnb Condos at Barefoot Resort": "row retired in #41",
  },
});
for (const v of identity.violations) fail(`row identity: ${v}`);
console.log(`  row identity: ${JSON.stringify(identity.counts)}`);

console.log(
  `universe: ${sharedDestinations.length} party-dests (${itemCount} items) · ` +
    `${SHARED_GOLF_COURSES.length} courses · ${ALL_RESIDENCES.length} residences · ` +
    `${SHARED_GOLF_DESTINATIONS.length} golf-dests · ${mohLocals().length} moh-locals · ` +
    `${bestmanLocals().length} bestman-locals · OO-overlay items checked: ${ooItems}`,
);
if (failures) {
  console.error(`\n❌ verify-universe: ${failures} violation(s)`);
  process.exit(1);
}
console.log("✅ verify-universe: all tag invariants hold");
