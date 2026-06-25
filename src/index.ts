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
export * from "./destinations-types";
export * from "./destinations-overlay";

// 2026-06-24 expansion: the canonical catalog is now the core set plus the
// region/international expansion files. New cities land in a
// `destinations-expansion-*.ts` file and get spread in here so every consumer
// (BESTMAN HQ, MOH) picks them up via the same `sharedDestinations` export.
import type { CanonicalDestination } from "./destinations-types";
import { sharedDestinations as coreDestinations } from "./destinations-data";
import { expansionSouth } from "./destinations-expansion-south";
import { expansionInternational } from "./destinations-expansion-international";
import { expansionNortheast } from "./destinations-expansion-northeast";
import { expansionMidwest } from "./destinations-expansion-midwest";
import { expansionWest } from "./destinations-expansion-west";

export const sharedDestinations: CanonicalDestination[] = [
  ...coreDestinations,
  ...expansionSouth,
  ...expansionInternational,
  ...expansionNortheast,
  ...expansionMidwest,
  ...expansionWest,
];
