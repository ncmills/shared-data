// snapshot-schema.sh --check: SCHEMA_FRESH_OUT hands the freshly rendered snapshot out on a
// mismatch (so CI can upload it) and changes nothing when unset. `supabase` is a stub on PATH
// that returns one tiny, different schema -- no network, no credentials.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "snapshot-schema.sh");

function fakeSupabase(dir: string) {
  const bin = join(dir, "bin");
  spawnSync("mkdir", ["-p", bin]);
  const stub = join(bin, "supabase");
  // Dispatch on which pg_catalog view the query reads.
  writeFileSync(
    stub,
    `#!/usr/bin/env bash
q="\${@: -1}"
case "$q" in
  *pg_attribute*) echo '[{"tbl":"stub_t","ord":1,"col":"id","typ":"uuid","notnull":true,"dflt":null,"generated":false}]' ;;
  *pg_constraint*) echo '[{"tbl":"stub_t","conname":"stub_t_pkey","def":"PRIMARY KEY (id)","contype":"p"}]' ;;
  *pg_indexes*) echo '[{"tbl":"stub_t","indexname":"stub_t_pkey","indexdef":"CREATE UNIQUE INDEX stub_t_pkey ON public.stub_t USING btree (id)"}]' ;;
esac
`,
  );
  chmodSync(stub, 0o755);
  return bin;
}

function run(extraEnv: Record<string, string>, bin: string) {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extraEnv, PATH: `${bin}:${process.env.PATH}` };
  delete env.SCHEMA_FRESH_OUT;
  Object.assign(env, extraEnv);
  return spawnSync("bash", [SCRIPT, "--check"], { env, encoding: "utf8" });
}

test("--check mismatch: exit 1 and SCHEMA_FRESH_OUT is written", () => {
  const dir = mkdtempSync(join(tmpdir(), "snapschema-"));
  try {
    const out = join(dir, "fresh.sql");
    const r = run({ SCHEMA_FRESH_OUT: out }, fakeSupabase(dir));
    assert.equal(r.status, 1, r.stderr);
    assert.ok(existsSync(out), "fresh snapshot not written");
    assert.match(readFileSync(out, "utf8"), /stub_t/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--check mismatch with SCHEMA_FRESH_OUT unset: exit 1 and no file", () => {
  const dir = mkdtempSync(join(tmpdir(), "snapschema-"));
  try {
    const r = run({}, fakeSupabase(dir));
    assert.equal(r.status, 1, r.stderr);
    assert.ok(!existsSync(join(dir, "fresh.sql")));
    assert.doesNotMatch(r.stderr, /fresh snapshot written/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
