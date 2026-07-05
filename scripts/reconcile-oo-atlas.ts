/**
 * reconcile-oo-atlas.ts — one-time superset reconciliation report (Task 4).
 *
 * Goal: confirm shared-data is the single cite source for Offsite Outpost's two
 * wizards (Retreat + Outing), and fold back any genuinely-OO-only cite rows.
 *
 * Ground truth (Task 1 wiring-map + inspection): OO ALREADY reads shared-data.
 * OO's `src/lib/atlas/*` modules split into two kinds:
 *
 *   1. PRESENTATION / TRANSFORM (stays in OO as an overlay — NOT cite rows):
 *        types.ts, index.ts, compare.ts, macro-regions.ts, seasonality.ts,
 *        hydrate.ts, slug*.ts, packages.ts
 *   2. DATA modules (the atlas cite rows) — these are now THIN RE-EXPORT SHIMS
 *      that import their rows straight from shared-data:
 *        experiences.ts        -> ooExperiences
 *        outings.ts            -> ooSignatureOutings
 *        gen/outings-urban.ts  -> ooHeroOutingsUrban, ooPoolOutingsUrban
 *        gen/experiences-air   -> ooHeroExpAir, ooPoolExpAir
 *        gen/experiences-water -> ooHeroExpWater, ooPoolExpWater
 *        gen/experiences-winter-> ooHeroExpWinter, ooPoolExpWinter
 *      Venues come from shared-data's residencesForSite("offsite") in index.ts.
 *
 * Because every OO data module is a shim over shared-data, OO holds NO
 * independent local cite rows to fork against. This script proves that
 * statically (every data module imports from "shared-data" and carries no local
 * row literals) and enumerates the shared oo-* sets so the superset invariant is
 * auditable.
 *
 * If a data module were found to embed local cite rows NOT present in the shared
 * set, this script would list them as the OO-only set to absorb. Today that set
 * is empty — the fork was already resolved (the +270 OO dataset expansion landed
 * in shared-data; OO's atlas was repointed to it). This mirrors the HHQ result.
 *
 * Run: npx tsx scripts/reconcile-oo-atlas.ts
 */
import { readFileSync } from "node:fs";
import {
  ooExperiences,
  ooSignatureOutings,
  ooHeroOutingsUrban,
  ooPoolOutingsUrban,
  ooHeroExpAir,
  ooPoolExpAir,
  ooHeroExpWater,
  ooPoolExpWater,
  ooHeroExpWinter,
  ooPoolExpWinter,
  residencesForSite,
} from "../src/index";

const OO = "/Users/bignick/offsite-outpost";

// OO atlas DATA modules (cite rows) — each should be a shim over shared-data.
const OO_DATA_MODULES = [
  "src/lib/atlas/experiences.ts",
  "src/lib/atlas/outings.ts",
  "src/lib/atlas/gen/outings-urban.ts",
  "src/lib/atlas/gen/experiences-air.ts",
  "src/lib/atlas/gen/experiences-water.ts",
  "src/lib/atlas/gen/experiences-winter.ts",
];

// OO presentation/transform modules — legitimately stay in OO (NOT cite rows).
const OO_PRESENTATION_MODULES = [
  "src/lib/atlas/types.ts",
  "src/lib/atlas/index.ts",
  "src/lib/atlas/compare.ts",
  "src/lib/atlas/macro-regions.ts",
  "src/lib/atlas/seasonality.ts",
  "src/lib/atlas/hydrate.ts",
  "src/lib/atlas/slug.test.ts",
  "src/lib/atlas/packages.ts",
];

const norm = (s: string) => String(s ?? "").trim().toLowerCase();

// Heuristic: a shim imports from "shared-data" and holds no large row literal.
// A row literal looks like `{"id":` (JSON, extracted form) or many `{ id:` rows.
function classifyDataModule(rel: string) {
  const src = readFileSync(`${OO}/${rel}`, "utf8");
  const importsShared = /from ["']shared-data["']/.test(src);
  const jsonRowLiterals = (src.match(/\{\s*"id"\s*:/g) ?? []).length;
  const objRowLiterals = (src.match(/\{\s*id\s*:/g) ?? []).length;
  const localRows = jsonRowLiterals + objRowLiterals;
  return { rel, importsShared, localRows, isShim: importsShared && localRows === 0 };
}

// ── shared oo cite-row sets (the canonical superset) ──
const sharedExperiences = [
  ...ooExperiences,
  ...ooHeroExpAir,
  ...ooPoolExpAir,
  ...ooHeroExpWater,
  ...ooPoolExpWater,
  ...ooHeroExpWinter,
  ...ooPoolExpWinter,
] as Array<{ id?: string }>;

const sharedOutings = [
  ...ooSignatureOutings,
  ...ooHeroOutingsUrban,
  ...ooPoolOutingsUrban,
] as Array<{ id?: string }>;

const sharedResidences = residencesForSite("offsite") as Array<{ id?: string }>;

const sharedExpIds = new Set(sharedExperiences.map((r) => norm(r.id ?? "")));
const sharedOutIds = new Set(sharedOutings.map((r) => norm(r.id ?? "")));
const sharedResIds = new Set(sharedResidences.map((r) => norm(r.id ?? "")));

// ── classify OO modules ──
const dataClass = OO_DATA_MODULES.map(classifyDataModule);
const forkedDataModules = dataClass.filter((d) => !d.isShim);

// ── report ──
console.log("=== reconcile-oo-atlas (Task 4) ===\n");

console.log("OO atlas DATA modules (should all be shims over shared-data):");
for (const d of dataClass) {
  const status = d.isShim
    ? "SHIM"
    : `LOCAL-ROWS(${d.localRows})${d.importsShared ? "" : " no-shared-import"}`;
  console.log(`   [${status}] ${d.rel}`);
}
console.log("");

console.log("OO atlas PRESENTATION/TRANSFORM modules (stay in OO, not cite rows):");
for (const rel of OO_PRESENTATION_MODULES) console.log(`   [overlay] ${rel}`);
console.log("");

console.log("Shared oo cite-row sets (canonical superset):");
console.log(`   experiences (all buckets): ${sharedExperiences.length}  unique ids: ${sharedExpIds.size}`);
console.log(`   signature+urban outings:   ${sharedOutings.length}  unique ids: ${sharedOutIds.size}`);
console.log(`   offsite residences/venues: ${sharedResidences.length}  unique ids: ${sharedResIds.size}`);
console.log("");

console.log(`OO-only DATA modules embedding local cite rows: ${forkedDataModules.length}`);
if (forkedDataModules.length) {
  console.log("  >>> DIVERGENCE — OO holds local cite rows not sourced from shared-data.");
  console.log("  >>> These modules must be inspected and their real, unique rows folded");
  console.log("  >>> into shared-data (append to a sanctioned file; no hand-edit of");
  console.log("  >>> DO-NOT-hand-edit rows; no fabrication). Do not guess a schema merge.");
  for (const d of forkedDataModules) console.log(`    - ${d.rel} (${d.localRows} local rows)`);
  process.exitCode = 1;
} else {
  console.log("  => ZERO OO-only cite rows. OO's atlas is presentation-only over");
  console.log("     shared-data; shared-data is already the superset single source.");
  console.log("     No rows to fold. (Same outcome as the HHQ reconciliation.)");
}

export {};
