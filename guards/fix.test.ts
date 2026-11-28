// fix.test.ts — SN fix of PR 99 (F1-F5, F7, F8): every must-fix as a red case.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { makeFixture, FIXTURE_NOW } from "./fixtures/make.ts";
import { runGuards } from "./run.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const SD = resolve(HERE, "..");
const SN_NOW = new Date("2026-11-27T00:00:00Z");
const now = new Date(FIXTURE_NOW);
const green = () => makeFixture("green", mkdtempSync(join(tmpdir(), "gfix-")));
const pick = async (dir: string, id: string, o: Record<string, unknown> = {}) =>
  (await runGuards(dir, { only: [id], now, ...o })).find((x) => x.id === id)!.r;
const edit = (d: string, f: (c: any) => void) => {
  const p = join(d, "guards.config.json"); const c = JSON.parse(readFileSync(p, "utf8")); f(c); writeFileSync(p, JSON.stringify(c));
};
const sn = (kind: string, name: string) => {
  const d = mkdtempSync(join(tmpdir(), `sn-${name}-`)); cpSync(join(HERE, "fixtures/sn", kind, name), d, { recursive: true }); return d;
};

// ---- F4 / F8: SN guards ported, with SN's selftest cases ----
const SN_CASES: [string, string, string, string | null][] = [
  ["unsourced-facts", "facts", "bad-unsourced", "NO_SOURCE"],
  ["unsourced-facts", "facts", "bad-stale", "STALE"],
  ["unsourced-facts", "facts", "bad-unlisted", "UNLISTED src/data/offices.json"],
  ["unsourced-facts", "facts", "good", null],
  ["promise-registry", "claims", "bad-doppelwriter", "UNREGISTERED bc3de34fc43a"],
  ["promise-registry", "claims", "bad-bmhq", "UNREGISTERED"],
  ["promise-registry", "claims", "good", null],
];
for (const [id, kind, name, expect] of SN_CASES) {
  test(`F8 ${id}: ${kind}/${name} ${expect ? "fails on " + expect : "passes"}`, async () => {
    const r = await pick(sn(kind, name), id, { now: SN_NOW });
    if (expect) { assert.equal(r.status, "FAIL"); assert.ok(r.reasons.some((x) => x.includes(expect)), r.reasons.join("\n")); }
    else assert.equal(r.status, "PASS", r.reasons.join("\n"));
  });
}

test("F8 unsourced-facts: EXEMPT_NO_REASON, policy.forbid, JSON-only reader", async () => {
  const d = sn("facts", "good");
  edit(d, (c) => { c.guards["unsourced-facts"].exempt[0].reason = " "; });
  assert.match((await pick(d, "unsourced-facts", { now: SN_NOW })).reasons.join(), /EXEMPT_NO_REASON/);
  const e = sn("facts", "good");
  edit(e, (c) => { c.guards["unsourced-facts"].datasets[0].row_path = "peptides"; });
  writeFileSync(join(e, "data/peptides.json"), JSON.stringify({ peptides: [{ name: "semaglutide", source_url: "https://x.test", researched_on: "2026-11-01" }] }));
  assert.match((await pick(e, "unsourced-facts", { now: SN_NOW })).reasons.join(), /FORBIDDEN/);
  const f = sn("facts", "good");
  edit(f, (c) => { c.guards["unsourced-facts"].exempt = []; c.guards["unsourced-facts"].datasets.push({ file: "lib/site-config.ts", row_path: "", max_age_days: 90 }); });
  assert.match((await pick(f, "unsourced-facts", { now: SN_NOW })).reasons.join(), /UNMEASURED/);
});

