"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { RecallItem } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { generateReviewDates } from "@/lib/recall";
import { todayStr } from "@/lib/format";

export function useRecall(forDate?: string) {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const targetDate = forDate || todayStr();

  const todayQuery = useQuery({
    queryKey: ["recall-today", workspace, targetDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("recall_items")
        .select("*")
        .eq("workspace", workspace!)
        .eq("is_active", true)
        .lte("due_date", targetDate)
        .order("last_reviewed", { ascending: true, nullsFirst: true })
        .order("subject", { ascending: true });
      return (data || []) as RecallItem[];
    },
    enabled: !!workspace,
  });

  const allQuery = useQuery({
    queryKey: ["recall", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("recall_items")
        .select("*")
        .eq("workspace", workspace!)
        .eq("is_active", true)
        .order("due_date", { ascending: true });
      return (data || []) as RecallItem[];
    },
    enabled: !!workspace,
  });

  const forDateQuery = useQuery({
    queryKey: ["recall-date", workspace, forDate],
    queryFn: async () => {
      if (!forDate) return [];
      const { data } = await supabase
        .from("recall_items")
        .select("*")
        .eq("workspace", workspace!)
        .eq("is_active", true)
        .eq("due_date", forDate)
        .order("subject", { ascending: true });
      return (data || []) as RecallItem[];
    },
    enabled: !!workspace && !!forDate,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["recall"] });
    qc.invalidateQueries({ queryKey: ["recall-today"] });
    qc.invalidateQueries({ queryKey: ["recall-date"] });
  };

  const createReminders = useMutation({
    mutationFn: async (params: {
      study_log_id: string;
      subject: string;
      topic: string | null;
      studyDate: string;
    }) => {
      const reviews = generateReviewDates(params.studyDate);
      const rows = reviews.map((r) => ({
        workspace: workspace!,
        study_log_id: params.study_log_id,
        subject: params.subject,
        prompt: params.topic || params.subject,
        answer: "",
        interval_days: r.interval_days,
        due_date: r.due_date,
        is_active: true,
      }));
      await supabase.from("recall_items").insert(rows);
    },
    onSuccess: invalidateAll,
  });

  const markReviewed = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("recall_items")
        .update({ last_reviewed: todayStr() })
        .eq("id", id);
    },
    onSuccess: invalidateAll,
  });

  const unmarkReviewed = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("recall_items")
        .update({ last_reviewed: null })
        .eq("id", id);
    },
    onSuccess: invalidateAll,
  });

  const todayItems = todayQuery.data || [];
  const allItems = allQuery.data || [];
  const dueCount = todayItems.filter((i) => !i.last_reviewed).length;
  const todayReviewed = todayItems.filter((i) => i.last_reviewed === todayStr()).length;
  const todayTotal = todayItems.length;
  const completionPct = todayTotal > 0 ? Math.round((todayReviewed / todayTotal) * 100) : null;

  return {
    items: allItems,
    todayItems,
    dateItems: forDateQuery.data || [],
    dueCount,
    todayReviewed,
    todayTotal,
    completionPct,
    isLoading: todayQuery.isLoading,
    createReminders,
    markReviewed,
    unmarkReviewed,
  };
}
