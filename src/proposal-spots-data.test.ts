import { test } from "node:test";
import assert from "node:assert/strict";
import { PROPOSAL_SPOTS_DATA } from "./proposal-spots-data";
import {
  validateProposalSpot,
  downgradeIfUncorroborated,
  PROPOSAL_TYPE_TO_CANONICAL,
} from "./proposal-spots";
import { sharedDestinations } from "./index";
import SOURCES from "../data/proposal-spot-research/coordinate-sources.json" with { type: "json" };
import COORDINATES from "../data/proposal-spot-research/coordinates.json" with { type: "json" };

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

test("coordinates are complete pairs, in range, and only on matched rows", async () => {
  const { SPOTS_WITH_COORDINATES } = await import("./proposal-spots-data");
  // Derived from the overlay itself, not hand-counted, so a future batch never
  // requires editing a number here. `applyCoordinates` throws on any overlay
  // key that matches no spot, so the mapping is 1:1: every row in
  // `coordinates.json` lands on exactly one spot's lat/lng. This still fails
  // if a coordinate silently disappears — the two counts would then diverge.
  assert.equal(
    SPOTS_WITH_COORDINATES.length,
    Object.keys(COORDINATES.coordinates).length,
    "the 9 migrated from engagedmoon + 16 sourced in Batch 1 (2026-08-07, " +
      "after fix round 1 removed bozeman-mt-lake-butte-overlook and fix round 2 " +
      "removed park-city-ut-jordanelle-hailstone — both were the containing " +
      "area's coordinate on a row that names a specific point)",
  );
  for (const s of SPOTS_WITH_COORDINATES) {
    // A half-pair is the dangerous shape: truthy `lat` reads as "we know where
    // this is", and the solar call then gets NaN for the other half.
    assert.equal(typeof s.lat, "number", `${s.id}: lat`);
    assert.equal(typeof s.lng, "number", `${s.id}: lng`);
    assert.ok(s.lat! >= -90 && s.lat! <= 90, `${s.id}: lat out of range`);
    assert.ok(s.lng! >= -180 && s.lng! <= 180, `${s.id}: lng out of range`);
  }
  // The five engagedmoon rows with no same-place row here must NOT have been
  // attached to a neighbour. Sand Harbor is the sharp one: it is across Lake
  // Tahoe AND across a state line from Emerald Bay, and both are "lake-tahoe".
  const emerald = SPOTS_WITH_COORDINATES.find((s) => s.id === "lake-tahoe-ca-emerald-bay");
  assert.ok(emerald, "Emerald Bay should carry its own coordinate");
  assert.equal(emerald!.lat, 38.9541, "Emerald Bay must not have taken Sand Harbor's 39.1979");
});

test("validateProposalSpot rejects half a coordinate pair", () => {
  const base = PROPOSAL_SPOTS_DATA[0];
  const half = validateProposalSpot({ ...base, lat: 40.7, lng: undefined });
  assert.equal(half.ok, false);
  assert.ok(!half.ok && half.reasons.some((r) => r.includes("lat/lng")));
  // Falsifiable the other way: a complete pair passes, and so does neither.
  assert.equal(validateProposalSpot({ ...base, lat: 40.7, lng: -73.9 }).ok, true);
  assert.equal(validateProposalSpot({ ...base, lat: undefined, lng: undefined }).ok, true);
});

test("the rows are reachable from the package root", async () => {
  // #25 exported nothing and engagedmoon forked the dataset. #27 exported the
  // schema and left the rows unreachable, so the fork could not be undone. The
  // rule both times: a module nothing can import is a module nothing can be
  // checked against. This asserts the package ROOT, not the file.
  const root = await import("./index");
  const data = (root as Record<string, unknown>).PROPOSAL_SPOTS_DATA;
  assert.ok(Array.isArray(data), "PROPOSAL_SPOTS_DATA must resolve from the package root");
  assert.equal((data as unknown[]).length, PROPOSAL_SPOTS_DATA.length);
  for (const name of ["CAPSTONE_ELIGIBLE_SPOTS", "SPOTS_WITH_COORDINATES"]) {
    assert.ok(
      Array.isArray((root as Record<string, unknown>)[name]),
      `${name} must resolve from the package root — consumers gate on it`,
    );
  }
});

