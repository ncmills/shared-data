/**
 * The judgement logic, pinned without touching the network.
 *
 * The cases below are all REAL rows from the 2026-08-06 audit. The
 * false-positive ones matter most: this checker's job is to be trusted, and a
 * checker that condemns working links destroys more than it saves.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import { judge, nameTokens, visibleText, verdictForStatus } from "./audit-url-subject";

const page = (body: string) => `<html><head><title>x</title></head><body>${body}</body></html>`;

test("name + locality on the page is SUBJECT-OK", () => {
  const r = judge(
    { name: "Torchy's Tacos", city: "Austin", state: "TX" },
    page("<h1>Torchy's Tacos</h1><p>Austin, Texas — damn good tacos</p>"),
  );
  assert.equal(r.verdict, "SUBJECT-OK");
});

test("the 91-golf-URL failure: right-looking domain, unrelated business", () => {
  // hash-kitchen.com resolved 200 and was a construction company.
  const r = judge(
    { name: "Hash Kitchen", city: "Santa Fe", state: "NM" },
    page("<h1>Premier Commercial Construction</h1><p>Serving Ohio since 1987</p>"),
  );
  assert.equal(r.verdict, "UNCONFIRMED");
  assert.match(r.why, /neither name/);
});

test("a name match with no locality still passes — many venue sites never name their city", () => {
  const r = judge(
    { name: "Chai Pani", city: "Asheville", state: "NC" },
    page("<h1>Chai Pani</h1><p>Indian street food</p>"),
  );
  assert.equal(r.verdict, "SUBJECT-OK");
});

test("compound editorial names match on the venue, not the outing", () => {
  // "Reptile Gardens + spa day backup" — everything after `+` describes the day.
  assert.deepEqual(nameTokens("Reptile Gardens + spa day backup"), ["reptile", "gardens"]);
  const r = judge(
    { name: "Reptile Gardens + spa day backup", city: "Black Hills", state: "SD" },
    page("<h1>Reptile Gardens</h1>"),
  );
  assert.equal(r.verdict, "SUBJECT-OK");
});

test("'Horseback Riding at Rockin' TJ Ranch' does not require the activity words", () => {
  const toks = nameTokens("Horseback Riding at Rockin' TJ Ranch");
  assert.ok(!toks.includes("at"));
  assert.ok(toks.includes("horseback"));
});

test("locality-only match is UNCONFIRMED, never SUBJECT-OK", () => {
  const r = judge(
    { name: "Lookout Rooftop and Bar", city: "Boston", state: "MA" },
    page("<p>The Envoy Hotel, Boston's Seaport</p>"),
  );
  assert.equal(r.verdict, "UNCONFIRMED");
});

test("UNCONFIRMED is the worst verdict a live page can earn — never WRONG", () => {
  // A JS-rendered page (10barrel.com, curatetapasbar.com) serves an empty shell.
  // Those are CORRECT urls. Nothing here may escalate them beyond "look at this".
  const r = judge({ name: "Curate", city: "Asheville", state: "NC" }, page("<div id=root></div>"));
  assert.equal(r.verdict, "UNCONFIRMED");
  assert.notEqual(r.verdict as string, "WRONG");
});

test("markup is not visible text — a name in a class attribute must not count", () => {
  const html = page('<div class="curate-tapas-bar-wrapper"><p>Roofing contractors</p></div>');
  assert.ok(!visibleText(html).includes("curate"));
  const r = judge({ name: "Curate", city: "Asheville", state: "NC" }, html);
  assert.equal(r.verdict, "UNCONFIRMED");
});

test("script bodies are stripped before matching", () => {
  const html = `<html><body><script>var venue="Chai Pani";</script><p>Auto repair</p></body></html>`;
  const r = judge({ name: "Chai Pani", city: "Asheville", state: "NC" }, html);
  assert.equal(r.verdict, "UNCONFIRMED");
});

test("state abbreviation matches as a whole word only", () => {
  // "NC" must not match inside "franchise" / "since".
  const r = judge(
    { name: "Nowhere Venue", city: "Qqqq", state: "NC" },
    page("<p>Franchise opportunities since 1990</p>"),
  );
  assert.equal(r.verdict, "UNCONFIRMED");
});

// ─── status classification (2026-08-10) ─────────────────────────────────────
//
// The 08-07 audit reported ONE dead link portfolio-wide and the watchdog
// escalated it to RED: "users see a broken 'Reserve' link with no fallback."
//
//   Sagamore Spirit Distillery Tour (Baltimore) → https://sagamorespirit.com/
//
// Re-measured by hand on 08-10: 10 GETs six seconds apart returned 5× HTTP 521
// and 5× HTTP 200, and every 200 carried `cf-cache-status: DYNAMIC` with the
// real 343KB homepage — served by the ORIGIN, not a cache. A live site with a
// flapping origin. Quarantining it would have stripped a working link, which is
// the same failure that nearly cost seven links in the first audit.

test("a Cloudflare origin error is UNREACHABLE, not DEAD", () => {
  for (const status of [520, 521, 522, 523, 524, 525, 526, 527]) {
    const r = verdictForStatus(status);
    assert.equal(r?.verdict, "UNREACHABLE", `HTTP ${status} is the edge, not the origin`);
    assert.match(r!.why, /NOT a dead link/);
  }
});

test("a server that answered with an error is still DEAD", () => {
  // The origin spoke. That IS evidence about the url, and must stay actionable —
  // widening the transient bucket to 5xx generally would hide real breakage.
  for (const status of [404, 410, 500, 502, 503, 519, 528]) {
    assert.equal(verdictForStatus(status)?.verdict, "DEAD", `HTTP ${status} must stay actionable`);
  }
});

test("a refusal stays BLOCKED — the three states must not blur", () => {
  for (const status of [401, 403, 429]) {
    assert.equal(verdictForStatus(status)?.verdict, "BLOCKED");
  }
});

test("a 2xx settles nothing by itself — only the page body can", () => {
  assert.equal(verdictForStatus(200), null);
  assert.equal(verdictForStatus(299), null);
});
