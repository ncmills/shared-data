/**
 * scan-gaps.ts — Phase-E growth engine, v1 (report-only).
 *
 * Scans the tagged universe and reports, PER WIZARD, where coverage is thin so
 * the monthly growth agent (or Nick) knows what to pull next. Pure analysis — no
 * writes, no network, no LLM. The v2 agent feeds these gaps to a data-pull +
 * tagging-rules + verify + propose-PR loop.
 *
 * Gap metrics:
 *   - region coverage   — destinations per region, flag the thinnest
 *   - activity coverage — which activity categories are rare across the catalog
 *   - price spread      — tiers under-represented for a wizard
 *
 * Run: npx tsx scripts/scan-gaps.ts   (markdown to stdout)
 * The monthly runner redirects this into ~/work/notes for Nick.
 */
import {
  sharedDestinations,
  SHARED_GOLF_COURSES,
  SHARED_RESIDENCES,
  SHARED_TDF_DESTINATIONS,
  mohLocals,
  bestmanLocals,
  CATEGORY_OF,
} from "../src/index";

const THIN_REGION = 6; // a region with fewer than this many destinations is a gap

function countBy<T>(items: T[], key: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it) || "(none)";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function thinnest(m: Map<string, number>, n = 5): [string, number][] {
  return [...m.entries()].sort((a, b) => a[1] - b[1]).slice(0, n);
}

const out: string[] = [];
const p = (s = "") => out.push(s);

p("# Universe gap scan — per-wizard coverage");
p("");
p(`Universe: ${sharedDestinations.length} party-dests · ${SHARED_GOLF_COURSES.length} courses · ${SHARED_RESIDENCES.length} residences · ${SHARED_TDF_DESTINATIONS.length} tdf-dests · ${mohLocals().length}+${bestmanLocals().length} locals`);
p("");

// ── Party wizards (bestman / moh) — party-destinations by region ────────────
{
  const all = sharedDestinations;
  const byRegion = countBy(all, (d) => d.region);
  p("## bestman / moh — party destinations");
  p(`Total cities: ${all.length}. Thinnest regions (target for new cities):`);
  for (const [r, n] of thinnest(byRegion)) p(`- **${r}** — ${n} cities${n < THIN_REGION ? " ⚠️ thin" : ""}`);

  // activity-category coverage across the whole party catalog
  const catCount = new Map<string, number>();
  for (const d of all)
    for (const a of d.activities ?? [])
      for (const cat of CATEGORY_OF[a.type] ?? ["(uncategorized)"])
        catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
  p("");
  p("Rarest activity categories (under-served party experiences):");
  for (const [c, n] of thinnest(catCount, 6)) p(`- ${c} — ${n}`);
  p("");
}

// ── tdf — golf destinations by region ───────────────────────────────────────
{
  const byRegion = countBy(SHARED_TDF_DESTINATIONS, (d) => String(d.region));
  p("## tdf — golf destinations");
  p("Thinnest golf regions:");
  for (const [r, n] of thinnest(byRegion)) p(`- **${r}** — ${n} dests${n < THIN_REGION ? " ⚠️ thin" : ""}`);
  const tierCount = countBy(SHARED_GOLF_COURSES, (c) => String(c.tier));
  p("Course tier spread: " + [...tierCount.entries()].map(([t, n]) => `${t}:${n}`).join(" · "));
  p("");
}

// ── offsite-retreat — residences by setting / region ────────────────────────
{
  const bySetting = countBy(SHARED_RESIDENCES, (r) => String(r.setting));
  const byRegion = countBy(SHARED_RESIDENCES, (r) => String(r.region).split(",").slice(-1)[0].trim());
  p("## offsite-retreat — residences");
  p("Thinnest settings (target for new buyout venues):");
  for (const [s, n] of thinnest(bySetting)) p(`- **${s}** — ${n}${n < 4 ? " ⚠️ thin" : ""}`);
  p(`Distinct regions: ${byRegion.size}. Thinnest:`);
  for (const [r, n] of thinnest(byRegion, 4)) p(`- ${r} — ${n}`);
  p("");
}

// ── offsite-outing — corporate-eligible city activities by region ───────────
{
  // outing pulls corporate-eligible party-city activities; count cities with
  // at least one corporate activity per region.
  const corp = sharedDestinations.filter((d) =>
    (d.activities ?? []).some((a) => (a.audiences ?? []).includes("corporate")),
  );
  const byRegion = countBy(corp, (d) => d.region);
  p("## offsite-outing — corporate-usable cities");
  p(`Cities with ≥1 corporate activity: ${corp.length}/${sharedDestinations.length}. Thinnest regions:`);
  for (const [r, n] of thinnest(byRegion)) p(`- **${r}** — ${n}${n < THIN_REGION ? " ⚠️ thin" : ""}`);
  p("");
}

p("---");
p("_v1 report-only. v2: feed each ⚠️ gap to a pull → tagging-rules → npm run verify → propose-PR loop._");

console.log(out.join("\n"));