/**
 * Bounding boxes are deliberately GENEROUS — a degree of slop on each side.
 * The failure being caught is "this pair is in the wrong state or the wrong
 * hemisphere", not "this pair is 400m from the overlook". A tight box would
 * fail correct coordinates for a spot near a state line (Lake Tahoe spans
 * two), and a guard that fails correct data gets switched off.
 */
const STATE_BOUNDS: Record<string, [number, number, number, number]> = {
  // state: [minLat, maxLat, minLng, maxLng]
  AZ: [30.4, 38.0, -116.0, -108.0],
  CA: [31.5, 42.9, -125.5, -113.5],
  CO: [35.9, 42.0, -110.0, -101.0],
  // DC is not a state and cannot be given a state's slop. Until 2026-08-07 this
  // read [37.8, 40.0, -78.5, -76.0] — 128× the District's actual area, against
  // 1.1–2.4× for every other row. It reached into four states, and it is why
  // Hawksbill Summit's STATE_OVERRIDE was inert: Shenandoah, 60 miles into
  // Virginia, sat comfortably inside "DC". A box that admits half the
  // mid-Atlantic checks nothing. Anything genuinely outside the District needs
  // an explicit STATE_OVERRIDE row, which is the mechanism, not a workaround.
  DC: [38.75, 39.05, -77.2, -76.85],
  FL: [23.8, 32.0, -88.5, -79.0],
  GA: [29.5, 36.0, -86.5, -80.0],
  HI: [17.8, 23.5, -161.5, -153.5],
  IL: [36.0, 43.5, -92.5, -86.5],
  MA: [40.7, 43.9, -74.5, -69.0],
  ME: [42.0, 48.5, -72.0, -66.0],
  MT: [43.5, 49.9, -117.0, -103.0],
  NC: [32.5, 37.4, -85.5, -74.5],
  NV: [34.0, 42.9, -121.0, -113.0],
  NY: [39.5, 46.0, -80.8, -71.0],
  OR: [41.0, 47.3, -125.5, -115.5],
  SC: [31.0, 36.2, -84.5, -77.5],
  UT: [36.0, 42.9, -115.0, -108.0],
  VA: [36.4, 39.6, -83.8, -75.1],
  WA: [44.5, 49.9, -125.5, -116.0],
  WY: [40.0, 45.9, -112.0, -103.0],
};

/**
 * Spots anchored to a destination in a DIFFERENT state. The catalog files a
 * spot under its nearest plannable city, which is correct for planning and
 * wrong for a state check derived from the id. Explicit, never inferred —
 * inferring it would defeat the guard.
 *
 * 2026-08-07: a reviewer found both entries were PROVABLY INERT — deleting them
 * changed nothing, because each spot already fell inside its id-derived box.
 * Dead code that reads as rigor. It was kept rather than deleted, for two
 * reasons, and both had to be made true rather than asserted:
 *
 *   1. Hawksbill is now load-bearing. It was only inert because the DC box was
 *      128× the District; with DC tightened above, deleting this row FAILS the
 *      state test. See the falsifiability test below, which proves it.
 *   2. Artist Point is still inert on today's numbers — Montana's box is
 *      generous enough to reach Yellowstone's Wyoming side, which is 0.3° over
 *      the line. It stays because it states a FACT about the data (this spot is
 *      in Wyoming) that the id actively contradicts, and because the check it
 *      is inert against is one a tighter MT box would restore. An override
 *      recording something true is worth its two lines; what is not worth
 *      keeping is one nothing can check, which is what the test below fixes.
 */
