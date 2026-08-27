-- LIVE SCHEMA SNAPSHOT - public schema of Supabase project bzmehrytiudgmgdrdlkg
--
-- GENERATED. Do not hand-edit. Regenerate with: npm run schema:snapshot
--
-- This file exists because the repo did not describe the database. migrations/*.sql
-- were applied by hand in the Supabase SQL editor, so committed DDL and live DDL
-- diverged with nothing able to notice. The canonical example: the committed
-- signal-tables migration declares CHECK (brand IN ('moh','bestman','tdf')) while the
-- live constraint has permitted 'offsite' and 'handicap' since 2026-06-26.
--
-- A snapshot is not a migration history. It answers 'what is actually there', which
-- is the question the repo previously could not answer at all.

CREATE TABLE public.accounts (
  site text NOT NULL,
  email text NOT NULL,
  name text,
  password_hash text,
  data jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT accounts_site_check CHECK ((site = ANY (ARRAY['bmhq'::text, 'moh'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT accounts_pkey PRIMARY KEY (site, email)
);
CREATE INDEX accounts_email_idx ON public.accounts USING btree (email);

CREATE TABLE public.acquisition_log (
  id bigint DEFAULT nextval('acquisition_log_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT acquisition_log_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT acquisition_log_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX acquisition_log_pkey1 ON public.acquisition_log USING btree (id);

CREATE TABLE public.aissdi_subscribers (
  email text NOT NULL,
  source_page text,
  user_agent text,
  ip_hash text,
  metadata jsonb,
  subscribed_at timestamp with time zone DEFAULT now() NOT NULL,
  unsubscribed_at timestamp with time zone,
  CONSTRAINT aissdi_subscribers_pkey PRIMARY KEY (email)
);

CREATE TABLE public.bestman_subscribers (
  id bigint DEFAULT nextval('bestman_subscribers_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  source text,
  city text,
  group_size integer,
  budget numeric,
  ip text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT bestman_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT bestman_subscribers_email_key UNIQUE (email)
);
CREATE INDEX bestman_subscribers_created_at_idx ON public.bestman_subscribers USING btree (created_at DESC);
CREATE UNIQUE INDEX bestman_subscribers_email_key ON public.bestman_subscribers USING btree (email);

CREATE TABLE public.bestman_trip_submissions (
  id bigint DEFAULT nextval('bestman_trip_submissions_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  name text,
  city text,
  dates text,
  tier text,
  hero_moment text NOT NULL,
  takeaway text,
  photo_url text,
  ip text,
  status text DEFAULT 'pending'::text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT bestman_trip_submissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'featured'::text, 'rejected'::text]))),
  CONSTRAINT bestman_trip_submissions_pkey PRIMARY KEY (id)
);
CREATE INDEX bestman_trip_submissions_status_created_idx ON public.bestman_trip_submissions USING btree (status, created_at DESC);

CREATE TABLE public.crew_responses (
  id bigint NOT NULL,
  site text NOT NULL,
  plan_id text NOT NULL,
  email text NOT NULL,
  name text,
  vote_tier text,
  rsvp_status text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT crew_responses_rsvp_status_check CHECK ((rsvp_status = ANY (ARRAY['in'::text, 'out'::text, 'maybe'::text]))),
  CONSTRAINT crew_responses_site_check CHECK ((site = ANY (ARRAY['bmhq'::text, 'moh'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT crew_responses_pkey PRIMARY KEY (id),
  CONSTRAINT crew_responses_site_plan_id_email_key UNIQUE (site, plan_id, email)
);
CREATE INDEX crew_responses_plan_idx ON public.crew_responses USING btree (site, plan_id);
CREATE UNIQUE INDEX crew_responses_site_plan_id_email_key ON public.crew_responses USING btree (site, plan_id, email);

CREATE TABLE public.email_subscribers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  state text,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  CONSTRAINT email_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT email_subscribers_email_key UNIQUE (email)
);
CREATE UNIQUE INDEX email_subscribers_email_key ON public.email_subscribers USING btree (email);

CREATE TABLE public.funnel_events (
  id bigint NOT NULL,
  event text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funnel_events_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_funnel_events_created ON public.funnel_events USING btree (created_at);
CREATE INDEX idx_funnel_events_event ON public.funnel_events USING btree (event);

CREATE TABLE public.imfrustrated_intake (
  id bigint DEFAULT nextval('imfrustrated_intake_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  state text,
  issue_type text,
  message text,
  ip text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT imfrustrated_intake_pkey PRIMARY KEY (id)
);
CREATE INDEX imfrustrated_intake_created_at_idx ON public.imfrustrated_intake USING btree (created_at DESC);
CREATE INDEX imfrustrated_intake_email_idx ON public.imfrustrated_intake USING btree (email);

CREATE TABLE public.moh_trip_submissions (
  id bigint DEFAULT nextval('moh_trip_submissions_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  name text,
  city text,
  dates text,
  tier text,
  hero_moment text NOT NULL,
  takeaway text,
  photo_url text,
  ip text,
  status text DEFAULT 'pending'::text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT moh_trip_submissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'featured'::text, 'rejected'::text]))),
  CONSTRAINT moh_trip_submissions_pkey PRIMARY KEY (id)
);
CREATE INDEX moh_trip_submissions_status_created_idx ON public.moh_trip_submissions USING btree (status, created_at DESC);

CREATE TABLE public.mohhq_subscribers (
  id bigint DEFAULT nextval('mohhq_subscribers_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  source text,
  city text,
  group_size integer,
  budget numeric,
  ip text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT mohhq_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT mohhq_subscribers_email_key UNIQUE (email)
);
CREATE INDEX mohhq_subscribers_created_at_idx ON public.mohhq_subscribers USING btree (created_at DESC);
CREATE UNIQUE INDEX mohhq_subscribers_email_key ON public.mohhq_subscribers USING btree (email);

CREATE TABLE public.offer_clicks (
  id bigint DEFAULT nextval('offer_clicks_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT offer_clicks_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT offer_clicks_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX offer_clicks_pkey1 ON public.offer_clicks USING btree (id);

CREATE TABLE public.offer_conversions (
  id bigint DEFAULT nextval('offer_conversions_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT offer_conversions_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT offer_conversions_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX offer_conversions_pkey1 ON public.offer_conversions USING btree (id);

CREATE TABLE public.ops_heartbeats (
  site text NOT NULL,
  cron_path text NOT NULL,
  last_success_at timestamp with time zone,
  last_status text,
  last_error text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ops_heartbeats_pkey PRIMARY KEY (site, cron_path)
);

CREATE TABLE public.orders (
  id text NOT NULL,
  site text NOT NULL,
  email text,
  status text,
  amount_cents integer,
  currency text,
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT orders_site_check CHECK ((site = ANY (ARRAY['bmhq'::text, 'moh'::text, 'tdf'::text]))),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);
CREATE INDEX orders_email_idx ON public.orders USING btree (email);
CREATE INDEX orders_site_idx ON public.orders USING btree (site);

CREATE TABLE public.plan_bookmarks (
  id bigint DEFAULT nextval('plan_bookmarks_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT plan_bookmarks_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT plan_bookmarks_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX plan_bookmarks_pkey1 ON public.plan_bookmarks USING btree (id);

CREATE TABLE public.plan_inputs (
  id bigint DEFAULT nextval('plan_inputs_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT plan_inputs_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT plan_inputs_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX plan_inputs_pkey1 ON public.plan_inputs USING btree (id);

CREATE TABLE public.plan_selections (
  id bigint DEFAULT nextval('plan_selections_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT plan_selections_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT plan_selections_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX plan_selections_pkey1 ON public.plan_selections USING btree (id);

CREATE TABLE public.signal_rate_limit (
  session_id text NOT NULL,
  hour_bucket timestamp with time zone NOT NULL,
  count integer DEFAULT 1 NOT NULL,
  CONSTRAINT signal_rate_limit_pkey1 PRIMARY KEY (session_id, hour_bucket)
);
CREATE UNIQUE INDEX signal_rate_limit_pkey1 ON public.signal_rate_limit USING btree (session_id, hour_bucket);

CREATE TABLE public.surprise_me_actions (
  id bigint DEFAULT nextval('surprise_me_actions_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT surprise_me_actions_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT surprise_me_actions_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX surprise_me_actions_pkey1 ON public.surprise_me_actions USING btree (id);

CREATE TABLE public.tdf_subscribers (
  id bigint DEFAULT nextval('tdf_subscribers_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  source text,
  group_size integer,
  trip_state text,
  ip text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT tdf_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT tdf_subscribers_email_key UNIQUE (email)
);
CREATE INDEX tdf_subscribers_created_at_idx ON public.tdf_subscribers USING btree (created_at DESC);
CREATE UNIQUE INDEX tdf_subscribers_email_key ON public.tdf_subscribers USING btree (email);

CREATE TABLE public.trip_bookings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_id text NOT NULL,
  item_path text,
  partner text NOT NULL,
  click_session_hash text NOT NULL,
  deep_link_url text NOT NULL,
  clicked_at timestamp with time zone DEFAULT now() NOT NULL,
  converted_at timestamp with time zone,
  converted_value_cents integer,
  CONSTRAINT trip_bookings_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_trip_bookings_partner ON public.trip_bookings USING btree (partner, clicked_at DESC);
CREATE INDEX idx_trip_bookings_plan ON public.trip_bookings USING btree (plan_id);

CREATE TABLE public.trip_room_activity (
  id bigint DEFAULT nextval('trip_room_activity_id_seq1'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  CONSTRAINT trip_room_activity_brand_check1 CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text]))),
  CONSTRAINT trip_room_activity_pkey1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX trip_room_activity_pkey1 ON public.trip_room_activity USING btree (id);

CREATE TABLE public.will_stats (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_date date DEFAULT CURRENT_DATE,
  state text NOT NULL,
  marital_status text NOT NULL,
  has_children boolean NOT NULL,
  child_count integer NOT NULL,
  has_minor_children boolean NOT NULL,
  has_special_needs_children boolean NOT NULL,
  has_guardian boolean NOT NULL,
  has_specific_bequests boolean NOT NULL,
  bequest_count integer NOT NULL,
  has_real_estate_bequests boolean NOT NULL,
  residuary_type text NOT NULL,
  residuary_beneficiary_count integer NOT NULL,
  include_digital_assets boolean NOT NULL,
  has_pets boolean NOT NULL,
  has_disinheritances boolean NOT NULL,
  include_no_contest boolean NOT NULL,
  include_simultaneous_death boolean NOT NULL,
  has_funeral_wishes boolean NOT NULL,
  is_community_property_state boolean NOT NULL,
  CONSTRAINT will_stats_pkey PRIMARY KEY (id)
);

CREATE TABLE public.wp_acquisition_log (
  id bigint DEFAULT nextval('acquisition_log_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT acquisition_log_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'offsite'::text, 'handicap'::text]))),
  CONSTRAINT acquisition_log_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_acquisition_is_bot ON public.wp_acquisition_log USING btree (created_at) WHERE is_bot;
CREATE INDEX idx_al_brand_created ON public.wp_acquisition_log USING btree (brand, created_at DESC);

CREATE TABLE public.wp_email_schedule (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  brand text NOT NULL,
  sequence_step smallint NOT NULL,
  send_at timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  skipped_at timestamp with time zone,
  resend_message_id text,
  last_error text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wp_email_schedule_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT wp_email_schedule_sequence_step_check CHECK (((sequence_step >= 1) AND (sequence_step <= 10))),
  CONSTRAINT wp_email_schedule_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_wp_email_schedule_due ON public.wp_email_schedule USING btree (send_at) WHERE ((sent_at IS NULL) AND (skipped_at IS NULL));
CREATE UNIQUE INDEX idx_wp_email_schedule_unique ON public.wp_email_schedule USING btree (email, brand, sequence_step);

CREATE TABLE public.wp_leads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  brand text NOT NULL,
  source text NOT NULL,
  lead_magnet text,
  ip_hash text,
  user_agent text,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  vid text,
  phone text,
  geo_region text,
  event_date date,
  days_to_event integer,
  group_size integer,
  est_spend_usd integer,
  spend_tier text,
  quality_band text,
  quality_score numeric,
  profile jsonb,
  consent_share boolean DEFAULT false,
  consent_text text,
  consent_at timestamp with time zone,
  do_not_sell boolean DEFAULT false,
  updated_at timestamp with time zone,
  is_test boolean DEFAULT false NOT NULL,
  CONSTRAINT wp_leads_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'offsite'::text, 'handicap'::text]))),
  CONSTRAINT wp_leads_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_wp_leads_band ON public.wp_leads USING btree (quality_band);
CREATE INDEX idx_wp_leads_brand_created ON public.wp_leads USING btree (brand, created_at DESC);
CREATE UNIQUE INDEX idx_wp_leads_email_brand ON public.wp_leads USING btree (email, brand);
CREATE INDEX idx_wp_leads_event_date ON public.wp_leads USING btree (event_date);
CREATE INDEX idx_wp_leads_source ON public.wp_leads USING btree (source);
CREATE INDEX idx_wp_leads_vid ON public.wp_leads USING btree (vid);

CREATE TABLE public.wp_offer_clicks (
  id bigint DEFAULT nextval('offer_clicks_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT offer_clicks_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT offer_clicks_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_oc_brand_created ON public.wp_offer_clicks USING btree (brand, created_at DESC);

CREATE TABLE public.wp_offer_conversions (
  id bigint DEFAULT nextval('offer_conversions_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT offer_conversions_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT offer_conversions_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_ocon_brand_created ON public.wp_offer_conversions USING btree (brand, created_at DESC);

CREATE TABLE public.wp_plan_bookmarks (
  id bigint DEFAULT nextval('plan_bookmarks_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT plan_bookmarks_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'offsite'::text, 'handicap'::text]))),
  CONSTRAINT plan_bookmarks_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_pb_brand_created ON public.wp_plan_bookmarks USING btree (brand, created_at DESC);

CREATE TABLE public.wp_plan_inputs (
  id bigint DEFAULT nextval('plan_inputs_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  destination_slug text GENERATED ALWAYS AS (NULLIF(btrim(lower(COALESCE((payload ->> 'cityChosen'::text), (payload ->> 'specificCity'::text), ((payload -> 'pickedCities'::text) ->> 0)))), ''::text)) STORED,
  group_size integer GENERATED ALWAYS AS (CASE WHEN (jsonb_typeof((payload -> 'groupSize'::text)) = 'number'::text) THEN (((payload ->> 'groupSize'::text))::numeric)::integer WHEN (jsonb_typeof((payload -> 'headcount'::text)) = 'number'::text) THEN (((payload ->> 'headcount'::text))::numeric)::integer ELSE NULL::integer END) STORED,
  nights integer GENERATED ALWAYS AS (CASE WHEN (jsonb_typeof((payload -> 'numberOfDays'::text)) = 'number'::text) THEN (((payload ->> 'numberOfDays'::text))::numeric)::integer WHEN (jsonb_typeof((payload -> 'nights'::text)) = 'number'::text) THEN (((payload ->> 'nights'::text))::numeric)::integer ELSE NULL::integer END) STORED,
  budget_raw text GENERATED ALWAYS AS (NULLIF(btrim(COALESCE((payload ->> 'budget'::text), (payload ->> 'budgetPerPersonCap'::text))), ''::text)) STORED,
  destination_key text GENERATED ALWAYS AS (NULLIF(regexp_replace(regexp_replace(btrim(lower(COALESCE((payload ->> 'cityChosen'::text), (payload ->> 'specificCity'::text), ((payload -> 'pickedCities'::text) ->> 0)))), '[,[:space:]]+'::text, '-'::text, 'g'::text), '-+'::text, '-'::text, 'g'::text), ''::text)) STORED,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT plan_inputs_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'offsite'::text, 'handicap'::text]))),
  CONSTRAINT plan_inputs_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_plan_inputs_brand_created ON public.wp_plan_inputs USING btree (brand, created_at DESC);
CREATE INDEX idx_plan_inputs_is_bot ON public.wp_plan_inputs USING btree (created_at) WHERE is_bot;
CREATE INDEX idx_plan_inputs_session ON public.wp_plan_inputs USING btree (session_id);
CREATE INDEX idx_wp_plan_inputs_brand_destination ON public.wp_plan_inputs USING btree (brand, destination_slug);
CREATE INDEX idx_wp_plan_inputs_destination ON public.wp_plan_inputs USING btree (destination_slug) WHERE (destination_slug IS NOT NULL);
CREATE INDEX idx_wp_plan_inputs_destination_key ON public.wp_plan_inputs USING btree (destination_key) WHERE (destination_key IS NOT NULL);

CREATE TABLE public.wp_plan_selections (
  id bigint DEFAULT nextval('plan_selections_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT plan_selections_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'offsite'::text, 'handicap'::text]))),
  CONSTRAINT plan_selections_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_ps_brand_created ON public.wp_plan_selections USING btree (brand, created_at DESC);

CREATE TABLE public.wp_signal_rate_limit (
  session_id text NOT NULL,
  hour_bucket timestamp with time zone NOT NULL,
  count integer DEFAULT 1 NOT NULL,
  CONSTRAINT signal_rate_limit_pkey PRIMARY KEY (session_id, hour_bucket)
);
CREATE INDEX idx_srl_bucket ON public.wp_signal_rate_limit USING btree (hour_bucket);

CREATE TABLE public.wp_surprise_me_actions (
  id bigint DEFAULT nextval('surprise_me_actions_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT surprise_me_actions_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT surprise_me_actions_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_sma_brand_created ON public.wp_surprise_me_actions USING btree (brand, created_at DESC);
CREATE INDEX idx_sma_session ON public.wp_surprise_me_actions USING btree (session_id);

CREATE TABLE public.wp_trip_memory (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_id text NOT NULL,
  uploader_email text NOT NULL,
  photo_url text,
  caption text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT wp_trip_memory_pkey PRIMARY KEY (id)
);
CREATE INDEX wp_trip_memory_plan_idx ON public.wp_trip_memory USING btree (plan_id);

CREATE TABLE public.wp_trip_room_activity (
  id bigint DEFAULT nextval('trip_room_activity_id_seq'::regclass) NOT NULL,
  session_id text NOT NULL,
  brand text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb NOT NULL,
  is_bot boolean DEFAULT false NOT NULL,
  bot_reason text,
  CONSTRAINT trip_room_activity_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT trip_room_activity_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tra_brand_created ON public.wp_trip_room_activity USING btree (brand, created_at DESC);

CREATE TABLE public.wp_trip_room_expenses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_id text NOT NULL,
  source text NOT NULL,
  slot_id text,
  candidate_id text,
  label text NOT NULL,
  amount_cents integer DEFAULT 0 NOT NULL,
  suggested_cents integer,
  payer_email text NOT NULL,
  split_emails text[] DEFAULT '{}'::text[] NOT NULL,
  status text DEFAULT 'proposed'::text NOT NULL,
  per_person_hint boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT wp_trip_room_expenses_source_check CHECK ((source = ANY (ARRAY['slot'::text, 'manual'::text]))),
  CONSTRAINT wp_trip_room_expenses_status_check CHECK ((status = ANY (ARRAY['proposed'::text, 'verified'::text]))),
  CONSTRAINT wp_trip_room_expenses_pkey PRIMARY KEY (id)
);
CREATE INDEX wp_trip_room_expenses_plan_idx ON public.wp_trip_room_expenses USING btree (plan_id);
CREATE UNIQUE INDEX wp_trip_room_expenses_slot_unique ON public.wp_trip_room_expenses USING btree (plan_id, slot_id) WHERE ((source = 'slot'::text) AND (slot_id IS NOT NULL));

CREATE TABLE public.wp_trip_room_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_id text NOT NULL,
  session_hash text NOT NULL,
  display_name text,
  email text,
  role text DEFAULT 'viewer'::text NOT NULL,
  brand text NOT NULL,
  notifications_opt_in boolean DEFAULT true NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  last_active_at timestamp with time zone DEFAULT now() NOT NULL,
  user_email text,
  venmo_username text,
  CONSTRAINT trip_room_members_brand_check CHECK ((brand = ANY (ARRAY['moh'::text, 'bestman'::text, 'tdf'::text, 'handicap'::text]))),
  CONSTRAINT trip_room_members_pkey PRIMARY KEY (id),
  CONSTRAINT trip_room_members_plan_id_session_hash_key UNIQUE (plan_id, session_hash)
);
CREATE INDEX idx_trip_room_members_email ON public.wp_trip_room_members USING btree (email) WHERE (email IS NOT NULL);
CREATE INDEX idx_trip_room_members_plan ON public.wp_trip_room_members USING btree (plan_id);
CREATE INDEX idx_wp_trip_room_members_user_email ON public.wp_trip_room_members USING btree (plan_id, user_email) WHERE (user_email IS NOT NULL);
CREATE UNIQUE INDEX trip_room_members_plan_id_session_hash_key ON public.wp_trip_room_members USING btree (plan_id, session_hash);

CREATE TABLE public.wp_trip_room_personal_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_id text NOT NULL,
  participant_session_hash text NOT NULL,
  participant_display_name text,
  type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_email text,
  CONSTRAINT trip_room_personal_items_type_check CHECK ((type = ANY (ARRAY['arrival-flight'::text, 'departure-flight'::text, 'arrival-time'::text, 'departure-time'::text, 'dietary-note'::text, 'custom'::text]))),
  CONSTRAINT trip_room_personal_items_pkey PRIMARY KEY (id),
  CONSTRAINT trip_room_personal_items_plan_id_participant_session_hash_t_key UNIQUE (plan_id, participant_session_hash, type)
);
CREATE INDEX idx_trip_room_personal_items_plan ON public.wp_trip_room_personal_items USING btree (plan_id);
CREATE INDEX idx_trip_room_personal_items_session ON public.wp_trip_room_personal_items USING btree (participant_session_hash);
CREATE UNIQUE INDEX trip_room_personal_items_plan_id_participant_session_hash_t_key ON public.wp_trip_room_personal_items USING btree (plan_id, participant_session_hash, type);

CREATE TABLE public.wp_trip_room_slot_votes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_id text NOT NULL,
  slot_id text NOT NULL,
  voter_session_hash text NOT NULL,
  chosen_item_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_email text,
  CONSTRAINT trip_room_slot_votes_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_trip_room_slot_votes_plan ON public.wp_trip_room_slot_votes USING btree (plan_id);
CREATE INDEX idx_trip_room_slot_votes_slot ON public.wp_trip_room_slot_votes USING btree (slot_id);
CREATE UNIQUE INDEX wp_trip_room_slot_votes_slot_email_uniq ON public.wp_trip_room_slot_votes USING btree (slot_id, user_email) WHERE (user_email IS NOT NULL);

CREATE TABLE public.wp_trip_room_venue_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_id text NOT NULL,
  slot_key text NOT NULL,
  user_email text,
  display_name text,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wp_trip_room_venue_comments_body_check CHECK ((length(body) <= 500)),
  CONSTRAINT wp_trip_room_venue_comments_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_wp_trip_room_venue_comments_plan_slot ON public.wp_trip_room_venue_comments USING btree (plan_id, slot_key, created_at DESC);

CREATE TABLE public.wp_venue_geocoding (
  title_key text NOT NULL,
  city_key text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  place_id text,
  resolved_at timestamp with time zone DEFAULT now() NOT NULL,
  source text DEFAULT 'places_textsearch'::text NOT NULL,
  CONSTRAINT wp_venue_geocoding_pkey PRIMARY KEY (title_key, city_key)
);
CREATE INDEX wp_venue_geocoding_city_idx ON public.wp_venue_geocoding USING btree (city_key);

CREATE TABLE public.wpd_leads (
  id bigint DEFAULT nextval('wpd_leads_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  name text,
  phone text,
  state text,
  goals text[],
  stack text[],
  budget numeric,
  total_cost numeric,
  ip text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT wpd_leads_pkey PRIMARY KEY (id)
);
CREATE INDEX wpd_leads_created_at_idx ON public.wpd_leads USING btree (created_at DESC);
CREATE INDEX wpd_leads_email_idx ON public.wpd_leads USING btree (email);

