import { test } from "node:test";
import assert from "node:assert/strict";
import { PROPOSAL_SPOTS_DATA } from "./proposal-spots-data";
import {
  validateProposalSpot,
  downgradeIfUncorroborated,
  PROPOSAL_TYPE_TO_CANONICAL,
} from "./proposal-spots";
import { sharedDestinations } from "./index";

/**
 * These tests exist because the rule they enforce was previously a COMMENT.
 *
 * engagedmoon's own copy of this dataset documented `destinationId` as an
 * "EXPLICIT anchor into the shared destination universe — never inferred", and
 * nothing anywhere checked it. All ten anchors happened to resolve, so the rule
 * looked enforced for a week while being unfalsifiable. A documented invariant
 * with no test grades nothing and fails nothing.
 */

test("every destinationId resolves to a real canonical destination", () => {
  const ids = new Set(sharedDestinations.map((d) => d.id));
  const missing = PROPOSAL_SPOTS_DATA.filter((s) => !ids.has(s.destinationId));
  assert.deepEqual(
    missing.map((s) => `${s.id} -> ${s.destinationId}`),
    [],
    "a proposal spot is anchored to a destination that does not exist",
  );
});

test("every row passes the tier firewall", () => {
  const failures: string[] = [];
  for (const spot of PROPOSAL_SPOTS_DATA) {
    const v = validateProposalSpot(spot);
    if (!v.ok) failures.push(`${spot.id}: ${v.reasons.join("; ")}`);
  }
  assert.deepEqual(failures, []);
});

/**
 * The regression that caught a real mistake on 2026-08-06.
 *
 * The first draft of the USFS rows reused the NPS "treated the same" quote,
 * because both agencies are bound by the same section of the EXPLORE Act. The
 * Forest Service does not publish that sentence. `downgradeIfUncorroborated`
 * rejected the rows, which is the only reason the file does not ship an
 * agency-level assumption dressed as a quotation.
 */
test("no green row survives without its quote corroborating it", () => {
  const downgraded = PROPOSAL_SPOTS_DATA.filter(
    (s) => downgradeIfUncorroborated(s).downgraded,
  );
  assert.deepEqual(
    downgraded.map((s) => s.id),
    [],
    "green row whose verbatim never mentions a proposal and states no universal rule",
  );
});

test("spot ids are unique and backup refs resolve", () => {
  const ids = PROPOSAL_SPOTS_DATA.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate spot id");

  const known = new Set(ids);
  const dangling = PROPOSAL_SPOTS_DATA.filter(
    (s) => s.backup && !known.has(s.backup),
  );
  assert.deepEqual(dangling.map((s) => `${s.id} -> ${s.backup}`), []);
});

test("every type is routable into the sibling planners", () => {
  const unknown = PROPOSAL_SPOTS_DATA.filter(
    (s) => !(s.type in PROPOSAL_TYPE_TO_CANONICAL),
  );
  assert.deepEqual(unknown.map((s) => `${s.id}: ${s.type}`), []);
});

/**
 * A red row's whole justification is that "check locally" is ACTIONABLE. A red
 * row without a real contact is just a shrug with extra steps.
 */
test("red rows name an authority contact", () => {
  const bad = PROPOSAL_SPOTS_DATA.filter(
    (s) => s.tier === "red" && !s.permit.authorityContact?.trim(),
  );
  assert.deepEqual(bad.map((s) => s.id), []);
});
