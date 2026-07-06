// research-gap.test.ts — Task 14: orchestrator over a PLUGGABLE researcher.
//
// researchGap builds a precise prompt from a GapTask, calls an injected
// researcher (mocked here — NO network), and gates every candidate through
// validateResearchedRow. Only ok:true rows come back; rejects are counted.
import { test } from "node:test";
import assert from "node:assert/strict";

import { researchGap, buildResearchPrompt } from "./research-gap";
import type { Researcher } from "./research-gap";
import type { GapTask } from "./gap-queue";

const GOLF_TASK: GapTask = {
  id: "golf:golfRegion=International;tier=budget",
  dataset: "golf",
  cell: { golfRegion: "International", tier: "budget" },
  deficit: 3,
  wizardsServed: ["bestman", "offsite-retreat", "offsite-outing", "handicap", "tdf"],
  starvedForWizards: ["handicap", "tdf"],
  leverageScore: 15,
};

/** One valid golf candidate the researcher might return. */
function validCandidate(name: string, url: string) {
  return {
    dataset: "golf",
    name,
    city: "Inverness",
    state: "NS",
    region: "International",
    tier: "budget",
    greenFeeRange: [100, 175],
    style: "links",
    walkable: true,
    driveMinutes: 30,
    highlight: "A real clifftop links course.",
    sites: ["tdf", "handicap"],
    products: ["golf-trip"],
    sourceUrl: url,
    citations: [url],
  };
}

test("buildResearchPrompt includes region, tier, deficit, and no-fabrication instruction", () => {
  const prompt = buildResearchPrompt(GOLF_TASK);
  assert.match(prompt, /International/);
  assert.match(prompt, /budget/);
  assert.match(prompt, /3/); // deficit
  assert.match(prompt, /golf/i);
  assert.match(prompt, /no fabrication|do not fabricate|real/i);
  assert.match(prompt, /primary source|cite|citation/i);
});

test("researchGap returns ONLY the valid rows and reports the rejected count", async () => {
  const researcher: Researcher = async () => [
    validCandidate("Cabot Cliffs", "https://www.cabotcapebreton.com/"),
    validCandidate("Real Course Two", "https://www.realcoursetwo.com/"),
    // invalid: no sourceUrl
    { dataset: "golf", name: "No URL Course", region: "International", tier: "budget" },
    // invalid: placeholder URL
    validCandidate("Fake Course", "https://example.com/x"),
    // invalid: not even an object
    "garbage",
  ];

  const result = await researchGap(GOLF_TASK, researcher);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rejected, 3);
  assert.deepEqual(
    result.rows.map((r) => (r as { name: string }).name).sort(),
    ["Cabot Cliffs", "Real Course Two"],
  );
});

test("researchGap passes the built prompt to the researcher", async () => {
  let seen = "";
  const researcher: Researcher = async (prompt) => {
    seen = prompt;
    return [];
  };
  await researchGap(GOLF_TASK, researcher);
  assert.equal(seen, buildResearchPrompt(GOLF_TASK));
});

test("researchGap tolerates a researcher returning an empty list", async () => {
  const researcher: Researcher = async () => [];
  const result = await researchGap(GOLF_TASK, researcher);
  assert.equal(result.rows.length, 0);
  assert.equal(result.rejected, 0);
});

// ─── liveUrlCheck (opt-in, for the unattended engine — Item 3) ─────────────
// NO network here either: `verifyUrl` is injected. Default (no opts) must
// behave EXACTLY as before (sync-only), proven by the tests above still
// passing unchanged.

test("researchGap with liveUrlCheck:true additionally rejects a row whose sourceUrl is not live", async () => {
  const researcher: Researcher = async () => [
    validCandidate("Cabot Cliffs", "https://www.cabotcapebreton.com/"),
    validCandidate("Dead Link Course", "https://www.dead-link-course.example/"),
  ];
  const result = await researchGap(GOLF_TASK, researcher, {
    liveUrlCheck: true,
    verifyUrl: async (url) =>
      url.includes("dead-link") ? { ok: false, status: 404, reason: "non-2xx/3xx final status: 404" } : { ok: true, status: 200 },
  });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].name, "Cabot Cliffs");
  assert.equal(result.rejected, 1);
  assert.ok(result.rejections.some((r) => r.reasons.some((reason) => /sourceUrl is not live/.test(reason))));
});

test("researchGap with liveUrlCheck:true never calls the live verifier for a row that already fails sync validation", async () => {
  let calls = 0;
  const researcher: Researcher = async () => [
    // invalid: no sourceUrl at all — must be rejected before any live check
    { dataset: "golf", name: "No URL Course", region: "International", tier: "budget" },
  ];
  const result = await researchGap(GOLF_TASK, researcher, {
    liveUrlCheck: true,
    verifyUrl: async () => {
      calls++;
      return { ok: true, status: 200 };
    },
  });
  assert.equal(result.rows.length, 0);
  assert.equal(result.rejected, 1);
  assert.equal(calls, 0, "the live verifier must never run for a row rejected by sync validation");
});

test("researchGap without liveUrlCheck (default) never invokes a live verifier even if one is supplied", async () => {
  let calls = 0;
  const researcher: Researcher = async () => [validCandidate("Cabot Cliffs", "https://www.cabotcapebreton.com/")];
  const result = await researchGap(GOLF_TASK, researcher, {
    verifyUrl: async () => {
      calls++;
      return { ok: true, status: 200 };
    },
  });
  assert.equal(result.rows.length, 1);
  assert.equal(calls, 0, "liveUrlCheck defaults to false — the sync-only path every existing caller relies on");
});
