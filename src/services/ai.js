/**
 * AI Service - Google Gemini Integration
 * Provides personalized coaching at every level of the workout experience
 */

import { getApiUrl, getAiClientConfig } from '../utils/aiConfig';

const GEMINI_API_URL = getApiUrl();

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
export async function makeAIRequest(apiKey, prompt) {
  if (!apiKey) {
    throw new Error('No API key provided');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `AI request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

/**
 * Find an alternative exercise
 */
export async function findAlternativeExercise(apiKey, exercise, experienceLevel, equipment, specialNotes) {
  const prompt = `Suggest ONE alternative exercise to replace "${exercise.name}" that targets the same muscle group (${exercise.muscleGroup || 'similar muscles'}).

Requirements:
- Equipment: ${equipment === 'full' ? 'Full gym' : equipment === 'minimal' ? 'Minimal equipment' : 'Bodyweight'}
- Experience level: ${experienceLevel}
${specialNotes ? `- User notes: ${specialNotes}` : ''}

Return ONLY valid JSON (no markdown):
{
  "name": "Alternative Exercise Name",
  "sets": ${exercise.sets},
  "range": "${exercise.range}",
  "muscleGroup": "${exercise.muscleGroup || 'Primary muscle'}",
  "tip": "Quick form tip",
  "tips": {
    "form": "Detailed form instructions",
    "cues": ["Cue 1", "Cue 2"],
    "mistakes": ["Common mistake"],
    "goal": "What this achieves",
    "progression": "How to progress"
  },
  "reason": "Brief reason why this is a good alternative"
}`;

  try {
    const response = await makeAIRequest(apiKey, prompt);
    const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error finding alternative:', error);
    throw error;
  }
}

/**
 * Generate a single day workout plan from a prompt
 */
export async function generateSingleDayPlan(apiKey, userPrompt, profile, context = {}) {
  const { mood, energyLevel, timeAvailable } = context;
  
  const systemPrompt = `You are an expert fitness coach. Generate a single-day workout plan based on the user's request.

User Request: "${userPrompt}"
${profile?.experience_level ? `Experience Level: ${profile.experience_level}` : ''}
${profile?.injuries ? `Injuries/Limitations: ${profile.injuries}` : ''}
${mood ? `User Mood: ${mood}` : ''}
${energyLevel ? `Energy Level: ${energyLevel}` : ''}
${timeAvailable ? `Time Available: ${timeAvailable} min` : ''}

Return ONLY valid JSON with this exact structure:
{
  "name": "Workout Name",
  "description": "Brief description of the workout",
  "estimatedTime": "25 min",
  "difficulty": "intermediate",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": "8-12",
      "rest": "60s",
      "muscleGroup": "Primary Muscle",
      "notes": "Quick form tip"
    }
  ],
  "warmup": "Brief warmup suggestion",
  "cooldown": "Brief cooldown suggestion"
}

Guidelines:
- Include 4-6 exercises appropriate for the request
- Provide realistic time estimates
- Include rest periods between sets
- Make exercises progressively harder
- Match difficulty to user's experience level if provided`;

  try {
    const response = await makeAIRequest(apiKey, systemPrompt);
    const cleanedText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error generating single day plan:', error);
    throw error;
  }
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
 * Suggest weight for next set based on history and trends
 */
export async function suggestWeight(apiKey, exerciseName, exerciseHistory, targetReps, userStats = null) {
  if (!exerciseHistory || exerciseHistory.length === 0) {
    return null; // No suggestion for first time
  }

  const lastSession = exerciseHistory[0];
  
  // Add trend context if available
  let trendContext = '';
  if (userStats?.strengthTrends?.[exerciseName.toLowerCase()]) {
    const trend = userStats.strengthTrends[exerciseName.toLowerCase()];
    trendContext = `Trend: 1RM has changed by ${trend.improvement}% recently. Current est 1RM: ${trend.current1RM}kg.`;
  }

  const prompt = `
  Act as an expert strength coach.
  Exercise: ${exerciseName}
  Last session: ${lastSession.weight}kg x ${lastSession.reps} reps
  Target for today: ${targetReps} reps
  ${trendContext}
  
  Task: Suggest a working weight for today (in kg).
  Logic:
  - If they exceeded target reps last time or trend is positive -> Progressive Overload (+2.5-5kg)
  - If they met target -> Small increase or same weight with better form
  - If they missed target -> Same weight or slight deload
  
  Return ONLY the number (e.g. "60" or "62.5"). No text.`;

  try {
    const suggestion = await makeAIRequest(apiKey, prompt);
    const weight = parseFloat(suggestion);
    return isNaN(weight) ? lastSession.weight : weight;
  } catch {
    return lastSession.weight;
  }
}

