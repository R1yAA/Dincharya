"use client";

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/workspace/workspace-provider";

const TABLES = [
  "meals",
  "body_checkins",
  "sleep_logs",
  "cycle_days",
  "hair_logs",
  "recall_items",
  "study_logs",
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
