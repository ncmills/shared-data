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

// The canonical catalog (core + expansion files, attach → patch → bake → strip)
// is assembled in ./destinations-canonical — moved there verbatim on 2026-09-24
// so the locals modules can derive from it without importing this file.
import { sharedDestinations } from "./destinations-canonical";
export { sharedDestinations };

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
