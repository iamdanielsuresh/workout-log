# AI Buddy Enhancement Plan

## Phase 1: Immediate Refinements (Completed)
- [x] **Remove Mentor Persona**: Simplified the choices to Buddy, Drill Sgt, and Prof. Lift.
- [x] **Lock UI Interaction**: Prevented switching personas while AI is generating content to avoid state mismatches.
- [x] **Improve Visibility**: Redesigned the "Get Motivation" button to be a prominent, full-width action button.
- [x] **Verify Logic**: Confirmed that `generateMotivation` explicitly uses `coachPersona` to tailor the output.

## Phase 2: Deepening the Persona Experience
To make the personas feel like distinct characters rather than just text prompts:

1.  **Visual Themes**:
    *   **Buddy**: Keep current Emerald/Green theme (Growth, Friendly).
    *   **Drill Sgt**: Switch to Amber/Orange accents (Intensity, Warning).
    *   **Prof. Lift**: Switch to Blue/Indigo accents (Science, Trust).
    *   *Implementation*: Add a `themeColor` property to the `PERSONAS` config and use it to dynamically style the `ViewHeader`, `Card` borders, and buttons.

2.  **Distinct "Voices" & Formatting**:
    *   **Drill Sgt**: Use ALL CAPS for emphasis, shorter sentences, bullet points for orders.
    *   **Prof. Lift**: Use structured data, maybe even simple ASCII charts or "Formula: X + Y = Z" formatting.
    *   *Implementation*: Refine the system prompts in `aiContext.js` to enforce these formatting rules strictly.

3.  **Proactive Check-ins (Mock Notification)**:
    *   Show a "New Message" badge on the persona icon if the user hasn't logged a workout in 3 days.
    *   *Drill Sgt*: "Where have you been, recruit?"
    *   *Buddy*: "Missed you at the gym!"

## Phase 3: Advanced Intelligence (Gemini 3.0 Integration) (Completed)
Leverage the "Thinking Model" for high-value, complex tasks without incurring constant costs.

- [x] **Feature: "The War Room" (Drill Sgt) / "Lab Analysis" (Prof. Lift)**
    *   **Concept**: A dedicated "Deep Dive" mode separate from the daily chat.
    *   **Use Cases**:
        *   "Why have I plateaued on Bench Press for 3 months?"
        *   "Build me a 12-week plan to prepare for a marathon + lifting."
        *   "Analyze my injury history and suggest a rehab-safe split."
    *   **Cost Control**:
        *   Limited to 1 use per week (or token-based).
        *   Explicit "Start Deep Analysis" button that warns "This may take a minute...".
    *   **Implementation**:
        *   New API endpoint/service function specifically for the stronger model.
        *   Passes *entire* workout history (not just summary).
        *   Returns a structured Markdown report rather than a chat message.

## Phase 4: Chat Interface Overhaul ("Ask Your Coach") (Completed)
The current chat box feels isolated. We will integrate it seamlessly.

- [x] **UI Redesign**:
    *   **Remove the "Box"**: Instead of a contained card, make the chat feel like a native messaging app view or a floating drawer.
    *   **Floating Action Button (FAB)**: A persistent chat bubble in the bottom right of the Buddy View. Tapping it expands the chat overlay.
    *   **Avatar Headers**: The chat window should have the Persona's avatar and status ("Online", "Reviewing your logs...").

- [x] **Contextual "Chips" (Quick Actions)**:
    *   Instead of static "Quick Prompts", generate chips based on recent data.
    *   *If workout just finished*: "Analyze my session", "Rate my intensity".
    *   *If inactive*: "Give me a 15min home workout".
    *   *Implementation*: A simple heuristic function `getSuggestedPrompts(lastWorkout, streak)` that returns relevant chips.

- [ ] **Rich Responses**:
    *   Allow the AI to return "Widgets" in the chat, not just text.
    *   *Example*: User asks "Show my progress", AI returns a mini-chart component rendered inside the chat bubble.

## Approval Request
Please review this plan. If approved, I recommend starting with **Phase 2 (Visual Themes)** to immediately make the personas feel more distinct.
