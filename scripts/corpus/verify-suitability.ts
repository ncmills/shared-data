/**
 * verify-suitability.ts — the CORPUS-M4 gate over vocab/v1.json, profiles/*.yaml
 * and suitability/*.json. Wired into `npm run verify`. Exit 1 on any problem.
 *
 *   V1 vocab: semver 1.0.0, unique non-empty terms, image stub still empty,
 *      and the file equals what scripts/corpus/vocab-build.ts produces now.
 *   V2 profiles: one per site key, parse under the strict subset, and every
 *      hard-exclude rule has a site-prefixed unique id, text, a line-level
 *      `<repo>/<file>:<lines>@<sha>` cite with a quote, and a match whose every
 *      facet and every term exists in vocab v1 (`dead_terms` must NOT).
 *   V3 facts: every facet value on every facts row is a vocab term.
 *   V4 suitability: every row id exists in facts, every facts id appears once,
 *      eligible ∈ {no, unreviewed}, no `fit`, every "no" cites a real rule id of
 *      that site's profile, tagger = rules@<blob sha of the profile>, and the
 *      file equals what scripts/corpus/suitability.ts produces now.
 *   V5 scores (M5, sites with a rubric): every rubric criterion/cap cites a line of
 *      its profile and the quote is on that line; every scores/<site>.json row is a
 *      facts id the rules left unreviewed (a score never lands on a "no"), fit in
 *      [0,1], a reason with none of the site's banned words, provenance stamped
 *      with the current rubric version; and every MOH golf-coded row has fit 0.
 *      v1.1 (R1 FIX round 1): every cap/rule/criterion/note/conditional/flag cites
 *      its profile line; thresholds, combine, weights and rationales are present;
 *      each score is re-derived from the facts row (cap, utility class, rule values,
 *      flags, and fit from the per-criterion scores); a reason cites a real rubric
 *      id, no shorthand, and never grades the row's copy; provenance has scoredAt,
 *      runId and (llm) a model id.
 *      A "scored" row in suitability must carry exactly that score.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { factsRows } from "./facts.ts";
import { renderVocab, VOCAB_VERSION } from "./vocab-build.ts";
import { parseYamlSubset } from "./yaml-subset.ts";
import {
  SITES,
  loadProfile,
  gitBlobSha,
  buildSuitability,
  renderSuitability,
  suitabilityPath,
  profilePath,
  type Match,
  type Rule,
} from "./suitability.ts";
import { SCORED_SITES, loadRubric, rubricPath, checkScore, isMohGolfText, type ScoreRow } from "./score.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CITE_RE = /^[\w.-]+\/[^\s:@]+:\d+(-\d+)?(,\d+(-\d+)?)*@[0-9a-f]{7,40}$/;

type Vocab = { version: string; facets: Record<string, { terms: string[] }>; image: { status: string; subject: unknown[]; scene: unknown[]; mood: unknown[] } };

export interface VerifyOptions {
  root?: string;
  /** injected for sabotage tests; default = read from disk */
  vocab?: Vocab;
  profileText?: Partial<Record<string, string>>;
  suitabilityText?: Partial<Record<string, string>>;
  /** skip the "file equals regenerated" checks (tests that plant rows use this to reach the row checks) */
  skipDrift?: boolean;
  /** injected scores/<site>.json (sabotage tests) */
  scores?: Partial<Record<string, { rubricVersion: string; rows: ScoreRow[] }>>;
}

function termsOf(m: Match, out: { facet: string; term: string }[] = []) {
  if ("any" in m) m.any.forEach((x) => termsOf(x, out));
  else if ("all" in m) m.all.forEach((x) => termsOf(x, out));
  else if ("lexicon" in m) m.terms.forEach((t) => out.push({ facet: m.lexicon, term: t }));
  else if ("in" in m) m.in.forEach((t) => out.push({ facet: m.facet, term: t }));
  else if ("not_in" in m) m.not_in.forEach((t) => out.push({ facet: m.facet, term: t }));
  else out.push({ facet: "<malformed match>", term: JSON.stringify(m) });
  return out;
}

