/**
 * verify-universe.ts — permanent integrity guard for the shared universe.
 *
 * Asserts the tag invariants that keep every wizard pulling the right data:
 *   1. tag-completeness — every plan-driving item carries non-empty routing tags
 *   2. tag-vocabulary    — wizards/audiences are drawn only from the known vocab
 *   3. denylist integrity — corporate-eligible (offsite-outing) iff audiences⊇corporate
 *   4. forbidden-leak    — the Offsite overlay emits ZERO non-corporate items
 *   5. per-entity routing — golf→sites⊆{tdf,offsite}; residences→offsite;
 *                           tdf-dests→[tdf]; moh/bestman locals→their wizard
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
  SHARED_RESIDENCES,
  SHARED_TDF_DESTINATIONS,
  residencesForSite,
  mohLocals,
  bestmanLocals,
} from "../src/index";

const WIZARDS = new Set(["bestman", "moh", "tdf", "offsite-retreat", "offsite-outing"]);
const AUDIENCES = new Set(["bachelor", "bachelorette", "corporate", "clients", "internal"]);

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
for (const c of SHARED_GOLF_COURSES) {
  if (!c.sites?.length) fail(`golf ${c.name}: empty sites`);
  for (const s of c.sites ?? []) if (s !== "tdf" && s !== "offsite") fail(`golf ${c.name}: bad site "${s}"`);
}
for (const r of SHARED_RESIDENCES) {
  if (!r.sites?.length) fail(`residence ${r.id}: empty sites`);
}
// residencesForSite attaches wizard routing (offsite-retreat / offsite-outing)
for (const r of residencesForSite("offsite")) {
  if (!r.wizards?.length) fail(`residence ${r.id}: empty wizards`);
  for (const w of r.wizards ?? [])
    if (w !== "offsite-retreat" && w !== "offsite-outing") fail(`residence ${r.id}: bad wizard "${w}"`);
}
for (const t of SHARED_TDF_DESTINATIONS) {
  if (JSON.stringify(t.wizards) !== JSON.stringify(["tdf"])) fail(`tdf-dest ${t.id}: wizards != [tdf]`);
}
for (const m of mohLocals()) if (!(m.wizards ?? []).includes("moh")) fail(`moh-local ${m.id}: missing moh wizard`);
// moh-locals bypass applyMohOverlay's golf filter (they merge straight into MOH's
// catalog), so guard the locals directly: no golf activity may live in moh-locals.
for (const m of mohLocals())
  for (const a of (((m as Record<string, any>).activities ?? []) as { type?: string; name?: string }[]))
    if (a.type === "golf") fail(`moh-local golf leak: ${m.id}/${a.name} (golf must never reach MOH)`);
for (const b of bestmanLocals()) if (!(b.wizards ?? []).includes("bestman")) fail(`bestman-local ${b.id}: missing bestman wizard`);

console.log(
  `universe: ${sharedDestinations.length} party-dests (${itemCount} items) · ` +
    `${SHARED_GOLF_COURSES.length} courses · ${SHARED_RESIDENCES.length} residences · ` +
    `${SHARED_TDF_DESTINATIONS.length} tdf-dests · ${mohLocals().length} moh-locals · ` +
    `${bestmanLocals().length} bestman-locals · OO-overlay items checked: ${ooItems}`,
);
if (failures) {
  console.error(`\n❌ verify-universe: ${failures} violation(s)`);
  process.exit(1);
}
console.log("✅ verify-universe: all tag invariants hold");