test("F4 one config, one date field (researched_on); --strict ignores unregistered + n/a guards", async () => {
  const d = green();
  (await import("node:fs")).rmSync(join(d, "data/venues.json"));
  const ex = JSON.parse(readFileSync(join(HERE, "guards.config.example.json"), "utf8"));
  assert.ok(!JSON.stringify(ex).includes("researchedOn"), "example config uses researched_on only");
  edit(d, (c) => { c.guards["future-guard"] = {}; });
  const all = await runGuards(d, { now });
  assert.ok(!all.some((x) => x.id === "future-guard"), "an unregistered configured guard is not run or failed");
  const out = execFileSync(process.execPath, ["--import", "tsx", join(HERE, "run.ts"), d, "--strict", "--only", "unsourced-facts"], { encoding: "utf8", env: { ...process.env, GUARDS_NOW: FIXTURE_NOW } });
  assert.match(out, /PASS\s+unsourced-facts \(n\/a/);
  const wf = readFileSync(join(SD, ".github/workflows/site-guards.yml"), "utf8");
  assert.match(wf, /--report-only/, "CI reports only; the Vercel prebuild is the blocking path");
});

// ---- F1: opt-outs only via the pinned list ----
test("F1 opt-out: regex-shaped id fails; pinned {site,guard,ruling,reason} passes; empty reason fails", async () => {
  const pins = join(mkdtempSync(join(tmpdir(), "pins-")), "opt-outs.json");
  writeFileSync(pins, JSON.stringify([{ site: "fixture-green", guard: "stale-datasets", ruling: "SITE-NO-DATASETS", reason: "site has no datasets" },
    { site: "fixture-green", guard: "duplicate-assets", ruling: "EMPTY-REASON", reason: "" }]));
  const d = green();
  edit(d, (c) => { delete c.guards["stale-datasets"]; delete c.guards["duplicate-assets"]; c.optOut = { "stale-datasets": { ruling: "TODO", reason: "later" }, "duplicate-assets": { ruling: "EMPTY-REASON", reason: "x" } }; });
  assert.equal((await pick(d, "stale-datasets", { optOutsFile: pins })).status, "FAIL", "TODO is not a ruling");
  assert.equal((await pick(d, "duplicate-assets", { optOutsFile: pins })).status, "FAIL", "pinned with empty reason");
  edit(d, (c) => { c.optOut["stale-datasets"] = { ruling: "SITE-NO-DATASETS", reason: "site has no datasets" }; });
  assert.equal((await pick(d, "stale-datasets", { optOutsFile: pins })).status, "PASS");
  edit(d, (c) => { c.site = "other-site"; });
  assert.equal((await pick(d, "stale-datasets", { optOutsFile: pins })).status, "FAIL", "pin is per site");
  assert.ok(Array.isArray(JSON.parse(readFileSync(join(HERE, "opt-outs.json"), "utf8"))));
});

// ---- F2: duplicate-assets keys ----
test("F2 D1 same Unsplash photo, different ixid/query -> FAIL", async () => {
  const d = green();
  writeFileSync(join(d, "data/venues.json"), JSON.stringify({ venues: [
    { id: "a", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?ixid=AAA&w=1200" },
    { id: "b", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?ixid=BBB&w=800&q=80" }] }));
  assert.equal((await pick(d, "duplicate-assets")).status, "FAIL");
});
test("F2 D2 identical bytes in two different image dirs -> FAIL", async () => {
  const d = green();
  mkdirSync(join(d, "public/other"), { recursive: true });
  writeFileSync(join(d, "public/other/c.png"), Buffer.from("PNG-bytes-A"));
  edit(d, (c) => { c.guards["duplicate-assets"].imageDirs.push("public/other"); });
  assert.match((await pick(d, "duplicate-assets")).reasons.join(), /same image bytes/);
});
test("F2 D4 one URL across two lists -> FAIL", async () => {
  const d = green();
  writeFileSync(join(d, "data/hotels.json"), JSON.stringify({ hotels: [{ id: "h", image: "https://images.unsplash.com/photo-1000?w=1200" }] }));
  edit(d, (c) => { c.guards["duplicate-assets"].urlSources.push({ file: "data/hotels.json", export: "hotels", urlFields: ["image"] }); });
  assert.equal((await pick(d, "duplicate-assets")).status, "FAIL");
});

// ---- F3: configs that match nothing ----
test("F3 urlFields naming no field -> FAIL (0 uses)", async () => {
  const d = green();
  edit(d, (c) => { c.guards["duplicate-assets"].urlSources[0].urlFields = ["photo"]; });
  assert.match((await pick(d, "duplicate-assets")).reasons.join(), /0 uses/);
});
test("F3 empty image dir -> FAIL (0 files)", async () => {
  const d = green();
  mkdirSync(join(d, "public/empty"));
  edit(d, (c) => { c.guards["duplicate-assets"].imageDirs.push("public/empty"); });
  assert.match((await pick(d, "duplicate-assets")).reasons.join(), /0 files/);
});
test("F3 sharedData:false while package.json depends on shared-data -> FAIL", async () => {
  const d = green();
  edit(d, (c) => { c.sharedData = false; });
  assert.equal((await pick(d, "shared-data-pin-age")).status, "FAIL");
});

// ---- F7: pin-age ----
const git = (...a: string[]) => execFileSync("git", ["-C", SD, ...a], { encoding: "utf8" }).trim();
const setPin = (d: string, pin: string) => writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { "shared-data": `github:ncmills/shared-data#${pin}` } }));
test("F7 pin-age: #main pin FAILs (needs 40-hex sha)", async () => {
  const d = green(); setPin(d, "main");
  assert.match((await pick(d, "shared-data-pin-age")).reasons.join(), /40-hex/);
});
test("F7 pin-age: sha not an ancestor of origin/main FAILs", async () => {
  const d = green(); setPin(d, git("commit-tree", "HEAD^{tree}", "-p", "origin/main", "-m", "off-main fixture"));
  assert.match((await pick(d, "shared-data-pin-age")).reasons.join(), /not an ancestor/);
});
test("F7 pin-age: too many commits behind FAILs even when young", async () => {
  const d = green(); setPin(d, git("rev-parse", "origin/main~1"));
  edit(d, (c) => { c.guards["shared-data-pin-age"] = { maxDays: 100000, maxCommits: 0 }; });
  assert.match((await pick(d, "shared-data-pin-age")).reasons.join(), /commit\(s\) behind.*max 0/);
});

// ---- F5: coverage from origin via gh api, explicit fleet ----
test("F5 coverage: reads origin through a fetcher, ignores commented uses:, names exclusions", async () => {
  const { coverage, loadFleet } = await import("./coverage.ts");
  const fleet = loadFleet(join(HERE, "fleet.json"));
  for (const r of ["ncmills/cornerstone-peptide", "ncmills/kingsclothiers"]) assert.ok(fleet.sites.some((s: any) => s.repo === r), r);
  for (const r of ["claimpros", "qualify-ai", "indiamoon"]) assert.ok(fleet.excluded.some((e: any) => e.repo.toLowerCase().includes(r) && e.reason), r);
  const cfg = readFileSync(join(green(), "guards.config.json"), "utf8");
  const files: Record<string, Record<string, string>> = {
    "o/on": { ".github/workflows/guards.yml": "jobs:\n  guards:\n    uses: ncmills/shared-data/.github/workflows/site-guards.yml@main\n", "package.json": JSON.stringify({ scripts: { prebuild: "node --import tsx node_modules/shared-data/guards/run.ts ." } }), "guards.config.json": cfg },
    "o/commented": { ".github/workflows/guards.yml": "jobs:\n  guards:\n    # uses: ncmills/shared-data/.github/workflows/site-guards.yml@main\n", "package.json": "{}", "guards.config.json": cfg },
  };
  const fetch = (repo: string, path: string) => files[repo]?.[path] ?? null;
  const rows = coverage({ sites: [{ repo: "o/on" }, { repo: "o/commented" }, { repo: "o/personal", personal: true }], excluded: [] }, fetch);
  const dup = rows.find((r: any) => r.guard === "duplicate-assets")!;
  assert.equal(`${dup.covered}/${dup.total}`, "1/2");
  assert.match(dup.missing.join(), /o\/commented.*no live uses: line/);
  assert.match(dup.missing.join(), /o\/commented.*no prebuild/);
});
