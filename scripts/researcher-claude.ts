/**
 * researcher-claude.ts — the REAL researcher backend that lets the expansion
 * engine run UNATTENDED (ARM-B).
 *
 * `run-expansion.ts` chains gap-queue → research → ingest → propose-PR through a
 * pluggable `Researcher = (prompt: string) => Promise<unknown[]>`. Every other
 * stage (validation, URL-liveness, transactional ingest, brand gates,
 * propose-PR) is already built. THIS module is the one missing piece: a
 * `Researcher` that actually shells out to the headless Claude Code CLI
 * (`claude -p`), instructs it to do real web research, and returns a parsed
 * array of candidate rows.
 *
 * ── Headless gotchas handled ────────────────────────────────────────────────
 *   • Prompt is passed on STDIN, never as a fragile shell arg (no quoting/escape
 *     hazards, no ARG_MAX ceiling, no accidental flag injection).
 *   • Web access + structured output are requested EXPLICITLY: `--allowedTools
 *     WebSearch WebFetch` (pre-approves the web tools so an unattended run never
 *     blocks on a permission prompt) + `--output-format json` (a clean, parseable
 *     envelope instead of streamed prose).
 *   • A generous timeout (default 180s) kills a hung CLI.
 *   • Non-zero exit / timeout / empty / prose-wrapped output are all tolerated:
 *     `parseCandidates` extracts the first top-level JSON array from clean JSON,
 *     a ```json fence, the `--output-format json` envelope, OR surrounding prose.
 *   • ON ANY FAILURE we return `[]` (never throw). The engine then simply
 *     ingests nothing that run — fail-safe, never crashes the daemon.
 *
 * No secrets are hardcoded — the ambient `claude` CLI auth/config is used.
 *
 * Test:  npx tsx --test scripts/researcher-claude.test.ts
 */

import { spawn } from "node:child_process";

import type { Researcher } from "./research-gap";

// ─── pure JSON extraction (unit-tested, no process/network) ─────────────────

function tryParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

/** Pull the body out of a ```json … ``` (or bare ```) fenced block, if present. */
function extractFenced(text: string): string | null {
  const m = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  return m ? m[1] : null;
}

/**
 * Scan out the FIRST balanced top-level `[ … ]` array from arbitrary text,
 * respecting string literals + escapes so a `]` inside a quoted value never
 * closes the array early. Returns the parsed array, or null if none parses.
 */
function extractFirstArray(text: string): unknown[] | null {
  const start = text.indexOf("[");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        const parsed = tryParse(text.slice(start, i + 1));
        return Array.isArray(parsed) ? parsed : null;
      }
    }
  }
  return null;
}

/**
 * Coerce a parsed value into a candidate array. A bare array is returned as-is.
 * An OBJECT is treated as a possible CLI envelope (`claude -p --output-format
 * json` returns `{ type:"result", result:"<text>", … }`): each known text
 * field is unwrapped and re-parsed for an embedded array.
 */
function coerceArray(v: unknown): unknown[] | null {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    for (const key of ["result", "text", "content", "output", "data", "message"]) {
      const inner = (v as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return inner;
      if (typeof inner === "string") {
        const got = parseCandidates(inner);
        if (got.length > 0) return got;
      }
    }
  }
  return null;
}

/**
 * Extract a JSON array of candidate rows from headless-CLI stdout. Tolerates:
 *   1. clean JSON (`[ {…}, {…} ]`)
 *   2. a ```json-fenced block (with or without surrounding prose)
 *   3. the `claude -p --output-format json` envelope object (digs into
 *      `.result`/`.text`/… — including a JSON array embedded as a STRING there)
 *   4. prose-wrapped output ("Here are the venues: […]. Hope that helps!")
 * Returns `[]` on anything it can't parse — NEVER throws.
 */
export function parseCandidates(stdout: unknown): unknown[] {
  if (typeof stdout !== "string") return [];
  const text = stdout.trim();
  if (!text) return [];

  // 1. Whole-string parse — handles a clean array AND the JSON envelope object.
  const whole = tryParse(text);
  if (whole !== undefined) {
    const arr = coerceArray(whole);
    if (arr) return arr;
  }

  // 2. A ```json … ``` fence (its body may itself be clean OR prose-wrapped).
  const fenced = extractFenced(text);
  if (fenced) {
    const parsed = tryParse(fenced.trim());
    if (parsed !== undefined) {
      const arr = coerceArray(parsed);
      if (arr) return arr;
    }
    const inner = extractFirstArray(fenced);
    if (inner) return inner;
  }

  // 3. First balanced top-level [...] anywhere in the prose.
  const arr = extractFirstArray(text);
  if (arr) return arr;

  return [];
}

// ─── the claude -p researcher backend ───────────────────────────────────────

/** What the injected command-runner must resolve to (never rejects — encodes
 *  failure in `code`/`timedOut` so `claudeResearcher` stays fail-safe). */
