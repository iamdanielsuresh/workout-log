/**
 * Workout Statistics Helper Module
 * 
 * Provides reusable functions for calculating workout statistics
 * Used by HomeView, BuddyView, and other components needing analytics
 */

/**
 * Calculate current workout streak (consecutive days)
 * @param {Array} sessions - Array of workout sessions with timestamp
 * @returns {number} Current streak count
 */
export function getCurrentStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  // Sort sessions by date descending (most recent first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at)
  );

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique workout dates
  const workoutDates = new Set();
  sortedSessions.forEach(session => {
    const date = new Date(session.timestamp || session.created_at);
    date.setHours(0, 0, 0, 0);
    workoutDates.add(date.getTime());
  });

  const uniqueDates = Array.from(workoutDates).sort((a, b) => b - a);

  for (let i = 0; i < uniqueDates.length; i++) {
    const sessionDate = new Date(uniqueDates[i]);
    const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));

    // Allow for today (0) or yesterday (1) to continue streak
    if (daysDiff <= currentStreak + 1) {
      currentStreak = daysDiff === currentStreak ? currentStreak : currentStreak + 1;
    } else {
      break;
    }
  }

  // If worked out today, that counts as 1
  return currentStreak > 0 ? currentStreak : (uniqueDates.length > 0 && 
    Math.floor((today - new Date(uniqueDates[0])) / (1000 * 60 * 60 * 24)) <= 1 ? 1 : 0);
}

/**
 * Get total number of workouts
 * @param {Array} sessions - Array of workout sessions
 * @returns {number} Total workout count
 */
export function getTotalWorkouts(sessions) {
  if (!sessions || !Array.isArray(sessions)) return 0;
  return sessions.length;
}

/**
 * Calculate average session duration in minutes
 * @param {Array} sessions - Array of workout sessions with duration_minutes or start/end times
 * @returns {number} Average duration in minutes (rounded)
 */
export function getAverageSessionDuration(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const durationsInMinutes = sessions
    .map(session => {
      // Direct duration field
      if (session.duration_minutes) {
        return session.duration_minutes;
      }
      // Duration in seconds
      if (session.duration) {
        return Math.round(session.duration / 60);
      }
      // Calculate from start/end times
      if (session.started_at && session.completed_at) {
        const start = new Date(session.started_at);
        const end = new Date(session.completed_at);
        return Math.round((end - start) / (1000 * 60));
      }
      return null;
    })
    .filter(d => d !== null && d > 0);

  if (durationsInMinutes.length === 0) return 0;

  const total = durationsInMinutes.reduce((sum, d) => sum + d, 0);
  return Math.round(total / durationsInMinutes.length);
}

/**
 * Get distribution of workout focus areas from recent sessions
 * @param {Array} sessions - Array of workout sessions
 * @param {number} limit - Number of recent sessions to analyze (default: 10)
 * @returns {Object} Distribution object { Upper: count, Lower: count, Full: count, Other: count }
 */
export function getRecentFocusDistribution(sessions, limit = 10) {
  const distribution = {
    Upper: 0,
    Lower: 0,
    Full: 0,
    Other: 0
  };

  if (!sessions || sessions.length === 0) return distribution;

  // Sort by date descending and take recent ones
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at))
    .slice(0, limit);

  recentSessions.forEach(session => {
    const focus = determineFocus(session);
    if (distribution.hasOwnProperty(focus)) {
      distribution[focus]++;
    } else {
      distribution.Other++;
    }
  });

  return distribution;
}

/**
 * Determine the focus area of a workout session
 * @param {Object} session - Workout session object
 * @returns {string} Focus area: 'Upper', 'Lower', 'Full', or 'Other'
 */
function determineFocus(session) {
  // Check explicit focus field
  if (session.focus) {
    const focus = session.focus.toLowerCase();
    if (focus.includes('upper') || focus.includes('push') || focus.includes('pull')) return 'Upper';
    if (focus.includes('lower') || focus.includes('leg')) return 'Lower';
    if (focus.includes('full')) return 'Full';
  }

  // Check plan name
  if (session.plan_name) {
    const planName = session.plan_name.toLowerCase();
    if (planName.includes('upper') || planName.includes('push') || planName.includes('pull') || 
        planName.includes('chest') || planName.includes('back') || planName.includes('shoulder') ||
        planName.includes('arm')) return 'Upper';
    if (planName.includes('lower') || planName.includes('leg') || planName.includes('glute')) return 'Lower';
    if (planName.includes('full')) return 'Full';
  }

  // Analyze exercises if available
  if (session.exercises && Array.isArray(session.exercises) && session.exercises.length > 0) {
    const upperExercises = ['bench', 'press', 'row', 'pull', 'curl', 'tricep', 'shoulder', 'lat', 'fly', 'pushup'];
    const lowerExercises = ['squat', 'deadlift', 'lunge', 'leg', 'calf', 'glute', 'hip', 'hamstring', 'quad'];

    let upperCount = 0;
    let lowerCount = 0;

    session.exercises.forEach(ex => {
      const name = (ex.name || ex.exercise_name || '').toLowerCase();
      if (upperExercises.some(keyword => name.includes(keyword))) upperCount++;
      if (lowerExercises.some(keyword => name.includes(keyword))) lowerCount++;
    });

    const total = session.exercises.length;
    if (upperCount > total * 0.6) return 'Upper';
    if (lowerCount > total * 0.6) return 'Lower';
    if (upperCount > 0 && lowerCount > 0) return 'Full';
  }

  return 'Other';
}

