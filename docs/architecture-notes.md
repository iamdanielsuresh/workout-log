# Workout Log - Architecture Notes

> **Auto-generated documentation for the codebase structure**
> Created: Section 1 - Codebase Discovery
> Updated: Section 2 - Home Screen Improvements
> Updated: Section 3 - AI Buddy Screen Improvements
> Updated: Section 4 - Plans/Workout Routines Improvements

---

## 1. Tech Stack

| Technology | Version/Details | Purpose |
|------------|-----------------|---------|
| **React** | 18.x | UI framework (functional components + hooks) |
| **Vite** | Build tool | Dev server (localhost:5173), production builds |
| **Supabase** | Client SDK | Auth (Google OAuth, anonymous) + Postgres DB with RLS |
| **Tailwind CSS** | 3.x | Dark theme styling (gray-950, emerald-500 accents) |
| **Google Gemini AI** | gemini-2.0-flash | AI coaching, workout generation, tips |
| **lucide-react** | - | Icon library throughout UI |

---

## 2. Key Screens & Views

### Main Views (Navigation Tabs)

| View | Location | Description |
|------|----------|-------------|
| **Home** | `src/App.jsx` (line ~590, inline) | Dashboard with smart recommendations, contextual hints, streak, quick stats |
| **Plans** | `src/components/views/PlansView.jsx` (310 lines) | List/manage workout routines, expand to see exercises, edit/delete actions |
| **AI Buddy** | `src/components/views/BuddyView.jsx` (487 lines) | AI coaching - insights, motivation, tips, chat interface |
| **Settings** | `src/App.jsx` (line ~890, inline) | AI config (API key), profile edit, sign out, delete account |
| **Workout** | `src/App.jsx` (line ~710, inline) | Active workout session with exercise logger, timer |

### Modals & Overlays

| Modal | Location | Trigger |
|-------|----------|---------|
| **WorkoutStartModal** | `src/components/workout/WorkoutStartModal.jsx` (257 lines) | Clicking workout card on Home/Plans - slide-to-start confirmation |
| **AddPlanModal** | `src/components/plans/AddPlanModal.jsx` (527 lines) | "Add New Routine" button - templates, AI generation, or custom |
| **ExerciseInfoModal** | `src/components/workout/ExerciseInfoModal.jsx` | Info button during workout - form tips, cues, mistakes |
| **EditProfileModal** | `src/components/profile/EditProfileModal.jsx` | "Edit Profile" in Settings |

### Onboarding Flow

| Step | Component | Path |
|------|-----------|------|
| **Orchestrator** | `src/components/onboarding/index.jsx` | Main flow controller |
| **1. Profile Setup** | `src/components/onboarding/ProfileSetup.jsx` | Name, DOB, metrics |
| **2. Experience Level** | `src/components/onboarding/ExperienceLevel.jsx` | Beginner/Intermediate/Pro |
| **3. Routine Creation** | `src/components/onboarding/RoutineCreation.jsx` (743 lines) | Templates + AI generation |
| **4. Get Started** | `src/components/onboarding/GetStarted.jsx` | Final slide-to-start |

---

## 3. Data Flow

### Authentication Flow
```
User → Login Screen (App.jsx)
  ├── Google OAuth → supabase.auth.signInWithOAuth()
  └── Anonymous → supabase.auth.signInAnonymously()
       ↓
  useAuth hook → user state
       ↓
  App checks: user → settings.onboarding_completed?
       ↓
  Yes → Home View | No → Onboarding Flow
```

### Workout Plans Data Flow
```
Database: workout_plans table
       ↓
useWorkoutPlans(userId) hook
  - fetches: supabase.from('workout_plans').select().eq('user_id', userId)
  - returns: { plans, loading, error, savePlans, savePlan, deletePlan }
       ↓
App.jsx state: plans object
       ↓
HomeView, PlansView, WorkoutView consume plans
```

