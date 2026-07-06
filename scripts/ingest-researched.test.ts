// ingest-researched.test.ts — Task 15: the INGEST GATE.
//
// Exercises the real write path: validate → convert (deriveRouting,
// correct-by-construction) → append to the sanctioned expansion file →
// verify-universe + check-brand-rules + audit → keep, or roll back to the
// exact prior file contents. Two of the four tests deliberately run against
// the REAL sanctioned golf expansion file (src/golf-courses-hhq-merge.ts)
// because the assertions they need to make (row visible in ALL_GOLF_COURSES
// via backfillUniverse; verify-universe genuinely rejecting a bad `sites`
// tag) can only be observed through the real import graph — a
// dependency-injected temp file is invisible to that graph. Both restore the
// real file's exact prior bytes in a `finally`, so the suite is idempotent.
// A separate DI'd test proves the rollback MECHANISM generically, without
// spawning the real (multi-second) gates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ingestResearched, DEFAULT_GOLF_EXPANSION_PATH } from "./ingest-researched";
import type { ResearchedRow } from "../src/research-schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

/** A complete, real-shaped golf row — required ResearchedRow fields PLUS the
 *  extra SharedGolfCourse shape fields toGolfCourse() requires (greenFeeRange
 *  / style / walkable / driveMinutes). Domains are fixture-only (not on the
 *  research-schema placeholder-host denylist, but not meant to resolve). */
const GOOD_GOLF: ResearchedRow = {
  dataset: "golf",
  name: "Ingest Test Fixture Course",
  city: "Duluth",
  state: "MN",
  region: "Midwest",
  tier: "value",
  greenFeeRange: [40, 70],
  style: "parkland",
  walkable: true,
  driveMinutes: 20,
  highlight: "Public parkland fixture course used only by ingest-researched.test.ts.",
  sourceUrl: "https://www.ingest-test-fixture-course.golf/",
  citations: ["https://www.ingest-test-fixture-course.golf/about"],
};

/** Read back the JSON array literal an expansion-fixture file was written
 *  with. Anchors on the assignment's `= [ ... ];` (end-of-file), NOT the
 *  first `[` in the file — the type annotation (`SharedGolfCourse[]`) also
 *  contains a `[]` earlier in the line, which a naive `/\[[\s\S]*\]/` would
 *  greedily span into, corrupting the parse. */
function readWrittenArray(path: string): unknown[] {
  const raw = readFileSync(path, "utf-8");
  const m = raw.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!m) throw new Error(`readWrittenArray: could not locate the array assignment in ${path}`);
  return JSON.parse(m[1]);
}

/** Spawn a fresh `tsx` process to read `backfillUniverse()` STRAIGHT off disk
 *  (no ESM module-cache risk — see task-15-report.md) and return the matching
 *  golf row's derived `postWizards`, or null if not found. */
function golfRowPostWizards(name: string, city: string, state: string): string[] | null {
  const id = `${name}|${city},${state}`;
  const script = [
    `import { backfillUniverse } from ${JSON.stringify(join(REPO_ROOT, "scripts", "backfill-tags.ts"))};`,
    `const rows = backfillUniverse();`,
    `const row = rows.find((r) => r.dataset === "golf" && r.id === ${JSON.stringify(id)});`,
    `console.log(JSON.stringify(row ? row.postWizards : null));`,
  ].join("\n");
  const tmpFile = join(tmpdir(), `ingest-check-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`);
  writeFileSync(tmpFile, script);
  try {
    const out = execFileSync("npx", ["tsx", tmpFile], { cwd: REPO_ROOT, encoding: "utf-8" });
    return JSON.parse(out.trim());
  } finally {
    rmSync(tmpFile, { force: true });
  }
}

