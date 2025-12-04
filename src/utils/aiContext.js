/**
 * AI Context Builder - Creates structured user data for AI prompts
 * 
 * Builds comprehensive workout context to enable more personalized,
 * data-driven AI responses in the Buddy view.
 */

import { categorizePlan } from './workoutRecommendation';
import { 
  getWeeklyVolume, 
  analyzeStrengthTrends, 
  getPersonalRecords 
} from './workoutStats';
import { getDateTimeContext } from './localeFormatters';

export const PERSONAS = {
  supportive: {
    name: 'Buddy',
    role: 'supportive, knowledgeable gym buddy',
    tone: 'encouraging, practical, friendly',
    style: 'Reference their data positively. Be like a good friend.',
    themeColor: 'emerald'
  },
  sergeant: {
    name: 'Drill Sgt',
    role: 'tough, no-nonsense drill sergeant',
    tone: 'strict, demanding, intense',
    style: 'Use tough love, demand discipline, no excuses. Use military slang occasionally. Use ALL CAPS for emphasis. Keep sentences short and punchy.',
    themeColor: 'amber'
  },
  scientist: {
    name: 'Prof. Lift',
    role: 'sports scientist',
    tone: 'precise, analytical, academic',
    style: 'Focus on biomechanics, physiology, and data. Cite principles of hypertrophy/strength. Use structured formatting.',
    themeColor: 'blue'
  }
};

/**
 * Calculate workout frequency for a given time period
 * @param {Array} workouts - Workout history array
 * @param {number} days - Number of days to analyze
 * @returns {number} Number of workouts in the period
 */
function getWorkoutFrequency(workouts, days) {
  if (!workouts || workouts.length === 0) return 0;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return workouts.filter(w => {
    const workoutDate = new Date(w.timestamp);
    return workoutDate >= cutoffDate;
  }).length;
}

/**
 * Analyze workout patterns from history
 * @param {Array} workouts - Workout history
 * @returns {Object} Pattern analysis
 */