### Workout Sessions Data Flow
```
User starts workout:
  1. handleSelectWorkout(workoutId) → shows WorkoutStartModal
  2. handleStartWorkout() → sets activeWorkoutId, activeLog={}, starts timer
  3. WorkoutView renders with plan.exercises
       ↓
During workout:
  - User logs sets → activeLog[exerciseName] = { sets: [...] }
  - ExerciseLogger component manages per-exercise state
       ↓
Finish workout:
  handleFinishWorkout() → saveWorkout() → supabase.from('workout_logs').insert()
       ↓
useWorkouts realtime subscription refreshes history
```

### Settings Data Flow
```
Database: user_settings table
       ↓
useSettings(userId) hook
  - returns: { settings, aiEnabled, apiKey, onboardingCompleted, saveSettings }
       ↓
App.jsx receives: { aiEnabled, apiKey } 
       ↓
Passed to: BuddyView, WorkoutView, AddPlanModal for AI features
```

---

## 4. AI Implementation Locations

### AI Service Layer
**File:** `src/services/ai.js` (349 lines)

| Function | Purpose | Used In |
|----------|---------|---------|
| `verifyApiKey(apiKey)` | Validate API key works | Settings, Onboarding |
| `makeAIRequest(apiKey, prompt)` | Core API call to Gemini | All AI functions |
| `getExerciseTip(apiKey, exerciseName, lastWeight, userName)` | Quick exercise tip | WorkoutView |
| `analyzeWorkoutPatterns(apiKey, workouts, userName)` | Pattern analysis report | BuddyView |
| `getMotivation(apiKey, streak, userName)` | Personalized motivation | BuddyView |
| `suggestWeight(apiKey, exerciseName, exerciseHistory, targetReps)` | Weight suggestion | WorkoutView |
| `generateWorkoutSummary(apiKey, workout, userName)` | Post-workout feedback | After workout |
| `generateWorkoutPlan(apiKey, options)` | Full AI plan generation | AddPlanModal, Onboarding |
| `getDetailedExerciseTips(apiKey, exerciseName, experienceLevel)` | Detailed form guide | ExerciseInfoModal |
| `getContextualTip(apiKey, context)` | Real-time coaching | WorkoutView |
| `analyzeExercisePerformance(apiKey, exerciseName, recentSets, targetRange)` | Set analysis | WorkoutView |

### AI Integration Points

| Component | AI Features | How Called |
|-----------|-------------|------------|
| **BuddyView** | Insights, motivation, tips, chat | Direct `makeAIRequest()` in component |
| **WorkoutView** (App.jsx) | Exercise tips on demand | `handleRequestTip()` → `getExerciseTip()` |
| **AddPlanModal** | AI plan generation | `handleGeneratePlan()` → direct API call |
| **RoutineCreation** | AI plan generation in onboarding | Similar to AddPlanModal |
| **ExerciseInfoModal** | Detailed tips | `getDetailedExerciseTips()` |

### AI Configuration
- **API Key Storage:** `user_settings.google_api_key` (encrypted at rest by Supabase)
- **Enabled Flag:** `user_settings.ai_enabled` (boolean)
- **Model:** `gemini-2.0-flash` via REST API
- **API URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

---

## 5. Hooks Summary

| Hook | File | Purpose | Returns |
|------|------|---------|---------|
| `useAuth` | `src/hooks/useAuth.js` | Supabase auth state | user, signIn*, signOut, deleteAccount |
| `useProfile` | `src/hooks/useProfile.js` | User profile CRUD | profile, saveProfile, loading |
| `useSettings` | `src/hooks/useSettings.js` | AI config, preferences | settings, aiEnabled, apiKey, saveSettings |
| `useWorkoutPlans` | `src/hooks/useWorkoutPlans.js` | Workout routines CRUD | plans, savePlans, deletePlan, loading, error |
| `useWorkouts` | `src/hooks/useWorkouts.js` | Workout history | workouts, history, streak, saveWorkout |
| `useTimer` | `src/hooks/useTimer.js` | Workout/rest timers | time, isRunning, start, stop, reset |
| `useNetworkStatus` | `src/hooks/useNetworkStatus.js` | Online/offline detection | isOnline, wasOffline |