test("ACCEPTS a valid golf row; it appears in ALL_GOLF_COURSES tagged handicap+bestman via backfillUniverse", () => {
  const before = readFileSync(DEFAULT_GOLF_EXPANSION_PATH, "utf-8");
  const name = `Ingest Test Happy Path Course ${Date.now()}`;
  try {
    const row: ResearchedRow = { ...GOOD_GOLF, name };
    const result = ingestResearched([row]);

    assert.equal(result.accepted, 1);
    assert.equal(result.rejected, 0);
    assert.equal(result.acceptedRows.length, 1);
    assert.equal(result.acceptedRows[0].dataset, "golf");
    assert.equal(result.acceptedRows[0].name, name);

    const tags = golfRowPostWizards(name, "Duluth", "MN");
    assert.ok(tags, "ingested row should be present in backfillUniverse()'s golf rows");
    assert.ok(tags!.includes("handicap"), `expected "handicap" in ${JSON.stringify(tags)}`);
    assert.ok(tags!.includes("bestman"), `expected "bestman" in ${JSON.stringify(tags)}`);
  } finally {
    // idempotency: restore the real sanctioned file to its pre-test content
    writeFileSync(DEFAULT_GOLF_EXPANSION_PATH, before);
  }
});

test("REJECTS + ROLLS BACK a golf row hand-forced to a brand-breaking site tag (verify-universe gate)", () => {
  const before = readFileSync(DEFAULT_GOLF_EXPANSION_PATH, "utf-8");
  try {
    // "moh" is not a valid golf `sites` value (only tdf/offsite/handicap) —
    // simulates a hand-forced tag that would let golf leak toward a brand it
    // must never reach. Cast bypasses the SharedGolfCourse["sites"] union at
    // the type level to model an untrusted payload reaching the converter.
    const badRow = {
      ...GOOD_GOLF,
      name: "Ingest Test Brand-Guard Break Course",
      sites: ["moh"],
    } as unknown as ResearchedRow;

    const result = ingestResearched([badRow]);

    assert.equal(result.accepted, 0);
    assert.deepEqual(result.acceptedRows, [], "a rolled-back batch must report zero accepted rows");
    assert.ok(
      result.reasons.some((r) => /rolled back/i.test(r)),
      `expected a rollback reason in ${JSON.stringify(result.reasons)}`,
    );
    assert.ok(
      result.reasons.some((r) => /verify-universe|bad site/i.test(r)),
      `expected the reason to cite the failing gate in ${JSON.stringify(result.reasons)}`,
    );

    const after = readFileSync(DEFAULT_GOLF_EXPANSION_PATH, "utf-8");
    assert.equal(after, before, "expansion file must be byte-identical to its pre-ingest content after rollback");
  } finally {
    writeFileSync(DEFAULT_GOLF_EXPANSION_PATH, before);
  }
});

test("REJECTS an invalid row (no sourceUrl) by validation, before ever touching a file", () => {
  const before = readFileSync(DEFAULT_GOLF_EXPANSION_PATH, "utf-8");
  const { sourceUrl: _drop, ...rest } = GOOD_GOLF as Record<string, unknown>;

  const result = ingestResearched([rest as unknown as ResearchedRow]);

  assert.equal(result.accepted, 0);
  assert.equal(result.rejected, 1);
  assert.deepEqual(result.acceptedRows, [], "a row rejected at validation must not appear in acceptedRows");
  assert.ok(result.reasons.some((r) => /sourceUrl/i.test(r)));

  const after = readFileSync(DEFAULT_GOLF_EXPANSION_PATH, "utf-8");
  assert.equal(after, before, "an invalid row must never touch the expansion file");
});

// ─── Item 1: dedup before append ────────────────────────────────────────────
// A venue researched twice (e.g. across two monthly runs, or already present
// in the regen-only base dataset) must be SKIPPED, not double-appended — and
// the skip must be REPORTED, never silent. Identity: golf = (name, city)
// case-insensitive; residence = id (or (name, region) if no id).

