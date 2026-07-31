/**
 * backfill-queue.ts — enumerate party rows that carry NO followable source.
 *
 * `gap-queue.ts` enumerates starved CELLS (a dimension short of rows) and feeds
 * the INSERT path. This is its sibling for the ENRICH path: it enumerates
 * existing rows missing a `url`, and feeds the PATCH path
 * (`dataset: "party-venue-patch"` → `party-venue-patches.ts`).
 *
 * WHY THIS GAP IS INVISIBLE TO EVERY EXISTING AUDIT. A row with no source is
 * still a structurally valid row: it has a name, a price, a highlight, and it
 * renders. `verify-universe`, `check-brand-rules` and the coverage matrix all
 * pass on it. Nothing in the repo counts it. Measured 2026-07-31:
 *
 *   6,225 party rows · 47 with a `url` · 0 with a `sourceUrl`
 *   activities 9/2161 · dining 21/1319 · nightlife 17/1512
 *   lodging 0/771 · transport 0/462
 *
 * Golf proves the harness can close this: 877 of 999 courses carry one.
 *
 * Run: npx tsx scripts/backfill-queue.ts
 */
import { sharedDestinations } from "../src/index";
import type { CanonicalDestination } from "../src/destinations-types";
import type { PartyVenueCategory } from "../src/research-schema";
import type { WizardTag } from "../src/tags";

/** One unit of backfill work: the unsourced venues of ONE category in ONE city. */
export interface BackfillTask {
  /** `url-backfill:<destinationId>:<category>` — unique + self-describing. */
  id: string;
  destinationId: string;
  city: string;
  state: string;
  category: PartyVenueCategory;
  /** Exact names of the rows missing a source, in catalog order. */
  venues: string[];
  /** Every wizard that renders at least one of these rows. */
  wizardsServed: WizardTag[];
  /**
   * Rows-missing × wizards-served. Rows-missing is the work closed; the wizard
   * multiplier breaks ties toward data that more sites actually surface. No
   * category weighting — that would encode a guess about which surface matters,
   * and the row counts already say it.
   */
  leverageScore: number;
}

export interface BackfillQueue {
  tasks: BackfillTask[];
  /** Party rows scanned, across the WHOLE universe — never just the returned tasks. */
  totalRows: number;
  /** Party rows with no `url`, across the WHOLE universe. */
  totalUnsourced: number;
  /**
   * Tasks withheld by `limit`. Explicit because a queue that quietly returns
   * the top N reads as "that is all there is" — the silent-truncation failure
   * this repo has been bitten by.
   */
  droppedTasks: number;
}

export interface BackfillQueueOptions {
  /** Return at most this many tasks. The withheld count is always reported. */
  limit?: number;
}

const CATEGORIES: readonly { category: PartyVenueCategory; field: keyof CanonicalDestination }[] = [
  { category: "activity", field: "activities" },
  { category: "dining", field: "dining" },
  { category: "nightlife", field: "nightlife" },
  { category: "lodging", field: "lodging" },
  { category: "transport", field: "transport" },
];

/** A row is sourced iff it carries a non-blank `url`. */
function isSourced(row: { url?: unknown }): boolean {
  return typeof row.url === "string" && row.url.trim().length > 0;
}

export function buildBackfillQueue(
  destinations: CanonicalDestination[] = sharedDestinations,
  opts: BackfillQueueOptions = {},
): BackfillQueue {
  const tasks: BackfillTask[] = [];
  let totalRows = 0;
  let totalUnsourced = 0;

  for (const dest of destinations) {
    for (const { category, field } of CATEGORIES) {
      const rows = (dest[field] as { name: string; url?: unknown; wizards?: WizardTag[] }[]) ?? [];
      if (rows.length === 0) continue;
      totalRows += rows.length;

      const missing = rows.filter((r) => !isSourced(r));
      if (missing.length === 0) continue;
      totalUnsourced += missing.length;

      const wizardsServed = [...new Set(missing.flatMap((r) => r.wizards ?? []))].sort();
      tasks.push({
        id: `url-backfill:${dest.id}:${category}`,
        destinationId: dest.id,
        city: dest.city,
        state: dest.state,
        category,
        venues: missing.map((r) => r.name),
        wizardsServed,
        leverageScore: missing.length * Math.max(1, wizardsServed.length),
      });
    }
  }

  // Highest leverage first; ties broken by id so the order is total and stable
  // across runs (an unattended job must not reshuffle its own queue).
  tasks.sort((a, b) => b.leverageScore - a.leverageScore || a.id.localeCompare(b.id));

  const limit = opts.limit;
  const kept = typeof limit === "number" ? tasks.slice(0, Math.max(0, limit)) : tasks;

  return {
    tasks: kept,
    totalRows,
    totalUnsourced,
    droppedTasks: tasks.length - kept.length,
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const q = buildBackfillQueue();
  const pct = q.totalRows === 0 ? 0 : ((q.totalRows - q.totalUnsourced) / q.totalRows) * 100;
  console.log(`backfill-queue — party rows with no followable source\n`);
  console.log(
    `${q.totalUnsourced} of ${q.totalRows} rows unsourced ` +
      `(${pct.toFixed(1)}% sourced) across ${q.tasks.length} task(s)\n`,
  );
  for (const t of q.tasks.slice(0, 20)) {
    console.log(
      `  ${String(t.leverageScore).padStart(4)}  ${t.id}  ` +
        `${t.venues.length} venue(s) · ${t.city}, ${t.state} · ${t.wizardsServed.join("/")}`,
    );
  }
  if (q.tasks.length > 20) console.log(`  … and ${q.tasks.length - 20} more task(s)`);
}
