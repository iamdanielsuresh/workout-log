# One Click Routine Creation Plan

## Objective
Enable users to instantly generate and save a workout routine based on their current state (e.g., "feeling sick", "short on time") with a single click from the AI chat interface.

## Core Features

1.  **Context-Aware Generation**:
    *   The AI must analyze the user's request (e.g., "light workout") AND their recent history (e.g., "leg day yesterday") to create a safe, effective session.
    *   It should output a `WorkoutPlanWidget` (already implemented).

2.  **One-Click Save**:
    *   The widget already has a "Save to Plans" button.
    *   **Enhancement**: When saved, it should optionally ask if the user wants to *start* it immediately.

3.  **Proactive Suggestions (Homescreen Integration)**:
    *   If the user hasn't worked out in 3 days, the Home Screen should show a "Quick Start" card.
    *   This card triggers the AI to generate a "Get Back on Track" routine.

## Implementation Steps

### Phase 1: AI Logic Refinement (Backend/Prompting) (Completed)
- [x] **Update `generateSingleDayPlan`**: Ensure it can handle "mood" or "energy level" inputs explicitly.
- [x] **Refine Widget Prompt**: Ensure the AI *always* uses the widget format when a plan is requested, not just text.

### Phase 2: UI Enhancements (Completed)
- [x] **"Start Now" Option**: Update `WorkoutPlanWidget` to have two buttons: "Save" and "Start Now".
- [x] **Homescreen "Quick Action"**:
    - Add a `QuickRoutineCard` to `HomeView.jsx`.
    - It should have chips like "⏱️ 15 Min", "🤕 Recovery", "💪 Full Body".
    - Clicking a chip sends a hidden prompt to the AI and opens the Chat Overlay with the result.

### Phase 3: Folder Organization (Completed)
- [x] **Auto-Categorization**: When saving a plan from AI, allow it to be tagged (e.g., "Recovery", "HIIT").
- [x] **"AI Generated" Folder**: Automatically group these plans in a specific folder in the Plans view.

## User Flow Example
1.  User opens app, sees "Quick Actions" on Home.
2.  User taps "🤕 Recovery" (feeling sore).
3.  AI Chat opens, thinking...
4.  AI returns a `WorkoutPlanWidget`: "Active Recovery Session" (Stretching + Light Cardio).
5.  User taps "Start Now".
6.  Workout begins immediately.