---

## 6. Component Library (UI Primitives)

| Component | File | Description |
|-----------|------|-------------|
| `Card` | `src/components/ui/Card.jsx` | Dark glass effect container |
| `Button` | `src/components/ui/Button.jsx` | Primary, secondary, ghost, danger variants |
| `Input` | `src/components/ui/Input.jsx` | Form inputs with dark styling |
| `Modal` | `src/components/ui/Modal.jsx` | Dialog wrapper with backdrop |
| `Toast` | `src/components/ui/Toast.jsx` | Notification toasts |
| `Skeleton` | `src/components/ui/Skeleton.jsx` | Loading placeholders |
| `ErrorBoundary` | `src/components/ui/ErrorBoundary.jsx` | React error boundary |

---

## 7. Database Schema Overview

> Full schema in `supabase-schema.sql`

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | User info | display_name, dob, experience_level, height, weight |
| `user_settings` | Preferences | ai_enabled, google_api_key, onboarding_completed |
| `workout_plans` | Routines | plan_id, name, exercises (JSONB), source, sort_order |
| `workout_logs` | History | workout_type, workout_name, exercises (JSONB), duration, note |

---

## 8. File Structure Summary

```
src/
├── main.jsx                          # App entry
├── App.jsx                           # Main component (1149 lines)
│   ├── HomeView (inline)
│   ├── WorkoutView (inline)
│   └── SettingsView (inline)
├── index.css                         # Tailwind + theme
├── components/
│   ├── views/
│   │   ├── BuddyView.jsx             # AI coaching screen
│   │   └── PlansView.jsx             # Plans management
│   ├── workout/
│   │   ├── WorkoutStartModal.jsx     # Slide-to-start
│   │   ├── ExerciseLogger.jsx        # Set logging
│   │   ├── ExerciseInfoModal.jsx     # Form tips modal
│   │   ├── WorkoutCard.jsx           # Routine preview card
│   │   ├── RestTimer.jsx             # Rest countdown
│   │   └── ProgressBar.jsx           # Visual progress
│   ├── plans/
│   │   └── AddPlanModal.jsx          # Add new routine
│   ├── onboarding/                   # 4-step onboarding
│   ├── profile/
│   │   └── EditProfileModal.jsx      # Profile editing
│   ├── ui/                           # Reusable primitives
│   └── layout/
│       └── Navigation.jsx            # Bottom nav, view header
├── hooks/                            # Data hooks (7 files)
├── services/
│   ├── supabase.js                   # Supabase client
│   └── ai.js                         # Gemini AI service
├── constants/
│   └── defaults.js                   # Default templates
└── utils/
    ├── sanitize.js                   # Input sanitization
    └── logger.js                     # Dev-only logging
```

---

## 9. Navigation State Machine

```
App.jsx manages: view = 'home' | 'plans' | 'buddy' | 'workout' | 'settings'

home ←→ plans ←→ buddy (via BottomNavigation)
  ↓
home/plans → workout (via WorkoutStartModal → slide confirm)
  ↓
workout → home (via back/finish, with unsaved warning)

settings → triggered from profile icon or navigation
```

---

## 10. Key Patterns

### Data Fetching Pattern
```javascript
// All hooks follow this pattern
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  if (!userId) return;
  const fetch = async () => {
    try {
      const { data, error } = await supabase.from('table').select().eq('user_id', userId);
      if (error) throw error;
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, [userId]);
```

### AI Request Pattern
```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  }
);
const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
```

### Theme Pattern
```jsx
// Backgrounds: bg-gray-950, bg-gray-900, bg-gray-800
// Text: text-gray-100, text-gray-400, text-gray-500
// Accent: text-emerald-500, bg-emerald-500, border-emerald-500
// Danger: text-red-500, bg-red-500
// Glass effect: bg-gray-900/80 backdrop-blur-xl border border-gray-800
```

