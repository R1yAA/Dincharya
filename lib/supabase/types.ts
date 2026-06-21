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
  note: string | null;
  created_at: string;
  updated_at: string;
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
