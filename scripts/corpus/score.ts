/**
 * score.ts — CORPUS-M5 scored suitability: rubric loading, the deterministic
 * caps, the scorer's view of a row, and the checks every score must pass.
 *
 * Order, per site and row:
 *   1. hard excludes (suitability.ts): a "no" row is never scored — a score can
 *      never override a rule;
 *   2. caps (rubrics/<site>.yaml `caps`): a row matching a cap pattern gets the
 *      cap's fit by rule, with no model call (e.g. the MOH golf ban → 0);
 *   3. everything else is scored by a model against the rubric, and the result is
 *      committed to scores/<site>.json (one row per line). suitability.ts merges
 *      those into suitability/<site>.json as eligible "scored" + fit/reason/provenance.
 *
 * The rubric version on every score is `rubric-<site>@<version>+<blob sha12>`,
 * so editing a rubric makes every score under it stale (verify goes red).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYamlSubset } from "./yaml-subset.ts";
import { gitBlobSha } from "./suitability.ts";
import { sharedDestinations } from "../../src/destinations-canonical.ts";
import { SHARED_GOLF_COURSES } from "../../src/golf.ts";
import type { FactsRow } from "./facts.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Sites with a rubric. M5 scores MOH and BMHQ only. */
export const SCORED_SITES = ["moh", "bestman"] as const;

export interface Cap { id: string; text: string; field: "name" | "name+highlight"; pattern: string; fit: number; cite: string; quote: string; [k: string]: unknown }
export interface Criterion { id: string; direction: "+" | "-" | "note"; text: string; cite: string; quote: string; [k: string]: unknown }
export interface Rubric {
  site: string;
  version: string;
  profile: string;
  voice: string;
  scale: { band: string; means: string }[];
  caps: Cap[];
  criteria: Criterion[];
  reason_rules: { text: string; banned_cite: string; banned_quote: string; [k: string]: unknown };
}

export const rubricPath = (site: string, root = ROOT) => resolve(root, "rubrics", `${site}.yaml`);
export const scoresPath = (site: string, root = ROOT) => resolve(root, "scores", `${site}.json`);

export function loadRubric(site: string, root = ROOT): { text: string; rubric: Rubric; version: string } {
  const text = readFileSync(rubricPath(site, root), "utf8");
  const rubric = parseYamlSubset(text) as unknown as Rubric;
  return { text, rubric, version: `rubric-${site}@${rubric.version}+${gitBlobSha(text).slice(0, 12)}` };
}

// ── caps ─────────────────────────────────────────────────────────────────────

export function capFor(rubric: Rubric, row: Pick<FactsRow, "text">): Cap | undefined {
  for (const c of rubric.caps ?? []) {
    const text = c.field === "name" ? row.text.name : `${row.text.name} ${row.text.highlight}`;
    if (new RegExp(c.pattern, "i").test(text)) return c;
  }
  return undefined;
}

// ── the MOH golf ban, independent of any rubric ──────────────────────────────

/**
 * A MOH row is golf-coded when its name or highlight says golf — the golf half of
 * MOH's own CROSS_BRAND image regex (profiles/moh.yaml:152). Verify holds every
 * such row to fit 0 whatever the rubric's caps say, so dropping the cap cannot
 * let golf through.
 */
export const MOH_GOLF_RE = /\b(top)?golf(ing)?\b/i;
export const isMohGolfText = (row: Pick<FactsRow, "text">) => MOH_GOLF_RE.test(`${row.text.name} ${row.text.highlight}`);

// ── banned words in a reason ─────────────────────────────────────────────────

/**
 * Word-level regexes for each site's BRAND.md banned words (profiles/<site>.yaml
 * voice.banned_words). Entries that are not words (emoji, imagery, "as noun")
 * are reduced to the word or glyph they name. Plurals count: MOH's own scrub
 * rewrites crew(s)/squad(s) (profiles/moh.yaml:58), so "crews" is the same ban.
 */
