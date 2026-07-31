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
export * from "./residences";
export * from "./residences-expansion";
export * from "./golf-destinations";
export * from "./moh-locals";
export * from "./bestman-locals";
export * from "./oo-atlas";
export * from "./tagging-rules";

// 2026-06-24 expansion: the canonical catalog is now the core set plus the
// region/international expansion files. New cities land in a
// `destinations-expansion-*.ts` file and get spread in here so every consumer
// (BESTMAN HQ, MOH) picks them up via the same `sharedDestinations` export.
import type { CanonicalDestination } from "./destinations-types";
import { bakeDestination } from "./destinations-bake";
import { sharedDestinations as coreDestinations } from "./destinations-data";
import { expansionSouth } from "./destinations-expansion-south";
import { expansionInternational } from "./destinations-expansion-international";
import { expansionNortheast } from "./destinations-expansion-northeast";
import { expansionMidwest } from "./destinations-expansion-midwest";
import { expansionWest } from "./destinations-expansion-west";

// Every canonical item is baked with universe tags (wizards/audiences/products/
// priceTier) at module load, so the overlays are pure filters over the tags and
// every consumer reads pre-tagged data. See destinations-bake.ts.
export const sharedDestinations: CanonicalDestination[] = [
  ...coreDestinations,
  ...expansionSouth,
  ...expansionInternational,
  ...expansionNortheast,
  ...expansionMidwest,
  ...expansionWest,
].map(bakeDestination);

// Golf is the single golf-cite source (Task 3). The regenerated 994-row
// `golf-courses.ts` (do-not-hand-edit) plus the `golf-courses-hhq-merge.ts`
// sanctioned-ingest overlay combine into the canonical set every consumer —
// TDF, Offsite, Handicap HQ, Best Man HQ — reads. That merge, and BOTH reader
// surfaces over it (`SHARED_GOLF_COURSES` and `coursesForCity`), now live in
// `./golf` and are re-exported above.
