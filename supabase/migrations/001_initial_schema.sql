-- TradePosts.io — initial schema
-- Apply via: Supabase Studio → SQL Editor → paste & run

-- ─── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              TEXT NOT NULL,
  plan               TEXT NOT NULL DEFAULT 'trial',  -- 'trial' | 'solo' | 'agency'
  trial_ends         TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gbp_account_id   TEXT NOT NULL,
  gbp_location_id  TEXT NOT NULL,
  business_name    TEXT NOT NULL,
  business_type    TEXT,
  services         TEXT[],
  tone             TEXT DEFAULT 'professional',
  active           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  scope         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id    UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  call_to_action JSONB,
  media_url      TEXT,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  published_at   TIMESTAMPTZ,
  status         TEXT DEFAULT 'pending',  -- 'pending' | 'published' | 'failed' | 'skipped'
  gbp_post_name  TEXT,
  ai_prompt_hash TEXT,
  retry_count    INT DEFAULT 0,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  published_at  TIMESTAMPTZ NOT NULL,
  gbp_post_name TEXT,
  engagement    JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id   UUID REFERENCES locations(id),
  model         TEXT NOT NULL,
  input_tokens  INT,
  output_tokens INT,
  cost_usd      NUMERIC(10, 6),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan                   TEXT NOT NULL,
  status                 TEXT NOT NULL,  -- 'active' | 'canceled' | 'past_due'
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_post_queue_scheduled  ON post_queue (scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_post_queue_location   ON post_queue (location_id);
CREATE INDEX IF NOT EXISTS idx_locations_user        ON locations (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date    ON ai_usage_log (user_id, created_at);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_queue     ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;

-- users: each user sees only their own row
CREATE POLICY "users_own_row"
  ON users FOR ALL
  USING (id = auth.uid());

-- locations
CREATE POLICY "users_own_locations"
  ON locations FOR ALL
  USING (user_id = auth.uid());

-- post_queue (indirect via locations)
CREATE POLICY "users_own_post_queue"
  ON post_queue FOR ALL
  USING (
    location_id IN (SELECT id FROM locations WHERE user_id = auth.uid())
  );

-- post_history
CREATE POLICY "users_own_post_history"
  ON post_history FOR ALL
  USING (
    location_id IN (SELECT id FROM locations WHERE user_id = auth.uid())
  );

-- google_tokens
CREATE POLICY "users_own_tokens"
  ON google_tokens FOR ALL
  USING (user_id = auth.uid());

-- ai_usage_log
CREATE POLICY "users_own_ai_log"
  ON ai_usage_log FOR ALL
  USING (user_id = auth.uid());

-- subscriptions
CREATE POLICY "users_own_subscriptions"
  ON subscriptions FOR ALL
  USING (user_id = auth.uid());

-- ─── AUTO-CREATE USER ROW ON SIGN-UP ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, trial_ends)
  VALUES (
    NEW.id,
    NEW.email,
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