function analyzeWorkoutPatterns(workouts) {
  if (!workouts || workouts.length === 0) {
    return {
      totalSets: 0,
      avgExercisesPerWorkout: 0,
      avgDurationMins: 0,
      muscleGroupDistribution: {},
      recentExercises: [],
      mostFrequentExercises: []
    };
  }
  
  let totalSets = 0;
  let totalDuration = 0;
  const muscleGroups = {};
  const exerciseFrequency = {};
  const recentExercises = [];
  
  workouts.forEach((workout, index) => {
    // Track duration
    totalDuration += workout.duration || 0;
    
    // Analyze exercises
    workout.exercises?.forEach(ex => {
      // Count sets
      totalSets += ex.sets?.length || ex.sets || 0;
      
      // Track exercise frequency
      const exName = ex.name?.toLowerCase() || '';
      exerciseFrequency[exName] = (exerciseFrequency[exName] || 0) + 1;
      
      // Track recent exercises (last 3 workouts)
      if (index < 3 && ex.name && !recentExercises.includes(ex.name)) {
        recentExercises.push(ex.name);
      }
      
      // Categorize by muscle group
      const group = categorizeExercise(exName);
      muscleGroups[group] = (muscleGroups[group] || 0) + 1;
    });
  });
  
  // Calculate averages
  const avgExercisesPerWorkout = workouts.reduce(
    (sum, w) => sum + (w.exercises?.length || 0), 0
  ) / workouts.length;
  
  const avgDurationMins = Math.round((totalDuration / workouts.length) / 60);
  
  // Get most frequent exercises
  const mostFrequentExercises = Object.entries(exerciseFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
  
  return {
    totalSets,
    avgExercisesPerWorkout: Math.round(avgExercisesPerWorkout * 10) / 10,
    avgDurationMins,
    muscleGroupDistribution: muscleGroups,
    recentExercises: recentExercises.slice(0, 10),
    mostFrequentExercises
  };
}

/**
 * Categorize an exercise by primary muscle group
 * @param {string} exerciseName - Name of the exercise
 * @returns {string} Muscle group category
 */
function categorizeExercise(exerciseName) {
  const name = exerciseName.toLowerCase();
  
  // Chest exercises
  if (name.includes('bench') || name.includes('chest') || name.includes('push-up') || 
      name.includes('pushup') || name.includes('fly') || name.includes('pec')) {
    return 'chest';
  }
  
  // Back exercises
  if (name.includes('row') || name.includes('pull') || name.includes('lat') || 
      name.includes('deadlift') || name.includes('back')) {
    return 'back';
  }
  
  // Shoulder exercises
  if (name.includes('shoulder') || name.includes('delt') || name.includes('press') ||
      name.includes('lateral raise') || name.includes('face pull')) {
    return 'shoulders';
  }
  
  // Leg exercises
  if (name.includes('squat') || name.includes('leg') || name.includes('lunge') ||
      name.includes('calf') || name.includes('ham') || name.includes('quad') ||
      name.includes('glute')) {
    return 'legs';
  }
  
  // Arm exercises
  if (name.includes('curl') || name.includes('bicep') || name.includes('tricep') ||
      name.includes('extension') || name.includes('dip')) {
    return 'arms';
  }
  
  // Core exercises
  if (name.includes('ab') || name.includes('core') || name.includes('plank') ||
      name.includes('crunch') || name.includes('sit-up')) {
    return 'core';
  }
  
  return 'other';
}

/**
 * Identify potential weak areas based on workout history
 * @param {Object} muscleDistribution - Muscle group workout counts
 * @param {Array} workouts - Recent workouts
 * @returns {Array} Array of weak areas with reasons
 */
function identifyWeakAreas(muscleDistribution, workouts) {
  const weakAreas = [];
  const total = Object.values(muscleDistribution).reduce((a, b) => a + b, 0);
  
  if (total === 0) return ['No workout data yet'];
  
  // Check for underworked muscle groups
  const expectedGroups = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];
  expectedGroups.forEach(group => {
    const percentage = ((muscleDistribution[group] || 0) / total) * 100;
    if (percentage < 10 && total >= 10) {
      weakAreas.push(`${group} training is underrepresented (${Math.round(percentage)}%)`);
    }
  });
  
  // Check for short workouts
  if (workouts.length >= 3) {
    const avgDuration = workouts.slice(0, 5).reduce((sum, w) => sum + (w.duration || 0), 0) 
      / Math.min(workouts.length, 5);
    if (avgDuration > 0 && avgDuration < 25 * 60) { // Less than 25 minutes
      weakAreas.push('Sessions tend to be short - consider adding 1-2 more exercises');
    }
  }
  
  // Check for consistency
  const last7Days = getWorkoutFrequency(workouts, 7);
  if (workouts.length >= 7 && last7Days < 2) {
    weakAreas.push('Workout frequency has dropped recently');
  }
  
  return weakAreas.length > 0 ? weakAreas : ['Maintaining good balance!'];
}

/**
 * Build comprehensive user context for AI prompts
 * 
 * @param {Object} options
 * @param {Object} options.profile - User profile data
 * @param {Array} options.workouts - Workout history
 * @param {number} options.streak - Current streak
 * @param {Object} options.plans - User's workout plans
 * @returns {Object} Structured context for AI
 */
