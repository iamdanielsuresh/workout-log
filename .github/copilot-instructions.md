# Workout Log - Copilot Instructions

## Architecture & Core Patterns
- **Mobile-First React**: UI designed for touch (min 44px targets), safe areas (`safe-area-top`, `safe-area-bottom`), and bottom navigation.
- **State Management**: Decentralized state via Custom Hooks (`useWorkouts`, `useProfile`, etc.) syncing with Supabase. No global store (Redux/Zustand).
- **Offline-First**: `useOfflineQueue` manages a `localStorage` queue (`workout-offline-queue`) for workouts. `useNetworkStatus` tracks connectivity.
- **Lazy Loading**: Route-based code splitting using `lazy` and `Suspense` in `App.jsx`.
- **AI Integration**: Direct Google Gemini API calls via `services/ai.js`. Context built via `utils/aiContext.js`.

## Project Structure
- `src/components/views/`: Lazy-loaded page content.
- `src/components/ui/`: Reusable primitives (`Card`, `Button`, `Input`). **Always use `Card` for content containers.**
- `src/components/layout/`: Layout components. `Navigation.jsx` exports `BottomNavigation` and `ViewHeader`.
- `src/hooks/`: Business logic and state synchronization.
- `src/services/`: External API clients (Supabase, AI).
- `src/utils/`: Pure functions, formatters, and AI context builders.
- `supabase-schema.sql`: **Single source of truth** for the database schema.

## Key Conventions
- **Styling**: Tailwind CSS with a dark theme (`gray-950` background, `emerald-500` primary). Use `font-display` for headings.
- **Icons**: Use `lucide-react` for all icons.
- **Logging**: Use `createLogger` from `utils/logger.js` instead of `console.log`.
  ```javascript
  const log = createLogger('ComponentName');
  log.log('Message');
  ```
- **Navigation**: 
  - Main tabs: Home, Workout, History, Plans.
  - Sub-views: Must use `ViewHeader` from `components/layout/Navigation` with `onBack`.
- **Supabase**: Always use RLS. Client configured in `services/supabase.js` with PKCE flow.
- **AI Prompts**: Located in `services/ai.js`. Ensure prompts return JSON when structured data is needed.

## Critical Workflows
- **Offline Sync**: Workouts saved while offline are queued and synced when online.
- **Onboarding**: 4-step flow. Profile step allows scrolling; other steps are locked unless content overflows.
- **Workout Logic**: `useWorkouts` handles active workout state. `ExerciseLogger` manages set data.
- **Plans & Folders**: Managed via `useWorkoutPlans`.

## Development
- **Env Vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` required.
- **Deployment**: Hosted as a static site on Digital Ocean.
- **Commands**: 
  - `npm run dev` (Vite)
  - `npm run build`
  - `npm run test` (Vitest)
