"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { MealItem, MealItemDraft } from "@/lib/supabase/types";
import { DatedMealItem } from "@/lib/nutrition";
import { useWorkspace } from "@/components/workspace/workspace-provider";

/**
 * Meal items whose parent meal falls in [from, to], flattened with the meal's
 * date. Range-scoped at the DB so long insight ranges don't truncate.
 */
export function useMealItemsRange(from: string, to: string) {
  const { workspace } = useWorkspace();

  const query = useQuery({
    queryKey: ["meal-items", workspace, from, to],
    queryFn: async (): Promise<DatedMealItem[]> => {
      const { data } = await supabase
        .from("meal_items")
        .select("*, meals!inner(date)")
        .eq("workspace", workspace!)
        .gte("meals.date", from)
        .lte("meals.date", to);
      type Row = MealItem & { meals: { date: string } };
      return ((data || []) as Row[]).map(({ meals, ...item }) => ({
        ...item,
        date: meals.date,
      }));
    },
    enabled: !!workspace && !!from && !!to,
  });

  return { items: query.data || [], isLoading: query.isLoading };
}

export function useMealItems() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  // Replace a meal's items wholesale: delete-then-insert is the simplest
  // correct sync for a handful of rows.
  const setItemsForMeal = useMutation({
    mutationFn: async (params: { meal_id: string; items: MealItemDraft[] }) => {
      await supabase.from("meal_items").delete().eq("meal_id", params.meal_id);
      if (params.items.length > 0) {
        await supabase.from("meal_items").insert(
          params.items.map((i) => ({
            workspace: workspace!,
            meal_id: params.meal_id,
            food_id: i.food_id,
            quantity: i.quantity,
          }))
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal-items"] }),
  });

  return { setItemsForMeal };
}
