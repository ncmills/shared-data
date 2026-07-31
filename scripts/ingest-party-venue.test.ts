// ingest-party-venue.test.ts — the PARTY-VENUE write path of the ingest gate.
//
// Until 2026-07-31 a validated, URL-verified party row was REJECTED here with a
// message naming the hand-edit route, because party venues nest inside
// destination objects across ~1.7MB of hand-authored TS that does not round-trip
// through JSON.parse. The write path resolves that the way golf already did:
// rows land in the flat sanctioned `src/party-venues-expansion.ts` carrying an
// explicit `destinationId`, and `attachPartyVenues()` merges them into the
// destination at assembly time (see src/party-venues-attach.test.ts).
//
// These tests use a DI'd temp expansion file + a stub gate runner, so they
// exercise the real validate → convert → dedup → append → gate → rollback flow
// without spawning the multi-second real gates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ingestResearched, type GateResult } from "./ingest-researched";
import type { ResearchedRow } from "../src/research-schema";
import { sharedDestinations } from "../src/index";

/** A real destination id from the live universe — the anchor must resolve
 *  against the actual catalog, so this is read from it rather than invented. */
const REAL_DEST = sharedDestinations[0];

/** A complete, real-shaped party-venue activity row. The domain is
 *  fixture-only: not on the placeholder-host denylist, not meant to resolve. */
function goodPartyRow(overrides: Record<string, unknown> = {}): ResearchedRow {
  return {
    dataset: "party-venue",
    destinationId: REAL_DEST.id,
    category: "activity",
    name: "Ingest Fixture Distillery Tour",
    type: "tour",
    duration: "2 hours",
    pricePerPerson: [45, 65],
    groupMin: 4,
    groupMax: 14,
    highlight: "Fixture distillery tour used only by ingest-party-venue.test.ts.",
    bestFor: "Crews who want a daytime anchor",
    brands: ["both"],
    sourceUrl: "https://www.ingest-fixture-distillery.test/",
    citations: ["https://www.ingest-fixture-distillery.test/tours"],
    ...overrides,
  } as ResearchedRow;
}

const PASS_GATE = (): GateResult => ({ ok: true, output: "stub gate: ok" });