export function verifySuitability(opts: VerifyOptions = {}): string[] {
  const root = opts.root ?? ROOT;
  const problems: string[] = [];
  const p = (s: string) => problems.push(s);

  // V1 vocab
  const vocabText = readFileSync(resolve(root, "vocab/v1.json"), "utf8");
  const vocab: Vocab = opts.vocab ?? JSON.parse(vocabText);
  if (vocab.version !== VOCAB_VERSION || !/^\d+\.\d+\.\d+$/.test(vocab.version)) p(`vocab: version ${vocab.version} (expected ${VOCAB_VERSION})`);
  for (const [f, { terms }] of Object.entries(vocab.facets)) {
    if (!terms.length) p(`vocab: facet ${f} has no terms`);
    if (new Set(terms).size !== terms.length) p(`vocab: facet ${f} has duplicate terms`);
    if (terms.some((t) => typeof t !== "string" || !t)) p(`vocab: facet ${f} has an empty term`);
  }
  if (vocab.image?.status !== "empty-until-M6" || vocab.image.subject.length + vocab.image.scene.length + vocab.image.mood.length)
    p("vocab: the image section must stay an empty stub until M6");
  if (!opts.skipDrift && !opts.vocab && vocabText !== renderVocab()) p("vocab: vocab/v1.json is stale — run npx tsx scripts/corpus/vocab-build.ts");
  const has = (facet: string, term: string) => !!vocab.facets[facet]?.terms.includes(term);

  // V3 facts
  const facts = factsRows();
  const factIds = new Set(facts.map((r) => r.id));
  const factById = new Map(facts.map((r) => [r.id, r]));
  const badFacet = new Map<string, number>();
  for (const r of facts)
    for (const [f, vals] of Object.entries(r.facets))
      for (const v of vals) if (!has(f, v)) badFacet.set(`${f}=${v}`, (badFacet.get(`${f}=${v}`) ?? 0) + 1);
  for (const [k, n] of badFacet) p(`facts: ${n} row(s) carry ${k}, which is not a vocab v1 term`);

  // V2 + V4 per site
  for (const site of SITES) {
    let prof;
    try {
      const text = opts.profileText?.[site];
      if (text !== undefined) {
        // same parse + tagger as loadProfile, over injected bytes (sabotage tests)
        prof = { text, profile: parseYamlSubset(text) as any, tagger: `rules@${gitBlobSha(text).slice(0, 12)}` };
      } else {
        if (!existsSync(profilePath(site, root))) {
          p(`profiles/${site}.yaml: missing`);
          continue;
        }
        prof = loadProfile(site, root);
      }
    } catch (e) {
      p(`profiles/${site}.yaml: ${(e as Error).message}`);
      continue;
    }
    const { profile, tagger } = prof;
    if (profile.site !== site) p(`profiles/${site}.yaml: site is "${profile.site}"`);
    if (profile.vocab !== vocab.version) p(`profiles/${site}.yaml: written against vocab ${profile.vocab}, vocab is ${vocab.version}`);
    const rules: Rule[] = Array.isArray(profile.hard_excludes) ? profile.hard_excludes : [];
    if (!Array.isArray(profile.hard_excludes)) p(`profiles/${site}.yaml: hard_excludes must be a list (write [] for none)`);
    const ids = new Set<string>();
    for (const r of rules) {
      const at = `profiles/${site}.yaml rule ${r.id}`;
      if (!r.id || !r.id.startsWith(`${site}-`)) p(`${at}: id must start with "${site}-"`);
      if (ids.has(r.id)) p(`${at}: duplicate rule id`);
      ids.add(r.id);
      if (!r.text) p(`${at}: no text`);
      if (!r.quote) p(`${at}: no quote`);
      for (const k of Object.keys(r).filter((k) => /^cite(_\d+)?$/.test(k)))
        if (!CITE_RE.test(String(r[k]))) p(`${at}: ${k} "${r[k]}" is not <repo>/<file>:<lines>@<sha>`);
      if (!r.match) {
        p(`${at}: no match`);
        continue;
      }
      for (const { facet, term } of termsOf(r.match)) {
        if (!vocab.facets[facet]) p(`${at}: matches on facet "${facet}", which is not in vocab v1`);
        else if (!has(facet, term)) p(`${at}: term "${term}" is not in vocab v1 facet ${facet}`);
      }
      for (const t of r.dead_terms ?? []) {
        const facet = termsOf(r.match)[0]?.facet;
        if (facet && has(facet, t)) p(`${at}: dead term "${t}" IS in vocab — move it into the match`);
      }
    }

    // V4
    const sp = suitabilityPath(site, root);
    const sText = opts.suitabilityText?.[site] ?? (existsSync(sp) ? readFileSync(sp, "utf8") : undefined);
    if (sText === undefined) {
      p(`suitability/${site}.json: missing`);
      continue;
    }
    let s: any;
    try {
      s = JSON.parse(sText);
    } catch (e) {
      p(`suitability/${site}.json: not JSON (${(e as Error).message})`);
      continue;
    }
    if (s.site !== site) p(`suitability/${site}.json: site is "${s.site}"`);
    if (s.tagger !== tagger) p(`suitability/${site}.json: tagger ${s.tagger} ≠ ${tagger} (profile changed without regenerating)`);
    const seen = new Set<string>();
    let unknown = 0, dup = 0;
    for (const row of s.rows ?? []) {
      if (!factIds.has(row.id)) {
        if (unknown++ < 5) p(`suitability/${site}.json: unknown id "${row.id}" (not a facts id)`);
      }
      if (seen.has(row.id)) {
        if (dup++ < 5) p(`suitability/${site}.json: duplicate row for "${row.id}"`);
      }
      seen.add(row.id);
      const scoredOk = (SCORED_SITES as readonly string[]).includes(site);
      if (row.eligible !== "no" && row.eligible !== "unreviewed" && !(row.eligible === "scored" && scoredOk))
        p(`suitability/${site}.json: ${row.id} eligible="${row.eligible}" (only no/unreviewed${scoredOk ? "/scored" : ""})`);
      if ("fit" in row && row.eligible !== "scored") p(`suitability/${site}.json: ${row.id} has a fit but is not a scored row`);
      if (row.eligible === "scored") {
        const fitOk = row.class === "utility" ? !("fit" in row) : typeof row.fit === "number" && row.fit >= 0 && row.fit <= 1;
        if (!fitOk || !row.reason || !row.provenance?.promptOrRulesVersion)
          p(`suitability/${site}.json: ${row.id} is scored but lacks class/fit/reason/provenance`);
        continue;
      }
      if (row.eligible === "no") {
        if (!ids.has(row.reason)) p(`suitability/${site}.json: ${row.id} reason "${row.reason}" is not a rule id in profiles/${site}.yaml`);
        for (const rid of row.rules ?? []) if (!ids.has(rid)) p(`suitability/${site}.json: ${row.id} cites unknown rule "${rid}"`);
        if (row.provenance?.tagger !== tagger) p(`suitability/${site}.json: ${row.id} provenance.tagger ${row.provenance?.tagger} ≠ ${tagger}`);
      } else if (row.reason || row.provenance) p(`suitability/${site}.json: ${row.id} is unreviewed but carries a reason/provenance`);
    }
    if (unknown > 5) p(`suitability/${site}.json: … ${unknown} unknown ids in total`);

    // V5
    if ((SCORED_SITES as readonly string[]).includes(site)) {
      let rub;
      try {
        rub = loadRubric(site, root);
      } catch (e) {
        p(`rubrics/${site}.yaml: ${existsSync(rubricPath(site, root)) ? (e as Error).message : "missing"}`);
        rub = null;
      }
      if (rub) {
        const profLines = prof.text.split("\n");
        const R = rub.rubric;
        const items = [
          ...(R.caps ?? []), ...(R.rules ?? []), ...(R.criteria ?? []), ...(R.notes ?? []), ...(R.conditional ?? []),
          ...(R.occasion ? [R.occasion] : []), ...(R.utility?.cite ? [R.utility] : []),
          { id: "reason_rules", cite: R.reason_rules?.banned_cite, quote: R.reason_rules?.banned_quote },
        ];
        // v1.1 shape (R1 F3/F6): thresholds, the combine rule, a rationale per band and per weight, weights per part
        if (!(R.thresholds?.low === 0.3 && R.thresholds?.good === 0.6)) p(`rubrics/${site}.yaml: thresholds must be low 0.3 / good 0.6 (DRV ruling)`);
        if (!R.combine?.formula || !R.combine?.rationale) p(`rubrics/${site}.yaml: combine needs a formula and a rationale`);
        for (const b of R.scale ?? []) if (!b.rationale) p(`rubrics/${site}.yaml: scale band ${b.band} has no rationale`);
        for (const c of [...(R.criteria ?? []), ...(R.rules ?? [])]) {
          if (!(typeof c.weight === "number" && c.weight > 0)) p(`rubrics/${site}.yaml ${c.id}: no positive weight`);
          if (!c.rationale) p(`rubrics/${site}.yaml ${c.id}: weight has no rationale`);
          if (c.part !== "kind" && c.part !== "practical") p(`rubrics/${site}.yaml ${c.id}: part must be kind or practical`);
        }
        if (!(R.criteria ?? []).some((c) => c.part === "kind")) p(`rubrics/${site}.yaml: no part-kind criterion`);
        for (const k of R.conditional ?? []) if (!k.applies_when) p(`rubrics/${site}.yaml ${k.id}: a conditional rule needs applies_when`);
        const cids = new Set<string>();
        for (const c of items as any[]) {
          if (c.id !== "reason_rules") {
            if (!c.id?.startsWith(`${site}-`)) p(`rubrics/${site}.yaml ${c.id}: id must start with "${site}-"`);
            if (cids.has(c.id)) p(`rubrics/${site}.yaml ${c.id}: duplicate id`);
            cids.add(c.id);
          }
          for (const k of Object.keys(c).filter((k) => /^cite(_\d+)?$/.test(k))) {
            const m = new RegExp(`^profiles/${site}\\.yaml:(\\d+)$`).exec(String(c[k]));
            const q = c[k.replace("cite", "quote")];
            if (!m) p(`rubrics/${site}.yaml ${c.id}: ${k} "${c[k]}" is not profiles/${site}.yaml:<line>`);
            else if (!q || !profLines[+m[1] - 1]?.includes(q)) p(`rubrics/${site}.yaml ${c.id}: quote not found on profiles/${site}.yaml:${m[1]}`);
          }
        }
        const sc = opts.scores?.[site] ?? (existsSync(resolve(root, "scores", `${site}.json`)) ? JSON.parse(readFileSync(resolve(root, "scores", `${site}.json`), "utf8")) : null);
        if (sc) {
          const noIds = new Set((s.rows ?? []).filter((r: any) => r.eligible === "no").map((r: any) => r.id));
          const bySuit = new Map((s.rows ?? []).map((r: any) => [r.id, r]));
          const sseen = new Set<string>();
          for (const row of sc.rows as ScoreRow[]) {
            const f = factById.get(row.id);
            if (!f) { p(`scores/${site}.json: unknown id "${row.id}" (not a facts id)`); continue; }
            if (sseen.has(row.id)) p(`scores/${site}.json: duplicate score for "${row.id}"`);
            sseen.add(row.id);
            if (noIds.has(row.id)) p(`scores/${site}.json: ${row.id} is scored but a hard exclude marks it "no" (a score never overrides a rule)`);
            for (const x of checkScore(site, row, rub, noIds.has(row.id) ? undefined : f, site === "moh" && isMohGolfText(f))) p(`scores/${site}.json: ${x}`);
            const sr: any = bySuit.get(row.id);
            if (sr && !noIds.has(row.id) && !opts.scores?.[site] && (sr.eligible !== "scored" || sr.class !== row.class || sr.fit !== row.fit || sr.reason !== row.reason || JSON.stringify(sr.flags ?? []) !== JSON.stringify(row.flags ?? [])))
              p(`suitability/${site}.json: ${row.id} does not carry its score (regenerate)`);
          }
        }
      }
    }
    const missing = [...factIds].filter((id) => !seen.has(id));
    if (missing.length) p(`suitability/${site}.json: ${missing.length} facts ids have no row (e.g. ${missing.slice(0, 3).join(", ")})`);
    if (!opts.skipDrift && !opts.profileText?.[site] && !opts.suitabilityText?.[site] && sText !== renderSuitability(buildSuitability(site, root)))
      p(`suitability/${site}.json: stale — run npx tsx scripts/corpus/suitability.ts`);
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = verifySuitability();
  if (problems.length) {
    for (const x of problems) console.error("✗ " + x);
    console.error(`✗ suitability: ${problems.length} problem(s)`);
    process.exit(1);
  }
  const sites = SITES.map((s) => {
    const j = JSON.parse(readFileSync(suitabilityPath(s), "utf8"));
    return `${s} no=${j.counts.no}${j.counts.scored ? ` scored=${j.counts.scored}` : ""}`;
  });
  console.log(`✓ suitability: vocab ${VOCAB_VERSION}, ${SITES.length} profiles, ${factsRows().length} facts rows per site (${sites.join(", ")})`);
}
