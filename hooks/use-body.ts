"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { BodyCheckin } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useBody(date?: string) {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["body", workspace, date],
    queryFn: async () => {
      let q = supabase
        .from("body_checkins")
        .select("*")
        .eq("workspace", workspace!)
        .order("date", { ascending: false });
      if (date) q = q.eq("date", date);
      const { data } = await q.limit(200);
      return (data || []) as BodyCheckin[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (checkin: Partial<BodyCheckin> & { date: string }) => {
      const payload = { ...checkin, workspace: workspace! };
      const { data } = await supabase
        .from("body_checkins")
        .upsert(payload, { onConflict: "workspace,date" })
        .select()
        .single();
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("body_checkins").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body"] }),
  });

  return { checkins: query.data || [], isLoading: query.isLoading, upsert, remove };
}
