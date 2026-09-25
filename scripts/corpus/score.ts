/**
 * score.ts — CORPUS-M5 scored suitability: rubric loading, the deterministic
 * caps, rules and flags, the scorer's view of a row, and the checks every score
 * must pass. Rubric v1.1 (R1 FIX round 1) scores what a venue IS, not its copy.
 *
 * Order, per site and row:
 *   1. hard excludes (suitability.ts): a "no" row is never scored — a score can
 *      never override a rule;
 *   2. caps (rubric `caps`): a row matching a cap pattern gets the cap's fit by
 *      rule, with no model call (the MOH golf ban → 0; BMHQ strip clubs → 0.1);
 *   3. utility (rubric `utility`): transport is class "utility", by rule, no fit;
 *   4. everything else: a model gives one 0-1 score per judged criterion over a
 *      view of the row whose occasion words are neutralised; the deterministic
 *      rules (group size, rental house) are computed here, and fit is computed
 *      here from both (rubric `combine`). The other-occasion pitch is a flag set
 *      by rule. Results go to scores/<site>.json; suitability.ts merges them into
 *      suitability/<site>.json as eligible "scored".
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
import { factsRows, type FactsRow } from "./facts.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Sites with a rubric. M5 scores MOH and BMHQ only. */
export const SCORED_SITES = ["moh", "bestman"] as const;

export interface Cap { id: string; text: string; field: "name" | "name+highlight"; pattern: string; fit: number; cite: string; quote: string; [k: string]: unknown }
export interface Criterion { id: string; direction: "+" | "-"; part: "kind" | "practical"; weight: number; rationale: string; text: string; cite: string; quote: string; [k: string]: unknown }
export interface Rule { id: string; part: "practical"; weight: number; kinds?: string[]; rationale: string; text: string; cite: string; quote: string; [k: string]: unknown }
export interface Anchor { id: string; band: "low" | "mid" | "high"; example: string; scores: Record<string, number> }
export interface Rubric {
  site: string;
  version: string;
  profile: string;
  voice: string;
  thresholds: { low: number; good: number; ruling: string };
  combine: { formula: string; rationale: string };
  scale: { band: string; means: string; rationale: string }[];
  caps: Cap[];
  utility: { id: string; kinds: string[]; text: string; ruling: string; [k: string]: unknown };
  occasion: { id: string; effect: "flag"; text: string; cite: string; quote: string; [k: string]: unknown };
  /** the before-10 rule (MOH only): decides a row by rule when its fields say it only happens before 10 AM */
  window?: { id: string; effect: "cap"; fit: number; kinds: string[]; text: string; cite: string; quote: string; [k: string]: unknown };
  /** calibration anchors (MOH, DRV CORPUS-M5-FIX3 ruling 2): the same rows head every batch, with reference scores */
  anchors?: Anchor[];
  rules: Rule[];
  criteria: Criterion[];
  notes: { id: string; text: string; cite: string; quote: string }[];
  conditional: { id: string; applies_when: string; text: string; cite: string; quote: string }[];
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


// ── occasion words (R1 F2) ───────────────────────────────────────────────────

/**
 * The two occasions' words. They are used twice: replaced by "[occasion]" in the
 * scorer's view of the row's copy, so a score judges the venue and not whom its
 * row was written for; and read by the deterministic other-occasion flag.
 */
export const OCCASION_WORDS = {
  bachelor: /\b(?:bachelors?|grooms?|groomsm[ae]n|best m[ae]n|stag (?:dos?|part(?:y|ies)|nights?|weekends?)|the guys|the boys)\b/i,
  bachelorette: /\b(?:bachelorettes?|brides?|bridal|bridesmaids?|bride-to-be|maids? of honou?r|hen (?:dos?|part(?:y|ies)|nights?|weekends?)|girls'? (?:trips?|weekends?|nights?)|the girls)\b/i,
} as const;
const OWN_OCCASION: Record<string, keyof typeof OCCASION_WORDS> = { moh: "bachelorette", bestman: "bachelor" };
const OTHER_OCCASION: Record<string, keyof typeof OCCASION_WORDS> = { moh: "bachelor", bestman: "bachelorette" };
export const OCCASION_TOKEN = "[occasion]";

export function neutraliseOccasion(s: string): string {
  let out = s;
  for (const re of Object.values(OCCASION_WORDS)) out = out.replace(new RegExp(re.source, "gi"), OCCASION_TOKEN);
  return out;
}

// ── the scorer's view of a row ───────────────────────────────────────────────

const PARTY_CAT = { nightlife: "nightlife", dining: "dining", activity: "activities", lodging: "lodging", transport: "transport" } as const;
/** Fields the scorer never sees: the legacy routing tags this layer replaces, and plumbing. */
const HIDDEN = new Set(["id", "brands", "wizards", "audiences", "products", "sites", "url", "sourceUrl", "citations"]);
/** Fields that are the venue's identity, never neutralised or read as copy. */
const IDENTITY = new Set(["id", "name"]);

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

/**
 * What a scoring call is shown for one row: its own fields plus its place, never
 * legacy tags. Occasion words in the copy (every text field but the name) are
 * replaced by "[occasion]" — a venue name like "Mt. Bachelor" is its identity.
 */
export function scorerView(row: FactsRow): Record<string, unknown> {
  const hit = rawRow(row.id);
  if (!hit) throw new Error(`score: no raw row for ${row.id}`);
  const neutral = (k: string, v: unknown): unknown =>
    IDENTITY.has(k) ? v : typeof v === "string" ? neutraliseOccasion(v) : Array.isArray(v) ? v.map((x) => (typeof x === "string" ? neutraliseOccasion(x) : x)) : v;
  const fields = Object.fromEntries(Object.entries(hit.raw).filter(([k]) => !HIDDEN.has(k)).map(([k, v]) => [k, neutral(k, v)]));
  const place = hit.dest
    ? { city: hit.dest.city, state: hit.dest.state, region: hit.dest.region }
    : { city: hit.raw.city, state: hit.raw.state, region: hit.raw.region };
  return { id: row.id, kind: row.kind, place, ...fields };
}

/** The row's copy: every text field but its identity and plumbing, joined. */
function copyOf(raw: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(raw)) {
    if (IDENTITY.has(k) || HIDDEN.has(k)) continue;
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) for (const x of v) if (typeof x === "string") parts.push(x);
  }
  return parts.join(" \n ");
}

