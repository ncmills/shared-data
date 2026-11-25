/**
 * The neutral `honeymoon` wizard tag: routing + reader.
 * A local-only consumer outside this repo reads the tag; it is not published.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_WIZARD_TAGS, wizardsForActivity } from "./tags";
import { ENGINE_READS } from "./engine-reads";
import { deriveRouting } from "./tagging-rules";
import { sharedDestinations } from "./index";

test("honeymoon is a wizard tag and its engine reads party-venue", () => {
  assert.ok((ALL_WIZARD_TAGS as readonly string[]).includes("honeymoon"));
  assert.ok(ENGINE_READS.honeymoon.includes("party-venue"));
});

test("a general-audience party-venue row routes to honeymoon, and the engine reads its kind", () => {
  for (const venueType of ["activity", "dining", "nightlife", "lodging"] as const) {
    const r = deriveRouting({ kind: "party-venue", venueType, activityType: "sunset-cruise", vibe: "balanced" });
    assert.ok(r.core.wizards.includes("honeymoon"), venueType);
    assert.ok(ENGINE_READS.honeymoon.includes("party-venue"));
  }
  assert.ok(wizardsForActivity("spa", []).includes("honeymoon"));
});

test("party-locked rows do not route to honeymoon", () => {
  assert.ok(!wizardsForActivity("poker-night", ["bestman"]).includes("honeymoon"));
});

test("existing brand routing is unchanged (pinned wizards, honeymoon aside)", () => {
  const strip = (w: string[]) => w.filter((x) => x !== "honeymoon").sort();
  assert.deepEqual(strip(wizardsForActivity("poker-night", ["bestman"])), ["bestman"]);
  assert.deepEqual(strip(wizardsForActivity("golf", ["both"])), ["bestman", "engagedmoon", "friendsmoon", "offsite-outing"]);
  assert.deepEqual(strip(wizardsForActivity("spa", ["moh"])), ["engagedmoon", "friendsmoon", "moh", "offsite-outing"]);
  // The baked universe: the new tag reaches real baked rows.
  let tagged = 0;
  for (const d of sharedDestinations) for (const k of ["activities", "dining", "nightlife", "lodging"] as const)
    for (const row of (d as any)[k] as { wizards?: string[] }[]) if ((row.wizards ?? []).includes("honeymoon")) tagged++;
  assert.ok(tagged > 1000);
});
