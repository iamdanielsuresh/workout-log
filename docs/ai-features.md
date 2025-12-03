# AI Features Documentation

This document describes the AI-powered features in the Workout Log application, including configuration, usage, and implementation details.

## Overview

The Workout Log app integrates Google's Gemini AI (gemini-2.0-flash model) to provide personalized coaching features. AI is used in three main areas:

1. **AI Buddy** - Interactive coaching with insights, motivation, and tips
2. **Workout Plan Generation** - Creating personalized workout routines
3. **Pro Tips** - Context-aware exercise tips during workouts

## Configuration

### Environment Variables

AI features require a Google AI (Gemini) API key. Configure this in your `.env` file:

```bash
# Not required for basic app functionality
# Only needed for AI features
GOOGLE_AI_API_KEY=your_api_key_here
```

Users can also configure their API key directly in the app's Settings screen.

### In-App Configuration

1. Navigate to **Settings** tab
2. Toggle "Enable AI Features" to ON
3. Enter your Google AI API key
4. The app will validate the key and show success/error status

### AI Configuration Module

The centralized AI configuration is in `src/utils/aiConfig.js`:

```javascript
import { 
  checkAiAvailability, 
  getAiClientConfig,
  getAiStatusMessage 
} from '../utils/aiConfig';

// Check if AI can be used
const availability = checkAiAvailability({ aiEnabled, apiKey });
// Returns: { available: boolean, reason: string, reasonCode: string }

// Get API configuration
const config = getAiClientConfig({ aiEnabled, apiKey });
// Returns: { apiKey, model, enabled, apiUrl, getRequestBody() }
```

## AI Features

### 1. AI Buddy Screen (`BuddyView.jsx`)

The AI Buddy provides personalized coaching through:

#### Insights Generation
- Analyzes workout history and patterns
- Provides summary, strengths, areas to improve, and next goals
- Uses `buildInsightsPrompt()` from `aiContext.js`

**Prompt Structure:**
```javascript
{
  userContext: { profile, stats, patterns, recentWorkouts },
  request: "Provide insights in JSON format",
  outputFormat: {
    summary: "Brief workout overview",
    strength: "What user is doing well",
    improvement: "Area to focus on",
    nextGoal: "Specific actionable goal"
  }
}
```

#### Daily Motivation
- Generates personalized motivational messages
- Considers streak, recent workouts, and user profile
- Uses `buildMotivationPrompt()` from `aiContext.js`

#### Pro Tips
- Context-aware fitness tips (form, nutrition, recovery, mindset)
- Tailored to user's experience level and patterns
- Uses `buildTipsPrompt()` from `aiContext.js`

**Tips Output Format:**
```json
[
  {
    "title": "Tip Title",
    "tip": "Detailed tip content",
    "icon": "form|nutrition|recovery|mindset"
  }
]
```

#### Interactive Chat
- Free-form questions about fitness
- Responses consider user's workout history and profile
- Under 60 words for concise answers

### 2. Workout Plan Generation (`AddPlanModal.jsx`)

AI can generate complete workout plans based on:
- Training days per week (2-6)
- Focus area (balanced, strength, hypertrophy, endurance)
- Session duration (30, 45-60, 60-90 minutes)
- Available equipment (full gym, minimal, bodyweight)
- User's profile and workout history

**Generation Module:** `src/utils/aiWorkoutGenerator.js`

Key functions:
- `buildWorkoutGenerationPrompt()` - Creates the AI prompt
- `validateGeneratedPlan()` - Validates and cleans AI response
- `calculatePlanIntensity()` - Analyzes workout intensity

**Expected AI Response Format:**
```json
{
  "plans": {
    "day1": {
      "id": "day1",
      "name": "Push Day",
      "next": "day2",
      "estTime": "45-60 min",
      "desc": "Chest, shoulders, and triceps",
      "focus": "hypertrophy",
      "dayTip": "Start with compound movements",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "range": "8-12",
          "restPeriod": "90 sec",
          "muscleGroup": "Chest",
          "tip": "Keep shoulder blades retracted",
          "tips": {
            "form": "Detailed form instructions",
            "cues": ["Mental cue 1", "Mental cue 2"],
            "mistakes": ["Common mistake"],
            "goal": "Target muscle engagement",
            "progression": "How to increase difficulty"
          }
        }
      ]
    }
  },
  "programName": "PPL Hypertrophy",
  "programDescription": "Push/Pull/Legs split for muscle growth",
  "weeklyVolume": "45-60 sets"
}
```

**Validation:**
- Checks for required `plans` object
- Validates each day has name and exercises
- Fills in missing defaults (sets: 3, range: "8-12", etc.)
- Links days together (day1 → day2 → day3 → day1)

### 3. Exercise Tips During Workouts

During active workouts, AI provides:
- Form tips for current exercise
- Encouragement based on progress
- Weight/rep suggestions based on history

## AI Context Building

User context for AI prompts is built in `src/utils/aiContext.js`:

```javascript
import { buildUserContextForAI } from '../utils/aiContext';

const userContext = buildUserContextForAI({ 
  profile,    // User profile data
  workouts,   // Workout history array
  streak,     // Current streak
  plans       // Available workout plans
});

// Returns:
{
  profile: { name, age, experienceLevel, ... },
  stats: { totalWorkouts, streak, last7DaysWorkouts, avgSessionDuration },
  patterns: { favoriteExercises, muscleGroupDistribution, avgExercisesPerWorkout },
  recentWorkouts: [ /* last 5 workouts */ ],
  weakAreas: [ /* identified weak areas */ ]
}
```

## Error Handling

### API Errors
- Invalid API key → Prompt user to check settings
- Rate limiting → Fallback to cached/default content
- Network errors → Show retry option

### Fallback Content
All AI features have fallback content when AI is unavailable:
- Insights: Generic stats-based insights
- Motivation: Contextual encouragement based on streak/history
- Tips: Standard fitness tips

### Validation
- All AI JSON responses are validated before use
- Invalid responses trigger fallbacks
- `validateGeneratedPlan()` cleans and normalizes workout plans

## Testing

Tests for AI utilities are in:
- `src/utils/aiWorkoutGenerator.test.js` - Plan generation & validation
- `src/utils/workoutRecommendation.test.js` - Recommendation logic
- `src/utils/workoutStats.test.js` - Stats calculations

Run tests:
```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

## Security Considerations

1. **API Key Storage**: Keys are stored in Supabase `user_settings` table with RLS
2. **Client-Side Calls**: API calls are made from client; key is not exposed in source
3. **No Sensitive Data**: Only workout-related data is sent to AI
4. **User Control**: AI features can be disabled in settings

## Model Information

- **Provider**: Google AI (Gemini)
- **Model**: `gemini-2.0-flash`
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Max Tokens**: Configured per request (1024-2048 typical)
- **Temperature**: 0.7 (balanced creativity/consistency)

## File Structure

```
src/
├── utils/
│   ├── aiConfig.js          # Centralized AI configuration
│   ├── aiContext.js         # User context building for prompts
│   ├── aiWorkoutGenerator.js # Workout plan generation
│   └── workoutRecommendation.js # Smart workout recommendations
├── components/
│   ├── views/
│   │   └── BuddyView.jsx    # AI Buddy interface
│   └── plans/
│       └── AddPlanModal.jsx  # AI workout generation UI
└── hooks/
    └── useSettings.js        # AI settings management
```