export const REASON_BANNED: Record<string, RegExp[]> = {
  moh: [/\bcrews?\b/i, /\bsquads?\b/i, /\bsend-it\b/i, /\bbabes?\b/i, /\bbride tribe\b/i, /\bworld-class\b/i, /\bpremium\b/i, /\btrusted\b/i, /\bcutting-edge\b/i],
  bestman: [
    /\bworld-class\b/i, /\bpremium\b/i, /\btrusted\b/i, /\bcutting-edge\b/i,
    /\bkings?\b/i, /\bgoats?\b/i, /\blegends?\b/i, /🔥/u, /👑/u, /\bgold[- ]chains?\b/i,
    /\bher\b/i, /\bshe\b/i, /\bthe bride\b/i,
  ],
};

export function bannedInReason(site: string, reason: string): string[] {
  return (REASON_BANNED[site] ?? []).filter((re) => re.test(reason)).map((re) => re.source);
}

// ── the scorer's view of a row ───────────────────────────────────────────────

const PARTY_CAT = { nightlife: "nightlife", dining: "dining", activity: "activities", lodging: "lodging", transport: "transport" } as const;
/** Fields the scorer never sees: the legacy routing tags this layer replaces, and plumbing. */
const HIDDEN = new Set(["id", "brands", "wizards", "audiences", "products", "sites", "url", "sourceUrl", "citations"]);

let rawIndex: Map<string, { raw: any; dest?: any }> | null = null;
function rawRow(id: string) {
  if (!rawIndex) {
    rawIndex = new Map();
    for (const d of sharedDestinations as any[])
      for (const cat of Object.values(PARTY_CAT)) for (const r of d[cat] as any[]) rawIndex.set(r.id, { raw: r, dest: d });
    for (const c of SHARED_GOLF_COURSES as any[]) rawIndex.set(c.id, { raw: c });
  }
  return rawIndex.get(id);
}

/** What a scoring call is shown for one row: its own fields plus its place, never legacy tags. */
export function scorerView(row: FactsRow): Record<string, unknown> {
  const hit = rawRow(row.id);
  if (!hit) throw new Error(`score: no raw row for ${row.id}`);
  const fields = Object.fromEntries(Object.entries(hit.raw).filter(([k]) => !HIDDEN.has(k)));
  const place = hit.dest
    ? { city: hit.dest.city, state: hit.dest.state, region: hit.dest.region }
    : { city: hit.raw.city, state: hit.raw.state, region: hit.raw.region };
  return { id: row.id, kind: row.kind, place, ...fields };
}

// ── score rows ───────────────────────────────────────────────────────────────

export interface ScoreRow {
  id: string;
  fit: number;
  reason: string;
  provenance: { tagger: "rules" | "llm"; model?: string; promptOrRulesVersion: string };
}

