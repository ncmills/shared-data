/**
 * destinations-canonical.ts — the canonical party-destination catalog.
 *
 * Moved out of index.ts verbatim on 2026-09-24 (CORPUS-M3a) so modules inside
 * the package can import `sharedDestinations` without an ESM cycle through
 * index.ts: the MOH and Best Man locals are now derived FROM these rows
 * (moh-locals.ts, bestman-locals.ts), and index.ts star-exports those modules
 * before it could have defined this array. index.ts re-exports it unchanged.
 */
// 2026-06-24 expansion: the canonical catalog is now the core set plus the
// region/international expansion files. New cities land in a
// `destinations-expansion-*.ts` file and get spread in here so every consumer
// (BESTMAN HQ, MOH) picks them up via the same `sharedDestinations` export.
import type { CanonicalDestination } from "./destinations-types";
import { bakeDestination } from "./destinations-bake";
import { stripDeadVenueUrls } from "./dead-url-quarantine";
import { sharedDestinations as coreDestinations } from "./destinations-data";
import { expansionSouth } from "./destinations-expansion-south";
import { expansionInternational } from "./destinations-expansion-international";
import { expansionNortheast } from "./destinations-expansion-northeast";
import { expansionMidwest } from "./destinations-expansion-midwest";
import { expansionWest } from "./destinations-expansion-west";
import { attachPartyVenues } from "./party-venues-attach";
import { PARTY_VENUES_EXPANSION } from "./party-venues-expansion";
// Curated batches of rows that land ON EXISTING destinations (not new cities),
// passed to `attachPartyVenues` alongside the machine-appended
// `PARTY_VENUES_EXPANSION`. They are separate dated files so a hand-authored
// batch never has to be merged into the file `ingest-researched.ts` parses, and
// two concurrent batches for different regions cannot collide in one diff.
import { northeastProposal0818 } from "./destinations-expansion-northeast-proposal-0818";
import { expansionMidwestProposal0818 } from "./destinations-expansion-midwest-proposal-0818";
import { applyPartyVenuePatches } from "./party-venue-patch-apply";

// Every canonical item is baked with universe tags (wizards/audiences/products/
// priceTier) at module load, so the overlays are pure filters over the tags and
// every consumer reads pre-tagged data. See destinations-bake.ts.
//
// `attachPartyVenues` runs FIRST and merges the machine-appended rows from the
// flat `party-venues-expansion.ts` into the destination each one anchors — the
// curated nested files are never machine-edited (see that file's header for
// why, and for the golf precedent it follows). Attaching BEFORE the bake is the
// whole point: an ingested row is then tagged by the identical code path as a
// curated one, so no overlay, consumer or audit needs a special case. It throws
// on an anchor that resolves to nothing rather than dropping the row.
// `applyPartyVenuePatches` then ENRICHES existing rows from the flat
// `party-venue-patches.ts` — coordinates, URLs, regraded `groupMin`, occupancy.
// The append path above deliberately lets a curated row win a name collision,
// so it can never enrich one; that is what this second pass is for.
//
// The order attach → patch → bake is load-bearing in both joints. Patching
// after attach lets a venue added this month be enriched next month. Patching
// before the bake feeds derived tags: a repriced row must not keep a
// `priceTier` computed from its stale price.
// `stripDeadVenueUrls` runs LAST, after the patch pass, because a patch is
// exactly how one of these urls would come back: the quarantine has to see the
// final value a consumer will render, not the one the source file happens to
// carry. It only ever removes a `url` key, so it cannot affect tags or pricing
// derived by the bake above.
export const sharedDestinations: CanonicalDestination[] = applyPartyVenuePatches(
  attachPartyVenues(
    [
      ...coreDestinations,
      ...expansionSouth,
      ...expansionInternational,
      ...expansionNortheast,
      ...expansionMidwest,
      ...expansionWest,
    ],
    // Passed EXPLICITLY rather than left to the default, so a hand-authored
    // batch can live in its own file instead of being merged into the file
    // `ingest-researched.ts` machine-appends. Every row still anchors by
    // explicit `destinationId` and still dies loudly on a miss — this changes
    // where rows are AUTHORED, not how they attach.
    [...PARTY_VENUES_EXPANSION, ...northeastProposal0818, ...expansionMidwestProposal0818],
  ),
)
  .map(bakeDestination)
  .map(stripDeadVenueUrls);

