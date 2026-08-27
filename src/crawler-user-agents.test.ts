/**
 * A list whose entries cannot match is indistinguishable from a list that finds nothing.
 *
 * That is the whole risk here. `classifyUserAgent` lowercases the UA before comparing, so a
 * pattern containing a capital letter can NEVER match — and the failure would be silent: bot
 * traffic keeps arriving, `is_bot` stays false, and the acquisition number stays wrong while a
 * classifier appears to be running. Same shape as the guards this fleet spent 2026-08-27
 * removing, so it gets an explicit test rather than a convention.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  AUTOMATION_AGENTS,
  DECLARED_CRAWLERS,
  classifyUserAgent,
} from "./crawler-user-agents";

const ALL = [...DECLARED_CRAWLERS, ...AUTOMATION_AGENTS];

test("the lists are non-empty", () => {
  assert.ok(DECLARED_CRAWLERS.length > 10, `declared: ${DECLARED_CRAWLERS.length}`);
  assert.ok(AUTOMATION_AGENTS.length > 10, `automation: ${AUTOMATION_AGENTS.length}`);
});

test("every pattern is lowercase, or it can never match", () => {
  const bad = ALL.filter((p) => p !== p.toLowerCase());
  assert.deepEqual(bad, [], `patterns that can never match a lowercased UA: ${bad.join(", ")}`);
});

test("no pattern is blank or whitespace — a blank substring matches EVERYTHING", () => {
  const bad = ALL.filter((p) => p.trim().length === 0);
  assert.deepEqual(bad, [], "a blank pattern would classify every visitor as a bot");
  assert.ok(ALL.every((p) => p.trim() === p), "a padded pattern silently fails to match");
});

test("no pattern appears in both lists — the reason must be unambiguous", () => {
  const dupes = DECLARED_CRAWLERS.filter((p) => (AUTOMATION_AGENTS as readonly string[]).includes(p));
  assert.deepEqual(dupes, [], `in both groups: ${dupes.join(", ")}`);
});

test("no pattern is a substring of a common human browser UA", () => {
  // The falsification case. A pattern like "safari" or "mozilla" would classify every real
  // visitor as a crawler and silently zero the acquisition numbers this exists to correct.
  const HUMAN = [
    "mozilla/5.0 (macintosh; intel mac os x 10_15_7) applewebkit/537.36 (khtml, like gecko) chrome/128.0.0.0 safari/537.36",
    "mozilla/5.0 (iphone; cpu iphone os 17_5 like mac os x) applewebkit/605.1.15 (khtml, like gecko) version/17.5 mobile/15e148 safari/604.1",
    "mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/127.0.0.0 safari/537.36 edg/127.0.0.0",
    "mozilla/5.0 (macintosh; intel mac os x 10.15; rv:129.0) gecko/20100101 firefox/129.0",
  ];
  for (const ua of HUMAN) {
    const v = classifyUserAgent(ua);
    assert.equal(v.is_bot, false, `human UA classified as ${v.bot_reason}: ${ua.slice(0, 60)}`);
  }
});

test("real crawler UAs are caught, and the reason names the group", () => {
  const g = classifyUserAgent(
    "mozilla/5.0 (compatible; googlebot/2.1; +http://www.google.com/bot.html)");
  assert.equal(g.is_bot, true);
  assert.equal(g.bot_reason, "declared:googlebot");

  const c = classifyUserAgent("mozilla/5.0 (compatible; claudebot/1.0; +claudebot@anthropic.com)");
  assert.equal(c.bot_reason, "declared:claudebot");

  const h = classifyUserAgent(
    "mozilla/5.0 (x11; linux x86_64) applewebkit/537.36 (khtml, like gecko) headlesschrome/128.0.0.0 safari/537.36");
  assert.equal(h.is_bot, true);
  assert.equal(h.bot_reason, "automation:headlesschrome");

  assert.equal(classifyUserAgent("curl/8.4.0").bot_reason, "automation:curl/");
});

test("matching is case-insensitive on the INPUT too", () => {
  assert.equal(classifyUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)").is_bot, true);
});

test("an absent UA is NOT a bot — we could not tell, and that is not a verdict", () => {
  // Privacy tooling strips the header. Recording "unknown" as "robot" is exactly the
  // not-measured-as-measured substitution this package exists to remove; an unnamed agent is
  // left to the read-time day-shape rule, which reports itself.
  for (const ua of [null, undefined, ""]) {
    const v = classifyUserAgent(ua);
    assert.equal(v.is_bot, false, `absent UA (${String(ua)}) classified as a bot`);
    assert.equal(v.bot_reason, null);
  }
});

test("declared beats automation when a UA contains both", () => {
  // Googlebot renders with a headless engine; the useful fact is that it is Googlebot.
  const v = classifyUserAgent("mozilla/5.0 (compatible; googlebot/2.1) headlesschrome/128");
  assert.equal(v.bot_reason, "declared:googlebot");
});
