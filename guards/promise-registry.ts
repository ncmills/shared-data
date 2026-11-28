// guards/promise-registry.ts — class: ANY copy that promises a feature.
// SLOT ONLY in this unit (per-site work in DRV-dw-promises; DRV lifts it next).
//
// Config shape (what the lifted guard will read):
//   { "registry": "promises.json",            // [{ "page", "sentence", "test" }]
//     "copyGlobs": ["src/app/**/page.tsx"],    // where promise sentences are searched
//     "triggers": ["you can", "delete", "export", "cancel anytime"] }
// Rule: every trigger sentence found in copy maps to a registry row whose `test` exists
// and is part of the test suite; a registry row whose sentence is gone is also a FAIL.
import { type Guard, fail } from "./lib.ts";

export interface PromiseRegistryConfig { registry: string; copyGlobs: string[]; triggers?: string[] }

export const promiseRegistry: Guard = async () =>
  fail(["not yet lifted: the shared promise-registry guard is a slot; DRV lifts the per-site work (DRV-dw-promises) next"]);