// ── deterministic signals (R1 F2 + F8) ───────────────────────────────────────

const rubricCache = new Map<string, { text: string; rubric: Rubric; version: string }>();
function rubricOf(site: string, root = ROOT) {
  const k = `${root}|${site}`;
  if (!rubricCache.has(k)) rubricCache.set(k, loadRubric(site, root));
  return rubricCache.get(k)!;
}

/**
 * pitched-at-other-occasion: the row's copy names the other occasion and never
 * its own. Set by rule; it never changes the fit (rubric `occasion.effect: flag`).
 */
export function pitchFlags(site: string, row: { id: string; raw?: Record<string, unknown> }, root = ROOT): string[] {
  const raw = row.raw ?? rawRow(row.id)?.raw;
  if (!raw) throw new Error(`score: no raw row for ${row.id}`);
  const copy = copyOf(raw);
  const other = OCCASION_WORDS[OTHER_OCCASION[site]], own = OCCASION_WORDS[OWN_OCCASION[site]];
  return other.test(copy) && !own.test(copy) ? [rubricOf(site, root).rubric.occasion.id] : [];
}

const VEGAS_MIAMI = new Set(["las-vegas-nv", "miami-fl"]);
/** The deterministic rules, keyed by id without the site prefix. undefined = the row lacks the field. */
const RULE_FNS: Record<string, (row: FactsRow, raw: any) => number | undefined> = {
  "r-group": (row, raw) => {
    if (row.kind === "nightlife" || row.kind === "dining") return typeof raw.groupFriendly === "boolean" ? (raw.groupFriendly ? 1 : 0.3) : undefined;
    if (row.kind === "activity") return typeof raw.groupMax === "number" ? (raw.groupMax >= 8 ? 1 : raw.groupMax >= 4 ? 0.6 : 0.3) : undefined;
    if (row.kind === "lodging") {
      if (raw.perRoom === true) return 0.6;
      return typeof raw.maxGuests === "number" ? (raw.maxGuests >= 8 ? 1 : raw.maxGuests >= 4 ? 0.6 : 0.3) : undefined;
    }
    return undefined;
  },
  "r-rental-house": (row, raw) => {
    if (row.kind !== "lodging" || typeof raw.type !== "string") return undefined;
    if (raw.type === "house" || raw.type === "airbnb") return 1;
    return VEGAS_MIAMI.has(row.destId ?? "") ? 0.9 : 0.4;
  },
};

