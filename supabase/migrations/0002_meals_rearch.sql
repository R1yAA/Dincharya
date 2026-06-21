-- Dincharya rearchitecture — MEALS workstream
-- See .claude/REARCH.md. Splits the overloaded `category` into orthogonal axes,
-- adds structured tags + processed_sugar, and introduces supplements as a
-- first-class feature (validated by users logging supplements as fake meals).
--
-- `category` is kept (deprecated) and backfilled here; it will be dropped in a
-- later migration once the UI no longer reads it. Custom-category rows cannot be
-- mapped generically and are left for manual reclassification.

-- ============ MEALS: new structured fields ============
ALTER TABLE meals
  ADD COLUMN source          TEXT,                       -- home | office | outside | packaged
  ADD COLUMN health_rating   TEXT,                       -- healthy | okay | junk
  ADD COLUMN processed_sugar BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN tags            TEXT[]  NOT NULL DEFAULT '{}';

ALTER TABLE meals
  ADD CONSTRAINT meals_source_chk
    CHECK (source IS NULL OR source IN ('home', 'office', 'outside', 'packaged')),
  ADD CONSTRAINT meals_health_rating_chk
    CHECK (health_rating IS NULL OR health_rating IN ('healthy', 'okay', 'junk'));

CREATE INDEX idx_meals_workspace_source ON meals(workspace, source);
CREATE INDEX idx_meals_processed_sugar  ON meals(workspace, date) WHERE processed_sugar;

-- ---- Backfill from legacy `category` (standard categories only) ----
-- source
UPDATE meals SET source = 'home'    WHERE category LIKE 'home-%';
UPDATE meals SET source = 'outside' WHERE category LIKE 'out-%';

-- health_rating
UPDATE meals SET health_rating = 'healthy' WHERE category LIKE '%-healthy';
UPDATE meals SET health_rating = 'okay'    WHERE category LIKE '%-quick' OR category LIKE '%-snack';
UPDATE meals SET health_rating = 'junk'    WHERE category = 'dessert';

-- processed_sugar
UPDATE meals SET processed_sugar = TRUE WHERE category = 'dessert';
-- NOTE: custom-category rows (supplements, packaged snacks) and beverage/other
-- are intentionally left NULL/false for manual reclassification.

-- ============ SUPPLEMENTS: definitions ============
CREATE TABLE supplements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  name         VARCHAR(120) NOT NULL,
  schedule     TEXT NOT NULL DEFAULT 'daily'
                 CHECK (schedule IN ('daily', 'alternate', 'weekly')),
  days_of_week SMALLINT[] NOT NULL DEFAULT '{}',  -- weekly: 0=Sun .. 6=Sat
  anchor_date  DATE NOT NULL DEFAULT CURRENT_DATE, -- alternate: parity reference
  times        TIME[] NOT NULL DEFAULT '{}',       -- specific times to take
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplements_workspace ON supplements(workspace);
CREATE INDEX idx_supplements_active ON supplements(workspace, active) WHERE active;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY supplements_all ON supplements FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER supplements_updated BEFORE UPDATE ON supplements
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ SUPPLEMENTS: adherence log ============
-- One row per (supplement, date, time-slot) that the user acted on.
-- "due but not acted on" is derived from the schedule, not stored.
CREATE TABLE supplement_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace     TEXT NOT NULL,
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  slot_time     TIME,                              -- which scheduled time this covers
  status        TEXT NOT NULL DEFAULT 'taken'
                  CHECK (status IN ('taken', 'skipped')),
  taken_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplement_id, date, slot_time)
);

CREATE INDEX idx_supp_logs_workspace_date ON supplement_logs(workspace, date DESC);
CREATE INDEX idx_supp_logs_supplement ON supplement_logs(supplement_id);
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY supp_logs_all ON supplement_logs FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER supp_logs_updated BEFORE UPDATE ON supplement_logs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
