export type MealSource = "home" | "office" | "outside" | "packaged";
export type MealHealthRating = "healthy" | "okay" | "junk";

export interface Meal {
  id: string;
  workspace: string;
  name: string;
  /** @deprecated legacy overloaded field — split into source + health_rating. Kept until UI stops reading it. */
  category: string;
  source: MealSource | null;
  health_rating: MealHealthRating | null;
  processed_sugar: boolean;
  tags: string[];
  slot: string | null;
  felt: string | null;
  date: string;
  time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type SupplementSchedule = "daily" | "alternate" | "weekly";

export interface Supplement {
  id: string;
  workspace: string;
  name: string;
  schedule: SupplementSchedule;
  /** weekly only: 0=Sun .. 6=Sat */
  days_of_week: number[];
  /** alternate only: parity reference date */
  anchor_date: string;
  /** specific times to take, "HH:MM:SS" */
  times: string[];
  active: boolean;
  /** optional linked library food — each "taken" log counts food profile x quantity */
  food_id: string | null;
  quantity: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Nutrition: user-defined nutrients, food library, per-meal items =====

export interface Nutrient {
  id: string;
  workspace: string;
  name: string;
  unit: string;
  daily_goal: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  workspace: string;
  name: string;
  /** e.g. "1 scoop (30g)", "1 glass" */
  serving_label: string | null;
  archived: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** Amount of one nutrient in 1 serving of a food. */
export interface FoodNutrient {
  id: string;
  workspace: string;
  food_id: string;
  nutrient_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  workspace: string;
  meal_id: string;
  food_id: string;
  /** serving multiplier, e.g. 2 = two servings */
  quantity: number;
  created_at: string;
  updated_at: string;
}

/** Form-side draft of a meal item before it has a row id. */
export interface MealItemDraft {
  food_id: string;
  quantity: number;
}

export interface SupplementLog {
  id: string;
  workspace: string;
  supplement_id: string;
  date: string;
  /** which scheduled time-slot this log covers */
  slot_time: string | null;
  status: "taken" | "skipped";
  taken_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BodyCheckin {
  id: string;
  workspace: string;
  date: string;
  weight_kg: number | null;
  energy: number | null;
  mood: number | null;
  skin: number | null;
  digestion: number | null;
  bloating: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SleepLog {
  id: string;
  workspace: string;
  date: string;
  bedtime: string | null;
  waketime: string | null;
  hours: number | null;
  quality: number | null;
  tags: string[];
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CycleDay {
  id: string;
  workspace: string;
  date: string;
  is_period: boolean;
  flow: string | null;
  symptoms: string[];
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HairLog {
  id: string;
  workspace: string;
  date: string;
  washed: boolean;
  shedding: number | null;
  scalp: number | null;
  condition: number | null;
  routine: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Study: three-level model (Topic -> Task -> Session) + task-level recall =====

export interface StudyTopic {
  id: string;
  workspace: string;
  name: string;
  color: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type StudyTaskStatus = "todo" | "done";

export interface StudyTask {
  id: string;
  workspace: string;
  topic_id: string;
  title: string;
  /** estimate in 50-minute focus blocks */
  estimate_blocks: number;
  status: StudyTaskStatus;
  recall_enabled: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StudySessionKind = "study" | "recall";

export interface StudySession {
  id: string;
  workspace: string;
  task_id: string;
  date: string;
  duration_min: number;
  kind: StudySessionKind;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyRecall {
  id: string;
  workspace: string;
  task_id: string;
  /** index into the spaced sequence — the upcoming review */
  step: number;
  interval_days: number;
  due_date: string;
  last_completed: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** @deprecated legacy flat study model — replaced by StudyTopic/StudyTask/StudySession. */
export interface StudyLog {
  id: string;
  workspace: string;
  subject: string;
  topic: string | null;
  duration_min: number | null;
  confidence: number | null;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** @deprecated legacy SM-2 flashcard recall — replaced by StudyRecall. */
export interface RecallItem {
  id: string;
  workspace: string;
  study_log_id: string | null;
  subject: string | null;
  prompt: string;
  answer: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  last_reviewed: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  workspace: string;
  user_name: string;
  default_cycle_len: number;
  default_period_len: number;
  enabled_modules: string[];
  created_at: string;
  updated_at: string;
}
