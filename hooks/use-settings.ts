"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Settings } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useSettings() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["settings", workspace],
    queryFn: async (): Promise<Settings> => {
      if (!workspace) throw new Error("No workspace");
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("workspace", workspace)
        .single();

      if (data) return data as Settings;

      const { data: created } = await supabase
        .from("settings")
        .upsert({ workspace, user_name: workspace })
        .select()
        .single();
      return created as Settings;
    },
    enabled: !!workspace,
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Omit<Settings, "workspace" | "created_at" | "updated_at">>) => {
      const { data } = await supabase
        .from("settings")
        .update(patch)
        .eq("workspace", workspace!)
        .select()
        .single();
      return data as Settings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", workspace] }),
  });

  return { settings: query.data, isLoading: query.isLoading, update };
}
