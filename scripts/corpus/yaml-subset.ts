/**
 * yaml-subset.ts — a deliberately SMALL, STRICT YAML reader for `profiles/*.yaml`.
 *
 * Why not a YAML library: this package has no runtime dependencies and only
 * three dev ones; adding one for six hand-written files is a new supply-chain
 * edge for no gain. Why not JSON: the profiles are read and edited by people,
 * and every rule carries a quote and a citation — JSON makes that unreadable.
 *
 * The subset (everything else THROWS with a line number, so a profile can never
 * be silently mis-read):
 *   - `# comments` (whole-line, or after whitespace outside quotes)
 *   - block mappings            `key: value` / `key:` + indented block
 *   - block sequences           `- value` / `- key: value` (+ indented continuation)
 *   - single-line flow values   `{a: 1, b: [x, "y"]}` / `[a, b]` (nesting allowed)
 *   - scalars: "double" (JSON escapes), 'single' ('' escape), plain
 *     (true / false / null / ~ / numbers / strings)
 * Not supported: anchors/aliases/tags, multi-line scalars (| >), multi-line
 * flow collections, documents (---), complex keys, tabs for indentation.
 */

export type YamlValue = string | number | boolean | null | YamlValue[] | { [k: string]: YamlValue };

interface Line {
  no: number; // 1-based
  indent: number;
  text: string; // without indent, comments stripped, trimmed right
}

export class YamlSubsetError extends Error {
  constructor(msg: string, line?: number) {
    super(line ? `yaml-subset: line ${line}: ${msg}` : `yaml-subset: ${msg}`);
  }
}

function stripComment(raw: string, no: number): string {
  let q: '"' | "'" | null = null;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (q) {
      if (c === "\\" && q === '"') i++;
      else if (c === q) {
        if (q === "'" && raw[i + 1] === "'") i++;
        else q = null;
      }
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === "#" && (i === 0 || /\s/.test(raw[i - 1]))) {
      return raw.slice(0, i);
    }
  }
  if (q) throw new YamlSubsetError("unterminated quoted string", no);
  return raw;
}

function toLines(src: string): Line[] {
  const out: Line[] = [];
  src.split(/\r?\n/).forEach((raw, i) => {
    const no = i + 1;
    if (/^\t| \t/.test(raw.match(/^[ \t]*/)![0])) throw new YamlSubsetError("tab in indentation", no);
    const body = stripComment(raw, no).replace(/\s+$/, "");
    if (!body.trim()) return;
    const indent = body.length - body.trimStart().length;
    const text = body.trimStart();
    if (text === "---" || text === "...") throw new YamlSubsetError("document markers are not supported", no);
    out.push({ no, indent, text });
  });
  return out;
}

// ── scalars + single-line flow ──────────────────────────────────────────────

