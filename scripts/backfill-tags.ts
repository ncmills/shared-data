/**
 * backfill-tags.ts — Phase-2 cross-tag backfill runner (Task 7).
 *
 * Applies `deriveRouting().core` over the ENTIRE universe and bakes the resulting
 * `wizards / audiences / products` onto every row as a UNION with whatever the row
 * already carries — it only ever ADDS reachability, never subtracts (the superset
 * invariant). This is the one place the safe-core cross-tags are materialized for
 * every consumer, mirroring how party items are baked in `destinations-bake.ts` and
 * how residences get their wizard view in `residencesForSite`.
 *
 * ── Why a load-time DERIVED view, not a source edit ──────────────────────────
 * Golf (`golf-courses.ts`), residences, locals and tdf-destinations are REGEN-ONLY
 * ("DO NOT hand-edit") and several are PINNED by `verify-universe.ts` (e.g.
 * tdf-dest.wizards must equal ["tdf"] exactly; golf.sites ⊆ {tdf,offsite,handicap}).
 * Baking extra `wizards` INTO those rows would either require editing regen-only
 * data or break those pinned invariants. So — per the task's explicit fallback —
 * we produce a parallel EXPORTED backfilled view (`backfillUniverse()`) and never
 * mutate the source data. `verify` stays green because the source is untouched.
 *
 * Heterogeneous tag shapes, handled per dataset:
 *   - party items  — already baked with party-venue core at module load
 *                    (destinations-bake). Union is a no-op; superset holds trivially.
 *   - golf         — legacy `sites[]` (no `wizards`). pre = sites→wizards; core adds
 *                    `handicap` (HHQ). Golf NEVER routes to moh (brand guard).
 *   - residences   — pre from products (offsite-retreat[/outing]); core is
 *                    [offsite-retreat, offsite-outing] → retreat-only residences GAIN
 *                    offsite-outing (OO outing reads residences live, Task 6).
 *   - tdf-dests    — pre = ["tdf"]; core (golf-destination) adds `handicap`.
 *   - locals       — brand-scoped destinations; no other engine reads another brand's
 *                    locals, so there is NO cross-tag. core = pre (single brand).
 *   - OO exp/outing— already carry offsite core; corporate-coded → no party cross-tag.
 *
 * `expand` reach (relevant-but-not-yet-consumed) is recorded to docs/expand-set.json
 * for Task 8 review and is NEVER baked into `postWizards`.
 *
 * Run:  npx tsx scripts/backfill-tags.ts      (writes the two docs)
 * Test: npx tsx --test scripts/backfill-tags.test.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  sharedDestinations,
  SHARED_GOLF_COURSES,
  SHARED_GOLF_COURSES_HHQ_MERGE,
  residencesForSite,
  SHARED_TDF_DESTINATIONS,
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
} from "../src/index";
import { deriveRouting, type EntityKind } from "../src/tagging-rules";
import type { WizardTag, AudienceTag, ProductTag } from "../src/tags";

const uniq = <T>(xs: T[]): T[] => Array.from(new Set(xs));
const union = <T>(a: T[], b: T[]): T[] => uniq([...a, ...b]);

export type Dataset =
  | "party"
  | "golf"
  | "residence"
  | "tdf-destination"
  | "moh-local"
  | "bestman-local"
  | "oo-experience"
  | "oo-outing";

export interface BackfilledRow {
  id: string;
  dataset: Dataset;
  /** deriveRouting EntityKind used (or a brand-local label for locals) */
  kind: EntityKind | "moh-local" | "bestman-local";
  preWizards: WizardTag[];
  coreWizards: WizardTag[];
  postWizards: WizardTag[];
  audiences: AudienceTag[];
  products: ProductTag[];
  expand: { wizards: WizardTag[]; reason: string }[];
}

/** legacy golf `sites` → wizard vocabulary (mirrors count-by-wizard mapping). */
function sitesToWizards(sites: string[] = []): WizardTag[] {
  const w: WizardTag[] = [];
  if (sites.includes("tdf")) w.push("tdf");
  if (sites.includes("offsite")) w.push("offsite-retreat", "offsite-outing");
  if (sites.includes("handicap")) w.push("handicap");
  return uniq(w);
}

/** party category → party-venue sub-kind for the audience taxonomy. */
const VENUE_TYPE: Record<string, "activity" | "dining" | "nightlife" | "lodging" | "transport"> = {
  activities: "activity",
  dining: "dining",
  nightlife: "nightlife",
  lodging: "lodging",
  transport: "transport",
};
const PARTY_CATS = ["nightlife", "dining", "activities", "lodging", "transport"] as const;

/**
 * Build the whole backfilled universe as a derived view. Pure — never mutates
 * source data. `postWizards = union(preWizards, coreWizards)`.
 */
