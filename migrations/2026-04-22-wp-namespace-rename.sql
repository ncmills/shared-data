-- Migration: rename wedding-planning tables to wp_* namespace
-- Date: 2026-04-22
-- Project: shared Supabase `bzmehrytiudgmgdrdlkg`
--
-- Phase 3 of the Trip Room V1.2 deploy collapses the MOH + BESTMAN
-- backend into `shared-engine/src/room/*`. While we're in the shared
-- project, rename every wedding-planning table with a `wp_` prefix so
-- there's no ambiguity with the lead-capture tables (owned by
-- DoppelWriter, Peptide Stack, IDHW, imfrustrated) that also live in
-- the same database.
--
-- Non-wedding-planning tables (bestman_subscribers, email_subscribers,
-- funnel_events, imfrustrated_intake, mohhq_subscribers, tdf_subscribers,
-- trip_bookings, will_stats, wpd_leads) stay unprefixed.
--
-- After this runs, `shared-engine/src/room/tables.ts` already points at
-- the `wp_*` names, and both repo thin wrappers consume TABLES.* — so
-- callsites need no further edits beyond the ones shipped in Phase 3.
--
-- All 12 renames execute inside a single transaction so the rename is
-- atomic; a failure mid-way leaves every table under its old name.
-- Re-running is safe: each ALTER is guarded by a lookup against
-- information_schema.

BEGIN;

DO $$
DECLARE
  old_names TEXT[] := ARRAY[
    'trip_room_members',
    'trip_room_slot_votes',
    'trip_room_personal_items',
    'trip_room_activity',
    'plan_inputs',
    'plan_selections',
    'surprise_me_actions',
    'plan_bookmarks',
    'offer_clicks',
    'offer_conversions',
    'acquisition_log',
    'signal_rate_limit'
  ];
  old_name TEXT;
  new_name TEXT;
BEGIN
  FOREACH old_name IN ARRAY old_names LOOP
    new_name := 'wp_' || old_name;
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = old_name
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = new_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I;', old_name, new_name);
      RAISE NOTICE 'Renamed % → %', old_name, new_name;
    ELSE
      RAISE NOTICE 'Skipped % (already renamed, or missing)', old_name;
    END IF;
  END LOOP;
END $$;

COMMIT;
