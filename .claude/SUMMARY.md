# Dincharya Project Summary

## Overview
**Dincharya** is a personal health and wellness tracking application built with Next.js 16. It's a mobile-friendly daily routine & body tracker that helps users monitor multiple aspects of their health and learning.

## Tech Stack
- **Framework**: Next.js 16.2.7 with TypeScript & React 19.2.4
- **Backend**: Supabase for real-time database & authentication
- **State Management**: React Query (@tanstack/react-query 5.101.0) for data fetching
- **UI Components**: Radix UI (dialog, popover, tabs, toggle, tooltip)
- **Styling**: Tailwind CSS 4 with CVA (class-variance-authority)
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization

## Core Features

### Tracked Categories

#### 1. **Meals** (`components/meals/`, `hooks/use-meals.ts`)
- **Functionality**: Log daily food intake with time stamps and categorization
- **Features**:
  - Categorize meals by type (Breakfast, Lunch, Dinner, Snacks, etc.)
  - Support for custom user-defined meal categories
  - Meal mix bar showing macro/composition ratios
  - Timestamped entries for tracking eating patterns
  - Meal list view with edit/delete capabilities
  - Category picker for quick meal logging
- **How it Works**: Users create a meal entry via the quick sheet form. Each entry includes the meal name, time, category, and optional notes. Data is synced to Supabase and persisted per date.

#### 2. **Sleep** (`components/sleep/`, `hooks/use-sleep.ts`)
- **Functionality**: Track sleep duration, quality, and sleep-related tags/symptoms
- **Features**:
  - Log sleep start/end times
  - Rate sleep quality (1-5 scale)
  - Apply custom sleep tags (e.g., "restless", "interrupted", "quality sleep")
  - Pre-defined symptom categories available
  - Historical sleep patterns visible over time
- **How it Works**: Users enter sleep times and rate quality. The system calculates duration automatically. Tags are selectable from a customizable list. Sleep logs are stored per date for trend analysis.

#### 3. **Body** (`components/body/`, `hooks/use-body.ts`)
- **Functionality**: Daily body check-ins for physical health monitoring
- **Features**:
  - Log weight/measurements
  - Rate energy levels and mood
  - Track symptoms or discomforts (aches, headaches, etc.)
  - Photo/notes capability for visual tracking
  - Gauge-style ratings (felt picker interface)
  - Multiple check-ins per day supported
- **How it Works**: Users create check-in entries with various metrics. The form includes visual rating pickers (felt-based UI) for subjective metrics like energy and mood. Latest check-in displayed on dashboard.

#### 4. **Cycle** (`components/cycle/`, `hooks/use-cycle.ts`)
- **Functionality**: Track menstrual cycle phases and symptoms
- **Features**:
  - Visual calendar showing cycle days
  - Mark cycle phase (menstruation, follicular, ovulation, luteal)
  - Track cycle-related symptoms
  - Pre-calculated cycle predictions based on historical data
  - Cycle phase calculations using `lib/cycle.ts` logic
  - Cycle status card displaying current phase
- **How it Works**: Users mark cycle days on the calendar. System tracks pattern over months and calculates predictive cycle phases. Integration with body/symptoms for holistic health view.

#### 5. **Hair** (`components/hair/`, `hooks/use-hair.ts`)
- **Functionality**: Log hair health and care activities
- **Features**:
  - Track hair wash/treatment dates
  - Rate hair condition/health
  - Log treatments applied (oils, masks, shampoo type, etc.)
  - Custom hair care notes
  - Pattern tracking for optimal hair care routines
- **How it Works**: Users log hair care activities with condition ratings. Historical entries help identify patterns in hair health and effectiveness of different treatments.

#### 6. **Study** (`components/study/`, `hooks/use-study.ts`)
- **Functionality**: Track learning sessions with spaced repetition recall system
- **Features**:
  - Log study sessions per subject/topic
  - Mark study subject/category
  - Integrate with spaced repetition recall system (`lib/recall.ts`)
  - Review calendar showing due dates for review
  - Completion percentage tracking
  - Reminder system for due reviews
  - Support for multiple subjects with custom categories
- **How it Works**: Users create study entries with subject/topic. System tracks when reviews are due based on spaced repetition algorithm. `useRecall()` hook calculates due count, completion %, and suggests reminders.

#### 7. **Insights** (`app/(main)/insights/page.tsx`, `hooks/use-insights.ts`)
- **Functionality**: Analytics dashboard showing health & learning trends
- **Features**:
  - Visual charts via Recharts (trends over time)
  - Aggregated statistics for all tracked categories
  - Correlations between different metrics (e.g., sleep → mood, cycle phase → energy)
  - Summary cards with key metrics
  - Custom date range analysis
  - Data export capabilities (CSV via `lib/csv.ts`)
- **How it Works**: Analytics engine aggregates data from all categories. Charts visualize trends. Correlation logic identifies patterns (e.g., poor sleep correlated with low energy).

