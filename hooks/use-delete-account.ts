"use client";

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/workspace/workspace-provider";

// Children before parents (FK order).
const TABLES = [
  "meal_items",
  "meals",
  "body_checkins",
  "sleep_logs",
  "cycle_days",
  "hair_logs",
  "recall_items",
  "study_logs",
  "study_sessions",
  "study_recall",
  "study_tasks",
  "study_topics",
  "supplement_logs",
  "supplements",
  "food_nutrients",
  "foods",
  "nutrients",
  "settings",
];

export function useDeleteAccount() {
  const { workspace, logout } = useWorkspace();

  const clearAll = useMutation({
    mutationFn: async () => {
      for (const table of TABLES) {
        await supabase.from(table).delete().eq("workspace", workspace!);
      }
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async () => {
      for (const table of TABLES) {
        await supabase.from(table).delete().eq("workspace", workspace!);
      }
      logout();
    },
  });

  return { clearAll, deleteAccount };
}