test("dedup: a golf row matching an EXISTING row already in the injected expansion file is skipped, not appended", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-dedup-"));
  const tmpGolfPath = join(tmpDir, "golf-fixture.ts");
  const existingCourse = {
    name: "Existing Fixture Course",
    city: "Somewhere",
    state: "MN",
    region: "Midwest",
    tier: "value",
    greenFeeRange: [30, 60],
    style: "parkland",
    walkable: true,
    driveMinutes: 15,
    highlight: "Already in the expansion file.",
    sites: ["tdf", "offsite", "handicap"],
    products: ["golf-trip"],
  };
  const initialContent =
    `import type { SharedGolfCourse } from "../src/golf-courses";\n\n` +
    `export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = ${JSON.stringify([existingCourse])};\n`;
  writeFileSync(tmpGolfPath, initialContent);

  try {
    // Same venue, different case in both name and city — must still match.
    const dupeRow: ResearchedRow = {
      ...GOOD_GOLF,
      name: "EXISTING FIXTURE COURSE",
      city: "somewhere",
    };
    const result = ingestResearched([dupeRow], { golfFilePath: tmpGolfPath });

    assert.equal(result.accepted, 0);
    assert.equal(result.rejected, 1);
    assert.deepEqual(result.acceptedRows, []);
    assert.equal(result.skippedDuplicates.length, 1);
    assert.equal(result.skippedDuplicates[0].dataset, "golf");
    assert.ok(result.reasons.some((r) => /duplicate/i.test(r)));

    const after = readFileSync(tmpGolfPath, "utf-8");
    assert.equal(after, initialContent, "the file must be untouched — dedup happens before any write");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("dedup: a golf row matching a course already in the BASE dataset (SHARED_GOLF_COURSES) is skipped", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-dedup-base-"));
  const tmpGolfPath = join(tmpDir, "golf-fixture.ts");
  const initialContent =
    `import type { SharedGolfCourse } from "../src/golf-courses";\n\n` +
    `export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = [];\n`;
  writeFileSync(tmpGolfPath, initialContent);

  try {
    // "TPC Scottsdale (Stadium Course)" / "Scottsdale" is a REAL base-dataset
    // entry (SHARED_GOLF_COURSES) — never appended anywhere, must still dedupe.
    const dupeRow: ResearchedRow = {
      ...GOOD_GOLF,
      name: "tpc scottsdale (stadium course)",
      city: "SCOTTSDALE",
    };
    const result = ingestResearched([dupeRow], { golfFilePath: tmpGolfPath });

    assert.equal(result.accepted, 0);
    assert.equal(result.rejected, 1);
    assert.equal(result.skippedDuplicates.length, 1);
    const after = readFileSync(tmpGolfPath, "utf-8");
    assert.equal(after, initialContent, "the (empty) expansion file must be untouched");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("dedup: a residence row matching an existing base-dataset id (SHARED_RESIDENCES) is skipped", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-dedup-residence-"));
  const tmpResidencePath = join(tmpDir, "residence-fixture.ts");
  const initialContent =
    `import type { SharedResidence } from "../src/residences";\n\n` +
    `export const SHARED_RESIDENCES_EXPANSION: SharedResidence[] = [];\n`;
  writeFileSync(tmpResidencePath, initialContent);

  try {
    // "brush-creek-ranch" is a REAL id already in SHARED_RESIDENCES — id match
    // must win even though name/region differ from the original.
    const dupeRow: ResearchedRow = {
      dataset: "residence",
      id: "Brush-Creek-Ranch",
      name: "A Totally Different Name",
      setting: "ranch",
      region: "Somewhere Else",
      country: "USA",
      capacity: { min: 20, max: 60, sleepsOnsite: 60 },
      price: { perPersonPerNight: { low: 400, high: 800 } },
      sourceUrl: "https://www.ingest-test-fixture-residence.example/",
      citations: ["https://www.ingest-test-fixture-residence.example/about"],
    } as unknown as ResearchedRow;
    const result = ingestResearched([dupeRow], { residenceFilePath: tmpResidencePath });

    assert.equal(result.accepted, 0);
    assert.equal(result.rejected, 1);
    assert.equal(result.skippedDuplicates.length, 1);
    assert.equal(result.skippedDuplicates[0].dataset, "residence");
    const after = readFileSync(tmpResidencePath, "utf-8");
    assert.equal(after, initialContent);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("dedup: two identical golf rows in the SAME batch — only the first lands, the second is reported as a duplicate", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-dedup-intrabatch-"));
  const tmpGolfPath = join(tmpDir, "golf-fixture.ts");
  const initialContent =
    `import type { SharedGolfCourse } from "../src/golf-courses";\n\n` +
    `export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = [];\n`;
  writeFileSync(tmpGolfPath, initialContent);

  try {
    const name = `Ingest Test Intra-Batch Course ${Date.now()}`;
    const rowA: ResearchedRow = { ...GOOD_GOLF, name };
    const rowB: ResearchedRow = { ...GOOD_GOLF, name: name.toUpperCase() };
    const result = ingestResearched([rowA, rowB], {
      golfFilePath: tmpGolfPath,
      runGates: () => ({ ok: true, output: "" }),
    });

    assert.equal(result.accepted, 1);
    assert.equal(result.rejected, 1);
    assert.equal(result.acceptedRows.length, 1);
    assert.equal(result.skippedDuplicates.length, 1);

    const after = readWrittenArray(tmpGolfPath);
    assert.equal(after.length, 1, "only one of the two identical rows should have landed");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ─── Item 2: safe UI-field defaults for a minimal ResearchedRow ─────────────
// A minimal row may omit optional fields the live wizard UIs read directly
// (no crash-safe fallback on their end) — the canonical row WRITTEN must
// carry neutral/empty defaults instead of leaving them undefined, WITHOUT
// fabricating any specific fact (no fake ratings, no fake pricing).

test("golf UI defaults: a row missing driveMinutes/walkable lands with SAFE defaults (0 / false), not rejected", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-defaults-golf-"));
  const tmpGolfPath = join(tmpDir, "golf-fixture.ts");
  const initialContent =
    `import type { SharedGolfCourse } from "../src/golf-courses";\n\n` +
    `export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = [];\n`;
  writeFileSync(tmpGolfPath, initialContent);

  try {
    const { driveMinutes: _dm, walkable: _w, ...minimal } = GOOD_GOLF as Record<string, unknown>;
    const result = ingestResearched([minimal as unknown as ResearchedRow], {
      golfFilePath: tmpGolfPath,
      runGates: () => ({ ok: true, output: "" }),
    });

    assert.equal(result.accepted, 1, "a row missing only driveMinutes/walkable must NOT be rejected");
    const written = readWrittenArray(tmpGolfPath);
    assert.equal(written.length, 1);
    assert.equal(written[0].driveMinutes, 0, "driveMinutes must default to a safe neutral 0, not be undefined");
    assert.equal(written[0].walkable, false, "walkable must default to false (conservative), not be undefined");
    assert.equal(written[0].rating, undefined, "rating must stay OMITTED, never a fabricated number");
    assert.equal(written[0].googleRating, undefined, "googleRating must stay OMITTED, never fabricated");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("golf still REJECTS a row missing greenFeeRange or style (no safe default exists for fabricated pricing/categorization)", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-defaults-golf-required-"));
  const tmpGolfPath = join(tmpDir, "golf-fixture.ts");
  writeFileSync(
    tmpGolfPath,
    `import type { SharedGolfCourse } from "../src/golf-courses";\n\n` +
      `export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = [];\n`,
  );
  try {
    const { greenFeeRange: _gfr, ...missingPrice } = GOOD_GOLF as Record<string, unknown>;
    const result = ingestResearched([missingPrice as unknown as ResearchedRow], { golfFilePath: tmpGolfPath });
    assert.equal(result.accepted, 0);
    assert.ok(result.reasons.some((r) => /greenFeeRange/.test(r)));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("residence UI defaults: a minimal-but-real row (real capacity/price) lands with SAFE structural defaults for the rest (no crash)", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-defaults-residence-"));
  const tmpResidencePath = join(tmpDir, "residence-fixture.ts");
  writeFileSync(
    tmpResidencePath,
    `import type { SharedResidence } from "../src/residences";\n\n` +
      `export const SHARED_RESIDENCES_EXPANSION: SharedResidence[] = [];\n`,
  );
  try {
    const minimalRow: ResearchedRow = {
      dataset: "residence",
      id: `ingest-test-minimal-residence-${Date.now()}`,
      name: "Ingest Test Minimal Residence",
      setting: "countryside",
      region: "Test Region",
      country: "USA",
      // capacity + price are display-critical and hard-required (no longer
      // defaulted to zero) — see research-schema.ts's residence-only check.
      capacity: { min: 30, max: 90, sleepsOnsite: 90 },
      price: { perPersonPerNight: { low: 500, high: 950 } },
      sourceUrl: "https://www.ingest-test-minimal-residence.example/",
      citations: ["https://www.ingest-test-minimal-residence.example/about"],
    } as unknown as ResearchedRow;
    const result = ingestResearched([minimalRow], {
      residenceFilePath: tmpResidencePath,
      runGates: () => ({ ok: true, output: "" }),
    });

    assert.equal(result.accepted, 1);
    const written = readWrittenArray(tmpResidencePath);
    assert.equal(written.length, 1);
    const r = written[0];
    assert.deepEqual(r.nearestAirports, [], "nearestAirports must default to [] (OO reads it via [0]?.code)");
    assert.deepEqual(r.capacity, { min: 30, max: 90, sleepsOnsite: 90 }, "capacity must be the REAL researched value — no longer defaulted");
    assert.deepEqual(r.goodFor, [], "goodFor must default to [] — OO reads v.goodFor.includes(...) directly");
    assert.deepEqual(r.signatureExperiences, [], "signatureExperiences must default to [] — OO reads .includes(...) directly");
    assert.deepEqual(r.seasonality, { bestMonths: "", offPeak: "" }, "seasonality must default to empty strings — OO reads v.seasonality.bestMonths/.offPeak directly");
    assert.deepEqual(r.price, { perPersonPerNight: { low: 500, high: 950 } }, "price must be the REAL researched value — no longer defaulted");
    assert.equal(r.dining, "");
    assert.equal(r.logistics, "");
    assert.equal(r.accessibility, "");
    assert.equal(r.whySpecial, "");
    assert.equal(r.summary, "");
    assert.deepEqual(r.tags, []);
    assert.equal(r.imageQuery, "");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("residence with missing capacity/price is REJECTED at ingest, never defaulted to zero", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-reject-residence-nocapacity-"));
  const tmpResidencePath = join(tmpDir, "residence-fixture.ts");
  const initialContent =
    `import type { SharedResidence } from "../src/residences";\n\n` +
    `export const SHARED_RESIDENCES_EXPANSION: SharedResidence[] = [];\n`;
  writeFileSync(tmpResidencePath, initialContent);
  try {
    const noCapacityNoPrice: ResearchedRow = {
      dataset: "residence",
      id: `ingest-test-nocapacity-residence-${Date.now()}`,
      name: "Ingest Test No-Capacity Residence",
      setting: "countryside",
      region: "Test Region",
      country: "USA",
      sourceUrl: "https://www.ingest-test-nocapacity-residence.example/",
      citations: ["https://www.ingest-test-nocapacity-residence.example/about"],
    };
    const result = ingestResearched([noCapacityNoPrice], {
      residenceFilePath: tmpResidencePath,
      runGates: () => ({ ok: true, output: "" }),
    });

    assert.equal(result.accepted, 0);
    assert.equal(result.rejected, 1);
    assert.ok(result.reasons.some((r) => /capacity/i.test(r)));
    assert.ok(result.reasons.some((r) => /price/i.test(r)));
    const after = readFileSync(tmpResidencePath, "utf-8");
    assert.equal(after, initialContent, "the expansion file must be untouched — nothing with a zeroed capacity/price ever lands");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("residence with zeroed capacity/price (the old UI-default shape) is REJECTED at ingest", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-reject-residence-zeroed-"));
  const tmpResidencePath = join(tmpDir, "residence-fixture.ts");
  const initialContent =
    `import type { SharedResidence } from "../src/residences";\n\n` +
    `export const SHARED_RESIDENCES_EXPANSION: SharedResidence[] = [];\n`;
  writeFileSync(tmpResidencePath, initialContent);
  try {
    const zeroedRow: ResearchedRow = {
      dataset: "residence",
      id: `ingest-test-zeroed-residence-${Date.now()}`,
      name: "Ingest Test Zeroed Residence",
      setting: "countryside",
      region: "Test Region",
      country: "USA",
      capacity: { min: 0, max: 0, sleepsOnsite: 0 },
      price: { perPersonPerNight: { low: 0, high: 0 } },
      sourceUrl: "https://www.ingest-test-zeroed-residence.example/",
      citations: ["https://www.ingest-test-zeroed-residence.example/about"],
    } as unknown as ResearchedRow;
    const result = ingestResearched([zeroedRow], {
      residenceFilePath: tmpResidencePath,
      runGates: () => ({ ok: true, output: "" }),
    });

    assert.equal(result.accepted, 0);
    assert.equal(result.rejected, 1);
    const after = readFileSync(tmpResidencePath, "utf-8");
    assert.equal(after, initialContent);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("residence UI defaults: an explicitly-supplied optional field WINS over the default", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-defaults-residence-override-"));
  const tmpResidencePath = join(tmpDir, "residence-fixture.ts");
  writeFileSync(
    tmpResidencePath,
    `import type { SharedResidence } from "../src/residences";\n\n` +
      `export const SHARED_RESIDENCES_EXPANSION: SharedResidence[] = [];\n`,
  );
  try {
    const row: ResearchedRow = {
      dataset: "residence",
      id: `ingest-test-override-residence-${Date.now()}`,
      name: "Ingest Test Override Residence",
      setting: "countryside",
      region: "Test Region",
      country: "USA",
      sourceUrl: "https://www.ingest-test-override-residence.example/",
      citations: ["https://www.ingest-test-override-residence.example/about"],
      capacity: { min: 20, max: 60, sleepsOnsite: 60 },
      price: { perPersonPerNight: { low: 300, high: 700 } },
      dining: "Real researched dining note.",
    } as unknown as ResearchedRow;
    const result = ingestResearched([row], {
      residenceFilePath: tmpResidencePath,
      runGates: () => ({ ok: true, output: "" }),
    });
    assert.equal(result.accepted, 1);
    const written = readWrittenArray(tmpResidencePath);
    assert.deepEqual(written[0].capacity, { min: 20, max: 60, sleepsOnsite: 60 });
    assert.equal(written[0].dining, "Real researched dining note.");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("rollback mechanism: an injected gate failure restores an injected (temp) expansion file exactly", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ingest-rollback-"));
  const tmpGolfPath = join(tmpDir, "golf-fixture.ts");
  const initialContent =
    `import type { SharedGolfCourse } from "../src/golf-courses";\n\n` +
    `export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = [];\n`;
  writeFileSync(tmpGolfPath, initialContent);

  try {
    const row: ResearchedRow = { ...GOOD_GOLF, name: "DI Rollback Mechanism Fixture" };

    const result = ingestResearched([row], {
      golfFilePath: tmpGolfPath,
      // simulate a real gate (e.g. a new audit regression) failing, without
      // spawning the real multi-second verify/check-brand-rules/audit chain
      runGates: () => ({ ok: false, output: "simulated audit regression", failedGate: "audit" }),
    });

    assert.equal(result.accepted, 0);
    assert.deepEqual(result.acceptedRows, [], "a gate-failed batch must report zero accepted rows");
    assert.ok(result.reasons.some((r) => /rolled back/i.test(r)));
    assert.ok(result.reasons.some((r) => /audit/i.test(r)));

    const after = readFileSync(tmpGolfPath, "utf-8");
    assert.equal(after, initialContent, "injected temp fixture must be restored byte-identically on gate failure");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
