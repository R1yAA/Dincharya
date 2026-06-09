function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

export function mealsCsv(meals: { date: string; time: string | null; slot: string | null; name: string; category: string; felt: string | null; note: string | null }[]): string {
  return buildCsv(
    ["Date", "Time", "Slot", "Name", "Category", "Felt", "Note"],
    meals.map((m) => [m.date, m.time, m.slot, m.name, m.category, m.felt, m.note])
  );
}

export function bodyCsv(items: { date: string; weight_kg: number | null; energy: number | null; mood: number | null; skin: number | null; digestion: number | null; bloating: number | null; note: string | null }[]): string {
  return buildCsv(
    ["Date", "Weight (kg)", "Energy", "Mood", "Skin", "Digestion", "Bloating", "Note"],
    items.map((b) => [b.date, b.weight_kg, b.energy, b.mood, b.skin, b.digestion, b.bloating, b.note])
  );
}

export function sleepCsv(items: { date: string; bedtime: string | null; waketime: string | null; hours: number | null; quality: number | null; tags: string[]; note: string | null }[]): string {
  return buildCsv(
    ["Date", "Bedtime", "Wake", "Hours", "Quality", "Tags", "Note"],
    items.map((s) => [s.date, s.bedtime, s.waketime, s.hours, s.quality, s.tags?.join(";"), s.note])
  );
}

export function cycleCsv(items: { date: string; is_period: boolean; flow: string | null; symptoms: string[]; note: string | null }[]): string {
  return buildCsv(
    ["Date", "Is Period", "Flow", "Symptoms", "Note"],
    items.map((c) => [c.date, c.is_period, c.flow, c.symptoms?.join(";"), c.note])
  );
}

export function hairCsv(items: { date: string; washed: boolean; shedding: number | null; scalp: number | null; condition: number | null; routine: string | null; note: string | null }[]): string {
  return buildCsv(
    ["Date", "Washed", "Shedding", "Scalp", "Condition", "Routine", "Note"],
    items.map((h) => [h.date, h.washed, h.shedding, h.scalp, h.condition, h.routine, h.note])
  );
}

export function studyCsv(items: { date: string; subject: string; topic: string | null; duration_min: number | null; confidence: number | null; note: string | null }[]): string {
  return buildCsv(
    ["Date", "Subject", "Topic", "Duration (min)", "Confidence", "Note"],
    items.map((s) => [s.date, s.subject, s.topic, s.duration_min, s.confidence, s.note])
  );
}

export function recallCsv(items: { subject: string | null; prompt: string; answer: string; due_date: string; interval_days: number; repetitions: number; ease: number; last_reviewed: string | null }[]): string {
  return buildCsv(
    ["Subject", "Prompt", "Answer", "Due Date", "Interval (days)", "Repetitions", "Ease", "Last Reviewed"],
    items.map((r) => [r.subject, r.prompt, r.answer, r.due_date, r.interval_days, r.repetitions, r.ease, r.last_reviewed])
  );
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
