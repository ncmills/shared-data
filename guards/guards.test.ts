// guards.test.ts — positive controls for every fleet guard: today's fault -> red, fixed -> green.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeFixture, FIXTURE_NOW } from "./fixtures/make.ts";
import { runGuards } from "./run.ts";

const now = new Date(FIXTURE_NOW);
const fx = (k: "red" | "green") => makeFixture(k, mkdtempSync(join(tmpdir(), `guards-${k}-`)));
const pick = async (dir: string, id: string) => (await runGuards(dir, { only: [id], now })).find((x) => x.id === id)!.r;

test("duplicate-assets: red on 9x reused url + identical bytes, green when fixed", async () => {
  const red = await pick(fx("red"), "duplicate-assets");
  assert.equal(red.status, "FAIL");
  assert.ok(red.reasons.some((r) => r.includes("used 9x")), red.reasons.join("\n"));
  assert.ok(red.reasons.some((r) => r.includes("same image bytes")));
  assert.equal((await pick(fx("green"), "duplicate-assets")).status, "PASS");
});

test("duplicate-assets: raw-text mode catches a url repeated in any file shape", async () => {
  const d = fx("green");
  writeFileSync(join(d, "data/page.tsx"), `<img src="https://x.test/a.jpg"/>\n<img src="https://x.test/a.jpg"/>`);
  const cfg = JSON.parse(readFileSync(join(d, "guards.config.json"), "utf8"));
  cfg.guards["duplicate-assets"].urlSources.push({ file: "data/page.tsx" });
  writeFileSync(join(d, "guards.config.json"), JSON.stringify(cfg));
  const r = await pick(d, "duplicate-assets");
  assert.equal(r.status, "FAIL");
  assert.ok(r.reasons.some((x) => x.includes("a.jpg used 2x")));
});

test("stale-datasets: red on 47 rows dated 2026-03-24, red on missing date, green when fresh", async () => {
  const red = await pick(fx("red"), "stale-datasets");
  assert.equal(red.status, "FAIL");
  assert.match(red.reasons.join("\n"), /47 row\(s\) older than 120d \(oldest 2026-03-24/);
  const d = fx("green");
  writeFileSync(join(d, "data/offices.ts"), `export const OFFICES = [{ id: "x" }];`);
  assert.match((await pick(d, "stale-datasets")).reasons.join(), /no valid researched_on: x/);
  assert.equal((await pick(fx("green"), "stale-datasets")).status, "PASS");
});

test("shared-data-pin-age: red on a 30d-old pin, green at main, n/a when sharedData:false, COULD-NOT-RUN on unknown sha", async () => {
  assert.equal((await pick(fx("red"), "shared-data-pin-age")).status, "FAIL");
  assert.equal((await pick(fx("green"), "shared-data-pin-age")).status, "PASS");
  const d = fx("green");
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { "shared-data": "github:ncmills/shared-data#0000000000000000000000000000000000000000" } }));
  assert.equal((await pick(d, "shared-data-pin-age")).status, "COULD-NOT-RUN");
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { "shared-data": "github:ncmills/shared-data" } }));
  assert.match((await pick(d, "shared-data-pin-age")).reasons.join(), /UNPINNED/);
  const cfg = JSON.parse(readFileSync(join(d, "guards.config.json"), "utf8"));
  delete cfg.guards["shared-data-pin-age"]; cfg.sharedData = false;
  writeFileSync(join(d, "guards.config.json"), JSON.stringify(cfg));
  // F3 (deliberate change): sharedData:false is n/a only when package.json does NOT depend on
  // shared-data; with the dependency still declared it now FAILs (covered in fix.test.ts).
  assert.equal((await pick(d, "shared-data-pin-age")).status, "FAIL");
  writeFileSync(join(d, "package.json"), JSON.stringify({ name: "no-shared-data" }));
  assert.match((await pick(d, "shared-data-pin-age")).checked ?? "", /n\/a/);
});

test("runner: missing guard FAILs; opt-out needs a CONTROL ruling id", async () => {
  const d = fx("green");
  const cfg = JSON.parse(readFileSync(join(d, "guards.config.json"), "utf8"));
  delete cfg.guards["stale-datasets"];
  writeFileSync(join(d, "guards.config.json"), JSON.stringify(cfg));
  assert.match((await pick(d, "stale-datasets")).reasons.join(), /guard stale-datasets not configured/);
  cfg.optOut = { "stale-datasets": { ruling: "", reason: "no data" } };
  writeFileSync(join(d, "guards.config.json"), JSON.stringify(cfg));
  assert.equal((await pick(d, "stale-datasets")).status, "FAIL");
  // F1 (was the hole at :66): a ruling-shaped id NOT pinned in guards/opt-outs.json must FAIL.
  for (const ruling of ["SITE-NO-DATASETS", "TODO", "NONE", "SKIP"]) {
    cfg.optOut = { "stale-datasets": { ruling, reason: "no data" } };
    writeFileSync(join(d, "guards.config.json"), JSON.stringify(cfg));
    assert.equal((await pick(d, "stale-datasets")).status, "FAIL", ruling);
  }
  const all = await runGuards(mkdtempSync(join(tmpdir(), "guards-empty-")), { now });
  assert.ok(all.length === 5 && all.every((x) => x.r.status === "FAIL"), "no config file = every guard FAILs");
});

// F5 (deliberate rewrite): coverage no longer reads local checkouts or the SITES array in
// set-signal-secret.sh. It reads origin through an injectable fetcher over guards/fleet.json,
// so this test drives an in-memory fetcher instead of temp dirs.
test("coverage: counts live caller + prebuild + configured guard, names every repo missing it", async () => {
  const { coverage } = await import("./coverage.ts");
  const caller = readFileSync(new URL("./caller-template.yml", import.meta.url), "utf8");
  const cfg = readFileSync(join(fx("green"), "guards.config.json"), "utf8");
  const pkg = JSON.stringify({ scripts: { prebuild: "node --import tsx node_modules/shared-data/guards/run.ts ." } });
  const files: Record<string, Record<string, string>> = {
    "o/on": { ".github/workflows/guards.yml": caller, "package.json": pkg, "guards.config.json": cfg },
    "o/off": { "package.json": pkg, "guards.config.json": cfg }, // config + prebuild, no caller workflow
  };
  const rows = coverage({ sites: [{ repo: "o/on" }, { repo: "o/off" }, { repo: "o/ghost" }, { repo: "o/never" }], excluded: [{ repo: "o/never", reason: "excluded" }] },
    (repo, path) => files[repo]?.[path] ?? null);
  assert.equal(rows.length, 5);
  for (const r of rows) {
    assert.equal(`${r.covered}/${r.total}`, "1/3", r.guard);
    assert.match(r.missing.join(), /o\/off \(no live uses: line/);
    assert.match(r.missing.join(), /o\/ghost .*no guards\.config\.json/);
    assert.ok(!r.missing.join().includes("o/never"), "excluded repos are never read or counted");
  }
});
