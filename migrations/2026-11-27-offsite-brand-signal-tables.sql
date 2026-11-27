-- 2026-11-27 -- allow brand 'offsite' on the four wp_* signal tables that reject it (SWEEP-1055)
--
-- Offsite Outpost's /api/signals route inserts brand='offsite' into the wp_* signal tables.
-- Four of the eight reject it with 23514 (check violation): wp_offer_clicks, wp_offer_conversions,
-- wp_surprise_me_actions, wp_trip_room_activity. The other four already allow it.
-- Source of truth for current lists: db/live-schema.sql. Apply by hand (Supabase SQL editor), CONTROL only.
-- Constraint names are the live ones on the wp_* tables (no wp_ prefix). Atomic: one transaction.

BEGIN;

ALTER TABLE public.wp_offer_clicks DROP CONSTRAINT offer_clicks_brand_check;
ALTER TABLE public.wp_offer_clicks ADD CONSTRAINT offer_clicks_brand_check
  CHECK (brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text, 'offsite'::text]));

ALTER TABLE public.wp_offer_conversions DROP CONSTRAINT offer_conversions_brand_check;
ALTER TABLE public.wp_offer_conversions ADD CONSTRAINT offer_conversions_brand_check
  CHECK (brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text, 'offsite'::text]));

ALTER TABLE public.wp_surprise_me_actions DROP CONSTRAINT surprise_me_actions_brand_check;
ALTER TABLE public.wp_surprise_me_actions ADD CONSTRAINT surprise_me_actions_brand_check
  CHECK (brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text, 'offsite'::text]));

ALTER TABLE public.wp_trip_room_activity DROP CONSTRAINT trip_room_activity_brand_check;
ALTER TABLE public.wp_trip_room_activity ADD CONSTRAINT trip_room_activity_brand_check
  CHECK (brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text, 'offsite'::text]));

COMMIT;
