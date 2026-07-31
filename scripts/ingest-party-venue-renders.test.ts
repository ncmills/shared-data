// ingest-party-venue-renders.test.ts — the RENDER proof for the party-venue
// write path.
//
// WHY THIS EXISTS, AND WHY IT USES THE REAL FILE.
// This repo's recurring failure is not "the audit went red" — it is a row that
// passes every gate and reaches no user. Researched golf rows closed an audit
// gap while reaching no import, then reached the import while STILL reaching no
// page (38 of 999 courses). A green audit is not evidence of reach.
//
// So this test proves the WHOLE chain, on the real sanctioned file, in a fresh
// process: ingest → party-venues-expansion.ts → attachPartyVenues → bakeDestination
// → applyMohOverlay / applyBestmanOverlay → the object a site actually renders.
//
// The overlay is the half that fails SILENTLY: a row surfaces only if it is
// tagged for the wizard AND its `type` is in that site's allowlist
// (MOH_ACTIVITY_TYPES / BESTMAN_ACTIVITY_TYPES). The second condition dropped
// the New Orleans second line for nine days without a single failing gate.
//
// A fresh `tsx` process is mandatory: the assertions must observe the file as
// written to DISK, and ESM module caching would otherwise hand back the
// universe as it was at this process's first import (see task-15-report.md —
// dynamic import() cache-busting does NOT work under tsx's loader).
//
// The real file's exact prior bytes are restored in a `finally`, so the suite
// is idempotent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ingestResearched, DEFAULT_PARTY_VENUE_EXPANSION_PATH } from "./ingest-researched";
import type { ResearchedRow } from "../src/research-schema";
import { sharedDestinations } from "../src/index";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

/** A destination that both party brands present, so one row can prove both
 *  overlays. Read from the real universe rather than hard-coded. */
const TARGET = sharedDestinations.find(
  (d) => d.activities.length > 0 && d.presentation?.moh && d.presentation?.bestman,
)!;

const FIXTURE_NAME = "Ingest Render Proof Distillery Tour";

/** `distillery-tour` is in BOTH MOH_ACTIVITY_TYPES and BESTMAN_ACTIVITY_TYPES,
 *  and `brands: ["both"]` clears the tag filter — so if this row fails to
 *  render, the write path is broken, not the taxonomy. */
const RENDER_ROW: ResearchedRow = {
  dataset: "party-venue",
  destinationId: TARGET.id,
  category: "activity",
  name: FIXTURE_NAME,
  type: "distillery-tour",
  duration: "2 hours",
  pricePerPerson: [45, 65],
  groupMin: 4,
  groupMax: 14,
  highlight: "Render-proof fixture row written and removed by ingest-party-venue-renders.test.ts.",
  bestFor: "Proving the ingest→attach→bake→overlay chain reaches a rendered object",
  brands: ["both"],
  sourceUrl: "https://www.ingest-render-proof.test/",
  citations: ["https://www.ingest-render-proof.test/tours"],
} as ResearchedRow;

/**
 * In a FRESH process, read the real universe off disk and report how the
 * fixture row surfaces through each site's overlay.
 */
function observeRenderInFreshProcess(): {
  inUniverse: boolean;
  inMohOverlay: boolean;
  inBestmanOverlay: boolean;
  url: string | null;
  sourceUrl: string | null;
} {
  const script = `
    import { sharedDestinations } from ${JSON.stringify(join(REPO_ROOT, "src", "index.ts"))};
    import { applyMohOverlay, applyBestmanOverlay } from ${JSON.stringify(join(REPO_ROOT, "src", "destinations-overlay.ts"))};
    const dest = sharedDestinations.find((d) => d.id === ${JSON.stringify(TARGET.id)});
    const NAME = ${JSON.stringify(FIXTURE_NAME)};
    const hit = dest.activities.find((a) => a.name === NAME) ?? null;
    const moh = applyMohOverlay(dest).activities.some((a) => a.name === NAME);
    const bestman = applyBestmanOverlay(dest).activities.some((a) => a.name === NAME);
    console.log(JSON.stringify({
      inUniverse: !!hit,
      inMohOverlay: moh,
      inBestmanOverlay: bestman,
      url: hit?.url ?? null,
      sourceUrl: hit?.sourceUrl ?? null,
    }));
  `;
  const out = execFileSync("npx", ["tsx", "--eval", script], { cwd: REPO_ROOT, encoding: "utf-8" });
  return JSON.parse(out.trim().split("\n").pop()!);
}

/**
 * Files the run rewrites and must restore.
 *
 * `docs/` is NOT incidental. The audit gate REGENERATES the coverage matrix and
 * audit report as a side effect, so a run that restores only the data file
 * leaves the matrix asserting a party count that includes the fixture row —
 * committed numbers describing a universe that no longer exists. Caught exactly
 * that way: bestman read 5138 while the restored file held 5137.
 */
const TOUCHED_FILES = [
  DEFAULT_PARTY_VENUE_EXPANSION_PATH,
  join(REPO_ROOT, "docs", "coverage-matrix.md"),
  join(REPO_ROOT, "docs", "audit-report.json"),
];

test("an ingested party row RENDERS through both site overlays, not just the audit", () => {
  const before = TOUCHED_FILES.map((p) => [p, readFileSync(p, "utf-8")] as const);
  try {
    // Real gates — verify-universe + check-brand-rules + audit, same as an
    // unattended monthly run.
    const res = ingestResearched([RENDER_ROW]);
    assert.equal(res.accepted, 1, `ingest rejected the row: ${res.reasons.join("; ")}`);

    const seen = observeRenderInFreshProcess();

    assert.equal(seen.inUniverse, true, "row did not attach to its destination in sharedDestinations");
    assert.equal(seen.inMohOverlay, true, "row attached but MOH's overlay dropped it — it would render nowhere");
    assert.equal(seen.inBestmanOverlay, true, "row attached but Best Man HQ's overlay dropped it");
    assert.equal(seen.url, "https://www.ingest-render-proof.test/", "primary source lost before render");
    assert.equal(seen.sourceUrl, "https://www.ingest-render-proof.test/", "provenance lost before render");
  } finally {
    for (const [path, content] of before) writeFileSync(path, content);
  }
});
