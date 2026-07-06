/**
 * residences-expansion.ts — sanctioned expansion file for residence rows
 * (Task 15 — the ingest gate, `scripts/ingest-researched.ts`).
 *
 * `residences.ts` (`SHARED_RESIDENCES`) is regenerated from Offsite Outpost's
 * curated atlas (197 residences) and marked DO NOT hand-edit. This file is the
 * sanctioned home for any FUTURE, individually-researched residence that has
 * no home there — mirroring `golf-courses-hhq-merge.ts` (Task 3). Rows are
 * appended ONLY via `ingestResearched()`, after they clear the honesty
 * firewall (`validateResearchedRow`) and the verify/audit gates. Empty today
 * by design.
 *
 * Wired into `ALL_RESIDENCES` / `residencesForSite()` in `residences.ts` so
 * appended rows are visible to every consumer through the exact same accessor
 * every offsite wizard already reads — no separate aggregation to keep in sync.
 */
import type { SharedResidence } from "./residences";

export const SHARED_RESIDENCES_EXPANSION: SharedResidence[] = [];
