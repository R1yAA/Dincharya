"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { StudyTopic, StudyTask, StudySession } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

// ===================== TOPICS (folders) =====================
export function useStudyTopics() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["study-topics", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_topics")
        .select("*")
        .eq("workspace", workspace!)
        .order("name", { ascending: true });
      return (data || []) as StudyTopic[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (t: Partial<StudyTopic> & { name: string }) => {
      const payload = { ...t, workspace: workspace! };
      if (t.id) {
        const { data } = await supabase
          .from("study_topics")
          .update(payload)
          .eq("id", t.id)
          .select()
          .single();
        return data as StudyTopic;
      }
      const { data } = await supabase
        .from("study_topics")
        .insert(payload)
        .select()
        .single();
      return data as StudyTopic;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-topics"] }),
  });

  // Find-or-create by name (avoids the UNIQUE(workspace,name) clash on re-add).
  const ensure = useMutation({
    mutationFn: async (name: string): Promise<StudyTopic> => {
      const trimmed = name.trim();
      const { data: existing } = await supabase
        .from("study_topics")
        .select("*")
        .eq("workspace", workspace!)
        .eq("name", trimmed)
        .maybeSingle();
      if (existing) return existing as StudyTopic;
      const { data } = await supabase
        .from("study_topics")
        .insert({ workspace: workspace!, name: trimmed })
        .select()
        .single();
      return data as StudyTopic;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-topics"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("study_topics").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-topics"] });
      qc.invalidateQueries({ queryKey: ["study-tasks"] });
      qc.invalidateQueries({ queryKey: ["study-recall"] });
      qc.invalidateQueries({ queryKey: ["study-sessions"] });
    },
  });

  return {
    topics: query.data || [],
    isLoading: query.isLoading,
    upsert,
    ensure,
    remove,
  };
}

// ===================== TASKS (completable units) =====================
export function useStudyTasks() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["study-tasks", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_tasks")
        .select("*")
        .eq("workspace", workspace!)
        .order("created_at", { ascending: false });
      return (data || []) as StudyTask[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (
      t: Partial<StudyTask> & { topic_id: string; title: string }
    ) => {
      const payload = { ...t, workspace: workspace! };
      if (t.id) {
        const { data } = await supabase
          .from("study_tasks")
          .update(payload)
          .eq("id", t.id)
          .select()
          .single();
        return data as StudyTask;
      }
      const { data } = await supabase
        .from("study_tasks")
        .insert(payload)
        .select()
        .single();
      return data as StudyTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-tasks"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("study_tasks").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-tasks"] });
      qc.invalidateQueries({ queryKey: ["study-recall"] });
      qc.invalidateQueries({ queryKey: ["study-sessions"] });
    },
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    upsert,
    remove,
  };
}

// ===================== SESSIONS (actual time) =====================
export function useStudySessions(from?: string, to?: string) {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["study-sessions", workspace, from, to],
    queryFn: async () => {
      let q = supabase
        .from("study_sessions")
        .select("*")
        .eq("workspace", workspace!);
      if (from) q = q.gte("date", from);
      if (to) q = q.lte("date", to);
      const { data } = await q
        .order("date", { ascending: false })
        .limit(1000);
      return (data || []) as StudySession[];
    },
    enabled: !!workspace,
  });

  const add = useMutation({
    mutationFn: async (
      s: Partial<StudySession> & { task_id: string; duration_min: number }
    ) => {
      const { data } = await supabase
        .from("study_sessions")
        .insert({ ...s, workspace: workspace! })
        .select()
        .single();
      return data as StudySession;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-sessions"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("study_sessions").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-sessions"] }),
  });

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
    add,
    remove,
  };
}