const STATE_OVERRIDE: Record<string, string> = {
  "washington-dc-hawksbill-summit": "VA",
  "bozeman-mt-artist-point": "WY",
};

/**
 * The failure mode an override has: it is keyed by spot id, and a typo'd or
 * stale key is a silent no-op that still reads as a deliberate exception. That
 * is the same shape as the capstone-exclusion id typo this suite already pins.
 */
test("every STATE_OVERRIDE key resolves to a real spot that carries coordinates", () => {
  const withCoordIds = new Set(
    PROPOSAL_SPOTS_DATA.filter(
      (s) => typeof s.lat === "number" && typeof s.lng === "number",
    ).map((s) => s.id),
  );
  const dangling = Object.keys(STATE_OVERRIDE).filter((id) => !withCoordIds.has(id));
  assert.deepEqual(
    dangling,
    [],
    "a STATE_OVERRIDE for a spot that does not exist (or has no coordinate) " +
      "silently exempts nothing while looking like a considered exception",
  );
  for (const state of Object.values(STATE_OVERRIDE)) {
    assert.ok(STATE_BOUNDS[state], `STATE_OVERRIDE points at unknown state ${state}`);
  }
});

/**
 * ...and that the DC row is no longer decorative. Without the override,
 * Hawksbill Summit must fall OUTSIDE the DC box — otherwise the box is loose
 * again and the override has quietly gone back to doing nothing.
 */
test("the Hawksbill override is load-bearing, not decorative", () => {
  const hawksbill = PROPOSAL_SPOTS_DATA.find(
    (s) => s.id === "washington-dc-hawksbill-summit",
  );
  assert.ok(hawksbill?.lat != null && hawksbill.lng != null, "Hawksbill lost its coordinate");
  const [minLat, maxLat, minLng, maxLng] = STATE_BOUNDS.DC;
  const insideDC =
    hawksbill!.lat! >= minLat &&
    hawksbill!.lat! <= maxLat &&
    hawksbill!.lng! >= minLng &&
    hawksbill!.lng! <= maxLng;
  assert.equal(
    insideDC,
    false,
    "Shenandoah National Park is 60 miles into Virginia. If it passes as DC, " +
      "the DC box has been widened again and the state check is not checking.",
  );
  // And with the override applied it must pass, so the fix is not just strictness.
  const [vMinLat, vMaxLat, vMinLng, vMaxLng] = STATE_BOUNDS.VA;
  assert.ok(
    hawksbill!.lat! >= vMinLat &&
      hawksbill!.lat! <= vMaxLat &&
      hawksbill!.lng! >= vMinLng &&
      hawksbill!.lng! <= vMaxLng,
    "Hawksbill must sit inside VA once the override routes it there",
  );
});

const withCoords = PROPOSAL_SPOTS_DATA.filter(
  (s) => typeof s.lat === "number" && typeof s.lng === "number",
);

test("every coordinate sits inside its destination's state", () => {
  const wrong: string[] = [];
  for (const s of withCoords) {
    const state = STATE_OVERRIDE[s.id] ?? s.destinationId.split("-").pop()!.toUpperCase();
    const box = STATE_BOUNDS[state];
    // An unknown state is a gap in the table, not a pass. Fail loudly so the
    // table gets extended rather than silently skipping the check.
    if (!box) {
      wrong.push(`${s.id}: no bounding box for state ${state}`);
      continue;
    }
    const [minLat, maxLat, minLng, maxLng] = box;
    if (s.lat! < minLat || s.lat! > maxLat || s.lng! < minLng || s.lng! > maxLng) {
      wrong.push(`${s.id}: [${s.lat}, ${s.lng}] is outside ${state}`);
    }
  }
  assert.deepEqual(wrong, [], "a coordinate is outside its destination's state");
});