export function ruleScores(site: string, row: FactsRow, root = ROOT): Record<string, number> {
  const { rubric } = rubricOf(site, root);
  const raw = rawRow(row.id)?.raw;
  const out: Record<string, number> = {};
  for (const r of rubric.rules ?? []) {
    if (r.kinds && !r.kinds.includes(row.kind)) continue;
    const fn = RULE_FNS[r.id.slice(site.length + 1)];
    if (!fn) throw new Error(`rubrics/${site}.yaml rule ${r.id} has no implementation in score.ts RULE_FNS`);
    const v = fn(row, raw ?? {});
    if (v !== undefined) out[r.id] = v;
  }
  return out;
}

const round20 = (x: number) => Math.round(x * 20) / 20;

/** fit = K × (0.5 + 0.5 × P) (rubric `combine`): K = kind criteria, P = practical criteria + rules present. */
export function combineFit(site: string, scores: Record<string, number>, rules: Record<string, number>, root = ROOT): number {
  const { rubric } = rubricOf(site, root);
  const mean = (items: { w: number; v: number }[]) => {
    const w = items.reduce((a, b) => a + b.w, 0);
    return w ? items.reduce((a, b) => a + b.w * b.v, 0) / w : 1;
  };
  const K = mean(rubric.criteria.filter((c) => c.part === "kind").map((c) => ({ w: c.weight, v: scores[c.id] })));
  const P = mean([
    ...rubric.criteria.filter((c) => c.part === "practical").map((c) => ({ w: c.weight, v: scores[c.id] })),
    ...rubric.rules.filter((r) => r.id in rules).map((r) => ({ w: r.weight, v: rules[r.id] })),
  ]);
  return round20(K * (0.5 + 0.5 * P));
}

// ── the before-10 rule (DRV CORPUS-M5-FIX2 ruling 2) ─────────────────────────

