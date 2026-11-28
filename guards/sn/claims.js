import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import YAML from 'yaml';
import { walk } from './walk.js';

// Frame A: a capability phrase plus a feature verb in one sentence. Frame B: a pledge. (Ported from promise_find.prototype.py.)
const CAP = /\b(you can|you may|you'll be able to|you are able to|lets you|let you|allows you to|at any time|any ?time|instantly|in one click|one[- ]click|from (your|the) (settings|account|dashboard|profile)|from \/[a-z-]+)\b/i;
const VERB = /\b(delet\w*|eras\w*|remov\w*|export\w*|download\w*|cancel\w*|refund\w*|unsubscrib\w*|opt[- ]out|edit\w*|restor\w*|pause\w*|undo|revok\w*|withdraw\w*|request (a )?(copy|deletion))\b/i;
const NEG = /\b(we (never|will never|don't|do not|won't|will not) (sell|share|store|keep|save|use|train|track|log|retain|mine|charge|spam|email)|never (sold|shared|stored|saved|used|charged)|not (stored|saved|retained|shared|sold)|money[- ]back|guarantee[ds]?|full refund|no (hidden )?(fees|charges))\b/i;

const DEFAULT_ROOTS = ['src', 'app', 'components', 'content', 'pages', 'lib', 'public'];
const SKIP = /(\.test\.|\.spec\.|__tests__|\/api\/|\.d\.ts$|^scripts\/|\/scripts\/)/;
const CODE_EXT = /\.(tsx|jsx|ts|js|mjs)$/;
const LEGAL = /(privacy|terms|do-not-sell|donotsell)/i;
const INLINE = new Set(['a', 'abbr', 'b', 'br', 'code', 'em', 'i', 'kbd', 'mark', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'Link', 'Trans']);
const COPY_ATTRS = new Set(['alt', 'title', 'aria-label', 'placeholder', 'content', 'label', 'description']);
const DAY = 86400000;

const ENT = { '&apos;': "'", '&#39;': "'", '&rsquo;': "'", '&lsquo;': "'", '&quot;': '"', '&ldquo;': '"', '&rdquo;': '"', '&amp;': '&', '&nbsp;': ' ', '&mdash;': '-', '&ndash;': '-' };
export const clean = (s) => s.replace(/&[a-z#0-9]+;/gi, (m) => ENT[m] ?? m).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
export const hashSentence = (s) => createHash('sha256').update(clean(s).toLowerCase()).digest('hex').slice(0, 12);
export function frame(s) { return ((CAP.test(s) && VERB.test(s)) ? 'A' : '') + (NEG.test(s) ? 'B' : ''); }

function segmentsFromCode(src) {
  const ast = parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: false });
  const segs = [];
  const emit = (buf) => { const t = buf.parts.join(''); if (t.trim()) segs.push({ text: t, line: buf.line }); buf.parts = []; buf.line = null; };
  const add = (buf, text, line) => { if (buf.line == null && text.trim()) buf.line = line; buf.parts.push(text); };
  const elName = (el) => { const n = el.openingElement && el.openingElement.name; return n && n.type === 'JSXIdentifier' ? n.name : null; };
  function element(el, buf) {
    for (const a of (el.openingElement ? el.openingElement.attributes : [])) {
      if (a.type !== 'JSXAttribute' || !a.value) continue;
      const nm = a.name && a.name.name;
      if (a.value.type === 'StringLiteral') { if (COPY_ATTRS.has(nm)) segs.push({ text: a.value.value, line: a.loc.start.line }); }
      else if (a.value.type === 'JSXExpressionContainer' && !['className', 'href', 'src', 'id', 'key', 'style', 'type', 'name', 'rel', 'target'].includes(nm)) generic(a.value.expression, null);
    }
    for (const c of el.children || []) {
      if (c.type === 'JSXText') add(buf, c.value, c.loc.start.line);
      else if (c.type === 'JSXExpressionContainer') {
        const e = c.expression;
        if (e.type === 'StringLiteral') add(buf, e.value, e.loc.start.line);
        else if (e.type === 'TemplateLiteral' && e.expressions.length === 0) add(buf, e.quasis[0].value.cooked, e.loc.start.line);
        else if (e.type !== 'JSXEmptyExpression') generic(e, null);
      } else if (c.type === 'JSXElement' && INLINE.has(elName(c))) { if (elName(c) === 'br') add(buf, ' ', c.loc.start.line); else element(c, buf); }
      else if (c.type === 'JSXElement' || c.type === 'JSXFragment') { emit(buf); const b = { parts: [], line: null }; element(c, b); emit(b); }
      else if (c.type === 'JSXSpreadChild') generic(c.expression, null);
    }
  }
  function generic(n, parent, key) {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'JSXElement' || n.type === 'JSXFragment') { const b = { parts: [], line: null }; element(n, b); emit(b); return; }
    if (n.type === 'ImportDeclaration' || n.type === 'ExportAllDeclaration' || n.type.startsWith('TS')) return;
    if (n.type === 'StringLiteral') {
      if (parent && ((parent.type === 'ObjectProperty' && key === 'key') || parent.type === 'ExportNamedDeclaration' || parent.type === 'ImportExpression')) return;
      if (parent && parent.type === 'CallExpression' && parent.callee && parent.callee.name === 'require') return;
      segs.push({ text: n.value, line: n.loc.start.line }); return;
    }
    if (n.type === 'TemplateLiteral') { segs.push({ text: n.quasis.map((q) => q.value.cooked ?? '').join(' '), line: n.loc.start.line }); }
    for (const k in n) {
      if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments' || k === 'extra') continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach((x) => generic(x, n, k)); else if (v && typeof v === 'object') generic(v, n, k);
    }
  }
  generic(ast.program, null);
  return segs;
}

