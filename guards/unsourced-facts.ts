// guards/unsourced-facts.ts — class: ANY unsourced fact (dose strings, research claims,
// CAS/MW, statute citations, prices...). SLOT ONLY in this unit: per-site guards are being
// written in DRV-cs-sourcing (scripts/guard-catalog-sources.mjs), DRV-wpd-sourcing and
// DRV-dw-promises; DRV lifts them here next. Until then a configured site FAILs loudly.
//
// Config shape (what the lifted guard will read):
//   { "catalogs": [{ "file": "lib/peptides.ts", "export": "PEPTIDES", "idField": "slug",
//                    "factFields": ["cas", "mw"], "sourceUrlField": "source.url" }] }
// Rule: a row that states any factField must carry an https:// primary-source URL.
import { type Guard, fail } from "./lib.ts";
import type { DataSource } from "./lib.ts";

export interface FactCatalog extends DataSource { idField?: string; factFields: string[]; sourceUrlField: string }
export interface UnsourcedFactsConfig { catalogs: FactCatalog[] }

export const unsourcedFacts: Guard = async () =>
  fail(["not yet lifted: the shared unsourced-facts guard is a slot; DRV lifts the per-site guards (DRV-cs-sourcing, DRV-wpd-sourcing) next"]);