/** A temp file shaped exactly like the real sanctioned party expansion file. */
function withTempExpansionFile(run: (path: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "ingest-party-"));
  const path = join(dir, "party-venues-expansion.ts");
  writeFileSync(
    path,
    `import type { PartyVenueExpansionRow } from "./party-venues-expansion";\n` +
      `export const PARTY_VENUES_EXPANSION: PartyVenueExpansionRow[] = [];\n`,
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

test("accepts a valid party-venue row and appends it to the expansion file", () => {
  withTempExpansionFile((path) => {
    const res = ingestResearched([goodPartyRow()], {
      partyVenueFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 1, res.reasons.join("; "));
    const written = readWrittenArray(path);
    assert.equal(written.length, 1);
    assert.equal(written[0].name, "Ingest Fixture Distillery Tour");
  });
});

test("writes the anchor and category so the attach step can route the row", () => {
  withTempExpansionFile((path) => {
    ingestResearched([goodPartyRow()], { partyVenueFilePath: path, runGates: PASS_GATE });

    const [row] = readWrittenArray(path);
    assert.equal(row.destinationId, REAL_DEST.id);
    assert.equal(row.category, "activity");
  });
});

test("persists sourceUrl and citations onto the written row", () => {
  withTempExpansionFile((path) => {
    ingestResearched([goodPartyRow()], { partyVenueFilePath: path, runGates: PASS_GATE });

    const [row] = readWrittenArray(path);
    assert.equal(row.sourceUrl, "https://www.ingest-fixture-distillery.test/");
    assert.deepEqual(row.citations, ["https://www.ingest-fixture-distillery.test/tours"]);
  });
});

test("REJECTS a destinationId that resolves to no destination, and writes nothing", () => {
  withTempExpansionFile((path) => {
    const res = ingestResearched([goodPartyRow({ destinationId: "no-such-destination-xyz" })], {
      partyVenueFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 0);
    assert.equal(res.rejected, 1);
    assert.match(res.reasons.join(" "), /no-such-destination-xyz/);
    assert.equal(readWrittenArray(path).length, 0, "nothing may be written");
  });
});

test("never infers the destination from city/state when the anchor misses", () => {
  withTempExpansionFile((path) => {
    // Carries the real destination's city+state but a bad id. Resolving this
    // by city would be the silent mis-association the golf anchor doc forbids.
    const res = ingestResearched(
      [goodPartyRow({ destinationId: "not-a-real-id", city: REAL_DEST.city, state: REAL_DEST.state })],
      { partyVenueFilePath: path, runGates: PASS_GATE },
    );

    assert.equal(res.accepted, 0);
    assert.equal(readWrittenArray(path).length, 0);
  });
});

test("skips a venue the curated destination already carries, reporting it explicitly", () => {
  const dest = sharedDestinations.find((d) => d.activities.length > 0);
  assert.ok(dest, "fixture needs a destination with at least one curated activity");
  const curatedName = dest.activities[0].name;

  withTempExpansionFile((path) => {
    const res = ingestResearched(
      [goodPartyRow({ destinationId: dest.id, name: curatedName })],
      { partyVenueFilePath: path, runGates: PASS_GATE },
    );

    assert.equal(res.accepted, 0);
    assert.equal(readWrittenArray(path).length, 0, "curated row wins — nothing appended");
    assert.equal(res.skippedDuplicates.length, 1);
    assert.equal(res.skippedDuplicates[0].dataset, "party-venue");
    assert.match(res.skippedDuplicates[0].identity, new RegExp(curatedName.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});

test("dedups two rows for the same venue within one batch", () => {
  withTempExpansionFile((path) => {
    const res = ingestResearched([goodPartyRow(), goodPartyRow()], {
      partyVenueFilePath: path,
      runGates: PASS_GATE,
    });

    assert.equal(res.accepted, 1);
    assert.equal(readWrittenArray(path).length, 1);
    assert.equal(res.skippedDuplicates.length, 1);
  });
});

test("dedup is scoped per category — the same name in another category still lands", () => {
  const dest = sharedDestinations.find((d) => d.activities.length > 0 && d.dining.length > 0);
  assert.ok(dest, "fixture needs a destination with curated activities and dining");
  const curatedActivityName = dest.activities[0].name;

  withTempExpansionFile((path) => {
    const res = ingestResearched(
      [
        goodPartyRow({
          destinationId: dest.id,
          category: "dining",
          name: curatedActivityName,
          cuisine: "Fixture Kitchen",
          priceRange: "$$",
          bestFor: "dinner",
          groupFriendly: true,
        }),
      ],
      { partyVenueFilePath: path, runGates: PASS_GATE },
    );

    assert.equal(res.accepted, 1, res.reasons.join("; "));
  });
});

test("rolls the expansion file back to its exact prior bytes when a gate fails", () => {
  withTempExpansionFile((path) => {
    const before = readFileSync(path, "utf-8");
    const res = ingestResearched([goodPartyRow()], {
      partyVenueFilePath: path,
      runGates: () => ({ ok: false, output: "stub gate: forced failure", failedGate: "audit" }),
    });

    assert.equal(res.accepted, 0);
    assert.equal(res.acceptedRows.length, 0);
    assert.equal(readFileSync(path, "utf-8"), before, "must restore byte-for-byte");
  });
});

test("still rejects a dataset with no write path, keeping the dispatch explicit", () => {
  withTempExpansionFile((path) => {
    const res = ingestResearched(
      [{ ...(goodPartyRow() as Record<string, unknown>), dataset: "not-a-dataset" } as unknown as ResearchedRow],
      { partyVenueFilePath: path, runGates: PASS_GATE },
    );

    assert.equal(res.accepted, 0);
    assert.equal(res.rejected, 1);
  });
});

test("reports a party row in acceptedRows so the PR builder counts what landed", () => {
  withTempExpansionFile((path) => {
    const row = goodPartyRow();
    const res = ingestResearched([row], { partyVenueFilePath: path, runGates: PASS_GATE });

    assert.equal(res.acceptedRows.length, 1);
    assert.equal(res.acceptedRows[0], row, "same object reference, not a clone");
  });
});
