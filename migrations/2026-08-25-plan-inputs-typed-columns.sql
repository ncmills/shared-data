-- 2026-08-25 — typed join keys on wp_plan_inputs
--
-- WHY
-- Every signal table is (id, session_id, brand, created_at, payload JSONB): all meaning
-- lives in the blob. Four brands then invented four vocabularies for the same concepts —
--
--   concept        moh / bestman      handicap                      offsite
--   group size     groupSize          groupSize                     headcount
--   duration       numberOfDays       numberOfDays                  nights
--   destination    cityChosen         specificCity / pickedCities   cityChosen
--   budget         budget             budget                        budgetPerPersonCap
--
-- so no single query could answer "which destinations convert" or "what group size
-- converts best" across the portfolio. Every cross-brand question required per-brand
-- special-casing in application code, and returned a quietly wrong answer the day a key
-- was renamed, with nothing able to notice.
--
-- WHAT THIS DOES
-- Puts the vocabulary mapping in ONE place — the database — as GENERATED ALWAYS ... STORED
-- columns. Deliberately generated rather than written by the apps:
--   * no application change in any of the four repos, so no repo can drift from the mapping
--   * historical rows are covered identically to new rows (all 361 backfilled on creation)
--   * the mapping cannot rot, because it is computed rather than remembered
--
-- SAFETY
-- Every expression is total and immutable. The numeric ones are guarded by jsonb_typeof so a
-- future string value yields NULL instead of raising — a generated column that can raise would
-- turn a malformed payload into a failed INSERT, i.e. silent signal loss, which is the exact
-- failure class this migration exists to reduce.
--
-- budget is stored RAW, on purpose. It is a free-text band with at least 12 incompatible
-- encodings inside a single brand ('500-1000', 'mid', '$2000+ per person', '1500-2500', '').
-- Parsing that into cents would fabricate precision the source does not have.

ALTER TABLE wp_plan_inputs
  ADD COLUMN IF NOT EXISTS destination_slug text GENERATED ALWAYS AS (
    nullif(btrim(lower(coalesce(
      payload->>'cityChosen',
      payload->>'specificCity',
      payload->'pickedCities'->>0
    ))), '')
  ) STORED,
  ADD COLUMN IF NOT EXISTS group_size int GENERATED ALWAYS AS (
    case when jsonb_typeof(payload->'groupSize') = 'number' then (payload->>'groupSize')::numeric::int
         when jsonb_typeof(payload->'headcount') = 'number' then (payload->>'headcount')::numeric::int end
  ) STORED,
  ADD COLUMN IF NOT EXISTS nights int GENERATED ALWAYS AS (
    case when jsonb_typeof(payload->'numberOfDays') = 'number' then (payload->>'numberOfDays')::numeric::int
         when jsonb_typeof(payload->'nights') = 'number' then (payload->>'nights')::numeric::int end
  ) STORED,
  ADD COLUMN IF NOT EXISTS budget_raw text GENERATED ALWAYS AS (
    nullif(btrim(coalesce(payload->>'budget', payload->>'budgetPerPersonCap')), '')
  ) STORED;

-- destination_key collapses separator-only spelling differences ("nashville, tn" and
-- "nashville-tn" are the same place). It deliberately does NOT strip the state suffix:
-- "portland-or" and "portland-me" are different cities, and merging them would trade a
-- visible undercount for an invisible wrong answer. Collapsing "nashville" into
-- "nashville-tn" needs a foreign key to the shared-data catalog, not a regex.
ALTER TABLE wp_plan_inputs
  ADD COLUMN IF NOT EXISTS destination_key text GENERATED ALWAYS AS (
    nullif(regexp_replace(regexp_replace(
      btrim(lower(coalesce(payload->>'cityChosen', payload->>'specificCity', payload->'pickedCities'->>0))),
      '[,[:space:]]+', '-', 'g'), '-+', '-', 'g'), '')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_wp_plan_inputs_destination
  ON wp_plan_inputs (destination_slug) WHERE destination_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wp_plan_inputs_brand_destination
  ON wp_plan_inputs (brand, destination_slug);
CREATE INDEX IF NOT EXISTS idx_wp_plan_inputs_destination_key
  ON wp_plan_inputs (destination_key) WHERE destination_key IS NOT NULL;

-- APPLIED to bzmehrytiudgmgdrdlkg on 2026-08-25 via `supabase db query --linked`.
-- VERIFIED after apply: 361/361 rows carry destination_slug, group_size and nights;
-- 324/361 carry budget_raw (the remaining 37 are genuinely empty in the source).
