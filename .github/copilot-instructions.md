# Workout Log - Copilot Instructions

## Architecture & Core Patterns
- **Mobile-First React**: UI designed for touch (min 44px targets), safe areas, and bottom navigation.
- **Lazy Loading**: Views (`src/components/views/`) and heavy modals are lazy-loaded via `Suspense` in `App.jsx`.
- **Offline-First**: `useOfflineQueue` manages a `localStorage` queue (`workout-offline-queue`) for workouts when offline. `useNetworkStatus` tracks connectivity.
- **Data Flow**: UI -> Custom Hooks -> Supabase Client -> DB.
- **AI Integration**: Direct calls to Google Gemini API (`services/ai.js`) for coaching and tips. No external AI SDKs.

## Project Structure
- `src/components/views/`: Main page content (Home, Workout, History, etc.).
- `src/components/ui/`: Reusable primitives (`Card`, `Button`, `Input`). **Always use `Card` for containers.**
- `src/hooks/`: Business logic and state management.
- `src/services/`: External API clients (Supabase, AI).
- `src/utils/`: Pure functions (formatters, validators, loggers).

## Key Conventions
- **Styling**: Tailwind CSS with a dark theme (gray-950/900/800) and Emerald-500 accents.
- **Icons**: Use `lucide-react` for all icons.
- **Logging**: Use `createLogger` from `utils/logger.js` instead of `console.log`.
  ```javascript
  const log = createLogger('ComponentName');
  log.log('Message');
  ```
- **Supabase**: Always use RLS. Client configured in `services/supabase.js` with PKCE flow.
- **AI Prompts**: Located in `services/ai.js`. Ensure prompts return JSON when structured data is needed.

## Critical Workflows
- **Offline Sync**: Workouts saved while offline are queued. The app attempts to sync when `navigator.onLine` becomes true.
- **Onboarding**: 4-step flow (`src/components/onboarding/`) sets up profile and initial routine.
- **Workout Logic**: `useWorkouts` handles active workout state. `ExerciseLogger` manages set data.

## Development
- **Env Vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` required.
- **Commands**: `npm run dev` (Vite), `npm run build`.
