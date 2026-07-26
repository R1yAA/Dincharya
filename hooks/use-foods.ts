"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Food, FoodNutrient } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export interface FoodAmount {
  nutrient_id: string;
  amount: number;
}

export function useFoods() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const foodsQuery = useQuery({
    queryKey: ["foods", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("foods")
        .select("*")
        .eq("workspace", workspace!)
        .order("name", { ascending: true });
      return (data || []) as Food[];
    },
    enabled: !!workspace,
  });

  // Whole-workspace profile rows: the library is small, one fetch beats
  // per-food round trips and every consumer can build a profileMap from it.
  const nutrientsQuery = useQuery({
    queryKey: ["food-nutrients", workspace],
    queryFn: async () => {
      const { data } = await supabase
        .from("food_nutrients")
        .select("*")
        .eq("workspace", workspace!);
      return (data || []) as FoodNutrient[];
    },
    enabled: !!workspace,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["foods"] });
    qc.invalidateQueries({ queryKey: ["food-nutrients"] });
  };

  // Write the food row, then sync its profile: upsert given amounts and delete
  // rows for nutrients no longer present.
  const upsertFood = useMutation({
    mutationFn: async (params: {
      food: Partial<Food> & { name: string };
      amounts: FoodAmount[];
    }): Promise<Food> => {
      const { food, amounts } = params;
      const payload = { ...food, workspace: workspace! };
      let saved: Food;
      if (food.id) {
        const { data } = await supabase
          .from("foods")
          .update(payload)
          .eq("id", food.id)
          .select()
          .single();
        saved = data as Food;
      } else {
        const { data } = await supabase
          .from("foods")
          .insert(payload)
          .select()
          .single();
        saved = data as Food;
      }
      if (amounts.length > 0) {
        await supabase.from("food_nutrients").upsert(
          amounts.map((a) => ({
            workspace: workspace!,
            food_id: saved.id,
            nutrient_id: a.nutrient_id,
            amount: a.amount,
          })),
          { onConflict: "food_id,nutrient_id" }
        );
      }
      const keep = amounts.map((a) => a.nutrient_id);
      let del = supabase.from("food_nutrients").delete().eq("food_id", saved.id);
      if (keep.length > 0) del = del.not("nutrient_id", "in", `(${keep.join(",")})`);
      await del;
      return saved;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // food_nutrients + meal_items cascade-delete via FK
      await supabase.from("foods").delete().eq("id", id);
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["meal-items"] });
    },
  });

  return {
    foods: foodsQuery.data || [],
    foodNutrients: nutrientsQuery.data || [],
    isLoading: foodsQuery.isLoading || nutrientsQuery.isLoading,
    upsertFood,
    remove,
  };
}