export function buildUserContextForAI({ profile, workouts = [], streak = 0, plans = {} }) {
  const patterns = analyzeWorkoutPatterns(workouts);
  const weakAreas = identifyWeakAreas(patterns.muscleGroupDistribution, workouts);
  
  // Advanced Analytics
  const weeklyVolume = getWeeklyVolume(workouts);
  const strengthTrends = analyzeStrengthTrends(workouts);
  const prs = getPersonalRecords(workouts);
  
  // Get locale-aware date/time context
  const dateTimeContext = getDateTimeContext({
    timezone: profile?.timezone,
    country: profile?.country
  });
  
  // Workout frequency analysis
  const last7Days = getWorkoutFrequency(workouts, 7);
  const last30Days = getWorkoutFrequency(workouts, 30);
  
  // Plan analysis
  const plansList = Object.values(plans);
  const aiGeneratedPlans = plansList.filter(p => p.source === 'ai-generated').length;
  
  return {
    // User info
    userName: profile?.display_name || 'User',
    experienceLevel: profile?.experience_level || 'intermediate',
    
    // Locale info (Task 1)
    country: profile?.country || null,
    timezone: profile?.timezone || null,
    
    // Time context (locale-aware)
    timeOfDay: dateTimeContext.timeOfDay,
    dayOfWeek: dateTimeContext.dayOfWeek,
    localTime: dateTimeContext.localTime,
    localDate: dateTimeContext.localDate,
    
    // Extended health metrics (Task 6)
    goals: profile?.goals || null,
    trainingAge: profile?.training_age || null,
    injuries: profile?.injuries || null,
    activityLevel: profile?.activity_level || null,
    height: profile?.height || null,
    weight: profile?.weight || null,
    bodyFat: profile?.body_fat || null,
    
    // Workout stats
    totalWorkouts: workouts.length,
    currentStreak: streak,
    last7DaysWorkouts: last7Days,
    last30DaysWorkouts: last30Days,
    weeklyAverage: Math.round((last30Days / 4) * 10) / 10,
    
    // Workout patterns
    avgSessionDuration: patterns.avgDurationMins,
    avgExercisesPerSession: patterns.avgExercisesPerWorkout,
    recentExercises: patterns.recentExercises,
    mostFrequentExercises: patterns.mostFrequentExercises,
    
    // Muscle focus
    muscleGroupDistribution: patterns.muscleGroupDistribution,
    mostFrequentMuscles: Object.entries(patterns.muscleGroupDistribution || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([muscle]) => muscle),
    weeklyVolume,
    
    // Performance
    strengthTrends,
    prs,
    
    // Areas for improvement
    weakAreas,
    
    // Plans
    totalPlans: plansList.length,
    aiGeneratedPlans,
    
    // Last workout info
    lastWorkout: workouts[0] ? {
      name: workouts[0].workoutName,
      exercises: workouts[0].exercises?.length || 0,
      durationMins: Math.round((workouts[0].duration || 0) / 60),
      daysAgo: Math.floor((Date.now() - new Date(workouts[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
    } : null
  };
}

/**
 * Format context as a concise string for AI prompt inclusion
 * @param {Object} context - Context from buildUserContextForAI
 * @returns {string} Formatted context string
 */
export function formatContextForPrompt(context) {
  const { 
    streak, 
    lastWorkout, 
    workoutsThisWeek, 
    avgSessionDuration,
    mostFrequentMuscles,
    recentPRs
  } = context;

  return `
    Streak: ${streak} days
    Last Workout: ${lastWorkout ? `${lastWorkout.workoutName} (${new Date(lastWorkout.timestamp).toLocaleDateString()})` : 'None'}
    Workouts this week: ${workoutsThisWeek}
    Avg Duration: ${avgSessionDuration} min
    Focus: ${mostFrequentMuscles?.join(', ') || 'None'}
    Recent PRs: ${recentPRs?.length > 0 ? recentPRs.map(pr => `${pr.exercise} (${pr.weight}kg)`).join(', ') : 'None'}
    
    CAPABILITIES:
    1. You can generate workout plans. If the user asks for a routine OR mentions their mood/energy (e.g., "I'm tired", "feeling energetic", "need a quick pump"), return a JSON widget block:
    \`\`\`json
    {
      "type": "workout-plan",
      "data": {
        "name": "Workout Name",
        "duration": "45",
        "difficulty": "Intermediate",
        "reason": "Why this fits your mood/energy",
        "exercises": [
          {"name": "Exercise", "sets": 3, "reps": "10"}
        ]
      }
    }
    \`\`\`
    
    2. You can show stats. If asked for progress/stats, return:
    \`\`\`json
    {
      "type": "stats",
      "data": {
        "title": "Weekly Progress",
        "metrics": [
          {"label": "Volume", "value": "12,500kg"},
          {"label": "Workouts", "value": "4"}
        ]
      }
    }
    \`\`\`
  `;
}

/**
 * Build prompt for daily motivation
 * @param {Object} context - User context
 * @param {string} persona - AI persona key
 * @returns {string} AI prompt for motivation
 */
export function buildMotivationPrompt(context, persona = 'supportive') {
  const contextStr = formatContextForPrompt(context);
  const p = PERSONAS[persona] || PERSONAS.supportive;
  
  let situationalContext = '';
  
  // Add situational awareness
  if (context.currentStreak >= 7) {
    situationalContext = `They're on an impressive ${context.currentStreak}-day streak - acknowledge this achievement!`;
  } else if (context.currentStreak === 0 && context.lastWorkout?.daysAgo > 2) {
    situationalContext = `They haven't worked out in ${context.lastWorkout.daysAgo} days - be encouraging without being pushy.`;
  } else if (context.last7DaysWorkouts >= 5) {
    situationalContext = `They've been crushing it with ${context.last7DaysWorkouts} workouts this week!`;
  } else if (context.totalWorkouts === 0) {
    situationalContext = `This is a new user - welcome them and encourage them to start.`;
  }
  
  return `You're a ${p.role} AI. Generate a short motivational message (1-2 sentences, max 30 words).

User Context:
${contextStr}

It's ${context.dayOfWeek} ${context.timeOfDay}.
${situationalContext}

Tone: ${p.tone}
Style: ${p.style}
Be personal, specific to their situation, energizing but not cheesy. Reference something specific from their data.`;
}

/**
 * Generate an enhanced insights prompt with full context
 * @param {Object} context - User context
 * @param {string} persona - AI persona key
 * @returns {string} AI prompt for insights
 */
export function buildInsightsPrompt(context, persona = 'supportive') {
  const contextStr = formatContextForPrompt(context);
  const p = PERSONAS[persona] || PERSONAS.supportive;
  
  return `You're a ${p.role} AI. Analyze this user's workout data and provide personalized insights.

User Context:
${contextStr}

Tone: ${p.tone}
Style: ${p.style}

Provide analysis in JSON format:
{
  "summary": "One sentence overall assessment of their current fitness journey (in your persona's voice)",
  "strength": "One thing they're consistently doing well based on the data (be specific)",
  "improvement": "One specific, actionable area to improve (reference actual data patterns)",
  "nextGoal": "A specific, measurable short-term goal they can achieve in 1-2 weeks"
}

Rules:
- Each field should be under 25 words
- Be specific - reference actual numbers from their data
- The improvement should be actionable and realistic
- The goal should be measurable and achievable
- If they're new (< 3 workouts), focus on building consistency`;
}

/**
 * Generate an enhanced tips prompt with full context
 * @param {Object} context - User context
 * @param {string} persona - AI persona key
 * @returns {string} AI prompt for pro tips
 */
export function buildTipsPrompt(context, persona = 'supportive') {
  const contextStr = formatContextForPrompt(context);
  const p = PERSONAS[persona] || PERSONAS.supportive;
  
  return `You're a ${p.role} AI. Generate 3 personalized tips for this user.

User Context:
${contextStr}

Tone: ${p.tone}
Style: ${p.style}

Generate tips in JSON array format:
[
  {"title": "Short catchy title (3-5 words)", "tip": "Actionable advice under 15 words", "icon": "form|nutrition|recovery|mindset"}
]

Rules:
- Make tips relevant to their recent exercises and patterns
- For ${context.experienceLevel} level lifters
- Include a mix of training, recovery, or nutrition tips
- Be specific and actionable, not generic
- If they've been training frequently, include a recovery tip
- If sessions are short, include an efficiency tip`;
}

/**
 * Get suggested chat prompts based on user context
 * @param {Object} context - User context (streak, lastWorkout, etc)
 * @returns {Array<string>} List of suggested prompts
 */
export function getSuggestedPrompts(context) {
  const { streak, lastWorkout, timeSinceLastWorkout } = context;
  const prompts = [];

  // Time-based suggestions
  if (timeSinceLastWorkout < 2) { // Less than 2 hours ago
    prompts.push("Analyze my last session");
    prompts.push("How was my volume?");
    prompts.push("Rate my intensity");
  } else if (timeSinceLastWorkout > 72) { // More than 3 days
    prompts.push("Give me a 15min home workout");
    prompts.push("Motivation to get back");
    prompts.push("Why am I unmotivated?");
  } else {
    prompts.push("Suggest a workout for today");
    prompts.push("How is my consistency?");
  }
  
  // Streak-based suggestions
  if (streak > 7) {
    prompts.push("How to maintain my streak?");
  } else if (streak === 0) {
    prompts.push("Help me start a habit");
  }

  // General knowledge
  prompts.push("Explain progressive overload");
  prompts.push("Best recovery tips");
  
  // Return random 4 from the list to keep it fresh
  return prompts.sort(() => 0.5 - Math.random()).slice(0, 4);
}
