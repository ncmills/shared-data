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
