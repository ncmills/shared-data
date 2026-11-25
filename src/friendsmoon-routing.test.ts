import { test } from "node:test";
import assert from "node:assert/strict";

import { sharedDestinations } from "./index";
import {
  PARTY_LOCKED_ACTIVITY_TYPES,
  isFriendsmoonType,
  wizardsForActivity,
} from "./tags";
import { FRIENDSMOON_ACTIVITY_TYPES } from "./destinations-overlay";

/**
 * These pin the 2026-08-06 fix: Friendsmoon used to route off
 * `audiences.includes("corporate")` and was therefore a byte-identical clone of
 * offsite-outing (4472 rows each, 0 either way). See PARTY_LOCKED_ACTIVITY_TYPES.
 */

type Row = { wizards?: string[]; type?: string; vibe?: string };

function rows(cat: "activities" | "dining" | "nightlife"): Row[] {
  const out: Row[] = [];
  for (const d of sharedDestinations as unknown as Record<string, Row[]>[]) {
    for (const r of (d[cat] as Row[]) ?? []) out.push(r);
  }
  return out;
}

const has = (r: Row, w: string) => !!r.wizards?.includes(w);

test("Friendsmoon is not a clone of the corporate wizard", () => {
  const all = [...rows("activities"), ...rows("dining"), ...rows("nightlife")];
  const fmOnly = all.filter((r) => has(r, "friendsmoon") && !has(r, "offsite-outing"));
  // The regression this guards: fmOnly === 0 means Friendsmoon has collapsed
  // back onto the corporate audience and is showing an offsite catalog.
  assert.ok(
    fmOnly.length > 0,
    "Friendsmoon has no rows of its own — it has collapsed back onto offsite-outing's corporate set",
  );
});

test("the leisure types a friends trip is actually for reach Friendsmoon", () => {
  // Every one of these was invisible under corporate routing.
  for (const t of [
    "pool-party",
    "casino",
    "cigar-bar",
    "poker-night",
    "brunch-crawl",
    "drag-brunch",
    "silent-disco",
  ]) {
    assert.ok(isFriendsmoonType(t), `${t} should reach Friendsmoon`);
    assert.ok(FRIENDSMOON_ACTIVITY_TYPES.has(t), `${t} missing from the overlay allowlist`);
  }
});

test("brand-locked types never reach Friendsmoon", () => {
  for (const t of PARTY_LOCKED_ACTIVITY_TYPES) {
    assert.ok(!isFriendsmoonType(t), `${t} is party-locked and must not reach Friendsmoon`);
    assert.ok(!FRIENDSMOON_ACTIVITY_TYPES.has(t), `${t} leaked into the overlay allowlist`);
  }
  const leaked = rows("activities").filter(
    (r) => has(r, "friendsmoon") && PARTY_LOCKED_ACTIVITY_TYPES.has(r.type ?? ""),
  );
  assert.equal(leaked.length, 0, "party-locked rows are tagged friendsmoon");
});

test("unhinged nightlife reaches Friendsmoon", () => {
  const unhinged = rows("nightlife").filter((r) => r.vibe === "unhinged");
  assert.ok(unhinged.length > 0, "no unhinged rows in the universe — fixture drift");
  const reached = unhinged.filter((r) => has(r, "friendsmoon"));
  assert.equal(
    reached.length,
    unhinged.length,
    `${unhinged.length - reached.length} unhinged rows invisible to Friendsmoon`,
  );
});

test("golf crosses to Friendsmoon but still never to MOH", () => {
  // Nick's call, 2026-08-06: a friends long weekend can include a round.
  const w = wizardsForActivity("golf", ["both"]);
  assert.ok(w.includes("friendsmoon"), "golf should reach Friendsmoon");
  assert.ok(!w.includes("moh"), "the MOH golf block must be untouched");
});

test("Engagedmoon deliberately keeps the conservative signal", () => {
  // A proposal trip is not a friends trip. Phase 4 gives it a real model; until
  // then it must NOT inherit Friendsmoon's leisure widening.
  const nl = rows("nightlife").filter((r) => r.vibe === "unhinged");
  const em = nl.filter((r) => has(r, "engagedmoon"));
  assert.equal(em.length, 0, "unhinged nightlife leaked to Engagedmoon");
});

test("every activity type in the universe is explicitly classified", () => {
  // The silent-drop guard. BESTMAN_ACTIVITY_TYPES shipped this bug twice: a row
  // tagged for the wizard whose type nobody added to the allowlist renders
  // nowhere. A new type must fail HERE, loudly, rather than vanish.
  const universe = new Set(rows("activities").map((r) => r.type ?? ""));
  const unclassified = [...universe].filter(
    (t) => !PARTY_LOCKED_ACTIVITY_TYPES.has(t) && !FRIENDSMOON_ACTIVITY_TYPES.has(t),
  );
  assert.deepEqual(
    unclassified,
    [],
    `activity types reach no Friendsmoon decision: ${unclassified.join(", ")}`,
  );
});