class Flow {
  i = 0;
  constructor(private s: string, private no: number) {}
  err(m: string): never {
    throw new YamlSubsetError(`${m} in ${JSON.stringify(this.s)}`, this.no);
  }
  ws() {
    while (this.i < this.s.length && this.s[this.i] === " ") this.i++;
  }
  value(inFlow: boolean): YamlValue {
    this.ws();
    const c = this.s[this.i];
    if (c === "{") return this.map();
    if (c === "[") return this.seq();
    if (c === '"') return this.dq();
    if (c === "'") return this.sq();
    return this.plain(inFlow);
  }
  map(): { [k: string]: YamlValue } {
    const o: { [k: string]: YamlValue } = {};
    this.i++; // {
    this.ws();
    if (this.s[this.i] === "}") {
      this.i++;
      return o;
    }
    for (;;) {
      this.ws();
      const k = this.key();
      if (k in o) this.err(`duplicate key "${k}"`);
      o[k] = this.value(true);
      this.ws();
      const c = this.s[this.i++];
      if (c === "}") return o;
      if (c !== ",") this.err("expected , or }");
    }
  }
  key(): string {
    const c = this.s[this.i];
    let k: string;
    if (c === '"') k = this.dq();
    else if (c === "'") k = this.sq();
    else {
      const m = /^[^:,{}\[\]"']+/.exec(this.s.slice(this.i));
      if (!m) this.err("expected a key");
      k = m[0].trim();
      this.i += m[0].length;
    }
    this.ws();
    if (this.s[this.i] !== ":") this.err(`expected : after key "${k}"`);
    this.i++;
    return k;
  }
  seq(): YamlValue[] {
    const a: YamlValue[] = [];
    this.i++; // [
    this.ws();
    if (this.s[this.i] === "]") {
      this.i++;
      return a;
    }
    for (;;) {
      a.push(this.value(true));
      this.ws();
      const c = this.s[this.i++];
      if (c === "]") return a;
      if (c !== ",") this.err("expected , or ]");
    }
  }
  dq(): string {
    const m = /^"(?:[^"\\]|\\.)*"/.exec(this.s.slice(this.i));
    if (!m) this.err("unterminated double-quoted string");
    this.i += m[0].length;
    try {
      return JSON.parse(m[0]);
    } catch {
      this.err("bad escape in double-quoted string");
    }
  }
  sq(): string {
    let out = "";
    this.i++;
    for (;;) {
      if (this.i >= this.s.length) this.err("unterminated single-quoted string");
      const c = this.s[this.i++];
      if (c === "'") {
        if (this.s[this.i] === "'") {
          out += "'";
          this.i++;
        } else return out;
      } else out += c;
    }
  }
  plain(inFlow: boolean): YamlValue {
    const rest = this.s.slice(this.i);
    const m = inFlow ? /^[^,{}\[\]]*/.exec(rest)! : /^.*/.exec(rest)!;
    this.i += m[0].length;
    const t = m[0].trim();
    if (t === "") this.err("empty value");
    if (/[&*!|>%@`]/.test(t[0])) this.err(`unsupported plain scalar start "${t[0]}"`);
    if (/:\s/.test(t) || t.endsWith(":")) this.err(`plain scalar contains ": " — quote it`);
    return plainScalar(t);
  }
  end() {
    this.ws();
    if (this.i !== this.s.length) this.err("trailing characters");
  }
}

function plainScalar(t: string): YamlValue {
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null" || t === "~") return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

function inline(s: string, no: number): YamlValue {
  const f = new Flow(s, no);
  const v = f.value(false);
  f.end();
  return v;
}

// ── blocks ──────────────────────────────────────────────────────────────────

const KEY_RE = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s#:\-{}\[\],"'][^:#{}\[\]]*?)\s*:(?:\s+(.*)|$)/;

function parseKey(raw: string, no: number): string {
  if (raw.startsWith('"') || raw.startsWith("'")) return inline(raw, no) as string;
  return raw.trim();
}

function block(lines: Line[], start: number, indent: number): [YamlValue, number] {
  const first = lines[start];
  if (first.indent !== indent) throw new YamlSubsetError(`bad indentation (expected ${indent})`, first.no);
  if (first.text === "-" || first.text.startsWith("- ")) return seqBlock(lines, start, indent);
  if (KEY_RE.test(first.text)) return mapBlock(lines, start, indent);
  throw new YamlSubsetError("expected `key:` or `- ` at block start", first.no);
}

function valueAfter(lines: Line[], i: number, rest: string | undefined, parentIndent: number, no: number): [YamlValue, number] {
  if (rest !== undefined && rest !== "") return [inline(rest, no), i + 1];
  const next = lines[i + 1];
  if (!next || next.indent <= parentIndent) throw new YamlSubsetError("key with no value (write null or \"\")", no);
  return block(lines, i + 1, next.indent);
}

function mapBlock(lines: Line[], start: number, indent: number): [YamlValue, number] {
  const o: { [k: string]: YamlValue } = {};
  let i = start;
  while (i < lines.length && lines[i].indent === indent) {
    const l = lines[i];
    if (l.text.startsWith("- ") || l.text === "-") throw new YamlSubsetError("sequence item where a key was expected", l.no);
    const m = KEY_RE.exec(l.text);
    if (!m) throw new YamlSubsetError(`expected "key: value", got ${JSON.stringify(l.text)}`, l.no);
    const k = parseKey(m[1], l.no);
    if (k in o) throw new YamlSubsetError(`duplicate key "${k}"`, l.no);
    const [v, next] = valueAfter(lines, i, m[2], indent, l.no);
    o[k] = v;
    i = next;
  }
  if (i < lines.length && lines[i].indent > indent) throw new YamlSubsetError("unexpected indentation", lines[i].no);
  return [o, i];
}

function seqBlock(lines: Line[], start: number, indent: number): [YamlValue, number] {
  const a: YamlValue[] = [];
  let i = start;
  while (i < lines.length && lines[i].indent === indent && (lines[i].text === "-" || lines[i].text.startsWith("- "))) {
    const l = lines[i];
    const body = l.text === "-" ? "" : l.text.slice(2);
    const bodyIndent = indent + (l.text.length - l.text.slice(1).trimStart().length);
    if (body === "") {
      const next = lines[i + 1];
      if (!next || next.indent <= indent) throw new YamlSubsetError("empty sequence item", l.no);
      const [v, n] = block(lines, i + 1, next.indent);
      a.push(v);
      i = n;
    } else if (KEY_RE.test(body) && !body.startsWith("{") && !body.startsWith("[")) {
      // `- key: v` opens a mapping whose further keys sit at bodyIndent.
      const synthetic: Line[] = [{ no: l.no, indent: bodyIndent, text: body }];
      let j = i + 1;
      while (j < lines.length && lines[j].indent >= bodyIndent) synthetic.push(lines[j++]);
      const [v, used] = mapBlock(synthetic, 0, bodyIndent);
      if (used !== synthetic.length) throw new YamlSubsetError("bad indentation inside sequence item", synthetic[used].no);
      a.push(v);
      i = j;
    } else {
      a.push(inline(body, l.no));
      i++;
      if (i < lines.length && lines[i].indent > indent) throw new YamlSubsetError("unexpected indentation after scalar item", lines[i].no);
    }
  }
  return [a, i];
}

export function parseYamlSubset(src: string): YamlValue {
  const lines = toLines(src);
  if (!lines.length) throw new YamlSubsetError("empty document");
  if (lines[0].indent !== 0) throw new YamlSubsetError("document must start at column 0", lines[0].no);
  const [v, i] = block(lines, 0, 0);
  if (i !== lines.length) throw new YamlSubsetError("content after the top-level block", lines[i].no);
  return v;
}
