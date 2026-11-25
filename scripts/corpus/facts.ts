/**
 * facts.ts — the facts rows that carry an M3a id, with the facet values a
 * suitability rule can match on (CORPUS-M4).
 *
 * The row set is exactly the CORPUS-M3a id set: every nested party row of
 * `sharedDestinations` (nightlife, dining, activities, lodging, transport) and
 * every golf course in `SHARED_GOLF_COURSES`. Destinations, residences, OO
 * experiences and proposal spots have their own authored ids but are not
 * suitability rows in v1.
 *
 * A facet value is read off the row (or its destination) — never inferred.
 * Every facet name used here is a facet in vocab/v1.json.
 */
import { sharedDestinations } from "../../src/destinations-canonical.ts";
import { SHARED_GOLF_COURSES } from "../../src/golf.ts";
import { CATEGORY_OF } from "../../src/tags.ts";

export const PARTY_KINDS = ["nightlife", "dining", "activity", "lodging", "transport"] as const;
const CATEGORY_TO_KIND = {
  nightlife: "nightlife",
  dining: "dining",
  activities: "activity",
  lodging: "lodging",
  transport: "transport",
} as const;

export interface FactsRow {
  id: string;
  kind: (typeof PARTY_KINDS)[number] | "golf-course";
  /** facet name → values (a row simply lacks a facet that does not apply to its kind). */
  facets: Record<string, string[]>;
  /** text fields a lexicon rule can match on. */
  text: { name: string; highlight: string };
  /** the row's legacy routing tags, for G-diff only — never read by a rule. */
  legacy: { wizards?: string[]; brands?: string[]; sites?: string[]; audiences?: string[] };
  /** destination id for party rows; golf-destination anchor (if any) for courses. */
  destId?: string;
}

let cache: FactsRow[] | null = null;

export function factsRows(): FactsRow[] {
  if (cache) return cache;
  const rows: FactsRow[] = [];
  for (const d of sharedDestinations) {
    const scope = d.region === "international" ? "non-us" : "us";
    for (const [cat, kind] of Object.entries(CATEGORY_TO_KIND) as [keyof typeof CATEGORY_TO_KIND, FactsRow["kind"]][]) {
      for (const r of d[cat] as any[]) {
        const facets: Record<string, string[]> = {
          kind: [kind],
          "destination.id": [d.id],
          "party.region": [d.region],
          "place.scope": [scope],
        };
        if (kind === "activity") {
          facets["activity.type"] = [r.type];
          const cats = CATEGORY_OF[r.type];
          if (cats) facets["activity.category"] = [...cats];
        }
        if (kind === "nightlife") {
          facets["nightlife.type"] = [r.type];
          facets["nightlife.vibe"] = [r.vibe];
        }
        if (kind === "lodging") facets["lodging.type"] = [r.type];
        if (kind === "transport") facets["transport.type"] = [r.type];
        rows.push({
          id: r.id,
          kind,
          facets,
          text: { name: r.name ?? "", highlight: r.highlight ?? "" },
          legacy: { wizards: r.wizards, brands: r.brands, audiences: r.audiences },
          destId: d.id,
        });
      }
    }
  }
  for (const c of SHARED_GOLF_COURSES as any[]) {
    rows.push({
      id: c.id,
      kind: "golf-course",
      facets: {
        kind: ["golf-course"],
        "golf.tier": [c.tier],
        "golf.style": [c.style],
        "golf.region": [c.region],
        "place.scope": [c.region === "International" ? "non-us" : "us"],
      },
      text: { name: c.name ?? "", highlight: c.highlight ?? "" },
      legacy: { sites: c.sites },
      destId: c.destinationId,
    });
  }
  const missing = rows.filter((r) => !r.id);
  if (missing.length) throw new Error(`facts: ${missing.length} rows have no id — M3a ids are required`);
  cache = rows;
  return rows;
}