---

*This document serves as the foundation for improvements in Sections 2-9.*

---

## Section Updates Log

### Section 2: Home Screen Improvements
- Added `src/utils/workoutRecommendation.js` - Smart workout selection logic
- Enhanced `HomeView` with contextual hints and recommendation labels
- Updated `WorkoutCard.jsx` to show exercise count and duration

### Section 3: AI Buddy Screen Improvements
- Added `src/utils/aiContext.js` - Rich user context for AI prompts
- Refactored `BuddyView.jsx` with `buildUserContextForAI()` and enhanced prompts
- Added error handling with fallback data for AI failures

### Section 4: Plans/Workout Routines Improvements
- Added `src/components/plans/EditPlanModal.jsx` - Full plan editing capabilities:
  - Rename workout plans
  - Add/remove exercises
  - Reorder exercises (move up/down)
  - Delete plan from modal
- Updated `PlansView.jsx` stats to show unique exercise count across all plans
- Wired up `onEditPlan` callback in `App.jsx` to open EditPlanModal

### Section 5: AI Workout Generation Improvements
- Added `src/utils/aiWorkoutGenerator.js` - Enhanced AI workout generation:
  - `buildWorkoutGenerationPrompt()` - Creates personalized prompts with user context
  - `generateWorkoutPlan()` - Full generation with validation and error handling
  - `validateGeneratedPlan()` - Validates and cleans AI response JSON
  - `calculatePlanIntensity()` - Calculates intensity score (Low/Moderate/High/Very High)
  - `getFocusRecommendations()` - Focus-specific guidance (strength, hypertrophy, etc.)
- Updated `AddPlanModal.jsx`:
  - Now uses enhanced prompt with user workout history and patterns
  - Added Equipment selector (Full Gym, Minimal, Bodyweight)
  - Shows intensity level for each generated day
  - Shows compound/isolation exercise breakdown
  - Displays focus recommendations and program description
  - Better error display with AlertCircle icon
- Updated `App.jsx` to pass additional props to AddPlanModal:
  - profile, workouts, plans, streak for personalization

### Section 6: Routine Preview & Start Workout Flow
- Enhanced `WorkoutStartModal.jsx`:
  - Dynamic intensity calculation using `calculatePlanIntensity()` utility
  - Color-coded intensity badge (blue=Low, green=Moderate, amber=High, red=Very High)
  - Added "last performed" date display (e.g., "Yesterday", "3 days ago")
  - Block start when routine has no exercises with warning message
  - Stats row and exercise preview only show when routine is valid
- Existing workout flow already fully functional:
  - Slide-to-start gesture with haptic feedback
  - WorkoutView with exercise logger, rest timer, progress tracking
  - Save workout on completion with duration tracking

### Section 7: Settings & AI Configuration
- Created `src/utils/aiConfig.js` - Centralized AI configuration module:
  - `getAiClientConfig()` - Returns API key, model, enabled status, request helpers
  - `checkAiAvailability()` - Checks if AI can be used with reason codes
  - `getAiStatusMessage()` - User-friendly status messages for UI
  - `buildUserProfileString()` - Consistent user description for prompts
- Updated `BuddyView.jsx`:
  - Now uses centralized `checkAiAvailability()` for all AI checks
  - Uses `getAiClientConfig()` for API requests
  - Enhanced disabled state UI with specific reason messages
  - Shows basic stats (streak, workouts, level) even when AI disabled
- Updated `AddPlanModal.jsx`:
  - Uses `checkAiAvailability()` to validate before generation
  - Consistent error messaging for invalid API key
- Profile already editable via EditProfileModal with persistence
- API key validation already shows success/error messages in Settings

