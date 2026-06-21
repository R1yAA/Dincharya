export interface MealCategory {
  id: string;
  emoji: string;
  name: string;
}

export const MEAL_CATEGORIES: MealCategory[] = [
  { id: "home-healthy", emoji: "🥗", name: "Homemade — Healthy" },
  { id: "home-snack", emoji: "🍪", name: "Homemade — Snack" },
  { id: "home-quick", emoji: "⚡", name: "Homemade — Quick food" },
  { id: "out-healthy", emoji: "🥙", name: "Outside — Healthy" },
  { id: "out-snack", emoji: "🍟", name: "Outside — Snack" },
  { id: "out-quick", emoji: "🍔", name: "Outside — Quick / junk" },
  { id: "beverage", emoji: "☕", name: "Beverage" },
  { id: "dessert", emoji: "🍰", name: "Dessert / sweet" },
  { id: "other-meal", emoji: "🍵", name: "Other" },
];

export const MEAL_SLOTS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "drink",
] as const;

// --- Structured axes (replace overloaded `category`) ---
export const MEAL_SOURCES = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "office", emoji: "🏢", label: "Office" },
  { id: "outside", emoji: "🍴", label: "Outside" },
  { id: "packaged", emoji: "📦", label: "Packaged" },
] as const;

export const MEAL_HEALTH_RATINGS = [
  { id: "healthy", emoji: "🥗", label: "Healthy" },
  { id: "okay", emoji: "🤷", label: "Okay" },
  { id: "junk", emoji: "🍟", label: "Junk" },
] as const;

// Seeded multi-select vocabulary, grounded in real logging patterns.
export const MEAL_TAGS = [
  "fried",
  "alcohol",
  "caffeine",
  "gut/probiotic",
  "fruit-veg",
  "heavy",
] as const;

export const FELT_OPTIONS = [
  { id: "good", emoji: "😀", label: "Felt good" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "bad", emoji: "🤢", label: "Felt heavy/off" },
] as const;

export function categoryById(
  id: string,
  customCategories: MealCategory[] = []
): MealCategory {
  const found =
    MEAL_CATEGORIES.find((c) => c.id === id) ||
    customCategories.find((c) => c.id === id);
  return found || { id, emoji: "🍽️", name: id };
}