export function backfillUniverse(): BackfilledRow[] {
  const out: BackfilledRow[] = [];

  const push = (
    id: string,
    dataset: Dataset,
    kind: BackfilledRow["kind"],
    preWizards: WizardTag[],
    core: { wizards: WizardTag[]; audiences: AudienceTag[]; products: ProductTag[] },
    prePost: { audiences?: AudienceTag[]; products?: ProductTag[] },
    expand: { wizards: WizardTag[]; reason: string }[],
  ) => {
    out.push({
      id,
      dataset,
      kind,
      preWizards: uniq(preWizards),
      coreWizards: uniq(core.wizards),
      postWizards: union(preWizards, core.wizards),
      audiences: union(prePost.audiences ?? [], core.audiences),
      products: union(prePost.products ?? [], core.products),
      // expand entries with a genuine, non-empty target set only
      expand: expand.filter((e) => e.wizards.length > 0),
    });
  };

  // ── party destination items ────────────────────────────────────────────────
  // Already baked with party-venue core (destinations-bake). Re-derive to prove
  // the union is a no-op and to keep a single tagging source.
  for (const d of sharedDestinations) {
    for (const cat of PARTY_CATS) {
      for (const it of (d as Record<string, any>)[cat] ?? []) {
        const r = deriveRouting({
          kind: "party-venue",
          venueType: VENUE_TYPE[cat],
          activityType: it.type,
          vibe: it.vibe,
          brands: it.brands,
          audiences: it.audiences,
        });
        push(
          `${d.id}|${cat}|${it.name}`,
          "party",
          "party-venue",
          (it.wizards ?? []) as WizardTag[],
          r.core,
          { audiences: it.audiences, products: it.products },
          r.expand,
        );
      }
    }
  }

  // ── golf courses ────────────────────────────────────────────────────────────
  for (const c of [...SHARED_GOLF_COURSES, ...SHARED_GOLF_COURSES_HHQ_MERGE]) {
    const r = deriveRouting({ kind: "golf-course" });
    push(
      `${c.name}|${c.city},${c.state}`,
      "golf",
      "golf-course",
      sitesToWizards(c.sites),
      r.core,
      { products: c.products as ProductTag[] },
      r.expand,
    );
  }

  // ── residences ──────────────────────────────────────────────────────────────
  for (const res of residencesForSite("offsite")) {
    const r = deriveRouting({
      kind: "residence",
      setting: res.setting,
      audiences: (res as Record<string, any>).audiences,
    });
    push(
      res.id,
      "residence",
      "residence",
      (res.wizards ?? []) as WizardTag[],
      r.core,
      { products: res.products as ProductTag[] },
      r.expand,
    );
  }

  // ── tdf destinations (golf-destination) ─────────────────────────────────────
  for (const t of SHARED_TDF_DESTINATIONS) {
    const r = deriveRouting({ kind: "golf-destination" });
    push(
      t.id,
      "tdf-destination",
      "golf-destination",
      (t.wizards ?? []) as WizardTag[],
      r.core,
      { products: t.products as ProductTag[] },
      r.expand,
    );
  }

  // ── locals (brand-scoped; no cross-tag) ─────────────────────────────────────
  // No engine reads another brand's locals, so there is no safe cross-tag and no
  // expansion candidate. core = pre (single brand) keeps brand separation intact.
  for (const m of mohLocals()) {
    const pre = (m.wizards ?? ["moh"]) as WizardTag[];
    push(m.id, "moh-local", "moh-local", pre, { wizards: pre, audiences: ["bachelorette"], products: ["bachelorette"] }, { products: m.products as ProductTag[] }, []);
  }
  for (const b of bestmanLocals()) {
    const pre = (b.wizards ?? ["bestman"]) as WizardTag[];
    push(b.id, "bestman-local", "bestman-local", pre, { wizards: pre, audiences: ["bachelor"], products: ["bach-party"] }, { products: b.products as ProductTag[] }, []);
  }

  // ── OO atlas experiences + outing templates ─────────────────────────────────
  const allExp = [
    ...ooExperiences, ...ooHeroExpAir, ...ooPoolExpAir, ...ooHeroExpWater,
    ...ooPoolExpWater, ...ooHeroExpWinter, ...ooPoolExpWinter,
  ] as Record<string, any>[];
  const allOut = [...ooSignatureOutings, ...ooHeroOutingsUrban, ...ooPoolOutingsUrban] as Record<string, any>[];

  for (const e of allExp) {
    const r = deriveRouting({ kind: "experience", activityType: e.kind, audiences: e.audiences });
    push(e.id, "oo-experience", "experience", (e.wizards ?? []) as WizardTag[], r.core, { audiences: e.audiences, products: e.products }, r.expand);
  }
  for (const o of allOut) {
    const r = deriveRouting({ kind: "outing-template", activityType: o.focus, audiences: o.audiences });
    push(o.id, "oo-outing", "outing-template", (o.wizards ?? []) as WizardTag[], r.core, { audiences: o.audiences, products: o.products }, r.expand);
  }

  return out;
}

