// ingest-party-patch.test.ts — the INGEST path for ENRICHMENT patches.
//
// 1a99460 built the patch MECHANISM (party-venue-patches.ts +
// applyPartyVenuePatches) but nothing could write to it, so landing a patch
// meant hand-editing the flat file. This is the write path that makes the
// backfill lane automatable — above all 2B.2, the ~4,200-row URL/provenance
// backfill that currently sits at 47.
//
// A patch is an UPDATE, not an insert, so it validates differently from a new
// venue: it must NOT be required to carry a full row (a coordinates-only patch
// is legitimate), it MUST name a row that already exists, and it MUST change
// something. All three are the difference between a backfill that works and one
// that reports success while changing nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ingestResearched, type GateResult } from "./ingest-researched";
import type { ResearchedRow } from "../src/research-schema";
import { sharedDestinations } from "../src/index";

/** A real destination + a real curated activity on it — the patch target must
 *  resolve against the actual universe, so both are read from it. */
const TARGET_DEST = sharedDestinations.find((d) => d.activities.length > 0)!;
const TARGET_NAME = TARGET_DEST.activities[0].name;

function goodPatch(overrides: Record<string, unknown> = {}): ResearchedRow {
  return {
    dataset: "party-venue-patch",
    destinationId: TARGET_DEST.id,
    category: "activity",
    name: TARGET_NAME,
    lat: 44.9778,
    lng: -93.265,
    sourceUrl: "https://www.ingest-patch-fixture.test/",
    citations: ["https://www.ingest-patch-fixture.test/location"],
    ...overrides,
  } as ResearchedRow;
}

const PASS_GATE = (): GateResult => ({ ok: true, output: "stub gate: ok" });