function segmentsFromMarkdown(src) {
  const lines = src.split('\n');
  const segs = [];
  let i = 0, fence = false, buf = null;
  if (lines[0] && lines[0].trim() === '---') { i = 1; while (i < lines.length && lines[i].trim() !== '---') i++; i++; }
  const flush = () => { if (buf && buf.text.trim()) segs.push(buf); buf = null; };
  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\s*(```|~~~)/.test(raw)) { flush(); fence = !fence; continue; }
    if (fence || /^\s*(import|export) /.test(raw)) continue;
    if (!raw.trim()) { flush(); continue; }
    const startsBlock = /^\s*([-*+]|\d+\.|#{1,6}|>|\|)\s/.test(raw);
    if (startsBlock) flush();
    const t = raw.replace(/^\s*([-*+]|\d+\.|#{1,6}|>)\s+/, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '');
    if (!buf) buf = { text: t, line: i + 1 }; else buf.text += ' ' + t;
  }
  flush();
  return segs;
}

// Ported from SN site-guards (~/work/site-guards/src/claims.js). Settings now come from
// guards.config.json guards["promise-registry"]: { roots?, registry? (default guards/claims.yml) }.
export function copyFiles(root, roots = DEFAULT_ROOTS) {
  return walk(root).filter((f) => {
    if (/(^|\/)llms(-full)?\.txt$/.test(f)) return true;
    if (!roots.some((r) => f.startsWith(r.replace(/\/$/, '') + '/'))) return false;
    if (SKIP.test(f)) return false;
    return CODE_EXT.test(f) || /\.mdx?$/.test(f);
  });
}

export function findPromises(root, roots) {
  const hits = [], faults = [];
  for (const f of copyFiles(root, roots)) {
    const src = readFileSync(join(root, f), 'utf8');
    let segs;
    try { segs = CODE_EXT.test(f) ? segmentsFromCode(src) : segmentsFromMarkdown(src); }
    catch (e) { faults.push(`UNPARSEABLE ${f}: ${e.message.split('\n')[0]} (a file the finder cannot read never passes)`); continue; }
    for (const s of segs) {
      for (const sent of clean(s.text).split(/(?<=[.!?])\s+/)) {
        const fr = frame(sent);
        if (fr) hits.push({ hash: hashSentence(sent), frame: fr, file: f, line: s.line, sentence: sent });
      }
    }
  }
  return { hits, faults };
}

export function loadRegistry(root, registry = 'guards/claims.yml') {
  const p = join(root, registry);
  if (!existsSync(p)) return {};
  const doc = YAML.parse(readFileSync(p, 'utf8')) || {};
  const map = doc.claims && typeof doc.claims === 'object' ? doc.claims : doc;
  const out = {};
  for (const [k, v] of Object.entries(map)) out[String(k)] = v || {};
  return out;
}

export function runClaims({ root, now = new Date(), settings = {} }) {
  const roots = Array.isArray(settings.roots) ? settings.roots : DEFAULT_ROOTS;
  const { hits, faults } = findPromises(root, roots);
  let reg;
  try { reg = loadRegistry(root, settings.registry); } catch (e) { faults.push(`UNPARSEABLE ${settings.registry ?? 'guards/claims.yml'}: ${e.message.split('\n')[0]}`); reg = {}; }
  const byHash = new Map();
  for (const h of hits) { if (!byHash.has(h.hash)) byHash.set(h.hash, []); byHash.get(h.hash).push(h); }
  for (const [hash, hs] of byHash) {
    const where = hs.map((h) => `${h.file}:${h.line}`).join(', ');
    const e = reg[hash];
    if (!e) { faults.push(`UNREGISTERED ${hash} [${hs[0].frame}] ${where}: "${hs[0].sentence}"`); continue; }
    if (e.kind === 'not-a-promise' && hs.some((h) => LEGAL.test(h.file))) faults.push(`NOT_A_PROMISE_ON_LEGAL_PAGE ${hash} ${where}: a privacy/terms/do-not-sell sentence cannot be waived`);
  }
  for (const [hash, e] of Object.entries(reg)) {
    if (!byHash.has(hash)) faults.push(`ORPHAN ${hash}: registry entry whose sentence is no longer in the copy`);
    if (e.kind === 'feature' || e.kind === 'policy') {
      if (!e.test) faults.push(`NO_TEST ${hash}: kind ${e.kind} needs a test`);
      else if (!existsSync(join(root, String(e.test)))) faults.push(`TEST_MISSING ${hash}: ${e.test} does not exist`);
    } else if (e.kind === 'manual') {
      if (!e.runbook) faults.push(`NO_RUNBOOK ${hash}: kind manual needs a runbook`);
      const d = e.reviewed_on ? new Date(e.reviewed_on) : null;
      if (!d || isNaN(d)) faults.push(`MANUAL_STALE ${hash}: no valid reviewed_on`);
      else if ((now - d) / DAY > 90) faults.push(`MANUAL_STALE ${hash}: reviewed_on ${e.reviewed_on} is over 90 days old`);
    } else if (e.kind === 'not-a-promise') {
      if (!e.reason || !String(e.reason).trim()) faults.push(`NO_REASON ${hash}: not-a-promise needs a reason`);
    } else faults.push(`BAD_KIND ${hash}: kind must be feature, policy, manual or not-a-promise`);
  }
  return { hits, faults };
}
