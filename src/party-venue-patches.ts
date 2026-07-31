/**
 * party-venue-patches.ts — the SANCTIONED ENRICHMENT TARGET for existing party
 * venues. Machine-appended, like `party-venues-expansion.ts`.
 *
 * WHY A SECOND FILE INSTEAD OF REUSING THE APPEND PATH.
 * `attachPartyVenues` adds venues and lets the CURATED row win on a name
 * collision — correct, so a researched row can never overwrite reviewed copy.
 * The consequence is that it can never enrich an existing row, and every item
 * in the Phase 2 backfill lane is enrichment of curated rows:
 *
 *   - coordinates (0 of 4,251 rows carry lat/lng today)
 *   - URLs + provenance (47 of ~4,200 party rows)
 *   - the `groupMin` re-grade (1,107 rows at the editorial default of 4)
 *   - bedroom / occupancy counts, reservation + private-dining data
 *
 * None of those are appends. Hence this file.
 *
 * THE ASYMMETRY THAT MATTERS:
 *   append → curated row WINS   (never overwrite reviewed copy with a new venue)
 *   patch  → curated value LOSES (the whole point is correcting an editorial
 *                                 default, or filling a blank)
 *
 * Because a patch CAN change a claim a user reads, every patch must carry
 * `sourceUrl` + `citations` — the bar `research-schema.ts` already sets for a
 * new row. Pure normalisation work (e.g. "USA" → "United States") is NOT a
 * research patch and does not belong here; it is a regeneration/hand edit.
 *
 * Curated files stay machine-untouched, exactly as with the expansion file.
 */
import type { PartyVenueCategory } from "./research-schema";

/**
 * A field-level patch against ONE existing party venue.
 *
 * `destinationId` + `category` + `name` are the KEY, not payload —
 * `applyPartyVenuePatches` strips all three before merging, so a patch can
 * never rename a venue or move it to another destination or category.
 *
 * The key is structured rather than the single delimited string
 * `${destId}|${category}|${name}` that `TAG_OVERRIDES` uses, because venue
 * names are free text: a name containing the delimiter would silently key the
 * wrong row, and this mechanism is allowed to overwrite rendered values.
 */
export type PartyVenuePatch = {
  destinationId: string;
  category: PartyVenueCategory;
  name: string;
  sourceUrl: string;
  citations: string[];
} & Record<string, unknown>;

export const PARTY_VENUE_PATCHES: PartyVenuePatch[] = [];
