/**
 * party-venues-expansion.ts — the SANCTIONED INGEST TARGET for researched
 * party-venue rows. Machine-appended by `scripts/ingest-researched.ts`.
 *
 * WHY THIS FILE EXISTS INSTEAD OF AN IN-PLACE EDIT.
 * Party venues live nested inside destination objects, spread across the
 * hand-authored `destinations-data.ts` + five `destinations-expansion-*.ts`
 * files. Those are curated TS with inline comments and per-city section
 * headers — they do NOT round-trip through `JSON.parse`, so the append
 * machinery every other dataset uses cannot read them, and a rewrite would
 * flatten ~1.7MB of reviewed formatting into one line. Machines therefore
 * never edit them.
 *
 * This is the same answer golf already reached, for the same reason: the
 * regenerated `golf-courses.ts` is marked DO-NOT-HAND-EDIT, machine rows land
 * in the flat `golf-courses-hhq-merge.ts`, and each row carries an explicit
 * `destinationId` that ATTACHES it to the destination at assembly time (see
 * the `destinationId` doc on `SharedGolfCourse`, and `golfDestinations()`).
 * Rows here attach via `attachPartyVenues()` in `party-venues-attach.ts`,
 * which runs in `index.ts` BEFORE `bakeDestination` — so an appended row is
 * tagged by the exact same bake as a curated one and needs no special case
 * anywhere downstream.
 *
 * Every row is append-only, deduped by (destination, category, name) against
 * the curated data, and carries `sourceUrl` + `citations` through to the
 * rendered row. Empty today by design.
 */
import type { PartyVenueCategory } from "./research-schema";

/**
 * A researched party venue plus the two keys that say where it lands.
 *
 * `destinationId` is an EXPLICIT anchor, resolved against the real universe and
 * fatal on a miss — never inferred from city/state. Matching town names across
 * an international geography is precisely the silent mis-association this repo
 * has been bitten by; golf's anchor doc carries the same rule.
 *
 * `destinationId` and `category` are attach INSTRUCTIONS, not venue fields —
 * `attachPartyVenues` strips both before the row becomes canonical.
 */
export type PartyVenueExpansionRow = {
  destinationId: string;
  category: PartyVenueCategory;
  name: string;
} & Record<string, unknown>;

export const PARTY_VENUES_EXPANSION: PartyVenueExpansionRow[] = [];