### Section 8: History & Analytics Hooks
- Created `src/utils/workoutStats.js` - Centralized stats helper module:
  - `getCurrentStreak(sessions)` - Calculate workout streak with proper date handling
  - `getTotalWorkouts(sessions)` - Simple count of all workouts
  - `getAverageSessionDuration(sessions)` - Average duration in minutes
  - `getRecentFocusDistribution(sessions, limit)` - Upper/Lower/Full/Other distribution
  - `getWorkoutsThisWeek(sessions)` - Current week workout count
  - `getWorkoutsThisMonth(sessions)` - Current month workout count
  - `getMostWorkedFocus(sessions)` - Most common focus area
  - `getPersonalRecords(sessions)` - PR tracking by exercise
  - `getWorkoutSummary(sessions)` - All stats in one object
- Updated `useWorkouts.js`:
  - Now imports and uses `getCurrentStreak` from workoutStats.js
  - Removed duplicate `calculateStreak` function
- Updated `BuddyView.jsx`:
  - Uses `getWorkoutSummary()` for all stats calculations
  - Enhanced quick stats display: 4 columns (Streak, Total, This Week, Avg Min)
  - Disabled state shows enhanced stats with focus distribution
- History view already shows sessions from routines (workout_logs table)

### Section 9: Quality, Tests & Documentation
- Added testing infrastructure:
  - Installed Vitest, @testing-library/react, @testing-library/jest-dom, jsdom
  - Added `test` and `test:run` npm scripts
- Created test files (67 tests total, all passing):
  - `src/utils/workoutStats.test.js` (28 tests)
    - Tests for getCurrentStreak, getTotalWorkouts, getAverageSessionDuration
    - Tests for getRecentFocusDistribution, getWorkoutsThisWeek/Month
    - Tests for getMostWorkedFocus, getWorkoutSummary
  - `src/utils/workoutRecommendation.test.js` (23 tests)
    - Tests for getRecommendedWorkout with various scenarios
    - Tests for categorizePlan, hasWorkedOutToday, getDaysSinceLastWorkout
    - Tests for getNextActionHint, getRecommendationReason
  - `src/utils/aiWorkoutGenerator.test.js` (16 tests)
    - Tests for calculatePlanIntensity
    - Tests for validateGeneratedPlan with valid/invalid inputs
    - Tests for buildWorkoutGenerationPrompt
- Created `docs/ai-features.md` documentation:
  - AI feature overview (Buddy, Plan Generation, Pro Tips)
  - Configuration guide (env vars, in-app settings)
  - Prompt structures and expected JSON outputs
  - Error handling and fallback strategies
  - Security considerations
  - File structure reference
- Navigation and theme unchanged as requested

---

## Summary: All 9 Sections Complete

The improvement plan has been fully implemented:

1. ✅ **Section 1**: Codebase Discovery - architecture-notes.md created
2. ✅ **Section 2**: Home Screen Improvements - recommendations, labels, contextual hints
3. ✅ **Section 3**: AI Buddy Screen - centralized context, enhanced insights
4. ✅ **Section 4**: Plans/Workout Routines - edit modal, dynamic stats
5. ✅ **Section 5**: AI Workout Generation - enhanced prompts, validation, user personalization
6. ✅ **Section 6**: Routine Preview & Start - intensity, last workout, no-exercises warning
7. ✅ **Section 7**: Settings & AI Configuration - centralized aiConfig module
8. ✅ **Section 8**: History & Analytics - workoutStats module with reusable helpers
9. ✅ **Section 9**: Quality, Tests & Documentation - 67 tests, ai-features.md

Key new files created:
- `src/utils/workoutRecommendation.js` - Smart workout recommendations
- `src/utils/aiContext.js` - AI context building
- `src/utils/aiWorkoutGenerator.js` - Enhanced AI workout generation
- `src/utils/aiConfig.js` - Centralized AI configuration
- `src/utils/workoutStats.js` - Reusable stats helpers
- `src/components/plans/EditPlanModal.jsx` - Edit plan component
- `docs/ai-features.md` - AI features documentation
- Test files for all utility modules
