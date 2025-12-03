/**
 * AI Service - Google Gemini Integration
 * Provides personalized coaching at every level of the workout experience
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Verify API key is valid by making a simple test request
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function verifyApiKey(apiKey) {
  if (!apiKey) {
    return { valid: false, error: 'No API key provided' };
  }

  if (!apiKey.startsWith('AIza') || apiKey.length < 20) {
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "OK" in one word.' }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || 'API key verification failed';
      
      if (response.status === 400) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 403) {
        return { valid: false, error: 'API key not authorized. Enable Gemini API in Google Cloud.' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded. Try again later.' };
      }
      
      return { valid: false, error: errorMessage };
    }

    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return { valid: true };
    }
    
    return { valid: false, error: 'Unexpected API response' };
  } catch (error) {
    return { valid: false, error: 'Network error. Check your connection.' };
  }
}

/**
 * Core AI request handler
 */
async function makeAIRequest(apiKey, prompt) {
  if (!apiKey) {
    throw new Error('No API key provided');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error('AI request failed');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

/**
 * Get a quick form tip for an exercise
 */
export async function getExerciseTip(apiKey, exerciseName, lastWeight, userName = 'User') {
  const prompt = `You are a concise gym coach. User: ${userName}. Exercise: ${exerciseName}. Previous weight: ${lastWeight ? `${lastWeight}kg` : 'First time'}. Give ONE short, actionable form cue. Max 12 words. No fluff.`;
  
  try {
    const tip = await makeAIRequest(apiKey, prompt);
    return tip || getDefaultTip(exerciseName);
  } catch {
    return getDefaultTip(exerciseName);
  }
}

/**
 * Analyze workout patterns and provide insights
 */
export async function analyzeWorkoutPatterns(apiKey, workoutHistory, userName = 'User') {
  if (!workoutHistory || workoutHistory.length < 3) {
    return {
      insight: "Keep logging workouts to unlock AI pattern analysis!",
      suggestion: "Consistency is key - aim for 3+ sessions per week."
    };
  }

  const recentWorkouts = workoutHistory.slice(0, 10);
  const summary = recentWorkouts.map(w => 
    `${w.workoutName} on ${new Date(w.timestamp).toLocaleDateString()}`
  ).join(', ');

  const prompt = `Analyze this workout history for ${userName}: ${summary}. 
  Provide: 1) One key pattern observation (positive or area to improve), 2) One specific suggestion.
  Format as JSON: {"insight": "...", "suggestion": "..."}. Be encouraging but honest. Max 30 words each.`;

  try {
    const response = await makeAIRequest(apiKey, prompt);
    return JSON.parse(response);
  } catch {
    return {
      insight: "You're building consistency! That's the foundation of progress.",
      suggestion: "Focus on progressive overload - small weight increases each week."
    };
  }
}

/**
 * Get motivational message based on context
 */
export async function getMotivation(apiKey, context) {
  const { streak, lastWorkout, currentMood, userName = 'User' } = context;
  
  const prompt = `Generate a short motivational message for ${userName}. 
  Context: ${streak} day streak, last workout was ${lastWorkout || 'a while ago'}, feeling ${currentMood || 'ready'}.
  Be genuine, not cheesy. Max 15 words. Make it personal and energizing.`;

  try {
    return await makeAIRequest(apiKey, prompt);
  } catch {
    return streak > 3 
      ? `${streak} days strong! Keep that momentum going 💪`
      : "Every rep counts. Let's make today matter.";
  }
}

/**
 * Suggest weight for next set based on history
 */
export async function suggestWeight(apiKey, exerciseName, exerciseHistory, targetReps) {
  if (!exerciseHistory || exerciseHistory.length === 0) {
    return null; // No suggestion for first time
  }

  const lastSession = exerciseHistory[0];
  const prompt = `Exercise: ${exerciseName}. Last session: ${lastSession.weight}kg x ${lastSession.reps} reps. Target: ${targetReps} reps.
  Suggest weight for today (number only, in kg). Consider: if they hit target reps last time, suggest small increase. If they struggled, suggest same or slightly less.`;

  try {
    const suggestion = await makeAIRequest(apiKey, prompt);
    const weight = parseFloat(suggestion);
    return isNaN(weight) ? lastSession.weight : weight;
  } catch {
    return lastSession.weight;
  }
}

/**
 * Generate post-workout summary and feedback
 */
export async function generateWorkoutSummary(apiKey, workout, userName = 'User') {
  const exerciseSummary = workout.exercises.map(ex => 
    `${ex.name}: ${ex.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}`
  ).join('; ');

  const prompt = `${userName} just finished: ${workout.workoutName}. Duration: ${Math.round(workout.duration / 60)} min.
  Exercises: ${exerciseSummary}.
  Give brief, encouraging feedback (2 sentences max). Highlight one win and one focus for next time.`;

  try {
    return await makeAIRequest(apiKey, prompt);
  } catch {
    return "Great session! Consistency builds champions. 💪";
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(key) {
  if (!key || key.length < 20) {
    return { valid: false, error: 'API key is too short' };
  }
  if (!key.startsWith('AIza')) {
    return { valid: false, error: 'Invalid API key format. Google AI keys start with "AIza"' };
  }
  return { valid: true };
}

/**
 * Default tips when AI is unavailable
 */
function getDefaultTip(exerciseName) {
  const tips = {
    'Incline Dumbbell Press': 'Control the negative. Pause at the bottom.',
    'Flat Dumbbell Press': 'Retract your scapula. Drive through elbows.',
    'Cable Lateral Raise': 'Lead with your elbow, not your hand.',
    'Lat Pulldown': 'Pull elbows down to your hips.',
    'Face Pulls': 'External rotation at the top. Squeeze.',
    'default': 'Control the eccentric. Mind-muscle connection.'
  };
  return tips[exerciseName] || tips.default;
}

/**
 * Generate a personalized workout plan with detailed exercise info
 */
export async function generateWorkoutPlan(apiKey, options) {
  const { daysPerWeek, focus, duration, equipment, experienceLevel, userName = 'User' } = options;

  const prompt = `Create a ${daysPerWeek}-day workout plan for ${userName}, a ${experienceLevel} lifter.

Requirements:
- Focus: ${focus}
- Session duration: ${duration} minutes
- Equipment: ${equipment}

Return ONLY valid JSON (no markdown) with this structure:
{
  "plans": {
    "day1": {
      "id": "day1",
      "name": "Day Name",
      "next": "day2",
      "estTime": "${duration} min",
      "desc": "Brief description of day's focus",
      "dayTip": "One motivational/strategic tip for this workout day",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "range": "8-12",
          "muscleGroup": "Primary muscle",
          "tips": {
            "form": "2-3 sentences on proper form execution",
            "cues": ["Quick cue 1", "Quick cue 2"],
            "mistakes": ["Common mistake 1", "Common mistake 2"],
            "goal": "What this exercise achieves and why it's in the program",
            "progression": "How to progress when this becomes easy"
          }
        }
      ]
    }
  },
  "programTip": "Overall tip for the entire program"
}

Guidelines:
- Create ${daysPerWeek} days (day1, day2, etc). Last day's "next" points to "day1"
- 4-6 exercises per day for ${experienceLevel} level
- Include compound movements first, isolation later
- Form tips should be specific and actionable
- Mistakes should be what ${experienceLevel}s commonly do wrong
- Goals should explain the "why" behind each exercise
- Make progression tips appropriate for ${experienceLevel} level`;

  try {
    const response = await makeAIRequest(apiKey, prompt);
    // Clean up response
    const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error generating workout plan:', error);
    throw error;
  }
}

/**
 * Get detailed tips for a specific exercise
 */
export async function getDetailedExerciseTips(apiKey, exerciseName, experienceLevel = 'intermediate') {
  const prompt = `For the exercise "${exerciseName}" for a ${experienceLevel} lifter, provide detailed coaching.

Return ONLY valid JSON:
{
  "form": "3-4 sentences on proper form with specific body positioning",
  "cues": ["Quick cue 1", "Quick cue 2", "Quick cue 3"],
  "mistakes": ["Common mistake 1 and how to fix it", "Common mistake 2 and how to fix it"],
  "goal": "What this exercise develops and why it matters",
  "progression": "How to make it harder when ready",
  "alternatives": ["Alternative exercise 1", "Alternative exercise 2"]
}

Be specific, actionable, and appropriate for ${experienceLevel} level.`;

  try {
    const response = await makeAIRequest(apiKey, prompt);
    const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error getting exercise tips:', error);
    return null;
  }
}

/**
 * Get a contextual tip based on current workout state
 */
export async function getContextualTip(apiKey, context) {
  const { exerciseName, setNumber, totalSets, lastSetPerformance, targetReps, userName = 'User' } = context;
  
  const prompt = `${userName} is doing ${exerciseName}, set ${setNumber} of ${totalSets}. Target: ${targetReps} reps.
${lastSetPerformance ? `Last set: ${lastSetPerformance.weight}kg × ${lastSetPerformance.reps} reps.` : 'First set.'}

Give ONE specific, actionable coaching cue for THIS set. Max 15 words. Be encouraging but technical.`;

  try {
    return await makeAIRequest(apiKey, prompt);
  } catch {
    return getDefaultTip(exerciseName);
  }
}

/**
 * Analyze exercise performance and suggest improvements
 */
export async function analyzeExercisePerformance(apiKey, exerciseName, recentSets, targetRange) {
  if (!recentSets || recentSets.length < 2) {
    return null;
  }

  const setsData = recentSets.map((s, i) => `Set ${i + 1}: ${s.weight}kg × ${s.reps}`).join(', ');
  
  const prompt = `Analyze this ${exerciseName} performance: ${setsData}. Target range: ${targetRange}.

Return JSON with:
{
  "assessment": "Brief assessment of the sets (1 sentence)",
  "suggestion": "What to do for next workout (1 sentence)",
  "adjustWeight": true/false,
  "weightChange": number (positive for increase, negative for decrease, 0 for same)
}`;

  try {
    const response = await makeAIRequest(apiKey, prompt);
    const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch {
    return null;
  }
}
