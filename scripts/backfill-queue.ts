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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  /** Venues past `maxAttempts` and no longer offered. Reported, never hidden. */
  exhausted: number;
  /** `<destinationId>/<category>: <name>` for each, so the residue is legible. */
  exhaustedVenues: string[];
}

export interface BackfillQueueOptions {
  /** Return at most this many tasks. The withheld count is always reported. */
  limit?: number;
  /**
   * Split a category's venues into tasks of at most this many.
   *
   * ONE TASK IS ONE RESEARCH CALL, so this bounds how much a single
   * `claude -p` invocation has to verify. Observed 2026-07-31: a 25-venue New
   * York task blew the 180s researcher timeout, and because `claudeResearcher`
   * is fail-safe it returned `[]` — which the run reported as "0 researched,
   * 0 rejected", indistinguishable from genuinely finding nothing. Bounding
   * the unit is the fix; raising the timeout alone just moves the cliff.
   *
   * Unset means one task per category, the original behaviour.
   */
  maxVenuesPerTask?: number;
  /**
   * How many times each venue has already been researched without producing a
   * url, keyed `<destinationId>|<category>|<normalised name>`.
   *
   * The queue re-derives purely from "still unsourced", so without this a venue
   * that CANNOT be sourced — a generic activity name with no business behind it
   * — is offered again every run and crowds out venues that can be. Measured
   * across the 31-batch run: `atlantic-city-nj:dining#1` returned 0 valid twice
   * running, and yield fell from 22/batch to 3/batch as the queue head filled
   * with residue.
   */
  attempts?: Record<string, number>;
  /**
   * Attempts after which a venue stops being offered. Default 3.
   *
   * It stops being OFFERED, not counted: `totalUnsourced` still includes it and
   * `exhausted` reports it. A venue that failed twice may be findable later, and
   * quietly discarding work is how coverage numbers start lying.
   */
  maxAttempts?: number;
}

const CATEGORIES: readonly { category: PartyVenueCategory; field: keyof CanonicalDestination }[] = [
  { category: "activity", field: "activities" },
  { category: "dining", field: "dining" },
  { category: "nightlife", field: "nightlife" },
  { category: "lodging", field: "lodging" },
  { category: "transport", field: "transport" },
];

/** Venue-name normalisation — same shape the patch layer and the drift guard
 *  use, so an attempt recorded by one is recognised by the other. */
const norm = (s: string): string => s.trim().toLowerCase();

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
  let exhausted = 0;
  const exhaustedVenues: string[] = [];

  for (const dest of destinations) {
    for (const { category, field } of CATEGORIES) {
      const rows = (dest[field] as { name: string; url?: unknown; wizards?: WizardTag[] }[]) ?? [];
      if (rows.length === 0) continue;
      totalRows += rows.length;

      const missing = rows.filter((r) => !isSourced(r));
      if (missing.length === 0) continue;
      totalUnsourced += missing.length;

      const wizardsServed = [...new Set(missing.flatMap((r) => r.wizards ?? []))].sort();

      // Least-attempted first, so fresh venues lead and residue sinks. Stable
      // within an attempt count (catalog order preserved) so the queue does not
      // reshuffle itself between runs.
      const attemptOf = (name: string) =>
        opts.attempts?.[`${dest.id}|${category}|${norm(name)}`] ?? 0;
      const ceiling = opts.maxAttempts ?? 3;

      const offerable = missing.filter((r) => {
        if (attemptOf(r.name) < ceiling) return true;
        exhausted++;
        exhaustedVenues.push(`${dest.id}/${category}: ${r.name}`);
        return false;
      });
      if (offerable.length === 0) continue;

      const names = offerable
        .map((r, i) => ({ name: r.name, a: attemptOf(r.name), i }))
        .sort((x, y) => x.a - y.a || x.i - y.i)
        .map((x) => x.name);
      const size = opts.maxVenuesPerTask && opts.maxVenuesPerTask > 0 ? opts.maxVenuesPerTask : names.length;

      // Chunked, never truncated — every venue lands in exactly one task.
      const chunkCount = Math.max(1, Math.ceil(names.length / size));
      for (let i = 0; i < chunkCount; i++) {
        const venues = names.slice(i * size, (i + 1) * size);
        if (venues.length === 0) continue;
        tasks.push({
          id: chunkCount === 1
            ? `url-backfill:${dest.id}:${category}`
            : `url-backfill:${dest.id}:${category}#${i + 1}`,
          destinationId: dest.id,
          city: dest.city,
          state: dest.state,
          category,
          venues,
          wizardsServed,
          leverageScore: venues.length * Math.max(1, wizardsServed.length),
        });
      }
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
    exhausted,
    exhaustedVenues,
  };
}

// ─── attempt record ────────────────────────────────────────────────────────
//
// Persisted so the deprioritisation actually survives between runs. Without
// this the `attempts` option would be inert — a knob nothing turns, which is
// the "built but unwired" shape this repo keeps finding.

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ATTEMPTS_PATH = join(HERE, "..", "docs", "backfill-attempts.json");

export function loadAttempts(path: string = DEFAULT_ATTEMPTS_PATH): Record<string, number> {
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    // A corrupt record must not silently reset every venue to zero attempts —
    // that would quietly resurrect the exact residue this exists to sink.
    throw new Error(`backfill-queue: ${path} is unreadable — fix or delete it deliberately`);
  }
}

/** Increment the venues that were ASKED ABOUT but produced no url this run. */
export function recordAttempts(
  asked: { destinationId: string; category: string; name: string }[],
  sourced: Set<string>,
  path: string = DEFAULT_ATTEMPTS_PATH,
): Record<string, number> {
  const attempts = loadAttempts(path);
  for (const v of asked) {
    const key = `${v.destinationId}|${v.category}|${norm(v.name)}`;
    if (sourced.has(key)) {
      delete attempts[key]; // it landed — forget the failures
      continue;
    }
    attempts[key] = (attempts[key] ?? 0) + 1;
  }
  writeFileSync(path, JSON.stringify(attempts, null, 2) + "\n");
  return attempts;
}

// ─── CLI ────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const q = buildBackfillQueue(undefined, { maxVenuesPerTask: 8, attempts: loadAttempts() });
  const pct = q.totalRows === 0 ? 0 : ((q.totalRows - q.totalUnsourced) / q.totalRows) * 100;

  /**
   * `--json` exists so a monitor can MEASURE the drain instead of parsing a
   * number out of a run log.
   *
   * The backfill watchdog read its drain figures from the last
   * "N of M party rows unsourced" line in ~/work/logs/url-backfill.log, with
   * the reasoning that a running state's latest write is the truth. That holds
   * only while one log has every writer. The 08-06 ASAP drain wrote to
   * url-backfill-drain.log instead, so 318 sourced rows were invisible: on
   * 08-07 the watchdog reported 6.8% sourced and "~200 weeks to drain" when the
   * catalog itself said 11.8%. The handoff it produced led with that number.
   *
   * The catalog is the only thing that knows how many rows are sourced, so ask
   * it. No log can go stale relative to itself.
   */
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({
      totalRows: q.totalRows,
      totalUnsourced: q.totalUnsourced,
      totalSourced: q.totalRows - q.totalUnsourced,
      pctSourced: Number(pct.toFixed(1)),
      tasks: q.tasks.length,
    }));
    process.exit(0);
  }

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