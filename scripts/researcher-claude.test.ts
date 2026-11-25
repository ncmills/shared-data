// researcher-claude.test.ts — ARM-B: the headless-claude researcher backend.
//
// NO real `claude` process is ever spawned here and NO network is touched:
//   • parseCandidates is pure — exercised against clean JSON, ```json-fenced,
//     prose-wrapped, the `--output-format json` envelope, and garbage.
//   • claudeResearcher is exercised through an INJECTED command-runner, proving
//     it returns parsed candidates on success and `[]` on every failure mode
//     (non-zero exit, timeout, unparseable, thrown) — and NEVER throws.
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseCandidates, claudeResearcher, wrapPrompt } from "./researcher-claude";
import type { ClaudeRunResult } from "./researcher-claude";

const ROW = {
  dataset: "golf",
  name: "Some Real Course",
  city: "Anstruther",
  state: "Scotland",
  region: "International",
  tier: "budget",
  sourceUrl: "https://example-course.co.uk/",
  citations: ["https://example-course.co.uk/"],
};

// ─── parseCandidates: extraction from every realistic stdout shape ──────────

test("parseCandidates: clean JSON array", () => {
  const out = JSON.stringify([ROW, ROW]);
  const rows = parseCandidates(out);
  assert.equal(rows.length, 2);
  assert.equal((rows[0] as { name: string }).name, "Some Real Course");
});

test("parseCandidates: ```json-fenced array (with surrounding prose)", () => {
  const out = "Here are the venues I found:\n\n```json\n" + JSON.stringify([ROW]) + "\n```\nHope that helps!";
  const rows = parseCandidates(out);
  assert.equal(rows.length, 1);
  assert.equal((rows[0] as { name: string }).name, "Some Real Course");
});

test("parseCandidates: bare ``` fence (no json language tag)", () => {
  const out = "```\n" + JSON.stringify([ROW]) + "\n```";
  assert.equal(parseCandidates(out).length, 1);
});

test("parseCandidates: prose-wrapped array, no fences", () => {
  const out = `I researched this and here is the result: ${JSON.stringify([ROW])} — all verified live.`;
  const rows = parseCandidates(out);
  assert.equal(rows.length, 1);
});

test("parseCandidates: `claude -p --output-format json` envelope with array embedded in .result string", () => {
  const envelope = JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    result: "Here you go:\n```json\n" + JSON.stringify([ROW]) + "\n```",
  });
  const rows = parseCandidates(envelope);
  assert.equal(rows.length, 1);
  assert.equal((rows[0] as { name: string }).name, "Some Real Course");
});

test("parseCandidates: envelope whose .result is itself a raw JSON array string", () => {
  const envelope = JSON.stringify({ type: "result", result: JSON.stringify([ROW, ROW]) });
  assert.equal(parseCandidates(envelope).length, 2);
});

test("parseCandidates: does NOT close the array early on a ] inside a string value", () => {
  const tricky = [{ ...ROW, highlight: "Bracketed ] name [ oddity", name: "X ] Y" }];
  const out = "prose " + JSON.stringify(tricky) + " more prose";
  const rows = parseCandidates(out);
  assert.equal(rows.length, 1);
  assert.equal((rows[0] as { name: string }).name, "X ] Y");
});

test("parseCandidates: garbage / prose-only ⇒ []", () => {
  assert.deepEqual(parseCandidates("I could not find any venues, sorry."), []);
  assert.deepEqual(parseCandidates(""), []);
  assert.deepEqual(parseCandidates("   "), []);
  assert.deepEqual(parseCandidates("{ not: valid json"), []);
});

test("parseCandidates: non-string input ⇒ []", () => {
  assert.deepEqual(parseCandidates(undefined), []);
  assert.deepEqual(parseCandidates(null), []);
  assert.deepEqual(parseCandidates(42), []);
});

test("parseCandidates: an explicit empty array ⇒ [] (a valid 'found nothing' answer)", () => {
  assert.deepEqual(parseCandidates("[]"), []);
  assert.deepEqual(parseCandidates("No matches: []"), []);
});

// ─── claudeResearcher: injected runner — success + every failure mode ───────

function fixedRunner(res: ClaudeRunResult) {
  const calls: string[] = [];
  const fn = async (prompt: string): Promise<ClaudeRunResult> => {
    calls.push(prompt);
    return res;
  };
  return { fn, calls };
}

test("claudeResearcher: returns parsed candidates on a clean (code 0) run", async () => {
  const runner = fixedRunner({ code: 0, stdout: JSON.stringify([ROW]) });
  const researcher = claudeResearcher({ runner: runner.fn });
  const rows = await researcher("find golf courses");
  assert.equal(rows.length, 1);
  // the prompt actually handed to the CLI carries the OUTPUT CONTRACT wrapper
  assert.match(runner.calls[0], /OUTPUT CONTRACT/);
  assert.match(runner.calls[0], /find golf courses/);
});

