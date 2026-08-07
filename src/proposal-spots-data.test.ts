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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2026-08-07: the 123-row batch, and the three things that were silently wrong.
 *
 * Each test below corresponds to a defect that shipped green. They are written
 * to fail on the OLD behaviour, not merely to describe the new one.
 */

test("the capstone exclusions actually bind to rows that exist", () => {
  const excluded = PROPOSAL_SPOTS_DATA.filter((s) => s.capstoneEligible === false);
  assert.equal(
    excluded.length,
    3,
    "expected exactly the three hand-read exclusions (McWay, Portland Head Light, Breakneck Ridge)",
  );
  // An id typo makes an exclusion a no-op that still reads as enforced. This is
  // the failure the ingest guard caught twice while this batch was landing.
  for (const s of excluded) {
    assert.ok(
      s.ineligibleReason && s.ineligibleReason.length > 40,
      `${s.id}: an exclusion without a quoted reason is indistinguishable from a typo`,
    );
  }
  assert.deepEqual(
    excluded.map((s) => s.id).sort(),
    [
      "carmel-ca-mcway-falls-overlook",
      "hudson-valley-ny-breakneck-ridge",
      "portland-me-portland-head-light",
    ],
  );
});

test("a blocker is NOT an exclusion", () => {
  // The plan this batch was landed under said to exclude any spot with a
  // non-null `blocker`. Applied literally that removed 80 of 124 rows, because
  // the field also holds "no selfie sticks" and "no overnight parking".
  // This test pins the distinction so nobody re-derives the shortcut.
  const withBlocker = PROPOSAL_SPOTS_DATA.filter((s) => s.blocker);
  assert.ok(
    withBlocker.length > 50,
    `expected the blocker field to be common (got ${withBlocker.length})`,
  );
  const blockedAndEligible = withBlocker.filter((s) => s.capstoneEligible !== false);
  assert.ok(
    blockedAndEligible.length > 50,
    "most rows carrying blocker prose must remain capstone-eligible — " +
      `only ${blockedAndEligible.length} did, which means the two concepts have been conflated again`,
  );
});

test("CAPSTONE_ELIGIBLE_SPOTS excludes exactly the ineligible rows", async () => {
  const { CAPSTONE_ELIGIBLE_SPOTS } = await import("./proposal-spots-data");
  assert.equal(CAPSTONE_ELIGIBLE_SPOTS.length, PROPOSAL_SPOTS_DATA.length - 3);
  assert.ok(
    !CAPSTONE_ELIGIBLE_SPOTS.some((s) => s.id === "carmel-ca-mcway-falls-overlook"),
    "McWay Falls — where the park says elopements and filming will not be permitted — " +
      "must never be selectable as the place the question gets asked",
  );
});

test("validateProposalSpot rejects an exclusion with no stated reason", () => {
  const base = PROPOSAL_SPOTS_DATA.find((s) => s.capstoneEligible !== false)!;
  const bad = validateProposalSpot({ ...base, capstoneEligible: false });
  assert.equal(bad.ok, false);
  assert.ok(
    !bad.ok && bad.reasons.some((r) => r.includes("ineligibleReason")),
    "an unexplained exclusion must be rejected, not silently honoured",
  );
  // ...and the same row WITH a reason still passes, so the guard is falsifiable
  // in both directions rather than just strict.
  const good = validateProposalSpot({
    ...base,
    capstoneEligible: false,
    ineligibleReason: "The authority states the moment is not permitted here.",
  });
  assert.equal(good.ok, true, "a properly explained exclusion must still validate");
});