export interface ClaudeRunResult {
  /** Process exit code. Non-zero (or negative for spawn error) ⇒ `[]`. */
  code: number;
  /** Captured stdout (fed to `parseCandidates`). */
  stdout: string;
  /** Captured stderr (logged on failure; not parsed). */
  stderr?: string;
  /** True when the timeout fired and the CLI was killed ⇒ `[]`. */
  timedOut?: boolean;
}

/** The seam unit tests inject so NO real `claude` process is spawned. */
export type ClaudeRunner = (prompt: string) => Promise<ClaudeRunResult>;

export interface ClaudeResearcherOptions {
  /** Injected runner (tests). Defaults to the real `claude -p` spawn runner. */
  runner?: ClaudeRunner;
  /** Whole-invocation ceiling in ms. Default 180_000 (3 min). */
  timeoutMs?: number;
  /** `claude` binary path/name. Default `"claude"` (resolved via PATH). */
  claudeBin?: string;
  /** Optional `--model` alias/id for the research call. */
  model?: string;
  /** Captured/diagnostic logger. Default no-op. */
  log?: (msg: string) => void;
}

/**
 * Wrap the gap-research prompt with an explicit, machine-parseable output
 * contract. `buildResearchPrompt` (research-gap.ts) already spells out the
 * REAL-venue / no-fabrication / cite-primary-sources constraints and the row
 * shape; this only nails down "return ONLY a JSON array, nothing else" so the
 * headless CLI doesn't wrap it in conversational prose we then have to peel.
 */
export function wrapPrompt(prompt: string): string {
  return [
    prompt,
    "",
    "── OUTPUT CONTRACT ─────────────────────────────────────────",
    "Use your web tools to VERIFY every venue is real and currently operating,",
    "and that each sourceUrl actually resolves. Then respond with ONLY a JSON",
    "array of the candidate row objects described above — no prose, no",
    "explanation, no markdown fences around it. If you cannot verify ANY real",
    "venue, respond with exactly: []",
  ].join("\n");
}

/** The real runner: spawn `claude -p`, feed the prompt on stdin, capture stdout,
 *  enforce a hard timeout. Never rejects — resolves a `ClaudeRunResult`. */
function defaultClaudeRunner(opts: ClaudeResearcherOptions): ClaudeRunner {
  const bin = opts.claudeBin ?? "claude";
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const model = opts.model;

  return (prompt: string) =>
    new Promise<ClaudeRunResult>((resolve) => {
      // --allowedTools LAST-but-one is a variadic; a following `--model` (a
      // `--`-prefixed token) correctly terminates it. Order matters.
      const args = ["-p", "--output-format", "json", "--allowedTools", "WebSearch", "WebFetch"];
      if (model) args.push("--model", model);

      let child;
      try {
        child = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"] });
      } catch (e) {
        resolve({ code: -1, stdout: "", stderr: String(e) });
        return;
      }

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      const done = (code: number) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ code, stdout, stderr, timedOut });
      };

      child.stdout?.on("data", (d) => (stdout += d.toString()));
      child.stderr?.on("data", (d) => (stderr += d.toString()));
      child.on("error", (e) => done(typeof (e as { code?: number }).code === "number" ? -1 : -1));
      child.on("close", (code) => done(code ?? -1));

      // Feed the prompt on stdin (safe — no shell arg quoting/escaping).
      child.stdin?.on("error", () => {}); // swallow EPIPE if the CLI exits early
      child.stdin?.write(prompt);
      child.stdin?.end();
    });
}

/**
 * Build a `Researcher` backed by the headless `claude -p` CLI. Fail-safe by
 * construction: a non-zero exit, a timeout, unparseable/empty output, or ANY
 * thrown error all resolve to `[]` — the expansion engine then ingests nothing
 * that run instead of crashing the daemon.
 */
export function claudeResearcher(opts: ClaudeResearcherOptions = {}): Researcher {
  const log = opts.log ?? (() => {});
  const runner = opts.runner ?? defaultClaudeRunner(opts);

  return async (prompt: string): Promise<unknown[]> => {
    try {
      const res = await runner(wrapPrompt(prompt));
      if (res.timedOut) {
        log("claudeResearcher: timed out — returning []");
        return [];
      }
      if (res.code !== 0) {
        log(
          `claudeResearcher: claude exited ${res.code} — returning [] ` +
            `(stderr: ${(res.stderr ?? "").slice(0, 200).replace(/\s+/g, " ").trim()})`,
        );
        return [];
      }
      const rows = parseCandidates(res.stdout);
      log(`claudeResearcher: parsed ${rows.length} candidate row(s) from claude -p output`);
      return rows;
    } catch (e) {
      log(`claudeResearcher: threw (${String(e)}) — returning [] (fail-safe)`);
      return [];
    }
  };
}
