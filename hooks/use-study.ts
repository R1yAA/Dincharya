"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { StudyLog } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useStudy(date?: string) {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["study", workspace, date],
    queryFn: async () => {
      let q = supabase
        .from("study_logs")
        .select("*")
        .eq("workspace", workspace!)
        .order("date", { ascending: false });
      if (date) q = q.eq("date", date);
      const { data } = await q.limit(200);
      return (data || []) as StudyLog[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (log: Partial<StudyLog> & { subject: string }) => {
      const payload = { ...log, workspace: workspace! };
      if (log.id) {
        const { data } = await supabase
          .from("study_logs")
          .update(payload)
          .eq("id", log.id)
          .select()
          .single();
        return data;
      }
      const { data } = await supabase.from("study_logs").insert(payload).select().single();
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("study_logs").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study"] }),
  });

  const subjectsQuery = useQuery({
    queryKey: ["study-subjects", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_logs")
        .select("subject")
        .eq("workspace", workspace!)
        .order("created_at", { ascending: false });
      const unique = [...new Set((data || []).map((d: { subject: string }) => d.subject))];
      return unique as string[];
    },
    enabled: !!workspace,
  });

  return {
    logs: query.data || [],
    isLoading: query.isLoading,
    upsert,
    remove,
    subjects: subjectsQuery.data || [],
  };
}
