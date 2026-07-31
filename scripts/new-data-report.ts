/**
 * new-data-report.ts — the ADOPTION QUEUE.
 *
 * THE PROBLEM. A consuming site surfaces an activity only if BOTH are true:
 *   1. the row is tagged for that site's wizard (the bake, `destinations-bake.ts`), and
 *   2. the row's `type` is in that site's activity-type allowlist
 *      (`MOH_ACTIVITY_TYPES` / `BESTMAN_ACTIVITY_TYPES` in destinations-overlay.ts).
 *
 * Condition 2 fails SILENTLY. `applyMohOverlay` / `applyBestmanOverlay` filter
 * on the Set and drop anything unrecognised with no warning, no count, and no
 * error. So a correctly-tagged, fully-researched, URL-verified row carrying a
 * new `type` string lands in the cache, passes `npm run verify`, passes the
 * coverage audit — and never reaches a single user. This has happened before:
 * the comment at destinations-overlay.ts:30-37 records the 2026-04-20 audit
 * where `sleigh-ride`, `yacht-charter` and `painting-class` were being dropped
 * from MOH despite the MOH engine's own scoring explicitly checking for them.
 *
 * WHY THIS IS A FEATURE, NOT JUST A BUG. Nick's standing requirement when new
 * data lands for one wizard is that the OTHER wizards "evaluate the new data to
 * see if they should also use / incorporate it" — an explicit per-site decision,
 * not silent auto-adoption. The allowlist is exactly that gate. It is only
 * broken because it is invisible: there is no way to see what a site is
 * currently declining. This report makes the gate legible so the decision can
 * actually be made, one type at a time, per site.
 *
 * This is REPORT-ONLY and always exits 0. It is a queue for a human, not a
 * build gate — failing CI because a site hasn't yet adopted a new activity type
 * would be wrong; declining is a legitimate answer.
 *
 * Usage:
 *   npx tsx scripts/new-data-report.ts              # markdown to stdout
 *   npx tsx scripts/new-data-report.ts --write      # also writes docs/new-data-report.md
 *   npx tsx scripts/new-data-report.ts --json       # machine-readable
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { sharedDestinations } from "../src/index";
import { MOH_ACTIVITY_TYPES, BESTMAN_ACTIVITY_TYPES } from "../src/destinations-overlay";
import type { WizardTag } from "../src/tags";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(HERE, "..", "docs");

/**
 * Wizards whose overlay applies an activity-type allowlist, and the Set it uses.
 *
 * NOT a `Record<WizardTag, …>` on purpose: most wizards have no type allowlist
 * at all (offsite filters by audience; handicap/tdf read golf, not activities),
 * and inventing empty entries for them would report every type as "declined" for
 * wizards that never had a filter. Add an entry here when a site gains a real
 * allowlist — e.g. when the friendsmoon/engagedmoon overlays ship.
 */
const ALLOWLISTED_WIZARDS: ReadonlyArray<{
  wizard: WizardTag;
  site: string;
  repo: string;
  allowlist: ReadonlySet<string>;
}> = [
  {
    wizard: "moh",
    site: "maidofhonorhq.com",
    repo: "~/maid-of-honor-hq",
    allowlist: MOH_ACTIVITY_TYPES,
  },
  {
    wizard: "bestman",
    site: "bestmanhq.com",
    repo: "~/plan-my-party",
    allowlist: BESTMAN_ACTIVITY_TYPES,
  },
];

export interface DeclinedType {
  /** the activity `type` string the site's overlay does not recognise */
  type: string;
  /** how many tagged-for-this-wizard rows carry it */
  rows: number;
  /** distinct destinations affected */
  destinations: number;
  /** up to 3 real examples, for the reviewer to judge the type by */
  examples: { destination: string; name: string }[];
}

export interface WizardAdoptionQueue {
  wizard: WizardTag;
  site: string;
  repo: string;
  /** rows tagged for this wizard whose type IS in the allowlist (currently surfaced) */
  surfaced: number;
  /** rows tagged for this wizard whose type is NOT (silently dropped) */
  declined: number;
  types: DeclinedType[];
}

