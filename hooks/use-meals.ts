"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Meal } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useMeals(date?: string) {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["meals", workspace, date],
    queryFn: async () => {
      let q = supabase
        .from("meals")
        .select("*")
        .eq("workspace", workspace!)
        .order("date", { ascending: false })
        .order("time", { ascending: false });
      if (date) q = q.eq("date", date);
      const { data } = await q.limit(200);
      return (data || []) as Meal[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (meal: Partial<Meal> & { name: string }) => {
      const payload = { ...meal, workspace: workspace! };
      if (meal.id) {
        const { data } = await supabase
          .from("meals")
          .update(payload)
          .eq("id", meal.id)
          .select()
          .single();
        return data;
      }
      const { data } = await supabase.from("meals").insert(payload).select().single();
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("meals").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals"] }),
  });

  return { meals: query.data || [], isLoading: query.isLoading, upsert, remove };
}

/** Fetch meals within an inclusive [from, to] date range — for week/month calendar views. */
export function useMealsRange(from: string, to: string) {
  const { workspace } = useWorkspace();

  const query = useQuery({
    queryKey: ["meals-range", workspace, from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("workspace", workspace!)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      return (data || []) as Meal[];
    },
    enabled: !!workspace && !!from && !!to,
  });

  return { meals: query.data || [], isLoading: query.isLoading };
}
