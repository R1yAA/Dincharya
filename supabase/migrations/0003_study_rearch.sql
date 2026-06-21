-- Dincharya rearchitecture — STUDY workstream
-- See .claude/REARCH.md. Replaces the flat study_logs + SM-2 flashcard recall_items
-- with a three-level model (Topic -> Task -> Session) plus task-level recall that
-- recomputes from the actual completion date.
--
-- The legacy `study_logs` and `recall_items` tables are intentionally PRESERVED
-- (not dropped) so historical rows aren't lost; the new UI starts fresh against
-- the tables below. A later migration can drop the legacy tables (and optionally
-- backfill) once the new model has bedded in.

-- ============ STUDY TOPICS (folders) ============
CREATE TABLE study_topics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  name         VARCHAR(120) NOT NULL,
  color        VARCHAR(20),
  archived     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace, name)
);

CREATE INDEX idx_study_topics_workspace ON study_topics(workspace);
CREATE INDEX idx_study_topics_active ON study_topics(workspace, archived) WHERE NOT archived;
ALTER TABLE study_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY study_topics_all ON study_topics FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER study_topics_updated BEFORE UPDATE ON study_topics
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ STUDY TASKS (completable units) ============
-- A task is the unit that gets completed and (optionally) flagged for recall.
-- estimate_blocks counts 50-minute focus blocks; actual time accrues via sessions.
CREATE TABLE study_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace       TEXT NOT NULL,
  topic_id        UUID NOT NULL REFERENCES study_topics(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  estimate_blocks SMALLINT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done')),
  recall_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  done_at         DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_tasks_workspace ON study_tasks(workspace);
CREATE INDEX idx_study_tasks_topic ON study_tasks(topic_id);
CREATE INDEX idx_study_tasks_status ON study_tasks(workspace, status);
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY study_tasks_all ON study_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER study_tasks_updated BEFORE UPDATE ON study_tasks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ STUDY SESSIONS (actual time) ============
-- kind splits the two time buckets: 'study' = active study against a task,
-- 'recall' = time spent completing a review.
CREATE TABLE study_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    TEXT NOT NULL,
  task_id      UUID NOT NULL REFERENCES study_tasks(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_min SMALLINT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'study' CHECK (kind IN ('study', 'recall')),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_workspace_date ON study_sessions(workspace, date DESC);
CREATE INDEX idx_study_sessions_task ON study_sessions(task_id);
CREATE INDEX idx_study_sessions_kind ON study_sessions(workspace, kind);
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY study_sessions_all ON study_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER study_sessions_updated BEFORE UPDATE ON study_sessions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============ STUDY RECALL (one advancing row per recall-flagged task) ============
-- Replaces the 7-frozen-rows flashcard model. step indexes the spaced sequence;
-- on completing a review the next due_date is recomputed from the actual date.
-- A "defer" action pushes due_date forward without advancing the step.
-- active flips false once the sequence is exhausted (mastered).
CREATE TABLE study_recall (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace      TEXT NOT NULL,
  task_id        UUID NOT NULL REFERENCES study_tasks(id) ON DELETE CASCADE,
  step           SMALLINT NOT NULL DEFAULT 0,
  interval_days  SMALLINT NOT NULL,
  due_date       DATE NOT NULL,
  last_completed DATE,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id)
);

CREATE INDEX idx_study_recall_workspace ON study_recall(workspace);
CREATE INDEX idx_study_recall_due ON study_recall(workspace, due_date) WHERE active;
ALTER TABLE study_recall ENABLE ROW LEVEL SECURITY;
CREATE POLICY study_recall_all ON study_recall FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER study_recall_updated BEFORE UPDATE ON study_recall
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
