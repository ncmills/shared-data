/**
 * atlas-baked-score.ts — how many atlas trips are "fully baked"? (REPORT ONLY)
 *
 * The standard is the six-point gate in
 * ~/work/handoffs/sn-fixes/2026-11-26-atlas-fully-baked-standard.md
 * ("The gate DRV builds to"). Numbering here follows that gate:
 *
 *   1  every slot is a named venue that resolves in the shared pool
 *      (needs a stay, a meal and an activity/course; nothing free-generated)
 *   2  every venue carries a url (present and non-empty)
 *   3  every url returns 2xx            -> NOT CHECKED (needs network)
 *   4  a verified photo of the exact place for the hero and every stop  [PROXY]
 *   5  the per-person total reconciles with its working                  [PROXY]
 *   6  why-this-trip copy specific to the place                          [PROXY]
 *
 * PROXIES, said plainly:
 *  - 4: no atlas schema has a per-trip verified-photo field today, so this can
 *    only look for one (`verifiedPhotos`: a hero plus a photo for each stop). It
 *    cannot tell a verified photo from an unverified one.
 *  - 5: passes only if the trip has `costLines` summing to its headline range, or
 *    is a composed trip whose `deriveEstPerPerson` reproduces the headline.
 *    Atlas trips carry a bare `estPerPerson` range, so they fail.
 *  - 6: narrative at least N chars, no filler phrase, names a listed venue or the
 *    city, and at least 3 FAQs. It cannot judge whether the prose is good.
 *
 * Tiers over the 5 checkable points: baked = 5/5 (and still pending point 3),
 * partial = 3-4, thin = 0-2. "Baked" therefore means "baked as far as offline
 * data can say", never "verified live".
 *
 * Reads consumer repos read-only. No network, no model calls. ~/indiamoon is
 * refused outright.
 *
 * Run:  npx tsx scripts/atlas-baked-score.ts <consumer-repo-path> [--json]
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import type { CanonicalDestination } from "../src/destinations-types";
import { deriveEstPerPerson, type ComposedTripInput } from "../src/trips/schema";

// ── types ─────────────────────────────────────────────────────────────────────

export interface PoolRow { name: string; url?: string }
export interface PoolInput {
  destinations: { id: string; city?: string; lodging: PoolRow[]; dining: PoolRow[]; activities: PoolRow[]; nightlife: PoolRow[] }[];
  golfCourses: { name: string; destinationId?: string; url?: string }[];
}
interface PoolHit { destinationId: string; url?: string }
export interface PoolIndex { byName: Map<string, PoolHit[]> }

export interface NormTrip {
  slug: string;
  destinationId?: string;
  city: string;
  narrative: string;
  faqs: { q: string; a: string }[];
  estPerPerson?: [number, number];
  lodging: string[];
  dining: string[];
  activities: string[];
  courses: string[];
  /** optional, absent from every atlas schema today */
  costLines?: { label: string; lo: number; hi: number }[];
  composed?: { input: ComposedTripInput; catalog: CanonicalDestination[] };
  verifiedPhotos?: { hero?: string; stops: Record<string, string> };
  schedule?: unknown;
  urls?: Record<string, string>;
}

export type Tier = "baked" | "partial" | "thin";
export interface TripScore {
  slug: string;
  passed: number;
  failed: number[];
  missing: string[];
  tier: Tier;
  point3: "NOT CHECKED";
}
export interface SiteSummary {
  site: string;
  total: number;
  baked: number;
  partial: number;
  thin: number;
  point3: "NOT CHECKED";
  topMissing: { detail: string; count: number }[];
  passByPoint: Record<string, number>;
}

// ── pool ──────────────────────────────────────────────────────────────────────

export const norm = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export function buildPoolIndex(pool: PoolInput): PoolIndex {
  const byName = new Map<string, PoolHit[]>();
  const add = (name: string, destinationId: string, url?: string) => {
    const k = norm(name);
    if (!k) return;
    const l = byName.get(k) ?? [];
    l.push({ destinationId, url });
    byName.set(k, l);
  };
  for (const d of pool.destinations) {
    for (const r of [...d.lodging, ...d.dining, ...d.activities, ...d.nightlife]) add(r.name, d.id, r.url);
  }
  for (const c of pool.golfCourses) add(c.name, c.destinationId ?? "", c.url);
  return { byName };
}

function lookup(idx: PoolIndex, name: string, destinationId?: string): PoolHit | undefined {
  const hits = idx.byName.get(norm(name));
  if (!hits || hits.length === 0) return undefined;
  if (destinationId) {
    const here = hits.filter((h) => h.destinationId === destinationId);
    if (here.length) return here.find((h) => h.url) ?? here[0];
  }
  return undefined; // a name that only exists in ANOTHER destination is not this trip's venue
}

// ── scoring ───────────────────────────────────────────────────────────────────

const FILLER = [
  "perfect for", "unforgettable", "something for everyone", "memories to last",
  "memories that last", "has it all", "like no other", "hidden gem",
];

/** `requireFaqs` is false only for a schema with no faqs field at all (Handicap HQ). */
export interface ScoreOpts { minNarrativeChars: number; requireFaqs?: boolean }

