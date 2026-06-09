"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { RecallItem } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export interface DayStat {
  total: number;
  reviewed: number;
  pct: number;
}

export function useRecallMonth(year: number, month: number) {
  const { workspace } = useWorkspace();

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

  const query = useQuery({
    queryKey: ["recall-month", workspace, startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("recall_items")
        .select("due_date, last_reviewed")
        .eq("workspace", workspace!)
        .eq("is_active", true)
        .gte("due_date", startDate)
        .lte("due_date", endDate);
      return (data || []) as Pick<RecallItem, "due_date" | "last_reviewed">[];
    },
    enabled: !!workspace,
  });

  const dayStats = new Map<string, DayStat>();

  if (query.data) {
    for (const item of query.data) {
      const existing = dayStats.get(item.due_date) || { total: 0, reviewed: 0, pct: 0 };
      existing.total++;
      if (item.last_reviewed) existing.reviewed++;
      existing.pct = Math.round((existing.reviewed / existing.total) * 100);
      dayStats.set(item.due_date, existing);
    }
  }

  return { dayStats, isLoading: query.isLoading };
}
