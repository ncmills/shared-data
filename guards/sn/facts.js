import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@babel/parser';
import { walk } from './walk.js';

const DAY = 86400000;
const KEYWORDS = /(data|config|catalog|roster|pricing)/i;
const SRC_EXT = /\.(ts|tsx|js|mjs|cjs|jsx)$/;
const isTest = (f) => /(\.test\.|\.spec\.|__tests__|\.d\.ts$)/.test(f);

// lib/*.ts counts as a catalog when it holds an array literal of 3+ object rows. Unparseable => counted (never a silent pass).
function isCatalog(abs) {
  let ast;
  try { ast = parse(readFileSync(abs, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: false }); }
  catch { return true; }
  let found = false;
  const visit = (n) => {
    if (found || !n || typeof n.type !== 'string') return;
    if (n.type === 'ArrayExpression' && n.elements.filter((e) => e && e.type === 'ObjectExpression').length >= 3) { found = true; return; }
    for (const k in n) { if (k === 'loc' || k === 'start' || k === 'end') continue; const v = n[k];
      if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v === 'object') visit(v); }
  };
  visit(ast.program);
  return found;
}

// The class glob: data/**/*.json, src/data/**, lib/*.json, lib/*.ts catalogs, src/lib/*{data,config,catalog,roster,pricing}*.
export function classFiles(root) {
  return walk(root).filter((f) => {
    if (isTest(f)) return false;
    if (/^data\/.+\.json$/.test(f)) return true;
    if (/^src\/data\/.+/.test(f)) return true;
    if (/^lib\/[^/]+\.json$/.test(f)) return true;
    if (/^lib\/[^/]+\.(ts|tsx)$/.test(f)) return KEYWORDS.test(f.slice(4)) || isCatalog(join(root, f));
    if (/^src\/lib\/[^/]+$/.test(f)) return KEYWORDS.test(f.slice(8)) && (SRC_EXT.test(f) || f.endsWith('.json'));
    return false;
  });
}

// row_path: dotted path; `*` = every element/value; `a[*]` = a then every element. '' or '*' on an array = the array.
export function selectRows(doc, rowPath) {
  const parts = String(rowPath ?? '').replace(/\[\*\]/g, '.*').split('.').filter(Boolean);
  let cur = [doc];
  for (const p of parts) {
    const next = [];
    for (const c of cur) {
      if (c == null || typeof c !== 'object') continue;
      if (p === '*') next.push(...(Array.isArray(c) ? c : Object.values(c)));
      else if (p in c) next.push(c[p]);
    }
    cur = next;
  }
  if (parts.length === 0 && Array.isArray(doc)) cur = doc;
  return cur.flatMap((r) => (Array.isArray(r) ? r : [r])).filter((r) => r && typeof r === 'object');
}

const httpUrl = (u) => typeof u === 'string' && /^https?:\/\/\S+$/i.test(u);
const hasSource = (r) => (Array.isArray(r.sources) && r.sources.some((s) => s && httpUrl(s.url))) || httpUrl(r.source_url);

// Ported from SN site-guards (~/work/site-guards/src/facts.js). The manifest now lives in
// guards.config.json at guards["unsourced-facts"] (ONE config); the date field is researched_on.
export function runFacts({ root, now = new Date(), manifest }) {
  const faults = [];
  if (!manifest || typeof manifest !== 'object') { faults.push('NO_MANIFEST guards.config.json guards["unsourced-facts"]: every data file below is unlisted'); manifest = { datasets: [], exempt: [] }; }
  const datasets = Array.isArray(manifest.datasets) ? manifest.datasets : [];
  const exempt = Array.isArray(manifest.exempt) ? manifest.exempt : [];
  const forbid = (manifest.policy && Array.isArray(manifest.policy.forbid)) ? manifest.policy.forbid : [];

  for (const ex of exempt) if (!ex || !ex.reason || !String(ex.reason).trim()) faults.push(`EXEMPT_NO_REASON ${ex && ex.file}: an exemption needs a reason`);

  for (const ds of datasets) {
    const f = ds.file;
    const abs = join(root, f || '');
    if (!f || !existsSync(abs)) { faults.push(`MISSING_FILE ${f}: listed in the manifest, not on disk`); continue; }
    const maxAge = Number(ds.max_age_days);
    if (!(maxAge > 0)) faults.push(`NO_MAX_AGE ${f}: dataset needs max_age_days`);
    if (!f.endsWith('.json')) { faults.push(`UNMEASURED ${f}: rows inside a non-JSON file are not parsed in this version; move rows to JSON or exempt with a reason`); continue; }
    let doc;
    try { doc = JSON.parse(readFileSync(abs, 'utf8')); }
    catch (e) { faults.push(`UNPARSEABLE ${f}: ${e.message}`); continue; }
    const rows = selectRows(doc, ds.row_path);
    if (rows.length === 0) { faults.push(`NO_ROWS ${f}: row_path "${ds.row_path}" selects no rows`); continue; }
    rows.forEach((r, i) => {
      if (!hasSource(r)) faults.push(`NO_SOURCE ${f} row ${i}: no primary http(s) source (sources[{url}] or source_url)`);
      const age = Number(r.max_age_days) > 0 ? Number(r.max_age_days) : maxAge;
      const d = r.researched_on ? new Date(r.researched_on) : null;
      if (!d || isNaN(d)) faults.push(`NO_DATE ${f} row ${i}: no valid researched_on`);
      else if (age > 0) {
        const days = Math.floor((now - d) / DAY);
        if (days > age) faults.push(`STALE ${f} row ${i}: researched_on ${r.researched_on} is ${days} days old, max ${age}`);
      }
      const text = JSON.stringify(r);
      for (const rule of forbid) {
        let re; try { re = new RegExp(rule.match, 'i'); } catch { faults.push(`BAD_POLICY ${rule.match}`); continue; }
        if (re.test(text)) faults.push(`FORBIDDEN ${f} row ${i}: matches "${rule.match}" (${rule.reason}; ${rule.source})`);
      }
    });
  }

  const listed = new Set([...datasets.map((d) => d.file), ...exempt.map((e) => e && e.file)]);
  for (const f of classFiles(root)) if (!listed.has(f)) faults.push(`UNLISTED ${f}: data file neither in guards.config.json unsourced-facts datasets nor exempt`);
  return { faults };
}