test("claudeResearcher: parses the real `--output-format json` envelope shape", async () => {
  const envelope = JSON.stringify({ type: "result", result: JSON.stringify([ROW]) });
  const runner = fixedRunner({ code: 0, stdout: envelope });
  const rows = await claudeResearcher({ runner: runner.fn })("prompt");
  assert.equal(rows.length, 1);
});

test("claudeResearcher: non-zero exit ⇒ [] (never throws)", async () => {
  const runner = fixedRunner({ code: 1, stdout: "", stderr: "boom" });
  const rows = await claudeResearcher({ runner: runner.fn })("prompt");
  assert.deepEqual(rows, []);
});

test("claudeResearcher: timeout ⇒ [] (never throws)", async () => {
  const runner = fixedRunner({ code: -1, stdout: "partial", timedOut: true });
  const rows = await claudeResearcher({ runner: runner.fn })("prompt");
  assert.deepEqual(rows, []);
});

test("claudeResearcher: unparseable stdout on a code-0 run ⇒ []", async () => {
  const runner = fixedRunner({ code: 0, stdout: "sorry, no JSON here" });
  const rows = await claudeResearcher({ runner: runner.fn })("prompt");
  assert.deepEqual(rows, []);
});

test("claudeResearcher: a runner that THROWS is caught ⇒ [] (fail-safe, never throws into the daemon)", async () => {
  const researcher = claudeResearcher({
    runner: async () => {
      throw new Error("spawn ENOENT");
    },
  });
  const rows = await researcher("prompt");
  assert.deepEqual(rows, []);
});

test("wrapPrompt: preserves the original prompt and appends the JSON-only contract", () => {
  const w = wrapPrompt("ORIGINAL PROMPT BODY");
  assert.match(w, /ORIGINAL PROMPT BODY/);
  assert.match(w, /ONLY a JSON/);
});

// ─── the telemetry-scrape regression (2026-08-02) ───────────────────────────
//
// A scheduled dry run reported "1 candidate rejected — candidate has no name"
// on every task. The researcher had in fact returned `"result": "[]"` — nothing
// found, correctly. parseCandidates only accepted a NON-EMPTY payload under an
// envelope key, so an empty one fell through to "first [...] anywhere in the
// text" — which matched `usage.iterations`, the CLI's own telemetry.
//
// Two failure modes, both pinned: the signal was corrupted (found-nothing became
// rejected-something), and arbitrary envelope objects were entering the
// candidate pipeline at all.

/** The real envelope shape, trimmed to the parts that matter. */
const ENVELOPE_EMPTY_RESULT = JSON.stringify({
  is_error: false,
  usage: {
    input_tokens: 2703,
    iterations: [{ input_tokens: 1408, output_tokens: 631, type: "message" }],
  },
  permission_denials: [],
  result: "[]",
  type: "result",
});

test("parseCandidates: an empty `result` means EMPTY, not 'go scrape the telemetry'", () => {
  const rows = parseCandidates(ENVELOPE_EMPTY_RESULT);
  assert.deepEqual(rows, [], "an honest empty result must parse as empty");
});

test("parseCandidates: never returns an object from the envelope's own telemetry", () => {
  const rows = parseCandidates(ENVELOPE_EMPTY_RESULT);
  for (const r of rows) {
    assert.ok(
      !(r as Record<string, unknown>)?.input_tokens,
      "a usage.iterations entry leaked into the candidate list",
    );
  }
});

test("parseCandidates: a NON-empty result inside the same envelope still parses", () => {
  const envelope = JSON.stringify({
    usage: { iterations: [{ input_tokens: 1408, type: "message" }] },
    result: JSON.stringify([{ ...ROW }]),
    type: "result",
  });
  const rows = parseCandidates(envelope);
  assert.equal(rows.length, 1, "a real payload must survive the envelope");
  assert.equal((rows[0] as Record<string, unknown>).name, ROW.name);
});

test("parseCandidates: a prose-wrapped result inside the envelope still parses", () => {
  const envelope = JSON.stringify({
    usage: { iterations: [{ input_tokens: 1408, type: "message" }] },
    result: "Here are the venues I found:\n```json\n" + JSON.stringify([ROW]) + "\n```",
    type: "result",
  });
  const rows = parseCandidates(envelope);
  assert.equal(rows.length, 1);
  assert.equal((rows[0] as Record<string, unknown>).name, ROW.name);
});

test("parseCandidates: an envelope with an UNPARSEABLE result yields [], not telemetry", () => {
  const envelope = JSON.stringify({
    usage: { iterations: [{ input_tokens: 1408, type: "message" }] },
    result: "I could not find anything useful.",
    type: "result",
  });
  assert.deepEqual(parseCandidates(envelope), []);
});

