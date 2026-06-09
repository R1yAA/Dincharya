"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { SleepLog } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useSleep(date?: string) {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["sleep", workspace, date],
    queryFn: async () => {
      let q = supabase
        .from("sleep_logs")
        .select("*")
        .eq("workspace", workspace!)
        .order("date", { ascending: false });
      if (date) q = q.eq("date", date);
      const { data } = await q.limit(200);
      return (data || []) as SleepLog[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (log: Partial<SleepLog> & { date: string }) => {
      const payload = { ...log, workspace: workspace! };
      const { data } = await supabase
        .from("sleep_logs")
        .upsert(payload, { onConflict: "workspace,date" })
        .select()
        .single();
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("sleep_logs").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep"] }),
  });

  return { logs: query.data || [], isLoading: query.isLoading, upsert, remove };
}
