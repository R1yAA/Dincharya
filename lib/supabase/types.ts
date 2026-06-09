export interface Meal {
  id: string;
  workspace: string;
  name: string;
  category: string;
  slot: string | null;
  felt: string | null;
  date: string;
  time: string | null;
  note: string | null;
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
