/**
 * audit-aspect-allocation.ts — verifies every ASPECT of the shared universe
 * (housing, events/activities, nightlife, dining, transport, golf, residences)
 * is allocated to the relevant projects on a PER-ASPECT basis, not per
 * location/trip. Report-only.
 *
 * "Per-aspect" = each item within a destination carries its OWN wizard/audience
 * routing derived from what the item IS (a bachelor-only event ≠ its hotel).
 * "Per-location" smell = every item in a destination shares one identical
 * wizard set regardless of aspect.
 *
 * Run: npx tsx scripts/audit-aspect-allocation.ts
 */
import {
  sharedDestinations,
  SHARED_GOLF_COURSES,
  SHARED_RESIDENCES,
  SHARED_TDF_DESTINATIONS,
} from "../src/index";

type Wiz = string;
const PARTY_ASPECTS = ["nightlife", "dining", "activities", "lodging", "transport"] as const;
const UNIVERSAL_ASPECTS = new Set(["lodging", "transport"]); // housing + getting-around: every group needs these
const sig = (ws: Wiz[] = []) => [...new Set(ws)].sort().join("+") || "(none)";
const pct = (n: number, d: number) => d ? `${Math.round((100 * n) / d)}%` : "—";

// ── A. Per-aspect wizard allocation across all party destinations ──────────
console.log("# Per-aspect allocation audit — shared cache\n");
console.log("## A. Party aspects → which projects (wizards) each ITEM reaches\n");
const ALL_WIZ = ["bestman", "moh", "offsite-outing", "offsite-retreat", "tdf", "handicap"];
const header = ["aspect", "items", ...ALL_WIZ, "orphan(0)"].join("\t");
console.log(header);
const aspectItems: Record<string, any[]> = {};
for (const asp of PARTY_ASPECTS) {
  const items = sharedDestinations.flatMap((d: any) => d[asp] ?? []);
  aspectItems[asp] = items;
  const counts = ALL_WIZ.map((w) => items.filter((i: any) => (i.wizards ?? []).includes(w)).length);
  const orphan = items.filter((i: any) => !(i.wizards ?? []).length).length;
  console.log([asp, items.length, ...counts.map((c, k) => `${c} (${pct(c, items.length)})`), orphan].join("\t"));
}

// ── B. Per-aspect vs per-location: do aspects within a destination DIFFER? ──
console.log("\n## B. Per-aspect vs per-location allocation\n");
let perAspectDests = 0, uniformDests = 0;
const uniformExamples: string[] = [];
for (const d of sharedDestinations as any[]) {
  const sigs = new Set<string>();
  for (const asp of PARTY_ASPECTS) for (const it of d[asp] ?? []) sigs.add(sig(it.wizards));
  if (sigs.size > 1) perAspectDests++;
  else { uniformDests++; if (uniformExamples.length < 8) uniformExamples.push(`${d.id} → all items ${[...sigs][0]}`); }
}
console.log(`Destinations whose aspects carry ≥2 distinct wizard-signatures (genuine PER-ASPECT): ${perAspectDests}/${sharedDestinations.length} (${pct(perAspectDests, sharedDestinations.length)})`);
console.log(`Destinations where ALL items share ONE signature (per-location smell): ${uniformDests}`);
if (uniformExamples.length) console.log("  e.g. " + uniformExamples.join("  |  "));

// ── C. Universal aspects (housing/transport) must reach every group-type ───
console.log("\n## C. Universal-aspect reach (housing + transport should be broadly reachable)\n");
for (const asp of PARTY_ASPECTS) {
  if (!UNIVERSAL_ASPECTS.has(asp)) continue;
  const items = aspectItems[asp];
  const noOO = items.filter((i: any) => !(i.wizards ?? []).includes("offsite-outing"));
  const noParty = items.filter((i: any) => !(i.wizards ?? []).some((w: string) => w === "bestman" || w === "moh"));
  const noRetreat = items.filter((i: any) => !(i.wizards ?? []).includes("offsite-retreat")).length;
  const noHandicap = items.filter((i: any) => !(i.wizards ?? []).includes("handicap")).length;
  console.log(`${asp}: ${items.length} items`);
  console.log(`   missing offsite-outing: ${noOO.length}  | missing any party brand: ${noParty.length}  | missing offsite-retreat: ${noRetreat}  | missing handicap: ${noHandicap}`);
}

// ── D. Event-gating correctness (per-aspect, not location) ─────────────────
console.log("\n## D. Event-gating flags (activities + nightlife)\n");
const flags: string[] = [];
for (const d of sharedDestinations as any[]) {
  for (const asp of ["activities", "nightlife"] as const) {
    for (const it of d[asp] ?? []) {
      const ws = it.wizards ?? [], au = it.audiences ?? [];
      // golf/bachelor-coded leaking to MOH
      if (ws.includes("moh") && !au.includes("bachelorette")) flags.push(`LEAK→moh (no bachelorette aud): ${d.id} "${it.name}" aud=${JSON.stringify(au)}`);
      // corporate audience but NOT reachable by offsite-outing (missed OO)
      if (au.includes("corporate") && !ws.includes("offsite-outing")) flags.push(`MISS offsite-outing (corp aud): ${d.id} "${it.name}"`);
      // offsite-outing tagged but NOT corporate audience (over-reach into corporate)
      if (ws.includes("offsite-outing") && !au.includes("corporate")) flags.push(`OVER→offsite-outing (no corp aud): ${d.id} "${it.name}"`);
      // orphan: no wizard at all
      if (!ws.length) flags.push(`ORPHAN (0 wizards): ${d.id} ${asp} "${it.name}"`);
    }
  }
}
console.log(flags.length ? flags.slice(0, 40).join("\n") + (flags.length > 40 ? `\n… +${flags.length - 40} more` : "") : "✓ none — events gated correctly per aspect");
console.log(`\nTotal event-gating flags: ${flags.length}`);

// ── E. Cross-model HOUSING coverage (the fragmentation question) ───────────
console.log("\n## E. Housing across the whole universe — is it allocated to each relevant project?\n");
const partyLodging = aspectItems["lodging"];
const wizReachLodging = ALL_WIZ.map((w) => `${w}:${partyLodging.filter((i: any) => (i.wizards ?? []).includes(w)).length}`);
console.log(`party-destination lodging (${partyLodging.length}) reach → ${wizReachLodging.join("  ")}`);
const resSites = (SHARED_RESIDENCES as any[]).reduce((m: any, r: any) => { for (const s of r.sites ?? []) m[s] = (m[s] ?? 0) + 1; return m; }, {});
console.log(`residences (${SHARED_RESIDENCES.length}) reach by SITE → ${JSON.stringify(resSites)}  (party wizards = expand-only, engines don't read yet)`);
console.log(`→ No single project sees ALL housing: party engines see party-lodging (not residences); offsite sees residences (+party-lodging via outing); HHQ/handicap sees neither party-lodging nor residences as 'housing'.`);

console.log("\n_done._");