export function scoreTrip(t: NormTrip, idx: PoolIndex, opts: ScoreOpts): TripScore {
  const missing: string[] = [];
  const failed: number[] = [];
  const fail = (p: number, why: string) => {
    if (!failed.includes(p)) failed.push(p);
    missing.push(why);
  };

  const slots = [...t.lodging, ...t.dining, ...t.activities, ...t.courses];

  // 1 — pool venues for every slot
  let p1 = true;
  if (t.lodging.length === 0) { p1 = false; missing.push("p1: no stay slot"); }
  if (t.dining.length === 0) { p1 = false; missing.push("p1: no meal slot"); }
  if (t.activities.length + t.courses.length === 0) { p1 = false; missing.push("p1: no activity slot"); }
  const resolved = new Map<string, PoolHit | undefined>();
  for (const s of slots) resolved.set(s, lookup(idx, s, t.destinationId));
  if ([...resolved.values()].some((h) => !h)) { p1 = false; missing.push("p1: venue not in pool"); }
  if (!p1) { if (!failed.includes(1)) failed.push(1); }

  // 2 — every venue has a url
  const hasUrl = (s: string) => Boolean(resolved.get(s)?.url || t.urls?.[s]);
  if (slots.length === 0 || !slots.every(hasUrl)) fail(2, "p2: venue without url");

  // 4 — verified photo, hero + every stop (proxy: field presence only)
  const ph = t.verifiedPhotos;
  if (!ph || !ph.hero || !slots.every((s) => Boolean(ph.stops[s]))) fail(4, "p4: no verified photos (hero + stops)");

  // 5 — cost reconciles (proxy)
  if (!costReconciles(t)) fail(5, "p5: cost arithmetic missing or does not reconcile");

  // 6 — why-copy (proxy)
  const text = t.narrative ?? "";
  const lower = text.toLowerCase();
  const names = slots.map(norm).filter(Boolean);
  const nt = norm(text);
  const specific = names.some((n) => nt.includes(n)) || (norm(t.city) !== "" && nt.includes(norm(t.city)));
  const filler = FILLER.some((f) => lower.includes(f));
  if (text.length < opts.minNarrativeChars || !specific || filler || (opts.requireFaqs !== false && t.faqs.length < 3)) {
    fail(6, "p6: why-copy thin or generic (proxy)");
  }

  if (t.schedule === undefined) missing.push("info: no schedule with times (not a gate point)");

  failed.sort((a, b) => a - b);
  const passed = 5 - failed.length;
  const tier: Tier = passed === 5 ? "baked" : passed >= 3 ? "partial" : "thin";
  return { slug: t.slug, passed, failed, missing, tier, point3: "NOT CHECKED" };
}

function costReconciles(t: NormTrip): boolean {
  const head = t.estPerPerson;
  if (!head) return false;
  if (t.composed) {
    try {
      const [lo, hi] = deriveEstPerPerson(t.composed.input, t.composed.catalog);
      return lo === head[0] && hi === head[1];
    } catch {
      return false;
    }
  }
  if (t.costLines && t.costLines.length > 0) {
    const lo = t.costLines.reduce((a, l) => a + l.lo, 0);
    const hi = t.costLines.reduce((a, l) => a + l.hi, 0);
    return lo === head[0] && hi === head[1];
  }
  return false;
}

export function summarise(site: string, scores: TripScore[]): SiteSummary {
  const counts = new Map<string, number>();
  const passByPoint: Record<string, number> = { "1": 0, "2": 0, "4": 0, "5": 0, "6": 0 };
  for (const s of scores) {
    for (const m of new Set(s.missing)) counts.set(m, (counts.get(m) ?? 0) + 1);
    for (const p of [1, 2, 4, 5, 6]) if (!s.failed.includes(p)) passByPoint[String(p)]++;
  }
  return {
    site,
    total: scores.length,
    baked: scores.filter((s) => s.tier === "baked").length,
    partial: scores.filter((s) => s.tier === "partial").length,
    thin: scores.filter((s) => s.tier === "thin").length,
    point3: "NOT CHECKED",
    topMissing: [...counts.entries()].map(([detail, count]) => ({ detail, count })).sort((a, b) => b.count - a.count || a.detail.localeCompare(b.detail)),
    passByPoint,
  };
}

// ── loading consumer repos (read-only) ────────────────────────────────────────

interface SiteSpec { site: string; files: { file: string; exports: string[] }[]; minNarrativeChars: number; shape: "feral" | "fm" | "golf" }

