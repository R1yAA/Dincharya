"use client";

import { FELT_OPTIONS } from "@/lib/categories/meals";
import { Chip } from "@/components/ui/chip";

interface FeltPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FeltPicker({ value, onChange }: FeltPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-fg-muted">How did it feel?</label>
      <div className="flex gap-2">
        {FELT_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(value === opt.id ? null : opt.id)}
          >
            {opt.emoji} {opt.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
