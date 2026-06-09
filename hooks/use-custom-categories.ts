"use client";

import { useState, useEffect, useCallback } from "react";
import { MealCategory } from "@/lib/categories/meals";

const STORAGE_KEY = "dincharya.custom.meals";

export function useCustomCategories() {
  const [categories, setCategories] = useState<MealCategory[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const add = useCallback((emoji: string, name: string) => {
    const id = `custom-${Date.now()}`;
    const newCat: MealCategory = { id, emoji, name };
    setCategories((prev) => {
      const next = [...prev, newCat];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { customCategories: categories, addCategory: add, removeCategory: remove };
}
