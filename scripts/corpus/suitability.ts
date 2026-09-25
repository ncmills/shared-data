/**
 * suitability.ts — builds `suitability/<site>.json`, RULES ONLY (CORPUS-M4).
 *
 *   npx tsx scripts/corpus/suitability.ts           # write all six files
 *   npx tsx scripts/corpus/suitability.ts --check   # exit 1 if any file is stale
 *
 * One row per facts id (the M3a ids: every party row + every golf course; see
 * facts.ts). For each site, the `hard_excludes` in `profiles/<site>.yaml` are
 * evaluated against the row's facets:
 *   - a row matched by any rule → `eligible: "no"`, `reason` = the first
 *     matching rule id (the file header maps each id to its text + cite),
 *     `rules` = every matching rule id when more than one matched,
 *     `provenance.tagger = "rules@<git blob sha of the profile file>"`;
 *   - every other row → `eligible: "unreviewed"`.
 * Rules NEVER write "yes", and nothing here writes `fit` — scoring is M5. An
 * unreviewed row carries no reason and no provenance: nothing decided it.
 *
 * The tagger id is the git blob sha (`git hash-object`) of the profile file, so
 * a suitability file is tied to the exact rules that produced it, and verify
 * fails when a profile is edited without regenerating.
 *
 * Nothing in `src/` imports this, and no consumer reads these files yet.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYamlSubset } from "./yaml-subset.ts";
import { factsRows, type FactsRow } from "./facts.ts";
import { LEXICONS } from "./lexicons.ts";
import { loadScores, type ScoreRow } from "./score.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** The repo's site keys (SiteTag in src/tags.ts). One profile + one suitability file each. */
export const SITES = ["moh", "bestman", "handicap", "offsite", "friendsmoon", "engagedmoon"] as const;
export type Site = (typeof SITES)[number];

export const profilePath = (site: string, root = ROOT) => resolve(root, "profiles", `${site}.yaml`);
export const suitabilityPath = (site: string, root = ROOT) => resolve(root, "suitability", `${site}.json`);

// ── rule shapes ──────────────────────────────────────────────────────────────

export type Match =
  | { any: Match[] }
  | { all: Match[] }
  | { facet: string; in: string[] }
  | { facet: string; not_in: string[] }
  | { lexicon: string; field: "name" | "name+highlight"; terms: string[]; strip_quoted?: boolean };

export interface Rule {
  id: string;
  text: string;
  match: Match;
  applies_to: string[];
  cite: string;
  quote: string;
  dead_terms?: string[];
  [k: string]: unknown;
}

export interface Profile {
  site: string;
  hard_excludes: Rule[];
  [k: string]: unknown;
}

/** `git hash-object` of a file's bytes — computed here so CI needs no git. */
export function gitBlobSha(text: string): string {
  const buf = Buffer.from(text, "utf8");
  return createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
}

export function loadProfile(site: string, root = ROOT): { text: string; profile: Profile; tagger: string } {
  const text = readFileSync(profilePath(site, root), "utf8");
  const profile = parseYamlSubset(text) as unknown as Profile;
  return { text, profile, tagger: `rules@${gitBlobSha(text).slice(0, 12)}` };
}

// ── evaluation ───────────────────────────────────────────────────────────────

/**
 * Proposalmoon's `stripQuotedSpans` (engagedmoon/src/lib/brand.ts:387-389@c2518db):
 * quoted words are an authority's, not the row's voice. Both of its regexes use
 * plain ASCII double quotes, so this is the same operation.
 */
export function stripQuotedSpans(text: string): string {
  return text.replace(/"[^"]*"/g, " ").replace(/"[^"]*"/g, " ");
}

const reCache = new Map<string, RegExp>();
function lexRe(lexicon: string, term: string): RegExp {
  const k = lexicon + "\u0000" + term;
  let re = reCache.get(k);
  if (!re) {
    re = new RegExp(term, LEXICONS[lexicon]?.flags ?? "i");
    reCache.set(k, re);
  }
  return re;
}

export function matches(m: Match, row: FactsRow): boolean {
  if ("any" in m) return m.any.some((x) => matches(x, row));
  if ("all" in m) return m.all.every((x) => matches(x, row));
  if ("lexicon" in m) {
    let text = m.field === "name" ? row.text.name : `${row.text.name} ${row.text.highlight}`;
    if (m.strip_quoted) text = stripQuotedSpans(text);
    return m.terms.some((t) => lexRe(m.lexicon, t).test(text));
  }
  const vals = row.facets[m.facet];
  if ("in" in m) return !!vals?.some((v) => m.in.includes(v));
  // not_in: only a row that HAS the facet can fail an allowlist
  return !!vals?.length && vals.every((v) => !m.not_in.includes(v));
}