test("parseCandidates: a bare prose response (NOT an envelope) still scrapes its array", () => {
  // The fallback is still valuable when the output genuinely is not an envelope.
  const rows = parseCandidates("Sure! Here you go: " + JSON.stringify([ROW]));
  assert.equal(rows.length, 1);
  assert.equal((rows[0] as Record<string, unknown>).name, ROW.name);
});

// ─── a sleeping host is not a slow researcher (2026-08-05) ─────────────────
//
// Both surface as `timedOut` and both return []. Only one of them means the
// venue was actually asked about, and conflating them is what recorded 88
// never-researched venues as failed attempts on 2026-08-04.

test("claudeResearcher: a SUSPENDED timeout is logged distinctly and notifies the caller", async () => {
  const logs: string[] = [];
  let notified = 0;
  const researcher = claudeResearcher({
    runner: async () => ({ code: -1, stdout: "", stderr: "", timedOut: true, suspended: true }),
    log: (m) => logs.push(m),
    onSuspended: () => notified++,
  });

  assert.deepEqual(await researcher("anything"), [], "still fail-safe");
  assert.equal(notified, 1, "the caller must learn the host slept");
  assert.match(logs.join("\n"), /HOST SUSPENDED/, "must not be reported as a plain timeout");
});

test("claudeResearcher: an ORDINARY timeout does NOT notify the caller", async () => {
  const logs: string[] = [];
  let notified = 0;
  const researcher = claudeResearcher({
    runner: async () => ({ code: -1, stdout: "", stderr: "", timedOut: true }),
    log: (m) => logs.push(m),
    onSuspended: () => notified++,
  });

  assert.deepEqual(await researcher("anything"), []);
  assert.equal(notified, 0, "a genuinely slow researcher IS evidence — do not suppress it");
  assert.match(logs.join("\n"), /timed out/);
  assert.doesNotMatch(logs.join("\n"), /HOST SUSPENDED/);
});

// ─── usage limit vs. research failure (2026-08-06) ──────────────────────────
//
// MEASURED: at a Claude session usage limit, `claude -p` exits 1 and prints the
// `--output-format json` envelope with `is_error: true` and ZERO tokens. The
// researcher is fail-safe, so it returned [] and the run reported
// "0 researched ... === run OK ===" — byte-identical to "researched everything,
// found nothing". A 40-iteration drain burned all 40 in ~2 minutes that way.
// The scheduled Tue-03:00 job would do the same, weekly, and read as healthy.

const LIMIT_ENVELOPE = JSON.stringify({
  is_error: true,
  duration_api_ms: 0,
  num_turns: 1,
  stop_reason: "stop_sequence",
  total_cost_usd: 0,
  usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0 },
});

test("claudeResearcher: a usage-limit exit is reported as usage-limit, not a generic exit", async () => {
  const reasons: string[] = [];
  const logs: string[] = [];
  const research = claudeResearcher({
    runner: async (): Promise<ClaudeRunResult> => ({ code: 1, stdout: LIMIT_ENVELOPE, stderr: "" }),
    onUnmeasured: (r) => reasons.push(r),
    log: (m) => logs.push(m),
  });

  assert.deepEqual(await research("anything"), []);
  assert.deepEqual(reasons, ["usage-limit"]);
  assert.match(logs.join("\n"), /USAGE LIMIT/i);
});

test("claudeResearcher: the plain-text limit message is recognised too", async () => {
  const reasons: string[] = [];
  const research = claudeResearcher({
    runner: async (): Promise<ClaudeRunResult> => ({
      code: 1,
      stdout: "You've hit your session limit · resets 1:40pm (America/New_York)",
      stderr: "",
    }),
    onUnmeasured: (r) => reasons.push(r),
  });

  assert.deepEqual(await research("anything"), []);
  assert.deepEqual(reasons, ["usage-limit"]);
});

test("claudeResearcher: an ordinary non-zero exit is still a plain exit, not a usage limit", async () => {
  const reasons: string[] = [];
  const research = claudeResearcher({
    runner: async (): Promise<ClaudeRunResult> => ({ code: 2, stdout: "", stderr: "boom" }),
    onUnmeasured: (r) => reasons.push(r),
  });

  assert.deepEqual(await research("anything"), []);
  assert.deepEqual(reasons, ["exit"]);
});

test("claudeResearcher: a SUCCESSFUL call that found nothing is NOT unmeasured", async () => {
  // The distinction the whole fix rests on: an empty result is a measurement.
  const reasons: string[] = [];
  const research = claudeResearcher({
    runner: async (): Promise<ClaudeRunResult> => ({ code: 0, stdout: "[]", stderr: "" }),
    onUnmeasured: (r) => reasons.push(r),
  });

  assert.deepEqual(await research("anything"), []);
  assert.deepEqual(reasons, []);
});
