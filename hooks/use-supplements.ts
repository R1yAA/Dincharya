"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Supplement, SupplementLog } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useSupplements(date?: string) {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const supplementsQuery = useQuery({
    queryKey: ["supplements", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("supplements")
        .select("*")
        .eq("workspace", workspace!)
        .order("name", { ascending: true });
      return (data || []) as Supplement[];
    },
    enabled: !!workspace,
  });

  const logsQuery = useQuery({
    queryKey: ["supplement-logs", workspace, date],
    queryFn: async () => {
      let q = supabase
        .from("supplement_logs")
        .select("*")
        .eq("workspace", workspace!);
      if (date) q = q.eq("date", date);
      const { data } = await q.order("date", { ascending: false }).limit(400);
      return (data || []) as SupplementLog[];
    },
    enabled: !!workspace,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["supplements"] });
    qc.invalidateQueries({ queryKey: ["supplement-logs"] });
  };

  const upsert = useMutation({
    mutationFn: async (supp: Partial<Supplement> & { name: string }) => {
      const payload = { ...supp, workspace: workspace! };
      if (supp.id) {
        const { data } = await supabase
          .from("supplements")
          .update(payload)
          .eq("id", supp.id)
          .select()
          .single();
        return data;
      }
      const { data } = await supabase
        .from("supplements")
        .insert(payload)
        .select()
        .single();
      return data;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // supplement_logs cascade-delete via FK
      await supabase.from("supplements").delete().eq("id", id);
    },
    onSuccess: invalidate,
  });

  // Mark a (supplement, date, slot) taken or skipped. Upserts on the unique key.
  const setStatus = useMutation({
    mutationFn: async (params: {
      supplement_id: string;
      date: string;
      slot_time: string | null;
      status: "taken" | "skipped";
    }) => {
      await supabase.from("supplement_logs").upsert(
        {
          workspace: workspace!,
          supplement_id: params.supplement_id,
          date: params.date,
          slot_time: params.slot_time,
          status: params.status,
          taken_at: params.status === "taken" ? new Date().toISOString() : null,
        },
        { onConflict: "supplement_id,date,slot_time" }
      );
    },
    onSuccess: invalidate,
  });

  // Undo a mark (back to "pending") by deleting the log row.
  const clearStatus = useMutation({
    mutationFn: async (params: {
      supplement_id: string;
      date: string;
      slot_time: string | null;
    }) => {
      let q = supabase
        .from("supplement_logs")
        .delete()
        .eq("supplement_id", params.supplement_id)
        .eq("date", params.date);
      q = params.slot_time === null
        ? q.is("slot_time", null)
        : q.eq("slot_time", params.slot_time);
      await q;
    },
    onSuccess: invalidate,
  });

  return {
    supplements: supplementsQuery.data || [],
    logs: logsQuery.data || [],
    isLoading: supplementsQuery.isLoading,
    upsert,
    remove,
    setStatus,
    clearStatus,
  };
}

/**
 * Supplement logs within [from, to] — for nutrition totals over a range.
 * Keyed under the ["supplement-logs"] prefix so setStatus/clearStatus
 * invalidations refresh it too.
 */
export function useSupplementLogsRange(from: string, to: string) {
  const { workspace } = useWorkspace();

  const query = useQuery({
    queryKey: ["supplement-logs", workspace, "range", from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("supplement_logs")
        .select("*")
        .eq("workspace", workspace!)
        .gte("date", from)
        .lte("date", to);
      return (data || []) as SupplementLog[];
    },
    enabled: !!workspace && !!from && !!to,
  });

  return { logs: query.data || [], isLoading: query.isLoading };
}
