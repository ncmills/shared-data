-- 2026-08-27 — is_bot / bot_reason on the SIX signal tables the first migration missed
--
-- WHY THIS FILE EXISTS
-- 2026-08-27-signal-is-bot.sql added these two columns to wp_acquisition_log and wp_plan_inputs,
-- describing them as "BOTH tables the client signals route writes". That was wrong. The route
-- writes whichever of EIGHT tables `resolveSignalTableName()` returns
-- (shared-engine/src/signals.ts:41); ALLOWED_TABLES in all four consumer repos lists all eight.
-- Two were migrated, and the consumer PRs then shipped sending is_bot/bot_reason as columns on
-- every insert.
--
-- PostgREST rejected the other six outright:
--
--   POST /rest/v1/wp_plan_selections -> 400 PGRST204
--   "Could not find the 'bot_reason' column of 'wp_plan_selections' in the schema cache"
--
-- and wrote nothing. Six of the eight signal types dropped silently on three live sites for
-- roughly two hours on 2026-08-27. The heartbeat added in D30 precisely so a dropped row would
-- not be invisible did not fire once: supabase-js defaults `shouldThrowOnError = false`, so a
-- rejected insert RESOLVES with `{ error }` and the routes' `catch` was unreachable. That is
-- fixed separately (plan-my-party#72, maid-of-honor-hq#72, handicap-hq#63) and the note in the
-- first migration -- "an INSERT naming a column that does not exist ... silently DROPS THE ROW"
-- -- turned out to be exactly right about the mechanism and one table short on the coverage.
--
-- THE LESSON WORTH KEEPING is not "we missed six tables". It is that the first migration's
-- coverage was stated as a claim about the route ("BOTH tables the route writes") that nothing
-- checked against the route. What now checks it, stated as the measured state rather than the
-- intended one -- this file exists because a comment claimed coverage nothing verified, and the
-- same mistake one paragraph later would be worse than the first:
--
--   RUNS in the suite, and so in CI:  scripts/schema-signal-columns.test.ts -- every wp_* table
--     in db/live-schema.sql carrying the signal signature must carry every column the route
--     writes. That is the snapshot-vs-ROUTE direction, i.e. this bug's direction. audit.yml
--     already globs `scripts/**/*.test.ts`, so it needs no workflow change.
--   DOES NOT run in CI:  `npm run schema:check` -- the snapshot-vs-LIVE direction, which catches
--     someone altering the database by hand without re-snapshotting. It shells the supabase CLI
--     against a linked project; an ubuntu-latest runner has neither, so it exits 2
--     ("COULD-NOT-RUN ... 0 comparisons executed -- this is NOT a pass") and would turn Audit
--     permanently red, while `continue-on-error` would make it a check that can only pass.
--     Enabling it needs a SUPABASE_ACCESS_TOKEN secret plus a CLI install step; minting that
--     credential is Nick's call. Open item, tracked in docs/schema-truth.md.
--
-- WHAT THIS DOES
-- The same two columns, with types byte-identical to the first migration so all eight agree:
--
--   is_bot     BOOLEAN NOT NULL DEFAULT false
--   bot_reason TEXT                              -- 'declared:googlebot', 'automation:curl/', NULL
--
-- is_bot=false with bot_reason IS NULL means UNCLASSIFIED, not human. Every metric spanning the
-- pre-column period must say so (D27 spec section 4, residual).
--
-- NO INDEXES, deliberately, and this is where the file departs from its sibling. The first
-- migration created partial indexes on the two high-volume tables, where read-time exclusion
-- (`WHERE NOT is_bot`) actually scans: wp_acquisition_log holds 11,334 rows and took 3,793
-- crawler rows in two days. Measured on the six, 2026-08-27:
--
--   wp_plan_selections     4,891      wp_surprise_me_actions   224
--   wp_trip_room_activity     30      wp_plan_bookmarks          0
--   wp_offer_clicks            0      wp_offer_conversions       0
--
-- Six partial indexes over that would be maintenance cost against no scan worth avoiding. If
-- offer_clicks/offer_conversions ever carry real affiliate volume, index them then, with the
-- row count that justified it in the commit message.
--
-- SAFETY
-- ADD COLUMN with a non-volatile DEFAULT is metadata-only in PostgreSQL 11+ — no table rewrite,
-- no lock beyond a brief ACCESS EXCLUSIVE, on tables of at most 4,891 rows. Existing rows are
-- untouched. IF NOT EXISTS makes it idempotent, which matters here because it was applied
-- before it was written (see APPLY).
--
-- APPLY — already applied, and the ordering is the opposite of the sibling's for a reason.
-- The sibling says "IT MUST LAND BEFORE ANY CONSUMER WRITES THESE COLUMNS". By the time this
-- gap was found the consumers were already live and dropping rows, so the columns went on FIRST,
-- by hand, at 14:51 on 2026-08-27, to stop the bleed; this file is the record catching up with
-- the database rather than leading it. Verified independently afterwards by asking PostgREST for
-- the columns on each of the eight tables -- the same schema cache that produced the PGRST204 --
-- and `npm run schema:snapshot` regenerated db/live-schema.sql from pg_catalog so the repo's
-- description matches the database again. That snapshot diff, not this file, is the proof.

ALTER TABLE wp_surprise_me_actions
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;

ALTER TABLE wp_plan_selections
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;

ALTER TABLE wp_plan_bookmarks
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;

ALTER TABLE wp_offer_clicks
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;

ALTER TABLE wp_offer_conversions
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;

ALTER TABLE wp_trip_room_activity
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;