/**
 * Pure over the baked universe so it is testable with a synthetic one.
 * `destinations` is the already-baked shape — every item carries `wizards[]`.
 */
export function buildAdoptionQueue(
  destinations: typeof sharedDestinations,
  registry: typeof ALLOWLISTED_WIZARDS = ALLOWLISTED_WIZARDS,
): WizardAdoptionQueue[] {
  return registry.map(({ wizard, site, repo, allowlist }) => {
    const byType = new Map<string, DeclinedType>();
    let surfaced = 0;
    let declined = 0;

    for (const dest of destinations) {
      for (const a of dest.activities) {
        if (!a.wizards?.includes(wizard)) continue;
        if (allowlist.has(a.type)) {
          surfaced++;
          continue;
        }
        declined++;
        let entry = byType.get(a.type);
        if (!entry) {
          entry = { type: a.type, rows: 0, destinations: 0, examples: [] };
          byType.set(a.type, entry);
        }
        entry.rows++;
        if (entry.examples.length < 3) {
          entry.examples.push({ destination: dest.id, name: a.name });
        }
      }
    }

    // Second pass for distinct-destination counts (a type can repeat within a city).
    for (const entry of byType.values()) {
      const seen = new Set<string>();
      for (const dest of destinations) {
        if (dest.activities.some((a) => a.wizards?.includes(wizard) && a.type === entry.type)) {
          seen.add(dest.id);
        }
      }
      entry.destinations = seen.size;
    }

    const types = [...byType.values()].sort((a, b) => b.rows - a.rows || a.type.localeCompare(b.type));
    return { wizard, site, repo, surfaced, declined, types };
  });
}

export function renderMarkdown(queues: WizardAdoptionQueue[]): string {
  const lines: string[] = [];
  lines.push("# New-data adoption queue");
  lines.push("");
  lines.push(
    "Activity rows that ARE tagged for a site's wizard but whose `type` is absent from " +
      "that site's overlay allowlist, so the overlay drops them **silently**. Each one is a " +
      "pending per-site decision: adopt the type (add it to the allowlist in " +
      "`src/destinations-overlay.ts`) or decline it deliberately.",
  );
  lines.push("");
  lines.push("Generated by `npx tsx scripts/new-data-report.ts` — do not hand-edit.");
  lines.push("");

  const totalDeclined = queues.reduce((n, q) => n + q.declined, 0);
  if (totalDeclined === 0) {
    lines.push("**Nothing pending.** Every tagged activity row's type is recognised by its site's overlay.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("| site | wizard | surfaced | silently dropped | distinct types |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const q of queues) {
    lines.push(`| ${q.site} | ${q.wizard} | ${q.surfaced} | ${q.declined} | ${q.types.length} |`);
  }
  lines.push("");

  for (const q of queues) {
    if (q.types.length === 0) continue;
    lines.push(`## ${q.site} (\`${q.wizard}\`) — ${q.repo}`);
    lines.push("");
    lines.push(
      `${q.declined} row(s) across ${q.types.length} type(s) are tagged for this wizard and dropped by its allowlist.`,
    );
    lines.push("");
    lines.push("| type | rows | destinations | examples |");
    lines.push("| --- | --- | --- | --- |");
    for (const t of q.types) {
      const eg = t.examples.map((e) => `${e.name} (${e.destination})`).join("; ");
      lines.push(`| \`${t.type}\` | ${t.rows} | ${t.destinations} | ${eg} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main(): void {
  const args = process.argv.slice(2);
  const queues = buildAdoptionQueue(sharedDestinations);

  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify(queues, null, 2) + "\n");
    return;
  }

  const md = renderMarkdown(queues);
  process.stdout.write(md + "\n");

  if (args.includes("--write")) {
    const out = join(DOCS_DIR, "new-data-report.md");
    writeFileSync(out, md);
    process.stdout.write(`\nwrote ${out}\n`);
  }
}

// Only run when invoked directly, so the test can import the pure functions.
if (process.argv[1] && process.argv[1].endsWith("new-data-report.ts")) {
  main();
}