// ─── expand set (Task 8 review artifact) ──────────────────────────────────────
export interface ExpandEntry {
  id: string;
  dataset: Dataset;
  kind: BackfilledRow["kind"];
  targetWizard: WizardTag;
  reason: string;
}

/** Flatten every row's expand candidates into per-target rows. */
export function buildExpandSet(rows: BackfilledRow[]): ExpandEntry[] {
  const out: ExpandEntry[] = [];
  for (const r of rows) {
    for (const e of r.expand) {
      for (const w of e.wizards) {
        out.push({ id: r.id, dataset: r.dataset, kind: r.kind, targetWizard: w, reason: e.reason });
      }
    }
  }
  return out;
}

// ─── coverage counts ──────────────────────────────────────────────────────────
export type CountWizard = WizardTag;
const ALL_WIZARDS: CountWizard[] = ["bestman", "moh", "tdf", "offsite-retreat", "offsite-outing", "handicap"];

/** Per-wizard row counts for a chosen phase ("pre" or "post"). */
export function coverageCounts(rows: BackfilledRow[], which: "pre" | "post"): Record<CountWizard, number> {
  const counts = Object.fromEntries(ALL_WIZARDS.map((w) => [w, 0])) as Record<CountWizard, number>;
  for (const r of rows) {
    const ws = which === "pre" ? r.preWizards : r.postWizards;
    for (const w of ws) counts[w as CountWizard]++;
  }
  return counts;
}

// ─── runner: write the two docs ───────────────────────────────────────────────
function writeDocs(rows: BackfilledRow[]) {
  const here = dirname(fileURLToPath(import.meta.url));
  const docsDir = join(here, "..", "docs");
  mkdirSync(docsDir, { recursive: true });

  // expand-set.json
  const expandSet = buildExpandSet(rows);
  writeFileSync(
    join(docsDir, "expand-set.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString().slice(0, 10),
        note: "Relevant-but-not-yet-consumed reach. NEVER baked into wizards — Task 8 review + prune before any engine is wired to read these.",
        total: expandSet.length,
        byTargetWizard: ALL_WIZARDS.reduce<Record<string, number>>((acc, w) => {
          const n = expandSet.filter((e) => e.targetWizard === w).length;
          if (n) acc[w] = n;
          return acc;
        }, {}),
        entries: expandSet,
      },
      null,
      2,
    ) + "\n",
  );

  // coverage-before-after.md
  const pre = coverageCounts(rows, "pre");
  const post = coverageCounts(rows, "post");
  const gained = rows.filter((r) => r.postWizards.length > r.preWizards.length);
  const gainByWizard = ALL_WIZARDS.reduce<Record<string, number>>((acc, w) => {
    acc[w] = rows.filter((r) => !r.preWizards.includes(w) && r.postWizards.includes(w)).length;
    return acc;
  }, {});

  const lines: string[] = [];
  lines.push("# Cross-tag backfill — coverage before / after");
  lines.push("");
  lines.push(`Generated by \`scripts/backfill-tags.ts\` on ${new Date().toISOString().slice(0, 10)}.`);
  lines.push("");
  lines.push(`Universe rows: **${rows.length}**. Rows that GAINED ≥1 wizard: **${gained.length}**.`);
  lines.push("");
  lines.push("Per-wizard row coverage (a row counts once per wizard it carries):");
  lines.push("");
  lines.push("| wizard | before | after | Δ | rows newly gaining it |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const w of ALL_WIZARDS) {
    lines.push(`| ${w} | ${pre[w]} | ${post[w]} | +${post[w] - pre[w]} | ${gainByWizard[w]} |`);
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- **party** items were already baked with party-venue core at module load (`destinations-bake.ts`); the backfill union is a no-op for them (superset holds trivially).");
  lines.push("- **golf** rows gain `handicap` (HHQ reads courses) on top of the `sites`→wizard mapping; golf never routes to `moh` (brand guard).");
  lines.push("- **residences** with products `[retreat]` gain `offsite-outing` (OO outing reads residences live, Task 6).");
  lines.push("- **tdf-destinations** gain `handicap` (golf-destination core).");
  lines.push("- **locals** are brand-scoped; no engine reads another brand's locals, so they carry no cross-tag and stay single-brand.");
  lines.push("- Baked view is DERIVED at load time; source data rows (regen-only + `verify`-pinned) are never mutated.");
  lines.push("");
  writeFileSync(join(docsDir, "coverage-before-after.md"), lines.join("\n"));

  return { rows: rows.length, gained: gained.length, expand: expandSet.length, pre, post };
}

// ESM "run as script" guard
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const rows = backfillUniverse();
  const s = writeDocs(rows);
  console.log(`backfill: ${s.rows} rows · ${s.gained} gained a wizard · expand-set ${s.expand} entries`);
  console.log("per-wizard before → after:");
  for (const w of ALL_WIZARDS) console.log(`  ${w}: ${s.pre[w]} → ${s.post[w]} (+${s.post[w] - s.pre[w]})`);
  console.log("wrote docs/expand-set.json + docs/coverage-before-after.md");
}