### Key Functionality

#### **Dashboard/Today Page** (`app/(main)/page.tsx`)
- Central hub showing all tracked categories for today
- Quick access to recent entries for each category
- Visual summary of today's data with rating displays
- Empty states when no data for a category
- Quick entry buttons for rapid logging

#### **Date Navigation** (`components/layout/date-stepper.tsx`)
- Browse historical dates to view/edit past entries
- Previous/next day arrows or date picker
- Context-aware: shows data for selected date across all categories
- Used throughout app for historical data viewing

#### **Quick Entry (FAB)** (`components/layout/fab.tsx`)
- Floating Action Button on main pages
- Menu to select entry type (Meal, Sleep, Body, Cycle, Hair, Study)
- Opens appropriate form sheet for quick entry
- Streamlines data logging experience

#### **Custom Categories** (`hooks/use-custom-categories.ts`)
- Users can create custom meal categories beyond defaults
- Custom sleep tags (e.g., "restless", "nightmare", "deep sleep")
- Custom study subjects/topics
- Stored per workspace, synced across devices

#### **Spaced Repetition/Recall System** (`lib/recall.ts`, `hooks/use-recall.ts`)
- Algorithm-based review scheduling for study sessions
- Tracks due count: how many items need review today
- Completion %: progress toward finishing due reviews
- Smart reminders via `createReminders()` method
- Optimizes learning retention using scientifically-proven spacing

#### **Settings & Account Management** (`app/(main)/settings/page.tsx`, `hooks/use-settings.ts`)
- User profile management
- Workspace preferences
- Data export/backup options
- Delete account functionality (`use-delete-account.ts`)
- Custom category management

#### **Authentication** (`app/login/page.tsx`)
- Supabase authentication (likely email/password or social login)
- Session management via Supabase client
- Protected routes via layout guards
- Workspace context linking users to data

## Project Structure

```
app/                          # Next.js App Router pages
├── (main)/                   # Main authenticated routes (layout.tsx)
│   ├── page.tsx             # Today/dashboard page
│   ├── body/, cycle/, hair/, insights/, meals/, sleep/, study/ # Feature pages
│   └── settings/, more/     # User pages
└── login/                    # Authentication

components/                   # React components organized by feature
├── body/                     # Body tracking components
├── cycle/                    # Cycle tracking (calendar, forms)
├── meals/                    # Meal tracking & pickers
├── sleep/                    # Sleep forms
├── study/                    # Study/review calendar
├── shared/                   # Reusable UI components (felt-picker)
├── layout/                   # Page layout (tabs, FAB, date stepper)
└── ui/                       # Base UI components (button, card, chip, etc.)

hooks/                        # Custom React hooks for data fetching
├── use-{feature}.ts        # Feature-specific data hooks
├── use-recall.ts           # Spaced repetition logic
└── use-insights.ts         # Analytics calculations

lib/                          # Business logic & utilities
├── supabase/               # Supabase client & type definitions
├── categories/             # Predefined categories (meals, sleep tags, symptoms)
├── format.ts               # Date/time formatting utilities
├── insights.ts             # Analytics calculations
├── recall.ts               # Spaced repetition algorithm
├── csv.ts                  # Data export functionality
└── cycle.ts                # Menstrual cycle calculations

supabase/                     # Database schema
└── migrations/             # SQL migration files

public/                       # Static assets & manifest (PWA)
```

## Database Schema
- Users, workspaces, and multi-workspace support
- Tables for each tracking category (meals, sleep, body, cycle, hair, study)
- Recall/review system for spaced repetition learning

## Styling & Design
- **Tailwind CSS** with custom PostCSS config
- **Mobile-first** responsive design (PWA capable)
- Dark theme support with theme color settings
- Bottom tab navigation for main sections
- Toast notifications for feedback

## Key Hooks & Patterns
- **Custom Hooks**: Each feature has a dedicated hook for data fetching & mutations (useMeals, useSleep, etc.)
- **React Query**: For caching, synchronization, and state management
- **Workspace Context**: Multi-workspace support via workspace provider
- **Real-time Sync**: Supabase provides real-time updates

## Notable Features
- **PWA Support**: Manifest.json for app-like experience
- **CSV Export**: Data export capabilities
- **Spaced Repetition**: Study module with intelligent recall scheduling
- **Custom Categories**: Users can create custom meal categories & sleep tags
- **Analytics**: Insights page with trend analysis
- **Date Navigation**: Browse any date to view/edit historical entries

## Development Scripts
- `npm run dev` - Start dev server (port 3000)
- `npm run build` - Production build
- `npm run lint` - ESLint checks
- `npm run typecheck` - TypeScript validation

## Notes
- Authenticated routes use `(main)` layout group pattern
- Login page separate from main routes
- Component-driven architecture with clear separation of concerns
- Type-safe with full TypeScript support
