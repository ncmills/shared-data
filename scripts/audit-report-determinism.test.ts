// audit-report-determinism.test.ts — the audit must not dirty the tree by running.
//
// `docs/audit-report.json` is a COMMITTED artifact that the audit rewrites on
// every run. It carried `generatedAt: new Date().toISOString()`, so every run
// produced a diff whose only content was the time it ran.
//
// That is not cosmetic. A permanently-dirty checkout reads as "a human is
// mid-work" to `loop_runner._repo_busy()`, and the fleet's autonomous loop
// skips every round it finds one. That deadlock ran from 2026-08-04 to
// 2026-08-06 with every health surface reporting green, because a SKIP is
// indistinguishable from "nothing to do". This file is one of the two
// generators that kept re-arming it.
//
// git already records when the report changed. The report's value is its
// findings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runAudit } from "./audit/index";

const REPORT = join(import.meta.dirname, "..", "docs", "audit-report.json");

test("the committed audit report carries no volatile timestamp", () => {
  const report = JSON.parse(readFileSync(REPORT, "utf8"));
  assert.ok(
    !("generatedAt" in report),
    "audit-report.json must not carry generatedAt — a field that changes every " +
      "run makes the artifact dirty the working tree forever",
  );
});

test("running the audit twice leaves the report byte-identical", () => {
  runAudit();
  const first = readFileSync(REPORT, "utf8");
  runAudit();
  const second = readFileSync(REPORT, "utf8");
  assert.equal(
    first,
    second,
    "audit output must be deterministic — a run that changes the artifact " +
      "without a finding changing is a permanent source of tree dirt",
  );
});
