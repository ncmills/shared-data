/**
 * research-gap.ts — Task 14: real-venue research orchestrator.
 *
 * Takes ONE `GapTask` (a starved dataset cell — e.g. golf × International ×
 * budget, 3 rows short) and produces candidate `ResearchedRow`s that are REAL
 * and VERIFIABLE. The researcher is PLUGGABLE (`Researcher`) so the harness is
 * testable with a mock (no network in unit tests) and runnable for real with a
 * live web-research agent in Tasks 15-16.
 *
 * Flow: buildResearchPrompt(task) → researcher(prompt) → validateResearchedRow
 * on EVERY candidate → return only the ok:true rows + a rejected count. The
 * validator is the honesty firewall: nothing without a resolvable primary URL
 * and a citation gets through. NO FABRICATION.
 */

import type { GapTask } from "./gap-queue";
import { validateResearchedRow, type ResearchedRow } from "../src/research-schema";
import { validateResearchedRowLive, type UrlLiveResult } from "../src/verify-url";

/**
 * A researcher takes a fully-built research prompt and returns candidate
 * objects (unknown shape — they haven't been validated yet). In production
 * this wraps a web-research agent (WebSearch/WebFetch) following the
 * parallel-research-fanout discipline; in tests it's a deterministic mock.
 */
export type Researcher = (prompt: string) => Promise<unknown[]>;

export interface ResearchGapOptions {
  /**
   * Item 3 of the arm-time hardening: when true, every candidate that
   * survives the sync honesty firewall is ALSO required to have a live
   * (2xx/3xx) `sourceUrl` before counting as valid — a real-looking-but-dead
   * URL is rejected, not just shape-checked. Defaults to `false`, the
   * sync-only behavior every existing test/interactive caller relies on.
   * Opt-in for the unattended engine (`run-expansion.ts`'s CLI arms this).
   */
  liveUrlCheck?: boolean;
  /** Injected live-URL verifier for tests / a custom fetch policy. Defaults
   *  to `verifyUrlLive` itself. Ignored when `liveUrlCheck` is falsy. */
  verifyUrl?: (url: string) => Promise<UrlLiveResult>;
}

export interface ResearchGapResult {
  /** Validated, real-shaped rows (the ok:true survivors). */
  rows: ResearchedRow[];
  /** How many candidates were rejected by the validator. */
  rejected: number;
  /** Per-reject diagnostics (candidate index → reasons) for logging. */
  rejections: { index: number; reasons: string[] }[];
}

/** Human dataset → canonical-field hint for the prompt (what a good row needs). */
const DATASET_FIELD_HINT: Record<string, string> = {
  golf: "name, city, state, region (must equal the region above), tier (must equal the tier above), greenFeeRange [low,high], style, walkable, driveMinutes, highlight",
  residence: "id (kebab-case), name, setting (must equal the setting above), region, country",
};

/**
 * Build the precise research prompt for a GapTask. Pure + deterministic so it
 * can be unit-tested and diffed. Encodes: the dataset, the exact cell we're
 * filling, how many rows short (deficit), the REAL-venue + no-fabrication +
 * cite-primary-sources constraints, and the required output shape.
 */
export function buildResearchPrompt(task: GapTask): string {
  const cellPairs = Object.entries(task.cell)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\n");
  const fieldHint = DATASET_FIELD_HINT[task.dataset] ?? "the canonical fields for this dataset";

  return [
    `Research REAL ${task.dataset} venues to fill a starved data cell.`,
    ``,
    `Target cell:`,
    cellPairs,
    ``,
    `Find ${task.deficit} REAL venues that genuinely fit this cell (this cell is ${task.deficit} rows short).`,
    ``,
    `HARD CONSTRAINTS — NO FABRICATION:`,
    `- Every venue MUST be a real, currently-operating place. Do not invent venues.`,
    `- Every row MUST include "sourceUrl": the venue's real primary website (http/https, resolvable).`,
    `- Every row MUST include "citations": an array with >=1 primary-source URL backing the facts.`,
    `- Cite PRIMARY sources (the venue's own site, an official/authoritative listing). Do not cite from memory.`,
    `- If you cannot verify a venue has a real primary URL, DROP it rather than guess.`,
    ``,
    `Output: a JSON array of objects, each shaped as:`,
    `  { "dataset": "${task.dataset}", <${fieldHint}>, "sourceUrl": "...", "citations": ["..."] }`,
    ``,
    `Serves wizards: ${task.wizardsServed.join(", ")}. Starved for: ${task.starvedForWizards.join(", ")}.`,
  ].join("\n");
}

/**
 * Run the research harness for one GapTask against a pluggable researcher.
 * Validates every candidate; returns only the real-shaped rows plus a
 * rejected count + per-reject reasons. Never throws on a bad candidate — a
 * fabricated/malformed row is a reject, not a crash.
 */
export async function researchGap(
  task: GapTask,
  researcher: Researcher,
  opts: ResearchGapOptions = {},
): Promise<ResearchGapResult> {
  const prompt = buildResearchPrompt(task);
  const candidates = await researcher(prompt);

  const rows: ResearchedRow[] = [];
  const rejections: { index: number; reasons: string[] }[] = [];

  if (opts.liveUrlCheck) {
    for (const [index, candidate] of candidates.entries()) {
      const res = await validateResearchedRowLive(candidate, { verifyUrl: opts.verifyUrl });
      if (res.ok) {
        rows.push(res.row);
      } else {
        rejections.push({ index, reasons: res.reasons });
      }
    }
  } else {
    candidates.forEach((candidate, index) => {
      const res = validateResearchedRow(candidate);
      if (res.ok) {
        rows.push(res.row);
      } else {
        rejections.push({ index, reasons: res.reasons });
      }
    });
  }

  return { rows, rejected: rejections.length, rejections };
}
