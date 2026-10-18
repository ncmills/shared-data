import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SITES, gitBlobSha } from "./suitability.ts";
import { buildSlice, renderSlice, checkSlices, slicePath } from "./slice.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(p, "utf8");
const suit = (s: string) => JSON.parse(read(resolve(ROOT, "suitability", `${s}.json`)));
const slice = (s: string) => JSON.parse(read(slicePath(s)));
/** append one row line to a committed slice's text (the file is one row per line) */
const inject = (text: string, row: object) => text.replace(/\n  \]\n\}\n$/, `,\n    ${JSON.stringify(row)}\n  ]\n}\n`);

test("committed slices pass --check as they are", () => {
  assert.deepEqual(checkSlices(), []);
});

test("each slice = suitability rows minus that site's own `no` rows (count and ids)", () => {
  for (const site of SITES) {
    const s = suit(site), sl = slice(site);
    const kept = s.rows.filter((r: any) => r.eligible !== "no").map((r: any) => r.id).sort();
    assert.equal(sl.rows.length, s.rows.length - s.counts.no, site);
    assert.deepEqual(sl.rows.map((r: any) => r.id), kept, site);
    assert.equal(sl.counts.droppedNo, s.counts.no, site);
    assert.ok(sl.rows.every((r: any) => r.eligible !== "no"), `${site}: no "no" row`);
  }
});

test("header carries the source file's git blob sha; body has no generation timestamp; rows sorted by id", () => {
  for (const site of SITES) {
    const sl = slice(site);
    assert.equal(sl.source.gitBlobSha, gitBlobSha(read(resolve(ROOT, "suitability", `${site}.json`))), site);
    const ids = sl.rows.map((r: any) => r.id);
    assert.deepEqual(ids, [...ids].sort(), `${site}: sorted`);
    assert.equal(sl.generatedAt, undefined);
  }
});

test("a slice row carries only its own site's reason, rule ids and rubric (no foreign site token)", () => {
  for (const site of SITES) {
    for (const r of slice(site).rows) {
      if (r.reason) assert.ok(r.reason.startsWith(`${site}-`), `${site}: ${r.id} reason ${r.reason}`);
      for (const x of r.rules ?? []) assert.ok(x.startsWith(`${site}-`), `${site}: ${r.id} rule ${x}`);
    }
  }
});

test("deterministic: building twice gives identical bytes", () => {
  for (const site of SITES) {
    const t = read(resolve(ROOT, "suitability", `${site}.json`));
    assert.equal(renderSlice(buildSlice(site, t)), renderSlice(buildSlice(site, t)));
  }
});

// ── positive control (M8 gate): hand-planted leaks must make --check fail ────────────────────────
test("POSITIVE CONTROL: a moh-only reason hand-injected into the bestman slice fails --check", () => {
  const planted = { id: "zz-planted--moh-reason", eligible: "unreviewed", reason: "moh-golf" };
  const text = inject(read(slicePath("bestman")), planted);
  const full = checkSlices({ sliceText: { bestman: text } });
  assert.ok(full.some((x) => /bestman/.test(x)), "full check fails on the planted moh reason");
  // the content check must catch it ON ITS OWN, with the drift comparison switched off
  const content = checkSlices({ sliceText: { bestman: text }, skipDrift: true });
  assert.ok(content.some((x) => /bestman.*moh-golf/.test(x)), `content check names the foreign reason: ${content.join(" | ")}`);
  // same for a foreign rule id, a foreign rubric version and a foreign run id
  for (const row of [
    { id: "zz-planted--rules", eligible: "unreviewed", rules: ["moh-golf"] },
    { id: "zz-planted--rubric", eligible: "scored", class: "fit", fit: 0.5, reason: "bestman-x: ok", provenance: { tagger: "llm", promptOrRulesVersion: "rubric-moh@1.3.0+abc", runId: "m5-fullrun-bestman-b01" } },
    { id: "zz-planted--run", eligible: "scored", class: "fit", fit: 0.5, reason: "bestman-x: ok", provenance: { tagger: "llm", promptOrRulesVersion: "rubric-bestman@1.1.0+abc", runId: "m5-fullrun-moh-b01" } },
  ])
    assert.ok(checkSlices({ sliceText: { bestman: inject(read(slicePath("bestman")), row) }, skipDrift: true }).length > 0, row.id);
});

test("POSITIVE CONTROL: a `no` row hand-injected into the moh slice fails --check", () => {
  const noRow = suit("moh").rows.find((r: any) => r.eligible === "no");
  const text = inject(read(slicePath("moh")), noRow);
  assert.ok(checkSlices({ sliceText: { moh: text } }).some((x) => /moh/.test(x)), "full check fails on the planted no row");
  const content = checkSlices({ sliceText: { moh: text }, skipDrift: true });
  assert.ok(content.some((x) => /moh.*no/.test(x)), `content check names the no row: ${content.join(" | ")}`);
  // a row the SOURCE marks no, planted with eligible flipped to unreviewed, is caught too
  const disguised = inject(read(slicePath("moh")), { id: noRow.id, eligible: "unreviewed" });
  assert.ok(checkSlices({ sliceText: { moh: disguised }, skipDrift: true }).some((x) => /moh/.test(x)), "disguised no row caught");
});

test("a stale slice (source changed, slice not regenerated) fails --check", () => {
  const text = read(slicePath("offsite")).replace(/"gitBlobSha": "[0-9a-f]{40}"/, `"gitBlobSha": "${"0".repeat(40)}"`);
  assert.ok(checkSlices({ sliceText: { offsite: text } }).some((x) => /offsite.*stale/.test(x)));
});
