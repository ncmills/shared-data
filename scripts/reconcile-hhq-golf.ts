/**
 * reconcile-hhq-golf.ts — one-time superset merge report (Task 3).
 *
 * Diffs Handicap HQ's golf course universe against shared-data's
 * SHARED_GOLF_COURSES so we can make shared-data the single golf-cite source.
 *
 * HHQ's golf data has two surfaces:
 *   1. Destination courses — HHQ renders `allDestinations`, which is sourced
 *      from shared-data's `tdfDestinations()` (SHARED_TDF_DESTINATIONS). Each
 *      destination embeds a `courses[]` array. Those are the concrete courses
 *      the plan engine surfaces.
 *   2. The Golf Atlas overlay — GOLF_ATLAS[].marqueeCourses are course NAMES
 *      the 24 editorial pilgrimages call out. Every one must resolve to a
 *      course in the shared set (that's the acceptance test in HHQ).
 *
 * Report:
 *   (a) HHQ destination courses (name+city) ABSENT from SHARED_GOLF_COURSES.
 *   (b) Atlas marquee names ABSENT from SHARED_GOLF_COURSES (by name).
 *   (c) Field mismatches for matched courses (shared vs tdf-dest embed).
 *
 * (a) is the HHQ-only set to absorb into golf-courses-hhq-merge.ts (real,
 * deduped, tagged "handicap"). Run: npx tsx scripts/reconcile-hhq-golf.ts
 */
import { SHARED_GOLF_COURSES, type SharedGolfCourse } from "../src/golf-courses";
import { SHARED_TDF_DESTINATIONS } from "../src/tdf-destinations";
// HHQ's editorial overlay is a standalone data module (no runtime imports).
import { GOLF_ATLAS } from "/Users/bignick/handicap-hq/src/data/golf-atlas";

const norm = (s: string) => s.trim().toLowerCase();
const key = (name: string, city: string) => `${norm(name)}||${norm(city)}`;

// ── shared index ──
const sharedByKey = new Map<string, SharedGolfCourse>();
const sharedByName = new Map<string, SharedGolfCourse>();
for (const c of SHARED_GOLF_COURSES) {
  sharedByKey.set(key(c.name, c.city), c);
  sharedByName.set(norm(c.name), c);
}

// ── HHQ destination courses (from the shared tdf destinations HHQ renders) ──
interface HhqCourseRow {
  name: string;
  city: string;
  state: string;
  region: string;
  course: Record<string, unknown>;
}
const hhqCourses: HhqCourseRow[] = [];
for (const d of SHARED_TDF_DESTINATIONS as unknown as Array<Record<string, any>>) {
  for (const c of (d.courses ?? []) as Array<Record<string, unknown>>) {
    hhqCourses.push({
      name: String(c.name),
      city: String(d.city),
      state: String(d.state),
      region: String(d.region),
      course: c,
    });
  }
}

// ── (a) HHQ-only destination courses ──
const missingByKey: HhqCourseRow[] = [];
for (const h of hhqCourses) {
  if (!sharedByKey.has(key(h.name, h.city))) missingByKey.push(h);
}

// ── (b) atlas marquee names absent from the shared set ──
const marqueeNames = new Set<string>();
for (const p of GOLF_ATLAS) for (const c of p.marqueeCourses) marqueeNames.add(c);
const missingMarquee: string[] = [];
for (const name of marqueeNames) if (!sharedByName.has(norm(name))) missingMarquee.push(name);

// ── (c) field mismatches for matched courses ──
const compareFields = [
  "tier",
  "style",
  "walkable",
  "driveMinutes",
  "url",
  "highlight",
  "googleRating",
  "reviewCount",
  "hypeTag",
  "rankNote",
] as const;
interface Mismatch {
  name: string;
  city: string;
  field: string;
  shared: unknown;
  hhq: unknown;
}
const mismatches: Mismatch[] = [];
for (const h of hhqCourses) {
  const s = sharedByKey.get(key(h.name, h.city));
  if (!s) continue;
  const sh = s as unknown as Record<string, unknown>;
  for (const f of compareFields) {
    const sv = sh[f];
    const hv = h.course[f];
    if (sv === undefined && hv === undefined) continue;
    if (JSON.stringify(sv) !== JSON.stringify(hv)) {
      mismatches.push({ name: h.name, city: h.city, field: f, shared: sv, hhq: hv });
    }
  }
  // greenFeeRange (tuple)
  if (JSON.stringify(sh.greenFeeRange) !== JSON.stringify(h.course.greenFeeRange)) {
    mismatches.push({
      name: h.name,
      city: h.city,
      field: "greenFeeRange",
      shared: sh.greenFeeRange,
      hhq: h.course.greenFeeRange,
    });
  }
}

// ── report ──
console.log("=== reconcile-hhq-golf ===");
console.log(`shared golf courses:        ${SHARED_GOLF_COURSES.length}`);
console.log(`HHQ destination courses:    ${hhqCourses.length} (across ${SHARED_TDF_DESTINATIONS.length} destinations)`);
console.log(`atlas marquee names:        ${marqueeNames.size}`);
console.log("");
console.log(`(a) HHQ-only courses (name+city not in shared): ${missingByKey.length}`);
for (const m of missingByKey) console.log(`    - ${m.name} — ${m.city}, ${m.state}`);
console.log("");
console.log(`(b) atlas marquee names not resolvable in shared: ${missingMarquee.length}`);
for (const m of missingMarquee) console.log(`    - ${m}`);
console.log("");
console.log(`(c) field mismatches (matched courses): ${mismatches.length}`);
const shownMismatch = mismatches.slice(0, 40);
for (const m of shownMismatch) {
  console.log(
    `    - ${m.name} [${m.city}] ${m.field}: shared=${JSON.stringify(m.shared)} hhq=${JSON.stringify(m.hhq)}`,
  );
}
if (mismatches.length > shownMismatch.length) {
  console.log(`    … and ${mismatches.length - shownMismatch.length} more`);
}

// Emit the HHQ-only rows as a JSON merge spec for review.
if (missingByKey.length) {
  console.log("\n=== proposed golf-courses-hhq-merge rows (review before absorbing) ===");
  console.log(JSON.stringify(missingByKey.map((m) => ({ ...m.course, city: m.city, state: m.state, region: m.region })), null, 2));
}

export {};
