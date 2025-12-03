# Workout Log - Copilot Instructions

## Architecture Overview

A **mobile-first React application** for tracking gym workouts with **user-configurable** workout plans and **AI-first** coaching. Built with a modular multi-file structure following React best practices.

### Tech Stack
- **React 18** with functional components and hooks
- **Supabase** for auth (Google OAuth, anonymous) and Postgres database
- **Tailwind CSS** with professional dark theme + green accents
- **Vite** for bundling
- **Google AI (Gemini)** - Core feature for personalized coaching

### Design Principles
1. **Mobile-First**: All UI designed for touch, iOS safe areas, thumb-friendly interactions
2. **AI-First**: Agent assists at every level - understanding user, analyzing patterns, motivation, tips
3. **User-Configurable**: Workout plans stored in DB, not hardcoded - users customize exercises
4. **Professional Dark Theme**: Dark backgrounds, green (#10B981) accents, clean typography

### Onboarding Flow
New users go through a 4-step onboarding:
1. **Profile Setup**: Name, DOB (mandatory), height/weight/body fat (optional), Google profile picture
2. **Experience Level**: Beginner, Intermediate, Professional
3. **Routine Creation**: Choose from templates (PPL, Upper/Lower, Full Body, Bro Split) OR AI-generated plan
4. **Get Started**: Slide-to-start with smooth animations

### Data Flow
```
User → Supabase Auth → Custom Hooks → Supabase DB
                                    ↓
                    AI Agent analyzes patterns → Personalized coaching
                                    ↓
                    LocalState (activeLog) → Save → DB
```

### Database Tables (see `supabase-schema.sql`)
- `user_profiles`: User profile data (name, DOB, experience level, metrics)
- `workout_plans`: **User-configurable** workout templates (NOT hardcoded)
- `workout_logs`: Completed workouts with JSONB `exercises` array
- `user_settings`: AI config, API key, onboarding status

## Development Commands

```bash
npm run dev      # Start Vite dev server (default: localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── main.jsx              # App entry point, mounts <App />
├── App.jsx               # Root component, routing, providers
├── index.css             # Tailwind + CSS variables + theme
├── components/
│   ├── ui/               # Reusable UI primitives
│   │   ├── Card.jsx      # Base card component (dark glass effect)
│   │   ├── Button.jsx    # Button variants (primary, ghost, danger)
│   │   ├── Input.jsx     # Form inputs with dark styling
│   │   ├── Modal.jsx     # Dialog/modal wrapper
│   │   └── Toast.jsx     # Notification toasts
│   ├── workout/          # Workout-specific components
│   │   ├── ExerciseLogger.jsx
│   │   ├── RestTimer.jsx
│   │   ├── WorkoutCard.jsx
│   │   └── ProgressBar.jsx
│   ├── onboarding/       # Onboarding flow components
│   │   ├── index.jsx     # OnboardingFlow orchestrator
│   │   ├── ProfileSetup.jsx
│   │   ├── ExperienceLevel.jsx
│   │   ├── RoutineCreation.jsx  # Templates + AI generation
│   │   └── GetStarted.jsx       # Slide-to-start
│   ├── ai/               # AI coaching components
│   │   ├── AICoach.jsx   # Main AI interaction component
│   │   ├── TipGenerator.jsx
│   │   └── PatternAnalyzer.jsx
│   └── layout/           # Layout components
│       ├── Header.jsx
│       └── Navigation.jsx
├── hooks/
│   ├── useAuth.js        # Supabase auth state + deleteAccount
│   ├── useProfile.js     # User profile CRUD
│   ├── useWorkoutPlans.js # User's workout plans
│   ├── useWorkouts.js    # Workout CRUD + history
│   ├── useSettings.js    # User settings/preferences
│   ├── useTimer.js       # Workout/rest timers
│   └── useAI.js          # AI service interactions
├── services/
│   ├── supabase.js       # Supabase client config
│   ├── ai.js             # Google AI/Gemini service
│   └── analytics.js      # Workout pattern analysis
├── constants/
│   ├── theme.js          # Color tokens, spacing
│   └── defaults.js       # Default workout templates
└── utils/
    ├── formatters.js     # Date, time, weight formatting
    └── validators.js     # Input validation
```

## Code Patterns & Conventions

### Component Pattern
```jsx
// src/components/workout/ExerciseLogger.jsx
import { useState } from 'react';
import { Card } from '../ui/Card';
import { useAI } from '../../hooks/useAI';

export function ExerciseLogger({ exercise, lastLog, onUpdate }) {
  const [sets, setSets] = useState([]);
  const { getTip } = useAI();
  
  // Early returns for edge cases
  if (!exercise) return null;
  
  return (
    <Card variant="dark">
      {/* Mobile-first: large touch targets, thumb-friendly */}
    </Card>
  );
}
```

### Hook Pattern
```jsx
// src/hooks/useWorkouts.js
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export function useWorkouts(userId) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    // Fetch + realtime subscription
  }, [userId]);
  
  return { workouts, loading, saveWorkout, deleteWorkout };
}
```

### Theme System (Dark + Green)
```jsx
// Tailwind classes pattern
// Backgrounds: bg-gray-950, bg-gray-900, bg-gray-800
// Text: text-gray-100, text-gray-400
// Accent (green): text-emerald-500, bg-emerald-500, border-emerald-500
// Danger: text-red-500, bg-red-500

// Card component example
<div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl">
```

### AI Integration Pattern
```jsx
// AI should be woven into every interaction
const { analyzePattern, getMotivation, suggestWeight } = useAI();

// Before workout: AI analyzes history, suggests weights
const suggestion = await suggestWeight(exercise, userHistory);

// During workout: AI provides form tips, encouragement
const tip = await getTip(exercise, currentSet, userFatigue);

// After workout: AI analyzes session, identifies patterns
const analysis = await analyzePattern(completedWorkout, allHistory);
```

### Supabase Patterns
```jsx
// Always use RLS - filter by user_id
const { data } = await supabase
  .from('workout_logs')
  .select('*')
  .eq('user_id', user.id);

// Realtime for live updates
const channel = supabase
  .channel('workouts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_logs' }, handler)
  .subscribe();
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## When Adding Features

1. **New Component**: Create in appropriate `components/` subfolder, use `Card` for containers
2. **New Data**: Update `supabase-schema.sql`, add RLS policies, create/update hook
3. **AI Feature**: Add to `services/ai.js`, expose via `useAI` hook
4. **Icons**: Import from `lucide-react`

## Mobile-First Guidelines

- Touch targets minimum 44x44px
- Use `safe-area-inset-*` for iOS notch/home indicator
- Prefer bottom sheets over dropdowns on mobile
- Large, readable fonts (base 16px minimum)
- Swipe gestures where appropriate
- Haptic feedback via `navigator.vibrate()`
