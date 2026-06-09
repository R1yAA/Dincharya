"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { CycleDay } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useCycle() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cycle", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("cycle_days")
        .select("*")
        .eq("workspace", workspace!)
        .order("date", { ascending: true });
      return (data || []) as CycleDay[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (day: Partial<CycleDay> & { date: string }) => {
      const payload = { ...day, workspace: workspace! };
      const { data } = await supabase
        .from("cycle_days")
        .upsert(payload, { onConflict: "workspace,date" })
        .select()
        .single();
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cycle"] }),
  });

  const remove = useMutation({
    mutationFn: async (date: string) => {
      await supabase
        .from("cycle_days")
        .delete()
        .eq("workspace", workspace!)
        .eq("date", date);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cycle"] }),
  });

  return { days: query.data || [], isLoading: query.isLoading, upsert, remove };
}