/** An early time named in the copy: dawn and its synonyms, early morning, or a 4-9 AM clock time that is not a closing time. */
const EARLY = /\b(?:pre-dawn|dawn|sunrise|first light|daybreak|early[- ]morning)\b|(?<!\b(?:until|till|til|to)\s)\b0?[4-9](?::[0-5]\d)?\s?a\.?m\.?(?![a-z])/i;
/** A later time named in the copy, or the early time offered as one option of two: the rule stays off. */
const LATER = /\b(?:sunset|dusk|afternoons?|evenings?|nights?|nighttime|after dark)\b|\b(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s?p\.?m\.?(?![a-z])|\b(?:sunrise|dawn)\s+or\b|\bor\s+(?:at\s+)?(?:sunrise|dawn)\b/i;
const BACK_BY_NOON = /\bback (?:by|before) (?:lunch|noon|midday)\b/i;
/** The site's own "morning" slot (never "morning-after", the recovery day). */
const MORNING_SLOT = /\bmorning\b(?!-after)/i;
/** A morning slot ends by 1 PM, so one longer than 3 hours has to start before 10. */
const MORNING_MAX_HOURS = 3;

/** The shortest duration a row's `duration` field states, in hours; undefined when it states none. */
export function durationHours(d: unknown): number | undefined {
  if (typeof d !== "string") return undefined;
  if (/\bhalf[- ]day\b/i.test(d)) return 4;
  if (/\b(?:full[- ]day|all day)\b/i.test(d)) return 8;
  const h = /(\d+(?:\.\d+)?)(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:h|hrs?|hours?)\b/i.exec(d);
  if (h) return Number(h[1]);
  const m = /(\d+)(?:\s*[-–]\s*\d+)?\s*min/i.exec(d);
  return m ? Number(m[1]) / 60 : undefined;
}

/**
 * The row's fields say it only happens before 10 AM: its copy (never its name) names
 * dawn, sunrise, early morning or a 4-9 AM start; or it is a morning slot (bestFor
 * "morning", or "back by lunch") longer than 3 hours, which must start before 10 to end
 * by 1 PM. Never when the copy also names a later time or offers the early time as one
 * option of two. Reads the row's fields only; no venue names are listed.
 */
export function beforeTen(raw: Record<string, unknown>): boolean {
  const copy = copyOf(raw);
  if (LATER.test(copy)) return false;
  if (EARLY.test(copy)) return true;
  const morningSlot = MORNING_SLOT.test(String(raw.bestFor ?? "")) || BACK_BY_NOON.test(copy);
  const h = durationHours(raw.duration);
  return morningSlot && h !== undefined && h > MORNING_MAX_HOURS;
}

/** How a row is decided: a cap by rule, the utility class by rule, or a model score. */
export function decide(site: string, row: FactsRow, root = ROOT): { by: "cap"; cap: Pick<Cap, "id" | "text" | "fit"> } | { by: "utility" } | { by: "llm" } {
  const { rubric } = rubricOf(site, root);
  const cap = capFor(rubric, row);
  if (cap) return { by: "cap", cap };
  if (rubric.utility?.kinds.includes(row.kind)) return { by: "utility" };
  if (rubric.window?.kinds.includes(row.kind) && beforeTen(rawRow(row.id)?.raw ?? {})) return { by: "cap", cap: rubric.window };
  return { by: "llm" };
}

// ── calibration anchors (DRV CORPUS-M5-FIX3 ruling 2) ────────────────────────

/** An anchor's reference fit: the rubric's combine over its reference scores and its own rules. */
export function anchorRef(site: string, a: Anchor, root = ROOT): number {
  const row = factsById(a.id);
  if (!row) throw new Error(`anchor ${a.id} is not a facts row`);
  return combineFit(site, a.scores, ruleScores(site, row, root), root);
}

/**
 * What is wrong with a site's anchors (none = []): each must be a facts row decided by a model call,
 * not a control, with reference scores for exactly the rubric's criteria, a reference fit inside its
 * band, and an `example` that is the rubric's own text. `list` overrides the rubric's (for tests).
 */
export function anchorProblems(site: string, list?: Anchor[], root = ROOT): string[] {
  const { rubric, text } = rubricOf(site, root);
  const anchors = list ?? rubric.anchors ?? [];
  const out: string[] = [];
  const ctlPath = resolve(root, "rubrics", "controls.json");
  const ctl = existsSync(ctlPath) ? JSON.parse(readFileSync(ctlPath, "utf8"))[site] ?? {} : {};
  const controls = new Set<string>([...(ctl.bad ?? []), ...(ctl.good ?? [])]);
  const body = text.split("\n").filter((l) => !/^\s*#/.test(l) && !/^\s*- \{id: /.test(l)).join("\n");
  const want = rubric.criteria.map((c) => c.id);
  const seen = new Set<string>();
  for (const a of anchors) {
    if (seen.has(a.id)) out.push(`anchor ${a.id}: listed twice`);
    seen.add(a.id);
    const row = factsById(a.id);
    if (!row) { out.push(`anchor ${a.id}: not a facts row`); continue; }
    if (decide(site, row, root).by !== "llm") out.push(`anchor ${a.id}: decided by rule, not a model call`);
    if (controls.has(a.id)) out.push(`anchor ${a.id}: is a control (controls test the scorer; an anchor calibrates it)`);
    if (!a.example || !body.includes(a.example)) out.push(`anchor ${a.id}: example "${a.example}" is not text of rubrics/${site}.yaml`);
    if (!sameSet(Object.keys(a.scores ?? {}), want)) { out.push(`anchor ${a.id}: reference scores must cover exactly ${want.join(", ")}`); continue; }
    const ref = anchorRef(site, a, root), t = rubric.thresholds;
    const inBand = a.band === "low" ? ref <= t.low : a.band === "high" ? ref >= t.good : ref > t.low && ref < t.good;
    if (!inBand) out.push(`anchor ${a.id}: reference fit ${ref} is not in its band "${a.band}"`);
  }
  return out;
}

/** The anchors' fits in one answer, in rubric order, next to their reference fit. */
export function anchorFits(site: string, answer: unknown, root = ROOT): { id: string; band: string; ref: number; fit: number; scores: Record<string, number> }[] {
  const { rubric } = rubricOf(site, root);
  const byId = new Map(((answer as any[]) ?? []).map((a) => [a?.id, a]));
  return (rubric.anchors ?? []).map((a) => {
    const got = byId.get(a.id);
    if (!got) throw new Error(`answer is missing anchor ${a.id}`);
    const scores = Object.fromEntries(rubric.criteria.map((c) => [c.id, round20(Number(got.scores?.[c.id]))]));
    return { id: a.id, band: a.band, ref: anchorRef(site, a, root), fit: combineFit(site, scores, ruleScores(site, factsById(a.id)!, root), root), scores };
  });
}

let factsIndex: Map<string, FactsRow> | null = null;
function factsById(id: string): FactsRow | undefined {
  if (!factsIndex) factsIndex = new Map(factsRows().map((r) => [r.id, r]));
  return factsIndex.get(id);
}

// ── score rows ───────────────────────────────────────────────────────────────

export interface Provenance {
  tagger: "rules" | "llm";
  /** the model id the scoring call reported (read from its transcript), llm rows only */
  model?: string;
  promptOrRulesVersion: string;
  scoredAt: string;
  runId: string;
}
export interface ScoreRow {
  id: string;
  /** "fit" = graded on brand fit; "utility" = transport, not graded (no fit) */
  class: "fit" | "utility";
  fit?: number;
  /** the model's 0-1 score per judged criterion (llm rows) */
  scores?: Record<string, number>;
  /** the deterministic rules that applied, with their 0-1 values */
  rules?: Record<string, number>;
  /** deterministic flags (the other-occasion pitch); they never change fit */
  flags?: string[];
  reason: string;
  provenance: Provenance;
}
export interface RunMeta { model: string; runId: string; scoredAt: string }

export function loadScores(site: string, root = ROOT): { rubricVersion: string; rows: ScoreRow[] } | null {
  const p = scoresPath(site, root);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

const withFlags = (r: ScoreRow, flags: string[]): ScoreRow => (flags.length ? { ...r, flags } : r);

/** An llm score: the model's per-criterion scores, the rules and the fit computed here. */
export function buildLlmScore(site: string, row: FactsRow, scores: Record<string, number>, reason: string, meta: RunMeta, root = ROOT): ScoreRow {
  const { version } = rubricOf(site, root);
  const rules = ruleScores(site, row, root);
  return withFlags(
    { id: row.id, class: "fit", fit: combineFit(site, scores, rules, root), scores, rules, reason, provenance: { tagger: "llm", model: meta.model, promptOrRulesVersion: version, scoredAt: meta.scoredAt, runId: meta.runId } },
    pitchFlags(site, row, root),
  );
}

/** A row decided by rule (a cap or the utility class), with no model call. */
export function ruleScore(site: string, row: FactsRow, meta: Omit<RunMeta, "model">, root = ROOT): ScoreRow {
  const { rubric, version } = rubricOf(site, root);
  const d = decide(site, row, root);
  const provenance: Provenance = { tagger: "rules", promptOrRulesVersion: version, scoredAt: meta.scoredAt, runId: meta.runId };
  if (d.by === "cap") return withFlags({ id: row.id, class: "fit", fit: d.cap.fit, reason: `${d.cap.id}: ${d.cap.text.split(/[.:](?:\s|$)/)[0]}; fit ${d.cap.fit} by rule.`.slice(0, 160), provenance }, pitchFlags(site, row, root));
  if (d.by === "utility") return withFlags({ id: row.id, class: "utility", reason: `${rubric.utility.id}: transport is a utility, not graded on brand fit.`, provenance }, pitchFlags(site, row, root));
  throw new Error(`${row.id} is not decided by rule`);
}

/** Every id a reason may cite: caps, utility, the occasion flag, rules, criteria and notes (never a conditional). */
export function citableIds(rubric: Rubric): Set<string> {
  return new Set([
    ...(rubric.caps ?? []).map((c) => c.id),
    ...(rubric.utility ? [rubric.utility.id] : []),
    ...(rubric.occasion ? [rubric.occasion.id] : []),
    ...(rubric.window ? [rubric.window.id] : []),
    ...(rubric.rules ?? []).map((r) => r.id),
    ...(rubric.criteria ?? []).map((c) => c.id),
    ...(rubric.notes ?? []).map((n) => n.id),
  ]);
}
/** An id-shaped token in a reason: site-prefixed or bare shorthand (c-voice, r-group, cap-golf). */
const ID_TOKEN = /(?<![\w-])(?:(?:moh|bestman)-)?(?:c|r|n|k|cap)-[a-z0-9]+(?:-[a-z0-9]+)*/g;
const citesId = (reason: string, id: string) => new RegExp(`(?<![\\w-])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`).test(reason);
/** A reason must judge the venue, not the writing (R1 F2). */
export const COPY_GRADING = /generic|filler|hype|blurb|copy/i;

const sameSet = (a: string[] = [], b: string[] = []) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);
const sameMap = (a: Record<string, number> = {}, b: Record<string, number> = {}) =>
  sameSet(Object.keys(a), Object.keys(b)) && Object.keys(a).every((k) => Math.abs(a[k] - b[k]) < 1e-9);

/**
 * Row-level checks on one score. With `row` (the facts row) it also recomputes
 * what the rules decide — the cap, the utility class, the rule values, the flags
 * and the fit from the model's per-criterion scores — and fails any mismatch.
 */
export function checkScore(site: string, s: ScoreRow, rub: { rubric: Rubric; version: string }, row?: FactsRow, golfCapped = false): string[] {
  const out: string[] = [];
  const { rubric, version } = rub;
  if (s.class !== "fit" && s.class !== "utility") out.push(`${s.id}: class "${s.class}" (fit or utility)`);
  if (s.class === "utility") {
    if ("fit" in s) out.push(`${s.id}: a utility row carries a fit`);
  } else if (typeof s.fit !== "number" || !(s.fit >= 0 && s.fit <= 1)) out.push(`${s.id}: fit ${s.fit} is not in [0,1]`);
  if (!s.reason || typeof s.reason !== "string") out.push(`${s.id}: no reason`);
  else {
    if (s.reason.length > 200) out.push(`${s.id}: reason is ${s.reason.length} chars (max 200)`);
    for (const b of bannedInReason(site, s.reason)) out.push(`${s.id}: reason uses a banned word (${b})`);
    const cg = COPY_GRADING.exec(s.reason);
    if (cg) out.push(`${s.id}: reason grades the row's copy ("${cg[0]}") — score the venue`);
    const ids = citableIds(rubric);
    const toks = s.reason.match(ID_TOKEN) ?? [];
    if (![...ids].some((id) => citesId(s.reason, id))) out.push(`${s.id}: reason cites no rubric id`);
    for (const t of toks) if (!ids.has(t)) out.push(`${s.id}: reason cites "${t}", which is not a rubric id`);
  }
  const pv = s.provenance ?? ({} as Provenance);
  if (pv.promptOrRulesVersion !== version) out.push(`${s.id}: scored under ${pv.promptOrRulesVersion}, rubric is ${version} (stale — rescore)`);
  if (pv.tagger !== "llm" && pv.tagger !== "rules") out.push(`${s.id}: tagger "${pv.tagger}"`);
  if (pv.tagger === "llm" && !pv.model) out.push(`${s.id}: llm score without a model`);
  if (pv.tagger === "llm" && pv.model && !/^claude-[a-z0-9-]+$/.test(pv.model)) out.push(`${s.id}: model "${pv.model}" is not a model id`);
  if (!pv.scoredAt) out.push(`${s.id}: provenance has no scoredAt`);
  else if (Number.isNaN(Date.parse(pv.scoredAt))) out.push(`${s.id}: scoredAt "${pv.scoredAt}" is not a date`);
  if (!pv.runId) out.push(`${s.id}: provenance has no runId`);
  if (pv.tagger === "llm") {
    const want = rubric.criteria.map((c) => c.id);
    if (!s.scores || !sameSet(Object.keys(s.scores), want)) out.push(`${s.id}: llm scores must cover exactly ${want.join(", ")}`);
    else for (const [k, v] of Object.entries(s.scores)) if (!(typeof v === "number" && v >= 0 && v <= 1)) out.push(`${s.id}: score ${k}=${v} is not in [0,1]`);
  }
  if (row) {
    const d = decide(site, row);
    if (d.by === "cap" && !(pv.tagger === "rules" && s.class === "fit" && s.fit === d.cap.fit)) out.push(`${s.id}: cap ${d.cap.id} decides this row (fit ${d.cap.fit}, by rule)`);
    if (d.by === "utility" && !(pv.tagger === "rules" && s.class === "utility")) out.push(`${s.id}: a ${row.kind} row is class utility, by rule`);
    if (d.by === "llm") {
      if (pv.tagger !== "llm" || s.class !== "fit") out.push(`${s.id}: must be an llm fit score`);
      const rules = ruleScores(site, row);
      if (!sameMap(s.rules, rules)) out.push(`${s.id}: rules ${JSON.stringify(s.rules ?? {})} ≠ recomputed ${JSON.stringify(rules)}`);
      else if (s.scores && sameSet(Object.keys(s.scores), rubric.criteria.map((c) => c.id)) && combineFit(site, s.scores, rules) !== s.fit)
        out.push(`${s.id}: fit ${s.fit} ≠ ${combineFit(site, s.scores, rules)} computed from its scores (rubric combine)`);
    }
    const flags = pitchFlags(site, row);
    if (!sameSet(s.flags ?? [], flags)) out.push(`${s.id}: flags ${JSON.stringify(s.flags ?? [])} ≠ recomputed ${JSON.stringify(flags)}`);
  }
  if (golfCapped && !(s.class === "fit" && s.fit === 0)) out.push(`${s.id}: a golf-capped row has fit ${s.fit} (> 0)`);
  return out;
}

// ── the scoring prompt (one batch of rows, scored row by row) ────────────────

export function renderScoringPrompt(site: string, rows: FactsRow[], root = ROOT): string {
  const { rubric, version } = loadRubric(site, root);
  const ids = rubric.criteria.map((c) => c.id);
  const L: string[] = [];
  L.push(`You are scoring catalog venues for one site's brand fit. Rubric: ${version}. Site voice: ${rubric.voice}.`);
  L.push(`Score EACH row on its own, against this rubric only. Do not compare rows with each other. Do not look anything up, and use no tools: judge only the fields shown.`);
  L.push(`Judge what each venue IS, not how its row is written. Occasion words in the rows have been replaced by ${OCCASION_TOKEN}; ignore that token.`);
  L.push("", "CRITERIA. Give every row a score from 0 to 1 (steps of 0.1) on EACH of these:");
  for (const c of rubric.criteria) L.push(`- [${c.id}] ${c.text}`);
  L.push("", "NOTES (never mark a row down for these):");
  for (const n of rubric.notes ?? []) L.push(`- [${n.id}] ${n.text}`);
  L.push("", `REASON: ${rubric.reason_rules.text}`);
  const anchors = rubric.anchors ?? [];
  const anchorIds = new Set(anchors.map((a) => a.id));
  for (const r of rows) if (anchorIds.has(r.id)) throw new Error(`score: ${r.id} is a calibration anchor and cannot be a batch row`);
  if (anchors.length) {
    L.push("", `CALIBRATION. The first ${anchors.length} rows below are fixed reference rows. They head every batch, in this order, with the scores this rubric gives them (band = where their fit lands: low <= ${rubric.thresholds.low}, good >= ${rubric.thresholds.good}). Use them to set your scale, then score them too, like any other row:`);
    for (const a of anchors) L.push(`- ${a.id} (${a.band}; the rubric's "${a.example}"): ${JSON.stringify(a.scores)}`);
  }
  L.push("", "ROWS (JSON, one per line):");
  for (const r of [...anchors.map((a) => factsById(a.id)!), ...rows]) L.push(JSON.stringify(scorerView(r)));
  L.push("", `Answer with ONLY a JSON array, one object per row in the same order, exactly: [{"id": "<row id>", "scores": {${ids.map((i) => `"${i}": <0-1>`).join(", ")}}, "reason": "<one sentence>"}]. No prose before or after.`);
  return L.join("\n");
}

/** Validate one batch answer against the rows asked; returns ScoreRows or throws naming the fault. */
export function ingestAnswer(site: string, asked: FactsRow[], answer: unknown, meta: RunMeta, root = ROOT): ScoreRow[] {
  const { rubric } = loadRubric(site, root);
  if (!Array.isArray(answer)) throw new Error("answer is not a JSON array");
  const byId = new Map(asked.map((r) => [r.id, r]));
  const want = new Set(byId.keys());
  const anchorsLeft = new Set((rubric.anchors ?? []).map((a) => a.id));
  const out: ScoreRow[] = [];
  for (const a of answer as any[]) {
    if (anchorsLeft.delete(a?.id)) continue; // reported by anchorFits, never a score row
    if (!want.has(a?.id)) throw new Error(`answer has an id that was not asked (or twice): ${a?.id}`);
    want.delete(a.id);
    const scores: Record<string, number> = {};
    for (const c of rubric.criteria) {
      const v = Number(a.scores?.[c.id]);
      if (!(v >= 0 && v <= 1)) throw new Error(`${a.id}: score ${c.id}=${a.scores?.[c.id]} is not in [0,1]`);
      scores[c.id] = round20(v);
    }
    out.push(buildLlmScore(site, byId.get(a.id)!, scores, String(a.reason ?? "").trim(), meta, root));
  }
  if (want.size) throw new Error(`answer is missing ${want.size} row(s): ${[...want].slice(0, 3).join(", ")}`);
  if (anchorsLeft.size) throw new Error(`answer is missing ${anchorsLeft.size} calibration anchor(s): ${[...anchorsLeft].join(", ")}`);
  return out;
}

// ── the call's transcript (R1 F1 + F7) ───────────────────────────────────────

/** The one model id a subagent transcript's assistant turns report; throws on none or several. */
export function modelFromTranscript(jsonl: string): string {
  const models = new Set<string>();
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    const e = JSON.parse(line);
    const m = e?.type === "assistant" ? e.message?.model : undefined;
    if (m && m !== "<synthetic>") models.add(m);
  }
  if (!models.size) throw new Error("transcript: no assistant model");
  if (models.size > 1) throw new Error(`transcript: more than one model (${[...models].join(", ")})`);
  return [...models][0];
}

/**
 * Token usage summed over a transcript's assistant messages (deduped by message id: one API
 * call can span several lines). Measured 2026-09-25: the transcript's output_tokens is a
 * streaming snapshot (2 on a message carrying ~56 KB of thinking + tool input), so output is
 * also reported as `outputChars` — the assistant content actually written — to estimate from.
 */
export function usageFromTranscript(jsonl: string): { calls: number; input: number; cacheWrite: number; cacheRead: number; output: number; outputChars: number } {
  const byMsg = new Map<string, any>();
  let anon = 0, outputChars = 0;
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    const e = JSON.parse(line);
    if (e?.type !== "assistant" || !e.message?.usage) continue;
    for (const c of e.message.content ?? []) outputChars += (c.thinking ?? c.text ?? JSON.stringify(c.input ?? "")).length;
    byMsg.set(e.message.id ?? `anon-${anon++}`, e.message.usage);
  }
  const t = { calls: byMsg.size, input: 0, cacheWrite: 0, cacheRead: 0, output: 0, outputChars };
  for (const u of byMsg.values()) {
    t.input += u.input_tokens ?? 0;
    t.cacheWrite += u.cache_creation_input_tokens ?? 0;
    t.cacheRead += u.cache_read_input_tokens ?? 0;
    t.output += u.output_tokens ?? 0;
  }
  return t;
}

/** scores/<site>.json, one row per line, sorted by id so a rescore diffs row by row. */
export function renderScores(site: string, rows: ScoreRow[], root = ROOT): string {
  const { version } = loadRubric(site, root);
  const sorted = [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const head = { site, format: 2, note: "CORPUS-M5 rubric scores (rubric v1.1 shape: class fit|utility, per-criterion scores, rules, flags). Written by the scoring run (scripts/corpus/score.ts helpers); merged into suitability/<site>.json by scripts/corpus/suitability.ts. A score is never applied to a row a hard exclude marks no.", rubricVersion: version, count: rows.length };
  return JSON.stringify(head, null, 2).slice(0, -2) + ',\n  "rows": [\n' + sorted.map((r) => "    " + JSON.stringify(r)).join(",\n") + "\n  ]\n}\n";
}