/**
 * ⚠️ WHAT THIS TEST DOES NOT DO. Read this before trusting it.
 *
 * It checks the SHAPE of the recorded source, not its truth. A source that is a
 * well-formed https:// URL passes here even if that page publishes no
 * coordinate at all, publishes a different one, or is about a different place.
 * Nothing automated can close that gap — it needs a human to open the page.
 *
 * That is not hypothetical. It is exactly what happened, twice, in one batch:
 *
 *   - park-city-ut-jordanelle-hailstone recorded a Utah State Parks URL and the
 *     claim that the page "states GPS coordinates ... directly". It does not.
 *     The page carries Google Maps links and a weather-widget lat/lng ~490m
 *     from the pair we shipped. This test, as it stood AND as it stands now,
 *     passed it.
 *   - bozeman-mt-lake-butte-overlook recorded a real GNIS URL for a real
 *     record — of the mountain, not the roadside overlook the row names.
 *
 * Both were caught by reading the cited page, not by running the suite.
 *
 * So the value here is narrow and specific: it stops the source field from
 * becoming free text. Before 2026-08-07 it asserted only "non-empty", which
 * would have accepted "checked", "TODO", or a period. Now the field must be
 * either an https:// URL or the exact literal `legacy-production`, so an
 * unsourced pair cannot be waved through with a word. The URL still has to be
 * opened by a person.
 */
test("every coordinate has a recorded source, in a form that can be opened", () => {
  const sources = SOURCES.sources as Record<string, string>;

  const unsourced = withCoords.filter((s) => !sources[s.id]).map((s) => s.id);
  assert.deepEqual(
    unsourced,
    [],
    "a coordinate with no recorded source is indistinguishable from a guess",
  );

  // A source is either a URL someone can open, or the one literal that marks
  // the nine pairs migrated from engagedmoon whose original URL was never
  // recorded. Anything else is prose standing in for provenance.
  const malformed = withCoords
    .map((s) => [s.id, sources[s.id]] as const)
    .filter(([, src]) => src !== "legacy-production" && !src.startsWith("https://"))
    .map(([id, src]) => `${id}: ${JSON.stringify(src.slice(0, 60))}`);
  assert.deepEqual(
    malformed,
    [],
    "a source must be an https:// URL or the literal 'legacy-production'",
  );

  // Falsifiable: the rule must reject the shapes it exists to reject, or it is
  // only ever agreeing with data that already passes.
  const shapeOk = (src: string) =>
    src === "legacy-production" || src.startsWith("https://");
  for (const bad of ["", " ", "checked", "TODO", "GNIS", "legacy production", "http://x.test"]) {
    assert.equal(shapeOk(bad), false, `${JSON.stringify(bad)} must not pass as a source`);
  }
  assert.equal(shapeOk("legacy-production"), true);
  assert.equal(shapeOk("https://example.test/page (notes)"), true);
});

/**
 * The other direction of the check above. That test proves every coordinate
 * has a source; it says nothing about a source with no coordinate. A pair
 * removed from `coordinates.json` (a bad fix round, like the two removed
 * 2026-08-07) without also removing its `coordinate-sources.json` entry would
 * leave an orphaned source sitting there looking like coverage for a
 * coordinate that no longer exists.
 */
test("every recorded source resolves to a coordinate that still exists", () => {
  const sources = SOURCES.sources as Record<string, string>;
  const coords = COORDINATES.coordinates as Record<string, number[]>;
  const orphaned = Object.keys(sources).filter((id) => !(id in coords));
  assert.deepEqual(
    orphaned,
    [],
    "a source entry with no matching coordinate is left-behind provenance for a pair that was removed",
  );
});

test("no coordinate is recorded for a capstone-ineligible spot", () => {
  const bad = withCoords.filter((s) => s.capstoneEligible === false).map((s) => s.id);
  assert.deepEqual(bad, [], "a spot the authority excludes must not carry a coordinate");
});
