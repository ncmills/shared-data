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
      if (row.eligible !== "no" && row.eligible !== "unreviewed") p(`suitability/${site}.json: ${row.id} eligible="${row.eligible}" (rules write only no/unreviewed)`);
      if ("fit" in row) p(`suitability/${site}.json: ${row.id} has a fit score (M5, not rules)`);
      if (row.eligible === "no") {
        if (!ids.has(row.reason)) p(`suitability/${site}.json: ${row.id} reason "${row.reason}" is not a rule id in profiles/${site}.yaml`);
        for (const rid of row.rules ?? []) if (!ids.has(rid)) p(`suitability/${site}.json: ${row.id} cites unknown rule "${rid}"`);
        if (row.provenance?.tagger !== tagger) p(`suitability/${site}.json: ${row.id} provenance.tagger ${row.provenance?.tagger} ≠ ${tagger}`);
      } else if (row.reason || row.provenance) p(`suitability/${site}.json: ${row.id} is unreviewed but carries a reason/provenance`);
    }
    if (unknown > 5) p(`suitability/${site}.json: … ${unknown} unknown ids in total`);
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
    return `${s} no=${j.counts.no}`;
  });
  console.log(`✓ suitability: vocab ${VOCAB_VERSION}, ${SITES.length} profiles, ${factsRows().length} facts rows per site (${sites.join(", ")})`);
}
