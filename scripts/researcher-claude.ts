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
/**
 * Does this look like the `claude -p --output-format json` envelope? Used to
 * stop the prose-scraping fallback from ever running against it — see the note
 * in `parseCandidates`.
 */
function isCliEnvelope(v: unknown): boolean {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return "result" in o || o.type === "result";
}

function coerceArray(v: unknown): unknown[] | null {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    for (const key of ["result", "text", "content", "output", "data", "message"]) {
      const inner = (v as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return inner;
      if (typeof inner === "string") {
        // A WELL-FORMED payload under a known envelope key is AUTHORITATIVE —
        // including when it is an empty array. The previous code only accepted
        // a non-empty result and otherwise fell through, which turned the
        // researcher's honest "I found nothing" (`"result": "[]"`) into a scrape
        // of the envelope's own telemetry. Absence of a finding is a finding.
        const direct = tryParse(inner.trim());
        if (direct !== undefined) {
          const arr = coerceArray(direct);
          if (arr) return arr;
        }
        // Not clean JSON (prose, a ```json fence): fall back to the full parser,
        // but only accept a non-empty result so an unparseable payload can still
        // be retried by a later key.
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
    // The CLI envelope parsed but carried no usable payload. STOP HERE — never
    // fall through to step 3. The envelope is full of arrays that are not
    // candidates (`usage.iterations`, `permission_denials`, `modelUsage`), and
    // scraping "the first [...] in the text" happily returns one of them. That
    // is how a run reported "1 candidate rejected — candidate has no name" when
    // the researcher had actually, correctly, returned nothing.
    if (isCliEnvelope(whole)) return [];
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
  /**
   * True when the timeout fired only because the HOST SLEPT, not because the
   * researcher was slow. `setTimeout` runs on libuv's uptime clock, which does
   * not advance while the machine is suspended — so a 180s timer can take hours
   * of wall clock to fire, and the child spends that time in ~45s DarkWake
   * slices with its network torn down. A far larger wall delta than the timeout
   * budget is the tell. Measured 2026-08-04: the lid closed 13 min into the run
   * and the remaining 9 of 15 tasks all "timed out" across 24h25m.
   */
  suspended?: boolean;
}

/** The seam unit tests inject so NO real `claude` process is spawned.
 *
 *  `timeoutMs` overrides the runner's construction-time default for THIS call.
 *  The researcher is built once per run, but the right budget depends on how
 *  many venues the individual call has to research — see `budgetForVenues`. */
export type ClaudeRunner = (prompt: string, timeoutMs?: number) => Promise<ClaudeRunResult>;

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
  /**
   * Called when a timeout is attributable to the HOST SLEEPING rather than to a
   * slow researcher. The caller needs this because the two are indistinguishable
   * downstream — both yield `[]` — yet only one of them means the venue was
   * actually asked about. Recording an attempt for the sleep case retires
   * venues that were never researched.
   */
  onSuspended?: () => void;
  /**
   * Called when a call produced NO MEASUREMENT of its venues — a timeout, or a
   * non-zero exit (which is what an upstream rate-limit looks like). Distinct
   * from `onSuspended`, which is the narrower host-slept case.
   *
   * Why this exists (2026-08-06): every one of these resolves to `[]`, exactly
   * like a clean call that genuinely found nothing. `run-backfill` then strikes
   * every asked venue that isn't in `ingestedRows` — so a 180s timeout retired 8
   * venues that were never actually researched. At the measured ~50% timeout
   * rate and TOP_K=40 that is ~160 false strikes per run, against an attempts
   * file already holding 62 venues one strike from permanent retirement.
   * `onSuspended` had a seam for precisely this reason; timeout and non-zero
   * exit did not. A clean call returning `[]` does NOT fire this — that is a
   * real negative result and should count.
   */
  onUnmeasured?: (reason: "timeout" | "exit" | "usage-limit") => void;
}

/**
 * Does this failed invocation look like a Claude USAGE LIMIT rather than a
 * research failure?
 *
 * MEASURED 2026-08-06 13:16: at a session limit `claude -p` exits 1 and writes
 * the `--output-format json` envelope with `is_error: true` and zero tokens —
 * with EMPTY stderr, so there is nothing to diagnose from unless we look at
 * stdout. Interactively it prints "You've hit your session limit · resets
 * 1:40pm". Both shapes matter: the job may or may not be using --output-format.
 *
 * This is worth separating from a generic non-zero exit because the two demand
 * opposite responses: a research failure is about the venues, a usage limit is
 * about the account and every call in the run will fail the same way.
 */
export function looksLikeUsageLimit(stdout = "", stderr = ""): boolean {
  const hay = `${stdout}\n${stderr}`;
  if (/\b(session|usage|rate)\s+limit\b/i.test(hay)) return true;
  // The JSON envelope: an error that consumed no tokens at all. A genuine
  // research failure that reached the model would report non-zero usage.
  try {
    const env = JSON.parse(stdout.trim()) as Record<string, unknown>;
    if (env && env.is_error === true) {
      const u = (env.usage ?? {}) as Record<string, number>;
      const spent =
        (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
      if (spent === 0) return true;
    }
  } catch {
    /* not the envelope — fall through */
  }
  return false;
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

/**
 * Grace period between the child EXITING and us giving up on its stdio closing.
 * See the process-group note in `defaultClaudeRunner`.
 */
const STDIO_FLUSH_GRACE_MS = 2_000;

/** The real runner: spawn `claude -p`, feed the prompt on stdin, capture stdout,
 *  enforce a hard timeout. Never rejects — resolves a `ClaudeRunResult`.
 *
 *  GROUP-SAFE ON PURPOSE. `claude` spawns helper processes that inherit its
 *  stdout pipe. Killing only the direct child (plain `child.kill()`, no
 *  `detached`) leaves those helpers holding the pipe open, so `'close'` — which
 *  waits for stdio EOF — never fires and the promise never settles. That is not
 *  hypothetical: the identical bug parked a second-nick daemon for ~2h45m with
 *  its launchd LED stuck on "running" (fixed there 2026-07-28, commit a710ba6).
 *  This runner is about to be scheduled unattended, so it gets the same two
 *  defenses:
 *    1. `detached: true` makes the child a process-group leader, so
 *       `process.kill(-pid)` SIGKILLs the WHOLE group — helpers included.
 *    2. Settle on `'exit'` after a short flush grace, so even a pipe holder we
 *       failed to kill cannot block the run forever.
 */
export function defaultClaudeRunner(opts: ClaudeResearcherOptions): ClaudeRunner {
  const bin = opts.claudeBin ?? "claude";
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const model = opts.model;

  return (prompt: string, callTimeoutMs?: number) =>
    new Promise<ClaudeRunResult>((resolve) => {
      // Per-call budget wins over the construction-time default.
      const effectiveTimeoutMs = callTimeoutMs ?? timeoutMs;
      // --allowedTools LAST-but-one is a variadic; a following `--model` (a
      // `--`-prefixed token) correctly terminates it. Order matters.
      const args = ["-p", "--output-format", "json", "--allowedTools", "WebSearch", "WebFetch"];
      if (model) args.push("--model", model);

      let child;
      try {
        child = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"], detached: true });
      } catch (e) {
        resolve({ code: -1, stdout: "", stderr: String(e) });
        return;
      }

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;
      let graceTimer: NodeJS.Timeout | undefined;

      /** SIGKILL the child's whole process group, falling back to the child. */
      const killGroup = () => {
        try {
          if (child.pid !== undefined) process.kill(-child.pid, "SIGKILL");
          else child.kill("SIGKILL");
        } catch {
          // ESRCH (already gone) or EPERM — fall back to the direct child.
          try {
            child.kill("SIGKILL");
          } catch {
            /* nothing left to kill */
          }
        }
      };

      // Wall-clock start, compared against the timer's uptime-clock budget below
      // to tell a slow researcher apart from a sleeping host.
      const startedAt = Date.now();
      let suspended = false;

      const timer = setTimeout(() => {
        timedOut = true;
        // `setTimeout` counts RUNNABLE time; it does not advance while the host
        // is asleep. So if far more wall clock elapsed than the budget, this
        // call never really got its allotted time — the machine was suspended.
        // 2× is deliberately loose: normal scheduling jitter is nowhere near
        // it, while the observed sleep case overshot by ~54×.
        suspended = Date.now() - startedAt > effectiveTimeoutMs * 2;
        killGroup();
      }, effectiveTimeoutMs);

      const done = (code: number) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (graceTimer) clearTimeout(graceTimer);
        resolve({ code, stdout, stderr, timedOut, suspended });
      };

      child.stdout?.on("data", (d) => (stdout += d.toString()));
      child.stderr?.on("data", (d) => (stderr += d.toString()));
      child.on("error", () => done(-1));
      child.on("close", (code) => done(code ?? -1));
      // The process is gone but a helper may still hold the pipe. Give stdio a
      // moment to flush, then settle regardless — 'close' may never arrive.
      child.on("exit", (code) => {
        if (settled || graceTimer) return;
        graceTimer = setTimeout(() => done(code ?? -1), STDIO_FLUSH_GRACE_MS);
        graceTimer.unref?.();
      });

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

  return async (prompt: string, callOpts?: { timeoutMs?: number }): Promise<unknown[]> => {
    try {
      const res = await runner(wrapPrompt(prompt), callOpts?.timeoutMs);
      if (res.timedOut) {
        if (res.suspended) {
          // Say which failure this is. "timed out" and "the host slept" look
          // identical from here — both return [] — and conflating them is what
          // let 88 never-researched venues be recorded as failed attempts.
          log("claudeResearcher: HOST SUSPENDED mid-call (not a real timeout) — returning []");
          opts.onSuspended?.();
          return [];
        }
        log("claudeResearcher: timed out — returning [] (NOT a measurement of these venues)");
        opts.onUnmeasured?.("timeout");
        return [];
      }
      if (res.code !== 0) {
        if (looksLikeUsageLimit(res.stdout, res.stderr)) {
          // Name it. This exact failure spent two minutes burning 40 drain
          // iterations while reporting success, because "exited 1" with empty
          // stderr reads as a research problem and it is not one.
          log(
            "claudeResearcher: USAGE LIMIT — claude -p refused the call and spent no tokens. " +
              "Returning [] (NOT a measurement of these venues).",
          );
          opts.onUnmeasured?.("usage-limit");
          return [];
        }
        log(
          `claudeResearcher: claude exited ${res.code} — returning [] ` +
            `(stderr: ${(res.stderr ?? "").slice(0, 200).replace(/\s+/g, " ").trim()})`,
        );
        opts.onUnmeasured?.("exit");
        return [];
      }
      const rows = parseCandidates(res.stdout);
      log(`claudeResearcher: parsed ${rows.length} candidate row(s) from claude -p output`);
      return rows;
    } catch (e) {
      log(`claudeResearcher: threw (${String(e)}) — returning [] (fail-safe)`);
      opts.onUnmeasured?.("exit");
      return [];
    }
  };
}
