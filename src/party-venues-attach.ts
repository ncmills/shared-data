/**
 * party-venues-attach.ts — attach machine-appended party rows onto the
 * destination each one anchors.
 *
 * Runs in `index.ts` over the assembled canonical list BEFORE
 * `.map(bakeDestination)`, so an attached row is tagged by the same bake as a
 * curated row — no downstream consumer, overlay or audit needs to know a row
 * arrived this way. Mirrors `golfDestinations()`, which attaches flat golf rows
 * to their destination's `courses[]` by explicit `destinationId`.
 */
import type { CanonicalDestination } from "./destinations-types";
import type { PartyVenueCategory } from "./research-schema";
import { PARTY_VENUES_EXPANSION, type PartyVenueExpansionRow } from "./party-venues-expansion";

const norm = (s: string): string => s.trim().toLowerCase();

/**
 * Attach every expansion row to its anchored destination.
 *
 * THROWS on an anchor that resolves to no destination. That is deliberate and
 * load-bearing: a dropped row would pass the schema gate, pass the live-URL
 * check, pass the coverage audit, and reach no user — the failure this repo
 * keeps re-hitting (researched golf rows closed an audit gap while reaching no
 * import, then reached the import while still reaching no page). A typo'd
 * anchor must stop the build, not shrink silently.
 *
 * Dedup is by (destination, category, normalised name) and the CURATED row
 * wins — a researched row never overwrites reviewed copy.
 */
export function attachPartyVenues(
  destinations: CanonicalDestination[],
  rows: PartyVenueExpansionRow[] = PARTY_VENUES_EXPANSION,
): CanonicalDestination[] {
  if (rows.length === 0) return destinations;

  const byId = new Map(destinations.map((d) => [d.id, d]));

  const orphans = rows.filter((r) => !byId.has(r.destinationId));
  if (orphans.length > 0) {
    const detail = orphans.map((o) => `"${o.name}" → ${JSON.stringify(o.destinationId)}`).join("; ");
    throw new Error(
      `party-venues-attach: ${orphans.length} row(s) anchor a destination that does not exist: ${detail}. ` +
        `The anchor is explicit and is never inferred from city/state — fix the destinationId or remove the row.`,
    );
  }

  const byDestination = new Map<string, PartyVenueExpansionRow[]>();
  for (const r of rows) {
    const list = byDestination.get(r.destinationId);
    if (list) list.push(r);
    else byDestination.set(r.destinationId, [r]);
  }

  return destinations.map((dest) => {
    const mine = byDestination.get(dest.id);
    if (!mine || mine.length === 0) return dest;

    // Each category is spelled out rather than indexed by a computed key, so
    // the destination stays statically typed end-to-end and a new category can
    // never silently land in the wrong array.
    return {
      ...dest,
      activities: mergeCategory(dest.activities, mine, "activity"),
      dining: mergeCategory(dest.dining, mine, "dining"),
      nightlife: mergeCategory(dest.nightlife, mine, "nightlife"),
      lodging: mergeCategory(dest.lodging, mine, "lodging"),
      transport: mergeCategory(dest.transport, mine, "transport"),
    };
  });
}

/**
 * Append this destination's rows for one category, dropping any whose name
 * already exists there. Dedup is per-category, so a restaurant and an activity
 * may legitimately share a name.
 */
function mergeCategory<T extends { name: string }>(
  existing: T[],
  rows: PartyVenueExpansionRow[],
  category: PartyVenueCategory,
): T[] {
  const forCategory = rows.filter((r) => r.category === category);
  if (forCategory.length === 0) return existing;

  // Seeded from the curated rows, then grown as we accept — so two appended
  // rows for the same venue in one batch also collapse to one.
  const seen = new Set(existing.map((item) => norm(item.name)));

  const additions: T[] = [];
  for (const row of forCategory) {
    if (seen.has(norm(row.name))) continue;
    seen.add(norm(row.name));
    additions.push(toCanonicalRow(row) as unknown as T);
  }
  return additions.length > 0 ? [...existing, ...additions] : existing;
}

/**
 * Strip the attach instructions and mirror the primary source onto `url`.
 *
 * `sourceUrl` + `citations` ride through onto the canonical row. Residences
 * used to destructure them away here (fixed in e57103a), which meant the
 * schema gate and the live-URL check both ran and then discarded their
 * evidence — leaving 0 of 341 residences with a followable source while golf,
 * which keeps it via `url: row.url ?? row.sourceUrl`, carried 877 of 999.
 * Party rows render into live copy, so the citation cannot be re-derived later.
 */
function toCanonicalRow(row: PartyVenueExpansionRow): Record<string, unknown> {
  const { destinationId: _destinationId, category: _category, ...rest } = row;
  return {
    ...rest,
    url: (rest.url as string | undefined) ?? (rest.sourceUrl as string | undefined),
  };
}
