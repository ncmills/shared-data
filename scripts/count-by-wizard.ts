import { 
  sharedDestinations, 
  SHARED_GOLF_COURSES, 
  SHARED_RESIDENCES, 
  SHARED_GOLF_DESTINATIONS, 
  mohLocals, 
  bestmanLocals,
  residencesForSite,
  applyOutpostOverlay,
  ALL_WIZARD_TAGS,
  type WizardTag,
} from '../src/index';

// Derived from the tag vocabulary. This was a hand-copied list that had ALREADY
// drifted — it omitted 'handicap', so every handicap-tagged item incremented an
// undefined counter (`counts['handicap']` → NaN) and was left out of the report
// entirely, making HHQ's coverage look like zero rather than unmeasured.
type Wizard = WizardTag;
const wizards: readonly Wizard[] = ALL_WIZARD_TAGS;

const counts: Record<Wizard, number> = Object.fromEntries(
  ALL_WIZARD_TAGS.map((w) => [w, 0]),
) as Record<Wizard, number>;

// Party destinations items
for (const d of sharedDestinations) {
  for (const cat of ['nightlife', 'dining', 'activities', 'lodging', 'transport'] as const) {
    for (const item of (d as any)[cat] ?? []) {
      for (const w of item.wizards ?? []) {
        counts[w as Wizard]++;
      }
    }
  }
}

// Golf courses - note: don't have wizards, have sites
// Count by sites: handicap -> handicap; offsite -> offsite-retreat/offsite-outing
for (const c of SHARED_GOLF_COURSES) {
  if ((c.sites ?? []).includes('handicap')) counts['handicap']++;
  if ((c.sites ?? []).includes('offsite')) {
    counts['offsite-retreat']++;
    counts['offsite-outing']++;
  }
}

// Residences - all are offsite, dual-tagged for retreat/outing
for (const r of SHARED_RESIDENCES) {
  const res = residencesForSite('offsite').find(x => x.id === r.id);
  if (res) {
    for (const w of res.wizards ?? []) {
      counts[w as Wizard]++;
    }
  }
}

// Golf-trip destinations (historically 'TDF' — Handicap HQ's since the split)
for (const t of SHARED_GOLF_DESTINATIONS) {
  counts['handicap']++;
}

// Locals
for (const m of mohLocals()) {
  counts['moh']++;
}
for (const b of bestmanLocals()) {
  counts['bestman']++;
}

console.log("Item counts per wizard:");
for (const w of wizards) {
  console.log(`  ${w}: ${counts[w]}`);
}

// MOH specific analysis
console.log("\n=== MOH ANALYSIS ===");
const mohItems: any[] = [];
for (const d of sharedDestinations) {
  for (const cat of ['nightlife', 'dining', 'activities', 'lodging', 'transport'] as const) {
    for (const item of (d as any)[cat] ?? []) {
      if ((item.wizards ?? []).includes('moh')) {
        mohItems.push({ city: d.city, type: cat, name: item.name, audiences: item.audiences });
      }
    }
  }
}
for (const m of mohLocals()) {
  mohItems.push({ city: m.city, type: 'local-destination', name: m.city, audiences: ['bachelorette'] });
}

console.log(`Total MOH items: ${mohItems.length}`);

// Count corporate in MOH
const corporateMoh = mohItems.filter(x => (x.audiences ?? []).includes('corporate')).length;
console.log(`MOH items tagged corporate: ${corporateMoh}`);
console.log(`MOH items party-only (no corporate): ${mohItems.length - corporateMoh}`);

// Activity type breakdown for MOH
const actTypeCount: Record<string, number> = {};
for (const d of sharedDestinations) {
  for (const a of d.activities ?? []) {
    if ((a.wizards ?? []).includes('moh')) {
      actTypeCount[a.type] = (actTypeCount[a.type] ?? 0) + 1;
    }
  }
}
console.log("\nMOH activity types:");
const sorted = Object.entries(actTypeCount).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sorted.slice(0, 15)) {
  console.log(`  ${type}: ${count}`);
}
