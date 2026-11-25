import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SIGNAL_ROW_COLUMNS,
  findSignalSchemaGaps,
  parseSnapshot,
  signalTablesIn,
} from "./schema-signal-columns.ts";

const SNAPSHOT = readFileSync(join(import.meta.dirname, "..", "db", "live-schema.sql"), "utf8");

// ── the real snapshot ───────────────────────────────────────────────────────────────────
test("every signal table in the live snapshot carries every column the route writes", () => {
  const gaps = findSignalSchemaGaps(SNAPSHOT);
  assert.deepEqual(
    gaps,
    [],
    "a signal table is missing a column /api/signals writes on every insert. PostgREST will " +
      "reject those inserts with 400 PGRST204 and write NOTHING, and the route returns 204 " +
      "either way, so the rows vanish silently. Run `npm run schema:snapshot` after applying " +
      "the migration:\n" +
      gaps.map((g) => `  ${g.table} lacks ${g.missing.join(", ")}`).join("\n"),
  );
});

test("the check examined all eight signal tables — a parse failure must not read as a pass", () => {
  // Zero gaps is the same answer whether every table is correct or the snapshot could not be
  // parsed at all. Only the denominator tells those apart (standing rule 26).
  const found = signalTablesIn(SNAPSHOT).sort();
  assert.deepEqual(found, [
    "wp_acquisition_log",
    "wp_offer_clicks",
    "wp_offer_conversions",
    "wp_plan_bookmarks",
    "wp_plan_inputs",
    "wp_plan_selections",
    "wp_surprise_me_actions",
    "wp_trip_room_activity",
  ]);
});

// ── positive control: it must actually fail ─────────────────────────────────────────────
test("stripping one column from one table fails, naming the table and the column", () => {
  // Exactly the state production was in between the two migrations.
  const broken = SNAPSHOT.replace(
    /(CREATE TABLE public\.wp_plan_selections \(\n[\s\S]*?)\n {2}bot_reason text,/,
    "$1",
  );
  assert.notEqual(broken, SNAPSHOT, "the fixture edit did not apply — the control proves nothing");
  const gaps = findSignalSchemaGaps(broken);
  assert.deepEqual(gaps, [{ table: "wp_plan_selections", missing: ["bot_reason"] }]);
});

test("a table that loses the is_bot column is still recognised as a signal table", () => {
  // The signature is session_id+brand+payload, NOT the full column set. If it were the full
  // set, a table missing is_bot would stop matching and the check would pass by losing its
  // subject — a guard that cannot fail, which is the exact class of defect this file exists
  // to close.
  const broken = SNAPSHOT.replace(
    /(CREATE TABLE public\.wp_offer_clicks \(\n[\s\S]*?)\n {2}is_bot boolean DEFAULT false NOT NULL,/,
    "$1",
  );
  assert.notEqual(broken, SNAPSHOT, "the fixture edit did not apply");
  assert.ok(signalTablesIn(broken).includes("wp_offer_clicks"));
  assert.deepEqual(findSignalSchemaGaps(broken), [
    { table: "wp_offer_clicks", missing: ["is_bot"] },
  ]);
});

// ── negative controls: it must not fire on things that are fine ─────────────────────────
test("the unprefixed 2026-04-22 twins are out of scope and do not fail the check", () => {
  // public.acquisition_log, public.plan_selections and the rest survive the namespace rename,
  // match the signal signature exactly, and carry none of these columns because nothing writes
  // to them. Without the wp_ scope this check would report eight permanent failures nobody can
  // act on — and a permanently red check gets muted.
  const unprefixed = parseSnapshot(SNAPSHOT)
    .filter((t) => !t.table.startsWith("wp_") && ["acquisition_log", "plan_selections"].includes(t.table));
  assert.ok(unprefixed.length >= 1, "the twins vanished — if the rename was finished, drop this test");
  for (const t of unprefixed) assert.equal(t.columns.has("is_bot"), false);
  assert.deepEqual(findSignalSchemaGaps(SNAPSHOT), []);
});

test("a non-signal wp_ table is ignored — the control that stops 'every table needs is_bot'", () => {
  const leads = parseSnapshot(SNAPSHOT).find((t) => t.table === "wp_leads");
  assert.ok(leads, "wp_leads not in the snapshot");
  assert.equal(leads!.columns.has("is_bot"), false);
  assert.ok(!signalTablesIn(SNAPSHOT).includes("wp_leads"));
});

test("SIGNAL_ROW_COLUMNS is the row the route actually builds", () => {
  assert.deepEqual([...SIGNAL_ROW_COLUMNS], [
    "session_id", "brand", "payload", "is_bot", "bot_reason",
  ]);
});
