/**
 * gap-queue.ts — Phase 4 step 1: turns the audit's starved cells (Task 11,
 * `findStarved`) into a ranked expansion work-list, prioritized by AGGREGATE
 * LEVERAGE so gaps that compound across the most wizards rise to the top.
 *
 * A starved cell (`{ wizard, cell, count }`) only tells you ONE wizard is
 * thin in that spot. But the underlying DATASET a cell draws from (party /
 * golf / residence) is often shared: filling a golf gap helps every wizard
 * whose engine reads golf-course rows, not just the one wizard whose input
 * space happened to enumerate that cell. `ENGINE_READS` (src/engine-reads.ts)
 * is the ground truth for "which wizards' engines actually consume this
 * entity kind" — this file does a REVERSE lookup over it (never a hardcoded
 * per-dataset wizard list) so it automatically stays correct as engines pick
 * up new reads (e.g. Task 10b added `bestman` to `golf-course`'s readers).
 *
 * Dataset inference: `findStarvedIn` (starved-inputs.ts) already commits each
 * wizard's cell to exactly one EntityKind when it counts matching rows —
 * bestman/moh/offsite-outing count party-venue rows, handicap/tdf count
 * golf-course rows, offsite-retreat counts residence rows (see
 * `WIZARD_TO_STARVED_KIND` below, mirroring those branches 1:1). That kind is
 * then reverse-looked-up against `ENGINE_READS` to get `wizardsServed`.
 *
 * `leverageScore = deficit × wizardsServed.length × seoWeight`. `seoWeight`
 * is a documented per-wizard table (see `SEO_WEIGHT`) — today every wizard
 * (Planning-cluster and otherwise) is 1.0, a deliberate no-op seam for future
 * differentiation (e.g. if a non-Planning-cluster wizard should count less),
 * not a currently-active penalty.
 *
 * Run:  npx tsx scripts/gap-queue.ts        (writes docs/gap-queue.json)
 * Test: npx tsx --test scripts/gap-queue.test.ts
 */

import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { findStarved, type Starved } from "./audit/starved-inputs";
import { ENGINE_READS } from "../src/engine-reads";
import type { WizardTag } from "../src/tags";
import type { EntityKind } from "../src/tagging-rules";

export interface GapTask {
  id: string;
  dataset: string;
  cell: Record<string, string>;
  deficit: number;
  wizardsServed: WizardTag[];
  leverageScore: number;
}

/**
 * Which EntityKind a starved cell's row-count is actually drawn from, per
 * wizard — mirrors the `if/else if` branches in `findStarvedIn`
 * (starved-inputs.ts) 1:1. Two wizards (bestman/moh) share `party-venue`
 * with offsite-outing's corporate-eligible subset of the same kind;
 * handicap/tdf share `golf-course`; offsite-retreat is the sole
 * `residence` reader among the starved-cell axes (it also reads golf-course
 * per ENGINE_READS, but its INPUT-SPACE cell — setting × worldRegion — is
 * counted against residences only, so that's the dataset a residence gap
 * in this queue refers to).
 */
const WIZARD_TO_STARVED_KIND: Record<WizardTag, EntityKind> = {
  bestman: "party-venue",
  moh: "party-venue",
  "offsite-outing": "party-venue",
  handicap: "golf-course",
  tdf: "golf-course",
  "offsite-retreat": "residence",
};

/** Human-readable dataset label per EntityKind (for the `dataset` field). */
const KIND_TO_DATASET: Record<EntityKind, string> = {
  "party-venue": "party",
  "golf-course": "golf",
  residence: "residence",
  experience: "experience",
  "outing-template": "outing-template",
  "golf-destination": "golf-destination",
};

/**
 * seoWeight table. Planning-cluster surfaces (Offsite Outpost, Handicap HQ,
 * Best Man HQ, Maid of Honor HQ) are the sites actually pursuing SEO growth
 * (see `feedback_personal_sites_no_seo`) — they're listed explicitly at 1.0
 * so the seam is documented, not because the value differs from the
 * default. Everything else (including `tdf`, now a personal/no-SEO site)
 * also resolves to 1.0 via `DEFAULT_SEO_WEIGHT` today. Kept as a per-wizard
 * table (not a constant) so a future differentiation — e.g. down-weighting
 * non-SEO surfaces — is a one-line change here, not a refactor.
 */
const DEFAULT_SEO_WEIGHT = 1.0;
const SEO_WEIGHT: Partial<Record<WizardTag, number>> = {
  "offsite-retreat": 1.0, // Planning cluster (OO)
  "offsite-outing": 1.0, // Planning cluster (OO)
  handicap: 1.0, // Planning cluster (HHQ)
  bestman: 1.0, // Planning cluster (BM)
  moh: 1.0, // Planning cluster (MOH)
};

function seoWeightFor(wizard: WizardTag): number {
  return SEO_WEIGHT[wizard] ?? DEFAULT_SEO_WEIGHT;
}

/** All wizards whose ENGINE_READS includes `kind`, in ENGINE_READS' own key order (deterministic). */
function wizardsServedFor(kind: EntityKind): WizardTag[] {
  return (Object.keys(ENGINE_READS) as WizardTag[]).filter((w) => ENGINE_READS[w].includes(kind));
}

/** Stable `id` for a starved cell: wizard + sorted "key=value" cell pairs. */
function idFor(wizard: WizardTag, cell: Record<string, string>): string {
  const pairs = Object.keys(cell)
    .sort()
    .map((k) => `${k}=${cell[k]}`)
    .join(";");
  return `${wizard}:${pairs}`;
}

/**
 * Core, test-friendly builder — takes a `Starved[]` (real or synthetic) and
 * the same `threshold` `findStarved` was run with, and returns the ranked
 * `GapTask[]` queue. No file I/O, no live-data dependency.
 */
export function buildGapQueueFrom(starved: Starved[], threshold = 3): GapTask[] {
  const tasks: GapTask[] = starved.map((s) => {
    const kind = WIZARD_TO_STARVED_KIND[s.wizard];
    const dataset = KIND_TO_DATASET[kind];
    const wizardsServed = wizardsServedFor(kind);
    const deficit = threshold - s.count;
    const leverageScore = deficit * wizardsServed.length * seoWeightFor(s.wizard);
    return {
      id: idFor(s.wizard, s.cell),
      dataset,
      cell: s.cell,
      deficit,
      wizardsServed,
      leverageScore,
    };
  });

  // Stable descending sort by leverageScore (Array#sort is stable per spec;
  // ties keep the input's relative order rather than reordering arbitrarily).
  return tasks.slice().sort((a, b) => b.leverageScore - a.leverageScore);
}

/** Full run against the real, live starved-cell audit (threshold=3). */
export function buildGapQueue(): GapTask[] {
  const threshold = 3;
  return buildGapQueueFrom(findStarved(threshold), threshold);
}

// ESM "run as script" guard
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const queue = buildGapQueue();

  const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "gap-queue.json");
  writeFileSync(outPath, `${JSON.stringify(queue, null, 2)}\n`);

  console.log(`gap-queue: ${queue.length} task(s) written to docs/gap-queue.json`);
  console.log(`top ${Math.min(5, queue.length)}:`);
  for (const t of queue.slice(0, 5)) {
    console.log(
      `  ${t.leverageScore.toFixed(1).padStart(6)}  ${t.dataset.padEnd(10)} deficit=${t.deficit} servedBy=[${t.wizardsServed.join(",")}]  ${JSON.stringify(t.cell)}`,
    );
  }
}
