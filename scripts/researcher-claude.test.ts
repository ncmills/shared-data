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
