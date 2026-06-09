"use client";

import { cn } from "@/lib/utils";

interface RatingDotsProps {
  value: number | null;
  onChange?: (value: number) => void;
  max?: number;
  color?: string;
  size?: "sm" | "md";
  labels?: string[];
}

export function RatingDots({
  value,
  onChange,
  max = 5,
  color = "bg-brand",
  size = "md",
  labels,
}: RatingDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          title={labels?.[n - 1]}
          className={cn(
            "rounded-full transition-colors",
            size === "sm" ? "w-3 h-3" : "w-5 h-5",
            value !== null && n <= (value ?? 0) ? color : "bg-line",
            onChange && "hover:opacity-80 cursor-pointer"
          )}
        />
      ))}
    </div>
  );
}

export function RatingDisplay({
  value,
  max = 5,
  color = "bg-brand",
}: {
  value: number | null;
  max?: number;
  color?: string;
}) {
  return <RatingDots value={value} max={max} color={color} size="sm" />;
}
