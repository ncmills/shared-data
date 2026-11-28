// guards/registry.ts — the ONE list of fleet guards. Adding a guard here switches it on
// for every site: a site whose guards.config.json lacks it FAILs until it configures it
// (or carries an opt-out naming a CONTROL ruling).
import type { Guard } from "./lib.ts";
import { duplicateAssets } from "./duplicate-assets.ts";
import { staleDatasets } from "./stale-datasets.ts";
import { sharedDataPinAge } from "./shared-data-pin-age.ts";
import { unsourcedFacts } from "./unsourced-facts.ts";
import { promiseRegistry } from "./promise-registry.ts";

export const GUARDS: Record<string, Guard> = {
  "duplicate-assets": duplicateAssets,
  "stale-datasets": staleDatasets,
  "shared-data-pin-age": sharedDataPinAge,
  "unsourced-facts": unsourcedFacts,
  "promise-registry": promiseRegistry,
};
export const GUARD_IDS = Object.keys(GUARDS);
