"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { StudyRecall, StudyTask } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { initialRecall, advanceRecall, deferRecall } from "@/lib/study";
import { todayStr } from "@/lib/format";

/**
 * Task-level recall with recompute-from-actual scheduling. One advancing row per
 * recall-flagged task (no frozen 7-row pile). Also owns task completion, since
 * completing a flagged task is what spawns its recall schedule.
 */
export function useStudyRecall() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const today = todayStr();

  const query = useQuery({
    queryKey: ["study-recall", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_recall")
        .select("*")
        .eq("workspace", workspace!)
        .eq("active", true)
        .order("due_date", { ascending: true });
      return (data || []) as StudyRecall[];
    },
    enabled: !!workspace,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["study-recall"] });
    qc.invalidateQueries({ queryKey: ["study-tasks"] });
    qc.invalidateQueries({ queryKey: ["study-sessions"] });
  };

  // Mark a task done; if flagged for recall, spawn (or reset) its first review.
  const completeTask = useMutation({
    mutationFn: async (task: StudyTask) => {
      await supabase
        .from("study_tasks")
        .update({ status: "done", done_at: today })
        .eq("id", task.id);
      if (task.recall_enabled) {
        const r = initialRecall(today);
        await supabase.from("study_recall").upsert(
          {
            workspace: workspace!,
            task_id: task.id,
            step: r.step,
            interval_days: r.interval_days,
            due_date: r.due_date,
            last_completed: r.last_completed,
            active: r.active,
          },
          { onConflict: "task_id" }
        );
      }
    },
    onSuccess: invalidate,
  });

  // Reopen a done task and tear down any recall schedule it had.
  const reopenTask = useMutation({
    mutationFn: async (task: StudyTask) => {
      await supabase
        .from("study_tasks")
        .update({ status: "todo", done_at: null })
        .eq("id", task.id);
      await supabase.from("study_recall").delete().eq("task_id", task.id);
    },
    onSuccess: invalidate,
  });

  // Complete a due review: advance the schedule from today and log recall time.
  const completeReview = useMutation({
    mutationFn: async ({
      recall,
      minutes,
    }: {
      recall: StudyRecall;
      minutes: number;
    }) => {
      const next = advanceRecall(recall, today);
      await supabase
        .from("study_recall")
        .update({
          step: next.step,
          interval_days: next.interval_days,
          due_date: next.due_date,
          last_completed: next.last_completed,
          active: next.active,
        })
        .eq("id", recall.id);
      if (minutes > 0) {
        await supabase.from("study_sessions").insert({
          workspace: workspace!,
          task_id: recall.task_id,
          date: today,
          duration_min: minutes,
          kind: "recall",
        });
      }
    },
    onSuccess: invalidate,
  });

  // Push a due/overdue review forward without advancing the step.
  const deferReview = useMutation({
    mutationFn: async ({
      recall,
      days,
    }: {
      recall: StudyRecall;
      days: number;
    }) => {
      const { due_date } = deferRecall(days, today);
      await supabase
        .from("study_recall")
        .update({ due_date })
        .eq("id", recall.id);
    },
    onSuccess: invalidate,
  });

  const items = query.data || [];
  const dueItems = items.filter((r) => r.due_date <= today);
  const upcomingItems = items.filter((r) => r.due_date > today);

  return {
    items,
    dueItems,
    upcomingItems,
    dueCount: dueItems.length,
    isLoading: query.isLoading,
    completeTask,
    reopenTask,
    completeReview,
    deferReview,
  };
}
