/**
 * check-brand-rules.ts — regression guard for the HARD brand-protection rules
 * encoded in src/tagging-rules.ts.
 *
 * Paramount portfolio rule: the data source is shared, but each brand pulls only
 * what FITS its brand. Golf is a bachelor + corporate thing — it belongs to
 * Best Man HQ and Offsite Outpost, and NEVER to Maid of Honor HQ (bachelorette).
 * Corporate-coded experiences never leak into a party brand. These assertions
 * fail the build if any future edit lets a cross-tag violate that.
 *
 * Run: npx tsx scripts/check-brand-rules.ts   (wired into `npm run verify`)
 */
import { deriveRouting, type RoutingInput } from "../src/tagging-rules";

const wizardsOf = (r: ReturnType<typeof deriveRouting>) => [
  ...r.core.wizards,
  ...r.expand.flatMap((e) => e.wizards),
];
const expandWizardsOf = (r: ReturnType<typeof deriveRouting>) =>
  r.expand.flatMap((e) => e.wizards);

const cases: [string, RoutingInput, (r: ReturnType<typeof deriveRouting>) => boolean][] = [
  ["golf-course expand = [bestman] only (NEVER moh)",
    { kind: "golf-course" },
    (r) => JSON.stringify([...new Set(expandWizardsOf(r))].sort()) === JSON.stringify(["bestman"])],
  ["golf-course core audiences exclude bachelorette",
    { kind: "golf-course" },
    (r) => !r.core.audiences.includes("bachelorette") && r.core.audiences.includes("bachelor")],
  ["golf course never routes to moh at all",
    { kind: "golf-course" },
    (r) => !wizardsOf(r).includes("moh")],
  ["golf EXPERIENCE never crosses to moh",
    { kind: "experience", activityType: "golf" },
    (r) => !expandWizardsOf(r).includes("moh")],
  ["boudoir experience -> moh only (never bestman)",
    { kind: "experience", activityType: "boudoir" },
    (r) => expandWizardsOf(r).includes("moh") && !expandWizardsOf(r).includes("bestman")],
  ["cigar-bar experience -> bestman only (never moh)",
    { kind: "experience", activityType: "cigar-bar" },
    (r) => expandWizardsOf(r).includes("bestman") && !expandWizardsOf(r).includes("moh")],
  ["spa experience -> both party brands (fits both)",
    { kind: "experience", activityType: "spa" },
    (r) => JSON.stringify([...new Set(expandWizardsOf(r))].sort()) === JSON.stringify(["bestman", "moh"])],
  ["corporate-coded experience (corporate/clients-only) -> NO party expand",
    { kind: "experience", activityType: "team-building", audiences: ["corporate", "clients"] },
    (r) => r.expand.length === 0],
  ["residence never crosses to a party brand",
    { kind: "residence", setting: "lake" },
    (r) => !wizardsOf(r).includes("bestman") && !wizardsOf(r).includes("moh")],
  ["party-venue (bachelorette brand) does NOT leak to bestman",
    { kind: "party-venue", venueType: "activity", activityType: "boudoir", brands: ["moh"] },
    (r) => !wizardsOf(r).includes("bestman")],
  ["golf-destination crosses only to OO (no party brand)",
    { kind: "golf-destination" },
    (r) => !wizardsOf(r).includes("bestman") && !wizardsOf(r).includes("moh")],
];

let fail = 0;
for (const [name, input, ok] of cases) {
  const r = deriveRouting(input);
  const pass = ok(r);
  if (!pass) fail++;
  console.log(`${pass ? "OK " : "XX "} ${name}`);
  if (!pass) console.log("   got:", JSON.stringify(r));
}
if (fail === 0) {
  console.log(`\n${cases.length} brand-protection assertions hold.`);
} else {
  console.error(`\n${fail} brand-protection assertion(s) FAILED.`);
  process.exit(1);
}