function withTempPatchFile(run: (path: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "ingest-patch-"));
  const path = join(dir, "party-venue-patches.ts");
  writeFileSync(
    path,
    `import type { PartyVenuePatch } from "./party-venue-patches";\n` +
      `export const PARTY_VENUE_PATCHES: PartyVenuePatch[] = [];\n`,
  );
  try {
    run(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function readWrittenArray(path: string): Record<string, any>[] {
  const raw = readFileSync(path, "utf-8");
  const m = raw.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!m) throw new Error(`readWrittenArray: could not locate the array assignment in ${path}`);
  return JSON.parse(m[1]);
}

test("accepts a valid patch and appends it to the patches file", () => {
  withTempPatchFile((path) => {
    const res = ingestResearched([goodPatch()], { partyPatchFilePath: path, runGates: PASS_GATE });

    assert.equal(res.accepted, 1, res.reasons.join("; "));
    const [row] = readWrittenArray(path);
    assert.equal(row.destinationId, TARGET_DEST.id);
    assert.equal(row.category, "activity");
    assert.equal(row.name, TARGET_NAME);
    assert.equal(row.lat, 44.9778);
    assert.equal(row.sourceUrl, "https://www.ingest-patch-fixture.test/");
  });
});

test("does NOT require a full row — a coordinates-only patch is valid", () => {
  // A new venue must carry type + highlight (PARTY_VENUE_REQUIRED_BY_CATEGORY).
  // Requiring that of a patch would make the entire coordinate and URL backfill
  // impossible, since those patches carry neither.
  withTempPatchFile((path) => {
    const res = ingestResearched([goodPatch()], { partyPatchFilePath: path, runGates: PASS_GATE });
    assert.equal(res.accepted, 1, res.reasons.join("; "));
  });
});

test("REJECTS a patch whose target row does not exist", () => {
  withTempPatchFile((path) => {
    const res = ingestResearched([goodPatch({ name: "No Such Venue Anywhere" })], {
      partyPatchFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 0);
    assert.match(res.reasons.join(" "), /No Such Venue Anywhere/);
    assert.equal(readWrittenArray(path).length, 0);
  });
});

test("REJECTS a patch whose destination anchor does not exist", () => {
  withTempPatchFile((path) => {
    const res = ingestResearched([goodPatch({ destinationId: "no-such-destination-xyz" })], {
      partyPatchFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 0);
    assert.match(res.reasons.join(" "), /no-such-destination-xyz/);
  });
});

test("REJECTS a patch pointed at the wrong category rather than searching others", () => {
  withTempPatchFile((path) => {
    const res = ingestResearched([goodPatch({ category: "transport" })], {
      partyPatchFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 0);
    assert.equal(readWrittenArray(path).length, 0);
  });
});

test("REJECTS a patch that would change nothing", () => {
  // Key + provenance only. It would merge no fields, so it is a backfill row
  // that reports success and moves no data — the silent no-op this whole path
  // exists to prevent.
  withTempPatchFile((path) => {
    const res = ingestResearched(
      [
        {
          dataset: "party-venue-patch",
          destinationId: TARGET_DEST.id,
          category: "activity",
          name: TARGET_NAME,
          sourceUrl: "https://www.ingest-patch-fixture.test/",
          citations: ["https://www.ingest-patch-fixture.test/location"],
        } as unknown as ResearchedRow,
      ],
      { partyPatchFilePath: path, runGates: PASS_GATE },
    );

    assert.equal(res.accepted, 0);
    assert.match(res.reasons.join(" "), /no field|nothing|empty patch|payload/i);
  });
});

test("REJECTS a patch with no provenance, via the same honesty firewall", () => {
  withTempPatchFile((path) => {
    const noProv = goodPatch();
    delete (noProv as Record<string, unknown>).citations;

    const res = ingestResearched([noProv], { partyPatchFilePath: path, runGates: PASS_GATE });
    assert.equal(res.accepted, 0);
    assert.match(res.reasons.join(" "), /citation/i);
  });
});

test("REJECTS a patch setting a display-critical number to a fabricated zero", () => {
  withTempPatchFile((path) => {
    const res = ingestResearched([goodPatch({ pricePerPerson: [0, 0] })], {
      partyPatchFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 0, "a $0–0 band renders as a confident fabrication");
  });
});

test("skips a patch already present in the file, reporting it explicitly", () => {
  withTempPatchFile((path) => {
    ingestResearched([goodPatch()], { partyPatchFilePath: path, runGates: PASS_GATE });
    const res = ingestResearched([goodPatch({ lat: 1.23 })], {
      partyPatchFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 0);
    assert.equal(readWrittenArray(path).length, 1, "must not append a second patch for one row");
    assert.equal(res.skippedDuplicates.length, 1);
    assert.equal(res.skippedDuplicates[0].dataset, "party-venue-patch");
  });
});

test("dedups two patches for the same row within one batch", () => {
  withTempPatchFile((path) => {
    const res = ingestResearched([goodPatch(), goodPatch({ lat: 9.9 })], {
      partyPatchFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 1);
    assert.equal(readWrittenArray(path).length, 1);
    assert.equal(res.skippedDuplicates.length, 1);
  });
});

test("rolls the patches file back to its exact prior bytes when a gate fails", () => {
  withTempPatchFile((path) => {
    const before = readFileSync(path, "utf-8");
    const res = ingestResearched([goodPatch()], {
      partyPatchFilePath: path,
      runGates: () => ({ ok: false, output: "stub gate: forced failure", failedGate: "audit" }),
    });

    assert.equal(res.accepted, 0);
    assert.equal(res.acceptedRows.length, 0);
    assert.equal(readFileSync(path, "utf-8"), before);
  });
});

test("reports the patch in acceptedRows by reference", () => {
  withTempPatchFile((path) => {
    const row = goodPatch();
    const res = ingestResearched([row], { partyPatchFilePath: path, runGates: PASS_GATE });

    assert.equal(res.acceptedRows.length, 1);
    assert.equal(res.acceptedRows[0], row);
  });
});

test("a patch and a new venue can land in the same batch", () => {
  withTempPatchFile((patchPath) => {
    const dir = mkdtempSync(join(tmpdir(), "ingest-both-"));
    const expansionPath = join(dir, "party-venues-expansion.ts");
    writeFileSync(
      expansionPath,
      `import type { PartyVenueExpansionRow } from "./party-venues-expansion";\n` +
        `export const PARTY_VENUES_EXPANSION: PartyVenueExpansionRow[] = [];\n`,
    );
    try {
      const newVenue = {
        dataset: "party-venue",
        destinationId: TARGET_DEST.id,
        category: "activity",
        name: "Batch Fixture New Venue",
        type: "tour",
        duration: "2 hours",
        pricePerPerson: [40, 60],
        groupMin: 4,
        groupMax: 12,
        highlight: "Fixture venue for the mixed-batch test.",
        bestFor: "Mixed batch",
        brands: ["both"],
        sourceUrl: "https://www.batch-fixture-venue.test/",
        citations: ["https://www.batch-fixture-venue.test/about"],
      } as unknown as ResearchedRow;

      const res = ingestResearched([goodPatch(), newVenue], {
        partyPatchFilePath: patchPath,
        partyVenueFilePath: expansionPath,
        runGates: PASS_GATE,
      });

      assert.equal(res.accepted, 2, res.reasons.join("; "));
      assert.equal(readWrittenArray(patchPath).length, 1);
      assert.equal(readWrittenArray(expansionPath).length, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
