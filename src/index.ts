/**
 * shared-data — geographic primitives shared across all of nick's projects.
 *
 * Single source of truth for state names, regions, slugify, airports.
 * Consumed by TDF, BESTMAN HQ, MOH, and any future project.
 */

export * from "./states";
export * from "./regions";
export * from "./slugify";
export * from "./airports";
export * from "./tags";
export * from "./destinations-types";
export * from "./destinations-overlay";
// Golf is exported ONLY through ./golf — the public surface that merges the
// regenerated base with the sanctioned ingest destination. Star-exporting
// ./golf-courses here is what made `SHARED_GOLF_COURSES` and `coursesForCity`
// resolve to the base-only versions, hiding every researched course from every
// consumer. Do not re-add it. See src/golf.ts.
export * from "./golf";
// Exported here, not only as a file, because a consumer imports `from "shared-data"` and the
// package's `main` is this file. crawler-user-agents shipped in #46 with nine passing tests --
// and every one of them imported it by RELATIVE path, so none exercised the public surface. It
// was unreachable from every consumer and the suite could not tell. Found 2026-08-27 when
// maid-of-honor-hq's route threw `classifyUserAgent is not a function` at runtime.
export * from "./crawler-user-agents";
export * from "./residences";
export * from "./residences-expansion";
export * from "./golf-destinations";
export * from "./moh-locals";
export * from "./bestman-locals";
export * from "./oo-atlas";
export * from "./tagging-rules";
// Proposal spots (engagedmoon). Exported here because a module nothing can
// import is a module nothing can be checked against: `proposal-spots.ts` landed
// in #25 with its whole three-tier firewall and then sat unreachable from the
// package root, so engagedmoon grew a SECOND, weaker copy of the dataset in its
// own repo and drifted for a week. The schema is only load-bearing if the
// consumer actually reads it.
export * from "./proposal-spots";
// ...and the ROWS, for the same reason, which #27 missed while fixing exactly
// this bug one file over: it exported the schema and left the 144 rows
// unreachable, so `PROPOSAL_SPOTS_DATA` did not resolve from the package root
// and engagedmoon's first attempt to stop forking the dataset failed to
// compile. A schema without its rows is the same unreachable module in a
// smaller costume.
export * from "./proposal-spots-data";
// Composed trips — schema AND rows both reachable from the package root, for
// the same reason spelled twice above: #25 shipped proposal-spots' schema
// unreachable and #27 fixed the schema while leaving the rows unreachable. A
// trips module a consumer cannot import is a trips module nothing is checked
// against. (The composed `EM_COMPOSED_TRIPS` export itself is assembled at the
// bottom of this file, after `sharedDestinations` exists — see the comment
// there and in trips/em-trips.ts for the cycle it avoids.)
export * from "./trips/schema";
export * from "./trips/em-trips";

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

// Composed trips are assembled HERE, below the `sharedDestinations`
// definition, not in trips/em-trips.ts: composition needs the baked catalog,
// and em-trips.ts cannot import it back out of this module without an ESM
// cycle that evaluates em-trips before `sharedDestinations` exists (TDZ crash
// for every consumer). em-trips.ts owns the authored inputs; this line derives
// each trip's estPerPerson from the referenced rows' published ranges — the
// money on a trip can never drift from the catalog because it is never typed.
// deriveEstPerPerson throws on a dangling row key, so a bad reference is a
// build failure (scripts/verify-trips.ts reports it more readably first).
import { EM_COMPOSED_TRIP_INPUTS } from "./trips/em-trips";
import { composeTrips } from "./trips/schema";
export const EM_COMPOSED_TRIPS = composeTrips(EM_COMPOSED_TRIP_INPUTS, sharedDestinations);

// Golf is the single golf-cite source (Task 3). The regenerated 994-row
// `golf-courses.ts` (do-not-hand-edit) plus the `golf-courses-hhq-merge.ts`
// sanctioned-ingest overlay combine into the canonical set every consumer —
// TDF, Offsite, Handicap HQ, Best Man HQ — reads. That merge, and BOTH reader
// surfaces over it (`SHARED_GOLF_COURSES` and `coursesForCity`), now live in
// `./golf` and are re-exported above.