function detectSite(repo: string): SiteSpec {
  const d = (f: string) => path.join(repo, "src/data", f);
  if (fs.existsSync(d("atlas-trips.ts")) && fs.existsSync(d("atlas-types.ts"))) {
    return { site: "friendsmoon", shape: "fm", minNarrativeChars: 200, files: [{ file: d("atlas-trips.ts"), exports: ["ATLAS_TRIPS"] }] };
  }
  if (fs.existsSync(d("golf-atlas.ts"))) {
    return { site: "handicap-hq", shape: "golf", minNarrativeChars: 300, files: [{ file: d("golf-atlas.ts"), exports: ["GOLF_ATLAS"] }] };
  }
  if (fs.existsSync(d("feral-trips.ts"))) {
    return { site: "maid-of-honor-hq", shape: "feral", minNarrativeChars: 300, files: [{ file: d("feral-trips.ts"), exports: ["FERAL_TRIPS"] }] };
  }
  if (fs.existsSync(d("unhinged-trips.ts"))) {
    return { site: "plan-my-party", shape: "feral", minNarrativeChars: 300, files: [{ file: d("unhinged-trips.ts"), exports: ["UNHINGED_TRIPS"] }] };
  }
  throw new Error(`no atlas data file recognised under ${repo}/src/data`);
}

const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? [v] : []);

/** Map one raw consumer record to the scorer's shape. Exported for tests. */
export function normalise(raw: any, shape: SiteSpec["shape"]): NormTrip {
  const faqs = Array.isArray(raw.faqs) ? raw.faqs : [];
  const base = {
    slug: String(raw.slug ?? raw.id ?? ""),
    destinationId: typeof raw.destinationId === "string" ? raw.destinationId : undefined,
    city: String(raw.destination ?? raw.title ?? "").split(",")[0].trim(),
    faqs,
    estPerPerson: Array.isArray(raw.estPerPerson) && raw.estPerPerson.length === 2 ? (raw.estPerPerson as [number, number]) : undefined,
    schedule: raw.schedule ?? raw.itinerary ?? raw.days,
    costLines: raw.costLines,
    verifiedPhotos: raw.verifiedPhotos,
  };
  if (shape === "golf") {
    return { ...base, narrative: [raw.blurb, raw.whyPilgrimage].filter(Boolean).join(" "), lodging: [], dining: [], activities: [], courses: strs(raw.marqueeCourses), city: String(raw.title ?? "") };
  }
  if (shape === "fm") {
    return { ...base, narrative: String(raw.narrative ?? ""), lodging: strs(raw.house), dining: strs(raw.dining), activities: strs(raw.activities), courses: [] };
  }
  return { ...base, narrative: String(raw.narrative ?? ""), lodging: strs(raw.lodging), dining: strs(raw.dining), activities: strs(raw.activities), courses: [] };
}

export async function loadPool(): Promise<PoolIndex> {
  const m: any = await import("../src/index");
  const rows = (a: any[] | undefined): PoolRow[] => (a ?? []).map((r) => ({ name: r.name, url: r.url ?? undefined }));
  const destinations = (m.sharedDestinations as any[]).map((d) => ({
    id: d.id, city: d.city, lodging: rows(d.lodging), dining: rows(d.dining), activities: rows(d.activities), nightlife: rows(d.nightlife),
  }));
  const golfCourses = ((m.ALL_GOLF_COURSES ?? []) as any[]).map((c) => ({ name: c.name, destinationId: c.destinationId ?? String(c.id ?? "").split("--")[0], url: c.url ?? c.website ?? undefined }));
  return buildPoolIndex({ destinations, golfCourses });
}

export async function scoreRepo(repo: string): Promise<{ summary: SiteSummary; scores: TripScore[]; spec: SiteSpec }> {
  const resolved = path.resolve(repo);
  if (/(^|\/)indiamoon(\/|$)/.test(resolved)) throw new Error("refusing to read indiamoon (personal site, excluded)");
  const spec = detectSite(resolved);
  const idx = await loadPool();
  const trips: NormTrip[] = [];
  for (const f of spec.files) {
    const mod: any = await import(pathToFileURL(f.file).href);
    for (const e of f.exports) for (const raw of mod[e] ?? mod.default?.[e] ?? []) trips.push(normalise(raw, spec.shape));
  }
  const scores = trips.map((t) => scoreTrip(t, idx, { minNarrativeChars: spec.minNarrativeChars, requireFaqs: spec.shape !== "golf" }));
  return { summary: summarise(spec.site, scores), scores, spec };
}

function table(s: SiteSummary): string {
  const rows = [
    `${s.site}: ${s.total} trips | baked ${s.baked} | partial ${s.partial} | thin ${s.thin} | point 3 (url 2xx): ${s.point3}`,
    `  trips passing each point: ${Object.entries(s.passByPoint).map(([p, n]) => `p${p}=${n}`).join(" ")}`,
    "  top missing details:",
    ...s.topMissing.map((m) => `    ${String(m.count).padStart(4)}  ${m.detail}`),
  ];
  return rows.join("\n");
}

if (process.argv[1] && /atlas-baked-score\.ts$/.test(process.argv[1])) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const repo = args.find((a) => !a.startsWith("--"));
  if (!repo) {
    console.error("usage: npx tsx scripts/atlas-baked-score.ts <consumer-repo-path> [--json]");
    process.exit(2);
  }
  scoreRepo(repo).then(({ summary }) => {
    console.log(json ? JSON.stringify(summary, null, 2) : table(summary));
  }).catch((e) => { console.error(String(e.message ?? e)); process.exit(1); });
}
