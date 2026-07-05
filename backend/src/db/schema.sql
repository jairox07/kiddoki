-- Kiddoki schema v1 — COPPA/GDPR-K compliant
-- PII lives ONLY in parents table, encrypted at app layer (AES-256-GCM).
-- Child profiles are fully anonymous: system-generated alias + avatar, no real names/photos.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ PARENTS (account owners, PII holders) ============
CREATE TABLE parents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,          -- lookup key (hashed index recommended in prod)
  email_enc     TEXT NOT NULL,                 -- AES-256-GCM ciphertext of email (PII vault)
  name_enc      TEXT NOT NULL,                 -- encrypted real name
  password_hash TEXT NOT NULL,                 -- scrypt
  consent_coppa BOOLEAN NOT NULL DEFAULT FALSE, -- verifiable parental consent flag
  consent_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ CHILDREN (anonymous profiles) ============
CREATE TYPE age_band AS ENUM ('early', 'middle', 'upper'); -- 1-4, 5-7, 8-11

CREATE TABLE children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  alias        TEXT NOT NULL,                  -- system-generated ("Zorro Azul 42"), NEVER real name
  avatar_seed  TEXT NOT NULL,                  -- deterministic avatar generation, no photos
  age_band     age_band NOT NULL,
  guide_character TEXT NOT NULL DEFAULT 'koki', -- guide character for gamification
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ SUBSCRIPTIONS (3 tiers) ============
CREATE TYPE sub_tier AS ENUM ('semilla', 'brote', 'bosque');
CREATE TYPE sub_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id           UUID NOT NULL UNIQUE REFERENCES parents(id) ON DELETE CASCADE,
  tier                sub_tier NOT NULL DEFAULT 'semilla',
  status              sub_status NOT NULL DEFAULT 'trialing',
  stripe_customer_id  TEXT,
  stripe_sub_id       TEXT,
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_events (                   -- simulated Stripe webhook log
  id         BIGSERIAL PRIMARY KEY,
  parent_id  UUID REFERENCES parents(id),
  type       TEXT NOT NULL,                     -- invoice.paid, sub.updated...
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ GAMIFICATION ============
CREATE TABLE missions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,                    -- math, reading, logic, habits
  age_band    age_band NOT NULL,
  gems_reward INT NOT NULL DEFAULT 10,
  stars_reward INT NOT NULL DEFAULT 1
);

CREATE TABLE child_progress (
  child_id     UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  gems         INT NOT NULL DEFAULT 0,
  stars        INT NOT NULL DEFAULT 0,
  level        INT NOT NULL DEFAULT 1,
  guide_stage  INT NOT NULL DEFAULT 1           -- guide character evolution
);

CREATE TABLE mission_completions (
  id          BIGSERIAL PRIMARY KEY,
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  mission_id  UUID NOT NULL REFERENCES missions(id),
  gems_earned INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_completions_child_time ON mission_completions(child_id, completed_at);

-- ============ PARENTAL CONTROLS & METRICS ============
CREATE TABLE time_limits (
  child_id      UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  daily_minutes INT NOT NULL DEFAULT 45,
  window_start  TIME NOT NULL DEFAULT '08:00',
  window_end    TIME NOT NULL DEFAULT '20:00'
);

CREATE TABLE usage_sessions (
  id         BIGSERIAL PRIMARY KEY,
  child_id   UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at   TIMESTAMPTZ,
  seconds    INT
);
CREATE INDEX idx_usage_child_time ON usage_sessions(child_id, started_at);

-- ============ FANTASY PLAY (parent-only leagues) ============
CREATE TABLE leagues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_id    UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,             -- secure random code, single-use rotation
  season_end  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE league_members (
  league_id  UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id  UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE, -- who enrolled the child
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (league_id, child_id)
);

CREATE TABLE league_scores (
  league_id  UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  points     INT NOT NULL DEFAULT 0,            -- educational achievement points this season
  milestones JSONB NOT NULL DEFAULT '[]',       -- collective milestones celebrated
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (league_id, child_id)
);

-- ============ COMMS ============
CREATE TABLE email_log (
  id         BIGSERIAL PRIMARY KEY,
  parent_id  UUID REFERENCES parents(id),
  template   TEXT NOT NULL,                     -- weekly_report, milestone, support_reply
  status     TEXT NOT NULL DEFAULT 'sent',
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ SEED MISSIONS ============
INSERT INTO missions (slug, title, category, age_band, gems_reward, stars_reward) VALUES
 ('count-to-10',      'Cuenta hasta 10 con Koki',   'math',    'early',  10, 1),
 ('shapes-hunt',      'Caza de formas',             'logic',   'early',  10, 1),
 ('add-sub-basics',   'Sumas y restas mágicas',     'math',    'middle', 15, 1),
 ('first-reading',    'Mi primera lectura',         'reading', 'middle', 15, 2),
 ('multiplication-quest', 'Misión multiplicación',  'math',    'upper',  25, 2),
 ('chapter-book',     'Reto lectura: capítulo completo', 'reading', 'upper', 30, 3);