export function loadScores(site: string, root = ROOT): { rubricVersion: string; rows: ScoreRow[] } | null {
  const p = scoresPath(site, root);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

/** Row-level checks on one score, independent of the suitability file. */
export function checkScore(site: string, s: ScoreRow, rubricVersion: string, golfCapped: boolean): string[] {
  const out: string[] = [];
  if (typeof s.fit !== "number" || !(s.fit >= 0 && s.fit <= 1)) out.push(`${s.id}: fit ${s.fit} is not in [0,1]`);
  if (!s.reason || typeof s.reason !== "string") out.push(`${s.id}: no reason`);
  else {
    if (s.reason.length > 200) out.push(`${s.id}: reason is ${s.reason.length} chars (max 200)`);
    for (const b of bannedInReason(site, s.reason)) out.push(`${s.id}: reason uses a banned word (${b})`);
  }
  if (s.provenance?.promptOrRulesVersion !== rubricVersion) out.push(`${s.id}: scored under ${s.provenance?.promptOrRulesVersion}, rubric is ${rubricVersion} (stale — rescore)`);
  if (s.provenance?.tagger === "llm" && !s.provenance.model) out.push(`${s.id}: llm score without a model`);
  if (s.provenance?.tagger !== "llm" && s.provenance?.tagger !== "rules") out.push(`${s.id}: tagger "${s.provenance?.tagger}"`);
  if (golfCapped && s.fit > 0) out.push(`${s.id}: a golf-capped row has fit ${s.fit} (> 0)`);
  return out;
}

// ── the scoring prompt (one batch of rows, scored row by row) ────────────────

export function renderScoringPrompt(site: string, rows: FactsRow[], root = ROOT): string {
  const { rubric, version } = loadRubric(site, root);
  const lines: string[] = [];
  lines.push(`You are scoring catalog rows for one site's brand fit. Rubric: ${version}. Site voice: ${rubric.voice}.`);
  lines.push(`Score EACH row on its own, against this rubric only. Do not compare rows with each other. Do not look anything up, and use no tools: judge only the fields shown.`);
  lines.push("", "FIT SCALE (0 to 1, in steps of 0.05):");
  for (const b of rubric.scale) lines.push(`- ${b.band}: ${b.means}`);
  lines.push("", "CRITERIA (+ scores up, - scores down, note = do not mark down for this):");
  for (const c of rubric.criteria) lines.push(`- [${c.id}] (${c.direction}) ${c.text}`);
  lines.push("", `REASON: ${rubric.reason_rules.text}`);
  lines.push("", "ROWS (JSON, one per line):");
  for (const r of rows) lines.push(JSON.stringify(scorerView(r)));
  lines.push("", `Answer with ONLY a JSON array, one object per row in the same order, exactly: [{"id": "<row id>", "fit": <number>, "reason": "<one sentence>"}]. No prose before or after.`);
  return lines.join("\n");
}

/** Validate one batch answer against the rows asked; returns ScoreRows or throws naming the fault. */
export function ingestAnswer(site: string, asked: FactsRow[], answer: unknown, model: string, root = ROOT): ScoreRow[] {
  const { version } = loadRubric(site, root);
  if (!Array.isArray(answer)) throw new Error("answer is not a JSON array");
  const want = new Set(asked.map((r) => r.id));
  const out: ScoreRow[] = [];
  for (const a of answer as any[]) {
    if (!want.has(a?.id)) throw new Error(`answer has an id that was not asked: ${a?.id}`);
    want.delete(a.id);
    const fit = Math.round(Number(a.fit) * 20) / 20;
    out.push({ id: a.id, fit, reason: String(a.reason ?? "").trim(), provenance: { tagger: "llm", model, promptOrRulesVersion: version } });
  }
  if (want.size) throw new Error(`answer is missing ${want.size} row(s): ${[...want].slice(0, 3).join(", ")}`);
  return out;
}

/** A capped row's score, decided by rule with no model call. */
export function capScore(site: string, cap: Cap, id: string, root = ROOT): ScoreRow {
  const { version } = loadRubric(site, root);
  return { id, fit: cap.fit, reason: `${cap.id}: ${cap.text.split(":")[0].split(".")[0]}.`.slice(0, 160), provenance: { tagger: "rules", promptOrRulesVersion: version } };
}

/** scores/<site>.json, one row per line, sorted by id so a rescore diffs row by row. */
export function renderScores(site: string, rows: ScoreRow[], root = ROOT): string {
  const { version } = loadRubric(site, root);
  const sorted = [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const head = { site, format: 1, note: "CORPUS-M5 rubric scores. Written by the scoring run (scripts/corpus/score.ts helpers); merged into suitability/<site>.json by scripts/corpus/suitability.ts. A score is never applied to a row a hard exclude marks no.", rubricVersion: version, count: rows.length };
  return JSON.stringify(head, null, 2).slice(0, -2) + ',\n  "rows": [\n' + sorted.map((r) => "    " + JSON.stringify(r)).join(",\n") + "\n  ]\n}\n";
}
