"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Nutrient } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useNutrients() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["nutrients", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("nutrients")
        .select("*")
        .eq("workspace", workspace!)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      return (data || []) as Nutrient[];
    },
    enabled: !!workspace,
  });

  const upsert = useMutation({
    mutationFn: async (n: Partial<Nutrient> & { name: string }) => {
      const payload = { ...n, workspace: workspace! };
      if (n.id) {
        const { data } = await supabase
          .from("nutrients")
          .update(payload)
          .eq("id", n.id)
          .select()
          .single();
        return data as Nutrient;
      }
      const { data } = await supabase
        .from("nutrients")
        .insert(payload)
        .select()
        .single();
      return data as Nutrient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nutrients"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // food_nutrients cascade-delete via FK
      await supabase.from("nutrients").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutrients"] });
      qc.invalidateQueries({ queryKey: ["food-nutrients"] });
    },
  });

  return {
    nutrients: query.data || [],
    isLoading: query.isLoading,
    upsert,
    remove,
  };
}
