# Dincharya Rearchitecture Spec

> Status: aligned (author ↔ agent), 2026-06-21. Scope-first: **meals + study ship first**, everything else after.
> This is NOT a structural/tech rearchitecture. Stack is fixed (Next.js 16, Supabase, React Query). This is a **data-model + feature** redesign so data is correlatable, time-navigable, and the insights actually mean something.

---

## Decisions locked

- ❌ **"Compress data" — dropped.** Storage was a fear, not a fact (~20+ yr on free tier even shared with kharchasplit). Stay normalized; no JSONB-blob-per-day (it would kill correlation).
- 📊 **Descriptive, not prescriptive.** App shows the past + surfaces correlations; the author judges. No app-defined "clean/too much" thresholds, no nagging rules.
- 🔀 **Two separate scheduling systems**, not one unified scheduler — study recall lives in study, supplements live in meals. They rhyme but stay independent.
- 🥇 **Build order: meals + study first.** Sleep viz, body/hair correlations, full insights overhaul come after.

---

## STUDY — full rebuild (Focus To-Do shaped)

### Reality today (why it's a rebuild, not a tweak)
- `study_logs` is **flat**: `subject` (free text) + `topic` (free text) + `duration_min` + `confidence` + `date`. No folders, no tasks, no estimates, no completion state. "Subjects" list = `SELECT DISTINCT subject`.
- `recall_items` is a **flashcard engine** (`prompt`/`answer` + SM-2 `ease`/`repetitions`/`interval_days`). This does **not** match the target (task-level recall). It gets replaced wholesale.
- `lib/recall.ts:generateReviewDates` pre-inserts **all 7 reviews as frozen dates** (1,3,7,14,30,60,90) at creation. `use-recall.ts:markReviewed` only stamps `last_reviewed = today` — it never advances `due_date` or recomputes. The "today" view shows everything `due_date <= today`, so misses **permanently stack** → the "scary pile."

### Target model — three levels
```
Topic / Folder      e.g. DSA, HLD, LLD, Interview Prep   ← organization + "am I balancing subjects"
   └─ Task / Entry  e.g. "sorting", a specific HLD problem ← completable unit; ESTIMATE in 50-min blocks (editable, tracks over/under)
        └─ Session  a 50-min block logged against a task   ← actual ACTIVE STUDY time accrues here
```
- A **task** is what gets completed and what's optionally flagged for recall — not a topic, not a single session.
- Completing a task → "done" (stays in done) → if flagged → spawns **recall schedule**.

### Recall — task-level, recompute-from-actual
- Replaces flashcards. No `prompt`/`answer`. One advancing recall row per task (not 7 frozen rows).
- Spaced sequence (e.g. 1→3→7→21d). On completing a review: **next interval computed from the actual completion date**, tail shifts forward (recompute-from-actual, option (a)).
- Overdue-but-undone review just sits as "due" (doesn't multiply). Provide a **"defer / push forward"** action that recomputes the tail. This is the antidote to the pile.

### Two time buckets (both rolled up per-topic and per-day)
- **Active study time** — sessions against tasks.
- **Recall time** — completing reviews. Separate bucket so recall doesn't muddy "am I balancing subjects."

### Metrics / viz
- Time per topic (subject balance), total time/day, study vs recall split, estimate accuracy (over/under).

### Bug fixes (verified against code)
- ✏️ **Update-doesn't-cascade — CONFIRMED.** `use-study.ts:upsert` writes `study_logs` only; recall copies `subject`/`prompt` and bakes due-dates at creation, so edits never propagate. New model avoids denormalized copies + frozen dates.
- 🗑️ **Delete-doesn't-cascade — partially true / fragile.** `use-study.ts:remove` *does* hand-delete recall by `study_log_id`, but the DB FK is `ON DELETE SET NULL`, so any other path orphans recall rows. **Fix: enforce `ON DELETE CASCADE` at the DB layer.**

---

## MEALS — additions

### Calendar shell
- Replace the flat `.limit(200)` list with **day / week / month** views. Click a day → that day's meals.

### Schema (grounded in 15-day live data: 44 meals / 10 days)
Old `category` overloaded two axes + hid supplements. Split into orthogonal fields:

| Field | Type | Notes |
|---|---|---|
| `source` | enum `home / office / outside / packaged` | **where** it came from. `office` added — canteen meals are a recurring distinct context |
| `health_rating` | enum `healthy / okay / junk` | **how clean** — self-judged, independent of source |
| `processed_sugar` | boolean | first-class — named correlation target (sugar↔sleep↔digestion) |
| `tags` | `TEXT[]` | `fried`, `alcohol`, `caffeine`, `gut/probiotic`, `fruit-veg`, `heavy` |
| `felt` | keep, **optional one-tap** good/meh/bad | 0% historical use → make frictionless or it stays empty. Lean digestion correlation on existing `body_checkins.digestion` (1-5) instead |
| ~~`category`~~ | **migrate → drop** | splits into `source` + `health_rating` |

`source` and `health_rating` are orthogonal so the author can finally separate "how often outside?" from "how often junk?" — currently conflated.

### Supplements (new — validated by data)
7/44 "meals" were supplements crammed into a custom category (*Gut restore ×3, MgD3, Supradyn, Seeds+inositol, Honey seed mix*). New feature in the meals domain:
- **Supplement** definition: name, fixed schedule with **specific times** (daily / every-other-day / Mon-Wed-Fri).
- **Adherence log**: shown on calendar as "due" → tap to mark taken. "Next due" + "did I take it" are derived.
- No ad-hoc mode (fixed schedule only).

### Meal insights (descriptive + correlation)
- Trends: outside-food frequency, junk frequency, processed-sugar days, late-night eating (derived from `time`, no tag needed).
- Cross-feature correlations the author judges: sugar ↔ sleep quality ↔ digestion (`body_checkins.digestion`). Join key = `workspace + date`.

---

## Data migration (no manual re-tagging)

| Old | New |
|---|---|
| `home-*` | `source = home` |
| `out-*` | `source = outside` |
| packaged-snack custom cat (Mad Angles, banana chips) | `source = packaged` |
| `*-healthy` | `health_rating = healthy` |
| `dessert` | `health_rating = junk`, `processed_sugar = true` |
| `*-quick` | `health_rating = okay` (was effort/prep-time, NOT health — left for author to refine, don't guess) |
| supplement custom cat (Gut restore, MgD3, …) | **move to Supplements feature** |

---

## Out of scope (later)
- Sleep: use bedtime/waketime (already in schema) for bedtime-drift viz; meal↔sleep correlation.
- Body / hair correlations.
- Insights page overhaul (currently derives nothing).

## Notes / smells (not this scope)
- RLS policies are `USING (true)` on all tables — effectively open. App-layer `workspace TEXT` multi-tenancy only. Flag for later, out of scope here.