// ── build + render ───────────────────────────────────────────────────────────

export interface SuitabilityRow {
  id: string;
  /** "scored" = a rubric score from scores/<site>.json (M5); no threshold is applied here. */
  eligible: "no" | "unreviewed" | "scored";
  /** 0–1, scored rows only */
  fit?: number;
  /** the first matching rule id (see the file's `rules` map) */
  reason?: string;
  /** every matching rule id, present only when more than one matched */
  rules?: string[];
  provenance?: { tagger: string; model?: string; promptOrRulesVersion: string };
}

export function buildSuitability(site: string, root = ROOT) {
  const { profile, tagger } = loadProfile(site, root);
  const vocabVersion = String(profile.vocab ?? "");
  const rows: SuitabilityRow[] = [];
  const byRule: Record<string, number> = Object.fromEntries(profile.hard_excludes.map((r) => [r.id, 0]));
  // M5: a score is merged only onto a row the rules left unreviewed — never onto a "no".
  const scores = new Map<string, ScoreRow>((loadScores(site, root)?.rows ?? []).map((s) => [s.id, s]));
  for (const row of factsRows()) {
    const hit = profile.hard_excludes.filter((r) => matches(r.match, row));
    if (!hit.length) {
      const sc = scores.get(row.id);
      rows.push(sc ? { id: row.id, eligible: "scored", fit: sc.fit, reason: sc.reason, provenance: sc.provenance } : { id: row.id, eligible: "unreviewed" });
      continue;
    }
    for (const r of hit) byRule[r.id]++;
    rows.push({
      id: row.id,
      eligible: "no",
      reason: hit[0].id,
      ...(hit.length > 1 ? { rules: hit.map((r) => r.id) } : {}),
      provenance: { tagger, promptOrRulesVersion: `vocab@${vocabVersion}` },
    });
  }
  const no = rows.filter((r) => r.eligible === "no").length;
  const scored = rows.filter((r) => r.eligible === "scored").length;
  return {
    site,
    format: 1,
    note: "CORPUS-M4 rules + CORPUS-M5 scores. Generated by scripts/corpus/suitability.ts from profiles/<site>.yaml — never hand-edit. eligible is \"no\" (a hard-exclude rule matched), \"scored\" (a CORPUS-M5 rubric score merged from scores/<site>.json: fit 0-1 + reason + provenance, no threshold applied) or \"unreviewed\"; nothing writes \"yes\", and a score never overrides a rule. No consumer reads this file yet.",
    profile: `profiles/${site}.yaml`,
    tagger,
    vocab: vocabVersion,
    /** A row's `reason` is one of these rule ids; the full rule (match, quote) is in the profile. */
    rules: Object.fromEntries(profile.hard_excludes.map((r) => [r.id, { text: r.text, cite: r.cite }])),
    counts: { rows: rows.length, no, ...(scored ? { scored } : {}), unreviewed: rows.length - no - scored, byRule },
    rows,
  };
}

/** One row per line, so a regeneration diff reads row by row. */
export function renderSuitability(s: ReturnType<typeof buildSuitability>): string {
  const { rows, ...head } = s;
  const headJson = JSON.stringify(head, null, 2);
  return headJson.slice(0, -2) + ',\n  "rows": [\n' + rows.map((r) => "    " + JSON.stringify(r)).join(",\n") + "\n  ]\n}\n";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const site of SITES) {
    const s = buildSuitability(site);
    const out = renderSuitability(s);
    const p = suitabilityPath(site);
    if (check) {
      const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
      if (cur !== out) {
        stale++;
        console.error(`✗ suitability/${site}.json is stale — run: npx tsx scripts/corpus/suitability.ts`);
      }
    } else {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, out);
      console.log(`suitability/${site}.json  rows ${s.counts.rows}  no ${s.counts.no}  unreviewed ${s.counts.unreviewed}  ${JSON.stringify(s.counts.byRule)}`);
    }
  }
  if (check) {
    if (stale) process.exit(1);
    console.log("✓ suitability files are current");
  }
}
