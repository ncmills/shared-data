-- 2026-08-27 — is_bot / bot_reason on the signal tables written by /api/signals
--
-- WHY
-- On 2026-08-26/27 a crawler walked handicaphq.com's pSEO surface. It wrote 3,793 rows into
-- wp_acquisition_log -- 3,758 on `handicap` across 1,585 distinct landing pages, one session
-- each, 99.7% desktop, 0.8% carrying a referrer. Handicap's 30-day acquisition figure is 5.9x
-- overstated. moh, bestman and offsite are exactly 1.0x, so this is one crawler on one site
-- over two days, not a drift.
--
-- The write path already parses the User-Agent (it hashes it into session_id) and then throws
-- it away. So the fleet had, at the moment of insert, the one fact that answers "was this a
-- person?" -- and stored a number that could not be told apart from 3,758 visitors.
--
-- WHAT THIS DOES
-- Adds two columns to BOTH tables the client signals route writes (ALLOWED_TABLES in all four
-- repos contains plan_inputs and acquisition_log):
--
--   is_bot     BOOLEAN NOT NULL DEFAULT false
--   bot_reason TEXT                              -- 'declared:googlebot', 'automation:curl/', NULL
--
-- NOT NULL DEFAULT false is deliberate. A nullable flag would make three different states share
-- one value -- "not a bot", "not yet classified", and "the classifier failed" -- and this fleet
-- spent 2026-08-27 removing exactly that ambiguity. The distinction is carried instead by
-- bot_reason: is_bot=false with bot_reason IS NULL means UNCLASSIFIED, not human, and every
-- metric spanning the pre-column period must say so (see D27 spec section 4, residual).
--
-- SAFETY
-- ADD COLUMN with a non-volatile DEFAULT is metadata-only in PostgreSQL 11+ -- no table rewrite,
-- no lock beyond a brief ACCESS EXCLUSIVE, on tables of 11k and 363 rows. Existing rows are
-- untouched and read back exactly as before.
--
-- IT MUST LAND BEFORE ANY CONSUMER WRITES THESE COLUMNS, and the reason is sharper than
-- ordering hygiene: all four signals routes wrap the insert in try/catch -> console.warn ->
-- return 204. An INSERT naming a column that does not exist therefore does not error the
-- request -- it silently DROPS THE ROW. Landing a consumer first would not produce untagged
-- rows, it would produce no rows, and nothing in the system would report it. (That blindness is
-- its own defect, D30.)
--
-- APPLY
-- This file is a history of intentions, per docs/schema-truth.md. Applied once, by hand, via
--   supabase db query --linked "<the two ALTER statements>"
-- from a repo linked to bzmehrytiudgmgdrdlkg, then `npm run schema:snapshot` to regenerate
-- db/live-schema.sql from pg_catalog so the repo's description matches the database again.
-- NOT applied as part of merging this file.

ALTER TABLE wp_acquisition_log
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;

ALTER TABLE wp_plan_inputs
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason TEXT;

-- Read-time exclusion is `WHERE NOT is_bot`, which uses this on the only two columns that
-- matter for it. Partial, because the rows worth indexing are the minority.
CREATE INDEX IF NOT EXISTS idx_acquisition_is_bot
  ON wp_acquisition_log (created_at) WHERE is_bot;
CREATE INDEX IF NOT EXISTS idx_plan_inputs_is_bot
  ON wp_plan_inputs (created_at) WHERE is_bot;
