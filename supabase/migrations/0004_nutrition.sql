-- Dincharya nutrition workstream
-- User-defined nutrients (with daily goals), a saved food library with
-- per-serving nutrient profiles, meal_items linking foods (with a quantity
-- multiplier) to logged meals, and supplements extended into "recurring foods"
-- by optionally linking a library food + quantity.

-- ============ NUTRIENTS: user-defined definitions + daily goals ============
CREATE TABLE nutrients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace  TEXT NOT NULL,
  name       VARCHAR(80) NOT NULL,
  unit       VARCHAR(16) NOT NULL DEFAULT 'g',
  daily_goal NUMERIC
               CONSTRAINT nutrients_daily_goal_chk
               CHECK (daily_goal IS NULL OR daily_goal > 0),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace, name)
);

CREATE INDEX idx_nutrients_workspace ON nutrients(workspace);
ALTER TABLE nutrients ENABLE ROW LEVEL SECURITY;
CREATE POLICY nutrients_all ON nutrients FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER nutrients_updated BEFORE UPDATE ON nutrients
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ FOODS: saved library ============
CREATE TABLE foods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace     TEXT NOT NULL,
  name          VARCHAR(120) NOT NULL,
  serving_label VARCHAR(60),                -- e.g. "1 scoop (30g)", "1 glass"
  archived      BOOLEAN NOT NULL DEFAULT FALSE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace, name)
);

CREATE INDEX idx_foods_workspace ON foods(workspace);
CREATE INDEX idx_foods_active ON foods(workspace) WHERE NOT archived;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY foods_all ON foods FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER foods_updated BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ FOOD_NUTRIENTS: amounts per 1 serving ============
CREATE TABLE food_nutrients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace   TEXT NOT NULL,
  food_id     UUID NOT NULL REFERENCES foods(id)     ON DELETE CASCADE,
  nutrient_id UUID NOT NULL REFERENCES nutrients(id) ON DELETE CASCADE,
  amount      NUMERIC NOT NULL
                CONSTRAINT food_nutrients_amount_chk CHECK (amount >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(food_id, nutrient_id)
);

CREATE INDEX idx_food_nutrients_workspace ON food_nutrients(workspace);
CREATE INDEX idx_food_nutrients_food ON food_nutrients(food_id);
ALTER TABLE food_nutrients ENABLE ROW LEVEL SECURITY;
CREATE POLICY food_nutrients_all ON food_nutrients FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER food_nutrients_updated BEFORE UPDATE ON food_nutrients
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ MEAL_ITEMS: foods eaten in a meal, with multiplier ============
-- No date column: the meal's date is the item's date (stay normalized).
CREATE TABLE meal_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace  TEXT NOT NULL,
  meal_id    UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id    UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  quantity   NUMERIC NOT NULL DEFAULT 1
               CONSTRAINT meal_items_quantity_chk CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meal_id, food_id)
);

CREATE INDEX idx_meal_items_workspace ON meal_items(workspace);
CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);
CREATE INDEX idx_meal_items_food ON meal_items(food_id);
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY meal_items_all ON meal_items FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER meal_items_updated BEFORE UPDATE ON meal_items
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ SUPPLEMENTS -> recurring foods ============
-- A recurring item may link a library food; each "taken" log then contributes
-- that food's profile x quantity to the day's nutrient totals.
ALTER TABLE supplements
  ADD COLUMN food_id  UUID REFERENCES foods(id) ON DELETE SET NULL,
  ADD COLUMN quantity NUMERIC NOT NULL DEFAULT 1
    CONSTRAINT supplements_quantity_chk CHECK (quantity > 0);
