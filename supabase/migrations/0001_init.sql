-- Dincharya: daily routine tracker
-- All tables use workspace TEXT for app-layer multi-tenancy

-- Helper: auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============ MEALS ============
CREATE TABLE meals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  name         VARCHAR(120) NOT NULL,
  category     VARCHAR(30) NOT NULL DEFAULT 'other-meal',
  slot         VARCHAR(12),
  felt         VARCHAR(8),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  time         TIME,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meals_workspace ON meals(workspace);
CREATE INDEX idx_meals_workspace_date ON meals(workspace, date DESC);
CREATE INDEX idx_meals_category ON meals(category);
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY meals_all ON meals FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER meals_updated BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ BODY CHECK-INS ============
CREATE TABLE body_checkins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    DECIMAL(5,2),
  energy       SMALLINT CHECK (energy BETWEEN 1 AND 5),
  mood         SMALLINT CHECK (mood BETWEEN 1 AND 5),
  skin         SMALLINT CHECK (skin BETWEEN 1 AND 5),
  digestion    SMALLINT CHECK (digestion BETWEEN 1 AND 5),
  bloating     SMALLINT CHECK (bloating BETWEEN 1 AND 5),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace, date)
);

CREATE INDEX idx_body_workspace ON body_checkins(workspace);
CREATE INDEX idx_body_workspace_date ON body_checkins(workspace, date DESC);
ALTER TABLE body_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY body_all ON body_checkins FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER body_updated BEFORE UPDATE ON body_checkins FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ SLEEP LOGS ============
CREATE TABLE sleep_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  bedtime      TIME,
  waketime     TIME,
  hours        DECIMAL(4,2),
  quality      SMALLINT CHECK (quality BETWEEN 1 AND 5),
  tags         TEXT[] DEFAULT '{}',
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace, date)
);

CREATE INDEX idx_sleep_workspace ON sleep_logs(workspace);
CREATE INDEX idx_sleep_workspace_date ON sleep_logs(workspace, date DESC);
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY sleep_all ON sleep_logs FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER sleep_updated BEFORE UPDATE ON sleep_logs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ CYCLE DAYS ============
CREATE TABLE cycle_days (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  date         DATE NOT NULL,
  is_period    BOOLEAN DEFAULT TRUE,
  flow         VARCHAR(8),
  symptoms     TEXT[] DEFAULT '{}',
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace, date)
);

CREATE INDEX idx_cycle_workspace ON cycle_days(workspace);
CREATE INDEX idx_cycle_workspace_date ON cycle_days(workspace, date DESC);
ALTER TABLE cycle_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY cycle_all ON cycle_days FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER cycle_updated BEFORE UPDATE ON cycle_days FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ HAIR LOGS ============
CREATE TABLE hair_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  washed       BOOLEAN DEFAULT FALSE,
  shedding     SMALLINT CHECK (shedding BETWEEN 1 AND 5),
  scalp        SMALLINT CHECK (scalp BETWEEN 1 AND 5),
  condition    SMALLINT CHECK (condition BETWEEN 1 AND 5),
  routine      TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace, date)
);

CREATE INDEX idx_hair_workspace ON hair_logs(workspace);
CREATE INDEX idx_hair_workspace_date ON hair_logs(workspace, date DESC);
ALTER TABLE hair_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY hair_all ON hair_logs FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER hair_updated BEFORE UPDATE ON hair_logs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ STUDY LOGS ============
CREATE TABLE study_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace     TEXT NOT NULL,
  subject       VARCHAR(80) NOT NULL,
  topic         VARCHAR(160),
  duration_min  SMALLINT,
  confidence    SMALLINT CHECK (confidence BETWEEN 1 AND 5),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_workspace ON study_logs(workspace);
CREATE INDEX idx_study_workspace_date ON study_logs(workspace, date DESC);
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY study_all ON study_logs FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER study_updated BEFORE UPDATE ON study_logs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ RECALL ITEMS (SM-2) ============
CREATE TABLE recall_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace      TEXT NOT NULL,
  study_log_id   UUID REFERENCES study_logs(id) ON DELETE SET NULL,
  subject        VARCHAR(80),
  prompt         TEXT NOT NULL,
  answer         TEXT NOT NULL,
  ease           DECIMAL(4,2) DEFAULT 2.5,
  interval_days  SMALLINT DEFAULT 0,
  repetitions    SMALLINT DEFAULT 0,
  due_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed  DATE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recall_workspace ON recall_items(workspace);
CREATE INDEX idx_recall_due ON recall_items(workspace, due_date);
CREATE INDEX idx_recall_active ON recall_items(workspace, is_active) WHERE is_active;
CREATE INDEX idx_recall_study ON recall_items(study_log_id);
ALTER TABLE recall_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY recall_all ON recall_items FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER recall_updated BEFORE UPDATE ON recall_items FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ SETTINGS ============
CREATE TABLE settings (
  workspace            TEXT PRIMARY KEY,
  user_name            VARCHAR(50) DEFAULT 'Me',
  default_cycle_len    SMALLINT DEFAULT 28,
  default_period_len   SMALLINT DEFAULT 5,
  enabled_modules      TEXT[] DEFAULT '{meals,body,sleep,cycle,hair,study}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_all ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER settings_updated BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
