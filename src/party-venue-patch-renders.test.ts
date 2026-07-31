// party-venue-patch-renders.test.ts — the RENDER proof for the ENRICHMENT path.
//
// The patch mechanism only has value if a patched field survives all the way to
// the object a site renders. `omitTags` in the overlay strips a fixed list of
// tag fields; nothing guarantees a NEW data field (lat/lng, sourceUrl) is on the
// keep side of that filter, and a coordinate that reaches no consumer buys
// exactly nothing — it just makes the audit look fuller.
//
// So this drives the real chain on the real file in a fresh process:
// party-venue-patches.ts → applyPartyVenuePatches → bakeDestination →
// applyMohOverlay → the rendered object. ESM caching would otherwise hand back
// the universe as of this process's first import, so the observation MUST come
// from a separate `tsx` run.
//
// The real file's exact prior bytes are restored in a `finally`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sharedDestinations } from "./index";
import { MOH_ACTIVITY_TYPES } from "./destinations-overlay";
import type { PartyVenuePatch } from "./party-venue-patches";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const PATCHES_PATH = join(HERE, "party-venue-patches.ts");

/** A real curated activity that ALREADY renders on MOH — so if the patched
 *  field goes missing, the patch path is at fault, not the taxonomy. */
const TARGET = (() => {
  for (const d of sharedDestinations) {
    for (const a of d.activities) {
      if (a.wizards?.includes("moh") && MOH_ACTIVITY_TYPES.has(a.type)) return { dest: d, activity: a };
    }
  }
  throw new Error("fixture: no MOH-rendering activity found in the universe");
})();

const PATCH: PartyVenuePatch = {
  destinationId: TARGET.dest.id,
  category: "activity",
  name: TARGET.activity.name,
  lat: 44.9778,
  lng: -93.265,
  sourceUrl: "https://www.patch-render-proof.test/",
  citations: ["https://www.patch-render-proof.test/location"],
};

/** Rewrite the real patches file, preserving its header byte-for-byte. */
function writePatches(raw: string, patches: PartyVenuePatch[]): string {
  const m = raw.match(/^([\s\S]*export const \w+\s*:\s*[^=\n]+=\s*)(\[[\s\S]*\])(;?\s*)$/);
  if (!m) throw new Error("could not locate the array export in party-venue-patches.ts");
  return m[1] + JSON.stringify(patches) + (m[3] ?? ";\n");
}

function observeInFreshProcess(): { lat: number | null; sourceUrl: string | null; rendered: boolean } {
  const script = `
    import { sharedDestinations } from ${JSON.stringify(join(HERE, "index.ts"))};
    import { applyMohOverlay } from ${JSON.stringify(join(HERE, "destinations-overlay.ts"))};
    const d = sharedDestinations.find((x) => x.id === ${JSON.stringify(TARGET.dest.id)});
    const NAME = ${JSON.stringify(TARGET.activity.name)};
    const shown = applyMohOverlay(d).activities.find((a) => a.name === NAME) ?? null;
    console.log(JSON.stringify({
      lat: shown?.lat ?? null,
      sourceUrl: shown?.sourceUrl ?? null,
      rendered: !!shown,
    }));
  `;
  const out = execFileSync("npx", ["tsx", "--eval", script], { cwd: REPO_ROOT, encoding: "utf-8" });
  return JSON.parse(out.trim().split("\n").pop()!);
}

/**
 * The END-TO-END proof: a patch driven through the REAL ingest gate (real
 * verify + brand + audit) must reach the rendered object. The test above proves
 * the mechanism given a patch already in the file; this proves the path a
 * backfill agent will actually take.
 *
 * `docs/` is restored too — the audit gate regenerates the coverage matrix as a
 * side effect, and restoring only the data file leaves committed numbers
 * describing a universe that no longer exists.
 */
test("a patch INGESTED through the real gate renders", async () => {
  const { ingestResearched } = await import("../scripts/ingest-researched");
  const touched = [
    PATCHES_PATH,
    join(REPO_ROOT, "docs", "coverage-matrix.md"),
    join(REPO_ROOT, "docs", "audit-report.json"),
  ];
  const before = touched.map((p) => [p, readFileSync(p, "utf-8")] as const);

  try {
    const res = ingestResearched([
      {
        dataset: "party-venue-patch",
        destinationId: TARGET.dest.id,
        category: "activity",
        name: TARGET.activity.name,
        lat: 44.9778,
        lng: -93.265,
        sourceUrl: "https://www.patch-ingest-e2e.test/",
        citations: ["https://www.patch-ingest-e2e.test/location"],
      } as never,
    ]);
    assert.equal(res.accepted, 1, `ingest rejected the patch: ${res.reasons.join("; ")}`);

    const seen = observeInFreshProcess();
    assert.equal(seen.rendered, true, "target row stopped rendering after the patch landed");
    assert.equal(seen.lat, 44.9778, "ingested patch did not reach the rendered object");
    assert.equal(seen.sourceUrl, "https://www.patch-ingest-e2e.test/", "provenance lost before render");
  } finally {
    for (const [p, content] of before) writeFileSync(p, content);
  }
});

test("a patched coordinate RENDERS through the MOH overlay", () => {
  const before = readFileSync(PATCHES_PATH, "utf-8");
  try {
    writeFileSync(PATCHES_PATH, writePatches(before, [PATCH]));

    const seen = observeInFreshProcess();

    assert.equal(seen.rendered, true, "the target row stopped rendering at all — patch broke the row");
    assert.equal(seen.lat, 44.9778, "patched coordinate did not survive to the rendered object");
    assert.equal(
      seen.sourceUrl,
      "https://www.patch-render-proof.test/",
      "provenance for the patched value did not reach the consumer",
    );
  } finally {
    writeFileSync(PATCHES_PATH, before);
  }
});
