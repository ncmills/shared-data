-- Migration: signal capture tables
-- Date: 2026-04-16
-- Project: shared Supabase `bzmehrytiudgmgdrdlkg` (per reference_lead_capture_architecture)
--
-- Apply via the Supabase SQL editor on the shared project. After applying,
-- the /api/signals routes on MOH HQ + BESTMAN HQ + Tour de Fore will start
-- writing rows. No application code reads these tables yet — feedback loops
-- (scoring-weight tuner, Surprise Me overlay builder, page-priority ranker,
-- prompt A/B harness, offer ranker) are follow-up work per
-- project_iterative_engine_0415.md.
--
-- Schema design: every table is an insert-only log with the same shape.
-- Payload is jsonb so we can query without schema migrations as we add
-- new signals. session_id is a rolling SHA-256 hash of (IP, day-bucket,
-- UA) — set server-side in /api/signals, never trusted from client.

-- 1. plan_inputs — fires once per plan_generated, holds the full WizardState
CREATE TABLE IF NOT EXISTS plan_inputs (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plan_inputs_brand_created ON plan_inputs (brand, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_inputs_session ON plan_inputs (session_id);

-- 2. surprise_me_actions — fires on Surprise Me click + on later override
CREATE TABLE IF NOT EXISTS surprise_me_actions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sma_brand_created ON surprise_me_actions (brand, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sma_session ON surprise_me_actions (session_id);

-- 3. plan_selections — fires when user picks a tier or destination on result page
CREATE TABLE IF NOT EXISTS plan_selections (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ps_brand_created ON plan_selections (brand, created_at DESC);

-- 4. plan_bookmarks — fires when user pins/saves an itinerary item (R3+)
CREATE TABLE IF NOT EXISTS plan_bookmarks (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pb_brand_created ON plan_bookmarks (brand, created_at DESC);

-- 5. offer_clicks — fires on affiliate offer click (R1+)
CREATE TABLE IF NOT EXISTS offer_clicks (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oc_brand_created ON offer_clicks (brand, created_at DESC);

-- 6. offer_conversions — fires from network postback (R1+)
CREATE TABLE IF NOT EXISTS offer_conversions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ocon_brand_created ON offer_conversions (brand, created_at DESC);

-- 7. trip_room_activity — fires on collaborative room edits (R3+)
CREATE TABLE IF NOT EXISTS trip_room_activity (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tra_brand_created ON trip_room_activity (brand, created_at DESC);

-- 8. acquisition_log — fires on first session pageview with q/referrer
CREATE TABLE IF NOT EXISTS acquisition_log (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('moh', 'bestman', 'tdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_al_brand_created ON acquisition_log (brand, created_at DESC);

-- Rate-limit table for /api/signals — sliding window per session_id.
-- Cleaner than in-memory limits since serverless functions are stateless.
CREATE TABLE IF NOT EXISTS signal_rate_limit (
  session_id TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, hour_bucket)
);
CREATE INDEX IF NOT EXISTS idx_srl_bucket ON signal_rate_limit (hour_bucket);

-- (Optional) Read-only views for the feedback loops to consume.
-- These are documented but not required at table-create time. The
-- scoring-weight tuner / page-priority ranker scripts will define the
-- views they need against this base schema.