/**
 * Generate detailed post-workout analysis
 */
export async function analyzeWorkoutSession(apiKey, workout, userStats = null) {
  const exerciseSummary = workout.exercises.map(ex => 
    `${ex.name}: ${ex.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}`
  ).join('; ');

  // Add PR context if available
  let prContext = '';
  if (userStats?.prs) {
    const newPRs = workout.exercises.filter(ex => {
      const name = ex.name.toLowerCase();
      const currentMax = Math.max(...ex.sets.map(s => s.weight * s.reps)); // Volume PR approximation
      const oldPR = userStats.prs[name];
      return oldPR && currentMax > oldPR.volume;
    }).map(ex => ex.name);
    
    if (newPRs.length > 0) {
      prContext = `User hit potential new PRs on: ${newPRs.join(', ')}!`;
    }
  }

  const prompt = `
  Analyze this workout:
  User: ${userStats?.userName || 'Athlete'} (${userStats?.experienceLevel || 'Intermediate'})
  Workout: ${workout.workoutName} (${Math.round(workout.duration / 60)} min)
  Exercises: ${exerciseSummary}
  ${prContext}

  Provide a JSON response with:
  1. "summary": 1 sentence overview
  2. "highlight": The best part of the session (specific exercise or effort)
  3. "tip": One specific technical or recovery tip for next time
  4. "rating": Score 1-10 based on volume/intensity
  
  Format: {"summary": "...", "highlight": "...", "tip": "...", "rating": 8}`;

  try {
    const response = await makeAIRequest(apiKey, prompt);
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return {
      summary: "Great session! You put in the work today.",
      highlight: "Consistency is your superpower.",
      tip: "Make sure to hydrate and get some protein.",
      rating: 8
    };
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

/**
 * Generate a deep analysis report ("The War Room" / "Lab Analysis")
 */
export async function generateDeepAnalysis(apiKey, history, persona, userProfile) {
  const { name, role, tone, style } = persona;
  
  // Construct a rich history summary
  const historySummary = history.slice(0, 20).map(w => 
    `- ${new Date(w.timestamp).toLocaleDateString()}: ${w.workoutName} (${w.exercises.length} exercises)`
  ).join('\n');

  const prompt = `
  IDENTITY: You are ${name}, a ${role}. Your tone is ${tone}.
  STYLE GUIDE: ${style}
  
  TASK: Perform a DEEP DIVE ANALYSIS on the user's workout history. This is a high-level strategic review.
  
  USER PROFILE:
  - Experience: ${userProfile.experience_level}
  - Goals: ${userProfile.goals?.join(', ') || 'General Fitness'}
  - Injuries: ${userProfile.injuries || 'None'}
  
  RECENT HISTORY (Last 20 sessions):
  ${historySummary}
  
  INSTRUCTIONS:
  1. Analyze consistency and volume trends.
  2. Identify potential plateaus or overtraining risks.
  3. Suggest a specific focus for the next 4 weeks.
  4. If the user has injuries, check if their history aligns with rehab protocols.
  
  OUTPUT FORMAT:
  Return a Markdown formatted report. Use headers (##), bullet points, and bold text.
  
  Structure:
  ## 🚨 SITUATION REPORT (or LAB FINDINGS)
  [Executive summary of current status]
  
  ## 📉 TREND ANALYSIS
  [Detailed breakdown of consistency and intensity]
  
  ## 🎯 STRATEGIC DIRECTIVES
  [3-4 specific actionable items for the next month]
  
  ## 🔮 PROJECTED OUTCOME
  [What will happen if they follow this advice]
  
  Make it immersive and strictly adhere to your persona's voice.
  `;

  try {
    return await makeAIRequest(apiKey, prompt);
  } catch (error) {
    console.error('Deep Analysis failed:', error);
    throw error;
  }
}
