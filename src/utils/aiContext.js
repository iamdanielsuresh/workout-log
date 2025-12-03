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
  const lines = [
    `User: ${context.userName} (${context.experienceLevel} level)`,
    `Stats: ${context.totalWorkouts} total workouts, ${context.currentStreak}-day streak`,
    `Recent activity: ${context.last7DaysWorkouts} workouts in last 7 days (avg ${context.weeklyAverage}/week)`,
    `Typical session: ${context.avgSessionDuration} minutes, ${context.avgExercisesPerSession} exercises`
  ];
  
  // Add locale-aware time context (Task 1)
  if (context.localTime && context.localDate) {
    lines.push(`Current time: ${context.localTime} on ${context.dayOfWeek} (${context.localDate})`);
  } else {
    lines.push(`Time: ${context.dayOfWeek} ${context.timeOfDay}`);
  }
  
  if (context.recentExercises.length > 0) {
    lines.push(`Recent exercises: ${context.recentExercises.slice(0, 6).join(', ')}`);
  }
  
  // Add extended health context (Task 6)
  if (context.goals) {
    lines.push(`Goals: ${context.goals}`);
  }
  
  if (context.injuries) {
    lines.push(`Injuries/Limitations: ${context.injuries}`);
  }
  
  if (context.activityLevel) {
    const activityLabels = {
      sedentary: 'Sedentary',
      light: 'Lightly Active',
      moderate: 'Moderately Active',
      active: 'Active',
      very_active: 'Very Active'
    };
    lines.push(`Activity Level: ${activityLabels[context.activityLevel] || context.activityLevel}`);
  }
  
  if (context.height || context.weight) {
    const metrics = [];
    if (context.height) metrics.push(`${context.height}cm`);
    if (context.weight) metrics.push(`${context.weight}kg`);
    if (context.bodyFat) metrics.push(`${context.bodyFat}% BF`);
    lines.push(`Body Metrics: ${metrics.join(', ')}`);
  }
  
  // Add Strength Trends
  const trendKeys = Object.keys(context.strengthTrends || {});
  if (trendKeys.length > 0) {
    const topTrends = trendKeys
      .sort((a, b) => context.strengthTrends[b].current1RM - context.strengthTrends[a].current1RM)
      .slice(0, 3)
      .map(name => {
        const t = context.strengthTrends[name];
        const sign = t.improvement > 0 ? '+' : '';
        return `${name} 1RM: ${t.current1RM}kg (${sign}${t.improvement}%)`;
      });
    lines.push(`Strength Trends: ${topTrends.join(', ')}`);
  }

  // Add PRs
  const prKeys = Object.keys(context.prs || {});
  if (prKeys.length > 0) {
    const recentPRs = prKeys
      .filter(k => {
        const date = new Date(context.prs[k].date);
        const daysAgo = (Date.now() - date) / (1000 * 60 * 60 * 24);
        return daysAgo < 30; // Only show PRs from last 30 days
      })
      .slice(0, 3)
      .map(k => `${context.prs[k].name} (${context.prs[k].weight}kg)`);
      
    if (recentPRs.length > 0) {
      lines.push(`Recent PRs: ${recentPRs.join(', ')}`);
    }
  }
  
  if (context.muscleGroupDistribution && Object.keys(context.muscleGroupDistribution).length > 0) {
    const topGroups = Object.entries(context.muscleGroupDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([group, count]) => `${group} (${count})`);
    lines.push(`Most worked: ${topGroups.join(', ')}`);
  }
  
  if (context.weakAreas.length > 0 && context.weakAreas[0] !== 'Maintaining good balance!') {
    lines.push(`Areas to improve: ${context.weakAreas[0]}`);
  }
  
  if (context.lastWorkout) {
    lines.push(`Last workout: ${context.lastWorkout.name} (${context.lastWorkout.daysAgo} days ago)`);
  }
  
  return lines.join('\n');
}

/**
 * Generate an enhanced motivation prompt with full context
 * @param {Object} context - User context
 * @returns {string} AI prompt for motivation
 */
export function buildMotivationPrompt(context) {
  const contextStr = formatContextForPrompt(context);
  
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
  
  return `You're a supportive, knowledgeable gym buddy AI. Generate a short motivational message (1-2 sentences, max 30 words).

User Context:
${contextStr}

It's ${context.dayOfWeek} ${context.timeOfDay}.
${situationalContext}

Be personal, specific to their situation, energizing but not cheesy. Reference something specific from their data.`;
}

/**
 * Generate an enhanced insights prompt with full context
 * @param {Object} context - User context
 * @returns {string} AI prompt for insights
 */
export function buildInsightsPrompt(context) {
  const contextStr = formatContextForPrompt(context);
  
  return `You're an analytical fitness coach AI. Analyze this user's workout data and provide personalized insights.

User Context:
${contextStr}

Provide analysis in JSON format:
{
  "summary": "One sentence overall assessment of their current fitness journey (positive tone, specific to their data)",
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
 * @returns {string} AI prompt for pro tips
 */
export function buildTipsPrompt(context) {
  const contextStr = formatContextForPrompt(context);
  
  return `You're a knowledgeable fitness coach AI. Generate 3 personalized tips for this user.

User Context:
${contextStr}

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
