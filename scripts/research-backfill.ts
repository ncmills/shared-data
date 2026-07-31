/**
 * research-backfill.ts — research the real primary source of venues that
 * ALREADY EXIST, and return `party-venue-patch` rows.
 *
 * The enrich-path sibling of `research-gap.ts`. That module prompts for NEW
 * venues to fill a starved cell; this one takes a `BackfillTask` (the unsourced
 * venues of one category in one city) and asks for each venue's own website.
 *
 * Everything downstream is already built and unchanged: the honesty firewall
 * (`validateResearchedRow`), the live-URL check (`validateResearchedRowLive`),
 * the transactional patch ingest, and propose-PR.
 *
 * ── the guard the gap path does not need: DRIFT ────────────────────────────
 * The patch key IS the venue name. The researcher is an LLM handed a list of
 * names, so a row for "Broadway Honky Tonk Crawl" when we asked about "Broadway
 * Crawl" is not a near-miss — it is a patch that can never resolve. And a
 * drifted name carrying a real, live URL is the worst case: it passes every
 * downstream gate and silently documents the wrong venue. So candidates naming
 * anything we did not ask about, or pointing at another destination or
 * category, are rejected HERE with a reason, not left for the ingest gate.
 *
 * Name matching is case- and whitespace-insensitive, the same way the patch
 * layer matches, so a formatting wobble is tolerated while genuine drift is not.
 */
import type { BackfillTask } from "./backfill-queue";
import { validateResearchedRow, type ResearchedRow } from "../src/research-schema";
import { validateResearchedRowLive, type UrlLiveResult } from "../src/verify-url";
import type { Researcher, ResearchGapOptions, ResearchGapResult } from "./research-gap";

const norm = (s: string): string => s.trim().toLowerCase();

/**
 * Build the backfill prompt. Pure + deterministic, so it can be unit-tested and
 * diffed like `buildResearchPrompt`.
 */
export function buildUrlBackfillPrompt(task: BackfillTask): string {
  const venueList = task.venues.map((v) => `  - ${v}`).join("\n");

  return [
    `Find the REAL primary website for each of these existing ${task.category} venues in ` +
      `${task.city}, ${task.state}.`,
    ``,
    `These venues are already in our catalog but carry no followable source. We are NOT`,
    `adding venues and NOT changing any other field — only attaching each one's real URL.`,
    ``,
    `Venues:`,
    venueList,
    ``,
    `HARD CONSTRAINTS — NO FABRICATION:`,
    `- Copy each "name" EXACTLY as written above, character-for-character. The name is the`,
    `  key we match on; a reworded name silently fails to attach or documents the wrong place.`,
    `- Do not invent URLs. If you cannot find the venue's real site, DROP that venue from your`,
    `  output. A missing row is fine; a wrong one is not.`,
    `- Do not return venues that are not on the list above, even if you find better ones.`,
    `- "url" must be the venue's OWN primary website (http/https, currently resolving).`,
    `- "citations" must contain >=1 primary-source URL backing that the site belongs to that venue.`,
    `- If the venue has permanently closed, DROP it rather than linking a dead or successor site.`,
    ``,
    `Output: a JSON array of objects, each shaped exactly as:`,
    `  {`,
    `    "dataset": "party-venue-patch",`,
    `    "destinationId": "${task.destinationId}",`,
    `    "category": "${task.category}",`,
    `    "name": "<the EXACT name from the list above>",`,
    `    "url": "https://...",`,
    `    "sourceUrl": "https://...",`,
    `    "citations": ["https://..."]`,
    `  }`,
    ``,
    `Return only venues you actually verified. ${task.venues.length} venue(s) were asked about; ` +
      `returning fewer is expected and correct.`,
  ].join("\n");
}

/**
 * Run the backfill harness for one task. Drift-checks every candidate, then
 * puts survivors through the same honesty firewall the gap path uses.
 * Never throws on a bad candidate — it is a reject, not a crash.
 */
export async function researchBackfill(
  task: BackfillTask,
  researcher: Researcher,
  opts: ResearchGapOptions = {},
): Promise<ResearchGapResult> {
  const prompt = buildUrlBackfillPrompt(task);
  const candidates = await researcher(prompt);

  const asked = new Set(task.venues.map(norm));
  const rows: ResearchedRow[] = [];
  const rejections: { index: number; reasons: string[] }[] = [];

  for (const [index, candidate] of candidates.entries()) {
    const drift = driftReasons(candidate, task, asked);
    if (drift.length > 0) {
      rejections.push({ index, reasons: drift });
      continue;
    }

    const res = opts.liveUrlCheck
      ? await validateResearchedRowLive(candidate, { verifyUrl: opts.verifyUrl })
      : validateResearchedRow(candidate);

    if (res.ok) rows.push(res.row);
    else rejections.push({ index, reasons: res.reasons });
  }

  return { rows, rejected: rejections.length, rejections };
}

/** Everything that makes a candidate not-what-we-asked-for. */
function driftReasons(candidate: unknown, task: BackfillTask, asked: Set<string>): string[] {
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return ["candidate is not an object"];
  }
  const row = candidate as Record<string, unknown>;
  const reasons: string[] = [];

  if (typeof row.name !== "string" || !row.name.trim()) {
    reasons.push("candidate has no name — cannot be matched to a venue we asked about");
    return reasons;
  }
  if (!asked.has(norm(row.name))) {
    reasons.push(
      `researcher drift: "${row.name}" was not among the ${task.venues.length} venue(s) asked about ` +
        `for ${task.destinationId}/${task.category}`,
    );
  }
  if (row.destinationId !== task.destinationId) {
    reasons.push(
      `destination drift: candidate targets ${JSON.stringify(row.destinationId)}, task is ${JSON.stringify(task.destinationId)}`,
    );
  }
  if (row.category !== task.category) {
    reasons.push(
      `category drift: candidate targets ${JSON.stringify(row.category)}, task is ${JSON.stringify(task.category)}`,
    );
  }
  return reasons;
}

export type { Researcher, ResearchGapResult, UrlLiveResult };