/**
 * Get workouts this week
 * @param {Array} sessions - Array of workout sessions
 * @returns {number} Count of workouts in current week (Sunday-Saturday)
 */
export function getWorkoutsThisWeek(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  return sessions.filter(session => {
    const sessionDate = new Date(session.timestamp || session.created_at);
    return sessionDate >= startOfWeek;
  }).length;
}

/**
 * Get workouts this month
 * @param {Array} sessions - Array of workout sessions
 * @returns {number} Count of workouts in current month
 */
export function getWorkoutsThisMonth(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return sessions.filter(session => {
    const sessionDate = new Date(session.timestamp || session.created_at);
    return sessionDate >= startOfMonth;
  }).length;
}

/**
 * Get most worked muscle group/focus
 * @param {Array} sessions - Array of workout sessions
 * @returns {string|null} Most common focus area or null
 */
export function getMostWorkedFocus(sessions) {
  const distribution = getRecentFocusDistribution(sessions, sessions?.length || 0);
  
  let maxCount = 0;
  let maxFocus = null;

  Object.entries(distribution).forEach(([focus, count]) => {
    if (count > maxCount && focus !== 'Other') {
      maxCount = count;
      maxFocus = focus;
    }
  });

  return maxFocus;
}

/**
 * Calculate personal records for exercises
 * @param {Array} sessions - Array of workout sessions with exercises
 * @returns {Object} Map of exercise name to PR { weight, reps, date }
 */
export function getPersonalRecords(sessions) {
  const prs = {};

  if (!sessions) return prs;

  sessions.forEach(session => {
    if (!session.exercises) return;

    session.exercises.forEach(exercise => {
      const name = exercise.name || exercise.exercise_name;
      if (!name) return;

      const sets = exercise.sets || [];
      sets.forEach(set => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;

        if (weight > 0 && reps > 0) {
          const key = name.toLowerCase();
          const volume = weight * reps;

          if (!prs[key] || volume > (prs[key].weight * prs[key].reps)) {
            prs[key] = {
              name,
              weight,
              reps,
              volume,
              date: session.timestamp || session.created_at
            };
          }
        }
      });
    });
  });

  return prs;
}

/**
 * Calculate estimated One Rep Max (1RM) using Epley formula
 * @param {number} weight - Weight lifted
 * @param {number} reps - Reps performed
 * @returns {number} Estimated 1RM
 */
export function calculateOneRepMax(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  // Epley formula: 1RM = w * (1 + r/30)
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Calculate weekly volume (sets) per muscle group
 * @param {Array} sessions - Workout sessions
 * @returns {Object} Map of muscle group to weekly set count
 */
export function getWeeklyVolume(sessions) {
  if (!sessions || sessions.length === 0) return {};

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const volume = {};

  sessions.forEach(session => {
    const date = new Date(session.timestamp || session.created_at);
    if (date < oneWeekAgo) return;

    // If we have explicit muscle groups in the session data, use them
    // Otherwise infer from workout type/name (simplified)
    const type = session.workout_type || 'Other';
    
    // Count sets if available, otherwise assume 1 unit of volume per workout
    let sets = 0;
    if (session.exercises) {
      session.exercises.forEach(ex => {
        sets += Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 0);
      });
    } else {
      sets = 1; // Fallback
    }

    volume[type] = (volume[type] || 0) + sets;
  });

  return volume;
}

/**
 * Analyze strength trends for major compound movements
 * @param {Array} sessions - Workout sessions
 * @returns {Object} Trends for key exercises
 */
export function analyzeStrengthTrends(sessions) {
  if (!sessions || sessions.length < 2) return {};

  const trends = {};
  const history = {};

  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at)
  );

  sortedSessions.forEach(session => {
    if (!session.exercises) return;

    session.exercises.forEach(ex => {
      const name = (ex.name || ex.exercise_name || '').toLowerCase();
      if (!name) return;

      // Calculate max 1RM for this session
      let max1RM = 0;
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      sets.forEach(set => {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        const oneRM = calculateOneRepMax(w, r);
        if (oneRM > max1RM) max1RM = oneRM;
      });

      if (max1RM > 0) {
        if (!history[name]) history[name] = [];
        history[name].push({
          date: session.timestamp || session.created_at,
          oneRM: max1RM
        });
      }
    });
  });

  // Calculate trends (improvement over last 5 sessions)
  Object.keys(history).forEach(name => {
    const data = history[name];
    if (data.length >= 2) {
      const current = data[data.length - 1].oneRM;
      const previous = data[Math.max(0, data.length - 5)].oneRM;
      const percentChange = ((current - previous) / previous) * 100;
      
      trends[name] = {
        current1RM: current,
        improvement: Math.round(percentChange * 10) / 10,
        history: data.slice(-5) // Keep last 5 data points
      };
    }
  });

  return trends;
}

/**
 * Get summary statistics object
 * @param {Array} sessions - Array of workout sessions
 * @returns {Object} Summary with all key stats
 */
export function getWorkoutSummary(sessions) {
  return {
    totalWorkouts: getTotalWorkouts(sessions),
    currentStreak: getCurrentStreak(sessions),
    averageDuration: getAverageSessionDuration(sessions),
    workoutsThisWeek: getWorkoutsThisWeek(sessions),
    workoutsThisMonth: getWorkoutsThisMonth(sessions),
    focusDistribution: getRecentFocusDistribution(sessions),
    mostWorkedFocus: getMostWorkedFocus(sessions)
  };
}
